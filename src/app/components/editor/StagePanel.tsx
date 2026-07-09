'use client'

import type { Ref, WheelEvent as ReactWheelEvent, PointerEvent } from 'react'
import dynamic from 'next/dynamic'
import type { Editor } from 'tldraw'
import SceneCanvas from '../SceneCanvas'
import type {
  Scene,
  GuideLine,
  MeasurementGuide,
  ResizeLabel,
  HitTestStrategy,
  MarqueeState,
  ResizeHandleType,
} from '@/domain'
import { Slider } from '@/shared/components/ui'
import styles from './editor.module.css'

// Dynamic import with ssr: false — tldraw uses browser APIs
const CovercastEditor = dynamic(
  () => import('@/tldraw/CovercastEditor').then((m) => m.CovercastEditor),
  {
    ssr: false,
    loading: () => <div style={{ padding: 24, color: '#888' }}>Loading tldraw...</div>,
  },
)

export type CanvasEngine = 'svg' | 'tldraw'

type StagePanelProps = {
  // Status
  status: string

  // Canvas engine toggle
  canvasEngine: CanvasEngine
  onCanvasEngineChange: (engine: CanvasEngine) => void

  // Zoom controls (SVG mode only)
  canvasZoom: number
  canvasZoomPercent: number
  canvasPreviewWidth: number
  CANVAS_ZOOM_MIN: number
  CANVAS_ZOOM_MAX: number
  CANVAS_ZOOM_STEP: number
  setCanvasZoomLevel: (value: number) => void
  zoomCanvasIn: () => void
  zoomCanvasOut: () => void
  resetCanvasZoom: () => void
  handleZoomSliderWheel: (event: ReactWheelEvent<HTMLDivElement>) => void
  handleStageWheel: (event: ReactWheelEvent<HTMLDivElement>) => void
  stageViewportRef: Ref<HTMLDivElement>

  // SceneCanvas props (SVG mode)
  scene: Scene
  selectedIds: string[]
  guides?: GuideLine[]
  spacingGuides?: MeasurementGuide[]
  resizeLabel?: ResizeLabel | null
  svgRef?: Ref<SVGSVGElement>
  marquee?: MarqueeState
  hitTestStrategy?: HitTestStrategy
  editingTextId?: string | null
  isGroupDragging?: boolean
  canvasWidth?: number
  canvasHeight?: number
  resolveSrc?: (src: string) => string
  onCanvasPointerDown?: (event: PointerEvent<SVGSVGElement>) => void
  onElementPointerDown?: (elementId: string, event: PointerEvent<SVGGElement>) => void
  onResizePointerDown?: (elementId: string, event: PointerEvent<SVGRectElement>) => void
  onGroupDragPointerDown?: (event: PointerEvent<SVGRectElement>) => void
  onGroupResizePointerDown?: (handle: ResizeHandleType, event: PointerEvent<SVGRectElement>) => void
  onTextElementDoubleClick?: (elementId: string) => void

  // tldraw mode props
  onSceneChange?: (scene: Scene) => void
  onSelectionChange?: (elementIds: string[]) => void
  onEditorReady?: (editor: Editor) => void
  srcVersion?: number
}

export function StagePanel({
  status,
  canvasEngine,
  onCanvasEngineChange,
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
  onSceneChange,
  onSelectionChange,
  onEditorReady,
  srcVersion,
}: StagePanelProps) {
  const isTldraw = canvasEngine === 'tldraw'

  return (
    <section className={styles.stagePanel} aria-label="Canvas preview">
      <div className={styles.stageHeader}>
        <span className={styles.stageStatus}>{status}</span>
        <div className={styles.stageHeaderTools}>
          {/* Canvas engine toggle */}
          <div
            style={{
              display: 'flex',
              gap: 0,
              borderRadius: 4,
              overflow: 'hidden',
              border: '1px solid #444',
            }}
          >
            <button
              type="button"
              style={{
                padding: '2px 10px',
                fontSize: 12,
                cursor: 'pointer',
                border: 'none',
                background: !isTldraw ? '#336FFF' : '#1a1a2e',
                color: !isTldraw ? '#fff' : '#888',
              }}
              onClick={() => onCanvasEngineChange('svg')}
            >
              SVG
            </button>
            <button
              type="button"
              style={{
                padding: '2px 10px',
                fontSize: 12,
                cursor: 'pointer',
                border: 'none',
                background: isTldraw ? '#7ee787' : '#1a1a2e',
                color: isTldraw ? '#0d1117' : '#888',
              }}
              onClick={() => onCanvasEngineChange('tldraw')}
            >
              tldraw
            </button>
          </div>

          {!isTldraw && (
            <>
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
                  <Slider
                    min={CANVAS_ZOOM_MIN}
                    max={CANVAS_ZOOM_MAX}
                    step={CANVAS_ZOOM_STEP}
                    value={canvasZoom}
                    onValueChange={setCanvasZoomLevel}
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
            </>
          )}
          {isTldraw && <span style={{ color: '#7ee787' }}>tldraw 引擎 — 滚轮缩放，拖拽平移</span>}
        </div>
      </div>
      <div
        className={styles.stageViewport}
        ref={stageViewportRef}
        onWheel={isTldraw ? undefined : handleStageWheel}
      >
        {isTldraw ? (
          <div
            className={styles.scenePreviewFrame}
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
            }}
          >
            <CovercastEditor
              scene={scene}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              resolveSrc={resolveSrc}
              srcVersion={srcVersion}
              onEditorReady={onEditorReady}
              onSceneChange={onSceneChange}
              onSelectionChange={onSelectionChange}
            />
          </div>
        ) : (
          <div className={styles.stageViewportInner}>
            <div
              className={styles.scenePreviewFrame}
              style={{
                width: canvasPreviewWidth,
                aspectRatio: `${canvasWidth} / ${canvasHeight}`,
              }}
            >
              <SceneCanvas
                scene={scene}
                className={styles.scenePreview}
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
        )}
      </div>
    </section>
  )
}
