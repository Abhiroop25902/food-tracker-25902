import React, { useState } from 'react';
import { Brain, Zap, Waves, Moon, Heart, Loader2, ChevronDown, Trash2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import type { Meal } from '../types/Meal';

interface MealCardProps {
  meal: Meal;
  onDelete: (meal: Meal) => void;
}

const MealCard: React.FC<MealCardProps> = ({ meal, onDelete }) => {
  const [expandedInsights, setExpandedInsights] = useState<Record<string, boolean>>({});

  const toggleInsight = (insightType: string) => {
    setExpandedInsights(prev => ({
      ...prev,
      [insightType]: !prev[insightType]
    }));
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all flex flex-col md:flex-row h-auto md:h-72 w-full">
      <div className="md:w-1/3 relative h-64 md:h-full">
        <img src={meal.imageUrl} alt="Meal" className="w-full h-full object-cover" />
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-xs font-bold border border-white/20">
            {new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <button 
            onClick={() => onDelete(meal)}
            className="bg-white/90 backdrop-blur-sm text-red-500 p-2 rounded-full border border-white/20 hover:bg-red-50 transition-colors shadow-sm cursor-pointer"
            title="Delete meal"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="p-4 md:w-2/3 flex flex-col overflow-y-auto">
        {meal.status === 'error' ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center h-full">
            <div className="bg-red-100 p-3 rounded-full text-red-600">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-red-900 text-lg">Analysis Failed</h3>
              <p className="text-sm text-red-500">{meal.error || "Something went wrong while analyzing this meal."}</p>
            </div>
          </div>
        ) : !meal.analysis ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center h-full">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Analyzing Your Meal...</h3>
              <p className="text-sm text-gray-500">Gemini is identifying ingredients and mental health impacts. This usually takes 5-10 seconds.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 my-auto">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-xl">{meal.analysis.calories} <span className="text-sm font-normal text-gray-400">kcal</span></h3>
                <div className="flex space-x-2 mt-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-0.5 rounded">Pro: {meal.analysis.protein}g</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600 px-2 py-0.5 rounded">Carb: {meal.analysis.carbs}g</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded">Fat: {meal.analysis.fat}g</span>
                </div>
              </div>
              <div className={clsx(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border",
                meal.analysis.mentalHealth.sugarCrashRisk === 'high' ? "bg-red-50 text-red-600 border-red-100" : "bg-green-50 text-green-600 border-green-100"
              )}>
                Crash Risk: {meal.analysis.mentalHealth.sugarCrashRisk}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => toggleInsight('focus')}
                className="bg-gray-50 p-2 rounded-xl border border-gray-100 text-left transition-all hover:bg-gray-100 active:scale-[0.98] group"
              >
                <div className="flex items-center justify-between text-indigo-600 mb-0.5">
                  <div className="flex items-center space-x-2">
                    <Zap size={14} />
                    <span className="text-[10px] font-bold uppercase">Focus</span>
                  </div>
                  <ChevronDown size={12} className={clsx("transition-transform duration-300 opacity-50 group-hover:opacity-100", expandedInsights['focus'] && "rotate-180")} />
                </div>
                <p className={clsx(
                  "text-[11px] text-gray-600 leading-tight",
                  !expandedInsights['focus'] && "line-clamp-2"
                )}>{meal.analysis.mentalHealth.focusImpact}</p>
              </button>

              <button 
                onClick={() => toggleInsight('mood')}
                className="bg-gray-50 p-2 rounded-xl border border-gray-100 text-left transition-all hover:bg-gray-100 active:scale-[0.98] group"
              >
                <div className="flex items-center justify-between text-rose-500 mb-0.5">
                  <div className="flex items-center space-x-2">
                    <Heart size={14} />
                    <span className="text-[10px] font-bold uppercase">Mood</span>
                  </div>
                  <ChevronDown size={12} className={clsx("transition-transform duration-300 opacity-50 group-hover:opacity-100", expandedInsights['mood'] && "rotate-180")} />
                </div>
                <p className={clsx(
                  "text-[11px] text-gray-600 leading-tight",
                  !expandedInsights['mood'] && "line-clamp-2"
                )}>{meal.analysis.mentalHealth.moodImpact}</p>
              </button>

              <button 
                onClick={() => toggleInsight('gut')}
                className="bg-gray-50 p-2 rounded-xl border border-gray-100 text-left transition-all hover:bg-gray-100 active:scale-[0.98] group"
              >
                <div className="flex items-center justify-between text-emerald-500 mb-0.5">
                  <div className="flex items-center space-x-2">
                    <Waves size={14} />
                    <span className="text-[10px] font-bold uppercase">Gut</span>
                  </div>
                  <ChevronDown size={12} className={clsx("transition-transform duration-300 opacity-50 group-hover:opacity-100", expandedInsights['gut'] && "rotate-180")} />
                </div>
                <p className={clsx(
                  "text-[11px] text-gray-600 leading-tight",
                  !expandedInsights['gut'] && "line-clamp-2"
                )}>{meal.analysis.mentalHealth.gutHealth}</p>
              </button>

              <button 
                onClick={() => toggleInsight('sleep')}
                className="bg-gray-50 p-2 rounded-xl border border-gray-100 text-left transition-all hover:bg-gray-100 active:scale-[0.98] group"
              >
                <div className="flex items-center justify-between text-blue-500 mb-0.5">
                  <div className="flex items-center space-x-2">
                    <Moon size={14} />
                    <span className="text-[10px] font-bold uppercase">Sleep</span>
                  </div>
                  <ChevronDown size={12} className={clsx("transition-transform duration-300 opacity-50 group-hover:opacity-100", expandedInsights['sleep'] && "rotate-180")} />
                </div>
                <p className={clsx(
                  "text-[11px] text-gray-600 leading-tight",
                  !expandedInsights['sleep'] && "line-clamp-2"
                )}>{meal.analysis.mentalHealth.sleepImpact}</p>
              </button>
            </div>

            {meal.analysis.reasoning && (
              <button 
                onClick={() => toggleInsight('reasoning')}
                className="bg-indigo-50/50 p-2 rounded-xl border border-indigo-100/50 text-left transition-all hover:bg-indigo-100/50 active:scale-[0.98] group w-full"
              >
                <div className="flex items-center justify-between text-indigo-600">
                  <div className="flex items-center space-x-2">
                    <Brain size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">AI Reasoning</span>
                  </div>
                  <ChevronDown size={12} className={clsx("transition-transform duration-300 opacity-50 group-hover:opacity-100", expandedInsights['reasoning'] && "rotate-180")} />
                </div>
                <p className={clsx(
                  "text-[11px] text-gray-700 leading-relaxed italic mt-1",
                  !expandedInsights['reasoning'] && "hidden"
                )}>
                  "{meal.analysis.reasoning}"
                </p>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MealCard;
