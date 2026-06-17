import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  type CanvasSizePreset,
  CANVAS_SIZE_PRESETS,
  DEFAULT_CANVAS_PRESET,
} from '@/config/canvasPresets'

// 重新导出 CanvasSizePreset，保持现有导入路径兼容
export type { CanvasSizePreset } from '@/config/canvasPresets'

export type CanvasSize = {
  width: number
  height: number
}

const STORAGE_KEY = 'covercast.canvasSize.v1'

function loadSavedCanvasSize(): CanvasSize | null {
  if (typeof window === 'undefined') {
    return null
  }

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
  } catch {
    // Ignore parse errors
  }

  return null
}

function saveCanvasSize(size: CanvasSize): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(size))
  } catch {
    // Ignore storage errors
  }
}

export type UseCanvasSizeOptions = {
  defaultWidth?: number
  defaultHeight?: number
}

export function useCanvasSize(options: UseCanvasSizeOptions = {}) {
  const {
    defaultWidth = DEFAULT_CANVAS_PRESET.width,
    defaultHeight = DEFAULT_CANVAS_PRESET.height,
  } = options

  // SSR 和首次客户端渲染使用默认值，避免 hydration mismatch
  const [canvasSize, setCanvasSizeState] = useState<CanvasSize>({
    width: defaultWidth,
    height: defaultHeight,
  })

  const [isCustomSize, setIsCustomSize] = useState(false)

  // 客户端挂载后从 localStorage 恢复
  useEffect(() => {
    const saved = loadSavedCanvasSize()
    if (saved) {
      setCanvasSizeState(saved)
      const isPreset = CANVAS_SIZE_PRESETS.some(
        (preset) => preset.width === saved.width && preset.height === saved.height,
      )
      setIsCustomSize(!isPreset)
    }
  }, [])

  const setCanvasSize = useCallback((size: CanvasSize) => {
    setCanvasSizeState(size)
    saveCanvasSize(size)

    const isPreset = CANVAS_SIZE_PRESETS.some(
      (preset) => preset.width === size.width && preset.height === size.height,
    )
    setIsCustomSize(!isPreset)
  }, [])

  const setPresetSize = useCallback((preset: CanvasSizePreset) => {
    const size = { width: preset.width, height: preset.height }
    setCanvasSizeState(size)
    saveCanvasSize(size)
    setIsCustomSize(false)
  }, [])

  const setCustomSize = useCallback((width: number, height: number) => {
    const size = {
      width: Math.max(100, Math.round(width)),
      height: Math.max(100, Math.round(height)),
    }
    setCanvasSizeState(size)
    saveCanvasSize(size)
    setIsCustomSize(true)
  }, [])

  const resetToDefault = useCallback(() => {
    const size = { width: DEFAULT_CANVAS_PRESET.width, height: DEFAULT_CANVAS_PRESET.height }
    setCanvasSizeState(size)
    saveCanvasSize(size)
    setIsCustomSize(false)
  }, [])

  const currentPreset = useMemo(() => {
    return CANVAS_SIZE_PRESETS.find(
      (preset) => preset.width === canvasSize.width && preset.height === canvasSize.height,
    )
  }, [canvasSize])

  const aspectRatio = useMemo(() => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
    const divisor = gcd(canvasSize.width, canvasSize.height)
    return `${canvasSize.width / divisor}:${canvasSize.height / divisor}`
  }, [canvasSize])

  return {
    canvasSize,
    setCanvasSize,
    setPresetSize,
    setCustomSize,
    resetToDefault,
    isCustomSize,
    currentPreset,
    aspectRatio,
    presets: CANVAS_SIZE_PRESETS,
  }
}
