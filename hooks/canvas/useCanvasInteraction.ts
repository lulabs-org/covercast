'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { type SceneElement } from '@/lib/scene'
import { type HitTestStrategy } from '@/lib/marquee'
import { useDragManager } from './useDragManager'
import { useMarqueeSelection } from './useMarqueeSelection'
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
    canvasWidth: canvasSize.width,
    canvasHeight: canvasSize.height,
  })

  // ── Handlers ──
  function handleTextElementDoubleClick(elementId: string) {
    const element = scene.elements.find((item) => item.id === elementId)
    if (!element || element.type !== 'text') return
    useEditorStore.getState().setSelection({ selectedIds: [elementId] })
    useEditorStore.getState().setEditingTextId(elementId)
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
