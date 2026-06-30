'use client'

import dynamic from 'next/dynamic'
import { flushSync } from 'react-dom'
import { useEffect, useLayoutEffect, useState, type Ref } from 'react'
import type { OnDrag, OnDragEnd, OnDragStart } from 'react-moveable'

const Moveable = dynamic(() => import('react-moveable').then((mod) => mod.default), {
  ssr: false,
})

type MoveableLayerProps = {
  svgRef?: Ref<SVGSVGElement> | null
  targetElementId?: string | null
  canvasWidth: number
  canvasHeight: number
  enabled?: boolean
  onDragStart?: () => void
  onDrag?: (translateX: number, translateY: number) => void
  onDragEnd?: (isDrag: boolean) => void
}

export function MoveableLayer({
  svgRef,
  targetElementId,
  canvasWidth,
  enabled = false,
  onDragStart,
  onDrag,
  onDragEnd,
}: MoveableLayerProps) {
  const [target, setTarget] = useState<SVGGElement | null>(null)
  const [zoom, setZoom] = useState(1)

  const svgEl = (svgRef as React.RefObject<SVGSVGElement> | null)?.current ?? null

  // DOM 节点查询必须在 commit 后执行（render 阶段 ref 未挂载），useLayoutEffect 同步运行避免闪烁。
  // 此处 setTarget 是把查询到的外部 DOM 节点同步进 React，属于"订阅外部系统"的合法场景。
  useLayoutEffect(() => {
    if (!enabled || !targetElementId || !svgEl) {
      return
    }
    const node = svgEl.querySelector<SVGGElement>(
      `g[data-element-id="${CSS.escape(targetElementId)}"]`,
    )
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 查询到的 DOM 节点需写入 state 才能传给 Moveable，无副作用更优解
    setTarget(node)
  }, [svgEl, targetElementId, enabled])

  const effectiveTarget =
    target && target.isConnected && target.getAttribute('data-element-id') === targetElementId
      ? target
      : null

  useEffect(() => {
    if (!svgEl) {
      return
    }

    function updateZoom() {
      const el = (svgRef as React.RefObject<SVGSVGElement> | null)?.current
      if (!el) {
        return
      }
      const rect = el.getBoundingClientRect()
      if (rect.width > 0 && canvasWidth > 0) {
        setZoom(rect.width / canvasWidth)
      }
    }

    updateZoom()
    const observer = new ResizeObserver(updateZoom)
    observer.observe(svgEl)
    return () => {
      observer.disconnect()
    }
  }, [svgEl, canvasWidth, svgRef])

  if (!enabled || !effectiveTarget) {
    return null
  }

  const handleDragStart = (e: OnDragStart) => {
    e.set([0, 0])
    onDragStart?.()
  }

  const handleDrag = (e: OnDrag) => {
    const [tx, ty] = e.translate
    onDrag?.(tx, ty)
  }

  const handleDragEnd = (e: OnDragEnd) => {
    onDragEnd?.(e.isDrag)
  }

  return (
    <Moveable
      target={effectiveTarget}
      draggable
      resizable={false}
      snappable={false}
      origin={false}
      transformOrigin="0 0"
      zoom={zoom}
      flushSync={flushSync}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
    />
  )
}
