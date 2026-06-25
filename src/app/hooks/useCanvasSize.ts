import { useState, useCallback, useMemo } from 'react'
import {
  type CanvasSize,
  type CanvasSizePreset,
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_CANVAS_HEIGHT,
  CANVAS_SIZE_PRESETS,
  findPreset,
  isPresetSize,
  computeAspectRatio,
  clampCustomSize,
  createDefaultCanvasSize,
} from '@/domain/canvas-size'

// 向后兼容:旧调用方可能从本 hook 导入类型。
// 新代码请直接从 @/domain/canvas-size 导入。
export type { CanvasSize, CanvasSizePreset }

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
  const { defaultWidth = DEFAULT_CANVAS_WIDTH, defaultHeight = DEFAULT_CANVAS_HEIGHT } = options

  const [canvasSize, setCanvasSizeState] = useState<CanvasSize>(() => {
    const saved = loadSavedCanvasSize()
    if (saved) {
      return saved
    }
    return { width: defaultWidth, height: defaultHeight }
  })

  const [isCustomSize, setIsCustomSize] = useState(() => {
    const saved = loadSavedCanvasSize()
    if (!saved) {
      return false
    }
    return !isPresetSize(saved)
  })

  const setCanvasSize = useCallback((size: CanvasSize) => {
    setCanvasSizeState(size)
    saveCanvasSize(size)
    setIsCustomSize(!isPresetSize(size))
  }, [])

  const setPresetSize = useCallback((preset: CanvasSizePreset) => {
    const size = { width: preset.width, height: preset.height }
    setCanvasSizeState(size)
    saveCanvasSize(size)
    setIsCustomSize(false)
  }, [])

  const setCustomSize = useCallback((width: number, height: number) => {
    const size = clampCustomSize(width, height)
    setCanvasSizeState(size)
    saveCanvasSize(size)
    setIsCustomSize(true)
  }, [])

  const resetToDefault = useCallback(() => {
    const size = createDefaultCanvasSize()
    setCanvasSizeState(size)
    saveCanvasSize(size)
    setIsCustomSize(false)
  }, [])

  const currentPreset = useMemo(() => findPreset(canvasSize), [canvasSize])

  const aspectRatio = useMemo(() => computeAspectRatio(canvasSize), [canvasSize])

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
