import type { SceneElement } from "./scene";

export type GroupDragState = {
  mode: "group-move";
  startX: number;
  startY: number;
  elements: SceneElement[];
};

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function createGroupDragState(
  startX: number,
  startY: number,
  elements: SceneElement[]
): GroupDragState {
  return {
    mode: "group-move",
    startX,
    startY,
    elements: elements.map((el) => ({ ...el })),
  };
}

export function computeBoundingBox(elements: SceneElement[]): BoundingBox {
  if (elements.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const element of elements) {
    minX = Math.min(minX, element.x);
    minY = Math.min(minY, element.y);
    maxX = Math.max(maxX, element.x + element.width);
    maxY = Math.max(maxY, element.y + element.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function applyGroupDragDelta(
  originalElements: SceneElement[],
  delta: { dx: number; dy: number }
): SceneElement[] {
  return originalElements.map((element) => ({
    ...element,
    x: element.x + delta.dx,
    y: element.y + delta.dy,
  }));
}

export function clampGroupPosition(
  elements: SceneElement[],
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
): SceneElement[] {
  const box = computeBoundingBox(elements);

  const offsetX = box.x < bounds.minX ? bounds.minX - box.x : 0;
  const offsetY = box.y < bounds.minY ? bounds.minY - box.y : 0;
  const offsetMaxX = box.x + box.width > bounds.maxX ? bounds.maxX - (box.x + box.width) : 0;
  const offsetMaxY = box.y + box.height > bounds.maxY ? bounds.maxY - (box.y + box.height) : 0;

  const finalOffsetX = offsetX !== 0 ? offsetX : offsetMaxX;
  const finalOffsetY = offsetY !== 0 ? offsetY : offsetMaxY;

  if (finalOffsetX === 0 && finalOffsetY === 0) {
    return elements;
  }

  return elements.map((element) => ({
    ...element,
    x: element.x + finalOffsetX,
    y: element.y + finalOffsetY,
  }));
}

export function formatDimension(width: number, height: number): string {
  return `${Math.round(width)} × ${Math.round(height)}`;
}