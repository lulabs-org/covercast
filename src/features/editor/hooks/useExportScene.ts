'use client'

import { DEFAULT_CANVAS_HEIGHT, DEFAULT_CANVAS_WIDTH, type Scene } from '../lib/scene'
import {
  exportSceneToFormat,
  downloadBlob,
  type ExportFormat,
  EXPORT_FORMAT_OPTIONS,
} from '../services/exportService'

export type { ExportFormat }
export { EXPORT_FORMAT_OPTIONS }

export function useExportScene(
  scene: Scene,
  setStatus: (status: string) => void,
  exportTemplateJson: () => void,
  canvasWidth = DEFAULT_CANVAS_WIDTH,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
) {
  const exportScene = async (format: ExportFormat) => {
    const formatOption =
      EXPORT_FORMAT_OPTIONS.find((option) => option.value === format) ?? EXPORT_FORMAT_OPTIONS[0]
    setStatus(`正在导出 ${formatOption.label}...`)

    try {
      if (format === 'json') {
        exportTemplateJson()
        return
      }

      const { blob, filename } = await exportSceneToFormat(scene, format, canvasWidth, canvasHeight)
      downloadBlob(blob, filename)

      setStatus(`${formatOption.label} 已导出，尺寸 ${canvasWidth}×${canvasHeight}`)
    } catch {
      setStatus('导出失败，请确认所有素材都能正常显示')
    }
  }

  return {
    exportScene,
  }
}
