/**
 * 画布尺寸预设配置
 * 定义所有可选画布尺寸，含标签、宽高、比例信息
 */

export interface CanvasSizePreset {
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

/** 默认画布尺寸预设（Single Source of Truth） */
export const DEFAULT_CANVAS_PRESET = CANVAS_SIZE_PRESETS[0]
