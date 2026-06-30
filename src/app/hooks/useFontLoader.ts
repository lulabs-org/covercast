'use client'

import { useState, useCallback, useRef } from 'react'
import type { FontOption } from '@/config/fonts'

/**
 * 字体按需加载器
 *
 * 所有字体通过 fonts.css 中的 @font-face 声明定义，
 * 浏览器会在使用到对应 font-family 时自动下载字体文件。
 * 此 hook 负责等待字体加载完成，以便 UI 可以显示加载状态。
 */
export function useFontLoader() {
  const [loadedFamilies, setLoadedFamilies] = useState<Set<string>>(new Set())
  const [loadingFamilies, setLoadingFamilies] = useState<Set<string>>(new Set())
  const failedRef = useRef<Set<string>>(new Set())

  /** 确保某个字体已加载 */
  const loadFont = useCallback(
    async (font: FontOption) => {
      // 系统字体无需加载
      if (font.files.length === 0) return

      // 已加载，跳过
      if (loadedFamilies.has(font.family)) return

      // 正在加载，跳过
      if (loadingFamilies.has(font.family)) return

      // 之前加载失败，不重试
      if (failedRef.current.has(font.family)) return

      setLoadingFamilies((prev) => new Set(prev).add(font.family))

      try {
        // 使用 document.fonts.load() 触发并等待字体加载
        // @font-face 声明已在 fonts.css 中，浏览器知道如何获取字体文件
        const promises = font.files.map((file) =>
          document.fonts.load(`${file.weight} 12px "${font.family}"`),
        )
        await Promise.all(promises)

        setLoadedFamilies((prev) => new Set(prev).add(font.family))
      } catch {
        // 字体加载失败，静默处理，浏览器会使用 fallback 字体
        failedRef.current.add(font.family)
      } finally {
        setLoadingFamilies((prev) => {
          const next = new Set(prev)
          next.delete(font.family)
          return next
        })
      }
    },
    [loadedFamilies, loadingFamilies],
  )

  /** 检查字体是否已加载 */
  const isLoaded = useCallback((family: string) => loadedFamilies.has(family), [loadedFamilies])

  /** 检查字体是否正在加载 */
  const isLoading = useCallback((family: string) => loadingFamilies.has(family), [loadingFamilies])

  /** 检查字体是否加载失败 */
  const isFailed = useCallback((family: string) => failedRef.current.has(family), [])

  return { loadFont, isLoaded, isLoading, isFailed }
}
