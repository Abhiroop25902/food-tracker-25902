import type { Meal } from './types';

export const DUMMY_MEALS: Meal[] = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop',
    timestamp: '2026-04-25T12:30:00Z',
    status: 'completed',
    analysis: {
      calories: 450,
      protein: 22,
      carbs: 35,
      fat: 18,
      mentalHealth: {
        sugarCrashRisk: 'low',
        focusImpact: 'High - Rich in healthy fats and lean protein for sustained focus.',
        inflammationLevel: 'low',
        sleepImpact: 'Neutral',
        gutHealth: 'Excellent - High fiber content supports gut-brain axis.',
        moodImpact: 'Steady energy levels likely to prevent irritability.',
        advice: 'Great choice for a productive afternoon! The complex carbs will keep your brain fueled.'
      }
    }
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445?q=80&w=1000&auto=format&fit=crop',
    timestamp: '2026-04-25T08:15:00Z',
    status: 'completed',
    analysis: {
      calories: 650,
      protein: 12,
      carbs: 85,
      fat: 25,
      mentalHealth: {
        sugarCrashRisk: 'high',
        focusImpact: 'Low - Initial rush followed by significant brain fog.',
        inflammationLevel: 'high',
        sleepImpact: 'Negative - High sugar intake early can disrupt melatonin later.',
        gutHealth: 'Poor - Refined sugars can cause gut microbiome imbalance.',
        moodImpact: 'Anxiety spike likely during the sugar crash in ~2 hours.',
        advice: 'Try pairing this with a handful of nuts next time to slow down glucose absorption.'
      }
    }
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000&auto=format&fit=crop',
    timestamp: '2026-04-24T19:00:00Z',
    status: 'completed',
    analysis: {
      calories: 320,
      protein: 15,
      carbs: 20,
      fat: 10,
      mentalHealth: {
        sugarCrashRisk: 'low',
        focusImpact: 'Medium - Light and easy to digest.',
        inflammationLevel: 'low',
        sleepImpact: 'Positive - Contains tryptophan-rich ingredients to support sleep.',
        gutHealth: 'Good - Variety of plant-based polyphenols.',
        moodImpact: 'Relaxing - Magnesium content helps soothe the nervous system.',
        advice: "Excellent dinner choice. This supports your body's transition into rest mode."
      }
    }
  }
];
