import { useState, useCallback } from 'react'
import { cloneScene, type Scene, type SelectionState } from '@/domain'

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

type UseHistoryOptions = {
  scene: Scene
  selectedIds: string[]
  setScene: (scene: Scene) => void
  setSelection: (updater: (prev: SelectionState) => SelectionState) => void
  setStatus: (status: string) => void
}

export function useHistory(options: UseHistoryOptions) {
  const { scene, selectedIds, setScene, setSelection, setStatus } = options

  const [history, setHistory] = useState<HistoryState>({ past: [], future: [] })

  const saveHistory = useCallback(
    (description: string, sceneToSave?: Scene) => {
      const entry: HistoryEntry = {
        scene: cloneScene(sceneToSave ?? scene),
        selectedIds,
        description,
        timestamp: Date.now(),
      }

      setHistory((prev) => ({
        past: [...prev.past, entry].slice(-MAX_HISTORY_SIZE),
        future: [],
      }))
    },
    [scene, selectedIds],
  )

  const undo = useCallback(() => {
    if (history.past.length === 0) {
      setStatus('没有可撤销的操作')
      return
    }

    const previous = history.past[history.past.length - 1]

    setHistory((prev) => ({
      past: prev.past.slice(0, -1),
      future: [
        {
          scene: cloneScene(scene),
          selectedIds,
          description: '当前状态',
          timestamp: Date.now(),
        },
        ...prev.future,
      ],
    }))

    setScene(previous.scene)
    setSelection((prev) => ({ ...prev, selectedIds: previous.selectedIds }))
    setStatus(`已撤销：${previous.description}`)
  }, [history.past, scene, selectedIds, setScene, setSelection, setStatus])

  const redo = useCallback(() => {
    if (history.future.length === 0) {
      setStatus('没有可重做的操作')
      return
    }

    const next = history.future[0]

    setHistory((prev) => ({
      past: [
        ...prev.past,
        {
          scene: cloneScene(scene),
          selectedIds,
          description: '当前状态',
          timestamp: Date.now(),
        },
      ],
      future: prev.future.slice(1),
    }))

    setScene(next.scene)
    setSelection((prev) => ({ ...prev, selectedIds: next.selectedIds }))
    setStatus(`已重做：${next.description}`)
  }, [history.future, scene, selectedIds, setScene, setSelection, setStatus])

  return {
    history,
    saveHistory,
    undo,
    redo,
  }
}
