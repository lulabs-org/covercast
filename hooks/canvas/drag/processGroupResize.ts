import type { Scene, SceneElement } from '@/lib/domain/scene'
import {
  computeResizeSnapOptimized,
  computeGuidesOptimized,
  computeSpacingGuidesOptimized,
  type ResizeSnapState,
} from '@/lib/algorithms'
import {
  computeNewBoundsFromHandle,
  type BoundingBox,
  type ResizeHandleType,
} from '@/lib/algorithms/group-drag'
import type { SpatialIndex } from '@/lib/algorithms/spatial-index'
import type { ProcessResult, MoveDelta } from './utils'
import { clamp } from './utils'

type GroupResizeDragState = {
  mode: 'group-resize'
  handle: ResizeHandleType
  startX: number
  startY: number
  elements: SceneElement[]
  originalBounds: BoundingBox
}

export function processGroupResize(
  drag: GroupResizeDragState,
  latest: MoveDelta,
  spatialIndex: SpatialIndex,
  resizeSnapState: ResizeSnapState,
  canvasWidth: number,
  canvasHeight: number,
): ProcessResult & { nextSnapState: ResizeSnapState } {
  const newBounds = computeNewBoundsFromHandle(
    drag.originalBounds,
    drag.handle,
    latest,
    latest.shiftKey,
  )

  const clampedBounds: BoundingBox = {
    x: clamp(newBounds.x, 0, canvasWidth - 10),
    y: clamp(newBounds.y, 0, canvasHeight - 10),
    width: clamp(newBounds.width, 10, canvasWidth - newBounds.x),
    height: clamp(newBounds.height, 10, canvasHeight - newBounds.y),
  }

  const resizeSnap = computeResizeSnapOptimized(clampedBounds, spatialIndex, resizeSnapState)

  const snappedBounds: BoundingBox = {
    x: clampedBounds.x,
    y: clampedBounds.y,
    width: clamp(resizeSnap.snappedWidth, 10, canvasWidth - clampedBounds.x),
    height: clamp(resizeSnap.snappedHeight, 10, canvasHeight - clampedBounds.y),
  }

  const resizeGuides = computeGuidesOptimized(snappedBounds, spatialIndex)
  const resizeSpacing = computeSpacingGuidesOptimized(snappedBounds, spatialIndex)

  const scaleMatrix = {
    scaleX: snappedBounds.width / drag.originalBounds.width,
    scaleY: snappedBounds.height / drag.originalBounds.height,
    offsetX:
      snappedBounds.x - drag.originalBounds.x * (snappedBounds.width / drag.originalBounds.width),
    offsetY:
      snappedBounds.y - drag.originalBounds.y * (snappedBounds.height / drag.originalBounds.height),
  }

  const sceneUpdater = (currentScene: Scene): Scene => ({
    ...currentScene,
    elements: currentScene.elements.map((element) => {
      const dragElement = drag.elements.find((el) => el.id === element.id)
      if (!dragElement) {
        return element
      }

      return {
        ...element,
        x: dragElement.x * scaleMatrix.scaleX + scaleMatrix.offsetX,
        y: dragElement.y * scaleMatrix.scaleY + scaleMatrix.offsetY,
        width: dragElement.width * scaleMatrix.scaleX,
        height: dragElement.height * scaleMatrix.scaleY,
      } as SceneElement
    }),
  })

  return {
    sceneUpdater,
    guides: resizeGuides,
    spacingGuides: resizeSpacing,
    resizeLabel: {
      x: snappedBounds.x + snappedBounds.width / 2,
      y: snappedBounds.y + snappedBounds.height,
      w: Math.round(snappedBounds.width),
      h: Math.round(snappedBounds.height),
    },
    nextSnapState: resizeSnap.snapState,
  }
}
