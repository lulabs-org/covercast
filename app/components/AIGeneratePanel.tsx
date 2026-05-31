"use client";

import { useState } from "react";
import type { AIConfig } from "../lib/ai-config";
import type { Scene } from "../lib/scene";
import { BUILT_IN_TEMPLATES } from "../lib/scene";

type CustomTemplate = {
  id: string;
  name: string;
  scene: Scene;
};

type AIGeneratePanelProps = {
  isOpen: boolean;
  onClose: () => void;
  aiConfig: AIConfig | null;
  currentScene: Scene;
  customTemplates?: CustomTemplate[];
  onOpenConfig: () => void;
  onGenerate: (scene: Scene) => void;
};

type TemplateOption = {
  label: string;
  value: string;
  scene: Scene;
  group?: string;
};

export default function AIGeneratePanel({
  isOpen,
  onClose,
  aiConfig,
  currentScene,
  customTemplates = [],
  onOpenConfig,
  onGenerate,
}: AIGeneratePanelProps) {
  const templateOptions: TemplateOption[] = [
    { label: "当前编辑的场景", value: "current", scene: currentScene, group: "当前" },
    ...BUILT_IN_TEMPLATES.map((t) => ({
      label: t.name,
      value: t.id,
      scene: t.scene,
      group: "内置模版",
    })),
    ...customTemplates.map((t) => ({
      label: t.name,
      value: t.id,
      scene: t.scene,
      group: "自定义模版",
    })),
  ];

  const [selectedTemplate, setSelectedTemplate] = useState<string>("current");
  const [modification, setModification] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedScene, setGeneratedScene] = useState<Scene | null>(null);

  const selectedScene = templateOptions.find((t) => t.value === selectedTemplate)?.scene ?? currentScene;

  async function handleGenerate() {
    if (!aiConfig) {
      onOpenConfig();
      return;
    }

    if (!modification.trim()) {
      setError("请输入修改需求");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedScene(null);

    try {
      const response = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: selectedScene,
          modification: modification.trim(),
          provider: aiConfig.provider,
          apiKey: aiConfig.apiKey,
          apiEndpoint: aiConfig.apiEndpoint,
          modelName: aiConfig.modelName,
          maxTokens: aiConfig.maxTokens,
          temperature: aiConfig.temperature,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "修改失败");
      }

      setGeneratedScene(data.scene);
    } catch (err) {
      const message = err instanceof Error ? err.message : "修改场景失败";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleApply() {
    if (generatedScene) {
      onGenerate(generatedScene);
      setGeneratedScene(null);
      setModification("");
      onClose();
    }
  }

  function handleCancel() {
    setGeneratedScene(null);
    onClose();
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content ai-generate-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>AI 修改场景</h2>
          <button type="button" className="modal-close" onClick={handleCancel}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {!aiConfig && (
            <div className="warning-message">
              请先配置 AI API
              <button type="button" className="secondary-button small" onClick={onOpenConfig}>
                配置
              </button>
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">选择模版</label>
            <select
              className="form-select"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              disabled={isGenerating}
            >
              <optgroup label="当前">
                <option value="current">当前编辑的场景</option>
              </optgroup>
              <optgroup label="内置模版">
                {BUILT_IN_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
              {customTemplates.length > 0 && (
                <optgroup label="自定义模版">
                  {customTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <small className="form-hint">
              {selectedTemplate === "current" 
                ? `当前场景包含 ${currentScene.elements.length} 个元素` 
                : `${templateOptions.find(t => t.value === selectedTemplate)?.group || "模版"}，包含 ${selectedScene.elements.length} 个元素`}
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">修改需求</label>
            <textarea
              className="form-textarea"
              value={modification}
              onChange={(e) => setModification(e.target.value)}
              placeholder="描述你想要的修改，例如：&#10;&#10;把背景颜色改成深蓝色&#10;增加一个标题文字 课程预告&#10;把左侧视频框改成圆形&#10;删除底部的讲师介绍区域&#10;&#10;AI 会根据你的需求修改选定的模版。"
              rows={6}
              disabled={isGenerating}
            />
            <small className="form-hint">
              详细描述你想要的修改内容
            </small>
          </div>

          <div className="ai-actions">
            <button
              type="button"
              className="primary-button"
              onClick={handleGenerate}
              disabled={isGenerating || !modification.trim()}
            >
              {isGenerating ? "修改中..." : "修改场景"}
            </button>
          </div>

          {generatedScene && (
            <div className="generated-preview">
              <h3>修改结果预览</h3>
              <div className="preview-json">
                <pre>{JSON.stringify(generatedScene, null, 2)}</pre>
              </div>
              <div className="preview-actions">
                <button type="button" className="primary-button" onClick={handleApply}>
                  采用此方案
                </button>
                <button type="button" className="secondary-button" onClick={() => setGeneratedScene(null)}>
                  重新修改
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}