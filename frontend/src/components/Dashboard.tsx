import { useEffect, useState } from 'react';
import { db, auth, storage } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { Brain, Utensils, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import type { Meal, UserProfile } from '../types';
import MealCard from './MealCard';

const Dashboard = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const handleDelete = async (meal: Meal) => {
    if (!window.confirm("Are you sure you want to delete this meal record?")) return;

    try {
      // 1. Delete from Firestore
      await deleteDoc(doc(db, 'meals', meal.id));

      // 2. Delete image from Storage
      const imageRef = ref(storage, meal.imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error("Error deleting meal:", error);
      alert("Failed to delete meal. Please try again.");
    }
  };

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    // Wait for auth to be ready
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      // Clean up previous listener if it exists
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (!user) {
        setMeals([]);
        setProfile(null);
        setLoading(false);
        return;
      }

      // Fetch user profile
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        }
      } catch (error) {
        console.error("Error fetching profile in Dashboard:", error);
      }

      const q = query(
        collection(db, 'meals'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );

      unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        const mealsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Convert Firestore timestamp to ISO string for the UI
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString()
          };
        }) as Meal[];
        setMeals(mealsData);
        setLoading(false);
      }, (error) => {
        // Silently handle permission errors that often occur during the logout race condition
        if (error.code === 'permission-denied') {
          return;
        }
        console.error("Firestore snapshot error:", error);
        setLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const caloriesToday = meals
    .filter(meal => {
      const mealDate = new Date(meal.timestamp);
      const today = new Date();
      return mealDate.toDateString() === today.toDateString();
    })
    .reduce((sum, meal) => sum + (meal.analysis?.calories || 0), 0);

  const latestAnalyzedMeal = meals.find(meal => 
    meal.analysis && new Date(meal.timestamp).toDateString() === new Date().toDateString()
  );

  const isAnyMealProcessingToday = meals.some(meal => 
    !meal.analysis && meal.status !== 'error' && new Date(meal.timestamp).toDateString() === new Date().toDateString()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Nutrition Journey</h1>
          <p className="text-gray-500">Connecting what you eat to how you feel.</p>
        </div>

        {profile && (
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
              <Utensils size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-400">Calories Today</p>
              <div className="flex items-baseline space-x-1">
                <span className="text-xl font-bold">{caloriesToday}</span>
                <span className="text-gray-300">/</span>
                <span className="text-sm text-gray-500">{Math.round(profile.dailyCalorieTarget || profile.bmr)} <span className="text-[10px]">Target</span></span>
              </div>
            </div>
            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={clsx(
                  "h-full rounded-full transition-all duration-1000",
                  caloriesToday > (profile.dailyCalorieTarget || profile.bmr) ? "bg-red-500" : "bg-orange-500"
                )}
                style={{ width: `${Math.min((caloriesToday / (profile.dailyCalorieTarget || profile.bmr)) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Mental Health Insights Summary */}
      <section className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-6 rounded-2xl shadow-lg shadow-indigo-100 flex items-start space-x-4">
        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
          <Brain className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-1">Latest Insight</h2>
          <p className="opacity-90 leading-relaxed">
            {latestAnalyzedMeal
              ? latestAnalyzedMeal.analysis.mentalHealth.advice
              : isAnyMealProcessingToday
                ? "Analyzing your meal to provide personalized mental health insights..."
                : "Welcome back! Start by logging your first meal of the day to see how it impacts your mental focus."}
          </p>
        </div>
      </section>

      <div className="flex flex-col space-y-8 w-full">
        {meals.map((meal) => (
          <MealCard key={meal.id} meal={meal} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
