'use client'

import { useState, useEffect, useCallback } from 'react'
import type { FontOption } from '../lib/fonts'
import {
  restoreLocalFonts,
  saveLocalFont,
  deleteLocalFont,
  readFileAsArrayBuffer,
  getFontMimeType,
  type LocalFontMeta,
} from '../lib/localFontStorage'

/** 将 LocalFontMeta 转为 FontOption */
function metaToOption(meta: LocalFontMeta): FontOption {
  return {
    label: meta.label,
    family: meta.family,
    value: meta.value,
    category: meta.category as FontOption['category'],
    license: meta.license as FontOption['license'],
    group: meta.group,
    files: [],
  }
}

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
    restoreLocalFonts().then((metas) => {
      setLocalFontOptions(metas.map(metaToOption))
      setRestored(true)
    })
  }, [])

  /** 导入本地字体 */
  const importLocalFont = useCallback(async (file: File) => {
    const familyName = file.name.replace(/\.(ttf|otf|woff2|woff)$/i, '').trim()
    const mimeType = getFontMimeType(file.name)
    const arrayBuffer = await readFileAsArrayBuffer(file)

    // 注册字体
    const fontFace = new FontFace(familyName, arrayBuffer)
    const loaded = await fontFace.load()
    document.fonts.add(loaded)

    // 持久化
    const meta: LocalFontMeta = {
      label: familyName,
      family: familyName,
      value: `"${familyName}", sans-serif`,
      category: 'sans-serif',
      license: '本地字体',
      group: '本地字体',
      mimeType,
    }
    await saveLocalFont(meta, arrayBuffer)

    // 更新列表
    setLocalFontOptions((prev) => {
      const exists = prev.some((f) => f.family === familyName)
      if (exists) return prev
      return [...prev, metaToOption(meta)]
    })

    return meta
  }, [])

  /** 删除本地字体 */
  const removeLocalFont = useCallback(async (family: string) => {
    await deleteLocalFont(family)
    setLocalFontOptions((prev) => prev.filter((f) => f.family !== family))
  }, [])

  return { localFontOptions, restored, importLocalFont, removeLocalFont }
}
