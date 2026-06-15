'use client'

import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { type SceneElement } from '@/lib/domain/scene'
import { createAssetManager } from '@/lib/operations/asset-manager'
import { useLocalAssets } from '@/hooks/editor/useLocalAssets'
import { useSceneStore } from '@/stores/useSceneStore'
import { useCanvasUIStore } from '@/stores/useCanvasUIStore'
import { changeSceneWithHistory } from '@/stores/scene-commands'

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
  const selection = useSceneStore((s) => s.selection)
  const setSelection = useSceneStore((s) => s.setSelection)

  // ── Canvas UI Store ──
  const setStatus = useCanvasUIStore((s) => s.setStatus)

  // ── Local asset blob URL resolution ──
  const { resolveSrc } = useLocalAssets(scene)

  // ── Selected element (for asset replace) ──
  const selectedElement = useMemo(() => {
    if (selection.selectedIds.length !== 1) return null
    return scene.elements.find((el) => el.id === selection.selectedIds[0]) ?? null
  }, [scene.elements, selection.selectedIds])

  // ── Patch element (inline to avoid circular dependency with EditorActionContext) ──
  const patchElement = useMemo(
    () => (elementId: string, patch: Partial<SceneElement>) => {
      changeSceneWithHistory(
        (currentScene) => ({
          ...currentScene,
          elements: currentScene.elements.map((element) =>
            element.id === elementId ? ({ ...element, ...patch } as SceneElement) : element,
          ),
        }),
        '修改元素属性',
      )
    },
    [changeSceneWithHistory],
  )

  // ── Asset manager ──
  const { handleAssetInput } = useMemo(
    () =>
      createAssetManager({
        setStatus,
        selectedElement,
        patchElement,
        changeScene: changeSceneWithHistory,
        selection,
        setSelection,
      }),
    [setStatus, selectedElement, patchElement, changeSceneWithHistory, selection, setSelection],
  )

  const value = useMemo<EditorAssetValue>(
    () => ({ resolveSrc, handleAssetInput }),
    [resolveSrc, handleAssetInput],
  )

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
