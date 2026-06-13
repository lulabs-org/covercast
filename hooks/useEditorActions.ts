'use client'

import { useEffect, useMemo, useRef } from 'react'
import { type SceneElement } from '@/lib/scene'
import { useSceneActions } from './useSceneActions'
import { useClipboard } from './useClipboard'
import { useAssetManager } from './useAssetManager'
import { useEditorShortcuts } from './useEditorShortcuts'
import { useSceneStore } from '@/stores/useSceneStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { useCanvasStore } from '@/stores/useCanvasStore'

/**
 * 编辑器操作：scene actions + clipboard + asset + shortcuts。
 * 由 SceneEditor 调用，各子组件通过 Context 消费。
 *
 * canvasInteraction 来自 useCanvasInteraction，提供快捷键所需的 refs。
 */
export function useEditorActions(canvasInteraction: {
  selectedElementRef: React.MutableRefObject<SceneElement | null>
  spatialIndexRef: React.MutableRefObject<import('@/lib/spatial-index').SpatialIndex>
  setGuidesSelectedIds: (ids: string[]) => void
  setGuides: (guides: import('@/lib/smart-guide').GuideLine[]) => void
  setSpacingGuides: (guides: import('@/lib/smart-guide').MeasurementGuide[]) => void
}) {
  // ── Scene Store ──
  const scene = useSceneStore((s) => s.scene)
  const selection = useSceneStore((s) => s.selection)
  const editingTextId = useSceneStore((s) => s.editingTextId)
  const changeScene = useSceneStore((s) => s.changeScene)
  const setSelection = useSceneStore((s) => s.setSelection)
  const markSceneEdited = useSceneStore((s) => s.markSceneEdited)

  // ── Canvas Store ──
  const setStatus = useCanvasStore((s) => s.setStatus)
  const canvasSize = useCanvasStore((s) => s.canvasSize)

  // ── History Store ──
  const undo = useHistoryStore((s) => s.undo)
  const redo = useHistoryStore((s) => s.redo)
  const setSceneFromStore = useSceneStore((s) => s.setScene)

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
  } = useSceneActions({ scene, selection, changeScene, setSelection })

  // ── Asset manager ──
  const { handleAssetInput } = useAssetManager({
    setStatus,
    selectedElement,
    patchElement,
    changeScene,
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
    changeScene,
    setSelection,
    markSceneEdited,
    setStatus,
    canvasWidth: canvasSize.width,
    canvasHeight: canvasSize.height,
  })

  // ── Editor shortcuts ──
  useEditorShortcuts({
    scene,
    selection,
    editingTextId,
    undo,
    redo,
    copySelectedElements,
    pasteCopiedElements,
    deleteSelected,
    selectedElementRef: canvasInteraction.selectedElementRef,
    elementClipboardRef,
    elementsClipboardRef,
    spatialIndexRef: canvasInteraction.spatialIndexRef,
    setGuidesSelectedIds: canvasInteraction.setGuidesSelectedIds,
    setGuides: canvasInteraction.setGuides,
    setSpacingGuides: canvasInteraction.setSpacingGuides,
    setScene: setSceneFromStore,
    markSceneEdited,
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
