'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useEditorActions } from '@/hooks/editor/useEditorActions'
import { useCanvasInteraction } from '@/hooks/canvas/useCanvasInteraction'
import { useLocalFonts } from '@/hooks/editor/useLocalFonts'
import { useLocalAssets } from '@/hooks/editor/useLocalAssets'
import { useSceneLoader } from '@/hooks/editor/useSceneLoader'
import { useEditorStore } from '@/stores/useEditorStore'

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
  const scene = useEditorStore((s) => s.scene)
  const { resolveSrc } = useLocalAssets(scene)

  // ── Scene loader ──
  const setStatus = useEditorStore((s) => s.setStatus)
  const setActiveTemplateId = useEditorStore((s) => s.setActiveTemplateId)

  useSceneLoader({ setStatus, setActiveTemplateId })

  // ── Canvas zoom fit-width bridge (ResizeObserver) ──
  const canvasSize = useEditorStore((s) => s.canvasSize)

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
      useEditorStore.getState().setCanvasFitWidth(Math.max(160, nextFitWidth))
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
      useEditorStore.getState().initFromStorage()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  // ── Slot loading ──
  useEffect(() => {
    useEditorStore.getState().loadSlots()
  }, [])

  // ── App origin ──
  useEffect(() => {
    const timer = window.setTimeout(
      () => useEditorStore.getState().setAppOrigin(window.location.origin),
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
