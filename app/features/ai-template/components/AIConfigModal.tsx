"use client";

import { useState } from "react";
import type { AITemplateConfig, AIModelInfo, AIConnectionStatus } from "../types";

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AITemplateConfig;
  models: AIModelInfo[];
  connectionStatus: AIConnectionStatus;
  onConfigChange: (updates: Partial<AITemplateConfig>) => void;
  onTestConnection: () => void;
  onClearError: () => void;
}

// 常用 Endpoint 预设（仅作为 UI 层帮助信息，不涉及业务逻辑）
const ENDPOINT_PRESETS = [
  {
    name: "OpenAI",
    endpoint: "https://api.openai.com",
    description: "官方 API，需要 OpenAI API Key",
    icon: "openai",
  },
  {
    name: "DeepSeek",
    endpoint: "https://api.deepseek.com",
    description: "国产大模型，性价比高",
    icon: "deepseek",
  },
  {
    name: "智谱 AI",
    endpoint: "https://open.bigmodel.cn",
    description: "GLM 系列，国产领先",
    icon: "zhipu",
  },
  {
    name: "Moonshot",
    endpoint: "https://api.moonshot.cn",
    description: "Kimi 模型，长文本能力强",
    icon: "moonshot",
  },
  {
    name: "硅基流动",
    endpoint: "https://api.siliconflow.cn",
    description: "多模型聚合平台",
    icon: "siliconflow",
  },
  {
    name: "阿里云百炼",
    endpoint: "https://dashscope.aliyuncs.com/compatible-mode",
    description: "通义千问系列",
    icon: "aliyun",
  },
];

export function AIConfigModal({
  isOpen,
  onClose,
  config,
  models,
  connectionStatus,
  onConfigChange,
  onTestConnection,
  onClearError,
}: AIConfigModalProps) {
  const [activeTab, setActiveTab] = useState<"endpoint" | "model">("endpoint");
  const [showPresets, setShowPresets] = useState(true);

  if (!isOpen) {
    return null;
  }

  const canTest = config.endpoint.trim() !== "" && config.apiKey.trim() !== "";

  const handleSelectPreset = (endpoint: string) => {
    onConfigChange({ endpoint });
    onClearError();
  };

  return (
    <div className="ai-config-modal-overlay" onClick={onClose}>
      <div className="ai-config-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-config-modal-header">
          <div className="ai-config-modal-title-group">
            <div className="ai-config-modal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h2 className="ai-config-modal-title">AI 服务配置</h2>
              <p className="ai-config-modal-subtitle">配置您的 AI 服务以启用智能设计功能</p>
            </div>
          </div>
          <button
            type="button"
            className="ai-config-modal-close"
            onClick={onClose}
            aria-label="关闭"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="ai-config-modal-tabs">
          <button
            type="button"
            className={`ai-config-tab ${activeTab === "endpoint" ? "active" : ""}`}
            onClick={() => setActiveTab("endpoint")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>服务地址</span>
            {connectionStatus.isConnected && (
              <span className="ai-config-tab-badge success">已连接</span>
            )}
          </button>
          <button
            type="button"
            className={`ai-config-tab ${activeTab === "model" ? "active" : ""}`}
            onClick={() => setActiveTab("model")}
            disabled={!connectionStatus.isConnected}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span>模型选择</span>
            {config.model && connectionStatus.isConnected && (
              <span className="ai-config-tab-badge">{config.model.slice(0, 12)}</span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="ai-config-modal-content">
          {activeTab === "endpoint" && (
            <div className="ai-config-section-content">
              {/* Connection Status Card */}
              <div className={`ai-config-status-card ${connectionStatus.isConnected ? "connected" : connectionStatus.isLoading ? "loading" : "disconnected"}`}>
                <div className="ai-config-status-icon">
                  {connectionStatus.isLoading ? (
                    <div className="ai-config-spinner" />
                  ) : connectionStatus.isConnected ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  )}
                </div>
                <div className="ai-config-status-text">
                  <span className="ai-config-status-title">
                    {connectionStatus.isLoading ? "正在测试连接..." : 
                     connectionStatus.isConnected ? "服务已连接" : "等待配置"}
                  </span>
                  <span className="ai-config-status-desc">
                    {connectionStatus.isLoading ? "正在验证您的 API 配置" :
                     connectionStatus.isConnected ? `${models.length} 个模型可用` : 
                     "请填写 Endpoint 和 API Key 后测试连接"}
                  </span>
                </div>
              </div>

              {/* Endpoint Presets - Quick Select */}
              <div className="ai-config-presets-section">
                <button
                  type="button"
                  className="ai-config-presets-toggle"
                  onClick={() => setShowPresets(!showPresets)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  <span>常用服务地址（快速选择）</span>
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    style={{ 
                      width: "16px", 
                      height: "16px",
                      transform: showPresets ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease"
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {showPresets && (
                  <div className="ai-config-presets-grid">
                    {ENDPOINT_PRESETS.map((preset) => (
                      <button
                        key={preset.endpoint}
                        type="button"
                        className={`ai-config-preset-item ${config.endpoint === preset.endpoint ? "selected" : ""}`}
                        onClick={() => handleSelectPreset(preset.endpoint)}
                        title={preset.endpoint}
                      >
                        <div className="ai-config-preset-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M2 12h20" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                          </svg>
                        </div>
                        <div className="ai-config-preset-info">
                          <span className="ai-config-preset-name">{preset.name}</span>
                          <span className="ai-config-preset-desc">{preset.description}</span>
                        </div>
                        {config.endpoint === preset.endpoint && (
                          <span className="ai-config-preset-check">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Endpoint Input */}
              <div className="ai-config-input-group">
                <label className="ai-config-input-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <span>API Endpoint</span>
                </label>
                <div className="ai-config-input-wrapper">
                  <input
                    type="text"
                    className="ai-config-input"
                    placeholder="https://api.openai.com"
                    value={config.endpoint}
                    onChange={(e) => {
                      onConfigChange({ endpoint: e.currentTarget.value });
                      onClearError();
                    }}
                  />
                  <span className="ai-config-input-hint">
                    点击上方预设快速填入，或手动输入自定义地址
                  </span>
                </div>
              </div>

              {/* API Key Input */}
              <div className="ai-config-input-group">
                <label className="ai-config-input-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>API Key</span>
                </label>
                <div className="ai-config-input-wrapper">
                  <input
                    type="password"
                    className="ai-config-input"
                    placeholder="sk-..."
                    value={config.apiKey}
                    onChange={(e) => {
                      onConfigChange({ apiKey: e.currentTarget.value });
                      onClearError();
                    }}
                  />
                  <span className="ai-config-input-hint">
                    从对应服务商官网获取 API Key
                  </span>
                </div>
              </div>

              {/* Help Tips */}
              <div className="ai-config-help-card">
                <div className="ai-config-help-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div className="ai-config-help-content">
                  <span className="ai-config-help-title">如何获取 API Key？</span>
                  <div className="ai-config-help-steps">
                    <p>1. 选择上方服务商或访问其官网</p>
                    <p>2. 注册/登录账号</p>
                    <p>3. 在 API 设置页面创建密钥</p>
                    <p>4. 复制密钥粘贴到此处</p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {connectionStatus.error && (
                <div className="ai-config-error-card">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{connectionStatus.error}</span>
                </div>
              )}

              {/* Test Button */}
              <button
                type="button"
                className={`ai-config-test-button ${connectionStatus.isLoading ? "loading" : ""} ${connectionStatus.isConnected ? "success" : ""}`}
                disabled={!canTest || connectionStatus.isLoading}
                onClick={onTestConnection}
              >
                {connectionStatus.isLoading ? (
                  <>
                    <div className="ai-config-button-spinner" />
                    <span>测试中...</span>
                  </>
                ) : connectionStatus.isConnected ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span>重新测试</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    <span>测试连接</span>
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === "model" && (
            <div className="ai-config-section-content">
              {/* Model Info */}
              <div className="ai-config-model-header">
                <span className="ai-config-model-count">{models.length} 个模型可用</span>
                <span className="ai-config-model-note">模型列表通过 API 动态获取</span>
              </div>

              {/* Model List */}
              <div className="ai-config-model-list">
                {models.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    className={`ai-config-model-item ${config.model === model.id ? "selected" : ""}`}
                    onClick={() => onConfigChange({ model: model.id })}
                  >
                    <div className="ai-config-model-radio">
                      {config.model === model.id && (
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="12" r="6" />
                        </svg>
                      )}
                    </div>
                    <div className="ai-config-model-info">
                      <span className="ai-config-model-name">{model.name ?? model.id}</span>
                      <span className="ai-config-model-id">{model.id}</span>
                    </div>
                    {config.model === model.id && (
                      <span className="ai-config-model-selected-badge">已选择</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Model Input */}
              <div className="ai-config-custom-model">
                <label className="ai-config-input-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span>手动输入模型名称</span>
                </label>
                <input
                  type="text"
                  className="ai-config-input"
                  placeholder="输入模型 ID..."
                  value={config.model}
                  onChange={(e) => onConfigChange({ model: e.currentTarget.value })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="ai-config-modal-footer">
          <div className="ai-config-modal-footer-info">
            {connectionStatus.isConnected && config.model && (
              <span className="ai-config-ready-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                配置完成，可开始使用
              </span>
            )}
          </div>
          <button
            type="button"
            className="ai-config-done-button"
            onClick={onClose}
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}