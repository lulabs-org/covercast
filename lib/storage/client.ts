/**
 * 客户端存储 — 仅可在 Client Components / Hooks 中导入。
 * 使用 IndexedDB / localStorage / File API，服务端导入会导致运行时错误。
 */
export {
  isLocalAssetSrc,
  parseLocalAssetId,
  buildLocalAssetSrc,
  getLocalAssetMetas,
  saveLocalAsset,
  deleteLocalAsset,
  getLocalAssetBlobUrl,
  getLocalAssetDataUrl,
  readFileAsArrayBuffer as readAssetFileAsArrayBuffer,
  isSupportedImageType,
  isWithinSizeLimit,
} from './local-asset-storage'
export type { LocalAssetMeta } from './local-asset-storage'
export {
  getLocalFontMetas,
  saveLocalFont,
  deleteLocalFont,
  restoreLocalFonts,
  readFileAsArrayBuffer as readFontFileAsArrayBuffer,
  getFontMimeType,
} from './local-font-storage'
export type { LocalFontMeta } from './local-font-storage'
