import { useState, useCallback } from 'react'
import { type Scene, type SelectionState } from '@/domain'
import {
  type HistoryState,
  createEmptyHistoryState,
  createHistoryEntry,
  pushHistory,
  undoHistory,
  redoHistory,
} from '@/domain/history'

type UseHistoryOptions = {
  scene: Scene
  selectedIds: string[]
  setScene: (scene: Scene) => void
  setSelection: (updater: (prev: SelectionState) => SelectionState) => void
  setStatus: (status: string) => void
}

/**
 * 历史记录 hook:把 domain/history 的纯栈操作与副作用(setScene / setSelection / setStatus)编排起来。
 * 纯栈操作见 domain/history.ts。
 */
export function useHistory(options: UseHistoryOptions) {
  const { scene, selectedIds, setScene, setSelection, setStatus } = options

  const [history, setHistory] = useState<HistoryState>(createEmptyHistoryState)

  const saveHistory = useCallback(
    (description: string, sceneToSave?: Scene) => {
      const entry = createHistoryEntry(sceneToSave ?? scene, selectedIds, description)
      setHistory((prev) => pushHistory(prev, entry))
    },
    [scene, selectedIds],
  )

  const undo = useCallback(() => {
    const current = createHistoryEntry(scene, selectedIds, '当前状态')
    const result = undoHistory(history, current)

    if (!result) {
      setStatus('没有可撤销的操作')
      return
    }

    setHistory(result.state)
    setScene(result.restore.scene)
    setSelection((prev) => ({ ...prev, selectedIds: result.restore.selectedIds }))
    setStatus(`已撤销：${result.restore.description}`)
  }, [history, scene, selectedIds, setScene, setSelection, setStatus])

  const redo = useCallback(() => {
    const current = createHistoryEntry(scene, selectedIds, '当前状态')
    const result = redoHistory(history, current)

    if (!result) {
      setStatus('没有可重做的操作')
      return
    }

    setHistory(result.state)
    setScene(result.restore.scene)
    setSelection((prev) => ({ ...prev, selectedIds: result.restore.selectedIds }))
    setStatus(`已重做：${result.restore.description}`)
  }, [history, scene, selectedIds, setScene, setSelection, setStatus])

  return {
    history,
    saveHistory,
    undo,
    redo,
  }
}
