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
