import { isScene, isRecord } from '@/lib/domain/scene'
import type { Scene } from '@/lib/domain/scene'
import type { CustomSceneTemplate } from '@/stores/useTemplateStore'

const CUSTOM_TEMPLATE_STORAGE_KEY = 'covercast.customTemplates.v1'
const SLOT_NAMES_STORAGE_KEY = 'covercast.slotNames.v1'

// ── localStorage: Custom templates ──

export function readCustomTemplatesFromStorage(): CustomSceneTemplate[] {
  try {
    const rawValue = window.localStorage.getItem(CUSTOM_TEMPLATE_STORAGE_KEY)
    if (!rawValue) return []
    const parsedValue = JSON.parse(rawValue) as unknown
    if (!Array.isArray(parsedValue)) return []
    return parsedValue.filter(
      (t): t is CustomSceneTemplate =>
        isRecord(t) &&
        isScene(t.scene) &&
        typeof t.id === 'string' &&
        typeof t.name === 'string' &&
        typeof t.createdAt === 'string',
    )
  } catch {
    return []
  }
}

export function writeCustomTemplatesToStorage(templates: CustomSceneTemplate[]): void {
  window.localStorage.setItem(CUSTOM_TEMPLATE_STORAGE_KEY, JSON.stringify(templates))
}

// ── localStorage: Slot names ──

export function readSlotNamesFromStorage(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(SLOT_NAMES_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

export function writeSlotNameToStorage(templateId: string, slotId: string, name: string): void {
  const names = readSlotNamesFromStorage()
  names[`${templateId}/${slotId}`] = name
  window.localStorage.setItem(SLOT_NAMES_STORAGE_KEY, JSON.stringify(names))
}

export function removeSlotNameFromStorage(templateId: string, slotId: string): void {
  const names = readSlotNamesFromStorage()
  delete names[`${templateId}/${slotId}`]
  window.localStorage.setItem(SLOT_NAMES_STORAGE_KEY, JSON.stringify(names))
}

// ── API: Slots ──

export type SlotListEntry = { templateId: string; slots: string[] }

export async function fetchSlotList(): Promise<SlotListEntry[]> {
  const response = await fetch('/api/scene?list=1', { cache: 'no-store' })
  if (!response.ok) return []
  return (await response.json()) as SlotListEntry[]
}

export async function createSlot(
  templateId: string,
  slotId: string,
  scene: Scene,
): Promise<boolean> {
  const response = await fetch('/api/scene', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ templateId, slotId, scene }),
  })
  return response.ok
}

export async function deleteSlot(templateId: string, slotId: string): Promise<boolean> {
  const response = await fetch('/api/scene', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ templateId, slotId }),
  })
  return response.ok
}
