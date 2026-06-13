import { DEFAULT_CANVAS_HEIGHT, DEFAULT_CANVAS_WIDTH } from '../domain/scene'
import type { Rect } from '../domain/rect'
import type { SnapState, SnapResult, SnapCandidate, GuideContext } from './guide-types'
import { SNAP_THRESHOLD, SNAP_HYSTERESIS, GUIDE_QUERY_RANGE } from './guide-types'
import { computeGuides } from './guide-alignment'

export { type SnapState, type SnapResult } from './guide-types'

export function createSnapState(): SnapState {
  return { x: null, y: null }
}

export function computeSnap(
  rawRect: Rect,
  others: Rect[],
  prevSnap: SnapState | null = null,
  threshold = SNAP_THRESHOLD,
  hysteresis = SNAP_HYSTERESIS,
  canvasWidth = DEFAULT_CANVAS_WIDTH,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
): SnapResult {
  const nextSnap: SnapState = { x: null, y: null }
  let snapDx = 0
  let snapDy = 0

  const dLeft = rawRect.x
  const dCenterH = rawRect.x + rawRect.width / 2
  const dRight = rawRect.x + rawRect.width
  const dTop = rawRect.y
  const dCenterV = rawRect.y + rawRect.height / 2
  const dBottom = rawRect.y + rawRect.height

  const xCandidates: SnapCandidate[] = []
  const yCandidates: SnapCandidate[] = []

  const canvasCx = canvasWidth / 2
  const canvasCy = canvasHeight / 2

  if (Math.abs(dLeft - 0) < threshold) {
    xCandidates.push({ delta: 0 - dLeft, type: 'left' })
  }

  if (Math.abs(dRight - canvasWidth) < threshold) {
    xCandidates.push({ delta: canvasWidth - dRight, type: 'right' })
  }

  if (Math.abs(dCenterH - canvasCx) < threshold) {
    xCandidates.push({ delta: canvasCx - dCenterH, type: 'center-h' })
  }

  if (Math.abs(dTop - 0) < threshold) {
    yCandidates.push({ delta: 0 - dTop, type: 'top' })
  }

  if (Math.abs(dBottom - canvasHeight) < threshold) {
    yCandidates.push({ delta: canvasHeight - dBottom, type: 'bottom' })
  }

  if (Math.abs(dCenterV - canvasCy) < threshold) {
    yCandidates.push({ delta: canvasCy - dCenterV, type: 'center-v' })
  }

  for (const other of others) {
    const oLeft = other.x
    const oCenterH = other.x + other.width / 2
    const oRight = other.x + other.width
    const oTop = other.y
    const oCenterV = other.y + other.height / 2
    const oBottom = other.y + other.height

    const dxLoLo = oLeft - dLeft
    const dxLoRo = oRight - dLeft
    const dxCoCo = oCenterH - dCenterH
    const dxCoLo = oLeft - dCenterH
    const dxCoRo = oRight - dCenterH
    const dxRoRo = oRight - dRight
    const dxRoLo = oLeft - dRight

    const dyToTo = oTop - dTop
    const dyToBo = oBottom - dTop
    const dyCvCv = oCenterV - dCenterV
    const dyCvTo = oTop - dCenterV
    const dyCvBo = oBottom - dCenterV
    const dyBoBo = oBottom - dBottom
    const dyBoTo = oTop - dBottom

    if (Math.abs(dxLoLo) < threshold) xCandidates.push({ delta: dxLoLo, type: 'left' })
    if (Math.abs(dxLoRo) < threshold) xCandidates.push({ delta: dxLoRo, type: 'left' })
    if (Math.abs(dxCoCo) < threshold) xCandidates.push({ delta: dxCoCo, type: 'center-h' })
    if (Math.abs(dxCoLo) < threshold) xCandidates.push({ delta: dxCoLo, type: 'center-h' })
    if (Math.abs(dxCoRo) < threshold) xCandidates.push({ delta: dxCoRo, type: 'center-h' })
    if (Math.abs(dxRoRo) < threshold) xCandidates.push({ delta: dxRoRo, type: 'right' })
    if (Math.abs(dxRoLo) < threshold) xCandidates.push({ delta: dxRoLo, type: 'right' })

    if (Math.abs(dyToTo) < threshold) yCandidates.push({ delta: dyToTo, type: 'top' })
    if (Math.abs(dyToBo) < threshold) yCandidates.push({ delta: dyToBo, type: 'top' })
    if (Math.abs(dyCvCv) < threshold) yCandidates.push({ delta: dyCvCv, type: 'center-v' })
    if (Math.abs(dyCvTo) < threshold) yCandidates.push({ delta: dyCvTo, type: 'center-v' })
    if (Math.abs(dyCvBo) < threshold) yCandidates.push({ delta: dyCvBo, type: 'center-v' })
    if (Math.abs(dyBoBo) < threshold) yCandidates.push({ delta: dyBoBo, type: 'bottom' })
    if (Math.abs(dyBoTo) < threshold) yCandidates.push({ delta: dyBoTo, type: 'bottom' })
  }

  const prevX = prevSnap?.x ?? null
  if (prevX) {
    const rawDiff = Math.abs(rawRect.x - prevX.target)
    if (rawDiff < hysteresis) {
      snapDx = prevX.target - rawRect.x
      nextSnap.x = prevX
    }
  }

  if (nextSnap.x === null && xCandidates.length > 0) {
    xCandidates.sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta))
    const best = xCandidates[0]
    snapDx = best.delta
    nextSnap.x = { type: best.type, target: rawRect.x + best.delta }
  }

  const prevY = prevSnap?.y ?? null
  if (prevY) {
    const rawDiff = Math.abs(rawRect.y - prevY.target)
    if (rawDiff < hysteresis) {
      snapDy = prevY.target - rawRect.y
      nextSnap.y = prevY
    }
  }

  if (nextSnap.y === null && yCandidates.length > 0) {
    yCandidates.sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta))
    const best = yCandidates[0]
    snapDy = best.delta
    nextSnap.y = { type: best.type, target: rawRect.y + best.delta }
  }

  const snappedRect: Rect = {
    x: rawRect.x + snapDx,
    y: rawRect.y + snapDy,
    width: rawRect.width,
    height: rawRect.height,
  }

  const guides =
    snappedRect.x !== rawRect.x || snappedRect.y !== rawRect.y
      ? computeGuides(snappedRect, others, threshold, canvasWidth, canvasHeight)
      : []

  return {
    snappedRect,
    guides,
    snapDx,
    snapDy,
    snapState: nextSnap,
  }
}

import { SpatialIndex } from './spatial-index'

export function computeSnapOptimized(
  rawRect: Rect,
  spatialIndex: SpatialIndex,
  prevSnap: SnapState | null = null,
  threshold = SNAP_THRESHOLD,
  hysteresis = SNAP_HYSTERESIS,
  context?: GuideContext,
  canvasWidth = DEFAULT_CANVAS_WIDTH,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
): SnapResult {
  const nearbyElements = spatialIndex.queryNearby(rawRect, GUIDE_QUERY_RANGE)
  const result = computeSnap(
    rawRect,
    nearbyElements,
    prevSnap,
    threshold,
    hysteresis,
    canvasWidth,
    canvasHeight,
  )

  if (context?.mode) {
    return {
      ...result,
      guides: result.guides.map((guide) => ({ ...guide, mode: context.mode })),
    }
  }

  return result
}
