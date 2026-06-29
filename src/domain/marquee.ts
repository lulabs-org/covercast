/**
 * @file Marquee selection and hit-testing utilities.
 *
 * Manages marquee-box state (start, update, clear) and provides rect
 * intersection/containment tests used to determine which scene elements
 * a marquee selection should include.
 */

import type { SceneElement, Rect } from './scene'

export type MarqueeState = {
  startX: number
  startY: number
  currentX: number
  currentY: number
  isActive: boolean
}

export type HitTestStrategy = 'intersection' | 'contain'

/**
 * Creates a fresh, inactive marquee state with zeroed coordinates.
 * @returns A new `MarqueeState` instance.
 */
export function createMarqueeState(): MarqueeState {
  return {
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isActive: false,
  }
}

/**
 * Activates the marquee at the given start coordinates.
 * @param state - The current marquee state.
 * @param startX - Initial pointer x.
 * @param startY - Initial pointer y.
 * @returns A new active `MarqueeState`.
 */
export function startMarquee(state: MarqueeState, startX: number, startY: number): MarqueeState {
  return {
    ...state,
    startX,
    startY,
    currentX: startX,
    currentY: startY,
    isActive: true,
  }
}

/**
 * Updates the marquee's current pointer position. No-op when inactive.
 * @param state - The current marquee state.
 * @param currentX - Latest pointer x.
 * @param currentY - Latest pointer y.
 * @returns An updated `MarqueeState`.
 */
export function updateMarquee(
  state: MarqueeState,
  currentX: number,
  currentY: number,
): MarqueeState {
  if (!state.isActive) {
    return state
  }

  return {
    ...state,
    currentX,
    currentY,
  }
}

/**
 * Deactivates the marquee while preserving its last coordinates.
 * @param state - The current marquee state.
 * @returns A new inactive `MarqueeState`.
 */
export function clearMarquee(state: MarqueeState): MarqueeState {
  return {
    ...state,
    isActive: false,
  }
}

/**
 * Computes the normalized rect (positive width/height) covered by the marquee.
 * @param state - The current marquee state.
 * @returns A `Rect` describing the marquee bounds.
 */
export function getMarqueeRect(state: MarqueeState): Rect {
  const minX = Math.min(state.startX, state.currentX)
  const minY = Math.min(state.startY, state.currentY)
  const maxX = Math.max(state.startX, state.currentX)
  const maxY = Math.max(state.startY, state.currentY)

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

/**
 * Returns whether the marquee is currently active.
 * @param state - The current marquee state.
 * @returns `true` while a marquee drag is in progress.
 */
export function isMarqueeActive(state: MarqueeState): boolean {
  return state.isActive
}

/**
 * Returns whether the marquee has grown beyond a minimum size threshold.
 * @param state - The current marquee state.
 * @param minSize - Minimum width or height in pixels. Defaults to `5`.
 * @returns `true` when either dimension meets the threshold.
 */
export function hasMarqueeSize(state: MarqueeState, minSize: number = 5): boolean {
  const rect = getMarqueeRect(state)
  return rect.width >= minSize || rect.height >= minSize
}

/**
 * Returns the bounding rect of a scene element.
 * @param element - The element to measure.
 * @returns A `Rect` describing the element's bounds.
 */
export function getElementBounds(element: SceneElement): Rect {
  return {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
  }
}

/**
 * Tests whether two rects overlap (edge-touching counts as a hit).
 * @param a - First rect.
 * @param b - Second rect.
 * @returns `true` when the rects intersect.
 */
export function intersectsRect(a: Rect, b: Rect): boolean {
  const aRight = a.x + a.width
  const aBottom = a.y + a.height
  const bRight = b.x + b.width
  const bBottom = b.y + b.height

  return !(a.x > bRight || aRight < b.x || a.y > bBottom || aBottom < b.y)
}

/**
 * Tests whether `outer` fully contains `inner`.
 * @param outer - The candidate containing rect.
 * @param inner - The candidate contained rect.
 * @returns `true` when `inner` lies entirely within `outer`.
 */
export function containsRect(outer: Rect, inner: Rect): boolean {
  const outerRight = outer.x + outer.width
  const outerBottom = outer.y + outer.height
  const innerRight = inner.x + inner.width
  const innerBottom = inner.y + inner.height

  return (
    outer.x <= inner.x &&
    outerRight >= innerRight &&
    outer.y <= inner.y &&
    outerBottom >= innerBottom
  )
}

/**
 * Hit-tests a single element against a marquee rect using the given strategy.
 * @param marqueeRect - The selection rect.
 * @param element - The element to test.
 * @param strategy - `'intersection'` or `'contain'`.
 * @returns `true` when the element is considered selected.
 */
export function hitTestElement(
  marqueeRect: Rect,
  element: SceneElement,
  strategy: HitTestStrategy,
): boolean {
  const elementRect = getElementBounds(element)

  if (strategy === 'intersection') {
    return intersectsRect(marqueeRect, elementRect)
  }

  return containsRect(marqueeRect, elementRect)
}

/**
 * Hit-tests all elements against a marquee rect, skipping hidden/locked ones.
 * @param marqueeRect - The selection rect.
 * @param elements - Elements to test.
 * @param strategy - `'intersection'` or `'contain'`.
 * @returns An array of selected element ids.
 */
export function hitTestElements(
  marqueeRect: Rect,
  elements: SceneElement[],
  strategy: HitTestStrategy,
): string[] {
  const selectedIds: string[] = []

  for (const element of elements) {
    if (element.hidden === true || element.locked === true) {
      continue
    }

    if (hitTestElement(marqueeRect, element, strategy)) {
      selectedIds.push(element.id)
    }
  }

  return selectedIds
}
