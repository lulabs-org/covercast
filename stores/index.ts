// Stores
export { useSceneStore, selectSelectedElement } from './useSceneStore'
export type { SceneSlice } from './useSceneStore'

export { useHistoryStore } from './useHistoryStore'
export type { HistorySlice, HistoryEntry } from './useHistoryStore'

export { useSceneConfigStore } from './useSceneConfigStore'
export type { SceneConfigSlice, CanvasSize, CanvasSizePreset } from './useSceneConfigStore'

export { useCanvasUIStore } from './useCanvasUIStore'
export type { CanvasUISlice, SidebarSectionId } from './useCanvasUIStore'

export { CANVAS_SIZE_PRESETS } from '@/lib/config/canvas-config'

export { useInteractionStore } from './useInteractionStore'
export type { InteractionSlice, DragState } from './useInteractionStore'

export { useTemplateStore } from './useTemplateStore'
export type { TemplateSlice, CustomSceneTemplate, SceneSlotInfo } from './useTemplateStore'

// Cross-store coordination — Scene commands
export {
  changeSceneWithHistory,
  markSceneEdited,
  patchElementWithHistory,
  toggleElementHiddenWithHistory,
  toggleElementLockedWithHistory,
  moveElementLayerWithHistory,
  addTextElement,
  addRectElement,
  addEllipseElement,
  deleteSelected,
  undoAction,
  redoAction,
  applyTemplateAction,
} from './scene-commands'

// Cross-store coordination — Template commands
export {
  saveCustomTemplateWithNameAction,
  saveCustomTemplateWithSceneAction,
  saveActiveCustomTemplateAction,
  exportTemplateJsonAction,
  importTemplateFileAction,
} from './template-commands'
