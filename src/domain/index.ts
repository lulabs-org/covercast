// Scene domain (core)
export * from './scene'

// Alignment (smart-guide)
export {
  type GuideMode,
  type GuideContext,
  type GuideDirection,
  type GuideType,
  type GuideLine,
  type ExtensionLine,
  type MeasurementGuide,
  type ResizeLabel,
  type CanvasSizeOptions,
  type AxisSnapState,
  type SnapState,
  type SnapResult,
  type AxisResizeSnapState,
  type ResizeSnapState,
  type ResizeSnapResult,
  SNAP_THRESHOLD,
  SNAP_HYSTERESIS,
  computeGuides,
  createSnapState,
  computeSnap,
  computeSpacingGuides,
  createResizeSnapState,
  computeResizeSnap,
  computeGuidesOptimized,
  computeSnapOptimized,
  computeSpacingGuidesOptimized,
  computeResizeSnapOptimized,
} from './alignment'

// Transform (group-drag)
export {
  type GroupDragState,
  type ResizeHandleType,
  type GroupResizeState,
  type BoundingBox,
  type ScaleMatrix,
  createGroupDragState,
  createGroupResizeState,
  computeBoundingBox,
  computeScaleMatrix,
  applyScaleToElement,
  applyGroupResize,
  computeNewBoundsFromHandle,
  applyGroupDragDelta,
  clampGroupPosition,
  formatDimension,
} from './transform'

// Marquee (selection-box + hit-test)
export {
  type MarqueeState,
  type HitTestStrategy,
  createMarqueeState,
  startMarquee,
  updateMarquee,
  clearMarquee,
  getMarqueeRect,
  isMarqueeActive,
  hasMarqueeSize,
  getElementBounds,
  intersectsRect,
  containsRect,
  hitTestElement,
  hitTestElements,
} from './marquee'

// SVG serialization (scene → svg markup)
export {
  resolvePaint,
  textAnchorForAlign,
  textX,
  elementBounds,
  sceneToSvgMarkup,
  renderDefs,
  renderBackground,
  gradientVector,
} from './svg-serializer'

// Selection
export {
  type SelectionState,
  createSelectionState,
  selectSingle,
  toggleSelection,
  clearSelection,
  isSelected,
  getSelectedCount,
  hasSelection,
  getFirstSelectedId,
  handleElementClick,
  selectMultiple,
} from './selection'

// Spatial Index
export { SpatialIndex, buildSpatialIndex } from './spatial-index'
