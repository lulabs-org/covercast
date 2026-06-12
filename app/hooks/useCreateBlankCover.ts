import { useState, useCallback } from "react";
import {
  createEmptyScene,
  createSceneFromTemplate,
  cloneScene,
  BUILT_IN_TEMPLATES,
  type Scene,
} from "../lib/scene";
import { selectSingle, createSelectionState, type SelectionState } from "../lib/selection";
import type { CanvasSizePreset, CanvasSize } from "./useCanvasSize";
import type { CustomSceneTemplate } from "./useTemplateManager";

export type BlankCoverConfig = {
  coverName: string;
  backgroundColor: string;
  backgroundOpacity: number;
  canvasSize: CanvasSize;
  templateId: string;
};

const DEFAULT_CONFIG: BlankCoverConfig = {
  coverName: "",
  backgroundColor: "#1e293b",
  backgroundOpacity: 1,
  canvasSize: { width: 941, height: 1672 },
  templateId: "empty",
};

type UseCreateBlankCoverOptions = {
  setScene: (scene: Scene) => void;
  setSelection: (value: SelectionState | ((prev: SelectionState) => SelectionState)) => void;
  setCanvasSize: (size: CanvasSize) => void;
  setActiveTemplateId: (id: string) => void;
  setStatus: (status: string) => void;
  saveCustomTemplate: (name: string, scene: Scene) => void;
  canvasSizePresets: CanvasSizePreset[];
  customTemplates: CustomSceneTemplate[];
};

export function useCreateBlankCover(options: UseCreateBlankCoverOptions) {
  const {
    setScene,
    setSelection,
    setCanvasSize,
    setStatus,
    saveCustomTemplate,
    canvasSizePresets,
    customTemplates,
  } = options;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [config, setConfig] = useState<BlankCoverConfig>(DEFAULT_CONFIG);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setConfig(DEFAULT_CONFIG);
  }, []);

  const updateConfig = useCallback((updates: Partial<BlankCoverConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const createBlankCover = useCallback(() => {
    // Create scene based on template selection
    let newScene: Scene;
    
    if (config.templateId === "empty") {
      newScene = createEmptyScene();
    } else {
      // Check if it's a custom template
      const customTemplate = customTemplates.find(t => t.id === config.templateId);
      if (customTemplate) {
        newScene = cloneScene(customTemplate.scene);
      } else {
        newScene = createSceneFromTemplate(config.templateId);
      }
    }

    // Apply custom background color and opacity
    newScene = {
      ...newScene,
      backgroundColor: config.backgroundColor,
      backgroundOpacity: config.backgroundOpacity,
    };

    // Apply canvas size
    setCanvasSize(config.canvasSize);

    // Set the scene
    setScene(newScene);

    // Clear selection or select first element if exists
    if (newScene.elements.length > 0 && newScene.elements[0].id) {
      setSelection(selectSingle(createSelectionState(), newScene.elements[0].id));
    } else {
      setSelection(createSelectionState());
    }

    // Save as custom template
    const coverName = config.coverName.trim() || `新封面`;
    saveCustomTemplate(coverName, newScene);

    // Update status
    setStatus(`已创建「${coverName}」，尺寸 ${config.canvasSize.width}×${config.canvasSize.height}`);

    // Close modal
    closeModal();
  }, [config, customTemplates, setScene, setSelection, setCanvasSize, setStatus, saveCustomTemplate, closeModal]);

  const presetOptions = canvasSizePresets.map((preset) => ({
    id: preset.id,
    label: preset.label,
    width: preset.width,
    height: preset.height,
    ratio: preset.ratio,
  }));

  // Combine built-in templates and custom templates
  const templateOptions = [
    ...BUILT_IN_TEMPLATES.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
    })),
    ...customTemplates.map((template) => ({
      id: template.id,
      name: template.name,
      description: "自定义模板",
    })),
  ];

  return {
    isModalOpen,
    config,
    openModal,
    closeModal,
    updateConfig,
    createBlankCover,
    presetOptions,
    templateOptions,
  };
}