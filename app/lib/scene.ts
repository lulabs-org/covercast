export const DEFAULT_CANVAS_WIDTH = 941
export const DEFAULT_CANVAS_HEIGHT = 1672

import { DEFAULT_FONT_FAMILY } from './fonts'
export { DEFAULT_FONT_FAMILY }

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

import { DEFAULT_TEMPLATE_ID, BUILT_IN_TEMPLATES, emptyScene } from './templates'
export { DEFAULT_TEMPLATE_ID, BUILT_IN_TEMPLATES }

export function createDefaultScene(): Scene {
  return createSceneFromTemplate(DEFAULT_TEMPLATE_ID)
}

export function createSceneFromTemplate(templateId: string): Scene {
  const template =
    BUILT_IN_TEMPLATES.find((item) => item.id === templateId) ?? BUILT_IN_TEMPLATES[0]

  return cloneScene(template.scene)
}

export function cloneScene(scene: Scene): Scene {
  return JSON.parse(JSON.stringify(scene)) as Scene
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

export function createTextElement(): TextElement {
  return {
    id: `text-${Date.now()}`,
    name: '自定义文字',
    type: 'text',
    text: '新的文字',
    x: 330,
    y: 760,
    width: 280,
    height: 56,
    fill: '#ffffff',
    fontSize: 42,
    fontFamily: DEFAULT_FONT_FAMILY,
    fontWeight: 800,
    align: 'center',
    lineHeight: 1.18,
  }
}

export function createRectElement(): ShapeElement {
  return {
    id: `rect-${Date.now()}`,
    name: '自定义矩形',
    type: 'rect',
    x: 320,
    y: 720,
    width: 300,
    height: 180,
    fill: '#ffffff',
    fillMode: 'gradient',
    gradient: {
      startColor: '#ffffff',
      endColor: '#99f19c',
      direction: 'horizontal',
    },
    stroke: '#ffffff',
    strokeWidth: 0,
    radius: 16,
    opacity: 1,
  }
}

export function createEllipseElement(): ShapeElement {
  return {
    id: `ellipse-${Date.now()}`,
    name: '自定义椭圆',
    type: 'ellipse',
    x: 340,
    y: 740,
    width: 260,
    height: 160,
    fill: '#ffffff',
    fillMode: 'gradient',
    gradient: {
      startColor: '#ffffff',
      endColor: '#99f19c',
      direction: 'horizontal',
    },
    stroke: '#ffffff',
    strokeWidth: 0,
    opacity: 1,
  }
}

export function createImageElement(src: string, name = '自定义素材'): ImageElement {
  return {
    id: `image-${Date.now()}`,
    name,
    type: 'image',
    src,
    alt: name,
    x: 356,
    y: 720,
    width: 230,
    height: 230,
    fit: 'contain',
    shape: 'rect',
  }
}

export function createEmptyScene(): Scene {
  return cloneScene(emptyScene)
}
