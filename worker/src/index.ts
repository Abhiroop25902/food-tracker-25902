import express from 'express';
import * as admin from 'firebase-admin';
import { VertexAI } from '@google-cloud/vertexai';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'food-tracker-25902',
  });
}

const db = admin.firestore();

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: process.env.FIREBASE_PROJECT_ID || 'food-tracker-25902',
  location: 'us-central1'
});

const model = vertexAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
});

const app = express();
app.use(express.json());

const analyzeMeal = async (mealId: string, imageUrl: string, userId: string, timestamp: string, description?: string) => {
  const timeContext = timestamp ? new Date(timestamp).toLocaleTimeString() : 'Unknown';
  const descriptionContext = description ? `\nUser provided description: "${description}"` : '';
  
  // Fetch user profile for personalized advice
  let userContext = '';
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData?.dailyCalorieTarget) {
        userContext = `\nUser's daily calorie target: ${Math.round(userData.dailyCalorieTarget)} kcal.`;
      }
    }

    // Fetch other meals from today for cumulative context
    const startOfDay = new Date(timestamp);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(timestamp);
    endOfDay.setHours(23, 59, 59, 999);

    const todayMeals = await db.collection('meals')
      .where('userId', '==', userId)
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startOfDay))
      .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(endOfDay))
      .get();

    const otherMeals = todayMeals.docs
      .filter(doc => doc.id !== mealId)
      .map(doc => {
        const data = doc.data();
        return `${data.analysis?.calories || 'Unknown'} kcal meal at ${data.timestamp.toDate().toLocaleTimeString()}`;
      });

    if (otherMeals.length > 0) {
      userContext += `\nMeals already logged today:\n- ${otherMeals.join('\n- ')}`;
      userContext += `\nProvide advice that considers the cumulative impact of these meals.`;
    }
  } catch (error) {
    console.warn(`Could not fetch context for userId ${userId}:`, error);
  }

  const prompt = `
    Analyze this food image and provide nutritional and mental health insights.
    The meal was eaten at approximately: ${timeContext}.${descriptionContext}${userContext}
    
    Provide the response in the following strict JSON format:
    {
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "mentalHealth": {
        "sugarCrashRisk": "low" | "medium" | "high",
        "focusImpact": "string describing dopamine/focus impact",
        "inflammationLevel": "low" | "medium" | "high",
        "sleepImpact": "string describing impact on sleep quality/timing",
        "gutHealth": "string describing fiber/microbiome impact",
        "moodImpact": "string describing short-term mood effect",
        "advice": "one sentence advice connecting this specific food to the user's nutritional goal, their daily progress so far, and mental well-being"
      }
    }
    
    Be scientific but concise. If multiple items are present, estimate the total. Use the user provided description to improve accuracy if it contains relevant details like quantities or hidden ingredients.
  `;

  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBase64 = Buffer.from(response.data).toString('base64');

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { 
              inlineData: { 
                mimeType: 'image/jpeg', 
                data: imageBase64 
              } 
            }
          ],
        },
      ],
    });

    const responseText = result.response.candidates?.[0].content.parts[0].text;
    if (!responseText) throw new Error('Empty response from Gemini');

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse JSON from Gemini');
    
    const analysis = JSON.parse(jsonMatch[0]);

    await db.collection('meals').doc(mealId).update({
      analysis,
      status: 'completed',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Successfully analyzed meal ${mealId}`);
  } catch (error) {
    console.error(`Error analyzing meal ${mealId}:`, error);
    await db.collection('meals').doc(mealId).update({
      status: 'error',
      error: (error as Error).message,
    });
    throw error; // Rethrow to let Pub/Sub retry if needed
  }
};

app.post('/', async (req, res) => {
  if (!req.body.message) {
    return res.status(400).send('Bad Request: Invalid Pub/Sub message format');
  }

  const pubSubMessage = req.body.message;
  const data = pubSubMessage.data
    ? Buffer.from(pubSubMessage.data, 'base64').toString().trim()
    : null;

  if (!data) {
    return res.status(400).send('Bad Request: No data in Pub/Sub message');
  }

  try {
    const { mealId, imageUrl, userId, timestamp, description } = JSON.parse(data);
    console.log(`Processing meal analysis for mealId: ${mealId}`);
    
    // Check for existence and idempotency
    const mealDoc = await db.collection('meals').doc(mealId).get();
    if (!mealDoc.exists) {
      console.log(`Meal ${mealId} not found in Firestore. It might have been deleted. Skipping.`);
      return res.status(204).send();
    }

    const mealData = mealDoc.data();
    if (mealData?.status === 'completed' || mealData?.analysis) {
      console.log(`Meal ${mealId} already processed, skipping.`);
      return res.status(204).send();
    }
    
    await analyzeMeal(mealId, imageUrl, userId, timestamp, description);
    
    res.status(204).send();
  } catch (err) {
    console.error('Error processing message:', err);
    res.status(500).send(`Internal Server Error: ${err}`);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Meal Analysis Worker listening on port ${PORT}`);
});
