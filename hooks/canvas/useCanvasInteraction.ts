'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { type SceneElement } from '@/lib/domain/scene'
import { type HitTestStrategy } from '@/lib/algorithms/marquee'
import { useDragManager } from './useDragManager'
import { useMarqueeSelection } from './useMarqueeSelection'
import { useSceneStore } from '@/stores/useSceneStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { useSceneConfigStore } from '@/stores/useSceneConfigStore'
import { markSceneEdited } from '@/stores/scene-commands'

/**
 * 画布交互：svgRef + 拖拽/框选/交互 handlers + guides/marquee。
 * 仅由 StagePanel 使用，不需要 Context 共享。
 */
export function useCanvasInteraction() {
  // ── Scene Store ──
  const scene = useSceneStore((s) => s.scene)
  const selection = useSceneStore((s) => s.selection)
  const editingTextId = useSceneStore((s) => s.editingTextId)
  const setSelection = useSceneStore((s) => s.setSelection)
  const setEditingTextId = useSceneStore((s) => s.setEditingTextId)

  // ── History Store ──
  const pushPast = useHistoryStore((s) => s.pushPast)

  // ── Scene Config Store ──
  const canvasSize = useSceneConfigStore((s) => s.canvasSize)

  // ── Refs ──
  const svgRef = useRef<SVGSVGElement>(null)
  const [hitTestStrategy] = useState<HitTestStrategy>('intersection')

  // ── Marquee selection ──
  const { handleCanvasPointerDown } = useMarqueeSelection({
    svgRef,
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
    spatialIndexRef,
  }
}
