import { create } from 'zustand'
import {
  CANVAS_ZOOM_MIN,
  CANVAS_ZOOM_MAX,
  CANVAS_ZOOM_STEP,
  CANVAS_PREVIEW_MAX_WIDTH,
} from '@/lib/config/canvas-config'

export type SidebarSectionId = 'scene' | 'sources' | 'templates' | 'layers'

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function clampZoom(value: number) {
  return clamp(Number.isFinite(value) ? value : 1, CANVAS_ZOOM_MIN, CANVAS_ZOOM_MAX)
}

export type CanvasUISlice = {
  // Status
  status: string
  setStatus: (status: string) => void

  // Canvas zoom
  canvasZoom: number
  canvasFitWidth: number
  setCanvasFitWidth: (width: number) => void
  canvasPreviewWidth: number
  canvasZoomPercent: number
  setCanvasZoomLevel: (value: number) => void
  zoomCanvasIn: () => void
  zoomCanvasOut: () => void
  resetCanvasZoom: () => void

  // Sidebar
  collapsedSections: Record<SidebarSectionId, boolean>
  toggleSidebarSection: (sectionId: SidebarSectionId) => void
}

export const useCanvasUIStore = create<CanvasUISlice>()((set) => ({
  status: '正在读取本地场景...',
  setStatus: (status) => set({ status }),

  canvasZoom: 1,
  canvasFitWidth: CANVAS_PREVIEW_MAX_WIDTH,
  setCanvasFitWidth: (width) => {
    set((s) => ({
      canvasFitWidth: width,
      canvasPreviewWidth: Math.round(width * s.canvasZoom),
    }))
  },
  canvasPreviewWidth: Math.round(CANVAS_PREVIEW_MAX_WIDTH * 1),
  canvasZoomPercent: 100,

  setCanvasZoomLevel: (value) => {
    const zoom = clampZoom(value)
    set((s) => ({
      canvasZoom: zoom,
      canvasPreviewWidth: Math.round(s.canvasFitWidth * zoom),
      canvasZoomPercent: Math.round(zoom * 100),
    }))
  },
  zoomCanvasIn: () => {
    set((s) => {
      const zoom = clampZoom(s.canvasZoom + CANVAS_ZOOM_STEP)
      return {
        canvasZoom: zoom,
        canvasPreviewWidth: Math.round(s.canvasFitWidth * zoom),
        canvasZoomPercent: Math.round(zoom * 100),
      }
    })
  },
  zoomCanvasOut: () => {
    set((s) => {
      const zoom = clampZoom(s.canvasZoom - CANVAS_ZOOM_STEP)
      return {
        canvasZoom: zoom,
        canvasPreviewWidth: Math.round(s.canvasFitWidth * zoom),
        canvasZoomPercent: Math.round(zoom * 100),
      }
    })
  },
  resetCanvasZoom: () => {
    set((s) => ({
      canvasZoom: 1,
      canvasPreviewWidth: Math.round(s.canvasFitWidth * 1),
      canvasZoomPercent: 100,
    }))
  },

  collapsedSections: { scene: false, sources: false, templates: false, layers: false },
  toggleSidebarSection: (sectionId) => {
    set((s) => ({
      collapsedSections: { ...s.collapsedSections, [sectionId]: !s.collapsedSections[sectionId] },
    }))
  },
}))
