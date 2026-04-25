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

const analyzeMeal = async (mealId: string, imageUrl: string, timestamp: string, description?: string) => {
  const timeContext = timestamp ? new Date(timestamp).toLocaleTimeString() : 'Unknown';
  const descriptionContext = description ? `\nUser provided description: "${description}"` : '';
  
  const prompt = `
    Analyze this food image and provide nutritional and mental health insights.
    The meal was eaten at approximately: ${timeContext}.${descriptionContext}
    
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
        "advice": "one sentence advice connecting this specific food to mental well-being"
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
    const { mealId, imageUrl, timestamp, description } = JSON.parse(data);
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
    
    await analyzeMeal(mealId, imageUrl, timestamp, description);
    
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
