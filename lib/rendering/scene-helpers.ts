import type { TextAlign, TextElement, SceneElement, ShapeElement } from '../domain/scene'

export function resolvePaint(fill: string, prefix = 'covercast'): string {
  if (fill === 'courseGradient') {
    return `url(#${prefix}-course-gradient)`
  }

  if (fill === 'accentGradient') {
    return `url(#${prefix}-accent-gradient)`
  }

  return fill
}

export function textAnchorForAlign(align: TextAlign): 'start' | 'middle' | 'end' {
  if (align === 'center') {
    return 'middle'
  }

  if (align === 'right') {
    return 'end'
  }

  return 'start'
}

export function textX(element: TextElement): number {
  if (element.align === 'center') {
    return element.x + element.width / 2
  }

  if (element.align === 'right') {
    return element.x + element.width
  }

  return element.x
}

export function elementBounds(element: SceneElement) {
  return {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
  }
}

export function gradientVector(direction: NonNullable<ShapeElement['gradient']>['direction']) {
  if (direction === 'vertical') {
    return { x1: '0%', y1: '0%', x2: '0%', y2: '100%' }
  }

  if (direction === 'diagonal-down') {
    return { x1: '0%', y1: '0%', x2: '100%', y2: '100%' }
  }

  if (direction === 'diagonal-up') {
    return { x1: '0%', y1: '100%', x2: '100%', y2: '0%' }
  }

  return { x1: '0%', y1: '0%', x2: '100%', y2: '0%' }
}

export function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function escapeAttribute(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;')
}

export function clampOpacity(value: number): number {
  if (!Number.isFinite(value)) {
    return 1
  }

  return Math.min(Math.max(value, 0), 1)
}
