"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Scene } from "@/app/lib/scene";
import type { TemplateSource } from "../types";
import { useAIConnection } from "../hooks/useAIConnection";
import { useAITemplateGenerator } from "../hooks/useAITemplateGenerator";
import { useGenerationProgress } from "../hooks/useGenerationProgress";
import { AIConfigModal } from "./AIConfigModal";
import { AITemplatePreview } from "./AITemplatePreview";
import { GenerationWorkflow } from "./GenerationWorkflow";
import type { CustomSceneTemplate } from "@/app/hooks/useTemplateManager";

interface AITemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentScene: Scene;
  canvasWidth: number;
  canvasHeight: number;
  activeTemplateId: string;
  customTemplates: CustomSceneTemplate[];
  onApplyScene: (scene: Scene) => void;
  onOpenSaveTemplateDialog: (scene: Scene, defaultName?: string) => void;
}

export function AITemplateDialog({
  isOpen,
  onClose,
  currentScene,
  canvasWidth,
  canvasHeight,
  activeTemplateId,
  customTemplates,
  onApplyScene,
  onOpenSaveTemplateDialog,
}: AITemplateDialogProps) {
  const [templateSource, setTemplateSource] = useState<TemplateSource>("current");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [userPrompt, setUserPrompt] = useState("");
  const [showConfigModal, setShowConfigModal] = useState(false);

  // 自动滚动相关
  const dialogBodyRef = useRef<HTMLDivElement>(null);
  const isUserAtBottomRef = useRef(true);

  const {
    config,
    models,
    connectionStatus,
    setConfig,
    testConnection,
    clearError: clearConnectionError,
  } = useAIConnection();

  const {
    generateStatus,
    generatedScene,
    generateTemplate,
    applyGeneratedScene,
    resetGeneratedScene,
    clearError: clearGenerateError,
  } = useAITemplateGenerator();

  const {
    progress,
    updateStage,
    setError,
    start,
    complete,
    reset: resetProgress,
  } = useGenerationProgress();

  useEffect(() => {
    if (isOpen) {
      setUserPrompt("");
      resetGeneratedScene();
      resetProgress();
      setSelectedTemplateId(null);
      setTemplateSource("current");
      isUserAtBottomRef.current = true;
    }
  }, [isOpen, resetGeneratedScene, resetProgress]);

  // 检测用户滚动位置
  useEffect(() => {
    const dialogBody = dialogBodyRef.current;
    if (!dialogBody) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = dialogBody;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      isUserAtBottomRef.current = isAtBottom;
    };

    dialogBody.addEventListener("scroll", handleScroll);
    return () => dialogBody.removeEventListener("scroll", handleScroll);
  }, []);

  // 当新内容出现时，如果用户在底部，自动滚动到底部
  useEffect(() => {
    const dialogBody = dialogBodyRef.current;
    if (!dialogBody || !isUserAtBottomRef.current) return;

    // 当生成完成、预览出现时，滚动到底部
    if (progress.currentStage === "completed" || generatedScene) {
      dialogBody.scrollTop = dialogBody.scrollHeight;
    }
  }, [progress.currentStage, generatedScene]);

  const getSelectedScene = useCallback((): Scene => {
    if (templateSource === "current") {
      return currentScene;
    }

    if (templateSource === "custom") {
      const template = customTemplates.find((t) => t.id === selectedTemplateId);
      return template?.scene ?? currentScene;
    }

    return currentScene;
  }, [templateSource, selectedTemplateId, currentScene, customTemplates]);

  const getTemplateName = useCallback((): string | undefined => {
    if (templateSource === "current") {
      return "当前画布";
    }

    if (templateSource === "custom") {
      const template = customTemplates.find((t) => t.id === selectedTemplateId);
      return template?.name;
    }

    return undefined;
  }, [templateSource, selectedTemplateId, customTemplates]);

  const handleGenerate = useCallback(async () => {
    const scene = getSelectedScene();
    const templateName = getTemplateName();
    start();
    try {
      await generateTemplate(
        config,
        userPrompt,
        scene,
        canvasWidth,
        canvasHeight,
        templateName,
        {
          onStageChange: (stage) => {
            updateStage(stage);
          },
        }
      );
      complete();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "生成失败";
      setError(errorMessage);
    }
  }, [config, userPrompt, getSelectedScene, getTemplateName, generateTemplate, start, setError, complete, updateStage, canvasWidth, canvasHeight]);

  const handleApply = useCallback(() => {
    const scene = applyGeneratedScene();
    if (scene) {
      onApplyScene(scene);
      onClose();
    }
  }, [applyGeneratedScene, onApplyScene, onClose]);

  const handleRegenerate = useCallback(async () => {
    const scene = getSelectedScene();
    const templateName = getTemplateName();
    resetGeneratedScene();
    resetProgress();
    start();
    try {
      await generateTemplate(
        config,
        userPrompt,
        scene,
        canvasWidth,
        canvasHeight,
        templateName,
        {
          onStageChange: (stage) => {
            updateStage(stage);
          },
        }
      );
      complete();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "生成失败";
      setError(errorMessage);
    }
  }, [config, userPrompt, getSelectedScene, getTemplateName, generateTemplate, start, setError, complete, resetProgress, updateStage, resetGeneratedScene, canvasWidth, canvasHeight]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleOpenSaveTemplateDialog = useCallback(() => {
    if (!generatedScene) {
      return;
    }
    const sourceName = getTemplateName() ?? "AI优化模板";
    onOpenSaveTemplateDialog(generatedScene, `${sourceName} 副本`);
  }, [generatedScene, getTemplateName, onOpenSaveTemplateDialog]);

  const canGenerate =
    connectionStatus.isConnected &&
    config.model.trim() !== "" &&
    userPrompt.trim() !== "" &&
    !generateStatus.isGenerating;

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="ai-dialog-overlay" onClick={onClose}>
        <div className="ai-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="ai-dialog-header">
            <div className="ai-dialog-header-title-group">
              <div className="ai-dialog-header-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                  <circle cx="12" cy="12" r="6" />
                </svg>
              </div>
              <div>
                <h2 className="ai-dialog-title">AI 优化设计图</h2>
                <p className="ai-dialog-subtitle">使用 AI 智能优化您的直播背景设计</p>
              </div>
            </div>
            <button
              type="button"
              className="ai-dialog-close"
              onClick={onClose}
              aria-label="关闭"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="ai-dialog-body" ref={dialogBodyRef}>
            {/* Template Selection */}
            <div className="ai-dialog-section">
              <h3 className="ai-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
                <span>选择模板</span>
              </h3>
              <div className="ai-template-source-selector">
                <button
                  type="button"
                  className={`ai-source-button ${templateSource === "current" ? "active" : ""}`}
                  onClick={() => setTemplateSource("current")}
                  disabled={generateStatus.isGenerating}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 21V9" />
                  </svg>
                  <span>当前模板</span>
                </button>
                <button
                  type="button"
                  className={`ai-source-button ${templateSource === "custom" ? "active" : ""}`}
                  onClick={() => setTemplateSource("custom")}
                  disabled={generateStatus.isGenerating}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                  <span>自定义模板</span>
                </button>
              </div>

              {templateSource === "custom" && (
                <div className="ai-template-list">
                  {customTemplates.length === 0 && (
                    <div className="ai-template-empty">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                        <polyline points="13 2 13 9 20 9" />
                      </svg>
                      <span>暂无自定义模板</span>
                    </div>
                  )}
                  {customTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className={`ai-template-item ${selectedTemplateId === template.id ? "active" : ""}`}
                      onClick={() => setSelectedTemplateId(template.id)}
                      disabled={generateStatus.isGenerating}
                    >
                      <span className="ai-template-item-name">{template.name}</span>
                      <span className="ai-template-item-desc">
                        {template.updatedAt ?? template.createdAt}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Prompt Input */}
            <div className="ai-dialog-section">
              <h3 className="ai-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>修改要求</span>
              </h3>
              <textarea
                className="ai-prompt-input"
                placeholder="例如：将背景颜色改为深蓝色，标题字体放大到 60px，添加一个圆角矩形作为底部按钮区域..."
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.currentTarget.value)}
                rows={5}
                disabled={generateStatus.isGenerating}
              />
            </div>

            {/* AI Config Status */}
            <div className="ai-dialog-section">
              <h3 className="ai-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span>AI 服务</span>
              </h3>
              
              <div className="ai-config-status-row">
                <div className={`ai-config-status-indicator ${connectionStatus.isConnected ? "connected" : "disconnected"}`}>
                  <div className="ai-config-status-dot" />
                  <span>
                    {connectionStatus.isConnected 
                      ? `已连接 · ${config.model || "未选择模型"}` 
                      : "未配置"}
                  </span>
                </div>
                <button
                  type="button"
                  className="ai-config-open-button"
                  onClick={() => setShowConfigModal(true)}
                  disabled={generateStatus.isGenerating}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v6m0 6v10M4.22 4.22l4.24 4.24m7.08 7.08l4.24 4.24M1 12h6m6 0h10M4.22 19.78l4.24-4.24m7.08-7.08l4.24-4.24" />
                  </svg>
                  <span>{connectionStatus.isConnected ? "修改配置" : "配置服务"}</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {generateStatus.error && !generateStatus.isGenerating && (
              <div className="ai-error-message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>{generateStatus.error}</span>
              </div>
            )}

            {/* Generation Workflow - Show during and after generation */}
            {(generateStatus.isGenerating || (generatedScene && progress.currentStage === "completed")) && (
              <GenerationWorkflow progress={progress} />
            )}

            {/* Preview - Show below workflow after generation completes */}
            {generatedScene && !generateStatus.isGenerating && progress.currentStage === "completed" && (
              <>
                {/* Preview */}
                <div className="ai-preview-section">
                  <h3 className="ai-section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span>生成结果预览</span>
                  </h3>
                  <AITemplatePreview
                    scene={generatedScene}
                    isGenerating={false}
                  />
                </div>
              </>
            )}
          </div>

          <div className="ai-dialog-footer">
            {generateStatus.isGenerating ? (
              <>
                <button
                  type="button"
                  className="ai-cancel-button"
                  onClick={handleCancel}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="ai-generate-button"
                  disabled
                >
                  <div className="ai-button-spinner" />
                  <span>生成中...</span>
                </button>
              </>
            ) : !generatedScene ? (
              <>
                <button
                  type="button"
                  className="ai-cancel-button"
                  onClick={handleCancel}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="ai-generate-button"
                  disabled={!canGenerate}
                  onClick={handleGenerate}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  <span>生成设计</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="ai-cancel-button"
                  onClick={handleCancel}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="ai-regenerate-button"
                  onClick={handleRegenerate}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 4v6h6" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                  <span>重新生成</span>
                </button>
                <button
                  type="button"
                  className="ai-save-template-toggle-button"
                  disabled={!generatedScene}
                  onClick={handleOpenSaveTemplateDialog}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                  <span>另存为新模板</span>
                </button>
                <button
                  type="button"
                  className="ai-apply-button"
                  disabled={!generatedScene}
                  onClick={handleApply}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>应用到画布</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* AI Config Modal */}
      <AIConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        config={config}
        models={models}
        connectionStatus={connectionStatus}
        onConfigChange={setConfig}
        onTestConnection={testConnection}
        onClearError={clearConnectionError}
      />
    </>
  );
}