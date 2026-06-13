import type { Scene, SceneElement } from '@/lib/domain/scene'
import {
  computeSnapOptimized,
  computeSpacingGuidesOptimized,
  type SnapState,
} from '@/lib/algorithms'
import { computeBoundingBox } from '@/lib/algorithms/group-drag'
import type { SpatialIndex } from '@/lib/algorithms/spatial-index'
import type { ProcessResult, MoveDelta } from './utils'
import { clamp } from './utils'

type GroupMoveDragState = {
  mode: 'group-move'
  startX: number
  startY: number
  elements: SceneElement[]
}

export function processGroupMove(
  drag: GroupMoveDragState,
  latest: MoveDelta,
  spatialIndex: SpatialIndex,
  snapState: SnapState,
  canvasWidth: number,
  canvasHeight: number,
): ProcessResult & { nextSnapState: SnapState } {
  const groupBox = computeBoundingBox(drag.elements)
  const rawX = clamp(groupBox.x + latest.dx, -groupBox.width + 24, canvasWidth - 24)
  const rawY = clamp(groupBox.y + latest.dy, -groupBox.height + 24, canvasHeight - 24)

  const groupRect = {
    x: rawX,
    y: rawY,
    width: groupBox.width,
    height: groupBox.height,
  }

  const result = computeSnapOptimized(groupRect, spatialIndex, snapState)

  const spacing = computeSpacingGuidesOptimized(result.snappedRect, spatialIndex)

  const groupDeltaX = result.snappedRect.x - groupBox.x
  const groupDeltaY = result.snappedRect.y - groupBox.y

  const sceneUpdater = (currentScene: Scene): Scene => ({
    ...currentScene,
    elements: currentScene.elements.map((element) => {
      const dragElement = drag.elements.find((el) => el.id === element.id)
      if (!dragElement) {
        return element
      }

      return {
        ...element,
        x: dragElement.x + groupDeltaX,
        y: dragElement.y + groupDeltaY,
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
