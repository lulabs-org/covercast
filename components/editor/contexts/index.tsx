'use client'

import type { ReactNode } from 'react'
import { useContext } from 'react'
import { EditorActionProvider } from './EditorActionContext'
import { EditorAssetProvider } from './EditorAssetContext'
import { EditorCanvasProvider, useEditorCanvas } from './EditorCanvasContext'
import { EditorFontProvider } from './EditorFontContext'
import type { useCanvasInteraction } from '@/hooks/canvas/useCanvasInteraction'

type CanvasInteraction = ReturnType<typeof useCanvasInteraction>

/**
 * 组合所有编辑器 Context Provider。
 *
 * Provider 顺序：Canvas → Action → Asset → Font
 * - Canvas 先创建，因为 Action 需要 selectedElementRef / spatialIndexRef
 * - Asset、Font 独立
 */
export function EditorProviders({ children }: { children: ReactNode }) {
  return (
    <EditorCanvasProvider>
      <CanvasBridge>{children}</CanvasBridge>
    </EditorCanvasProvider>
  )
}

/** 消费 Canvas context，将 refs 传递给 Action provider */
function CanvasBridge({ children }: { children: ReactNode }) {
  const canvasInteraction = useEditorCanvas()

  return (
    <EditorActionProvider
      selectedElementRef={canvasInteraction.selectedElementRef}
      spatialIndexRef={canvasInteraction.spatialIndexRef}
    >
      <EditorAssetProvider>
        <EditorFontProvider>{children}</EditorFontProvider>
      </EditorAssetProvider>
    </EditorActionProvider>
  )
}
