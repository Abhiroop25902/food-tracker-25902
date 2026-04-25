import express from 'express';
import cors from 'cors';
import * as admin from 'firebase-admin';
import { PubSub } from '@google-cloud/pubsub';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
// If running in Google Cloud, it will use application default credentials.
// For local development, you'll need GOOGLE_APPLICATION_CREDENTIALS env var.
admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID || 'food-tracker-25902',
});

const db = admin.firestore();
const pubsub = new PubSub({
  projectId: process.env.FIREBASE_PROJECT_ID || 'food-tracker-25902',
});

const app = express();
app.use(cors());
app.use(express.json());

const MEALS_TOPIC = 'meal-analysis';

app.post('/api/meals', async (req, res) => {
  const { imageUrl, userId, timestamp } = req.body;

  if (!imageUrl || !userId) {
    return res.status(400).json({ error: 'Missing imageUrl or userId' });
  }

  try {
    // 1. Save to Firestore
    const mealRef = await db.collection('meals').add({
      imageUrl,
      userId,
      timestamp: timestamp ? admin.firestore.Timestamp.fromDate(new Date(timestamp)) : admin.firestore.FieldValue.serverTimestamp(),
      status: 'processing',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 2. Publish to Pub/Sub
    const data = JSON.stringify({
      mealId: mealRef.id,
      imageUrl,
      userId,
      timestamp,
    });
    
    const dataBuffer = Buffer.from(data);
    await pubsub.topic(MEALS_TOPIC).publish(dataBuffer);

    res.status(201).json({ 
      id: mealRef.id, 
      message: 'Meal saved and analysis queued' 
    });
  } catch (error) {
    console.error('Error processing meal:', error);
    res.status(500).json({ error: 'Failed to process meal' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Backend API listening on port ${PORT}`);
});
