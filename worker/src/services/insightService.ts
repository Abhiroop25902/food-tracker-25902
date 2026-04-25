import { ChatVertexAI } from '@langchain/google-vertexai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import * as admin from 'firebase-admin';

const model = new ChatVertexAI({
  model: 'gemini-2.5-flash',
  temperature: 0.7, // Higher temperature for more "empathetic" coaching
  maxOutputTokens: 512,
});

export const generateDailyInsight = async (
  mealId: string, 
  userId: string, 
  db: admin.firestore.Firestore
): Promise<string> => {
  // Fetch current meal and user data directly from DB to ensure fresh data
  const mealDoc = await db.collection('meals').doc(mealId).get();
  const userDoc = await db.collection('users').doc(userId).get();
  
  if (!mealDoc.exists) throw new Error('Meal not found for insight generation');
  
  const mealData = mealDoc.data();
  const analysis = mealData?.analysis;
  
  if (!analysis) throw new Error('No analysis found on meal for insight generation');

  // Fetch all meals for today for cumulative context
  const timestamp = mealData?.timestamp?.toDate() || new Date();
  const startOfDay = new Date(timestamp);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(timestamp);
  endOfDay.setHours(23, 59, 59, 999);

  const todayMealsDocs = await db.collection('meals')
    .where('userId', '==', userId)
    .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startOfDay))
    .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(endOfDay))
    .get();

  const todayMeals = todayMealsDocs.docs.map(doc => doc.data());
  const userData = userDoc.exists ? userDoc.data() : null;

  let context = `User's daily calorie target: ${userData?.dailyCalorieTarget || 'Unknown'} kcal.
`;
  context += `Meals today:
`;
  todayMeals.forEach((m, i) => {
    context += `- Meal ${i+1}: ${m.analysis?.calories || 'Pending'} kcal, focus impact: ${m.analysis?.mentalHealth?.focusImpact || 'N/A'}
`;
  });

  const insightAgentPrompt = `
    You are the "Mindful Bites" Health Coach.
    Your goal is to provide a single, powerful, and empathetic sentence of advice for the user's dashboard.
    
    Current Meal Analysis:
    - Calories: ${analysis.calories}
    - Protein: ${analysis.protein}g, Carbs: ${analysis.carbs}g, Fat: ${analysis.fat}g
    - Mental Impact: ${analysis.mentalHealth.focusImpact}
    - Reasoning: ${analysis.reasoning}
    
    Cumulative Today's Context:
    ${context}
    
    Task:
    Synthesize the cumulative impact of today's eating habits based on the actual data recorded in the database. 
    Focus on the connection between their nutrition and their mental well-being (focus, mood, energy).
    Be encouraging but scientifically grounded.
    
    Constraint: 
    Output ONLY the single sentence. No preamble or quotes.
  `;

  const insightResponse = await model.invoke([
    new SystemMessage(insightAgentPrompt),
    new HumanMessage("Generate my daily insight based on my latest meal and history."),
  ]);

  return insightResponse.content.toString().trim().replace(/^"|"$/g, '');
};
