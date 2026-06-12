import { useState, useEffect } from 'react'
import { type WheelEvent as ReactWheelEvent } from 'react'
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from '../lib/scene'

const CANVAS_ZOOM_MIN = 0.25
const CANVAS_ZOOM_MAX = 3
const CANVAS_ZOOM_STEP = 0.1
const CANVAS_PREVIEW_MAX_WIDTH = 560
const STAGE_VIEWPORT_PADDING = 36

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function clampZoom(value: number) {
  return clamp(Number.isFinite(value) ? value : 1, CANVAS_ZOOM_MIN, CANVAS_ZOOM_MAX)
}

type UseCanvasZoomOptions = {
  stageViewportRef: React.RefObject<HTMLDivElement | null>
  canvasWidth?: number
  canvasHeight?: number
}

export function useCanvasZoom(options: UseCanvasZoomOptions) {
  const {
    stageViewportRef,
    canvasWidth = DEFAULT_CANVAS_WIDTH,
    canvasHeight = DEFAULT_CANVAS_HEIGHT,
  } = options

  const canvasAspectRatio = canvasWidth / canvasHeight

  const [canvasZoom, setCanvasZoom] = useState(1)
  const [canvasFitWidth, setCanvasFitWidth] = useState(CANVAS_PREVIEW_MAX_WIDTH)

  useEffect(() => {
    const viewport = stageViewportRef.current

    if (!viewport) {
      return
    }

    const currentViewport = viewport

    function updateFitWidth() {
      const availableWidth = Math.max(160, currentViewport.clientWidth - STAGE_VIEWPORT_PADDING)
      const availableHeight = Math.max(280, currentViewport.clientHeight - STAGE_VIEWPORT_PADDING)
      const nextFitWidth = Math.min(
        availableWidth,
        availableHeight * canvasAspectRatio,
        CANVAS_PREVIEW_MAX_WIDTH,
      )

      setCanvasFitWidth(Math.max(160, nextFitWidth))
    }

    updateFitWidth()

    const observer = new ResizeObserver(updateFitWidth)
    observer.observe(currentViewport)
    window.addEventListener('resize', updateFitWidth)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateFitWidth)
    }
  }, [stageViewportRef, canvasAspectRatio])

  const canvasPreviewWidth = Math.round(canvasFitWidth * canvasZoom)
  const canvasZoomPercent = Math.round(canvasZoom * 100)

  function setCanvasZoomLevel(value: number) {
    setCanvasZoom(clampZoom(value))
  }

  function zoomCanvasIn() {
    setCanvasZoom((value) => clampZoom(value + CANVAS_ZOOM_STEP))
  }

  function zoomCanvasOut() {
    setCanvasZoom((value) => clampZoom(value - CANVAS_ZOOM_STEP))
  }

  function resetCanvasZoom() {
    setCanvasZoom(1)
  }

  function handleStageWheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (!event.ctrlKey && !event.metaKey) {
      return
    }

    event.preventDefault()
    const direction = event.deltaY < 0 ? 1 : -1
    setCanvasZoom((value) => clampZoom(value + direction * CANVAS_ZOOM_STEP))
  }

  function handleZoomSliderWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault()
    const direction = event.deltaY < 0 ? 1 : -1
    setCanvasZoom((value) => clampZoom(value + direction * CANVAS_ZOOM_STEP))
  }

  return {
    canvasZoom,
    canvasFitWidth,
    canvasPreviewWidth,
    canvasZoomPercent,
    setCanvasZoomLevel,
    zoomCanvasIn,
    zoomCanvasOut,
    resetCanvasZoom,
    handleStageWheel,
    handleZoomSliderWheel,
    CANVAS_ZOOM_MIN,
    CANVAS_ZOOM_MAX,
    CANVAS_ZOOM_STEP,
  }
}
