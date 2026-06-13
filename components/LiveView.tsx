'use client'

import { useEffect, useState, useMemo } from 'react'
import { isImageElement, type Scene } from '@/lib/domain/scene'
import { createDefaultScene } from '@/lib/templates'
import {
  isLocalAssetSrc,
  parseLocalAssetId,
  getLocalAssetBlobUrl,
} from '@/lib/storage/local-asset-storage'
import SceneCanvas from './SceneCanvas'
import styles from './LiveView.module.css'

type LiveViewProps = {
  templateId?: string
  slotId?: string
}

export default function LiveView({ templateId, slotId }: LiveViewProps) {
  const [scene, setScene] = useState<Scene>(() => createDefaultScene())
  const [blobUrlMap, setBlobUrlMap] = useState<Record<string, string>>({})

  useEffect(() => {
    let active = true

    async function refreshScene() {
      try {
        const url =
          templateId && slotId
            ? `/api/scene?t=${encodeURIComponent(templateId)}&s=${encodeURIComponent(slotId)}&ts=${Date.now()}`
            : `/api/scene?ts=${Date.now()}`

        const response = await fetch(url, {
          cache: 'no-store',
        })
        if (!response.ok) {
          return
        }

        const nextScene = (await response.json()) as Scene
        if (active) {
          setScene(nextScene)
        }
      } catch {
        // OBS should keep rendering the last known scene if a refresh fails.
      }
    }

    void refreshScene()
    const interval = window.setInterval(refreshScene, 1000)

    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [templateId, slotId])

  // 解析 local-asset src 为 blob URL
  const localAssetIds = useMemo(() => {
    const ids = new Set<string>()
    for (const element of scene.elements) {
      if (isImageElement(element) && isLocalAssetSrc(element.src)) {
        const id = parseLocalAssetId(element.src)
        if (id) ids.add(id)
      }
    }
    return ids
  }, [scene.elements])

  useEffect(() => {
    let active = true
    const ids = Array.from(localAssetIds)

    void (async () => {
      if (ids.length === 0) {
        if (active) setBlobUrlMap({})
        return
      }

      const entries = await Promise.all(
        ids.map(async (id) => {
          const blobUrl = await getLocalAssetBlobUrl(id)
          return [id, blobUrl] as const
        }),
      )

      if (!active) {
        for (const [, url] of entries) {
          if (url) URL.revokeObjectURL(url)
        }
        return
      }
      const nextMap: Record<string, string> = {}
      for (const [id, url] of entries) {
        if (url) nextMap[id] = url
      }
      setBlobUrlMap(nextMap)
    })()

    return () => {
      active = false
    }
  }, [localAssetIds])

  // 组件卸载时回收 blob URL
  useEffect(() => {
    return () => {
      for (const url of Object.values(blobUrlMap)) {
        URL.revokeObjectURL(url)
      }
    }
  }, [blobUrlMap])

  function resolveSrc(src: string): string {
    if (!isLocalAssetSrc(src)) return src
    const id = parseLocalAssetId(src)
    if (!id) return src
    return blobUrlMap[id] ?? src
  }

  return (
    <main className={styles.liveShell}>
      <SceneCanvas
        scene={scene}
        className={styles.liveCanvas}
        idPrefix="live"
        resolveSrc={resolveSrc}
      />
    </main>
  )
}
