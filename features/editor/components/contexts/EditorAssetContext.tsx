'use client'

import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { handleAssetInput } from '@/lib/operations/asset-manager'
import { useLocalAssets } from '@/hooks/editor/useLocalAssets'
import { useSceneStore } from '@/stores/useSceneStore'

// ── Types ──
interface EditorAssetValue {
  resolveSrc: (src: string) => string
  handleAssetInput: (event: React.ChangeEvent<HTMLInputElement>, mode: 'add' | 'replace') => void
}

// ── Context ──
const EditorAssetContext = createContext<EditorAssetValue | null>(null)

// ── Provider ──
export function EditorAssetProvider({ children }: { children: ReactNode }) {
  // ── Scene Store ──
  const scene = useSceneStore((s) => s.scene)

  // ── Local asset blob URL resolution ──
  const { resolveSrc } = useLocalAssets(scene)

  const value = useMemo<EditorAssetValue>(() => ({ resolveSrc, handleAssetInput }), [resolveSrc])

  return <EditorAssetContext.Provider value={value}>{children}</EditorAssetContext.Provider>
}

// ── Hook ──
export function useEditorAsset(): EditorAssetValue {
  const ctx = useContext(EditorAssetContext)
  if (!ctx) {
    throw new Error('useEditorAsset() must be used inside <EditorAssetProvider>')
  }
  return ctx
}
