import { DEFAULT_CANVAS_HEIGHT, DEFAULT_CANVAS_WIDTH } from '../domain/scene'
import type { Rect } from '../domain/rect'
import type { GuideLine, GuideContext } from './guide-types'
import { DEFAULT_THRESHOLD, GUIDE_QUERY_RANGE } from './guide-types'

export { type GuideLine, type GuideContext } from './guide-types'

export function computeGuides(
  dragged: Rect,
  others: Rect[],
  threshold = DEFAULT_THRESHOLD,
  canvasWidth = DEFAULT_CANVAS_WIDTH,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
): GuideLine[] {
  const guides: GuideLine[] = []

  const dLeft = dragged.x
  const dCenterH = dragged.x + dragged.width / 2
  const dRight = dragged.x + dragged.width
  const dTop = dragged.y
  const dCenterV = dragged.y + dragged.height / 2
  const dBottom = dragged.y + dragged.height

  const canvasCx = canvasWidth / 2
  const canvasCy = canvasHeight / 2

  if (Math.abs(dLeft - 0) < threshold) {
    guides.push({
      direction: 'vertical',
      type: 'left',
      x1: 0,
      y1: 0,
      x2: 0,
      y2: canvasHeight,
    })
  }

  if (Math.abs(dRight - canvasWidth) < threshold) {
    guides.push({
      direction: 'vertical',
      type: 'right',
      x1: canvasWidth,
      y1: 0,
      x2: canvasWidth,
      y2: canvasHeight,
    })
  }

  if (Math.abs(dCenterH - canvasCx) < threshold) {
    guides.push({
      direction: 'vertical',
      type: 'center-h',
      x1: canvasCx,
      y1: 0,
      x2: canvasCx,
      y2: canvasHeight,
    })
  }

  if (Math.abs(dTop - 0) < threshold) {
    guides.push({
      direction: 'horizontal',
      type: 'top',
      x1: 0,
      y1: 0,
      x2: canvasWidth,
      y2: 0,
    })
  }

  if (Math.abs(dBottom - canvasHeight) < threshold) {
    guides.push({
      direction: 'horizontal',
      type: 'bottom',
      x1: 0,
      y1: canvasHeight,
      x2: canvasWidth,
      y2: canvasHeight,
    })
  }

  if (Math.abs(dCenterV - canvasCy) < threshold) {
    guides.push({
      direction: 'horizontal',
      type: 'center-v',
      x1: 0,
      y1: canvasCy,
      x2: canvasWidth,
      y2: canvasCy,
    })
  }

  if (others.length === 0) {
    return guides
  }

  for (const other of others) {
    const oLeft = other.x
    const oCenterH = other.x + other.width / 2
    const oRight = other.x + other.width
    const oTop = other.y
    const oCenterV = other.y + other.height / 2
    const oBottom = other.y + other.height

    const spanX1 = Math.min(dLeft, oLeft)
    const spanX2 = Math.max(dRight, oRight)
    const spanY1 = Math.min(dTop, oTop)
    const spanY2 = Math.max(dBottom, oBottom)

    if (Math.abs(dLeft - oLeft) < threshold) {
      guides.push({
        direction: 'vertical',
        type: 'left',
        x1: dLeft,
        y1: spanY1,
        x2: dLeft,
        y2: spanY2,
      })
    }

    if (Math.abs(dLeft - oRight) < threshold) {
      guides.push({
        direction: 'vertical',
        type: 'left',
        x1: dLeft,
        y1: spanY1,
        x2: dLeft,
        y2: spanY2,
      })
    }

    if (Math.abs(dCenterH - oCenterH) < threshold) {
      guides.push({
        direction: 'vertical',
        type: 'center-h',
        x1: dCenterH,
        y1: spanY1,
        x2: dCenterH,
        y2: spanY2,
      })
    }

    if (Math.abs(dCenterH - oLeft) < threshold) {
      guides.push({
        direction: 'vertical',
        type: 'center-h',
        x1: dCenterH,
        y1: spanY1,
        x2: dCenterH,
        y2: spanY2,
      })
    }

    if (Math.abs(dCenterH - oRight) < threshold) {
      guides.push({
        direction: 'vertical',
        type: 'center-h',
        x1: dCenterH,
        y1: spanY1,
        x2: dCenterH,
        y2: spanY2,
      })
    }

    if (Math.abs(dRight - oRight) < threshold) {
      guides.push({
        direction: 'vertical',
        type: 'right',
        x1: dRight,
        y1: spanY1,
        x2: dRight,
        y2: spanY2,
      })
    }

    if (Math.abs(dRight - oLeft) < threshold) {
      guides.push({
        direction: 'vertical',
        type: 'right',
        x1: dRight,
        y1: spanY1,
        x2: dRight,
        y2: spanY2,
      })
    }

    if (Math.abs(dTop - oTop) < threshold) {
      guides.push({
        direction: 'horizontal',
        type: 'top',
        x1: spanX1,
        y1: dTop,
        x2: spanX2,
        y2: dTop,
      })
    }

    if (Math.abs(dTop - oBottom) < threshold) {
      guides.push({
        direction: 'horizontal',
        type: 'top',
        x1: spanX1,
        y1: dTop,
        x2: spanX2,
        y2: dTop,
      })
    }

    if (Math.abs(dCenterV - oCenterV) < threshold) {
      guides.push({
        direction: 'horizontal',
        type: 'center-v',
        x1: spanX1,
        y1: dCenterV,
        x2: spanX2,
        y2: dCenterV,
      })
    }

    if (Math.abs(dCenterV - oTop) < threshold) {
      guides.push({
        direction: 'horizontal',
        type: 'center-v',
        x1: spanX1,
        y1: dCenterV,
        x2: spanX2,
        y2: dCenterV,
      })
    }

    if (Math.abs(dCenterV - oBottom) < threshold) {
      guides.push({
        direction: 'horizontal',
        type: 'center-v',
        x1: spanX1,
        y1: dCenterV,
        x2: spanX2,
        y2: dCenterV,
      })
    }

    if (Math.abs(dBottom - oBottom) < threshold) {
      guides.push({
        direction: 'horizontal',
        type: 'bottom',
        x1: spanX1,
        y1: dBottom,
        x2: spanX2,
        y2: dBottom,
      })
    }

    if (Math.abs(dBottom - oTop) < threshold) {
      guides.push({
        direction: 'horizontal',
        type: 'bottom',
        x1: spanX1,
        y1: dBottom,
        x2: spanX2,
        y2: dBottom,
      })
    }
  }

  return guides
}

import { SpatialIndex } from './spatial-index'

export function computeGuidesOptimized(
  dragged: Rect,
  spatialIndex: SpatialIndex,
  threshold = DEFAULT_THRESHOLD,
  context?: GuideContext,
  canvasWidth = DEFAULT_CANVAS_WIDTH,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
): GuideLine[] {
  const nearbyElements = spatialIndex.queryNearby(dragged, GUIDE_QUERY_RANGE)
  const effectiveThreshold = context?.mode === 'keyboard' ? 1 : threshold
  const guides = computeGuides(
    dragged,
    nearbyElements,
    effectiveThreshold,
    canvasWidth,
    canvasHeight,
  )

  if (context?.mode) {
    return guides.map((guide) => ({ ...guide, mode: context.mode }))
  }

  return guides
}
