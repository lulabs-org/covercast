import { create } from 'zustand'
import { createDefaultScene, type Scene } from '../lib/scene'
import { createSelectionState, type SelectionState } from '../lib/selection'

type SceneState = {
  scene: Scene
  selection: SelectionState
  editingTextId: string | null

  // Actions
  setScene: (updater: Scene | ((prev: Scene) => Scene)) => void
  setSelection: (updater: SelectionState | ((prev: SelectionState) => SelectionState)) => void
  setEditingTextId: (id: string | null | ((prev: string | null) => string | null)) => void
}

export const useSceneStore = create<SceneState>((set) => ({
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
}))
