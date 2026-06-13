'use client'

import { useScrollVisibility } from './useScrollVisibility'
import { usePanelResize } from './usePanelResize'

/**
 * 编辑器布局状态：面板 refs + 面板宽度 + resize 逻辑。
 * 仅由 SceneEditor 使用，不需要 Context 共享。
 */
export function useLayoutContext() {
  const { leftPanelRef, rightPanelRef, stageViewportRef } = useScrollVisibility()
  const { panelWidths, resizerLeftRef, resizerRightRef, handleMouseDown } = usePanelResize()

  return {
    leftPanelRef,
    rightPanelRef,
    stageViewportRef,
    panelWidths,
    resizerLeftRef,
    resizerRightRef,
    handleMouseDown,
  }
}
