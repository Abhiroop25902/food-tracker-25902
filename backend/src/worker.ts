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
  model: 'gemini-3-flash-preview',
});

export const analyzeMeal = async (mealId: string, imageUrl: string, timestamp: string) => {
  const timeContext = timestamp ? new Date(timestamp).toLocaleTimeString() : 'Unknown';
  
  const prompt = `
    Analyze this food image and provide nutritional and mental health insights.
    The meal was eaten at approximately: ${timeContext}.
    
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
    
    Be scientific but concise. If multiple items are present, estimate the total.
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

    // Extract JSON from response (handling potential markdown blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse JSON from Gemini');
    
    const analysis = JSON.parse(jsonMatch[0]);

    // Update Firestore
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
  }
};
