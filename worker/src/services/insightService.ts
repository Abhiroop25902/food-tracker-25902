import { ChatVertexAI } from '@langchain/google-vertexai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { MealAnalysis } from '../types';

const model = new ChatVertexAI({
  model: 'gemini-2.5-flash',
  temperature: 0.7, // Higher temperature for more "empathetic" coaching
  maxOutputTokens: 512,
});

export const generateDailyInsight = async (analysis: MealAnalysis, userContext: string): Promise<string> => {
  const insightAgentPrompt = `
    You are the "Mindful Bites" Health Coach.
    Your goal is to provide a single, powerful, and empathetic sentence of advice for the user's dashboard.
    
    Current Meal Analysis:
    - Calories: ${analysis.calories}
    - Protein: ${analysis.protein}g, Carbs: ${analysis.carbs}g, Fat: ${analysis.fat}g
    - Mental Impact: ${analysis.mentalHealth.focusImpact}
    
    Context:
    ${userContext}
    
    Task:
    Synthesize the cumulative impact of today's eating habits. 
    Focus on the connection between their nutrition and their mental well-being (focus, mood, energy).
    Be encouraging but scientifically grounded.
    
    Constraint: 
    Output ONLY the single sentence. No preamble or quotes.
  `;

  const insightResponse = await model.invoke([
    new SystemMessage(insightAgentPrompt),
    new HumanMessage("Generate my daily insight based on this meal and my history."),
  ]);

  return insightResponse.content.toString().trim().replace(/^"|"$/g, '');
};
