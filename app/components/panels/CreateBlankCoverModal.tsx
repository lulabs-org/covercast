"use client";

import { useState, useCallback, type ChangeEvent } from "react";
import { createPortal } from "react-dom";
import type { BlankCoverConfig } from "../../hooks/useCreateBlankCover";

type PresetOption = {
  id: string;
  label: string;
  width: number;
  height: number;
  ratio: string;
};

type TemplateOption = {
  id: string;
  name: string;
  description: string;
};

type CreateBlankCoverModalProps = {
  isOpen: boolean;
  config: BlankCoverConfig;
  presetOptions: PresetOption[];
  templateOptions: TemplateOption[];
  onUpdateConfig: (updates: Partial<BlankCoverConfig>) => void;
  onCreate: () => void;
  onCancel: () => void;
};

export function CreateBlankCoverModal({
  isOpen,
  config,
  presetOptions,
  templateOptions,
  onUpdateConfig,
  onCreate,
  onCancel,
}: CreateBlankCoverModalProps) {
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [isCustomSize, setIsCustomSize] = useState(false);

  // Check if current size matches a preset
  const currentPresetId = presetOptions.find(
    (p) => p.width === config.canvasSize.width && p.height === config.canvasSize.height
  )?.id ?? "";

  const handleSizeSelectChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;

      if (value === "custom") {
        setIsCustomSize(true);
        setCustomWidth(config.canvasSize.width.toString());
        setCustomHeight(config.canvasSize.height.toString());
      } else {
        const preset = presetOptions.find((p) => p.id === value);
        if (preset) {
          setIsCustomSize(false);
          onUpdateConfig({
            canvasSize: { width: preset.width, height: preset.height },
          });
        }
      }
    },
    [presetOptions, config.canvasSize, onUpdateConfig]
  );

  const handleApplyCustomSize = useCallback(() => {
    const width = parseInt(customWidth, 10);
    const height = parseInt(customHeight, 10);

    if (width > 0 && height > 0) {
      onUpdateConfig({
        canvasSize: { width: Math.max(100, width), height: Math.max(100, height) },
      });
    }
  }, [customWidth, customHeight, onUpdateConfig]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        handleApplyCustomSize();
      }
    },
    [handleApplyCustomSize]
  );

  const handleBackgroundColorChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onUpdateConfig({ backgroundColor: event.target.value });
    },
    [onUpdateConfig]
  );

  const handleBackgroundOpacityChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onUpdateConfig({ backgroundOpacity: Number(event.target.value) });
    },
    [onUpdateConfig]
  );

  const handleTemplateChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      onUpdateConfig({ templateId: event.target.value });
    },
    [onUpdateConfig]
  );

  if (!isOpen) {
    return null;
  }

  const selectedSizeValue = isCustomSize ? "custom" : currentPresetId;
  const colorValue = isHexColor(config.backgroundColor) ? config.backgroundColor : "#1e293b";
  const opacity = clamp(config.backgroundOpacity, 0, 1);

  const modalContent = (
    <div className="modal-overlay" onClick={onCancel}>
      <section
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        aria-label="新建封面"
      >
        <header className="modal-header">
          <h2>新建封面</h2>
          <button
            type="button"
            className="modal-close-button"
            onClick={onCancel}
            aria-label="关闭"
          >
            ×
          </button>
        </header>

        <div className="modal-body">
          <div className="modal-section">
            <h3>基本信息</h3>
            <label className="field">
              <span>封面名称</span>
              <input
                type="text"
                value={config.coverName}
                onChange={(e) => onUpdateConfig({ coverName: e.target.value })}
                placeholder="输入封面名称"
              />
            </label>
          </div>

          <div className="modal-section">
            <h3>引用模板</h3>
            <label className="field">
              <span>选择模板</span>
              <select value={config.templateId} onChange={handleTemplateChange}>
                {templateOptions.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.description}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="modal-section">
            <h3>封面尺寸</h3>
            <label className="field">
              <span>预设尺寸</span>
              <select value={selectedSizeValue} onChange={handleSizeSelectChange}>
                {presetOptions.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label} ({preset.ratio})
                  </option>
                ))}
                <option value="custom">自定义尺寸</option>
              </select>
            </label>

            {isCustomSize && (
              <div className="custom-size-row">
                <input
                  type="number"
                  className="size-input"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="宽度"
                  min={100}
                  max={4096}
                />
                <span className="size-separator">×</span>
                <input
                  type="number"
                  className="size-input"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="高度"
                  min={100}
                  max={4096}
                />
                <button
                  type="button"
                  className="apply-button"
                  onClick={handleApplyCustomSize}
                >
                  应用
                </button>
              </div>
            )}
          </div>

          <div className="modal-section">
            <h3>背景设置</h3>
            <label className="field color-field">
              <span>背景颜色</span>
              <div>
                <input
                  type="color"
                  value={colorValue}
                  onChange={handleBackgroundColorChange}
                />
                <input
                  type="text"
                  value={config.backgroundColor}
                  onChange={handleBackgroundColorChange}
                  placeholder="#1e293b"
                />
              </div>
            </label>

            <label className="field opacity-field">
              <span>背景透明度</span>
              <div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={opacity}
                  onChange={handleBackgroundOpacityChange}
                />
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={opacity.toFixed(2)}
                  onChange={handleBackgroundOpacityChange}
                />
              </div>
            </label>
          </div>
        </div>

        <footer className="modal-footer">
          <button
            type="button"
            className="primary-button"
            onClick={onCreate}
          >
            创建封面
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
          >
            取消
          </button>
        </footer>
      </section>
    </div>
  );

  return createPortal(modalContent, document.body);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}