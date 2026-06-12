/**
 * 本地字体持久化存储
 *
 * - IndexedDB: 存储字体文件二进制数据（无大小限制）
 * - localStorage: 存储字体元数据（名称、分类等）
 *
 * 刷新页面或重新访问后自动恢复已导入的字体。
 */

const DB_NAME = 'covercast-local-fonts'
const DB_VERSION = 1
const STORE_NAME = 'fonts'
const META_KEY = 'covercast:local-fonts-meta'

export interface LocalFontMeta {
  label: string
  family: string
  value: string
  category: string
  license: string
  group: string
  /** 字体文件的 MIME 类型 */
  mimeType: string
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

async function saveFontBlob(family: string, blob: ArrayBuffer): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(blob, family)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function getFontBlob(family: string): Promise<ArrayBuffer | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(family)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })
}

async function deleteFontBlob(family: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(family)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// ─── 元数据操作（localStorage） ───

function loadMeta(): LocalFontMeta[] {
  try {
    const raw = localStorage.getItem(META_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveMeta(list: LocalFontMeta[]): void {
  localStorage.setItem(META_KEY, JSON.stringify(list))
}

// ─── 公共 API ───

/** 获取所有已保存的字体元数据 */
export function getLocalFontMetas(): LocalFontMeta[] {
  return loadMeta()
}

/** 保存一个本地字体（元数据 + 文件二进制） */
export async function saveLocalFont(meta: LocalFontMeta, fileData: ArrayBuffer): Promise<void> {
  const metas = loadMeta()
  const idx = metas.findIndex((m) => m.family === meta.family)
  if (idx >= 0) {
    metas[idx] = meta
  } else {
    metas.push(meta)
  }
  saveMeta(metas)
  await saveFontBlob(meta.family, fileData)
}

/** 删除一个本地字体 */
export async function deleteLocalFont(family: string): Promise<void> {
  const metas = loadMeta().filter((m) => m.family !== family)
  saveMeta(metas)
  await deleteFontBlob(family)
}

/** 恢复所有本地字体（从 IndexedDB 读取文件并注册到 document.fonts） */
export async function restoreLocalFonts(): Promise<LocalFontMeta[]> {
  const metas = loadMeta()
  for (const meta of metas) {
    const blob = await getFontBlob(meta.family)
    if (!blob) {
      // 文件丢失，移除元数据
      await deleteLocalFont(meta.family)
      continue
    }
    try {
      const fontFace = new FontFace(meta.family, blob)
      const loaded = await fontFace.load()
      document.fonts.add(loaded)
    } catch {
      // 字体加载失败，移除
      await deleteLocalFont(meta.family)
    }
  }
  return loadMeta()
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

/** 根据 MIME 类型推断字体格式 */
export function getFontMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    ttf: 'font/ttf',
    otf: 'font/otf',
    woff2: 'font/woff2',
    woff: 'font/woff',
  }
  return map[ext ?? ''] ?? 'font/ttf'
}
