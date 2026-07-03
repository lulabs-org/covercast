'use client'

import { useState, useEffect, useCallback } from 'react'
import type { FontOption } from '../lib/fonts'
import {
  restoreAllLocalFonts,
  importLocalFont as importLocalFontService,
  removeLocalFont as removeLocalFontService,
  localFontMetaToOption,
} from '../services/fontService'

/**
 * 本地字体管理 Hook
 *
 * 在编辑器加载时立即从 IndexedDB 恢复本地字体并注册到 document.fonts，
 * 确保画布渲染时本地字体已经可用。
 */
export function useLocalFonts() {
  const [localFontOptions, setLocalFontOptions] = useState<FontOption[]>([])
  const [restored, setRestored] = useState(false)

  // 页面加载时立即恢复本地字体
  useEffect(() => {
    restoreAllLocalFonts().then((metas) => {
      setLocalFontOptions(metas.map(localFontMetaToOption))
      setRestored(true)
    })
  }, [])

  /** 导入本地字体 */
  const importLocalFont = useCallback(async (file: File) => {
    const meta = await importLocalFontService(file)

    // 更新列表
    setLocalFontOptions((prev) => {
      const exists = prev.some((f) => f.family === meta.family)
      if (exists) return prev
      return [...prev, localFontMetaToOption(meta)]
    })

    return meta
  }, [])

  /** 删除本地字体 */
  const removeLocalFont = useCallback(async (family: string) => {
    await removeLocalFontService(family)
    setLocalFontOptions((prev) => prev.filter((f) => f.family !== family))
  }, [])

  return { localFontOptions, restored, importLocalFont, removeLocalFont }
}
