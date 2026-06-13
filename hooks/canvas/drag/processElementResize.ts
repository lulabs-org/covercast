import type { Scene, SceneElement } from '@/lib/scene'
import {
  computeResizeSnapOptimized,
  computeGuidesOptimized,
  computeSpacingGuidesOptimized,
  type ResizeSnapState,
} from '@/lib/smart-guide'
import type { SpatialIndex } from '@/lib/spatial-index'
import type { ProcessResult, MoveDelta } from './utils'
import { clamp, minimumWidth, minimumHeight } from './utils'

export type SingleResizeDragState = {
  id: string
  mode: 'resize'
  startX: number
  startY: number
  element: SceneElement
}

export function processElementResize(
  drag: SingleResizeDragState,
  latest: MoveDelta,
  spatialIndex: SpatialIndex,
  resizeSnapState: ResizeSnapState,
  canvasWidth: number,
  canvasHeight: number,
): ProcessResult & { nextSnapState: ResizeSnapState } {
  const rawWidth = clamp(
    drag.element.width + latest.dx,
    minimumWidth(drag.element),
    canvasWidth - drag.element.x,
  )
  const rawHeight = clamp(
    drag.element.height + latest.dy,
    minimumHeight(drag.element),
    canvasHeight - drag.element.y,
  )

  const resizeSnap = computeResizeSnapOptimized(
    { x: drag.element.x, y: drag.element.y, width: rawWidth, height: rawHeight },
    spatialIndex,
    resizeSnapState,
  )

  const snappedWidth = clamp(
    resizeSnap.snappedWidth,
    minimumWidth(drag.element),
    canvasWidth - drag.element.x,
  )
  const snappedHeight = clamp(
    resizeSnap.snappedHeight,
    minimumHeight(drag.element),
    canvasHeight - drag.element.y,
  )

  const snappedRect = {
    x: drag.element.x,
    y: drag.element.y,
    width: snappedWidth,
    height: snappedHeight,
  }

  const resizeGuides = computeGuidesOptimized(snappedRect, spatialIndex)
  const resizeSpacing = computeSpacingGuidesOptimized(snappedRect, spatialIndex)

  const sceneUpdater = (currentScene: Scene): Scene => ({
    ...currentScene,
    elements: currentScene.elements.map((element) => {
      if (element.id !== drag.id) {
        return element
      }

      return {
        ...element,
        width: snappedWidth,
        height: snappedHeight,
      } as SceneElement
    }),
  })

  return {
    sceneUpdater,
    guides: resizeGuides,
    spacingGuides: resizeSpacing,
    resizeLabel: {
      x: drag.element.x + snappedWidth / 2,
      y: drag.element.y + snappedHeight,
      w: Math.round(snappedWidth),
      h: Math.round(snappedHeight),
    },
    nextSnapState: resizeSnap.snapState,
  }
}
