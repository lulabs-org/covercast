'use client'

import { useCreateBlankCover } from './useCreateBlankCover'
import { useSaveTemplateDialog } from './useSaveTemplateDialog'
import { useExportScene } from './useExportScene'
import { useSceneStore } from '@/stores/useSceneStore'
import { useSceneConfigStore } from '@/stores/useSceneConfigStore'
import { useCanvasUIStore } from '@/stores/useCanvasUIStore'
import { useTemplateStore } from '@/stores/useTemplateStore'
import {
  saveCustomTemplateWithNameAction,
  saveCustomTemplateWithSceneAction,
  exportTemplateJsonAction,
} from '@/stores/template-commands'

/**
 * 对话框/模态框状态：新建封面 + 保存模板 + 导出。
 * 仅由 SceneEditor 使用，不需要 Context 共享。
 */
export function useDialogState() {
  // ── Scene Store ──
  const scene = useSceneStore((s) => s.scene)

  // ── Canvas UI Store ──
  const setStatus = useCanvasUIStore((s) => s.setStatus)

  // ── Scene Config Store ──
  const canvasSize = useSceneConfigStore((s) => s.canvasSize)
  const presets = useSceneConfigStore((s) => s.presets)
  const setCanvasSize = useSceneConfigStore((s) => s.setCanvasSize)

  // ── Template Store ──
  const customTemplates = useTemplateStore((s) => s.customTemplates)
  const setActiveTemplateId = useTemplateStore((s) => s.setActiveTemplateId)
  const getActiveTemplate = useTemplateStore((s) => s.getActiveTemplate)

  // ── Export ──
  const { exportScene } = useExportScene(
    scene,
    setStatus,
    exportTemplateJsonAction,
    canvasSize.width,
    canvasSize.height,
  )

  // ── Create blank cover ──
  const {
    isModalOpen: isCreateBlankCoverModalOpen,
    config: createBlankCoverConfig,
    openModal: openCreateBlankCoverModal,
    closeModal: closeCreateBlankCoverModal,
    updateConfig: updateCreateBlankCoverConfig,
    createBlankCover,
    presetOptions: createBlankCoverPresetOptions,
    templateOptions: createBlankCoverTemplateOptions,
  } = useCreateBlankCover({
    setCanvasSize,
    setActiveTemplateId,
    setStatus,
    saveCustomTemplate: saveCustomTemplateWithSceneAction,
    canvasSizePresets: presets,
    customTemplates,
  })

  // ── Save template dialog ──
  const saveTemplateDialog = useSaveTemplateDialog({
    customTemplates,
    onSave: saveCustomTemplateWithNameAction,
  })

  // ── Handlers ──
  function handleOpenSaveTemplateDialog() {
    saveTemplateDialog.openDialog(getActiveTemplate()?.name)
  }

  return {
    // Export
    exportScene,
    handleOpenSaveTemplateDialog,

    // Blank cover
    isCreateBlankCoverModalOpen,
    createBlankCoverConfig,
    openCreateBlankCoverModal,
    closeCreateBlankCoverModal,
    updateCreateBlankCoverConfig,
    createBlankCover,
    createBlankCoverPresetOptions,
    createBlankCoverTemplateOptions,

    // Save template dialog
    saveTemplateDialog,
  }
}
