'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  getLocalAssetBlobUrl,
  isLocalAssetSrc,
  parseLocalAssetId,
  type LocalAssetMeta,
  getLocalAssetMetas,
} from '@/lib/storage/local-asset-storage'
import { isImageElement, type Scene } from '@/lib/domain/scene'

/**
 * 管理本地素材的 blob URL 生命周期。
 *
 * - 场景中的 `local-asset:<id>` src 被解析为可渲染的 blob: URL
 * - 组件卸载时自动回收 blob URL
 * - 当场景元素变化时自动更新映射
 */
export function useLocalAssets(scene: Scene) {
  const [blobUrlMap, setBlobUrlMap] = useState<Record<string, string>>({})
  const [metas] = useState<LocalAssetMeta[]>(() => getLocalAssetMetas())

  const revokedUrlsRef = useRef<Set<string>>(new Set())

  // 收集场景中所有本地素材 id
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

  // 当素材 id 集合变化时，重新生成 blob URL
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
        // 组件已卸载，立即回收刚创建的 blob URL
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

  // 组件卸载时回收所有 blob URL
  useEffect(() => {
    const revokedUrls = revokedUrlsRef.current
    return () => {
      for (const url of Object.values(blobUrlMap)) {
        if (!revokedUrls.has(url)) {
          URL.revokeObjectURL(url)
          revokedUrls.add(url)
        }
      }
    }
  }, [blobUrlMap])

  /** 将场景元素中的 local-asset src 解析为可渲染的 blob URL */
  function resolveSrc(src: string): string {
    if (!isLocalAssetSrc(src)) return src
    const id = parseLocalAssetId(src)
    if (!id) return src
    return blobUrlMap[id] ?? src
  }

  /** 获取素材元数据 */
  function getMeta(id: string): LocalAssetMeta | undefined {
    return metas.find((m) => m.id === id)
  }

  return {
    resolveSrc,
    getMeta,
    metas,
  }
}
