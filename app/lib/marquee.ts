import type { SceneElement } from "./scene";

export type MarqueeState = {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isActive: boolean;
};

export type HitTestStrategy = "intersection" | "contain";

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function createMarqueeState(): MarqueeState {
  return {
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isActive: false,
  };
}

export function startMarquee(
  state: MarqueeState,
  startX: number,
  startY: number
): MarqueeState {
  return {
    ...state,
    startX,
    startY,
    currentX: startX,
    currentY: startY,
    isActive: true,
  };
}

export function updateMarquee(
  state: MarqueeState,
  currentX: number,
  currentY: number
): MarqueeState {
  if (!state.isActive) {
    return state;
  }

  return {
    ...state,
    currentX,
    currentY,
  };
}

export function clearMarquee(state: MarqueeState): MarqueeState {
  return {
    ...state,
    isActive: false,
  };
}

export function getMarqueeRect(state: MarqueeState): Rect {
  const minX = Math.min(state.startX, state.currentX);
  const minY = Math.min(state.startY, state.currentY);
  const maxX = Math.max(state.startX, state.currentX);
  const maxY = Math.max(state.startY, state.currentY);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function isMarqueeActive(state: MarqueeState): boolean {
  return state.isActive;
}

export function hasMarqueeSize(state: MarqueeState, minSize: number = 5): boolean {
  const rect = getMarqueeRect(state);
  return rect.width >= minSize || rect.height >= minSize;
}

export function getElementBounds(element: SceneElement): Rect {
  return {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
  };
}

export function intersectsRect(a: Rect, b: Rect): boolean {
  const aRight = a.x + a.width;
  const aBottom = a.y + a.height;
  const bRight = b.x + b.width;
  const bBottom = b.y + b.height;

  return !(a.x > bRight || aRight < b.x || a.y > bBottom || aBottom < b.y);
}

export function containsRect(outer: Rect, inner: Rect): boolean {
  const outerRight = outer.x + outer.width;
  const outerBottom = outer.y + outer.height;
  const innerRight = inner.x + inner.width;
  const innerBottom = inner.y + inner.height;

  return (
    outer.x <= inner.x &&
    outerRight >= innerRight &&
    outer.y <= inner.y &&
    outerBottom >= innerBottom
  );
}

export function hitTestElement(
  marqueeRect: Rect,
  element: SceneElement,
  strategy: HitTestStrategy
): boolean {
  const elementRect = getElementBounds(element);

  if (strategy === "intersection") {
    return intersectsRect(marqueeRect, elementRect);
  }

  return containsRect(marqueeRect, elementRect);
}

export function hitTestElements(
  marqueeRect: Rect,
  elements: SceneElement[],
  strategy: HitTestStrategy
): string[] {
  const selectedIds: string[] = [];

  for (const element of elements) {
    if (element.hidden === true || element.locked === true) {
      continue;
    }

    if (hitTestElement(marqueeRect, element, strategy)) {
      selectedIds.push(element.id);
    }
  }

  return selectedIds;
}