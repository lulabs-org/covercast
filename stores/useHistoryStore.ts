import { create } from 'zustand'
import type { Scene } from '../lib/scene'

const MAX_HISTORY_SIZE = 50

type HistoryEntry = {
  scene: Scene
  selectedIds: string[]
  description: string
  timestamp: number
}

type HistoryState = {
  past: HistoryEntry[]
  future: HistoryEntry[]
}

type HistoryStoreState = {
  history: HistoryState

  // Pure state actions — no cross-store calls
  pushPast: (entry: HistoryEntry) => void
  undoShift: () => HistoryEntry | null
  redoShift: () => HistoryEntry | null
  pushFuture: (entry: HistoryEntry) => void
}

export const useHistoryStore = create<HistoryStoreState>((set, get) => ({
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
        future: state.history.future, // caller will push via pushFuture
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
        past: state.history.past, // caller will push via pushPast
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
}))
