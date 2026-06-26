/**
 * 拖拽领域 (Drag Domain)
 *
 * 把 useDragManager 的 `processMoveFrame` 拆成 4 个纯 frame 函数,每个对应一种拖拽模式。
 * 输入:当前拖拽状态 + 上下文(画布尺寸 / spatialIndex / snapState)
 * 输出:新 scene、新 guides / spacingGuides / resizeLabel、新 snapState
 *
 * 不依赖 React、不调用 setScene / rAF——这些副作用由 useDragManager hook 编排。
 * 不依赖 DOM——`getSvgPoint` 留在 hook(它调用 `svg.createSVGPoint()`)。
 */

import { type Scene, type SceneElement, isTextElement } from './types'
import {
  type BoundingBox,
  type GroupDragState,
  type GroupResizeState,
  computeBoundingBox,
  computeNewBoundsFromHandle,
} from './transform'
import {
  type GuideLine,
  type MeasurementGuide,
  type ResizeLabel,
  type SnapState,
  type ResizeSnapState,
  type SpatialIndex,
  computeSnapOptimized,
  computeSpacingGuidesOptimized,
  computeResizeSnapOptimized,
  computeGuidesOptimized,
} from '../alignment'
import { clamp } from '@/shared/lib'

/** 单元素拖拽状态(move 或 resize) */
export type SingleDragState = {
  id: string
  mode: 'move' | 'resize'
  startX: number
  startY: number
  element: SceneElement
}

/** 拖拽状态联合(move / resize / group-move / group-resize) */
export type DragState = SingleDragState | GroupDragState | GroupResizeState

/** 拖拽过程中一帧的位移与修饰键状态 */
export type DragMoveDelta = {
  dx: number
  dy: number
  shiftKey: boolean
}

/** 拖拽上下文:画布尺寸 + 空间索引 + 当前吸附状态 */
export type DragContext = {
  canvasWidth: number
  canvasHeight: number
  spatialIndex: SpatialIndex
  snapState: SnapState
  resizeSnapState: ResizeSnapState
}

/** frame 函数返回:新 scene + 新 UI 状态 + 更新后的吸附状态 */
export type DragFrameResult = {
  scene: Scene
  guides: GuideLine[]
  spacingGuides: MeasurementGuide[]
  resizeLabel: ResizeLabel | null
  snapState: SnapState
  resizeSnapState: ResizeSnapState
}

/** 拖拽时画布边界的留白(元素至少 24px 留在画布内) */
const DRAG_EDGE_MARGIN = 24

/** resize 时画布边界的留白 */
const RESIZE_EDGE_MARGIN = 10

/** resize 时尺寸下限 */
const RESIZE_MIN_SIZE = 10

/**
 * 元素拖拽时的最小宽度(domain 规则)。
 * - text:至少 40px(避免文字元素过窄无法编辑)
 * - ellipse:14px(避免椭圆退化)
 * - 其他:28px
 */
export function minimumWidth(element: SceneElement): number {
  if (isTextElement(element)) {
    return 40
  }

  if (element.type === 'ellipse') {
    return 14
  }

  return 28
}

/**
 * 元素拖拽时的最小高度(domain 规则)。
 * - text:至少 max(24, fontSize)(避免文字行被截断)
 * - ellipse:14px
 * - 其他:28px
 */
export function minimumHeight(element: SceneElement): number {
  if (isTextElement(element)) {
    return Math.max(24, element.fontSize)
  }

  if (element.type === 'ellipse') {
    return 14
  }

  return 28
}

/**
 * group-move 帧:计算整组元素的新位置,带吸附。
 */
export function computeGroupMoveFrame(
  drag: GroupDragState,
  delta: DragMoveDelta,
  currentScene: Scene,
  ctx: DragContext,
): DragFrameResult {
  const groupBox = computeBoundingBox(drag.elements)
  const rawX = clamp(
    groupBox.x + delta.dx,
    -groupBox.width + DRAG_EDGE_MARGIN,
    ctx.canvasWidth - DRAG_EDGE_MARGIN,
  )
  const rawY = clamp(
    groupBox.y + delta.dy,
    -groupBox.height + DRAG_EDGE_MARGIN,
    ctx.canvasHeight - DRAG_EDGE_MARGIN,
  )

  const groupRect = {
    x: rawX,
    y: rawY,
    width: groupBox.width,
    height: groupBox.height,
  }

  const result = computeSnapOptimized(groupRect, ctx.spatialIndex, ctx.snapState)

  const spacing = computeSpacingGuidesOptimized(result.snappedRect, ctx.spatialIndex)

  const groupDeltaX = result.snappedRect.x - groupBox.x
  const groupDeltaY = result.snappedRect.y - groupBox.y

  const nextScene: Scene = {
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
  }

  return {
    scene: nextScene,
    guides: result.guides,
    spacingGuides: spacing,
    resizeLabel: null,
    snapState: result.snapState,
    resizeSnapState: ctx.resizeSnapState,
  }
}

/**
 * group-resize 帧:按 handle 缩放整组元素,带吸附。
 */
export function computeGroupResizeFrame(
  drag: GroupResizeState,
  delta: DragMoveDelta,
  currentScene: Scene,
  ctx: DragContext,
): DragFrameResult {
  const newBounds = computeNewBoundsFromHandle(
    drag.originalBounds,
    drag.handle,
    delta,
    delta.shiftKey,
  )

  const clampedBounds: BoundingBox = {
    x: clamp(newBounds.x, 0, ctx.canvasWidth - RESIZE_EDGE_MARGIN),
    y: clamp(newBounds.y, 0, ctx.canvasHeight - RESIZE_EDGE_MARGIN),
    width: clamp(newBounds.width, RESIZE_MIN_SIZE, ctx.canvasWidth - newBounds.x),
    height: clamp(newBounds.height, RESIZE_MIN_SIZE, ctx.canvasHeight - newBounds.y),
  }

  const resizeSnap = computeResizeSnapOptimized(
    clampedBounds,
    ctx.spatialIndex,
    ctx.resizeSnapState,
  )

  const snappedBounds: BoundingBox = {
    x: clampedBounds.x,
    y: clampedBounds.y,
    width: clamp(resizeSnap.snappedWidth, RESIZE_MIN_SIZE, ctx.canvasWidth - clampedBounds.x),
    height: clamp(resizeSnap.snappedHeight, RESIZE_MIN_SIZE, ctx.canvasHeight - clampedBounds.y),
  }

  const resizeGuides = computeGuidesOptimized(snappedBounds, ctx.spatialIndex)
  const resizeSpacing = computeSpacingGuidesOptimized(snappedBounds, ctx.spatialIndex)

  const scaleMatrix = {
    scaleX: snappedBounds.width / drag.originalBounds.width,
    scaleY: snappedBounds.height / drag.originalBounds.height,
    offsetX:
      snappedBounds.x - drag.originalBounds.x * (snappedBounds.width / drag.originalBounds.width),
    offsetY:
      snappedBounds.y - drag.originalBounds.y * (snappedBounds.height / drag.originalBounds.height),
  }

  const nextScene: Scene = {
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
  }

  return {
    scene: nextScene,
    guides: resizeGuides,
    spacingGuides: resizeSpacing,
    resizeLabel: {
      x: snappedBounds.x + snappedBounds.width / 2,
      y: snappedBounds.y + snappedBounds.height,
      w: Math.round(snappedBounds.width),
      h: Math.round(snappedBounds.height),
    },
    snapState: ctx.snapState,
    resizeSnapState: resizeSnap.snapState,
  }
}

/**
 * single-move 帧:计算单个元素的新位置,带吸附。
 */
export function computeSingleMoveFrame(
  drag: SingleDragState,
  delta: DragMoveDelta,
  currentScene: Scene,
  ctx: DragContext,
): DragFrameResult {
  const rawX = clamp(
    drag.element.x + delta.dx,
    -drag.element.width + DRAG_EDGE_MARGIN,
    ctx.canvasWidth - DRAG_EDGE_MARGIN,
  )
  const rawY = clamp(
    drag.element.y + delta.dy,
    -drag.element.height + DRAG_EDGE_MARGIN,
    ctx.canvasHeight - DRAG_EDGE_MARGIN,
  )

  const result = computeSnapOptimized(
    { x: rawX, y: rawY, width: drag.element.width, height: drag.element.height },
    ctx.spatialIndex,
    ctx.snapState,
  )

  const spacing = computeSpacingGuidesOptimized(result.snappedRect, ctx.spatialIndex)

  const nextScene: Scene = {
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
  }

  return {
    scene: nextScene,
    guides: result.guides,
    spacingGuides: spacing,
    resizeLabel: null,
    snapState: result.snapState,
    resizeSnapState: ctx.resizeSnapState,
  }
}

/**
 * single-resize 帧:按 delta 调整单个元素尺寸,带吸附与最小尺寸约束。
 */
export function computeSingleResizeFrame(
  drag: SingleDragState,
  delta: DragMoveDelta,
  currentScene: Scene,
  ctx: DragContext,
): DragFrameResult {
  const rawWidth = clamp(
    drag.element.width + delta.dx,
    minimumWidth(drag.element),
    ctx.canvasWidth - drag.element.x,
  )
  const rawHeight = clamp(
    drag.element.height + delta.dy,
    minimumHeight(drag.element),
    ctx.canvasHeight - drag.element.y,
  )

  const resizeSnap = computeResizeSnapOptimized(
    { x: drag.element.x, y: drag.element.y, width: rawWidth, height: rawHeight },
    ctx.spatialIndex,
    ctx.resizeSnapState,
  )

  const snappedWidth = clamp(
    resizeSnap.snappedWidth,
    minimumWidth(drag.element),
    ctx.canvasWidth - drag.element.x,
  )
  const snappedHeight = clamp(
    resizeSnap.snappedHeight,
    minimumHeight(drag.element),
    ctx.canvasHeight - drag.element.y,
  )

  const snappedRect = {
    x: drag.element.x,
    y: drag.element.y,
    width: snappedWidth,
    height: snappedHeight,
  }

  const resizeGuides = computeGuidesOptimized(snappedRect, ctx.spatialIndex)
  const resizeSpacing = computeSpacingGuidesOptimized(snappedRect, ctx.spatialIndex)

  const nextScene: Scene = {
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
  }

  return {
    scene: nextScene,
    guides: resizeGuides,
    spacingGuides: resizeSpacing,
    resizeLabel: {
      x: drag.element.x + snappedWidth / 2,
      y: drag.element.y + snappedHeight,
      w: Math.round(snappedWidth),
      h: Math.round(snappedHeight),
    },
    snapState: ctx.snapState,
    resizeSnapState: resizeSnap.snapState,
  }
}

/**
 * 按 drag 模式分派到对应的 frame 函数。
 */
export function computeDragFrame(
  drag: DragState,
  delta: DragMoveDelta,
  currentScene: Scene,
  ctx: DragContext,
): DragFrameResult {
  switch (drag.mode) {
    case 'group-move':
      return computeGroupMoveFrame(drag, delta, currentScene, ctx)
    case 'group-resize':
      return computeGroupResizeFrame(drag, delta, currentScene, ctx)
    case 'move':
      return computeSingleMoveFrame(drag, delta, currentScene, ctx)
    case 'resize':
      return computeSingleResizeFrame(drag, delta, currentScene, ctx)
  }
}
