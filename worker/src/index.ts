import express from 'express';
import * as admin from 'firebase-admin';
import axios from 'axios';
import dotenv from 'dotenv';
import { analysisGraph } from './graph/analysisGraph';
import { generateDailyInsight } from './services/insightService';

dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'food-tracker-25902',
  });
}

const db = admin.firestore();

const analyzeMeal = async (mealId: string, imageUrl: string, userId: string, timestamp: string, description?: string) => {
  const timeContext = timestamp ? new Date(timestamp).toLocaleTimeString() : 'Unknown';
  
  let userContext = '';
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData?.dailyCalorieTarget) {
        userContext = `User's daily calorie target: ${Math.round(userData.dailyCalorieTarget)} kcal.`;
      }
    }
  } catch (error) {
    console.warn(`Could not fetch context for userId ${userId}:`, error);
  }

  try {
    const imgResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBase64 = Buffer.from(imgResponse.data).toString('base64');

    // 1. Run LangGraph Analysis
    const result = await analysisGraph.invoke({
      mealId,
      imageUrl,
      imageBase64,
      userId,
      timestamp,
      description,
      userContext,
      timeContext,
    });

    // 2. Initial Update
    await db.collection('meals').doc(mealId).update({
      analysis: result.finalAnalysis,
      status: 'completed',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 3. Generate and Update Global Insight
    try {
      const globalInsight = await generateDailyInsight(mealId, userId, db);
      await db.collection('meals').doc(mealId).update({
        "analysis.mentalHealth.advice": globalInsight
      });
      console.log(`Successfully generated global insight for meal ${mealId}`);
    } catch (insightError) {
      console.error("Failed to generate global insight:", insightError);
    }

    console.log(`Successfully analyzed meal ${mealId} using LangGraph`);
  } catch (error) {
    console.error(`Error analyzing meal ${mealId}:`, error);
    await db.collection('meals').doc(mealId).update({
      status: 'error',
      error: (error as Error).message,
    });
    throw error;
  }
};

const app = express();
app.use(express.json());

app.post('/', async (req, res) => {
  if (!req.body.message) return res.status(400).send('Bad Request');
  const data = req.body.message.data ? Buffer.from(req.body.message.data, 'base64').toString().trim() : null;
  if (!data) return res.status(400).send('No data');

  try {
    const { mealId, imageUrl, userId, timestamp, description } = JSON.parse(data);
    
    // Use a transaction to "claim" the meal and prevent race conditions
    const result = await db.runTransaction(async (transaction) => {
      const mealRef = db.collection('meals').doc(mealId);
      const mealDoc = await transaction.get(mealRef);

      if (!mealDoc.exists) {
        return { action: 'skip', reason: 'not_found' };
      }

      const status = mealDoc.data()?.status;
      
      // Only proceed if the status is exactly 'processing' (the initial state)
      // If it's already 'analyzing' or 'completed', another worker has it or finished it.
      if (status !== 'processing') {
        return { action: 'skip', reason: status };
      }

      // Claim it by moving it to 'analyzing'
      transaction.update(mealRef, { status: 'analyzing', claimedAt: admin.firestore.FieldValue.serverTimestamp() });
      return { action: 'proceed' };
    });

    if (result.action === 'skip') {
      console.log(`Skipping meal ${mealId} (Reason: ${result.reason})`);
      return res.status(204).send();
    }
    
    await analyzeMeal(mealId, imageUrl, userId, timestamp, description);
    res.status(204).send();
  } catch (err) {
    console.error('Error processing:', err);
    res.status(500).send(`Error: ${err}`);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Worker listening on ${PORT}`));
