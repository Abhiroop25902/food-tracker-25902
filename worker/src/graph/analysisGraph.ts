import { ChatVertexAI } from '@langchain/google-vertexai';
import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { AgentState } from '../types/state';

const model = new ChatVertexAI({
  model: 'gemini-2.5-flash',
  temperature: 0,
  maxOutputTokens: 2048,
});

const StateAnnotation = Annotation.Root({
  mealId: Annotation<string>,
  imageUrl: Annotation<string>,
  imageBase64: Annotation<string>,
  userId: Annotation<string>,
  timestamp: Annotation<string>,
  description: Annotation<string | undefined>,
  userContext: Annotation<string>,
  timeContext: Annotation<string>,
  overestimate: Annotation<string>,
  underestimate: Annotation<string>,
  finalAnalysis: Annotation<any>,
});

const overestimatorNode = async (state: typeof StateAnnotation.State) => {
  const prompt = `
    You are the "Overestimator" nutritional agent. 
    Analyze the provided food image and user context. 
    Assume a reasonable worst-case scenario for calories and macros.
    Look for hidden oils, dense dressings, large portion sizes, and calorie-dense ingredients that might be overlooked.
    
    Context:
    - Time: ${state.timeContext}
    - User Description: ${state.description || 'None'}
    - User Goals: ${state.userContext}
    
    Provide your reasoning for a higher estimate. Be specific about what ingredients or visual cues lead you to this.
  `;

  const response = await model.invoke([
    new SystemMessage(prompt),
    new HumanMessage({
      content: [
        { type: 'text', text: "Analyze this image for a high-end nutritional estimate." },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${state.imageBase64}` } },
      ],
    }),
  ]);

  return { overestimate: response.content.toString() };
};

const underestimatorNode = async (state: typeof StateAnnotation.State) => {
  const prompt = `
    You are the "Underestimator" nutritional agent. 
    Analyze the provided food image and user context. 
    Assume a reasonable best-case scenario for calories and macros.
    Focus on lean proteins, high-volume/low-calorie vegetables, and light preparation methods.
    
    Context:
    - Time: ${state.timeContext}
    - User Description: ${state.description || 'None'}
    - User Goals: ${state.userContext}
    
    Provide your reasoning for a lower estimate. Be specific about what ingredients or visual cues lead you to this.
  `;

  const response = await model.invoke([
    new SystemMessage(prompt),
    new HumanMessage({
      content: [
        { type: 'text', text: "Analyze this image for a conservative/low-end nutritional estimate." },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${state.imageBase64}` } },
      ],
    }),
  ]);

  return { underestimate: response.content.toString() };
};

const overseerNode = async (state: typeof StateAnnotation.State) => {
  const prompt = `
    You are the "Overseer" nutritional judge. 
    You have two competing perspectives on this meal:
    
    OVERESTIMATOR ARGUMENT:
    ${state.overestimate}
    
    UNDERESTIMATOR ARGUMENT:
    ${state.underestimate}
    
    Your task:
    1. Look at the original image and context.
    2. Weigh the arguments from both agents.
    3. Determine the most accurate possible nutritional values.
    4. Provide the final response in STRICT JSON format.
    
    Context:
    - Time: ${state.timeContext}
    - User Description: ${state.description || 'None'}
    - User Goals: ${state.userContext}

    Required JSON Structure:
    {
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "reasoning": "Objective technical synthesis of arguments (max 2 sentences). Avoid first-person language ('I', 'my'). Focus on visual evidence and portion estimation logic.",
      "mentalHealth": {
        "sugarCrashRisk": "low" | "medium" | "high",
        "focusImpact": "string",
        "inflammationLevel": "low" | "medium" | "high",
        "sleepImpact": "string",
        "gutHealth": "string",
        "moodImpact": "string",
        "advice": "one sentence advice connecting this meal to the user's specific context/goals"
      }
    }
  `;

  const response = await model.invoke([
    new SystemMessage(prompt),
    new HumanMessage({
      content: [
        { type: 'text', text: "Synthesize the analysis and provide final JSON." },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${state.imageBase64}` } },
      ],
    }),
  ]);

  const responseText = response.content.toString();
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse JSON from Overseer');
  
  return { finalAnalysis: JSON.parse(jsonMatch[0]) };
};

const workflow = new StateGraph(StateAnnotation)
  .addNode('overestimator', overestimatorNode)
  .addNode('underestimator', underestimatorNode)
  .addNode('overseer', overseerNode)
  .addEdge(START, 'overestimator')
  .addEdge(START, 'underestimator')
  .addEdge('overestimator', 'overseer')
  .addEdge('underestimator', 'overseer')
  .addEdge('overseer', END);

export const analysisGraph = workflow.compile();
