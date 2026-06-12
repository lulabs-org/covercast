"use client";

import type { Ref, WheelEvent as ReactWheelEvent, PointerEvent } from "react";
import SceneCanvas from "../SceneCanvas";
import type { Scene } from "../../lib/scene";
import type { GuideLine, MeasurementGuide, ResizeLabel } from "../../lib/smart-guide";
import type { HitTestStrategy, MarqueeState } from "../../lib/marquee";
import type { ResizeHandleType } from "../../lib/group-drag";

type StagePanelProps = {
  // Status
  status: string;

  // Zoom controls
  canvasZoom: number;
  canvasZoomPercent: number;
  canvasPreviewWidth: number;
  CANVAS_ZOOM_MIN: number;
  CANVAS_ZOOM_MAX: number;
  CANVAS_ZOOM_STEP: number;
  setCanvasZoomLevel: (value: number) => void;
  zoomCanvasIn: () => void;
  zoomCanvasOut: () => void;
  resetCanvasZoom: () => void;
  handleZoomSliderWheel: (event: ReactWheelEvent<HTMLDivElement>) => void;
  handleStageWheel: (event: ReactWheelEvent<HTMLDivElement>) => void;
  stageViewportRef: Ref<HTMLDivElement>;

  // SceneCanvas props
  scene: Scene;
  selectedIds: string[];
  guides?: GuideLine[];
  spacingGuides?: MeasurementGuide[];
  resizeLabel?: ResizeLabel | null;
  svgRef?: Ref<SVGSVGElement>;
  marquee?: MarqueeState;
  hitTestStrategy?: HitTestStrategy;
  editingTextId?: string | null;
  isGroupDragging?: boolean;
  canvasWidth?: number;
  canvasHeight?: number;
  resolveSrc?: (src: string) => string;
  onCanvasPointerDown?: (event: PointerEvent<SVGSVGElement>) => void;
  onElementPointerDown?: (
    elementId: string,
    event: PointerEvent<SVGGElement>,
  ) => void;
  onResizePointerDown?: (
    elementId: string,
    event: PointerEvent<SVGRectElement>,
  ) => void;
  onGroupDragPointerDown?: (event: PointerEvent<SVGRectElement>) => void;
  onGroupResizePointerDown?: (
    handle: ResizeHandleType,
    event: PointerEvent<SVGRectElement>,
  ) => void;
  onTextElementDoubleClick?: (elementId: string) => void;
};

export function StagePanel({
  status,
  canvasZoom,
  canvasZoomPercent,
  canvasPreviewWidth,
  CANVAS_ZOOM_MIN,
  CANVAS_ZOOM_MAX,
  CANVAS_ZOOM_STEP,
  setCanvasZoomLevel,
  zoomCanvasIn,
  zoomCanvasOut,
  resetCanvasZoom,
  handleZoomSliderWheel,
  handleStageWheel,
  stageViewportRef,
  scene,
  selectedIds,
  guides,
  spacingGuides,
  resizeLabel,
  svgRef,
  marquee,
  hitTestStrategy,
  editingTextId,
  isGroupDragging,
  canvasWidth,
  canvasHeight,
  resolveSrc,
  onCanvasPointerDown,
  onElementPointerDown,
  onResizePointerDown,
  onGroupDragPointerDown,
  onGroupResizePointerDown,
  onTextElementDoubleClick,
}: StagePanelProps) {
  return (
    <section className="stage-panel" aria-label="Canvas preview">
      <div className="stage-header">
        <span className="stage-status">{status}</span>
        <div className="stage-header-tools">
          <span>拖拽移动，右下角黄点缩放</span>
          <div className="canvas-zoom-controls" aria-label="画布缩放" onWheel={handleZoomSliderWheel}>
            <button
              type="button"
              className="zoom-button"
              onClick={zoomCanvasOut}
              disabled={canvasZoom <= CANVAS_ZOOM_MIN}
              title="缩小画布"
            >
              -
            </button>
            <label className="zoom-slider-label">
              <span>{canvasZoomPercent}%</span>
              <input
                type="range"
                min={CANVAS_ZOOM_MIN}
                max={CANVAS_ZOOM_MAX}
                step={CANVAS_ZOOM_STEP}
                value={canvasZoom}
                onChange={(event) => setCanvasZoomLevel(Number(event.currentTarget.value))}
                title="调整画布缩放"
              />
            </label>
            <button
              type="button"
              className="zoom-button"
              onClick={zoomCanvasIn}
              disabled={canvasZoom >= CANVAS_ZOOM_MAX}
              title="放大画布"
            >
              +
            </button>
            <button
              type="button"
              className="zoom-fit-button"
              onClick={resetCanvasZoom}
              disabled={canvasZoom === 1}
              title="恢复适配视图"
            >
              适配
            </button>
          </div>
        </div>
      </div>
      <div
        className="stage-viewport"
        ref={stageViewportRef}
        onWheel={handleStageWheel}
      >
        <div className="stage-viewport-inner">
          <div
            className="scene-preview-frame"
            style={{ 
              width: canvasPreviewWidth,
              aspectRatio: `${canvasWidth} / ${canvasHeight}`,
            }}
          >
            <SceneCanvas
              scene={scene}
              className="scene-preview"
              style={{ aspectRatio: `${canvasWidth} / ${canvasHeight}` }}
              idPrefix="editor"
              interactive
              selectedIds={selectedIds}
              guides={guides}
              spacingGuides={spacingGuides}
              resizeLabel={resizeLabel}
              svgRef={svgRef}
              marquee={marquee}
              hitTestStrategy={hitTestStrategy}
              editingTextId={editingTextId}
              isGroupDragging={isGroupDragging}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              resolveSrc={resolveSrc}
              onCanvasPointerDown={onCanvasPointerDown}
              onElementPointerDown={onElementPointerDown}
              onResizePointerDown={onResizePointerDown}
              onGroupDragPointerDown={onGroupDragPointerDown}
              onGroupResizePointerDown={onGroupResizePointerDown}
              onTextElementDoubleClick={onTextElementDoubleClick}
            />
          </div>
        </div>
      </div>
    </section>
  );
}