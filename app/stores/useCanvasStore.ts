import { create } from 'zustand'
import type { ExportFormat } from '../hooks/useExportScene'
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from '../lib/scene'

export type CanvasSize = {
  width: number
  height: number
}

export type CanvasSizePreset = {
  id: string
  label: string
  width: number
  height: number
  ratio: string
}

export const CANVAS_SIZE_PRESETS: CanvasSizePreset[] = [
  { id: 'default', label: '941 × 1672', width: 941, height: 1672, ratio: '默认' },
  { id: '9:16', label: '1080 × 1920', width: 1080, height: 1920, ratio: '9:16' },
  { id: '3:4', label: '1080 × 1440', width: 1080, height: 1440, ratio: '3:4' },
  { id: '1:1', label: '1080 × 1080', width: 1080, height: 1080, ratio: '1:1' },
  { id: '4:3', label: '1440 × 1080', width: 1440, height: 1080, ratio: '4:3' },
  { id: '16:9', label: '1920 × 1080', width: 1920, height: 1080, ratio: '16:9' },
  { id: '2.35:1', label: '1080 × 460', width: 1080, height: 460, ratio: '2.35:1' },
]

type SidebarSectionId = 'scene' | 'sources' | 'templates' | 'layers'

type CanvasStoreState = {
  // Status
  status: string
  setStatus: (status: string) => void

  // App origin (for slot URLs)
  appOrigin: string
  setAppOrigin: (origin: string) => void

  // Export
  exportFormat: ExportFormat
  setExportFormat: (format: ExportFormat) => void

  // Canvas size
  canvasSize: CanvasSize
  isCustomSize: boolean
  currentPreset: CanvasSizePreset | undefined
  presets: CanvasSizePreset[]
  setCanvasSize: (size: CanvasSize) => void
  setPresetSize: (preset: CanvasSizePreset) => void
  setCustomSize: (width: number, height: number) => void

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
  handleStageWheel: (event: React.WheelEvent<HTMLDivElement>) => void
  handleZoomSliderWheel: (event: React.WheelEvent<HTMLDivElement>) => void
  CANVAS_ZOOM_MIN: number
  CANVAS_ZOOM_MAX: number
  CANVAS_ZOOM_STEP: number

  // Sidebar
  collapsedSections: Record<SidebarSectionId, boolean>
  toggleSidebarSection: (sectionId: SidebarSectionId) => void
}

const CANVAS_ZOOM_MIN = 0.25
const CANVAS_ZOOM_MAX = 3
const CANVAS_ZOOM_STEP = 0.1
const CANVAS_PREVIEW_MAX_WIDTH = 560

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function clampZoom(value: number) {
  return clamp(Number.isFinite(value) ? value : 1, CANVAS_ZOOM_MIN, CANVAS_ZOOM_MAX)
}

const STORAGE_KEY = 'covercast.canvasSize.v1'

function loadSavedCanvasSize(): CanvasSize | null {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as CanvasSize
      if (
        typeof parsed.width === 'number' &&
        typeof parsed.height === 'number' &&
        parsed.width > 0 &&
        parsed.height > 0
      ) {
        return parsed
      }
    }
  } catch {}
  return null
}

function saveCanvasSizeToStorage(size: CanvasSize): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(size))
  } catch {}
}

export const useCanvasStore = create<CanvasStoreState>((set) => {
  const savedSize = typeof window !== 'undefined' ? loadSavedCanvasSize() : null
  const initialSize: CanvasSize = savedSize ?? {
    width: DEFAULT_CANVAS_WIDTH,
    height: DEFAULT_CANVAS_HEIGHT,
  }
  const initialIsCustom = savedSize
    ? !CANVAS_SIZE_PRESETS.some((p) => p.width === savedSize.width && p.height === savedSize.height)
    : false

  return {
    status: '正在读取本地场景...',
    setStatus: (status) => set({ status }),

    appOrigin: '',
    setAppOrigin: (origin) => set({ appOrigin: origin }),

    exportFormat: 'png' as ExportFormat,
    setExportFormat: (format) => set({ exportFormat: format }),

    canvasSize: initialSize,
    isCustomSize: initialIsCustom,
    currentPreset: CANVAS_SIZE_PRESETS.find(
      (p) => p.width === initialSize.width && p.height === initialSize.height,
    ),
    presets: CANVAS_SIZE_PRESETS,

    setCanvasSize: (size) => {
      saveCanvasSizeToStorage(size)
      const isPreset = CANVAS_SIZE_PRESETS.some(
        (p) => p.width === size.width && p.height === size.height,
      )
      set({
        canvasSize: size,
        isCustomSize: !isPreset,
        currentPreset: CANVAS_SIZE_PRESETS.find(
          (p) => p.width === size.width && p.height === size.height,
        ),
      })
    },

    setPresetSize: (preset) => {
      const size = { width: preset.width, height: preset.height }
      saveCanvasSizeToStorage(size)
      set({ canvasSize: size, isCustomSize: false, currentPreset: preset })
    },

    setCustomSize: (width, height) => {
      const size = {
        width: Math.max(100, Math.round(width)),
        height: Math.max(100, Math.round(height)),
      }
      saveCanvasSizeToStorage(size)
      set({ canvasSize: size, isCustomSize: true, currentPreset: undefined })
    },

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
    handleStageWheel: (event) => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      const direction = event.deltaY < 0 ? 1 : -1
      set((s) => {
        const zoom = clampZoom(s.canvasZoom + direction * CANVAS_ZOOM_STEP)
        return {
          canvasZoom: zoom,
          canvasPreviewWidth: Math.round(s.canvasFitWidth * zoom),
          canvasZoomPercent: Math.round(zoom * 100),
        }
      })
    },
    handleZoomSliderWheel: (event) => {
      event.preventDefault()
      const direction = event.deltaY < 0 ? 1 : -1
      set((s) => {
        const zoom = clampZoom(s.canvasZoom + direction * CANVAS_ZOOM_STEP)
        return {
          canvasZoom: zoom,
          canvasPreviewWidth: Math.round(s.canvasFitWidth * zoom),
          canvasZoomPercent: Math.round(zoom * 100),
        }
      })
    },
    CANVAS_ZOOM_MIN,
    CANVAS_ZOOM_MAX,
    CANVAS_ZOOM_STEP,

    collapsedSections: { scene: false, sources: false, templates: false, layers: false },
    toggleSidebarSection: (sectionId) => {
      set((s) => ({
        collapsedSections: { ...s.collapsedSections, [sectionId]: !s.collapsedSections[sectionId] },
      }))
    },
  }
})
