'use client'

import { useCreateBlankCover } from './useCreateBlankCover'
import { useSaveTemplateDialog } from './useSaveTemplateDialog'
import { useExportScene } from './useExportScene'
import { useEditorStore } from '@/stores/useEditorStore'

/**
 * 对话框/模态框状态：新建封面 + 保存模板 + 导出。
 * 仅由 SceneEditor 使用，不需要 Context 共享。
 */
export function useDialogState() {
  // ── Editor Store ──
  const scene = useEditorStore((s) => s.scene)
  const setStatus = useEditorStore((s) => s.setStatus)
  const canvasSize = useEditorStore((s) => s.canvasSize)
  const presets = useEditorStore((s) => s.presets)
  const setCanvasSize = useEditorStore((s) => s.setCanvasSize)
  const customTemplates = useEditorStore((s) => s.customTemplates)
  const setActiveTemplateId = useEditorStore((s) => s.setActiveTemplateId)
  const saveCustomTemplateWithNameAction = useEditorStore((s) => s.saveCustomTemplateWithNameAction)
  const saveCustomTemplateWithSceneAction = useEditorStore(
    (s) => s.saveCustomTemplateWithSceneAction,
  )
  const exportTemplateJsonAction = useEditorStore((s) => s.exportTemplateJsonAction)
  const getActiveTemplate = useEditorStore((s) => s.getActiveTemplate)

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
