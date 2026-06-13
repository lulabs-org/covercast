'use client'

import { useEffect, useMemo, useRef } from 'react'
import { type SceneElement } from '@/lib/domain/scene'
import { createSceneActions } from '@/lib/operations/scene-actions'
import { createAssetManager } from '@/lib/operations/asset-manager'
import { useClipboard } from './useClipboard'
import { useEditorShortcuts } from './useEditorShortcuts'
import { useEditorStore } from '@/stores/useEditorStore'
import type { SpatialIndex } from '@/lib/algorithms/spatial-index'

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
  const changeSceneWithHistory = useEditorStore((s) => s.changeSceneWithHistory)
  const undoAction = useEditorStore((s) => s.undoAction)
  const redoAction = useEditorStore((s) => s.redoAction)
  const setStatus = useEditorStore((s) => s.setStatus)
  const setSelection = useEditorStore((s) => s.setSelection)
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

  const {
    canPasteElement,
    copySelectedElements,
    pasteCopiedElements,
    elementClipboardRef,
    elementsClipboardRef,
  } = useClipboard({
    selectedElementRef: canvasInteraction.selectedElementRef,
    sceneElementsRef,
    selectedIds: selection.selectedIds,
    changeScene: changeSceneWithHistory,
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
