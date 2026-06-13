'use client'

import { type PointerEvent as ReactPointerEvent, useRef, useEffect } from 'react'
import {
  clearMarquee,
  getMarqueeRect,
  hasMarqueeSize,
  hitTestElements,
  isMarqueeActive,
  startMarquee,
  updateMarquee,
  type HitTestStrategy,
} from '../../lib/marquee'
import { clearSelection, selectMultiple, type SelectionState } from '../../lib/selection'
import { type SceneElement } from '../../lib/scene'
import { useEditorStore } from '@/stores/useEditorStore'

function getSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const point = svg.createSVGPoint()
  point.x = clientX
  point.y = clientY
  const matrix = svg.getScreenCTM()

  if (!matrix) {
    return { x: 0, y: 0 }
  }

  const nextPoint = point.matrixTransform(matrix.inverse())
  return { x: nextPoint.x, y: nextPoint.y }
}

export function useMarqueeSelection({
  svgRef,
  sceneElementsRef,
  hitTestStrategy,
  editingTextId,
}: {
  svgRef: React.RefObject<SVGSVGElement | null>
  sceneElementsRef: React.MutableRefObject<SceneElement[]>
  hitTestStrategy: HitTestStrategy
  editingTextId: string | null
}) {
  // ── 直接从 store 获取 setter（消除双写） ──
  const setSelection = useEditorStore((s) => s.setSelection)
  const setEditingTextId = useEditorStore((s) => s.setEditingTextId)

  // ── 交互状态直接读写 Zustand store（消除双写） ──
  const marquee = useEditorStore((s) => s.marquee)

  const marqueeRafRef = useRef<number>(0)
  const latestMarqueeRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!isMarqueeActive(marquee)) {
      return
    }

    function handlePointerMove(event: PointerEvent) {
      const svg = svgRef.current
      if (!svg) {
        return
      }

      const point = getSvgPoint(svg, event.clientX, event.clientY)
      latestMarqueeRef.current = { x: point.x, y: point.y }

      if (marqueeRafRef.current === 0) {
        marqueeRafRef.current = requestAnimationFrame(processMarqueeFrame)
      }
    }

    function processMarqueeFrame() {
      marqueeRafRef.current = 0

      const latest = latestMarqueeRef.current
      if (!latest) {
        return
      }

      const s = useEditorStore.getState()
      const currentMarquee = s.marquee
      s.setMarquee(updateMarquee(currentMarquee, latest.x, latest.y))
    }

    function handlePointerUp(event: PointerEvent) {
      const svg = svgRef.current
      if (!svg) {
        useEditorStore.getState().setMarquee(clearMarquee(useEditorStore.getState().marquee))
        return
      }

      const isShiftPressed = event.shiftKey

      // Compute selection changes OUTSIDE of setMarquee updater
      // to avoid calling Zustand setSelection during React state update
      let selectionUpdater: ((prev: SelectionState) => SelectionState) | null = null

      const s = useEditorStore.getState()
      const prevMarquee = s.marquee

      if (hasMarqueeSize(prevMarquee, 5)) {
        const rect = getMarqueeRect(prevMarquee)
        const hitIds = hitTestElements(rect, sceneElementsRef.current, hitTestStrategy)

        if (hitIds.length > 0) {
          selectionUpdater = (prevSelection) =>
            selectMultiple(prevSelection, hitIds, isShiftPressed)
        } else if (!isShiftPressed) {
          selectionUpdater = (prevSelection) => clearSelection(prevSelection)
        }
      }

      s.setMarquee(clearMarquee(prevMarquee))

      // Apply selection update after setMarquee completes
      if (selectionUpdater) {
        setSelection(selectionUpdater)
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp, { once: true })

    return () => {
      if (marqueeRafRef.current !== 0) {
        cancelAnimationFrame(marqueeRafRef.current)
        marqueeRafRef.current = 0
      }
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [marquee, hitTestStrategy, svgRef, sceneElementsRef, setSelection])

  const handleCanvasPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) {
      return
    }

    const point = getSvgPoint(svg, event.clientX, event.clientY)
    const isShiftPressed = event.shiftKey

    if (!isShiftPressed) {
      setSelection((prev) => clearSelection(prev))
    }

    if (editingTextId) {
      setEditingTextId(null)
    }

    useEditorStore
      .getState()
      .setMarquee(startMarquee(useEditorStore.getState().marquee, point.x, point.y))
  }

  return {
    handleCanvasPointerDown,
  }
}
