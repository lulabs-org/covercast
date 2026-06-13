/**
 * 本地图片素材持久化存储
 *
 * - IndexedDB: 存储图片二进制数据（无大小限制）
 * - localStorage: 存储图片元数据（文件名、MIME 等）
 *
 * 图片 src 使用 `local-asset:<id>` 协议标识，
 * 渲染时通过 useLocalAssets hook 转换为 blob: URL。
 */

const DB_NAME = 'covercast-local-assets'
const DB_VERSION = 1
const STORE_NAME = 'assets'
const META_KEY = 'covercast:local-assets-meta'

export interface LocalAssetMeta {
  /** 唯一标识，格式如 `asset-<timestamp>` */
  id: string
  /** 原始文件名 */
  name: string
  /** MIME 类型 */
  mime: string
  /** 文件大小（字节） */
  size: number
  /** 创建时间 ISO 字符串 */
  createdAt: string
}

/** 判断 src 是否为本地素材标识 */
export function isLocalAssetSrc(src: string): boolean {
  return src.startsWith('local-asset:')
}

/** 从本地素材 src 提取 id */
export function parseLocalAssetId(src: string): string | null {
  if (!isLocalAssetSrc(src)) return null
  return src.slice('local-asset:'.length)
}

/** 构造本地素材 src */
export function buildLocalAssetSrc(id: string): string {
  return `local-asset:${id}`
}

// ─── IndexedDB 操作 ───

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function saveAssetBlob(id: string, data: ArrayBuffer): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(data, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function getAssetBlob(id: string): Promise<ArrayBuffer | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(id)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })
}

async function deleteAssetBlob(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// ─── 元数据操作（localStorage） ───

function loadMeta(): LocalAssetMeta[] {
  try {
    const raw = localStorage.getItem(META_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveMeta(list: LocalAssetMeta[]): void {
  localStorage.setItem(META_KEY, JSON.stringify(list))
}

// ─── 公共 API ───

/** 获取所有已保存的素材元数据 */
export function getLocalAssetMetas(): LocalAssetMeta[] {
  return loadMeta()
}

/** 保存一个本地素材（元数据 + 文件二进制） */
export async function saveLocalAsset(meta: LocalAssetMeta, fileData: ArrayBuffer): Promise<void> {
  const metas = loadMeta()
  const idx = metas.findIndex((m) => m.id === meta.id)
  if (idx >= 0) {
    metas[idx] = meta
  } else {
    metas.push(meta)
  }
  saveMeta(metas)
  await saveAssetBlob(meta.id, fileData)
}

/** 删除一个本地素材 */
export async function deleteLocalAsset(id: string): Promise<void> {
  const metas = loadMeta().filter((m) => m.id !== id)
  saveMeta(metas)
  await deleteAssetBlob(id)
}

/** 读取素材二进制数据并创建 blob URL */
export async function getLocalAssetBlobUrl(id: string): Promise<string | null> {
  const buffer = await getAssetBlob(id)
  if (!buffer) return null

  const meta = loadMeta().find((m) => m.id === id)
  const mime = meta?.mime ?? 'image/png'
  const blob = new Blob([buffer], { type: mime })
  return URL.createObjectURL(blob)
}

/** 读取素材二进制数据并转为 data URL（用于导出） */
export async function getLocalAssetDataUrl(id: string): Promise<string | null> {
  const buffer = await getAssetBlob(id)
  if (!buffer) return null

  const meta = loadMeta().find((m) => m.id === id)
  const mime = meta?.mime ?? 'image/png'

  return new Promise((resolve, reject) => {
    const blob = new Blob([buffer], { type: mime })
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/** 将 File 对象读取为 ArrayBuffer */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

/** 校验文件类型是否支持 */
export function isSupportedImageType(file: File): boolean {
  return ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
}

/** 校验文件大小（8MB 限制） */
export function isWithinSizeLimit(file: File, maxBytes = 8 * 1024 * 1024): boolean {
  return file.size <= maxBytes
}
