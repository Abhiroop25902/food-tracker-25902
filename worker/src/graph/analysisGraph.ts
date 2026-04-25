import { ChatVertexAI } from '@langchain/google-vertexai';
import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { AgentState } from '../types/state';

const model = new ChatVertexAI({
  model: 'gemini-2.5-flash',
  temperature: 0,
  maxOutputTokens: 4096, // Increased from 2048
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
  // Truncate arguments to avoid overwhelming the model or hitting token limits
  const truncatedOver = state.overestimate.substring(0, 3000);
  const truncatedUnder = state.underestimate.substring(0, 3000);

  const prompt = `
    You are the "Overseer" nutritional judge. 
    You have two competing perspectives on this meal:
    
    OVERESTIMATOR ARGUMENT:
    ${truncatedOver}
    
    UNDERESTIMATOR ARGUMENT:
    ${truncatedUnder}
    
    Your task:
    1. Look at the original image and context.
    2. Weigh the arguments from both agents.
    3. Determine the most accurate possible nutritional values.
    4. Provide the final response in STRICT JSON format. 
    
    CRITICAL: Return ONLY the raw JSON object. Do not use markdown blocks (no \`\`\`json). No preamble. No postamble.
    
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
        { type: 'text', text: "Synthesize analysis into valid JSON. NO MARKDOWN." },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${state.imageBase64}` } },
      ],
    }),
  ]);

  const responseText = response.content.toString().trim();
  
  // Robust JSON extraction: find the first '{' and last '}'
  const firstBrace = responseText.indexOf('{');
  const lastBrace = responseText.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error(`Overseer response missing braces: ${responseText.substring(0, 200)}...`);
  }

  const jsonString = responseText.substring(firstBrace, lastBrace + 1);
  
  try {
    return { finalAnalysis: JSON.parse(jsonString) };
  } catch (e) {
    // If it fails, maybe it's missing a closing brace due to truncation? 
    // Let's try to append one as a last resort if it looks like it's the issue
    if (jsonString.startsWith('{') && !jsonString.endsWith('}')) {
      try {
        return { finalAnalysis: JSON.parse(jsonString + '}') };
      } catch (innerE) {
        throw new Error(`Failed to parse Overseer JSON: ${(e as Error).message}. Raw: ${jsonString.substring(0, 100)}...`);
      }
    }
    throw new Error(`Failed to parse Overseer JSON: ${(e as Error).message}. Raw: ${jsonString.substring(0, 100)}...`);
  }
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
