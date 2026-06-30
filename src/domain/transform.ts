/**
 * @file Group transform geometry.
 *
 * Provides drag and resize operations that act on multiple scene elements
 * as a single unit. Includes bounding-box computation, scale-matrix
 * application, per-handle resize math (with optional aspect-ratio lock),
 * group position clamping, and a small dimension formatter.
 */

import type { SceneElement } from './scene'

export type GroupDragState = {
  mode: 'group-move'
  startX: number
  startY: number
  elements: SceneElement[]
}

export type ResizeHandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

export type GroupResizeState = {
  mode: 'group-resize'
  handle: ResizeHandleType
  startX: number
  startY: number
  elements: SceneElement[]
  originalBounds: BoundingBox
}

export type BoundingBox = {
  x: number
  y: number
  width: number
  height: number
}

export type ScaleMatrix = {
  scaleX: number
  scaleY: number
  offsetX: number
  offsetY: number
}

/**
 * Creates a `GroupDragState` snapshot of the given elements at a pointer origin.
 * @param startX - Drag start pointer x.
 * @param startY - Drag start pointer y.
 * @param elements - Elements participating in the drag (shallow-copied).
 * @returns A new `GroupDragState` instance.
 */
export function createGroupDragState(
  startX: number,
  startY: number,
  elements: SceneElement[],
): GroupDragState {
  return {
    mode: 'group-move',
    startX,
    startY,
    elements: elements.map((el) => ({ ...el })),
  }
}

/**
 * Creates a `GroupResizeState` snapshot capturing the resize handle, pointer
 * origin, the participating elements, and their initial bounding box.
 * @param handle - The resize handle being dragged.
 * @param startX - Resize start pointer x.
 * @param startY - Resize start pointer y.
 * @param elements - Elements participating in the resize (shallow-copied).
 * @returns A new `GroupResizeState` instance.
 */
export function createGroupResizeState(
  handle: ResizeHandleType,
  startX: number,
  startY: number,
  elements: SceneElement[],
): GroupResizeState {
  return {
    mode: 'group-resize',
    handle,
    startX,
    startY,
    elements: elements.map((el) => ({ ...el })),
    originalBounds: computeBoundingBox(elements),
  }
}

/**
 * Computes the axis-aligned bounding box that contains all given elements.
 * Returns a zero-sized box at the origin when the input is empty.
 * @param elements - The elements to bound.
 * @returns A `BoundingBox` covering all elements.
 */
export function computeBoundingBox(elements: SceneElement[]): BoundingBox {
  if (elements.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const element of elements) {
    minX = Math.min(minX, element.x)
    minY = Math.min(minY, element.y)
    maxX = Math.max(maxX, element.x + element.width)
    maxY = Math.max(maxY, element.y + element.height)
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

/**
 * Computes the scale matrix that maps `originalBounds` onto `newBounds`.
 * @param originalBounds - The source bounds.
 * @param newBounds - The target bounds.
 * @returns A `ScaleMatrix` with scale factors and offsets.
 */
export function computeScaleMatrix(
  originalBounds: BoundingBox,
  newBounds: BoundingBox,
): ScaleMatrix {
  const scaleX = newBounds.width / originalBounds.width
  const scaleY = newBounds.height / originalBounds.height

  return {
    scaleX,
    scaleY,
    offsetX: newBounds.x - originalBounds.x * scaleX,
    offsetY: newBounds.y - originalBounds.y * scaleY,
  }
}

/**
 * Applies a scale matrix to a single element, producing a scaled copy.
 * @param element - The element to transform.
 * @param matrix - The scale matrix to apply.
 * @returns A new element with updated position and dimensions.
 */
export function applyScaleToElement(element: SceneElement, matrix: ScaleMatrix): SceneElement {
  const newX = element.x * matrix.scaleX + matrix.offsetX
  const newY = element.y * matrix.scaleY + matrix.offsetY
  const newWidth = element.width * matrix.scaleX
  const newHeight = element.height * matrix.scaleY

  return {
    ...element,
    x: newX,
    y: newY,
    width: newWidth,
    height: newHeight,
  } as SceneElement
}

/**
 * Resizes a group of elements by mapping their original bounds to new bounds.
 * @param originalElements - The elements at the start of the resize.
 * @param originalBounds - The group's bounding box at resize start.
 * @param newBounds - The target bounding box after resize.
 * @returns A new array of scaled elements.
 */
export function applyGroupResize(
  originalElements: SceneElement[],
  originalBounds: BoundingBox,
  newBounds: BoundingBox,
): SceneElement[] {
  const matrix = computeScaleMatrix(originalBounds, newBounds)
  return originalElements.map((element) => applyScaleToElement(element, matrix))
}

/**
 * Computes the new bounding box for a resize gesture based on the dragged
 * handle and the pointer delta. Optionally preserves the original aspect
 * ratio and enforces a minimum size of 10 pixels.
 * @param originalBounds - The bounding box at the start of the resize.
 * @param handle - The resize handle being dragged.
 * @param delta - Pointer displacement (with `dx` and `dy`) since resize start.
 * @param maintainAspectRatio - When `true`, lock width/height ratio.
 * @returns The resulting `BoundingBox`.
 */
export function computeNewBoundsFromHandle(
  originalBounds: BoundingBox,
  handle: ResizeHandleType,
  delta: { dx: number; dy: number },
  maintainAspectRatio: boolean,
): BoundingBox {
  const { x, y, width, height } = originalBounds
  const aspectRatio = width / height

  let newX = x
  let newY = y
  let newWidth = width
  let newHeight = height

  switch (handle) {
    case 'nw':
      newX = x + delta.dx
      newY = y + delta.dy
      newWidth = width - delta.dx
      newHeight = height - delta.dy
      if (maintainAspectRatio) {
        if (Math.abs(delta.dx) > Math.abs(delta.dy)) {
          newHeight = newWidth / aspectRatio
          newY = y + height - newHeight
        } else {
          newWidth = newHeight * aspectRatio
          newX = x + width - newWidth
        }
      }
      break
    case 'n':
      newY = y + delta.dy
      newHeight = height - delta.dy
      if (maintainAspectRatio) {
        newWidth = newHeight * aspectRatio
        newX = x + (width - newWidth) / 2
      }
      break
    case 'ne':
      newY = y + delta.dy
      newWidth = width + delta.dx
      newHeight = height - delta.dy
      if (maintainAspectRatio) {
        if (Math.abs(delta.dx) > Math.abs(delta.dy)) {
          newHeight = newWidth / aspectRatio
          newY = y + height - newHeight
        } else {
          newWidth = newHeight * aspectRatio
        }
      }
      break
    case 'e':
      newWidth = width + delta.dx
      if (maintainAspectRatio) {
        newHeight = newWidth / aspectRatio
        newY = y + (height - newHeight) / 2
      }
      break
    case 'se':
      newWidth = width + delta.dx
      newHeight = height + delta.dy
      if (maintainAspectRatio) {
        if (Math.abs(delta.dx) > Math.abs(delta.dy)) {
          newHeight = newWidth / aspectRatio
        } else {
          newWidth = newHeight * aspectRatio
        }
      }
      break
    case 's':
      newHeight = height + delta.dy
      if (maintainAspectRatio) {
        newWidth = newHeight * aspectRatio
        newX = x + (width - newWidth) / 2
      }
      break
    case 'sw':
      newX = x + delta.dx
      newWidth = width - delta.dx
      newHeight = height + delta.dy
      if (maintainAspectRatio) {
        if (Math.abs(delta.dx) > Math.abs(delta.dy)) {
          newHeight = newWidth / aspectRatio
        } else {
          newWidth = newHeight * aspectRatio
          newX = x + width - newWidth
        }
      }
      break
    case 'w':
      newX = x + delta.dx
      newWidth = width - delta.dx
      if (maintainAspectRatio) {
        newHeight = newWidth / aspectRatio
        newY = y + (height - newHeight) / 2
      }
      break
  }

  if (newWidth < 10) {
    newWidth = 10
    if (handle.includes('w')) {
      newX = x + width - 10
    }
  }
  if (newHeight < 10) {
    newHeight = 10
    if (handle.includes('n')) {
      newY = y + height - 10
    }
  }

  return {
    x: newX,
    y: newY,
    width: newWidth,
    height: newHeight,
  }
}

/**
 * Applies a translation delta to every element in the group.
 * @param originalElements - The elements at the start of the drag.
 * @param delta - Pointer displacement (with `dx` and `dy`) since drag start.
 * @returns A new array of translated elements.
 */
export function applyGroupDragDelta(
  originalElements: SceneElement[],
  delta: { dx: number; dy: number },
): SceneElement[] {
  return originalElements.map((element) => ({
    ...element,
    x: element.x + delta.dx,
    y: element.y + delta.dy,
  }))
}

/**
 * Shifts the group so its bounding box stays within the supplied bounds.
 * Returns the input array unchanged when no clamping is required.
 * @param elements - The elements to constrain.
 * @param bounds - Inclusive bounds (`minX`, `minY`, `maxX`, `maxY`).
 * @returns A new array of shifted elements, or the input when already in bounds.
 */
export function clampGroupPosition(
  elements: SceneElement[],
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
): SceneElement[] {
  const box = computeBoundingBox(elements)

  const offsetX = box.x < bounds.minX ? bounds.minX - box.x : 0
  const offsetY = box.y < bounds.minY ? bounds.minY - box.y : 0
  const offsetMaxX = box.x + box.width > bounds.maxX ? bounds.maxX - (box.x + box.width) : 0
  const offsetMaxY = box.y + box.height > bounds.maxY ? bounds.maxY - (box.y + box.height) : 0

  const finalOffsetX = offsetX !== 0 ? offsetX : offsetMaxX
  const finalOffsetY = offsetY !== 0 ? offsetY : offsetMaxY

  if (finalOffsetX === 0 && finalOffsetY === 0) {
    return elements
  }

  return elements.map((element) => ({
    ...element,
    x: element.x + finalOffsetX,
    y: element.y + finalOffsetY,
  }))
}

/**
 * Formats a `width × height` pair as a rounded display string.
 * @param width - The width in pixels.
 * @param height - The height in pixels.
 * @returns A string like `"300 × 180"`.
 */
export function formatDimension(width: number, height: number): string {
  return `${Math.round(width)} × ${Math.round(height)}`
}
