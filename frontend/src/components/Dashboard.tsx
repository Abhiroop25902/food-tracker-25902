import { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Brain, Zap, Waves, Moon, Heart } from 'lucide-react';
import clsx from 'clsx';
import { type Meal } from '../types';

const Dashboard = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to be ready
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, 'meals'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );

      const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        const mealsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Convert Firestore timestamp to ISO string for the UI
            timestamp: data.timestamp?.toDate()?.toISOString() || new Date().toISOString()
          };
        }) as Meal[];
        setMeals(mealsData);
        setLoading(false);
      }, (error) => {
        console.error("Firestore error:", error);
        setLoading(false);
      });

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20">Loading your history...</div>;

  return (
    <div className="space-y-8 pb-12">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Nutrition Journey</h1>
          <p className="text-gray-500">Connecting what you eat to how you feel.</p>
        </div>
      </header>

      {/* Mental Health Insights Summary */}
      <section className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-6 rounded-2xl shadow-lg shadow-indigo-100 flex items-start space-x-4">
        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
          <Brain className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-1">Latest Insight</h2>
          <p className="opacity-90 leading-relaxed">
            {meals[0]?.analysis?.mentalHealth.advice || "Start by logging your first meal to see how it impacts your mental focus!"}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {meals.map((meal) => (
          <div key={meal.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all flex flex-col md:flex-row">
            <div className="md:w-1/3 relative h-48 md:h-auto">
              <img src={meal.imageUrl} alt="Meal" className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3">
                <span className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-xs font-bold border border-white/20">
                  {new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="p-6 md:w-2/3 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-xl">{meal.analysis?.calories} <span className="text-sm font-normal text-gray-400">kcal</span></h3>
                  <div className="flex space-x-2 mt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-0.5 rounded">Pro: {meal.analysis?.protein}g</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600 px-2 py-0.5 rounded">Carb: {meal.analysis?.carbs}g</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded">Fat: {meal.analysis?.fat}g</span>
                  </div>
                </div>
                <div className={clsx(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border",
                  meal.analysis?.mentalHealth.sugarCrashRisk === 'high' ? "bg-red-50 text-red-600 border-red-100" : "bg-green-50 text-green-600 border-green-100"
                )}>
                  Crash Risk: {meal.analysis?.mentalHealth.sugarCrashRisk}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                    <Zap size={14} />
                    <span className="text-[10px] font-bold uppercase">Focus</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-tight line-clamp-2">{meal.analysis?.mentalHealth.focusImpact}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center space-x-2 text-rose-500 mb-1">
                    <Heart size={14} />
                    <span className="text-[10px] font-bold uppercase">Mood</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-tight line-clamp-2">{meal.analysis?.mentalHealth.moodImpact}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center space-x-2 text-emerald-500 mb-1">
                    <Waves size={14} />
                    <span className="text-[10px] font-bold uppercase">Gut</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-tight line-clamp-2">{meal.analysis?.mentalHealth.gutHealth}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center space-x-2 text-blue-500 mb-1">
                    <Moon size={14} />
                    <span className="text-[10px] font-bold uppercase">Sleep</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-tight line-clamp-2">{meal.analysis?.mentalHealth.sleepImpact}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
