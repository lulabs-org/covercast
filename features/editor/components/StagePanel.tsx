'use client'

import { useMemo } from 'react'
import SceneCanvas from '@/components/SceneCanvas'
import { useEditorCanvas } from './contexts/EditorCanvasContext'
import { useEditorAsset } from './contexts/EditorAssetContext'
import { useSceneStore } from '@/stores/useSceneStore'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useInteractionStore } from '@/stores/useInteractionStore'
import { computeVisibleGuides } from '@/lib/algorithms/visible-guides'
import styles from './stage.module.css'

export function StagePanel() {
  const canvasInteraction = useEditorCanvas()
  const { resolveSrc } = useEditorAsset()

  const {
    svgRef,
    handleCanvasPointerDown,
    handleElementPointerDown,
    handleResizePointerDown,
    handleGroupDragPointerDown,
    handleGroupResizePointerDown,
    handleTextElementDoubleClick,
  } = canvasInteraction

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
  const guides = useInteractionStore((s) => s.guides)
  const spacingGuides = useInteractionStore((s) => s.spacingGuides)
  const guidesSelectedIds = useInteractionStore((s) => s.guidesSelectedIds)
  const resizeLabel = useInteractionStore((s) => s.resizeLabel)
  const drag = useInteractionStore((s) => s.drag)
  const marquee = useInteractionStore((s) => s.marquee)

  // ── 派生数据：直接计算，不存入 store ──
  const { visibleGuides, visibleSpacingGuides } = useMemo(
    () => computeVisibleGuides(guides, spacingGuides, selectedIds, guidesSelectedIds),
    [guides, spacingGuides, selectedIds, guidesSelectedIds],
  )

  return (
    <section className={styles.stagePanel} aria-label="Canvas preview">
      <div className={styles.stageHeader}>
        <span className={styles.stageStatus}>{status}</span>
        <div className={styles.stageHeaderTools}>
          <span>拖拽移动，右下角黄点缩放</span>
          <div
            className={styles.canvasZoomControls}
            aria-label="画布缩放"
            onWheel={handleZoomSliderWheel}
          >
            <button
              type="button"
              className={styles.zoomButton}
              onClick={zoomCanvasOut}
              disabled={canvasZoom <= CANVAS_ZOOM_MIN}
              title="缩小画布"
            >
              -
            </button>
            <label className={styles.zoomSliderLabel}>
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
              className={styles.zoomButton}
              onClick={zoomCanvasIn}
              disabled={canvasZoom >= CANVAS_ZOOM_MAX}
              title="放大画布"
            >
              +
            </button>
            <button
              type="button"
              className={styles.zoomFitButton}
              onClick={resetCanvasZoom}
              disabled={canvasZoom === 1}
              title="恢复适配视图"
            >
              适配
            </button>
          </div>
        </div>
      </div>
      <div className={styles.stageViewport} data-scrollable onWheel={handleStageWheel}>
        <div className={styles.stageViewportInner}>
          <div
            className={styles.scenePreviewFrame}
            style={{
              width: canvasPreviewWidth,
              aspectRatio: `${canvasSize.width} / ${canvasSize.height}`,
            }}
          >
            <SceneCanvas
              scene={scene}
              className={styles.scenePreview}
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
