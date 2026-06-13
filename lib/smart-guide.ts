// Re-export from algorithms/ for backward compatibility
// New code should import from '@/lib/algorithms/guide-*' directly
export type { Rect } from './domain/rect'

export type {
  GuideMode,
  GuideContext,
  GuideDirection,
  GuideType,
  GuideLine,
  ExtensionLine,
  MeasurementGuide,
  ResizeLabel,
  AxisSnapState,
  SnapState,
  SnapResult,
  AxisResizeSnapState,
  ResizeSnapState,
  ResizeSnapResult,
  CanvasSizeOptions,
} from './algorithms/guide-types'

export {
  DEFAULT_THRESHOLD,
  SNAP_THRESHOLD,
  SNAP_HYSTERESIS,
  SPACING_ALIGN_THRESHOLD,
} from './algorithms/guide-types'

export { computeGuides, computeGuidesOptimized } from './algorithms/guide-alignment'

export { createSnapState, computeSnap, computeSnapOptimized } from './algorithms/guide-snap'

export { computeSpacingGuides, computeSpacingGuidesOptimized } from './algorithms/guide-spacing'

export {
  createResizeSnapState,
  computeResizeSnap,
  computeResizeSnapOptimized,
} from './algorithms/guide-resize-snap'
