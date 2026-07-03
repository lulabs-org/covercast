import type { ImageElement, Scene, SceneElement } from '../types'
import {
  buildLocalAssetSrc,
  deleteLocalAsset,
  getLocalAssetBlobUrl,
  getLocalAssetDataUrl,
  getLocalAssetMetas,
  isLocalAssetSrc,
  isSupportedImageType,
  isWithinSizeLimit,
  parseLocalAssetId,
  readFileAsArrayBuffer,
  saveLocalAsset,
  type LocalAssetMeta,
} from '../lib/localAssetStorage'

export type { LocalAssetMeta }

export async function uploadLocalAsset(
  file: File,
): Promise<{ id: string; src: string; meta: LocalAssetMeta }> {
  if (!isSupportedImageType(file)) {
    throw new Error('Unsupported image type')
  }

  if (!isWithinSizeLimit(file)) {
    throw new Error('File too large')
  }

  const id = `asset-${Date.now()}`
  const buffer = await readFileAsArrayBuffer(file)

  const meta: LocalAssetMeta = {
    id,
    name: file.name,
    mime: file.type,
    size: file.size,
    createdAt: new Date().toISOString(),
  }

  await saveLocalAsset(meta, buffer)

  return {
    id,
    src: buildLocalAssetSrc(id),
    meta,
  }
}

export async function removeLocalAsset(id: string): Promise<void> {
  await deleteLocalAsset(id)
}

export function getAllLocalAssetMetas(): LocalAssetMeta[] {
  return getLocalAssetMetas()
}

export async function getLocalAssetUrl(id: string): Promise<string | null> {
  return getLocalAssetBlobUrl(id)
}

export async function inlineSceneAssets(scene: Scene): Promise<Scene> {
  const elements = await Promise.all(
    scene.elements.map(async (element) => {
      if (!isImageElement(element) || !element.src || element.src.startsWith('data:')) {
        return element
      }

      if (isLocalAssetSrc(element.src)) {
        const id = parseLocalAssetId(element.src)
        if (id) {
          const dataUrl = await getLocalAssetDataUrl(id)
          if (dataUrl) {
            return { ...element, src: dataUrl } satisfies ImageElement
          }
        }
        return element
      }

      const response = await fetch(element.src, { cache: 'no-store' })
      if (!response.ok) {
        return element
      }

      const blob = await response.blob()
      const dataUrl = await blobToDataUrl(blob)
      return { ...element, src: dataUrl } satisfies ImageElement
    }),
  )

  return { ...scene, elements }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function isImageElement(element: SceneElement): element is ImageElement {
  return element.type === 'image'
}
