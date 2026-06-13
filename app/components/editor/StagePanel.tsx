'use client'

import SceneCanvas from '../SceneCanvas'
import { useEditor } from '../EditorContext'
import { useSceneStore } from '../../stores/useSceneStore'
import { useCanvasStore } from '../../stores/useCanvasStore'
import { useInteractionStore } from '../../stores/useInteractionStore'

export function StagePanel() {
  const {
    svgRef,
    stageViewportRef,
    resolveSrc,
    handleCanvasPointerDown,
    handleElementPointerDown,
    handleResizePointerDown,
    handleGroupDragPointerDown,
    handleGroupResizePointerDown,
    handleTextElementDoubleClick,
  } = useEditor()

  // ── Scene Store ──
  const scene = useSceneStore((s) => s.scene)
  const selectedIds = useSceneStore((s) => s.selection.selectedIds)
  const editingTextId = useSceneStore((s) => s.editingTextId)

  // ── Canvas Store ──
  const status = useCanvasStore((s) => s.status)
  const canvasSize = useCanvasStore((s) => s.canvasSize)
  const canvasZoom = useCanvasStore((s) => s.canvasZoom)
  const canvasZoomPercent = useCanvasStore((s) => s.canvasZoomPercent)
  const canvasPreviewWidth = useCanvasStore((s) => s.canvasPreviewWidth)
  const CANVAS_ZOOM_MIN = useCanvasStore((s) => s.CANVAS_ZOOM_MIN)
  const CANVAS_ZOOM_MAX = useCanvasStore((s) => s.CANVAS_ZOOM_MAX)
  const CANVAS_ZOOM_STEP = useCanvasStore((s) => s.CANVAS_ZOOM_STEP)
  const setCanvasZoomLevel = useCanvasStore((s) => s.setCanvasZoomLevel)
  const zoomCanvasIn = useCanvasStore((s) => s.zoomCanvasIn)
  const zoomCanvasOut = useCanvasStore((s) => s.zoomCanvasOut)
  const resetCanvasZoom = useCanvasStore((s) => s.resetCanvasZoom)
  const handleZoomSliderWheel = useCanvasStore((s) => s.handleZoomSliderWheel)
  const handleStageWheel = useCanvasStore((s) => s.handleStageWheel)

  // ── Interaction Store ──
  const visibleGuides = useInteractionStore((s) => s.visibleGuides)
  const visibleSpacingGuides = useInteractionStore((s) => s.visibleSpacingGuides)
  const resizeLabel = useInteractionStore((s) => s.resizeLabel)
  const drag = useInteractionStore((s) => s.drag)
  const marquee = useInteractionStore((s) => s.marquee)

  return (
    <section className="stage-panel" aria-label="Canvas preview">
      <div className="stage-header">
        <span className="stage-status">{status}</span>
        <div className="stage-header-tools">
          <span>拖拽移动，右下角黄点缩放</span>
          <div
            className="canvas-zoom-controls"
            aria-label="画布缩放"
            onWheel={handleZoomSliderWheel}
          >
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
      <div className="stage-viewport" ref={stageViewportRef} onWheel={handleStageWheel}>
        <div className="stage-viewport-inner">
          <div
            className="scene-preview-frame"
            style={{
              width: canvasPreviewWidth,
              aspectRatio: `${canvasSize.width} / ${canvasSize.height}`,
            }}
          >
            <SceneCanvas
              scene={scene}
              className="scene-preview"
              style={{ aspectRatio: `${canvasSize.width} / ${canvasSize.height}` }}
              idPrefix="editor"
              interactive
              selectedIds={selectedIds}
              guides={visibleGuides}
              spacingGuides={visibleSpacingGuides}
              resizeLabel={resizeLabel}
              svgRef={svgRef}
              marquee={marquee}
              hitTestStrategy="intersection"
              editingTextId={editingTextId}
              isGroupDragging={drag?.mode === 'group-move'}
              canvasWidth={canvasSize.width}
              canvasHeight={canvasSize.height}
              resolveSrc={resolveSrc}
              onCanvasPointerDown={handleCanvasPointerDown}
              onElementPointerDown={handleElementPointerDown}
              onResizePointerDown={handleResizePointerDown}
              onGroupDragPointerDown={handleGroupDragPointerDown}
              onGroupResizePointerDown={handleGroupResizePointerDown}
              onTextElementDoubleClick={handleTextElementDoubleClick}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
