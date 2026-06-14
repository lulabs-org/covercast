'use client'

import { useEffect } from 'react'
import { useSceneLoader } from '@/hooks/editor/useSceneLoader'
import { useSceneStore } from '@/stores/useSceneStore'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useTemplateStore } from '@/stores/useTemplateStore'

const CANVAS_PREVIEW_MAX_WIDTH = 560
const STAGE_VIEWPORT_PADDING = 36

/**
 * 编辑器初始化副作用。
 * 与 Context 无关，在 SceneEditor 顶层调用。
 */
export function useEditorBootstrap(stageViewportRef: React.RefObject<HTMLDivElement | null>) {
  // ── Scene loader ──
  const setStatus = useCanvasStore((s) => s.setStatus)
  const setActiveTemplateId = useTemplateStore((s) => s.setActiveTemplateId)
  useSceneLoader({ setStatus, setActiveTemplateId })

  // ── Canvas zoom fit-width bridge (ResizeObserver) ──
  const canvasSize = useCanvasStore((s) => s.canvasSize)

  useEffect(() => {
    const viewport = stageViewportRef.current
    if (!viewport) return
    const currentViewport = viewport
    const canvasAspectRatio = canvasSize.width / canvasSize.height

    function updateFitWidth() {
      const availableWidth = Math.max(160, currentViewport.clientWidth - STAGE_VIEWPORT_PADDING)
      const availableHeight = Math.max(280, currentViewport.clientHeight - STAGE_VIEWPORT_PADDING)
      const nextFitWidth = Math.min(
        availableWidth,
        availableHeight * canvasAspectRatio,
        CANVAS_PREVIEW_MAX_WIDTH,
      )
      useCanvasStore.getState().setCanvasFitWidth(Math.max(160, nextFitWidth))
    }

    updateFitWidth()
    const observer = new ResizeObserver(updateFitWidth)
    observer.observe(currentViewport)
    window.addEventListener('resize', updateFitWidth)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateFitWidth)
    }
  }, [stageViewportRef, canvasSize.width, canvasSize.height])

  // ── Template store init ──
  useEffect(() => {
    const timer = window.setTimeout(() => {
      useTemplateStore.getState().initFromStorage()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  // ── Slot loading ──
  useEffect(() => {
    void useTemplateStore.getState().loadSlots()
  }, [])

  // ── App origin ──
  useEffect(() => {
    const timer = window.setTimeout(
      () => useCanvasStore.getState().setAppOrigin(window.location.origin),
      0,
    )
    return () => window.clearTimeout(timer)
  }, [])
}
