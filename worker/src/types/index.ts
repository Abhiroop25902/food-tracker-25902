export interface MealAnalysis {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  reasoning: string;
  mentalHealth: {
    sugarCrashRisk: 'low' | 'medium' | 'high';
    focusImpact: string;
    inflammationLevel: 'low' | 'medium' | 'high';
    sleepImpact: string;
    gutHealth: string;
    moodImpact: string;
    advice: string;
  };
}

export interface AgentState {
  mealId: string;
  imageUrl: string;
  imageBase64: string;
  userId: string;
  timestamp: string;
  description?: string;
  userContext: string;
  timeContext: string;
  overestimate?: string;
  underestimate?: string;
  finalAnalysis?: MealAnalysis;
}
