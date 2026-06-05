import type { AIProvider, AIModelInfo, AITemplateConfig } from "../types";
import { OpenAICompatibleProvider } from "./openai-compatible";

export { OpenAICompatibleProvider };

export function createAIProvider(config: AITemplateConfig): AIProvider {
  return new OpenAICompatibleProvider(config.endpoint, config.apiKey);
}

export async function testAIConnection(config: AITemplateConfig): Promise<boolean> {
  const provider = createAIProvider(config);
  return provider.testConnection();
}

export async function fetchAvailableModels(config: AITemplateConfig): Promise<AIModelInfo[]> {
  const provider = createAIProvider(config);
  return provider.fetchModels();
}

export async function generateWithAI(
  config: AITemplateConfig,
  prompt: string
): Promise<string> {
  const provider = new OpenAICompatibleProvider(config.endpoint, config.apiKey);
  return provider.generateWithModel(prompt, config.model);
}