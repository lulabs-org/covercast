'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { type SceneElement } from '@/lib/scene'
import { type HitTestStrategy } from '@/lib/marquee'
import { useDragManager } from './useDragManager'
import { useMarqueeSelection } from './useMarqueeSelection'
import { useVisibleGuides } from './useVisibleGuides'
import { useSceneStore } from '@/stores/useSceneStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useInteractionStore } from '@/stores/useInteractionStore'
import { markSceneEdited } from '@/stores/actions'

/**
 * 画布交互：svgRef + 拖拽/框选/交互 handlers + guides/marquee。
 * 仅由 StagePanel 使用，不需要 Context 共享。
 */
export function useCanvasInteraction() {
  // ── Scene Store ──
  const scene = useSceneStore((s) => s.scene)
  const selection = useSceneStore((s) => s.selection)
  const editingTextId = useSceneStore((s) => s.editingTextId)
  const setScene = useSceneStore((s) => s.setScene)
  const setSelection = useSceneStore((s) => s.setSelection)
  const setEditingTextId = useSceneStore((s) => s.setEditingTextId)

  // ── History Store ──
  const pushPast = useHistoryStore((s) => s.pushPast)

  // ── Canvas Store ──
  const canvasSize = useCanvasStore((s) => s.canvasSize)

  // ── Interaction Store ──
  const guidesSelectedIds = useInteractionStore((s) => s.guidesSelectedIds)
  const setGuidesSelectedIds = useInteractionStore((s) => s.setGuidesSelectedIds)

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

  // Sync visible guides to interaction store for StagePanel
  useEffect(() => {
    useInteractionStore.getState().setVisibleGuides(visibleGuides)
    useInteractionStore.getState().setVisibleSpacingGuides(visibleSpacingGuides)
  }, [visibleGuides, visibleSpacingGuides])

  // Sync marquee and drag state to interaction store for StagePanel
  useEffect(() => {
    useInteractionStore.getState().setMarquee(marquee)
  }, [marquee])

  useEffect(() => {
    useInteractionStore.getState().setDrag(drag)
    useInteractionStore.getState().setResizeLabel(resizeLabel)
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
