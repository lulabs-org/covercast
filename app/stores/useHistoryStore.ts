import { create } from 'zustand'
import { cloneScene, type Scene } from '../lib/scene'
import { useSceneStore } from './useSceneStore'
import { useCanvasStore } from './useCanvasStore'

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

  saveHistory: (description: string, sceneSnapshot?: Scene) => void
  undo: () => void
  redo: () => void
  setStatus: (status: string) => void
}

export const useHistoryStore = create<HistoryStoreState>((set, get) => ({
  history: { past: [], future: [] },

  saveHistory: (description, sceneSnapshot) => {
    const { scene, selection } = useSceneStore.getState()
    const entry: HistoryEntry = {
      scene: cloneScene(sceneSnapshot ?? scene),
      selectedIds: selection.selectedIds,
      description,
      timestamp: Date.now(),
    }

    set((state) => ({
      history: {
        past: [...state.history.past, entry].slice(-MAX_HISTORY_SIZE),
        future: [],
      },
    }))
  },

  undo: () => {
    const { history } = get()
    if (history.past.length === 0) {
      get().setStatus('没有可撤销的操作')
      return
    }

    const previous = history.past[history.past.length - 1]
    const { scene, selection } = useSceneStore.getState()

    set((state) => ({
      history: {
        past: state.history.past.slice(0, -1),
        future: [
          {
            scene: cloneScene(scene),
            selectedIds: selection.selectedIds,
            description: '当前状态',
            timestamp: Date.now(),
          },
          ...state.history.future,
        ],
      },
    }))

    useSceneStore.getState().setScene(previous.scene)
    useSceneStore.getState().setSelection((prev) => ({
      ...prev,
      selectedIds: previous.selectedIds,
    }))
    get().setStatus(`已撤销：${previous.description}`)
  },

  redo: () => {
    const { history } = get()
    if (history.future.length === 0) {
      get().setStatus('没有可重做的操作')
      return
    }

    const next = history.future[0]
    const { scene, selection } = useSceneStore.getState()

    set((state) => ({
      history: {
        past: [
          ...state.history.past,
          {
            scene: cloneScene(scene),
            selectedIds: selection.selectedIds,
            description: '当前状态',
            timestamp: Date.now(),
          },
        ],
        future: state.history.future.slice(1),
      },
    }))

    useSceneStore.getState().setScene(next.scene)
    useSceneStore.getState().setSelection((prev) => ({
      ...prev,
      selectedIds: next.selectedIds,
    }))
    get().setStatus(`已重做：${next.description}`)
  },

  setStatus: (status) => {
    useCanvasStore.getState().setStatus(status)
  },
}))
