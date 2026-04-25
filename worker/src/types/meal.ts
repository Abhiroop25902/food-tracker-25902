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
