import { create } from 'zustand'
import { cloneScene, type Scene } from '@/lib/domain/scene'
import { createDefaultScene } from '@/lib/templates'
import { createSelectionState, type SelectionState } from '@/lib/domain/selection'

export type SceneSlice = {
  scene: Scene
  selection: SelectionState
  editingTextId: string | null

  setScene: (updater: Scene | ((prev: Scene) => Scene)) => void
  setSelection: (updater: SelectionState | ((prev: SelectionState) => SelectionState)) => void
  setEditingTextId: (id: string | null | ((prev: string | null) => string | null)) => void
}

export const useSceneStore = create<SceneSlice>()((set) => ({
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

export { cloneScene }
