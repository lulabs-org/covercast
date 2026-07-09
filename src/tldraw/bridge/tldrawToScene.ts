'use client'

import { type Editor, type TLShape } from 'tldraw'
import type { Scene, SceneElement, ShapeElement, ImageElement, TextElement } from '@/domain'

// ── tldraw → Scene bridge (reverse conversion) ──────────────────────────────

/**
 * Reads all shapes from the tldraw editor and converts them back to a Scene.
 * This is the reverse of sceneToTldraw — used to verify round-trip fidelity.
 */
export function editorToScene(editor: Editor): Scene {
  const shapes = editor.getCurrentPageShapes()
  const elements: SceneElement[] = []

  // Read background settings from the cover-background shape
  let backgroundColor = '#132060'
  let backgroundOpacity = 1

  for (const shape of shapes) {
    if (shape.type === 'cover-background') {
      const props = shape.props as { backgroundColor: string; backgroundOpacity: number }
      backgroundColor = props.backgroundColor
      backgroundOpacity = props.backgroundOpacity
      continue
    }

    const element = shapeToElement(shape)
    if (element) {
      elements.push(element)
    }
  }

  return {
    version: 1,
    backgroundColor,
    backgroundOpacity,
    elements,
  }
}

function shapeToElement(shape: TLShape): SceneElement | null {
  switch (shape.type) {
    case 'cover-text':
      return textShapeToElement(shape)
    case 'cover-rect':
      return rectShapeToElement(shape)
    case 'cover-ellipse':
      return ellipseShapeToElement(shape)
    case 'cover-image':
      return imageShapeToElement(shape)
    default:
      return null
  }
}

function getOriginalId(shape: TLShape): string {
  const meta = shape.meta as { originalId?: string; originalName?: string }
  return meta.originalId ?? String(shape.id)
}

function getOriginalName(shape: TLShape): string {
  const meta = shape.meta as { originalId?: string; originalName?: string }
  return meta.originalName ?? '未命名'
}

function textShapeToElement(shape: TLShape): TextElement {
  const props = shape.props as {
    w: number
    h: number
    text: string
    fill: string
    fontSize: number
    fontFamily: string
    fontWeight: number
    align: 'left' | 'center' | 'right'
    lineHeight: number
    opacity: number
  }

  return {
    id: getOriginalId(shape),
    name: getOriginalName(shape),
    type: 'text',
    x: shape.x,
    y: shape.y,
    width: props.w,
    height: props.h,
    opacity: props.opacity,
    locked: shape.isLocked,
    text: props.text,
    fill: props.fill,
    fontSize: props.fontSize,
    fontFamily: props.fontFamily,
    fontWeight: props.fontWeight,
    align: props.align,
    lineHeight: props.lineHeight,
  }
}

function rectShapeToElement(shape: TLShape): ShapeElement {
  const props = shape.props as {
    w: number
    h: number
    fill: string
    fillMode: 'solid' | 'gradient'
    gradientStartColor: string
    gradientEndColor: string
    gradientDirection: 'horizontal' | 'vertical' | 'diagonal-down' | 'diagonal-up'
    stroke: string
    strokeWidth: number
    radius: number
    opacity: number
    backgroundCutout: boolean
  }

  return {
    id: getOriginalId(shape),
    name: getOriginalName(shape),
    type: 'rect',
    x: shape.x,
    y: shape.y,
    width: props.w,
    height: props.h,
    opacity: props.opacity,
    locked: shape.isLocked,
    fill: props.fill,
    fillMode: props.fillMode,
    ...(props.fillMode === 'gradient'
      ? {
          gradient: {
            startColor: props.gradientStartColor,
            endColor: props.gradientEndColor,
            direction: props.gradientDirection,
          },
        }
      : {}),
    ...(props.stroke ? { stroke: props.stroke, strokeWidth: props.strokeWidth } : {}),
    ...(props.radius ? { radius: props.radius } : {}),
    ...(props.backgroundCutout ? { backgroundCutout: true } : {}),
  }
}

function ellipseShapeToElement(shape: TLShape): ShapeElement {
  const props = shape.props as {
    w: number
    h: number
    fill: string
    fillMode: 'solid' | 'gradient'
    gradientStartColor: string
    gradientEndColor: string
    gradientDirection: 'horizontal' | 'vertical' | 'diagonal-down' | 'diagonal-up'
    stroke: string
    strokeWidth: number
    opacity: number
    backgroundCutout: boolean
  }

  return {
    id: getOriginalId(shape),
    name: getOriginalName(shape),
    type: 'ellipse',
    x: shape.x,
    y: shape.y,
    width: props.w,
    height: props.h,
    opacity: props.opacity,
    locked: shape.isLocked,
    fill: props.fill,
    fillMode: props.fillMode,
    ...(props.fillMode === 'gradient'
      ? {
          gradient: {
            startColor: props.gradientStartColor,
            endColor: props.gradientEndColor,
            direction: props.gradientDirection,
          },
        }
      : {}),
    ...(props.stroke ? { stroke: props.stroke, strokeWidth: props.strokeWidth } : {}),
    ...(props.backgroundCutout ? { backgroundCutout: true } : {}),
  }
}

function imageShapeToElement(shape: TLShape): ImageElement {
  const props = shape.props as {
    w: number
    h: number
    src: string
    alt: string
    fit: 'cover' | 'contain'
    shape: 'rect' | 'circle'
    opacity: number
    fallbackText: string
  }

  return {
    id: getOriginalId(shape),
    name: getOriginalName(shape),
    type: 'image',
    x: shape.x,
    y: shape.y,
    width: props.w,
    height: props.h,
    opacity: props.opacity,
    locked: shape.isLocked,
    src: props.src,
    alt: props.alt,
    fit: props.fit,
    shape: props.shape,
    ...(props.fallbackText ? { fallbackText: props.fallbackText } : {}),
  }
}

export type DiffMismatch = {
  id: string
  field: string
  original: unknown
  converted: unknown
}

export type DiffResult = {
  elementCount: { original: number; converted: number; match: boolean }
  mismatches: DiffMismatch[]
}

/**
 * Compares two scenes and returns a diff summary.
 * Used to verify round-trip fidelity.
 */
export function diffScenes(original: Scene, converted: Scene): DiffResult {
  const mismatches: DiffMismatch[] = []

  const originalMap = new Map(original.elements.map((el) => [el.id, el]))
  const convertedMap = new Map(converted.elements.map((el) => [el.id, el]))

  // Check all original elements exist in converted
  for (const [id, origEl] of originalMap) {
    const convEl = convertedMap.get(id)
    if (!convEl) {
      mismatches.push({ id, field: '__missing__', original: 'exists', converted: 'missing' })
      continue
    }

    // Compare key fields
    const fields: (keyof SceneElement)[] = ['type', 'x', 'y', 'width', 'height', 'opacity']
    for (const field of fields) {
      if (origEl[field] !== convEl[field]) {
        mismatches.push({
          id,
          field: String(field),
          original: origEl[field],
          converted: convEl[field],
        })
      }
    }
  }

  // Check for extra elements in converted
  for (const id of convertedMap.keys()) {
    if (!originalMap.has(id)) {
      mismatches.push({ id, field: '__extra__', original: 'missing', converted: 'exists' })
    }
  }

  return {
    elementCount: {
      original: original.elements.length,
      converted: converted.elements.length,
      match: original.elements.length === converted.elements.length,
    },
    mismatches,
  }
}
