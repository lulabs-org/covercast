import { StateCreator } from 'zustand'
import { cloneScene, type Scene } from '@/lib/domain/scene'
import { createDefaultScene } from '@/lib/templates'
import { createSelectionState, selectSingle, type SelectionState } from '@/lib/domain/selection'
import type { EditorStore } from './useEditorStore'

export type SceneSlice = {
  scene: Scene
  selection: SelectionState
  editingTextId: string | null

  // Actions
  setScene: (updater: Scene | ((prev: Scene) => Scene)) => void
  setSelection: (updater: SelectionState | ((prev: SelectionState) => SelectionState)) => void
  setEditingTextId: (id: string | null | ((prev: string | null) => string | null)) => void

  // Cross-slice actions (from actions.ts)
  changeSceneWithHistory: (updater: (scene: Scene) => Scene, description?: string) => void
  markSceneEdited: () => void
}

export const createSceneSlice: StateCreator<EditorStore, [], [], SceneSlice> = (set, get) => ({
  scene: createDefaultScene(),
  selection: createSelectionState(),
  editingTextId: null,

  setScene: (updater) => {
    if (typeof updater === 'function') {
      set((state) => ({ scene: updater(state.scene) }))
    } else {
      set({ scene: updater })
    }
  },

  setSelection: (updater) => {
    if (typeof updater === 'function') {
      set((state) => ({ selection: updater(state.selection) }))
    } else {
      set({ selection: updater })
    }
  },

  setEditingTextId: (id) => {
    if (typeof id === 'function') {
      set((state) => ({ editingTextId: id(state.editingTextId) }))
    } else {
      set({ editingTextId: id })
    }
  },

  changeSceneWithHistory: (updater, description) => {
    if (description) {
      const { scene, selection } = get()
      get().pushPast({
        scene: cloneScene(scene),
        selectedIds: selection.selectedIds,
        description,
        timestamp: Date.now(),
      })
    }
    set((state) => ({ scene: updater(state.scene) }))
    get().markSceneEdited()
  },

  markSceneEdited: () => {
    const activeCustom = get().getActiveCustomTemplate()
    if (activeCustom) return
    const activeBuiltIn = get().getActiveBuiltInTemplate()
    if (activeBuiltIn) {
      set({ activeTemplateId: '' })
    }
  },
})

// Re-export selectSingle for cross-slice use
export { selectSingle, cloneScene }
