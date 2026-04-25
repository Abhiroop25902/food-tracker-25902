import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { UserProfile } from '../types/UserProfile';
import { Loader2 } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [goal, setGoal] = useState<'maintain' | 'lose' | 'gain' | 'custom'>('maintain');
  const [customTarget, setCustomTarget] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const calculateBMR = (w: number, h: number, a: number, g: string) => {
    // Mifflin-St Jeor Equation
    if (g === 'male') {
      return 10 * w + 6.25 * h - 5 * a + 5;
    } else if (g === 'female') {
      return 10 * w + 6.25 * h - 5 * a - 161;
    } else {
      // Average for 'other'
      return (10 * w + 6.25 * h - 5 * a + 5 + (10 * w + 6.25 * h - 5 * a - 161)) / 2;
    }
  };

  const handleSubmit = async (formData: FormData) => {
    if (!auth.currentUser) return;

    setLoading(true);
    const weightVal = formData.get('weight') as string;
    const heightVal = formData.get('height') as string;
    const ageVal = formData.get('age') as string;
    const genderVal = formData.get('gender') as 'male' | 'female' | 'other';
    const goalVal = formData.get('goal') as string;

    const w = parseFloat(weightVal);
    const h = parseFloat(heightVal);
    const a = parseInt(ageVal);
    const bmr = calculateBMR(w, h, a, genderVal);
    
    let dailyCalorieTarget = bmr;
    if (goalVal === 'lose') dailyCalorieTarget = bmr - 500;
    else if (goalVal === 'gain') dailyCalorieTarget = bmr + 500;
    else if (goalVal === 'custom') dailyCalorieTarget = parseFloat(customTarget) || bmr;

    const profile: UserProfile = {
      uid: auth.currentUser.uid,
      weight: w,
      height: h,
      age: a,
      gender: genderVal,
      bmr,
      dailyCalorieTarget,
      onboarded: true,
      displayName: auth.currentUser.displayName || '',
      photoURL: auth.currentUser.photoURL || '',
    };

    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), profile);
      onComplete();
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold mb-2">Welcome to Mindful Bites!</h2>
      <p className="text-gray-500 mb-6">Let's get to know you better to personalize your nutrition insights.</p>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
          <input
            name="weight"
            type="number"
            step="0.1"
            required
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder="e.g. 75.5"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
          <input
            name="height"
            type="number"
            required
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder="e.g. 175"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
          <input
            name="age"
            type="number"
            required
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder="e.g. 25"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select
            name="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other')}
            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other / Prefer not to say</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Goal</label>
          <select
            name="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value as 'maintain' | 'lose' | 'gain' | 'custom')}
            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
          >
            <option value="maintain">Maintain Weight (Resting BMR)</option>
            <option value="lose">Weight Loss (-500 kcal)</option>
            <option value="gain">Bulking / Muscle Gain (+500 kcal)</option>
            <option value="custom">Custom Calorie Target</option>
          </select>
        </div>

        {goal === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Daily Calorie Target</label>
            <input
              type="number"
              required
              value={customTarget}
              onChange={(e) => setCustomTarget(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="e.g. 2500"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-md disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" />
              <span>Saving...</span>
            </>
          ) : 'Complete Setup'}
        </button>
      </form>
    </div>
  );
};

export default Onboarding;
