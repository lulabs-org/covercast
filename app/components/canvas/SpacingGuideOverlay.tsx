import type { MeasurementGuide } from '../../lib/smart-guide'

type ArrowCapLine = {
  x1: number
  y1: number
  x2: number
  y2: number
}

type ArrowCap = {
  line1: ArrowCapLine
  line2: ArrowCapLine
}

type ArrowDirection = 'left' | 'right' | 'top' | 'bottom'

function computeArrowCap(
  x: number,
  y: number,
  orientation: 'horizontal' | 'vertical',
  direction: ArrowDirection,
  arrowLen: number,
  arrowW: number,
): ArrowCap {
  if (orientation === 'horizontal') {
    if (direction === 'left') {
      return {
        line1: { x1: x, y1: y, x2: x + arrowLen, y2: y - arrowW },
        line2: { x1: x, y1: y, x2: x + arrowLen, y2: y + arrowW },
      }
    } else {
      return {
        line1: { x1: x, y1: y, x2: x - arrowLen, y2: y - arrowW },
        line2: { x1: x, y1: y, x2: x - arrowLen, y2: y + arrowW },
      }
    }
  } else {
    if (direction === 'top') {
      return {
        line1: { x1: x, y1: y, x2: x - arrowW, y2: y + arrowLen },
        line2: { x1: x, y1: y, x2: x + arrowW, y2: y + arrowLen },
      }
    } else {
      return {
        line1: { x1: x, y1: y, x2: x - arrowW, y2: y - arrowLen },
        line2: { x1: x, y1: y, x2: x + arrowW, y2: y - arrowLen },
      }
    }
  }
}

export function SpacingGuideOverlay({ spacingGuides }: { spacingGuides: MeasurementGuide[] }) {
  return (
    <g className="spacing-guides-overlay" pointerEvents="none">
      {spacingGuides.map((mg, index) => {
        const { measurementLine, extensionLines, label, direction } = mg
        const isHorizontal = direction === 'horizontal'
        const arrowSize = 6

        const cap1 = computeArrowCap(
          measurementLine.x1,
          measurementLine.y1,
          direction,
          isHorizontal ? 'left' : 'top',
          arrowSize,
          arrowSize,
        )
        const cap2 = computeArrowCap(
          measurementLine.x2,
          measurementLine.y2,
          direction,
          isHorizontal ? 'right' : 'bottom',
          arrowSize,
          arrowSize,
        )

        const labelText = String(label.value)
        const labelW = labelText.length * 10 + 10
        const labelH = 22
        const labelGap = 5

        const labelRx = isHorizontal ? label.x - labelW / 2 : label.x + labelGap
        const labelRy = isHorizontal ? label.y - labelGap - labelH : label.y - labelH / 2

        return (
          <g key={`measurement-${direction}-${index}`}>
            {extensionLines.map((ext, extIndex) => {
              const extTickLen = 6
              const extIsVertical = ext.x1 === ext.x2
              const extTick1x1 = extIsVertical ? ext.x1 - extTickLen : ext.x1
              const extTick1y1 = extIsVertical ? ext.y1 : ext.y1 - extTickLen
              const extTick1x2 = extIsVertical ? ext.x1 + extTickLen : ext.x1
              const extTick1y2 = extIsVertical ? ext.y1 : ext.y1 + extTickLen
              const extTick2x1 = extIsVertical ? ext.x2 - extTickLen : ext.x2
              const extTick2y1 = extIsVertical ? ext.y2 : ext.y2 - extTickLen
              const extTick2x2 = extIsVertical ? ext.x2 + extTickLen : ext.x2
              const extTick2y2 = extIsVertical ? ext.y2 : ext.y2 + extTickLen

              return (
                <g key={`ext-group-${extIndex}`}>
                  <line
                    x1={ext.x1}
                    y1={ext.y1}
                    x2={ext.x2}
                    y2={ext.y2}
                    stroke="#ff5c8a"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    opacity="0.6"
                  />
                  <line
                    x1={extTick1x1}
                    y1={extTick1y1}
                    x2={extTick1x2}
                    y2={extTick1y2}
                    stroke="#ff5c8a"
                    strokeWidth="2"
                    opacity="0.6"
                  />
                  <line
                    x1={extTick2x1}
                    y1={extTick2y1}
                    x2={extTick2x2}
                    y2={extTick2y2}
                    stroke="#ff5c8a"
                    strokeWidth="2"
                    opacity="0.6"
                  />
                </g>
              )
            })}
            <line
              x1={measurementLine.x1}
              y1={measurementLine.y1}
              x2={measurementLine.x2}
              y2={measurementLine.y2}
              stroke="#ff5c8a"
              strokeWidth="2"
            />
            <line
              x1={cap1.line1.x1}
              y1={cap1.line1.y1}
              x2={cap1.line1.x2}
              y2={cap1.line1.y2}
              stroke="#ff5c8a"
              strokeWidth="2"
            />
            <line
              x1={cap1.line2.x1}
              y1={cap1.line2.y1}
              x2={cap1.line2.x2}
              y2={cap1.line2.y2}
              stroke="#ff5c8a"
              strokeWidth="2"
            />
            <line
              x1={cap2.line1.x1}
              y1={cap2.line1.y1}
              x2={cap2.line1.x2}
              y2={cap2.line1.y2}
              stroke="#ff5c8a"
              strokeWidth="2"
            />
            <line
              x1={cap2.line2.x1}
              y1={cap2.line2.y1}
              x2={cap2.line2.x2}
              y2={cap2.line2.y2}
              stroke="#ff5c8a"
              strokeWidth="2"
            />
            {label.value > 0 ? (
              <>
                <rect
                  x={labelRx}
                  y={labelRy}
                  width={labelW}
                  height={labelH}
                  rx={3}
                  ry={3}
                  fill="#ff5c8a"
                />
                <text
                  x={labelRx + labelW / 2}
                  y={labelRy + labelH / 2}
                  fill="#ffffff"
                  fontSize="16"
                  fontFamily="PingFang SC, Microsoft YaHei, Arial, sans-serif"
                  fontWeight="600"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {labelText}
                </text>
              </>
            ) : null}
          </g>
        )
      })}
    </g>
  )
}
