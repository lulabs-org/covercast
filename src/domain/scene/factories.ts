/**
 * @file Scene element factory helpers.
 *
 * Provides constructor functions that build fresh scene element instances
 * (text, rectangle, ellipse, image) with sensible defaults and unique ids.
 * Used when inserting new elements into the canvas.
 */

import { DEFAULT_FONT_FAMILY } from '@/config/fonts'
import type { TextElement, ShapeElement, ImageElement } from './types'

const DEFAULT_SHAPE_GRADIENT = {
  startColor: '#ffffff',
  endColor: '#99f19c',
  direction: 'horizontal' as const,
}

const DEFAULT_SHAPE_STYLE = {
  fill: '#ffffff',
  fillMode: 'gradient' as const,
  gradient: DEFAULT_SHAPE_GRADIENT,
  stroke: '#ffffff',
  strokeWidth: 0,
  opacity: 1,
}

function createElementId(kind: 'text' | 'rect' | 'ellipse' | 'image'): string {
  return `${kind}-${Date.now()}`
}

function frame(x: number, y: number, width: number, height: number) {
  return { x, y, width, height }
}

/**
 * Creates a new text element with default styling and position.
 * @returns A `TextElement` instance with a unique id and default content.
 */
export function createTextElement(): TextElement {
  return {
    id: createElementId('text'),
    name: '自定义文字',
    type: 'text',
    text: '新的文字',
    ...frame(330, 760, 280, 56),
    fill: '#ffffff',
    fontSize: 42,
    fontFamily: DEFAULT_FONT_FAMILY,
    fontWeight: 800,
    align: 'center',
    lineHeight: 1.18,
  }
}

/**
 * Creates a new rectangle element with a default gradient fill.
 * @returns A `ShapeElement` instance with a unique id and rounded corners.
 */
export function createRectElement(): ShapeElement {
  return {
    id: createElementId('rect'),
    name: '自定义矩形',
    type: 'rect',
    ...frame(320, 720, 300, 180),
    ...DEFAULT_SHAPE_STYLE,
    radius: 16,
  }
}

/**
 * Creates a new ellipse element with a default gradient fill.
 * @returns A `ShapeElement` instance with a unique id.
 */
export function createEllipseElement(): ShapeElement {
  return {
    id: createElementId('ellipse'),
    name: '自定义椭圆',
    type: 'ellipse',
    ...frame(340, 740, 260, 160),
    ...DEFAULT_SHAPE_STYLE,
  }
}

/**
 * Creates a new image element referencing the provided source URL.
 * @param src - The image source URL.
 * @param name - Optional display name (also used as alt text). Defaults to `'自定义素材'`.
 * @returns An `ImageElement` instance with a unique id and `contain` fit.
 */
export function createImageElement(src: string, name = '自定义素材'): ImageElement {
  return {
    id: createElementId('image'),
    name,
    type: 'image',
    src,
    alt: name,
    ...frame(356, 720, 230, 230),
    fit: 'contain',
    shape: 'rect',
  }
}
