import {
  getLocalFontMetas,
  saveLocalFont,
  deleteLocalFont,
  restoreLocalFonts,
  readFileAsArrayBuffer,
  getFontMimeType,
  type LocalFontMeta,
} from '../lib/localFontStorage'
import type { FontOption } from '../lib/fonts'

export type { LocalFontMeta }

export function getAllLocalFontMetas(): LocalFontMeta[] {
  return getLocalFontMetas()
}

export async function importLocalFont(file: File): Promise<LocalFontMeta> {
  const familyName = file.name.replace(/\.(ttf|otf|woff2|woff)$/i, '').trim()
  const mimeType = getFontMimeType(file.name)
  const arrayBuffer = await readFileAsArrayBuffer(file)

  const fontFace = new FontFace(familyName, arrayBuffer)
  const loaded = await fontFace.load()
  document.fonts.add(loaded)

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
  return meta
}

export async function removeLocalFont(family: string): Promise<void> {
  await deleteLocalFont(family)
}

export async function restoreAllLocalFonts(): Promise<LocalFontMeta[]> {
  return restoreLocalFonts()
}

export function localFontMetaToOption(meta: LocalFontMeta): FontOption {
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
