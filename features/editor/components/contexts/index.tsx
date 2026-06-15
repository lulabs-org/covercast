'use client'

import type { ReactNode } from 'react'
import { EditorActionProvider } from './EditorActionContext'
import { EditorAssetProvider } from './EditorAssetContext'
import { EditorCanvasProvider, useEditorCanvas } from './EditorCanvasContext'
import { EditorFontProvider } from './EditorFontContext'

/**
 * 组合所有编辑器 Context Provider。
 *
 * Canvas 和 Action 之间通过 spatialIndexRef 传递，
 * 使用 CanvasBridge 组件桥接。
 */
export function EditorProviders({ children }: { children: ReactNode }) {
  return (
    <EditorCanvasProvider>
      <CanvasBridge>{children}</CanvasBridge>
    </EditorCanvasProvider>
  )
}

/** 消费 Canvas context，将 spatialIndexRef 传递给 Action provider */
function CanvasBridge({ children }: { children: ReactNode }) {
  const canvasInteraction = useEditorCanvas()

  return (
    <EditorActionProvider spatialIndexRef={canvasInteraction.spatialIndexRef}>
      <EditorAssetProvider>
        <EditorFontProvider>{children}</EditorFontProvider>
      </EditorAssetProvider>
    </EditorActionProvider>
  )
}
