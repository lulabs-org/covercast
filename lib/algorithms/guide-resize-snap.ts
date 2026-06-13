import { DEFAULT_CANVAS_HEIGHT, DEFAULT_CANVAS_WIDTH } from '../domain/scene'
import type { Rect } from '../domain/rect'
import type { ResizeSnapState, ResizeSnapResult, SnapCandidate } from './guide-types'
import { SNAP_THRESHOLD, SNAP_HYSTERESIS, GUIDE_QUERY_RANGE } from './guide-types'

export { type ResizeSnapState, type ResizeSnapResult } from './guide-types'

export function createResizeSnapState(): ResizeSnapState {
  return { w: null, h: null }
}

export function computeResizeSnap(
  rawRect: Rect,
  others: Rect[],
  prevSnap: ResizeSnapState | null = null,
  threshold = SNAP_THRESHOLD,
  hysteresis = SNAP_HYSTERESIS,
  canvasWidth = DEFAULT_CANVAS_WIDTH,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
): ResizeSnapResult {
  const nextSnap: ResizeSnapState = { w: null, h: null }
  let snapDw = 0
  let snapDh = 0

  const dCenterH = rawRect.x + rawRect.width / 2
  const dRight = rawRect.x + rawRect.width
  const dCenterV = rawRect.y + rawRect.height / 2
  const dBottom = rawRect.y + rawRect.height

  const wCandidates: SnapCandidate[] = []
  const hCandidates: SnapCandidate[] = []

  const canvasCx = canvasWidth / 2
  const canvasCy = canvasHeight / 2

  if (Math.abs(dRight - canvasWidth) < threshold) {
    wCandidates.push({ delta: canvasWidth - dRight, type: 'right' })
  }

  if (Math.abs(dCenterH - canvasCx) < threshold) {
    wCandidates.push({ delta: 2 * (canvasCx - dCenterH), type: 'center-h' })
  }

  if (Math.abs(dBottom - canvasHeight) < threshold) {
    hCandidates.push({ delta: canvasHeight - dBottom, type: 'bottom' })
  }

  if (Math.abs(dCenterV - canvasCy) < threshold) {
    hCandidates.push({ delta: 2 * (canvasCy - dCenterV), type: 'center-v' })
  }

  for (const other of others) {
    const oLeft = other.x
    const oCenterH = other.x + other.width / 2
    const oRight = other.x + other.width
    const oTop = other.y
    const oCenterV = other.y + other.height / 2
    const oBottom = other.y + other.height

    const dwLo = oLeft - dRight
    const dwRo = oRight - dRight
    const dwCo = oCenterH - dRight
    const dwCc = oCenterH - dCenterH

    const dhTo = oTop - dBottom
    const dhBo = oBottom - dBottom
    const dhCv = oCenterV - dBottom
    const dhCvc = oCenterV - dCenterV

    if (Math.abs(dwLo) < threshold) wCandidates.push({ delta: dwLo, type: 'left' })
    if (Math.abs(dwRo) < threshold) wCandidates.push({ delta: dwRo, type: 'right' })
    if (Math.abs(dwCo) < threshold) wCandidates.push({ delta: dwCo, type: 'center-h' })
    if (Math.abs(dwCc) < threshold) wCandidates.push({ delta: 2 * dwCc, type: 'center-h' })

    if (Math.abs(dhTo) < threshold) hCandidates.push({ delta: dhTo, type: 'top' })
    if (Math.abs(dhBo) < threshold) hCandidates.push({ delta: dhBo, type: 'bottom' })
    if (Math.abs(dhCv) < threshold) hCandidates.push({ delta: dhCv, type: 'center-v' })
    if (Math.abs(dhCvc) < threshold) hCandidates.push({ delta: 2 * dhCvc, type: 'center-v' })
  }

  const prevW = prevSnap?.w ?? null
  if (prevW) {
    const rawDiff = Math.abs(rawRect.width - prevW.target)
    if (rawDiff < hysteresis) {
      snapDw = prevW.target - rawRect.width
      nextSnap.w = prevW
    }
  }

  if (nextSnap.w === null && wCandidates.length > 0) {
    wCandidates.sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta))
    const best = wCandidates[0]
    snapDw = best.delta
    nextSnap.w = { type: best.type, target: rawRect.width + best.delta }
  }

  const prevH = prevSnap?.h ?? null
  if (prevH) {
    const rawDiff = Math.abs(rawRect.height - prevH.target)
    if (rawDiff < hysteresis) {
      snapDh = prevH.target - rawRect.height
      nextSnap.h = prevH
    }
  }

  if (nextSnap.h === null && hCandidates.length > 0) {
    hCandidates.sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta))
    const best = hCandidates[0]
    snapDh = best.delta
    nextSnap.h = { type: best.type, target: rawRect.height + best.delta }
  }

  return {
    snappedWidth: rawRect.width + snapDw,
    snappedHeight: rawRect.height + snapDh,
    snapDw,
    snapDh,
    snapState: nextSnap,
  }
}

import { SpatialIndex } from './spatial-index'

export function computeResizeSnapOptimized(
  rawRect: Rect,
  spatialIndex: SpatialIndex,
  prevSnap: ResizeSnapState | null = null,
  threshold = SNAP_THRESHOLD,
  hysteresis = SNAP_HYSTERESIS,
  canvasWidth = DEFAULT_CANVAS_WIDTH,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
): ResizeSnapResult {
  const nearbyElements = spatialIndex.queryNearby(rawRect, GUIDE_QUERY_RANGE)
  return computeResizeSnap(
    rawRect,
    nearbyElements,
    prevSnap,
    threshold,
    hysteresis,
    canvasWidth,
    canvasHeight,
  )
}
