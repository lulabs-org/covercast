'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useLocalFonts } from '@/hooks/editor/useLocalFonts'

type EditorFontValue = ReturnType<typeof useLocalFonts>

const EditorFontContext = createContext<EditorFontValue | null>(null)

export function EditorFontProvider({ children }: { children: ReactNode }) {
  const localFontManager = useLocalFonts()
  return (
    <EditorFontContext.Provider value={localFontManager}>{children}</EditorFontContext.Provider>
  )
}

export function useEditorFont(): EditorFontValue {
  const value = useContext(EditorFontContext)
  if (!value) {
    throw new Error('useEditorFont must be used within EditorFontProvider')
  }
  return value
}
