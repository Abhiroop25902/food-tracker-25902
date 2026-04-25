export type Meal = {
  id: string;
  imageUrl: string;
  timestamp: string;
  status: 'processing' | 'completed';
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

export type UserProfile = {
  uid: string;
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  bmr: number;
  dailyCalorieTarget: number;
  onboarded: boolean;
  displayName: string;
  photoURL: string;
}
