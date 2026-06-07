import type { Scene } from "@/app/lib/scene";

export type TemplateSource = "current" | "custom";

export interface AITemplateConfig {
  endpoint: string;
  apiKey: string;
  model: string;
}

export interface AIConnectionStatus {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AIModelInfo {
  id: string;
  name?: string;
}

export interface AIGenerateStatus {
  isGenerating: boolean;
  error: string | null;
}

export interface AITemplateState {
  templateSource: TemplateSource;
  selectedTemplateId: string | null;
  userPrompt: string;
  config: AITemplateConfig;
  models: AIModelInfo[];
  connectionStatus: AIConnectionStatus;
  generateStatus: AIGenerateStatus;
  generatedScene: Scene | null;
}

export interface AITemplateActions {
  setTemplateSource: (source: TemplateSource) => void;
  setSelectedTemplateId: (id: string | null) => void;
  setUserPrompt: (prompt: string) => void;
  setConfig: (config: Partial<AITemplateConfig>) => void;
  testConnection: () => Promise<void>;
  generateTemplate: (currentScene: Scene) => Promise<void>;
  applyGeneratedScene: () => Scene | null;
  resetGeneratedScene: () => void;
  clearError: () => void;
}

export interface AIProvider {
  testConnection(): Promise<boolean>;
  fetchModels(): Promise<AIModelInfo[]>;
  generate(prompt: string): Promise<string>;
}

export interface AITemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentScene: Scene;
  onApplyScene: (scene: Scene) => void;
}

export const AI_CONFIG_STORAGE_KEY = "covercast.aiConfig.v1";

export const DEFAULT_AI_CONFIG: AITemplateConfig = {
  endpoint: "",
  apiKey: "",
  model: "",
};