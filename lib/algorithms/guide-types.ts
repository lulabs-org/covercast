import type { Rect } from '../domain/rect'

export type { Rect } from '../domain/rect'

export type GuideMode = 'drag' | 'keyboard'

export type GuideContext = {
  mode: GuideMode
}

export type GuideDirection = 'horizontal' | 'vertical'

export type GuideType = 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom'

export type GuideLine = {
  direction: GuideDirection
  type: GuideType
  x1: number
  y1: number
  x2: number
  y2: number
  mode?: GuideMode
}

export type ExtensionLine = {
  x1: number
  y1: number
  x2: number
  y2: number
}

export type MeasurementGuide = {
  direction: 'horizontal' | 'vertical'
  measurementLine: {
    x1: number
    y1: number
    x2: number
    y2: number
  }
  extensionLines: ExtensionLine[]
  label: {
    x: number
    y: number
    value: number
  }
  mode?: GuideMode
}

export type ResizeLabel = {
  x: number
  y: number
  w: number
  h: number
}

export type AxisSnapState = {
  type: GuideType
  target: number
} | null

export type SnapState = {
  x: AxisSnapState
  y: AxisSnapState
}

export type SnapResult = {
  snappedRect: Rect
  guides: GuideLine[]
  snapDx: number
  snapDy: number
  snapState: SnapState
}

export type AxisResizeSnapState = {
  type: GuideType
  target: number
} | null

export type ResizeSnapState = {
  w: AxisResizeSnapState
  h: AxisResizeSnapState
}

export type ResizeSnapResult = {
  snappedWidth: number
  snappedHeight: number
  snapDw: number
  snapDh: number
  snapState: ResizeSnapState
}

export type SnapCandidate = {
  delta: number
  type: GuideType
}

export type CanvasSizeOptions = {
  canvasWidth?: number
  canvasHeight?: number
}

export const DEFAULT_THRESHOLD = 5
export const SNAP_THRESHOLD = 5
export const SNAP_HYSTERESIS = 10
export const SPACING_ALIGN_THRESHOLD = 5
export const GUIDE_QUERY_RANGE = 200
