'use client'

import { useEffect, useMemo, useRef } from 'react'
import { type SceneElement } from '@/lib/scene'
import { createSceneActions } from '@/lib/scene-actions'
import { createAssetManager } from '@/lib/asset-manager'
import { useClipboard } from './useClipboard'
import { useEditorShortcuts } from './useEditorShortcuts'
import { useEditorStore } from '@/stores/useEditorStore'
import type { SpatialIndex } from '@/lib/spatial-index'

/**
 * 编辑器操作：scene actions + clipboard + asset + shortcuts。
 * 由 SceneEditor 调用，各子组件通过 Context 消费。
 */
export function useEditorActions(canvasInteraction: {
  selectedElementRef: React.MutableRefObject<SceneElement | null>
  spatialIndexRef: React.MutableRefObject<SpatialIndex>
}) {
  // ── Editor Store ──
  const scene = useEditorStore((s) => s.scene)
  const selection = useEditorStore((s) => s.selection)
  const editingTextId = useEditorStore((s) => s.editingTextId)
  const setSelection = useEditorStore((s) => s.setSelection)
  const setSceneFromStore = useEditorStore((s) => s.setScene)
  const changeSceneWithHistory = useEditorStore((s) => s.changeSceneWithHistory)
  const undoAction = useEditorStore((s) => s.undoAction)
  const redoAction = useEditorStore((s) => s.redoAction)
  const setStatus = useEditorStore((s) => s.setStatus)
  const canvasSize = useEditorStore((s) => s.canvasSize)

  // ── Computed ──
  const selectedElement = useMemo(() => {
    if (selection.selectedIds.length !== 1) return null
    return scene.elements.find((element) => element.id === selection.selectedIds[0]) ?? null
  }, [scene.elements, selection.selectedIds])

  // ── Scene actions ──
  const {
    patchElement,
    patchSelected,
    toggleElementHidden,
    toggleElementLocked,
    moveElementLayer,
    addTextElement,
    addRectElement,
    addEllipseElement,
    deleteSelected,
  } = createSceneActions({ scene, selection, changeScene: changeSceneWithHistory, setSelection })

  // ── Asset manager ──
  const { handleAssetInput } = createAssetManager({
    setStatus,
    selectedElement,
    patchElement,
    changeScene: changeSceneWithHistory,
    selection,
    setSelection,
  })

  // ── Clipboard ──
  const sceneElementsRef = useRef(scene.elements)
  useEffect(() => {
    sceneElementsRef.current = scene.elements
  }, [scene.elements])

  const elementClipboardRef = useRef<SceneElement | null>(null)
  const elementsClipboardRef = useRef<SceneElement[] | null>(null)

  const { canPasteElement, copySelectedElements, pasteCopiedElements } = useClipboard({
    selectedElementRef: canvasInteraction.selectedElementRef,
    sceneElementsRef,
    selectedIds: selection.selectedIds,
    changeScene: changeSceneWithHistory,
    setSelection,
    markSceneEdited: () => {}, // handled inside changeSceneWithHistory
    setStatus,
    canvasWidth: canvasSize.width,
    canvasHeight: canvasSize.height,
  })

  // ── Editor shortcuts（直接使用 store 操作 guides） ──
  useEditorShortcuts({
    scene,
    selection,
    editingTextId,
    undo: undoAction,
    redo: redoAction,
    copySelectedElements,
    pasteCopiedElements,
    deleteSelected,
    selectedElementRef: canvasInteraction.selectedElementRef,
    elementClipboardRef,
    elementsClipboardRef,
    spatialIndexRef: canvasInteraction.spatialIndexRef,
    setScene: setSceneFromStore,
    markSceneEdited: () => {}, // handled inside changeSceneWithHistory
  })

  return {
    // Scene actions
    patchSelected: (patch: Partial<SceneElement>) => patchSelected(selectedElement, patch),
    toggleElementHidden,
    toggleElementLocked,
    moveElementLayer,
    addTextElement,
    addRectElement,
    addEllipseElement,
    deleteSelected,

    // Asset
    handleAssetInput,

    // Clipboard
    canPasteElement,
    copySelectedElements,
    pasteCopiedElements,
  }
}
