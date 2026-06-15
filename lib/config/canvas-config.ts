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

export const CANVAS_ZOOM_MIN = 0.25
export const CANVAS_ZOOM_MAX = 3
export const CANVAS_ZOOM_STEP = 0.1
export const CANVAS_PREVIEW_MAX_WIDTH = 560
