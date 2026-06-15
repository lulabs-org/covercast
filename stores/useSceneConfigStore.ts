import { create } from 'zustand'
import {
  CANVAS_SIZE_PRESETS,
  type CanvasSize,
  type CanvasSizePreset,
} from '@/lib/config/canvas-config'
import { loadSavedCanvasSize, saveCanvasSizeToStorage } from '@/lib/storage/canvas-storage'

export type { CanvasSize, CanvasSizePreset } from '@/lib/config/canvas-config'

export type SceneConfigSlice = {
  // Canvas size
  canvasSize: CanvasSize
  isCustomSize: boolean
  currentPreset: CanvasSizePreset | undefined
  presets: CanvasSizePreset[]
  setCanvasSize: (size: CanvasSize) => void
  setPresetSize: (preset: CanvasSizePreset) => void
  setCustomSize: (width: number, height: number) => void

  // Export
  exportFormat: 'png' | 'jpeg' | 'svg' | 'json'
  setExportFormat: (format: 'png' | 'jpeg' | 'svg' | 'json') => void
}

export const useSceneConfigStore = create<SceneConfigSlice>()((set) => {
  const savedSize = typeof window !== 'undefined' ? loadSavedCanvasSize() : null
  const initialSize: CanvasSize = savedSize ?? {
    width: 941,
    height: 1672,
  }
  const initialIsCustom = savedSize
    ? !CANVAS_SIZE_PRESETS.some((p) => p.width === savedSize.width && p.height === savedSize.height)
    : false

  return {
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

    exportFormat: 'png' as const,
    setExportFormat: (format) => set({ exportFormat: format }),
  }
})
