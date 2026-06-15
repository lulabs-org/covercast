'use client'

import { useCanvasUIStore, clampZoom } from '@/stores/useCanvasUIStore'
import { CANVAS_ZOOM_STEP } from '@/lib/config/canvas-config'

export function useZoomHandler() {
  const setCanvasZoomLevel = useCanvasUIStore((s) => s.setCanvasZoomLevel)

  function handleStageWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (!event.ctrlKey && !event.metaKey) return
    event.preventDefault()
    const direction = event.deltaY < 0 ? 1 : -1
    const { canvasZoom, canvasFitWidth } = useCanvasUIStore.getState()
    const zoom = clampZoom(canvasZoom + direction * CANVAS_ZOOM_STEP)
    useCanvasUIStore.setState({
      canvasZoom: zoom,
      canvasPreviewWidth: Math.round(canvasFitWidth * zoom),
      canvasZoomPercent: Math.round(zoom * 100),
    })
  }

  function handleZoomSliderWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault()
    const direction = event.deltaY < 0 ? 1 : -1
    const { canvasZoom, canvasFitWidth } = useCanvasUIStore.getState()
    const zoom = clampZoom(canvasZoom + direction * CANVAS_ZOOM_STEP)
    useCanvasUIStore.setState({
      canvasZoom: zoom,
      canvasPreviewWidth: Math.round(canvasFitWidth * zoom),
      canvasZoomPercent: Math.round(zoom * 100),
    })
  }

  return { handleStageWheel, handleZoomSliderWheel }
}
