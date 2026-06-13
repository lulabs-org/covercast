'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useEditorBridge } from '@/hooks/useEditorBridge'

export type EditorContextValue = ReturnType<typeof useEditorBridge>

const EditorContext = createContext<EditorContextValue | null>(null)

export function EditorProvider({ children }: { children: ReactNode }) {
  const bridge = useEditorBridge()

  return <EditorContext.Provider value={bridge}>{children}</EditorContext.Provider>
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
