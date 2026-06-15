import { type ChangeEvent } from 'react'
import {
  createImageElement,
  isImageElement,
  type ImageElement,
  type SceneElement,
} from '../domain/scene'
import { selectSingle } from '../domain/selection'
import {
  buildLocalAssetSrc,
  isSupportedImageType,
  isWithinSizeLimit,
  readFileAsArrayBuffer,
  saveLocalAsset,
  type LocalAssetMeta,
} from '../storage/local-asset-storage'
import { useSceneStore } from '@/stores/useSceneStore'
import { useCanvasUIStore } from '@/stores/useCanvasUIStore'
import { patchElementWithHistory, changeSceneWithHistory } from '@/stores/scene-commands'

async function uploadAsset(file: File, mode: 'add' | 'replace') {
  if (!isSupportedImageType(file)) {
    useCanvasUIStore.getState().setStatus('素材上传失败，仅支持 PNG、JPG、WebP')
    return
  }

  if (!isWithinSizeLimit(file)) {
    useCanvasUIStore.getState().setStatus('素材上传失败，文件大小不能超过 8MB')
    return
  }

  useCanvasUIStore.getState().setStatus('正在保存素材...')

  try {
    const assetId = `asset-${Date.now()}`
    const buffer = await readFileAsArrayBuffer(file)

    const meta: LocalAssetMeta = {
      id: assetId,
      name: file.name,
      mime: file.type,
      size: file.size,
      createdAt: new Date().toISOString(),
    }

    await saveLocalAsset(meta, buffer)

    const src = buildLocalAssetSrc(assetId)

    if (mode === 'replace') {
      const { selection, scene } = useSceneStore.getState()
      if (selection.selectedIds.length === 1) {
        const selectedElement = scene.elements.find((el) => el.id === selection.selectedIds[0])
        if (selectedElement && isImageElement(selectedElement)) {
          patchElementWithHistory(selectedElement.id, {
            src,
            alt: file.name,
          } as Partial<ImageElement>)
          useCanvasUIStore.getState().setStatus('素材已替换到当前画布')
          return
        }
      }
    }

    const element = createImageElement(src, file.name || '自定义素材')
    changeSceneWithHistory(
      (currentScene) => ({
        ...currentScene,
        elements: [...currentScene.elements, element],
      }),
      '添加素材',
    )
    useSceneStore
      .getState()
      .setSelection(selectSingle(useSceneStore.getState().selection, element.id))
    useCanvasUIStore.getState().setStatus('素材已添加到当前画布')
  } catch {
    useCanvasUIStore.getState().setStatus('素材保存失败，浏览器存储空间可能不足')
  }
}

export function handleAssetInput(event: ChangeEvent<HTMLInputElement>, mode: 'add' | 'replace') {
  const file = event.currentTarget.files?.[0]
  event.currentTarget.value = ''

  if (file) {
    void uploadAsset(file, mode)
  }
}
