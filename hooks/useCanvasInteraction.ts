'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { type SceneElement } from '@/lib/scene'
import { type HitTestStrategy } from '@/lib/marquee'
import { useDragManager } from './useDragManager'
import { useMarqueeSelection } from './useMarqueeSelection'
import { useVisibleGuides } from './useVisibleGuides'
import { useEditorStore } from '@/stores/useEditorStore'

/**
 * 画布交互：svgRef + 拖拽/框选/交互 handlers + guides/marquee。
 * 仅由 StagePanel 使用，不需要 Context 共享。
 */
export function useCanvasInteraction() {
  // ── Editor Store ──
  const scene = useEditorStore((s) => s.scene)
  const selection = useEditorStore((s) => s.selection)
  const editingTextId = useEditorStore((s) => s.editingTextId)
  const setScene = useEditorStore((s) => s.setScene)
  const setSelection = useEditorStore((s) => s.setSelection)
  const setEditingTextId = useEditorStore((s) => s.setEditingTextId)
  const pushPast = useEditorStore((s) => s.pushPast)
  const markSceneEdited = useEditorStore((s) => s.markSceneEdited)
  const canvasSize = useEditorStore((s) => s.canvasSize)
  const guidesSelectedIds = useEditorStore((s) => s.guidesSelectedIds)
  const setGuidesSelectedIds = useEditorStore((s) => s.setGuidesSelectedIds)

  // ── Refs ──
  const svgRef = useRef<SVGSVGElement>(null)
  const sceneElementsRef = useRef<SceneElement[]>(scene.elements)
  const selectedElementRef = useRef<SceneElement | null>(null)
  const [hitTestStrategy] = useState<HitTestStrategy>('intersection')

  // ── Computed ──
  const selectedElement = useMemo(() => {
    if (selection.selectedIds.length !== 1) return null
    return scene.elements.find((element) => element.id === selection.selectedIds[0]) ?? null
  }, [scene.elements, selection.selectedIds])

  // ── Sync refs ──
  useEffect(() => {
    sceneElementsRef.current = scene.elements
  }, [scene.elements])

  useEffect(() => {
    selectedElementRef.current = selectedElement
  }, [selectedElement])

  // ── Marquee selection ──
  const { marquee, handleCanvasPointerDown } = useMarqueeSelection({
    svgRef,
    sceneElementsRef,
    hitTestStrategy,
    editingTextId,
    setSelection,
    setEditingTextId,
  })

  // ── Drag manager ──
  const {
    drag,
    guides,
    spacingGuides,
    resizeLabel,
    spatialIndexRef,
    setGuides,
    setSpacingGuides,
    handleElementPointerDown,
    handleResizePointerDown,
    handleGroupResizePointerDown,
    handleGroupDragPointerDown,
  } = useDragManager({
    scene,
    selection,
    editingTextId,
    svgRef,
    pushPast,
    markSceneEdited,
    setScene,
    setSelection,
    setEditingTextId,
    canvasWidth: canvasSize.width,
    canvasHeight: canvasSize.height,
  })

  // ── Visible guides ──
  const { visibleGuides, visibleSpacingGuides } = useVisibleGuides(
    guides,
    spacingGuides,
    selection.selectedIds,
    guidesSelectedIds,
  )

  // Sync visible guides to store for StagePanel
  useEffect(() => {
    useEditorStore.getState().setVisibleGuides(visibleGuides)
    useEditorStore.getState().setVisibleSpacingGuides(visibleSpacingGuides)
  }, [visibleGuides, visibleSpacingGuides])

  // Sync marquee and drag state to store for StagePanel
  useEffect(() => {
    useEditorStore.getState().setMarquee(marquee)
  }, [marquee])

  useEffect(() => {
    useEditorStore.getState().setDrag(drag)
    useEditorStore.getState().setResizeLabel(resizeLabel)
  }, [drag, resizeLabel])

  // ── Handlers ──
  function handleTextElementDoubleClick(elementId: string) {
    const element = scene.elements.find((item) => item.id === elementId)
    if (!element || element.type !== 'text') return
    setSelection({ selectedIds: [elementId] })
    setEditingTextId(elementId)
  }

  return {
    svgRef,
    handleCanvasPointerDown,
    handleElementPointerDown,
    handleResizePointerDown,
    handleGroupDragPointerDown,
    handleGroupResizePointerDown,
    handleTextElementDoubleClick,
    // exposed for shortcuts
    selectedElementRef,
    spatialIndexRef,
    setGuidesSelectedIds,
    setGuides,
    setSpacingGuides,
  }
}
