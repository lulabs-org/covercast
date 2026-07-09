import { gradientVector } from '@/domain'

// ── Shared fill resolution (mirrors svg-serializer logic) ───────────────────

export type FillInfo = {
  resolvedFill: string
  gradientId: string | null
  gradientStops: { offset: string; color: string }[] | null
  gradientVector: { x1: string; y1: string; x2: string; y2: string } | null
  renderOpacity: number
  isCutout: boolean
}

export type FillInput = {
  fill: string
  fillMode: 'solid' | 'gradient'
  gradientStartColor: string
  gradientEndColor: string
  gradientDirection: 'horizontal' | 'vertical' | 'diagonal-down' | 'diagonal-up'
  backgroundCutout: boolean
  opacity: number
  shapeId: string
}

export function resolveShapeFillInfo(input: FillInput): FillInfo {
  const {
    fill,
    fillMode,
    gradientStartColor,
    gradientEndColor,
    gradientDirection,
    backgroundCutout,
    opacity,
    shapeId,
  } = input

  const useGradient = fillMode === 'gradient' && !!gradientStartColor && !!gradientEndColor
  const gradientId = `cover-shape-grad-${shapeId.replace(/[^a-zA-Z0-9-]/g, '')}`

  let resolvedFill: string
  if (backgroundCutout) {
    resolvedFill = 'transparent'
  } else if (useGradient) {
    resolvedFill = `url(#${gradientId})`
  } else if (fill === 'courseGradient' || fill === 'accentGradient') {
    resolvedFill = `url(#${gradientId})`
  } else {
    resolvedFill = fill
  }

  let stops: { offset: string; color: string }[] = []
  if (useGradient) {
    stops = [
      { offset: '0%', color: gradientStartColor },
      { offset: '100%', color: gradientEndColor },
    ]
  } else if (fill === 'courseGradient') {
    stops = [
      { offset: '0%', color: '#ffffff' },
      { offset: '54%', color: '#ffffff' },
      { offset: '100%', color: '#99f19c' },
    ]
  } else if (fill === 'accentGradient') {
    stops = [
      { offset: '0%', color: '#73f08c' },
      { offset: '100%', color: '#2859d7' },
    ]
  }

  const needsGradientDef = stops.length > 0
  const vector = needsGradientDef
    ? gradientVector(useGradient ? gradientDirection : 'horizontal')
    : null

  return {
    resolvedFill,
    gradientId: needsGradientDef ? gradientId : null,
    gradientStops: needsGradientDef ? stops : null,
    gradientVector: vector,
    renderOpacity: backgroundCutout ? 1 : opacity,
    isCutout: backgroundCutout,
  }
}
