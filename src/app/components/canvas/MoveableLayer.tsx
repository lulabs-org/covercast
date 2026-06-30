'use client'

import dynamic from 'next/dynamic'
import type { Ref } from 'react'

const Moveable = dynamic(() => import('react-moveable').then((mod) => mod.default), {
  ssr: false,
})

type MoveableLayerProps = {
  svgRef?: Ref<SVGSVGElement> | null
  enabled?: boolean
}

export function MoveableLayer({ svgRef, enabled = false }: MoveableLayerProps) {
  if (!enabled) {
    return null
  }

  const target = (svgRef as React.RefObject<SVGSVGElement> | null)?.current ?? null
  if (!target) {
    return null
  }

  return (
    <Moveable
      target={target}
      draggable={false}
      resizable={false}
      snappable={false}
      origin={false}
    />
  )
}
