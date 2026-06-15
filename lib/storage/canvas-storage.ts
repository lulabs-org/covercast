import type { CanvasSize } from '@/lib/config/canvas-config'

const STORAGE_KEY = 'covercast.canvasSize.v1'

export function loadSavedCanvasSize(): CanvasSize | null {
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

export function saveCanvasSizeToStorage(size: CanvasSize): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(size))
  } catch {}
}
