import type { Scene, SceneElement } from '@/lib/scene'
import {
  computeSnapOptimized,
  computeSpacingGuidesOptimized,
  type SnapState,
} from '@/lib/smart-guide'
import type { SpatialIndex } from '@/lib/spatial-index'
import type { ProcessResult, MoveDelta } from './utils'
import { clamp } from './utils'

export type SingleMoveDragState = {
  id: string
  mode: 'move'
  startX: number
  startY: number
  element: SceneElement
}

export function processElementMove(
  drag: SingleMoveDragState,
  latest: MoveDelta,
  spatialIndex: SpatialIndex,
  snapState: SnapState,
  canvasWidth: number,
  canvasHeight: number,
): ProcessResult & { nextSnapState: SnapState } {
  const rawX = clamp(drag.element.x + latest.dx, -drag.element.width + 24, canvasWidth - 24)
  const rawY = clamp(drag.element.y + latest.dy, -drag.element.height + 24, canvasHeight - 24)

  const result = computeSnapOptimized(
    { x: rawX, y: rawY, width: drag.element.width, height: drag.element.height },
    spatialIndex,
    snapState,
  )

  const spacing = computeSpacingGuidesOptimized(result.snappedRect, spatialIndex)

  const sceneUpdater = (currentScene: Scene): Scene => ({
    ...currentScene,
    elements: currentScene.elements.map((element) => {
      if (element.id !== drag.id) {
        return element
      }

      return {
        ...element,
        x: result.snappedRect.x,
        y: result.snappedRect.y,
      } as SceneElement
    }),
  })

  return {
    sceneUpdater,
    guides: result.guides,
    spacingGuides: spacing,
    resizeLabel: null,
    nextSnapState: result.snapState,
  }
}
