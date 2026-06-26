/**
 * 画布尺寸领域 (Canvas Size Domain)
 *
 * 单一真理源 (Single Source of Truth):
 * - 默认画布宽高
 * - 画布尺寸预设表
 * - 与画布尺寸相关的纯函数(预设查找、宽高比、自定义尺寸规整)
 *
 * 注意:localStorage 持久化与 React 状态由 useCanvasSize hook 负责,
 * 不属于 domain 层。
 */

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

/** 默认画布宽度 */
export const DEFAULT_CANVAS_WIDTH = 941

/** 默认画布高度 */
export const DEFAULT_CANVAS_HEIGHT = 1672

/** 画布尺寸预设表 */
export const CANVAS_SIZE_PRESETS: CanvasSizePreset[] = [
  { id: 'default', label: '941 × 1672', width: 941, height: 1672, ratio: '默认' },
  { id: '9:16', label: '1080 × 1920', width: 1080, height: 1920, ratio: '9:16' },
  { id: '3:4', label: '1080 × 1440', width: 1080, height: 1440, ratio: '3:4' },
  { id: '1:1', label: '1080 × 1080', width: 1080, height: 1080, ratio: '1:1' },
  { id: '4:3', label: '1440 × 1080', width: 1440, height: 1080, ratio: '4:3' },
  { id: '16:9', label: '1920 × 1080', width: 1920, height: 1080, ratio: '16:9' },
  { id: '2.35:1', label: '1080 × 460', width: 1080, height: 460, ratio: '2.35:1' },
]

/** 默认画布尺寸预设(CANVAS_SIZE_PRESETS[0] 的语义别名) */
export const DEFAULT_CANVAS_PRESET: CanvasSizePreset = CANVAS_SIZE_PRESETS[0]

/** 自定义尺寸最小值(像素) */
export const MIN_CANVAS_DIMENSION = 100

/**
 * 创建默认画布尺寸
 */
export function createDefaultCanvasSize(): CanvasSize {
  return { width: DEFAULT_CANVAS_WIDTH, height: DEFAULT_CANVAS_HEIGHT }
}

/**
 * 按宽高查找匹配的预设。未匹配返回 undefined。
 */
export function findPreset(size: CanvasSize): CanvasSizePreset | undefined {
  return CANVAS_SIZE_PRESETS.find(
    (preset) => preset.width === size.width && preset.height === size.height,
  )
}

/**
 * 判断给定尺寸是否为预设之一。
 */
export function isPresetSize(size: CanvasSize): boolean {
  return findPreset(size) !== undefined
}

/**
 * 计算最大公约数(欧几里得算法)。
 */
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

/**
 * 计算宽高比字符串(最简整数比,如 "941:1672")。
 */
export function computeAspectRatio(size: CanvasSize): string {
  const divisor = gcd(size.width, size.height)
  return `${size.width / divisor}:${size.height / divisor}`
}

/**
 * 规整自定义尺寸:四舍五入 + 最小值约束。
 */
export function clampCustomSize(width: number, height: number): CanvasSize {
  return {
    width: Math.max(MIN_CANVAS_DIMENSION, Math.round(width)),
    height: Math.max(MIN_CANVAS_DIMENSION, Math.round(height)),
  }
}

// ─── 画布缩放 (Canvas zoom) ────────────────────────────────────────────────

/** 画布缩放下限 */
export const CANVAS_ZOOM_MIN = 0.25

/** 画布缩放上限 */
export const CANVAS_ZOOM_MAX = 3

/** 画布缩放步长(按钮 / 滚轮) */
export const CANVAS_ZOOM_STEP = 0.1

/**
 * 把缩放值限制在 [CANVAS_ZOOM_MIN, CANVAS_ZOOM_MAX] 范围内。
 * 非有限值回退到 1(默认缩放)。
 */
export function clampZoom(value: number): number {
  const safeValue = Number.isFinite(value) ? value : 1
  return Math.min(Math.max(safeValue, CANVAS_ZOOM_MIN), CANVAS_ZOOM_MAX)
}
