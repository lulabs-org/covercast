import { type ShapeElement, type SceneElement } from '../../../../lib/scene'
import { resolvePaint } from '../../../../lib/scene-svg'

export function ShapeElementView({
  element,
  idPrefix,
}: {
  element: ShapeElement
  idPrefix: string
}) {
  const commonProps = {
    fill: element.backgroundCutout ? 'transparent' : resolveShapeFill(element, idPrefix),
    stroke: element.stroke,
    strokeWidth: element.strokeWidth,
    opacity: element.backgroundCutout ? 1 : (element.opacity ?? 1),
  }

  if (element.type === 'ellipse') {
    return (
      <ellipse
        cx={element.x + element.width / 2}
        cy={element.y + element.height / 2}
        rx={element.width / 2}
        ry={element.height / 2}
        {...commonProps}
      />
    )
  }

  return (
    <rect
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rx={element.radius ?? 0}
      {...commonProps}
    />
  )
}

function resolveShapeFill(element: ShapeElement, idPrefix: string) {
  if (isGradientShape(element)) {
    return `url(#${shapeGradientId(idPrefix, element.id)})`
  }

  return resolvePaint(element.fill, idPrefix)
}

function isGradientShape(element: SceneElement): element is ShapeElement & {
  gradient: NonNullable<ShapeElement['gradient']>
} {
  return (
    (element.type === 'rect' || element.type === 'ellipse') &&
    element.hidden !== true &&
    element.fillMode === 'gradient' &&
    Boolean(element.gradient)
  )
}

function shapeGradientId(prefix: string, elementId: string): string {
  return `${prefix}-shape-gradient-${elementId}`
}
