// Stores
export { useSceneStore } from './useSceneStore'
export type { SceneSlice } from './useSceneStore'

export { useHistoryStore } from './useHistoryStore'
export type { HistorySlice, HistoryEntry } from './useHistoryStore'

export { useCanvasStore, CANVAS_SIZE_PRESETS } from './useCanvasStore'
export type { CanvasSlice, CanvasSize, CanvasSizePreset } from './useCanvasStore'

export { useInteractionStore } from './useInteractionStore'
export type { InteractionSlice, DragState } from './useInteractionStore'

export { useTemplateStore } from './useTemplateStore'
export type { TemplateSlice, CustomSceneTemplate, SceneSlotInfo } from './useTemplateStore'

// Cross-store coordination
export {
  useEditorOrchestrator,
  changeSceneWithHistory,
  markSceneEdited,
  undoAction,
  redoAction,
  applyTemplateAction,
  saveCustomTemplateWithNameAction,
  saveCustomTemplateWithSceneAction,
  saveActiveCustomTemplateAction,
  exportTemplateJsonAction,
  importTemplateFileAction,
} from './editor-actions'
