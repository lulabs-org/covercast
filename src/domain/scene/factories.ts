/**
 * @file Scene element factory helpers.
 *
 * Provides constructor functions that build fresh scene element instances
 * (text, rectangle, ellipse, image) with sensible defaults and unique ids.
 * Used when inserting new elements into the canvas.
 */

import { DEFAULT_FONT_FAMILY } from '@/config/fonts'
import type { TextElement, ShapeElement, ImageElement } from './types'

/**
 * Creates a new text element with default styling and position.
 * @returns A `TextElement` instance with a unique id and default content.
 */
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

/**
 * Creates a new rectangle element with a default gradient fill.
 * @returns A `ShapeElement` instance with a unique id and rounded corners.
 */
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

/**
 * Creates a new ellipse element with a default gradient fill.
 * @returns A `ShapeElement` instance with a unique id.
 */
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

/**
 * Creates a new image element referencing the provided source URL.
 * @param src - The image source URL.
 * @param name - Optional display name (also used as alt text). Defaults to `'自定义素材'`.
 * @returns An `ImageElement` instance with a unique id and `contain` fit.
 */
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
