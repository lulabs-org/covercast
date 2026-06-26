/**
 * 历史记录领域 (History Domain)
 *
 * 撤销/重做的纯栈操作。不依赖 React、不调用 setScene / setSelection——
 * 这些副作用由调用方(hook)编排。
 *
 * 设计:past 栈记录"保存点",future 栈记录"被撤销的点"。
 * - saveHistory → push 到 past,清空 future
 * - undo → past 顶弹出到 future,返回要恢复的 entry
 * - redo → future 头弹出到 past,返回要恢复的 entry
 */

import { cloneScene, type Scene } from './scene'

export type HistoryEntry = {
  scene: Scene
  selectedIds: string[]
  description: string
  timestamp: number
}

export type HistoryState = {
  past: HistoryEntry[]
  future: HistoryEntry[]
}

/** 历史栈最大长度(超出后丢弃最旧的条目) */
export const MAX_HISTORY_SIZE = 50

/**
 * 创建空的历史状态。
 */
export function createEmptyHistoryState(): HistoryState {
  return { past: [], future: [] }
}

/**
 * 构建历史条目(深拷贝 scene 以避免后续 mutation 影响快照)。
 * 注意:调用 Date.now(),非纯函数——但作为工厂只负责装配,不影响栈操作的可测性。
 */
export function createHistoryEntry(
  scene: Scene,
  selectedIds: string[],
  description: string,
): HistoryEntry {
  return {
    scene: cloneScene(scene),
    selectedIds,
    description,
    timestamp: Date.now(),
  }
}

/**
 * 压入新条目到 past 栈,清空 future 栈。
 * past 长度超出 MAX_HISTORY_SIZE 时丢弃最旧的条目。
 */
export function pushHistory(state: HistoryState, entry: HistoryEntry): HistoryState {
  return {
    past: [...state.past, entry].slice(-MAX_HISTORY_SIZE),
    future: [],
  }
}

/**
 * 撤销:把 past 栈顶弹出并推入 future,返回要恢复的条目与新状态。
 * past 为空时返回 null(调用方负责提示"无可撤销")。
 *
 * @param current 当前状态的条目(将被推入 future 栈顶)
 */
export function undoHistory(
  state: HistoryState,
  current: HistoryEntry,
): { state: HistoryState; restore: HistoryEntry } | null {
  if (state.past.length === 0) {
    return null
  }

  const restore = state.past[state.past.length - 1]
  return {
    state: {
      past: state.past.slice(0, -1),
      future: [current, ...state.future],
    },
    restore,
  }
}

/**
 * 重做:把 future 栈头弹出并推入 past,返回要恢复的条目与新状态。
 * future 为空时返回 null(调用方负责提示"无可重做")。
 *
 * @param current 当前状态的条目(将被推入 past 栈顶)
 */
export function redoHistory(
  state: HistoryState,
  current: HistoryEntry,
): { state: HistoryState; restore: HistoryEntry } | null {
  if (state.future.length === 0) {
    return null
  }

  const restore = state.future[0]
  return {
    state: {
      past: [...state.past, current],
      future: state.future.slice(1),
    },
    restore,
  }
}
