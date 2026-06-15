import { create } from 'zustand'
import { cloneScene, type Scene, type SceneElement } from '@/lib/domain/scene'
import { createDefaultScene } from '@/lib/templates'
import { createSelectionState, selectSingle, type SelectionState } from '@/lib/domain/selection'

export type SceneSlice = {
  scene: Scene
  selection: SelectionState
  editingTextId: string | null

  setScene: (updater: Scene | ((prev: Scene) => Scene)) => void
  setSelection: (updater: SelectionState | ((prev: SelectionState) => SelectionState)) => void
  setEditingTextId: (id: string | null | ((prev: string | null) => string | null)) => void

  // Element primitives (pure Scene mutations, no history)
  patchElement: (elementId: string, patch: Partial<SceneElement>) => void
  insertElement: (element: SceneElement) => void
  removeElements: (ids: string[]) => void
  toggleElementHidden: (elementId: string) => void
  toggleElementLocked: (elementId: string) => void
  moveElementLayer: (elementId: string, direction: 'forward' | 'backward') => void
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

  patchElement: (elementId, patch) => {
    set((state) => ({
      scene: {
        ...state.scene,
        elements: state.scene.elements.map((element) =>
          element.id === elementId ? ({ ...element, ...patch } as SceneElement) : element,
        ),
      },
    }))
  },

  insertElement: (element) => {
    set((state) => ({
      scene: {
        ...state.scene,
        elements: [...state.scene.elements, element],
      },
    }))
  },

  removeElements: (ids) => {
    const idSet = new Set(ids)
    set((state) => ({
      scene: {
        ...state.scene,
        elements: state.scene.elements.filter((element) => !idSet.has(element.id)),
      },
    }))
  },

  toggleElementHidden: (elementId) => {
    set((state) => ({
      scene: {
        ...state.scene,
        elements: state.scene.elements.map((element) =>
          element.id === elementId
            ? ({ ...element, hidden: !element.hidden } as SceneElement)
            : element,
        ),
      },
    }))
  },

  toggleElementLocked: (elementId) => {
    set((state) => ({
      scene: {
        ...state.scene,
        elements: state.scene.elements.map((element) =>
          element.id === elementId
            ? ({ ...element, locked: !element.locked } as SceneElement)
            : element,
        ),
      },
    }))
  },

  moveElementLayer: (elementId, direction) => {
    set((state) => {
      const currentIndex = state.scene.elements.findIndex((element) => element.id === elementId)
      const nextIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1

      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= state.scene.elements.length) {
        return state
      }

      const elements = [...state.scene.elements]
      ;[elements[currentIndex], elements[nextIndex]] = [elements[nextIndex], elements[currentIndex]]
      return {
        scene: { ...state.scene, elements },
        selection: selectSingle(state.selection, elementId),
      }
    })
  },
}))

// ── Selectors ──

/** Derive the single selected element from scene + selection */
export function selectSelectedElement(state: SceneSlice): SceneElement | null {
  if (state.selection.selectedIds.length !== 1) return null
  return state.scene.elements.find((el) => el.id === state.selection.selectedIds[0]) ?? null
}

export { cloneScene }
