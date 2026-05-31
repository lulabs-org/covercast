export type AIProvider = "openai" | "anthropic" | "deepseek" | "google" | "custom";

export type AIConfig = {
  provider: AIProvider;
  apiKey: string;
  apiEndpoint: string;
  modelName: string;
  maxTokens: number;
  temperature: number;
};

export type AIConfigStorage = {
  provider: AIProvider;
  apiKey: string;
  apiEndpoint: string;
  modelName: string;
  maxTokens: number;
  temperature: number;
};

const AI_CONFIG_STORAGE_KEY = "covercast.aiConfig.v1";

const DEFAULT_CONFIGS: Record<AIProvider, Omit<AIConfig, "apiKey">> = {
  openai: {
    provider: "openai",
    apiEndpoint: "https://api.openai.com/v1",
    modelName: "gpt-4o",
    maxTokens: 4096,
    temperature: 0.7,
  },
  anthropic: {
    provider: "anthropic",
    apiEndpoint: "https://api.anthropic.com/v1",
    modelName: "claude-sonnet-4-20250514",
    maxTokens: 4096,
    temperature: 0.7,
  },
  deepseek: {
    provider: "deepseek",
    apiEndpoint: "https://api.deepseek.com/v1",
    modelName: "deepseek-chat",
    maxTokens: 4096,
    temperature: 0.7,
  },
  google: {
    provider: "google",
    apiEndpoint: "https://generativelanguage.googleapis.com/v1beta",
    modelName: "gemini-1.5-pro",
    maxTokens: 4096,
    temperature: 0.7,
  },
  custom: {
    provider: "custom",
    apiEndpoint: "",
    modelName: "",
    maxTokens: 4096,
    temperature: 0.7,
  },
};

export function getDefaultAIConfig(provider: AIProvider): Omit<AIConfig, "apiKey"> {
  return { ...DEFAULT_CONFIGS[provider] };
}

export function readAIConfigFromStorage(): AIConfig | null {
  try {
    const raw = window.localStorage.getItem(AI_CONFIG_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const stored = JSON.parse(raw) as AIConfigStorage;
    return {
      provider: stored.provider || "openai",
      apiKey: stored.apiKey || "",
      apiEndpoint: stored.apiEndpoint || DEFAULT_CONFIGS[stored.provider || "openai"].apiEndpoint,
      modelName: stored.modelName || DEFAULT_CONFIGS[stored.provider || "openai"].modelName,
      maxTokens: stored.maxTokens || 8192,
      temperature: stored.temperature || 0.7,
    };
  } catch {
    return null;
  }
}

export function writeAIConfigToStorage(config: AIConfig): void {
  const storage: AIConfigStorage = {
    provider: config.provider,
    apiKey: config.apiKey,
    apiEndpoint: config.apiEndpoint,
    modelName: config.modelName,
    maxTokens: config.maxTokens,
    temperature: config.temperature,
  };
  window.localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(storage));
}

export function clearAIConfigFromStorage(): void {
  window.localStorage.removeItem(AI_CONFIG_STORAGE_KEY);
}

export function validateAIConfig(config: AIConfig): string | null {
  if (!config.apiKey || config.apiKey.trim() === "") {
    return "API Key 不能为空";
  }
  if (!config.apiEndpoint || config.apiEndpoint.trim() === "") {
    return "API 端点不能为空";
  }
  if (!config.modelName || config.modelName.trim() === "") {
    return "模型名称不能为空";
  }
  try {
    new URL(config.apiEndpoint);
  } catch {
    return "API 端点格式不正确";
  }
  return null;
}