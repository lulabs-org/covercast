'use client'

import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useLocalFonts } from '@/hooks/editor/useLocalFonts'

// ── Types ──
type LocalFontManager = ReturnType<typeof useLocalFonts>

const EditorFontContext = createContext<LocalFontManager | null>(null)

// ── Provider ──
export function EditorFontProvider({ children }: { children: ReactNode }) {
  const localFontManager = useLocalFonts()

  return (
    <EditorFontContext.Provider value={localFontManager}>{children}</EditorFontContext.Provider>
  )
}

// ── Hook ──
export function useEditorFont(): LocalFontManager {
  const ctx = useContext(EditorFontContext)
  if (!ctx) {
    throw new Error('useEditorFont() must be used inside <EditorFontProvider>')
  }
  return ctx
}
