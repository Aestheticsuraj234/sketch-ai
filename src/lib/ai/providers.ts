import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

// Model types matching our UI
export type AIModel = "sketch-mini" | "sketch-pro";


export const providers = {
  "sketch-mini": {
    name: "Sketch Mini",
    description: "Fast generation with Gemini",
    provider: "google",
    model: "gemini-2.0-flash",
  },

  "sketch-pro": {
    name: "Sketch Pro", 
    description: "Advanced generation with xiaomi mimo v2 flash",
    provider: "openrouter",
    model: "xiaomi/mimo-v2-flash:free", 
  },
} as const;

// Create Google Generative AI provider
export function createGoogleProvider() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
 
  return createGoogleGenerativeAI({ apiKey });
}

// Create OpenRouter provider (uses OpenAI-compatible API)
export function createOpenRouterProvider() {
  const apiKey = process.env.OPENROUTER_AI_GATEWAY_API_KEY;
  
  return createOpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });
}

// Get the appropriate model based on selection
export function getAIModel(modelType: AIModel) {
  const config = providers[modelType];
  
  if (config.provider === "google") {
    const google = createGoogleProvider();
    return google(config.model);
  } else {
    const openrouter = createOpenRouterProvider();
    return openrouter(config.model);
  }
}
