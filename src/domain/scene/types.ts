/**
 * @file Scene domain type definitions.
 *
 * Defines the core data model for scenes and their elements
 * (text, shapes, images) along with type guards used across
 * the scene module. Pure type module — no runtime logic.
 */

/**
 * 轴对齐矩形（axis-aligned bounding rectangle）。
 *
 * 被 alignment / marquee / spatial-index 等多个模块共享。
 * 未来如需 Point / Size / Vector2D 等更多几何类型，
 * 可考虑迁移到独立的 geometry.ts 模块。
 */
export type Rect = {
  x: number
  y: number
  width: number
  height: number
}

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

/**
 * Type guard that narrows a `SceneElement` to a `TextElement`.
 * @param element - The scene element to check.
 * @returns `true` when the element is a text element.
 */
export function isTextElement(element: SceneElement): element is TextElement {
  return element.type === 'text'
}

/**
 * Type guard that narrows a `SceneElement` to a `ShapeElement`.
 * @param element - The scene element to check.
 * @returns `true` when the element is a rectangle or ellipse shape.
 */
export function isShapeElement(element: SceneElement): element is ShapeElement {
  return element.type === 'rect' || element.type === 'ellipse'
}

/**
 * Type guard that narrows a `SceneElement` to an `ImageElement`.
 * @param element - The scene element to check.
 * @returns `true` when the element is an image element.
 */
export function isImageElement(element: SceneElement): element is ImageElement {
  return element.type === 'image'
}
