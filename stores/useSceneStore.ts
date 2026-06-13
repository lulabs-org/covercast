import { create } from 'zustand'
import { createDefaultScene, cloneScene, type Scene } from '../lib/scene'
import { createSelectionState, type SelectionState } from '../lib/selection'
import { useHistoryStore } from './useHistoryStore'
import { useTemplateStore } from './useTemplateStore'

type SceneState = {
  scene: Scene
  selection: SelectionState
  editingTextId: string | null

  // Actions
  setScene: (updater: Scene | ((prev: Scene) => Scene)) => void
  setSelection: (updater: SelectionState | ((prev: SelectionState) => SelectionState)) => void
  setEditingTextId: (id: string | null | ((prev: string | null) => string | null)) => void
  changeScene: (updater: (scene: Scene) => Scene, description?: string) => void
  markSceneEdited: () => void
}

export const useSceneStore = create<SceneState>((set, get) => ({
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

  changeScene: (updater, description) => {
    if (description) {
      const currentScene = get().scene
      useHistoryStore.getState().saveHistory(description, cloneScene(currentScene))
    }
    set((state) => ({ scene: updater(state.scene) }))
    get().markSceneEdited()
  },

  markSceneEdited: () => {
    const activeCustom = useTemplateStore.getState().getActiveCustomTemplate()
    if (activeCustom) return
    const activeBuiltIn = useTemplateStore.getState().getActiveBuiltInTemplate()
    if (activeBuiltIn) {
      useTemplateStore.getState().setActiveTemplateId('')
    }
  },
}))
