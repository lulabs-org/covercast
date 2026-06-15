'use client'

import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { type SceneElement } from '@/lib/domain/scene'
import { useClipboard } from '@/hooks/editor/useClipboard'
import { useEditorShortcuts } from '@/hooks/editor/useEditorShortcuts'
import { useSceneStore } from '@/stores/useSceneStore'
import { useSceneConfigStore } from '@/stores/useSceneConfigStore'
import { useCanvasUIStore } from '@/stores/useCanvasUIStore'
import {
  patchElementWithHistory,
  toggleElementHiddenWithHistory,
  toggleElementLockedWithHistory,
  moveElementLayerWithHistory,
  addTextElement,
  addRectElement,
  addEllipseElement,
  deleteSelected,
  undoAction,
  redoAction,
} from '@/stores/scene-commands'
import type { SpatialIndex } from '@/lib/algorithms/spatial-index'

// ── Types ──
interface EditorActionValue {
  patchElement: (elementId: string, patch: Partial<SceneElement>) => void
  toggleElementHidden: (elementId: string) => void
  toggleElementLocked: (elementId: string) => void
  moveElementLayer: (elementId: string, direction: 'forward' | 'backward') => void
  addTextElement: () => void
  addRectElement: () => void
  addEllipseElement: () => void
  deleteSelected: () => void
  canPasteElement: boolean
  copySelectedElements: () => void
  pasteCopiedElements: () => void
}

// ── Context ──
const EditorActionContext = createContext<EditorActionValue | null>(null)

// ── Provider ──
export function EditorActionProvider({
  children,
  spatialIndexRef,
}: {
  children: ReactNode
  spatialIndexRef: React.MutableRefObject<SpatialIndex>
}) {
  // ── Scene Store ──
  const scene = useSceneStore((s) => s.scene)
  const selection = useSceneStore((s) => s.selection)
  const editingTextId = useSceneStore((s) => s.editingTextId)

  // ── Canvas UI Store ──
  const setStatus = useCanvasUIStore((s) => s.setStatus)

  // ── Scene Config Store ──
  const canvasSize = useSceneConfigStore((s) => s.canvasSize)

  // ── Clipboard ──
  const {
    canPasteElement,
    copySelectedElements,
    pasteCopiedElements,
    elementClipboardRef,
    elementsClipboardRef,
  } = useClipboard({
    selectedIds: selection.selectedIds,
    setStatus,
    canvasWidth: canvasSize.width,
    canvasHeight: canvasSize.height,
  })

  // ── Shortcuts ──
  useEditorShortcuts({
    scene,
    selection,
    editingTextId,
    undo: undoAction,
    redo: redoAction,
    copySelectedElements,
    pasteCopiedElements,
    deleteSelected,
    elementClipboardRef,
    elementsClipboardRef,
    spatialIndexRef,
  })

  const value = useMemo<EditorActionValue>(
    () => ({
      patchElement: patchElementWithHistory,
      toggleElementHidden: toggleElementHiddenWithHistory,
      toggleElementLocked: toggleElementLockedWithHistory,
      moveElementLayer: moveElementLayerWithHistory,
      addTextElement,
      addRectElement,
      addEllipseElement,
      deleteSelected,
      canPasteElement,
      copySelectedElements,
      pasteCopiedElements,
    }),
    [canPasteElement, copySelectedElements, pasteCopiedElements],
  )

  return <EditorActionContext.Provider value={value}>{children}</EditorActionContext.Provider>
}

// ── Hook ──
export function useEditorActions(): EditorActionValue {
  const ctx = useContext(EditorActionContext)
  if (!ctx) {
    throw new Error('useEditorActions() must be used inside <EditorActionProvider>')
  }
  return ctx
}
