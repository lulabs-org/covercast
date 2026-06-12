"use client";

import { useState, useCallback, type ChangeEvent } from "react";
import { createPortal } from "react-dom";
import type { BlankCoverConfig } from "../../hooks/useCreateBlankCover";


type TemplateOption = {
  id: string;
  name: string;
  description: string;
};

type PresetOption = {
  id: string;
  label: string;
  width: number;
  height: number;
  ratio: string;
};

type CreateBlankCoverModalProps = {
  isOpen: boolean;
  config: BlankCoverConfig;
  presetOptions: PresetOption[];
  templateOptions: TemplateOption[];
  onCancel: () => void;
  onConfirm: () => void;
  onUpdateConfig: (updates: Partial<BlankCoverConfig>) => void;
};

function isHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function CreateBlankCoverModal({
  isOpen,
  config,
  presetOptions,
  templateOptions,
  onCancel,
  onConfirm,
  onUpdateConfig,
}: CreateBlankCoverModalProps) {
  const [isCustomSize, setIsCustomSize] = useState(false);
  const [currentPresetId, setCurrentPresetId] = useState("vertical_16_9");

  const handleTemplateChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      onUpdateConfig({ templateId: e.target.value });
    },
    [onUpdateConfig]
  );

  const handlePresetChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (value === "custom") {
        setIsCustomSize(true);
      } else {
        setIsCustomSize(false);
        setCurrentPresetId(value);
        const preset = presetOptions.find((p) => p.id === value);
        if (preset) {
          onUpdateConfig({
            canvasSize: { width: preset.width, height: preset.height },
          });
        }
      }
    },
    [presetOptions, onUpdateConfig]
  );

  const handleWidthChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const width = parseInt(e.target.value, 10);
      if (!isNaN(width) && width > 0) {
        onUpdateConfig({
          canvasSize: { ...config.canvasSize, width },
        });
      }
    },
    [config.canvasSize, onUpdateConfig]
  );

  const handleHeightChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const height = parseInt(e.target.value, 10);
      if (!isNaN(height) && height > 0) {
        onUpdateConfig({
          canvasSize: { ...config.canvasSize, height },
        });
      }
    },
    [config.canvasSize, onUpdateConfig]
  );

  const handleColorChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onUpdateConfig({ backgroundColor: e.target.value });
    },
    [onUpdateConfig]
  );

  const handleOpacityChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const opacity = parseFloat(e.target.value);
      if (!isNaN(opacity)) {
        onUpdateConfig({ backgroundOpacity: clamp(opacity, 0, 1) });
      }
    },
    [onUpdateConfig]
  );

  const handleCoverNameChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onUpdateConfig({ coverName: e.target.value });
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
                onChange={handleCoverNameChange}
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
              <select value={selectedSizeValue} onChange={handlePresetChange}>
                {presetOptions.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label} ({preset.width}×{preset.height})
                  </option>
                ))}
                <option value="custom">自定义尺寸</option>
              </select>
            </label>

            {isCustomSize && (
              <div className="custom-size-fields">
                <label className="field">
                  <span>宽度</span>
                  <input
                    type="number"
                    value={config.canvasSize.width}
                    onChange={handleWidthChange}
                    min={1}
                  />
                </label>
                <label className="field">
                  <span>高度</span>
                  <input
                    type="number"
                    value={config.canvasSize.height}
                    onChange={handleHeightChange}
                    min={1}
                  />
                </label>
              </div>
            )}
          </div>

          <div className="modal-section">
            <h3>背景设置</h3>
            <label className="field">
              <span>背景颜色</span>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value={colorValue}
                  onChange={handleColorChange}
                />
                <input
                  type="text"
                  value={config.backgroundColor}
                  onChange={handleColorChange}
                  placeholder="#1e293b"
                />
              </div>
            </label>
            <label className="field">
              <span>不透明度</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={opacity}
                onChange={handleOpacityChange}
              />
              <span className="opacity-value">{Math.round(opacity * 100)}%</span>
            </label>
          </div>
        </div>

        <footer className="modal-footer">
          <button type="button" className="secondary-button" onClick={onCancel}>
            取消
          </button>
          <button type="button" className="primary-button" onClick={onConfirm}>
            创建
          </button>
        </footer>
      </section>
    </div>
  );

  return createPortal(modalContent, document.body);
}