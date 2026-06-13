import { isTextElement, type SceneElement } from '@/lib/scene'
import type { GuideLine, MeasurementGuide, ResizeLabel } from '@/lib/smart-guide'
import type { Scene } from '@/lib/scene'

export function getSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
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

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function minimumWidth(element: SceneElement) {
  if (isTextElement(element)) {
    return 40
  }

  if (element.type === 'ellipse') {
    return 14
  }

  return 28
}

export function minimumHeight(element: SceneElement) {
  if (isTextElement(element)) {
    return Math.max(24, element.fontSize)
  }

  if (element.type === 'ellipse') {
    return 14
  }

  return 28
}

export type MoveDelta = {
  dx: number
  dy: number
  shiftKey: boolean
}

export type ProcessResult = {
  sceneUpdater: (currentScene: Scene) => Scene
  guides: GuideLine[]
  spacingGuides: MeasurementGuide[]
  resizeLabel: ResizeLabel | null
}
