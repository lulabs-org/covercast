import { useState, useCallback, useEffect } from "react";
import type { AITemplateConfig, AIModelInfo, AIConnectionStatus } from "../types";
import { AI_CONFIG_STORAGE_KEY, DEFAULT_AI_CONFIG } from "../types";
import { testAIConnection, fetchAvailableModels } from "../services/ai-provider";

function readConfigFromStorage(): AITemplateConfig {
  try {
    const rawValue = window.localStorage.getItem(AI_CONFIG_STORAGE_KEY);
    if (!rawValue) {
      return DEFAULT_AI_CONFIG;
    }

    const parsed = JSON.parse(rawValue) as unknown;

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "endpoint" in parsed &&
      "apiKey" in parsed &&
      "model" in parsed &&
      typeof parsed.endpoint === "string" &&
      typeof parsed.apiKey === "string" &&
      typeof parsed.model === "string"
    ) {
      return {
        endpoint: parsed.endpoint,
        apiKey: parsed.apiKey,
        model: parsed.model,
      };
    }

    return DEFAULT_AI_CONFIG;
  } catch {
    return DEFAULT_AI_CONFIG;
  }
}

function writeConfigToStorage(config: AITemplateConfig) {
  try {
    window.localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    console.warn("无法保存 AI 配置到本地存储");
  }
}

export function useAIConnection() {
  const [config, setConfigState] = useState<AITemplateConfig>(() => readConfigFromStorage());
  const [models, setModels] = useState<AIModelInfo[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<AIConnectionStatus>({
    isConnected: false,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedConfig = readConfigFromStorage();
      setConfigState(storedConfig);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const setConfig = useCallback((updates: Partial<AITemplateConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfigState(newConfig);
    writeConfigToStorage(newConfig);
  }, [config]);

  const testConnection = useCallback(async () => {
    if (!config.endpoint || !config.apiKey) {
      setConnectionStatus({
        isConnected: false,
        isLoading: false,
        error: "请填写 Endpoint 和 API Key",
      });
      return;
    }

    setConnectionStatus({
      isConnected: false,
      isLoading: true,
      error: null,
    });

    try {
      const isConnected = await testAIConnection(config);

      if (!isConnected) {
        setConnectionStatus({
          isConnected: false,
          isLoading: false,
          error: "连接失败，请检查 Endpoint 和 API Key",
        });
        return;
      }

      const availableModels = await fetchAvailableModels(config);
      setModels(availableModels);

      if (availableModels.length === 0) {
        setConnectionStatus({
          isConnected: true,
          isLoading: false,
          error: "连接成功，但未获取到模型列表",
        });
        return;
      }

      const hasSelectedModel = availableModels.some((m) => m.id === config.model);
      if (!hasSelectedModel && availableModels.length > 0) {
        setConfig({ model: availableModels[0].id });
      }

      setConnectionStatus({
        isConnected: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "连接测试失败";
      setConnectionStatus({
        isConnected: false,
        isLoading: false,
        error: errorMessage,
      });
    }
  }, [config, setConfig]);

  const clearError = useCallback(() => {
    setConnectionStatus((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    config,
    models,
    connectionStatus,
    setConfig,
    testConnection,
    clearError,
  };
}