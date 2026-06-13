import { StateCreator } from 'zustand'
import { cloneScene, type Scene } from '../lib/scene'
import type { EditorStore } from './useEditorStore'

const MAX_HISTORY_SIZE = 50

export type HistoryEntry = {
  scene: Scene
  selectedIds: string[]
  description: string
  timestamp: number
}

export type HistorySlice = {
  history: { past: HistoryEntry[]; future: HistoryEntry[] }

  // Pure state actions
  pushPast: (entry: HistoryEntry) => void
  undoShift: () => HistoryEntry | null
  redoShift: () => HistoryEntry | null
  pushFuture: (entry: HistoryEntry) => void

  // Cross-slice actions (from actions.ts)
  undoAction: () => void
  redoAction: () => void
}

export const createHistorySlice: StateCreator<EditorStore, [], [], HistorySlice> = (set, get) => ({
  history: { past: [], future: [] },

  pushPast: (entry) => {
    set((state) => ({
      history: {
        past: [...state.history.past, entry].slice(-MAX_HISTORY_SIZE),
        future: [],
      },
    }))
  },

  undoShift: () => {
    const { history } = get()
    if (history.past.length === 0) return null
    const previous = history.past[history.past.length - 1]
    set((state) => ({
      history: {
        past: state.history.past.slice(0, -1),
        future: state.history.future,
      },
    }))
    return previous
  },

  redoShift: () => {
    const { history } = get()
    if (history.future.length === 0) return null
    const next = history.future[0]
    set((state) => ({
      history: {
        past: state.history.past,
        future: state.history.future.slice(1),
      },
    }))
    return next
  },

  pushFuture: (entry) => {
    set((state) => ({
      history: {
        past: state.history.past,
        future: [entry, ...state.history.future],
      },
    }))
  },

  undoAction: () => {
    const previous = get().undoShift()
    if (!previous) {
      set({ status: '没有可撤销的操作' })
      return
    }
    const { scene, selection } = get()
    get().pushFuture({
      scene: cloneScene(scene),
      selectedIds: selection.selectedIds,
      description: '当前状态',
      timestamp: Date.now(),
    })
    set({
      scene: previous.scene,
      selection: { ...selection, selectedIds: previous.selectedIds },
      status: `已撤销：${previous.description}`,
    })
  },

  redoAction: () => {
    const next = get().redoShift()
    if (!next) {
      set({ status: '没有可重做的操作' })
      return
    }
    const { scene, selection } = get()
    get().pushPast({
      scene: cloneScene(scene),
      selectedIds: selection.selectedIds,
      description: '当前状态',
      timestamp: Date.now(),
    })
    set({
      scene: next.scene,
      selection: { ...selection, selectedIds: next.selectedIds },
      status: `已重做：${next.description}`,
    })
  },
})
