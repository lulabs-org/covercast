import type { Scene } from '../types'
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from '../lib/scene'
import { sceneToSvgMarkup } from '../lib/scene-svg'
import { inlineSceneAssets } from './assetService'

export type ExportFormat = 'png' | 'jpeg' | 'svg' | 'json'

export const EXPORT_FORMAT_OPTIONS: {
  extension: string
  label: string
  mimeType: string
  value: ExportFormat
}[] = [
  { extension: 'png', label: 'PNG', mimeType: 'image/png', value: 'png' },
  { extension: 'jpg', label: 'JPG', mimeType: 'image/jpeg', value: 'jpeg' },
  { extension: 'svg', label: 'SVG', mimeType: 'image/svg+xml;charset=utf-8', value: 'svg' },
  { extension: 'json', label: 'JSON', mimeType: 'application/json;charset=utf-8', value: 'json' },
]

export async function exportSceneToFormat(
  scene: Scene,
  format: ExportFormat,
  canvasWidth = DEFAULT_CANVAS_WIDTH,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
): Promise<{ blob: Blob; filename: string }> {
  const formatOption =
    EXPORT_FORMAT_OPTIONS.find((option) => option.value === format) ?? EXPORT_FORMAT_OPTIONS[0]

  if (format === 'json') {
    throw new Error('JSON export should be handled separately')
  }

  const exportScene = await inlineSceneAssets(scene)
  const svgMarkup = sceneToSvgMarkup(exportScene, canvasWidth, canvasHeight)
  const filename = `covercast-${new Date().toISOString().slice(0, 10)}.${formatOption.extension}`

  if (format === 'svg') {
    return {
      blob: new Blob([svgMarkup], { type: formatOption.mimeType }),
      filename,
    }
  }

  const canvas = await renderSvgToCanvas(
    svgMarkup,
    format === 'jpeg' ? '#ffffff' : null,
    canvasWidth,
    canvasHeight,
  )
  const blob = await canvasToBlob(
    canvas,
    formatOption.mimeType,
    format === 'jpeg' ? 0.92 : undefined,
  )

  return { blob, filename }
}

async function renderSvgToCanvas(
  svgMarkup: string,
  backgroundColor: string | null,
  canvasWidth: number,
  canvasHeight: number,
): Promise<HTMLCanvasElement> {
  const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)

  try {
    return await new Promise<HTMLCanvasElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = canvasWidth
        canvas.height = canvasHeight
        const context = canvas.getContext('2d')
        if (!context) {
          reject(new Error('Canvas context unavailable'))
          return
        }

        if (backgroundColor) {
          context.fillStyle = backgroundColor
          context.fillRect(0, 0, canvasWidth, canvasHeight)
        }

        context.drawImage(image, 0, 0, canvasWidth, canvasHeight)
        resolve(canvas)
      }
      image.onerror = () => reject(new Error('SVG render failed'))
      image.src = svgUrl
    })
  } finally {
    URL.revokeObjectURL(svgUrl)
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas export failed'))
          return
        }

        resolve(blob)
      },
      mimeType,
      quality,
    )
  })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob)
  const download = document.createElement('a')
  download.href = objectUrl
  download.download = filename
  document.body.appendChild(download)
  download.click()
  download.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}
