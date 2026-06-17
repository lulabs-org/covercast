export type TextAlign = 'left' | 'center' | 'right'
export type ImageFit = 'cover' | 'contain'
export type ImageShape = 'rect' | 'circle'
export type ShapeFillMode = 'solid' | 'gradient'
export type GradientDirection = 'horizontal' | 'vertical' | 'diagonal-down' | 'diagonal-up'

export type ShapeGradient = {
  startColor: string
  endColor: string
  direction: GradientDirection
}

type ElementBase = {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  opacity?: number
  hidden?: boolean
  locked?: boolean
}

export type TextElement = ElementBase & {
  type: 'text'
  text: string
  fill: string
  fontSize: number
  fontFamily: string
  fontWeight: number
  align: TextAlign
  lineHeight: number
}

export type ShapeElement = ElementBase & {
  type: 'rect' | 'ellipse'
  fill: string
  fillMode?: ShapeFillMode
  gradient?: ShapeGradient
  backgroundCutout?: boolean
  stroke?: string
  strokeWidth?: number
  radius?: number
}

export type ImageElement = ElementBase & {
  type: 'image'
  src: string
  alt: string
  fit: ImageFit
  shape: ImageShape
  fallbackText?: string
}

export type SceneElement = TextElement | ShapeElement | ImageElement

export type Scene = {
  version: 1
  backgroundColor: string
  backgroundOpacity: number
  elements: SceneElement[]
}

export type SceneTemplate = {
  id: string
  name: string
  description: string
  scene: Scene
}

export function isTextElement(element: SceneElement): element is TextElement {
  return element.type === 'text'
}

export function isShapeElement(element: SceneElement): element is ShapeElement {
  return element.type === 'rect' || element.type === 'ellipse'
}

export function isImageElement(element: SceneElement): element is ImageElement {
  return element.type === 'image'
}
