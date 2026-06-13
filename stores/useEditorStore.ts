import { create } from 'zustand'
import { createSceneSlice, type SceneSlice } from './useSceneStore'
import { createHistorySlice, type HistorySlice } from './useHistoryStore'
import { createCanvasSlice, type CanvasSlice } from './useCanvasStore'
import { createInteractionSlice, type InteractionSlice } from './useInteractionStore'
import { createTemplateSlice, type TemplateSlice } from './useTemplateStore'

export type EditorStore = SceneSlice & HistorySlice & CanvasSlice & InteractionSlice & TemplateSlice

export const useEditorStore = create<EditorStore>()((...a) => ({
  ...createSceneSlice(...a),
  ...createHistorySlice(...a),
  ...createCanvasSlice(...a),
  ...createInteractionSlice(...a),
  ...createTemplateSlice(...a),
}))
