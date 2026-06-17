import { useEffect, useState, type PointerEvent, type Ref } from 'react'
import {
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_CANVAS_HEIGHT,
  type Scene,
  type SceneElement,
  type GuideLine,
  type MeasurementGuide,
  type ResizeLabel,
  getMarqueeRect,
  hasMarqueeSize,
  hitTestElements,
  isMarqueeActive,
  type HitTestStrategy,
  type MarqueeState,
  type ResizeHandleType,
} from '@/domain'
import { SceneDefs, backgroundMaskId, hasBackgroundCutouts } from './canvas/SceneDefs'
import { ElementView } from './canvas/elements/ElementView'
import { SelectionFrame } from './canvas/SelectionFrame'
import { GroupSelectionFrame } from './canvas/GroupSelectionFrame'
import { MarqueeOverlay } from './canvas/MarqueeOverlay'
import { SmartGuideOverlay } from './canvas/SmartGuideOverlay'
import { ResizeLabelOverlay } from './canvas/ResizeLabelOverlay'
import { SpacingGuideOverlay } from './canvas/SpacingGuideOverlay'

type SceneCanvasProps = {
  scene: Scene
  className?: string
  style?: React.CSSProperties
  idPrefix?: string
  interactive?: boolean
  selectedIds?: string[]
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
}

export default function SceneCanvas({
  scene,
  className,
  style,
  idPrefix = 'scene',
  interactive = false,
  selectedIds = [],
  guides,
  spacingGuides,
  resizeLabel,
  svgRef,
  marquee,
  hitTestStrategy = 'intersection',
  editingTextId,
  isGroupDragging = false,
  canvasWidth = DEFAULT_CANVAS_WIDTH,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
  resolveSrc,
  onCanvasPointerDown,
  onElementPointerDown,
  onResizePointerDown,
  onGroupDragPointerDown,
  onGroupResizePointerDown,
  onTextElementDoubleClick,
}: SceneCanvasProps) {
  const [shiftKeyPressed, setShiftKeyPressed] = useState(false)

  useEffect(() => {
    if (!interactive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftKeyPressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftKeyPressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [interactive])

  const visibleElements = scene.elements.filter((element) => element.hidden !== true)
  const selectedElements = visibleElements.filter((element) => selectedIds.includes(element.id))

  let marqueePreviewElements: SceneElement[] = []
  if (marquee && isMarqueeActive(marquee) && hasMarqueeSize(marquee, 5)) {
    const rect = getMarqueeRect(marquee)
    const hitIds = hitTestElements(rect, visibleElements, hitTestStrategy)
    marqueePreviewElements = visibleElements.filter((element) => hitIds.includes(element.id))
  }

  return (
    <svg
      ref={svgRef}
      className={className}
      viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
      role="img"
      aria-label="Covercast OBS live background"
      preserveAspectRatio="xMidYMid meet"
      onPointerDown={onCanvasPointerDown}
      style={{
        ...style,
        touchAction: interactive ? 'none' : undefined,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <SceneDefs
        visibleElements={visibleElements}
        idPrefix={idPrefix}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
      />

      <g
        mask={
          hasBackgroundCutouts(visibleElements) ? `url(#${backgroundMaskId(idPrefix)})` : undefined
        }
      >
        <rect
          width={canvasWidth}
          height={canvasHeight}
          fill={scene.backgroundColor}
          opacity={clampOpacity(scene.backgroundOpacity)}
        />
        <rect
          width={canvasWidth}
          height={canvasHeight}
          fill={`url(#${idPrefix}-bg-glow)`}
          opacity={0.68 * clampOpacity(scene.backgroundOpacity)}
        />
      </g>

      {visibleElements.map((element) => (
        <ElementView
          key={element.id}
          element={element}
          idPrefix={idPrefix}
          interactive={interactive}
          editingTextId={editingTextId}
          resolveSrc={resolveSrc}
          onPointerDown={onElementPointerDown}
          onDoubleClick={onTextElementDoubleClick}
        />
      ))}

      {interactive && selectedElements.length > 0 ? (
        <>
          {selectedElements.map((element) => (
            <SelectionFrame
              key={element.id}
              element={element}
              onResizePointerDown={selectedElements.length === 1 ? onResizePointerDown : undefined}
            />
          ))}
          {selectedElements.length > 1 && !isGroupDragging ? (
            <GroupSelectionFrame
              elements={selectedElements}
              shiftKeyPressed={shiftKeyPressed}
              onDragPointerDown={onGroupDragPointerDown}
              onResizePointerDown={onGroupResizePointerDown}
            />
          ) : null}
        </>
      ) : null}

      {interactive && marquee && isMarqueeActive(marquee) ? (
        <MarqueeOverlay marquee={marquee} />
      ) : null}

      {interactive && marqueePreviewElements.length > 0 ? (
        <GroupSelectionFrame elements={marqueePreviewElements} shiftKeyPressed={shiftKeyPressed} />
      ) : null}

      {guides && guides.length > 0 ? <SmartGuideOverlay guides={guides} /> : null}

      {resizeLabel ? <ResizeLabelOverlay resizeLabel={resizeLabel} /> : null}

      {spacingGuides && spacingGuides.length > 0 ? (
        <SpacingGuideOverlay spacingGuides={spacingGuides} />
      ) : null}
    </svg>
  )
}

function clampOpacity(value: number) {
  if (!Number.isFinite(value)) {
    return 1
  }

  return Math.min(Math.max(value, 0), 1)
}
