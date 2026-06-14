import { useState, useCallback } from 'react'
import { cloneScene, type Scene } from '@/lib/domain/scene'
import { createEmptyScene, createSceneFromTemplate, BUILT_IN_TEMPLATES } from '@/lib/templates'
import { selectSingle, createSelectionState } from '@/lib/domain/selection'
import type { CanvasSize, CanvasSizePreset } from '@/stores/useCanvasStore'
import type { CustomSceneTemplate } from '@/stores/useTemplateStore'
import { useSceneStore } from '@/stores/useSceneStore'

export type BlankCoverConfig = {
  coverName: string
  backgroundColor: string
  backgroundOpacity: number
  canvasSize: CanvasSize
  templateId: string
}

const DEFAULT_CONFIG: BlankCoverConfig = {
  coverName: '',
  backgroundColor: '#1e293b',
  backgroundOpacity: 1,
  canvasSize: { width: 941, height: 1672 },
  templateId: 'empty',
}

type UseCreateBlankCoverOptions = {
  setCanvasSize: (size: CanvasSize) => void
  setActiveTemplateId: (id: string) => void
  setStatus: (status: string) => void
  saveCustomTemplate: (name: string, scene: Scene) => void
  canvasSizePresets: CanvasSizePreset[]
  customTemplates: CustomSceneTemplate[]
}

export function useCreateBlankCover(options: UseCreateBlankCoverOptions) {
  const { setCanvasSize, setStatus, saveCustomTemplate, canvasSizePresets, customTemplates } =
    options

  // ── 直接从 SceneStore 获取 setter ──
  const setScene = useSceneStore((s) => s.setScene)
  const setSelection = useSceneStore((s) => s.setSelection)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [config, setConfig] = useState<BlankCoverConfig>(DEFAULT_CONFIG)

  const openModal = useCallback(() => {
    setIsModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setConfig(DEFAULT_CONFIG)
  }, [])

  const updateConfig = useCallback((updates: Partial<BlankCoverConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }))
  }, [])

  const createBlankCover = useCallback(() => {
    // Create scene based on template selection
    let newScene: Scene

    if (config.templateId === 'empty') {
      newScene = createEmptyScene()
    } else {
      // Check if it's a custom template
      const customTemplate = customTemplates.find((t) => t.id === config.templateId)
      if (customTemplate) {
        newScene = cloneScene(customTemplate.scene)
      } else {
        newScene = createSceneFromTemplate(config.templateId)
      }
    }

    // Apply custom background color and opacity
    newScene = {
      ...newScene,
      backgroundColor: config.backgroundColor,
      backgroundOpacity: config.backgroundOpacity,
    }

    // Apply canvas size
    setCanvasSize(config.canvasSize)

    // Set the scene
    setScene(newScene)

    // Clear selection or select first element if exists
    if (newScene.elements.length > 0 && newScene.elements[0].id) {
      setSelection(selectSingle(createSelectionState(), newScene.elements[0].id))
    } else {
      setSelection(createSelectionState())
    }

    // Save as custom template
    const coverName = config.coverName.trim() || `新封面`
    saveCustomTemplate(coverName, newScene)

    // Update status
    setStatus(`已创建「${coverName}」，尺寸 ${config.canvasSize.width}×${config.canvasSize.height}`)

    // Close modal
    closeModal()
  }, [
    config,
    customTemplates,
    setScene,
    setSelection,
    setCanvasSize,
    setStatus,
    saveCustomTemplate,
    closeModal,
  ])

  const presetOptions = canvasSizePresets.map((preset) => ({
    id: preset.id,
    label: preset.label,
    width: preset.width,
    height: preset.height,
    ratio: preset.ratio,
  }))

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
      description: '自定义模板',
    })),
  ]

  return {
    isModalOpen,
    config,
    openModal,
    closeModal,
    updateConfig,
    createBlankCover,
    presetOptions,
    templateOptions,
  }
}
