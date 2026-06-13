'use client'

import { useMemo } from 'react'
import SceneCanvas from '../SceneCanvas'
import { useEditor } from '../EditorContext'
import { useEditorStore } from '@/stores/useEditorStore'
import { computeVisibleGuides } from '@/lib/visible-guides'

export function StagePanel() {
  const { resolveSrc, canvasInteraction } = useEditor()

  const {
    svgRef,
    handleCanvasPointerDown,
    handleElementPointerDown,
    handleResizePointerDown,
    handleGroupDragPointerDown,
    handleGroupResizePointerDown,
    handleTextElementDoubleClick,
  } = canvasInteraction

  // ── Editor Store ──
  const scene = useEditorStore((s) => s.scene)
  const selectedIds = useEditorStore((s) => s.selection.selectedIds)
  const editingTextId = useEditorStore((s) => s.editingTextId)
  const status = useEditorStore((s) => s.status)
  const canvasSize = useEditorStore((s) => s.canvasSize)
  const canvasZoom = useEditorStore((s) => s.canvasZoom)
  const canvasZoomPercent = useEditorStore((s) => s.canvasZoomPercent)
  const canvasPreviewWidth = useEditorStore((s) => s.canvasPreviewWidth)
  const CANVAS_ZOOM_MIN = useEditorStore((s) => s.CANVAS_ZOOM_MIN)
  const CANVAS_ZOOM_MAX = useEditorStore((s) => s.CANVAS_ZOOM_MAX)
  const CANVAS_ZOOM_STEP = useEditorStore((s) => s.CANVAS_ZOOM_STEP)
  const setCanvasZoomLevel = useEditorStore((s) => s.setCanvasZoomLevel)
  const zoomCanvasIn = useEditorStore((s) => s.zoomCanvasIn)
  const zoomCanvasOut = useEditorStore((s) => s.zoomCanvasOut)
  const resetCanvasZoom = useEditorStore((s) => s.resetCanvasZoom)
  const handleZoomSliderWheel = useEditorStore((s) => s.handleZoomSliderWheel)
  const handleStageWheel = useEditorStore((s) => s.handleStageWheel)
  const guides = useEditorStore((s) => s.guides)
  const spacingGuides = useEditorStore((s) => s.spacingGuides)
  const guidesSelectedIds = useEditorStore((s) => s.guidesSelectedIds)
  const resizeLabel = useEditorStore((s) => s.resizeLabel)
  const drag = useEditorStore((s) => s.drag)
  const marquee = useEditorStore((s) => s.marquee)

  // ── 派生数据：直接计算，不存入 store ──
  const { visibleGuides, visibleSpacingGuides } = useMemo(
    () => computeVisibleGuides(guides, spacingGuides, selectedIds, guidesSelectedIds),
    [guides, spacingGuides, selectedIds, guidesSelectedIds],
  )

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
      <div className="stage-viewport" onWheel={handleStageWheel}>
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
