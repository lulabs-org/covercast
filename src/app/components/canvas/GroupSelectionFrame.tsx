import { type PointerEvent } from 'react'
import {
  type SceneElement,
  computeBoundingBox,
  formatDimension,
  type ResizeHandleType,
} from '@/domain'

export function GroupSelectionFrame({
  elements,
  shiftKeyPressed,
  onDragPointerDown,
  onResizePointerDown,
}: {
  elements: SceneElement[]
  shiftKeyPressed: boolean
  onDragPointerDown?: (event: PointerEvent<SVGRectElement>) => void
  onResizePointerDown?: (handle: ResizeHandleType, event: PointerEvent<SVGRectElement>) => void
}) {
  const bounds = computeBoundingBox(elements)
  const labelText = formatDimension(bounds.width, bounds.height)
  const labelW = labelText.length * 10 + 10
  const labelH = 22
  const labelGap = 5
  const labelRx = bounds.x + bounds.width / 2 - labelW / 2
  const labelRy = bounds.y + bounds.height + labelGap
  const handleSize = 12

  const handles: { type: ResizeHandleType; x: number; y: number }[] = [
    { type: 'nw', x: bounds.x - handleSize / 2, y: bounds.y - handleSize / 2 },
    { type: 'n', x: bounds.x + bounds.width / 2 - handleSize / 2, y: bounds.y - handleSize / 2 },
    { type: 'ne', x: bounds.x + bounds.width - handleSize / 2, y: bounds.y - handleSize / 2 },
    {
      type: 'e',
      x: bounds.x + bounds.width - handleSize / 2,
      y: bounds.y + bounds.height / 2 - handleSize / 2,
    },
    {
      type: 'se',
      x: bounds.x + bounds.width - handleSize / 2,
      y: bounds.y + bounds.height - handleSize / 2,
    },
    {
      type: 's',
      x: bounds.x + bounds.width / 2 - handleSize / 2,
      y: bounds.y + bounds.height - handleSize / 2,
    },
    { type: 'sw', x: bounds.x - handleSize / 2, y: bounds.y + bounds.height - handleSize / 2 },
    { type: 'w', x: bounds.x - handleSize / 2, y: bounds.y + bounds.height / 2 - handleSize / 2 },
  ]

  return (
    <g className="group-selection-frame">
      <rect
        className="group-drag-handle"
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        fill="transparent"
        stroke="none"
        pointerEvents={shiftKeyPressed ? 'none' : 'fill'}
        onPointerDown={(event) => {
          event.stopPropagation()
          onDragPointerDown?.(event)
        }}
      />
      <rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        fill="none"
        stroke="#336FFF"
        strokeWidth="3"
        vectorEffect="non-scaling-stroke"
        pointerEvents="none"
      />
      {handles.map((handle) => (
        <rect
          key={handle.type}
          className="group-resize-handle"
          x={handle.x}
          y={handle.y}
          width={handleSize}
          height={handleSize}
          rx={3}
          fill="#336FFF"
          stroke="#132060"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          onPointerDown={(event) => {
            event.stopPropagation()
            onResizePointerDown?.(handle.type, event)
          }}
        />
      ))}
      <rect
        x={labelRx}
        y={labelRy}
        width={labelW}
        height={labelH}
        rx={3}
        ry={3}
        fill="#336FFF"
        pointerEvents="none"
      />
      <text
        x={bounds.x + bounds.width / 2}
        y={labelRy + labelH / 2}
        textAnchor="middle"
        fill="#ffffff"
        fontSize="16"
        fontFamily="PingFang SC, Microsoft YaHei, Arial, sans-serif"
        fontWeight="600"
        dominantBaseline="central"
        pointerEvents="none"
      >
        {labelText}
      </text>
    </g>
  )
}
