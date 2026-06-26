// Scene domain (core)
export * from './scene'

// Canvas size (画布尺寸 SSOT:类型 / 常量 / 纯函数)
export * from './canvas-size'

// History (撤销/重做纯栈操作)
export {
  type HistoryEntry,
  type HistoryState,
  MAX_HISTORY_SIZE,
  createEmptyHistoryState,
  createHistoryEntry,
  pushHistory,
  undoHistory,
  redoHistory,
} from './history'

// Custom template (类型 / 校验器 / 工厂 / 去重命名)
export {
  type CustomSceneTemplate,
  type TemplateExportPayload,
  TEMPLATE_EXPORT_FORMAT,
  uniqueName,
  uniqueTemplateName,
  createCustomTemplateId,
  createTemplateExportPayload,
  scenesMatch,
  isScene,
  normalizeCustomTemplate,
  normalizeTemplateExportPayload,
} from './template'

// Drag (拖拽帧纯变换)
export {
  type SingleDragState,
  type DragState,
  type DragMoveDelta,
  type DragContext,
  type DragFrameResult,
  minimumWidth,
  minimumHeight,
  computeGroupMoveFrame,
  computeGroupResizeFrame,
  computeSingleMoveFrame,
  computeSingleResizeFrame,
  computeDragFrame,
} from './drag'

// Alignment (smart-guide)
export {
  type GuideMode,
  type GuideContext,
  type GuideDirection,
  type GuideType,
  type GuideLine,
  type Rect,
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

// Query (marquee)
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
} from './query'

// Export (scene-svg)
export {
  resolvePaint,
  textAnchorForAlign,
  textX,
  elementBounds,
  sceneToSvgMarkup,
  renderDefs,
  renderBackground,
  gradientVector,
} from './export'

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
