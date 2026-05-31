"use client";

import { useState, useMemo } from "react";
import {
  type AIConfig,
  type AIProvider,
  readAIConfigFromStorage,
  writeAIConfigToStorage,
  validateAIConfig,
  getDefaultAIConfig,
} from "../lib/ai-config";

type AIConfigModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AIConfig) => void;
};

const PROVIDER_OPTIONS: { label: string; value: AIProvider; description: string }[] = [
  { label: "OpenAI", value: "openai", description: "GPT 系列模型" },
  { label: "Anthropic", value: "anthropic", description: "Claude 系列模型" },
  { label: "DeepSeek", value: "deepseek", description: "DeepSeek 模型" },
  { label: "Google", value: "google", description: "Gemini 系列模型" },
  { label: "自定义", value: "custom", description: "自定义 API 端点" },
];

const MODEL_OPTIONS: Record<AIProvider, { label: string; value: string }[]> = {
  openai: [
    { label: "GPT-5.6 (推荐)", value: "gpt-5.6" },
    { label: "GPT-5.5", value: "gpt-5.5" },
    { label: "GPT-5 Mini", value: "gpt-5-mini" },
  ],

  anthropic: [
    { label: "Claude Sonnet 4.5 (推荐)", value: "claude-sonnet-4.5" },
    { label: "Claude Opus 4.8", value: "claude-opus-4.8" },
    { label: "Claude Haiku 4.5", value: "claude-haiku-4.5" },
  ],

  deepseek: [
    { label: "DeepSeek V4 Pro (推荐)", value: "deepseek-v4-pro" },
    { label: "DeepSeek V4 Flash", value: "deepseek-v4-flash" },
  ],

  google: [
    { label: "Gemini 3.5 Pro (推荐)", value: "gemini-3.5-pro" },
    { label: "Gemini 3.5 Flash", value: "gemini-3.5-flash" },
  ],

  custom: [],
};

export default function AIConfigModal({ isOpen, onClose, onSave }: AIConfigModalProps) {
  const savedConfig = useMemo(() => (isOpen ? readAIConfigFromStorage() : null), [isOpen]);
  const defaultOpenAIConfig = useMemo(() => getDefaultAIConfig("openai"), []);

  const initialProvider = savedConfig?.provider ?? "openai";
  const initialApiKey = savedConfig?.apiKey ?? "";
  const initialApiEndpoint = savedConfig?.apiEndpoint ?? defaultOpenAIConfig.apiEndpoint;
  const initialModelName = savedConfig?.modelName ?? defaultOpenAIConfig.modelName;
  const initialMaxTokens = savedConfig?.maxTokens ?? 4096;
  const initialTemperature = savedConfig?.temperature ?? 0.7;

  const [provider, setProvider] = useState<AIProvider>(initialProvider);
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [apiEndpoint, setApiEndpoint] = useState(initialApiEndpoint);
  const [modelName, setModelName] = useState(initialModelName);
  const [maxTokens, setMaxTokens] = useState(initialMaxTokens);
  const [temperature, setTemperature] = useState(initialTemperature);
  const [error, setError] = useState<string | null>(null);

  const computedApiEndpoint = provider === "custom" ? apiEndpoint : getDefaultAIConfig(provider).apiEndpoint;
  const availableModels = MODEL_OPTIONS[provider] || [];

  function handleProviderChange(newProvider: AIProvider) {
    setProvider(newProvider);
    setError(null);
    if (newProvider !== "custom") {
      const defaultConfig = getDefaultAIConfig(newProvider);
      setApiEndpoint(defaultConfig.apiEndpoint);
      const models = MODEL_OPTIONS[newProvider];
      if (models && models.length > 0) {
        setModelName(models[0].value);
      } else {
        setModelName(defaultConfig.modelName);
      }
    }
  }

  function handleSave() {
    const config: AIConfig = {
      provider,
      apiKey,
      apiEndpoint: computedApiEndpoint,
      modelName: provider === "custom" ? modelName : (modelName || getDefaultAIConfig(provider).modelName),
      maxTokens,
      temperature,
    };

    const validationError = validateAIConfig(config);
    if (validationError) {
      setError(validationError);
      return;
    }

    writeAIConfigToStorage(config);
    onSave(config);
    onClose();
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ai-config-modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>AI 服务配置</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">服务商</label>
            <select
              className="form-select"
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
            >
              {PROVIDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">API Key</label>
            <input
              type="password"
              className="form-input"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError(null);
              }}
              placeholder={`输入 ${PROVIDER_OPTIONS.find(p => p.value === provider)?.label} API Key`}
            />
            {provider === "openai" && (
              <small className="form-hint">从 platform.openai.com 获取</small>
            )}
            {provider === "anthropic" && (
              <small className="form-hint">从 console.anthropic.com 获取</small>
            )}
            {provider === "deepseek" && (
              <small className="form-hint">从 platform.deepseek.com 获取</small>
            )}
            {provider === "google" && (
              <small className="form-hint">从 aistudio.google.com 获取</small>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">模型</label>
            {provider === "custom" ? (
              <input
                type="text"
                className="form-input"
                value={modelName}
                onChange={(e) => {
                  setModelName(e.target.value);
                  setError(null);
                }}
                placeholder="如: gpt-4o、claude-3-opus"
              />
            ) : (
              <select
                className="form-select"
                value={modelName}
                onChange={(e) => {
                  setModelName(e.target.value);
                  setError(null);
                }}
              >
                {availableModels.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">API 端点</label>
            <input
              type="text"
              className="form-input"
              value={computedApiEndpoint}
              onChange={(e) => {
                setApiEndpoint(e.target.value);
                setError(null);
              }}
              placeholder={provider === "custom" ? "如: https://api.example.com/v1" : ""}
              disabled={provider !== "custom"}
            />
            {provider !== "custom" && (
              <small className="form-hint">使用默认端点</small>
            )}
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label className="form-label">最大 Token</label>
              <input
                type="number"
                className="form-input"
                value={maxTokens}
                onChange={(e) => {
                  setMaxTokens(parseInt(e.target.value) || 4096);
                  setError(null);
                }}
                min={100}
                max={8000}
              />
            </div>

            <div className="form-group half">
              <label className="form-label">温度</label>
              <input
                type="number"
                className="form-input"
                value={temperature}
                onChange={(e) => {
                  setTemperature(parseFloat(e.target.value) || 0.7);
                  setError(null);
                }}
                min={0}
                max={2}
                step={0.1}
              />
              <small className="form-hint">0-2，越高越随机</small>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="secondary-button" onClick={onClose}>
            取消
          </button>
          <button type="button" className="primary-button" onClick={handleSave}>
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
}