'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { type SceneElement } from '@/lib/scene'
import { type HitTestStrategy } from '@/lib/marquee'
import { useDragManager } from './useDragManager'
import { useMarqueeSelection } from './useMarqueeSelection'
import { computeVisibleGuides } from '@/lib/visible-guides'
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
  const { handleCanvasPointerDown } = useMarqueeSelection({
    svgRef,
    sceneElementsRef,
    hitTestStrategy,
    editingTextId,
    setSelection,
    setEditingTextId,
  })

  // ── Drag manager ──
  const {
    spatialIndexRef,
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

  // ── Visible guides（从 store 读取 guides，计算后写回 store） ──
  const guides = useEditorStore((s) => s.guides)
  const spacingGuides = useEditorStore((s) => s.spacingGuides)
  const guidesSelectedIds = useEditorStore((s) => s.guidesSelectedIds)

  const { visibleGuides, visibleSpacingGuides } = computeVisibleGuides(
    guides,
    spacingGuides,
    selection.selectedIds,
    guidesSelectedIds,
  )

  // 将计算后的 visible guides 同步到 store（这是派生数据，不是双写）
  useEffect(() => {
    useEditorStore.getState().setVisibleGuides(visibleGuides)
    useEditorStore.getState().setVisibleSpacingGuides(visibleSpacingGuides)
  }, [visibleGuides, visibleSpacingGuides])

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
  }
}
