'use client'

import { createContext, useContext, useMemo, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { type SceneElement } from '@/lib/domain/scene'
import { createSceneActions } from '@/lib/operations/scene-actions'
import { useClipboard } from '@/hooks/editor/useClipboard'
import { useEditorShortcuts } from '@/hooks/editor/useEditorShortcuts'
import { useSceneStore } from '@/stores/useSceneStore'
import { useSceneConfigStore } from '@/stores/useSceneConfigStore'
import { useCanvasUIStore } from '@/stores/useCanvasUIStore'
import { useInteractionStore } from '@/stores/useInteractionStore'
import { changeSceneWithHistory, undoAction, redoAction } from '@/stores/scene-commands'
import type { SpatialIndex } from '@/lib/algorithms/spatial-index'

// ── Types ──
interface EditorActionValue {
  patchSelected: (selectedElement: SceneElement | null, patch: Partial<SceneElement>) => void
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
  selectedElementRef,
  spatialIndexRef,
}: {
  children: ReactNode
  selectedElementRef: React.MutableRefObject<SceneElement | null>
  spatialIndexRef: React.MutableRefObject<SpatialIndex>
}) {
  // ── Scene Store ──
  const scene = useSceneStore((s) => s.scene)
  const selection = useSceneStore((s) => s.selection)
  const editingTextId = useSceneStore((s) => s.editingTextId)
  const setSelection = useSceneStore((s) => s.setSelection)

  // ── Canvas UI Store ──
  const setStatus = useCanvasUIStore((s) => s.setStatus)

  // ── Scene Config Store ──
  const canvasSize = useSceneConfigStore((s) => s.canvasSize)

  // ── Scene actions ──
  const sceneActions = useMemo(
    () =>
      createSceneActions({
        scene,
        selection,
        changeScene: changeSceneWithHistory,
        setSelection,
      }),
    [scene, selection, changeSceneWithHistory, setSelection],
  )

  // ── Clipboard ──
  const sceneElementsRef = useRef(scene.elements)
  useEffect(() => {
    sceneElementsRef.current = scene.elements
  }, [scene.elements])

  const {
    canPasteElement,
    copySelectedElements,
    pasteCopiedElements,
    elementClipboardRef,
    elementsClipboardRef,
  } = useClipboard({
    selectedElementRef,
    sceneElementsRef,
    selectedIds: selection.selectedIds,
    changeScene: changeSceneWithHistory,
    markSceneEdited: () => {},
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
    deleteSelected: sceneActions.deleteSelected,
    selectedElementRef,
    elementClipboardRef,
    elementsClipboardRef,
    spatialIndexRef,
    markSceneEdited: () => {},
  })

  const value = useMemo<EditorActionValue>(
    () => ({
      patchSelected: sceneActions.patchSelected,
      patchElement: sceneActions.patchElement,
      toggleElementHidden: sceneActions.toggleElementHidden,
      toggleElementLocked: sceneActions.toggleElementLocked,
      moveElementLayer: sceneActions.moveElementLayer,
      addTextElement: sceneActions.addTextElement,
      addRectElement: sceneActions.addRectElement,
      addEllipseElement: sceneActions.addEllipseElement,
      deleteSelected: sceneActions.deleteSelected,
      canPasteElement,
      copySelectedElements,
      pasteCopiedElements,
    }),
    [sceneActions, canPasteElement, copySelectedElements, pasteCopiedElements],
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
