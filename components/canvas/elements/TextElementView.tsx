import { type TextElement } from '../../../../lib/scene'
import { textAnchorForAlign, textX } from '../../../../lib/scene-svg'

export function TextElementView({
  element,
  interactive,
  editing,
}: {
  element: TextElement
  interactive: boolean
  editing?: boolean
}) {
  const x = textX(element)
  const lines = element.text.split('\n')
  const lineHeight = element.fontSize * element.lineHeight

  return (
    <>
      {interactive ? (
        <rect
          x={element.x}
          y={element.y}
          width={element.width}
          height={element.height}
          fill="transparent"
        />
      ) : null}
      <text
        x={x}
        y={element.y + element.fontSize}
        fill={element.fill}
        fontFamily={element.fontFamily}
        fontSize={element.fontSize}
        fontWeight={element.fontWeight}
        textAnchor={textAnchorForAlign(element.align)}
        opacity={element.opacity ?? 1}
        style={{
          userSelect: interactive && !editing ? 'none' : undefined,
          pointerEvents: interactive && !editing ? 'none' : undefined,
        }}
      >
        {lines.map((line, index) => (
          <tspan key={`${element.id}-${index}`} x={x} dy={index === 0 ? 0 : lineHeight}>
            {line || ' '}
          </tspan>
        ))}
      </text>
    </>
  )
}
