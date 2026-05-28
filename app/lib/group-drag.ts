import type { SceneElement } from "./scene";

export type GroupDragState = {
  mode: "group-move";
  startX: number;
  startY: number;
  elements: SceneElement[];
};

export type ResizeHandleType =
  | "nw"
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w";

export type GroupResizeState = {
  mode: "group-resize";
  handle: ResizeHandleType;
  startX: number;
  startY: number;
  elements: SceneElement[];
  originalBounds: BoundingBox;
};

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ScaleMatrix = {
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
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

export function createGroupResizeState(
  handle: ResizeHandleType,
  startX: number,
  startY: number,
  elements: SceneElement[]
): GroupResizeState {
  return {
    mode: "group-resize",
    handle,
    startX,
    startY,
    elements: elements.map((el) => ({ ...el })),
    originalBounds: computeBoundingBox(elements),
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

export function computeScaleMatrix(
  originalBounds: BoundingBox,
  newBounds: BoundingBox
): ScaleMatrix {
  const scaleX = newBounds.width / originalBounds.width;
  const scaleY = newBounds.height / originalBounds.height;

  return {
    scaleX,
    scaleY,
    offsetX: newBounds.x - originalBounds.x * scaleX,
    offsetY: newBounds.y - originalBounds.y * scaleY,
  };
}

export function applyScaleToElement(
  element: SceneElement,
  matrix: ScaleMatrix
): SceneElement {
  const newX = element.x * matrix.scaleX + matrix.offsetX;
  const newY = element.y * matrix.scaleY + matrix.offsetY;
  const newWidth = element.width * matrix.scaleX;
  const newHeight = element.height * matrix.scaleY;

  return {
    ...element,
    x: newX,
    y: newY,
    width: newWidth,
    height: newHeight,
  } as SceneElement;
}

export function applyGroupResize(
  originalElements: SceneElement[],
  originalBounds: BoundingBox,
  newBounds: BoundingBox
): SceneElement[] {
  const matrix = computeScaleMatrix(originalBounds, newBounds);
  return originalElements.map((element) => applyScaleToElement(element, matrix));
}

export function computeNewBoundsFromHandle(
  originalBounds: BoundingBox,
  handle: ResizeHandleType,
  delta: { dx: number; dy: number },
  maintainAspectRatio: boolean
): BoundingBox {
  const { x, y, width, height } = originalBounds;
  const aspectRatio = width / height;

  let newX = x;
  let newY = y;
  let newWidth = width;
  let newHeight = height;

  switch (handle) {
    case "nw":
      newX = x + delta.dx;
      newY = y + delta.dy;
      newWidth = width - delta.dx;
      newHeight = height - delta.dy;
      if (maintainAspectRatio) {
        if (Math.abs(delta.dx) > Math.abs(delta.dy)) {
          newHeight = newWidth / aspectRatio;
          newY = y + height - newHeight;
        } else {
          newWidth = newHeight * aspectRatio;
          newX = x + width - newWidth;
        }
      }
      break;
    case "n":
      newY = y + delta.dy;
      newHeight = height - delta.dy;
      if (maintainAspectRatio) {
        newWidth = newHeight * aspectRatio;
        newX = x + (width - newWidth) / 2;
      }
      break;
    case "ne":
      newY = y + delta.dy;
      newWidth = width + delta.dx;
      newHeight = height - delta.dy;
      if (maintainAspectRatio) {
        if (Math.abs(delta.dx) > Math.abs(delta.dy)) {
          newHeight = newWidth / aspectRatio;
          newY = y + height - newHeight;
        } else {
          newWidth = newHeight * aspectRatio;
        }
      }
      break;
    case "e":
      newWidth = width + delta.dx;
      if (maintainAspectRatio) {
        newHeight = newWidth / aspectRatio;
        newY = y + (height - newHeight) / 2;
      }
      break;
    case "se":
      newWidth = width + delta.dx;
      newHeight = height + delta.dy;
      if (maintainAspectRatio) {
        if (Math.abs(delta.dx) > Math.abs(delta.dy)) {
          newHeight = newWidth / aspectRatio;
        } else {
          newWidth = newHeight * aspectRatio;
        }
      }
      break;
    case "s":
      newHeight = height + delta.dy;
      if (maintainAspectRatio) {
        newWidth = newHeight * aspectRatio;
        newX = x + (width - newWidth) / 2;
      }
      break;
    case "sw":
      newX = x + delta.dx;
      newWidth = width - delta.dx;
      newHeight = height + delta.dy;
      if (maintainAspectRatio) {
        if (Math.abs(delta.dx) > Math.abs(delta.dy)) {
          newHeight = newWidth / aspectRatio;
        } else {
          newWidth = newHeight * aspectRatio;
          newX = x + width - newWidth;
        }
      }
      break;
    case "w":
      newX = x + delta.dx;
      newWidth = width - delta.dx;
      if (maintainAspectRatio) {
        newHeight = newWidth / aspectRatio;
        newY = y + (height - newHeight) / 2;
      }
      break;
  }

  if (newWidth < 10) {
    newWidth = 10;
    if (handle.includes("w")) {
      newX = x + width - 10;
    }
  }
  if (newHeight < 10) {
    newHeight = 10;
    if (handle.includes("n")) {
      newY = y + height - 10;
    }
  }

  return {
    x: newX,
    y: newY,
    width: newWidth,
    height: newHeight,
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