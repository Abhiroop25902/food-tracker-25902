import { MealAnalysis } from './meal';

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
