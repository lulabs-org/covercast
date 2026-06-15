'use client'

import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useCanvasInteraction } from '@/hooks/canvas/useCanvasInteraction'

// ── Types ──
type CanvasInteraction = ReturnType<typeof useCanvasInteraction>

const EditorCanvasContext = createContext<CanvasInteraction | null>(null)

// ── Provider ──
export function EditorCanvasProvider({ children }: { children: ReactNode }) {
  const canvasInteraction = useCanvasInteraction()

  return (
    <EditorCanvasContext.Provider value={canvasInteraction}>
      {children}
    </EditorCanvasContext.Provider>
  )
}

// ── Hook ──
export function useEditorCanvas(): CanvasInteraction {
  const ctx = useContext(EditorCanvasContext)
  if (!ctx) {
    throw new Error('useEditorCanvas() must be used inside <EditorCanvasProvider>')
  }
  return ctx
}
