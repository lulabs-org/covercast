import { type PointerEvent } from 'react'
import { type SceneElement } from '@/lib/domain/scene'
import { elementBounds } from '@/lib/rendering/scene-helpers'

export function SelectionFrame({
  element,
  onResizePointerDown,
}: {
  element: SceneElement
  onResizePointerDown?: (elementId: string, event: PointerEvent<SVGRectElement>) => void
}) {
  const bounds = elementBounds(element)
  const handleSize = 20

  return (
    <g className="selection-frame">
      <rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        fill="none"
        stroke="#f8d84a"
        strokeWidth="3"
        vectorEffect="non-scaling-stroke"
        pointerEvents="none"
      />
      <rect
        className="selection-handle"
        x={bounds.x + bounds.width - handleSize / 2}
        y={bounds.y + bounds.height - handleSize / 2}
        width={handleSize}
        height={handleSize}
        rx="4"
        fill="#f8d84a"
        stroke="#132060"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        onPointerDown={(event) => {
          event.stopPropagation()
          onResizePointerDown?.(element.id, event)
        }}
      />
    </g>
  )
}
