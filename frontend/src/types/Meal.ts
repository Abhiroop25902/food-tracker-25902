export type Meal = {
  id: string;
  imageUrl: string;
  timestamp: string;
  status: 'processing' | 'completed' | 'error';
  error?: string;
  analysis?: {
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
  };
}
