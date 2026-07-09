'use client'

import { createShapeId, type Editor, type TLShape, type TLShapeId } from 'tldraw'
import type { Scene, ShapeElement, ImageElement, TextElement } from '@/domain'

// ── Scene → tldraw bridge (one-way) ─────────────────────────────────────────

/**
 * Converts a Scene's elements into tldraw shape records.
 * Handles text, rect, ellipse, and image elements.
 * Stores original element id/name in shape.meta for round-trip fidelity.
 */
export type ResolveSrcFn = (src: string) => string

/**
 * Converts a Scene's elements into tldraw shape records.
 * Handles text, rect, ellipse, and image elements.
 * Stores original element id/name in shape.meta for round-trip fidelity.
 * When resolveSrc is provided, resolves local-asset: srcs to blob URLs for rendering.
 */
export function sceneToTldrawShapes(scene: Scene, resolveSrc?: ResolveSrcFn): TLShape[] {
  return scene.elements
    .filter((el) => el.hidden !== true)
    .flatMap((el) => {
      if (el.type === 'text') return [textElementToShape(el)]
      if (el.type === 'rect') return [rectElementToShape(el)]
      if (el.type === 'ellipse') return [ellipseElementToShape(el)]
      if (el.type === 'image') return [imageElementToShape(el, resolveSrc)]
      return []
    })
}

/**
 * Creates the cover-background shape — the lowest z-index shape that
 * renders the scene's background color, glow, and cutout mask.
 * Must be the first shape so it's behind everything.
 */
export function createBackgroundShape(
  scene: Scene,
  canvasWidth: number,
  canvasHeight: number,
): TLShape {
  return {
    id: createShapeId('cover-background') as TLShapeId,
    typeName: 'shape',
    type: 'cover-background',
    x: 0,
    y: 0,
    rotation: 0,
    isLocked: true,
    opacity: 1,
    props: {
      w: canvasWidth,
      h: canvasHeight,
      backgroundColor: scene.backgroundColor,
      backgroundOpacity: scene.backgroundOpacity,
    },
    parentId: 'page:page',
    index: 'a0', // lowest z-index — behind all elements
    meta: { originalId: '__background__', originalName: 'Background' },
  } as unknown as TLShape
}

function textElementToShape(el: TextElement): TLShape {
  const id = createShapeId(el.id) as TLShapeId

  return {
    id,
    typeName: 'shape',
    type: 'cover-text',
    x: el.x,
    y: el.y,
    rotation: 0,
    isLocked: el.locked === true,
    opacity: el.opacity ?? 1,
    props: {
      w: el.width,
      h: el.height,
      text: el.text,
      fill: el.fill,
      fontSize: el.fontSize,
      fontFamily: el.fontFamily,
      fontWeight: el.fontWeight,
      align: el.align,
      lineHeight: el.lineHeight,
      opacity: el.opacity ?? 1,
    },
    parentId: 'page:page',
    index: 'a1',
    meta: { originalId: el.id, originalName: el.name },
  } as unknown as TLShape
}

function rectElementToShape(el: ShapeElement): TLShape {
  const id = createShapeId(el.id) as TLShapeId

  return {
    id,
    typeName: 'shape',
    type: 'cover-rect',
    x: el.x,
    y: el.y,
    rotation: 0,
    isLocked: el.locked === true,
    opacity: el.opacity ?? 1,
    props: {
      w: el.width,
      h: el.height,
      fill: el.fill,
      fillMode: el.fillMode ?? 'solid',
      gradientStartColor: el.gradient?.startColor ?? '#ffffff',
      gradientEndColor: el.gradient?.endColor ?? '#99f19c',
      gradientDirection: el.gradient?.direction ?? 'horizontal',
      stroke: el.stroke ?? '',
      strokeWidth: el.strokeWidth ?? 0,
      radius: el.radius ?? 0,
      opacity: el.opacity ?? 1,
      backgroundCutout: el.backgroundCutout ?? false,
    },
    parentId: 'page:page',
    index: 'a1',
    meta: { originalId: el.id, originalName: el.name },
  } as unknown as TLShape
}

function ellipseElementToShape(el: ShapeElement): TLShape {
  const id = createShapeId(el.id) as TLShapeId

  return {
    id,
    typeName: 'shape',
    type: 'cover-ellipse',
    x: el.x,
    y: el.y,
    rotation: 0,
    isLocked: el.locked === true,
    opacity: el.opacity ?? 1,
    props: {
      w: el.width,
      h: el.height,
      fill: el.fill,
      fillMode: el.fillMode ?? 'solid',
      gradientStartColor: el.gradient?.startColor ?? '#ffffff',
      gradientEndColor: el.gradient?.endColor ?? '#99f19c',
      gradientDirection: el.gradient?.direction ?? 'horizontal',
      stroke: el.stroke ?? '',
      strokeWidth: el.strokeWidth ?? 0,
      opacity: el.opacity ?? 1,
      backgroundCutout: el.backgroundCutout ?? false,
    },
    parentId: 'page:page',
    index: 'a1',
    meta: { originalId: el.id, originalName: el.name },
  } as unknown as TLShape
}

function imageElementToShape(el: ImageElement, resolveSrc?: ResolveSrcFn): TLShape {
  const id = createShapeId(el.id) as TLShapeId

  // Resolve local-asset: src to blob URL for rendering.
  // Original src is preserved in meta for round-trip fidelity.
  const resolvedSrc = resolveSrc ? resolveSrc(el.src) : el.src

  return {
    id,
    typeName: 'shape',
    type: 'cover-image',
    x: el.x,
    y: el.y,
    rotation: 0,
    isLocked: el.locked === true,
    opacity: el.opacity ?? 1,
    props: {
      w: el.width,
      h: el.height,
      src: resolvedSrc,
      alt: el.alt,
      fit: el.fit,
      shape: el.shape,
      opacity: el.opacity ?? 1,
      fallbackText: el.fallbackText ?? '',
    },
    parentId: 'page:page',
    index: 'a1',
    meta: { originalId: el.id, originalName: el.name, originalSrc: el.src },
  } as unknown as TLShape
}

/**
 * Loads Scene elements into the tldraw editor.
 * Clears existing shapes on the current page first.
 * Adds a background shape as the lowest z-index layer.
 */
export function loadSceneIntoEditor(
  editor: Editor,
  scene: Scene,
  canvasWidth: number = 941,
  canvasHeight: number = 1672,
  resolveSrc?: ResolveSrcFn,
) {
  const existingShapes = editor.getCurrentPageShapes()
  if (existingShapes.length > 0) {
    editor.deleteShapes(existingShapes.map((s) => s.id))
  }

  const bgShape = createBackgroundShape(scene, canvasWidth, canvasHeight)
  const elementShapes = sceneToTldrawShapes(scene, resolveSrc)

  editor.createShapes([bgShape, ...elementShapes])
}
