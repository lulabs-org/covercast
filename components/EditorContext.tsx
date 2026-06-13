'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useEditorActions } from '@/hooks/useEditorActions'
import { useCanvasInteraction } from '@/hooks/useCanvasInteraction'
import { useLocalFonts } from '@/hooks/useLocalFonts'
import { useLocalAssets } from '@/hooks/useLocalAssets'
import { useSceneLoader } from '@/hooks/useSceneLoader'
import { useSceneStore } from '@/stores/useSceneStore'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useTemplateStore } from '@/stores/useTemplateStore'

const CANVAS_PREVIEW_MAX_WIDTH = 560
const STAGE_VIEWPORT_PADDING = 36

// ── Types ──
type EditorActions = ReturnType<typeof useEditorActions>
type CanvasInteraction = ReturnType<typeof useCanvasInteraction>

interface EditorContextValue extends EditorActions {
  resolveSrc: (src: string) => string
  localFontManager: ReturnType<typeof useLocalFonts>
  canvasInteraction: CanvasInteraction
}

// ── Context ──
const EditorContext = createContext<EditorContextValue | null>(null)

export function EditorProvider({
  children,
  canvasInteraction,
  stageViewportRef,
}: {
  children: ReactNode
  canvasInteraction: CanvasInteraction
  stageViewportRef: React.RefObject<HTMLDivElement | null>
}) {
  // ── Editor actions (scene actions + clipboard + asset + shortcuts) ──
  const actions = useEditorActions(canvasInteraction)

  // ── Local font manager ──
  const localFontManager = useLocalFonts()

  // ── Local assets ──
  const scene = useSceneStore((s) => s.scene)
  const { resolveSrc } = useLocalAssets(scene)

  // ── Scene loader ──
  const setScene = useSceneStore((s) => s.setScene)
  const setStatus = useCanvasStore((s) => s.setStatus)
  const setActiveTemplateId = useTemplateStore((s) => s.setActiveTemplateId)
  const setSelection = useSceneStore((s) => s.setSelection)

  useSceneLoader({ setScene, setStatus, setActiveTemplateId, setSelection })

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
    useTemplateStore.getState().loadSlots()
  }, [])

  // ── App origin ──
  useEffect(() => {
    const timer = window.setTimeout(
      () => useCanvasStore.getState().setAppOrigin(window.location.origin),
      0,
    )
    return () => window.clearTimeout(timer)
  }, [])

  const value: EditorContextValue = {
    ...actions,
    resolveSrc,
    localFontManager,
    canvasInteraction,
  }

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
}

/**
 * 从 EditorProvider 获取编辑器上下文。
 * 必须在 <EditorProvider> 内部使用。
 */
export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext)
  if (!ctx) {
    throw new Error('useEditor() must be used inside <EditorProvider>')
  }
  return ctx
}
