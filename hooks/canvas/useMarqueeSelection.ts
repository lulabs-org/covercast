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
} from '@/lib/algorithms/marquee'
import { clearSelection, selectMultiple, type SelectionState } from '@/lib/domain/selection'
import { useSceneStore } from '@/stores/useSceneStore'
import { useInteractionStore } from '@/stores/useInteractionStore'

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
  hitTestStrategy,
  editingTextId,
}: {
  svgRef: React.RefObject<SVGSVGElement | null>
  hitTestStrategy: HitTestStrategy
  editingTextId: string | null
}) {
  // ── Store setters ──
  const setSelection = useSceneStore((s) => s.setSelection)
  const setEditingTextId = useSceneStore((s) => s.setEditingTextId)
  const setMarquee = useInteractionStore((s) => s.setMarquee)

  // ── 交互状态 ──
  const marquee = useInteractionStore((s) => s.marquee)

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

      setMarquee((prev) => updateMarquee(prev, latest.x, latest.y))
    }

    function handlePointerUp(event: PointerEvent) {
      const svg = svgRef.current
      if (!svg) {
        setMarquee((prev) => clearMarquee(prev))
        return
      }

      const isShiftPressed = event.shiftKey

      // Compute selection changes OUTSIDE of setMarquee updater
      // to avoid calling Zustand setSelection during React state update
      let selectionUpdater: ((prev: SelectionState) => SelectionState) | null = null

      const prevMarquee = useInteractionStore.getState().marquee

      if (hasMarqueeSize(prevMarquee, 5)) {
        const rect = getMarqueeRect(prevMarquee)
        const hitIds = hitTestElements(
          rect,
          useSceneStore.getState().scene.elements,
          hitTestStrategy,
        )

        if (hitIds.length > 0) {
          selectionUpdater = (prevSelection) =>
            selectMultiple(prevSelection, hitIds, isShiftPressed)
        } else if (!isShiftPressed) {
          selectionUpdater = (prevSelection) => clearSelection(prevSelection)
        }
      }

      setMarquee((prev) => clearMarquee(prev))

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
  }, [marquee, hitTestStrategy, svgRef, setSelection, setMarquee])

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

    setMarquee((prev) => startMarquee(prev, point.x, point.y))
  }

  return {
    handleCanvasPointerDown,
  }
}
