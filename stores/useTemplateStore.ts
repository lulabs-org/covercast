import { create } from 'zustand'
import { cloneScene, type Scene } from '@/lib/domain/scene'
import { BUILT_IN_TEMPLATES, DEFAULT_TEMPLATE_ID, createDefaultScene } from '@/lib/templates'
import { selectSingle } from '@/lib/domain/selection'

const CUSTOM_TEMPLATE_STORAGE_KEY = 'covercast.customTemplates.v1'
const SLOT_NAMES_STORAGE_KEY = 'covercast.slotNames.v1'

export type CustomSceneTemplate = {
  id: string
  name: string
  createdAt: string
  updatedAt?: string
  scene: Scene
}

export type SceneSlotInfo = {
  templateId: string
  slotId: string
  name: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function isScene(value: unknown): value is Scene {
  if (!isRecord(value)) return false
  return (
    value.version === 1 &&
    typeof value.backgroundColor === 'string' &&
    typeof value.backgroundOpacity === 'number' &&
    Array.isArray(value.elements)
  )
}

function readCustomTemplatesFromStorage(): CustomSceneTemplate[] {
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

function writeCustomTemplatesToStorage(templates: CustomSceneTemplate[]) {
  window.localStorage.setItem(CUSTOM_TEMPLATE_STORAGE_KEY, JSON.stringify(templates))
}

function readSlotNamesFromStorage(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(SLOT_NAMES_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

function writeSlotNameToStorageFn(templateId: string, slotId: string, name: string) {
  const names = readSlotNamesFromStorage()
  names[`${templateId}/${slotId}`] = name
  window.localStorage.setItem(SLOT_NAMES_STORAGE_KEY, JSON.stringify(names))
}

function removeSlotNameFromStorage(templateId: string, slotId: string) {
  const names = readSlotNamesFromStorage()
  delete names[`${templateId}/${slotId}`]
  window.localStorage.setItem(SLOT_NAMES_STORAGE_KEY, JSON.stringify(names))
}

function createCustomTemplateId() {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function uniqueTemplateName(name: string, templates: CustomSceneTemplate[]) {
  const baseName = name.trim() || '导入模板'
  const existingNames = new Set(templates.map((t) => t.name))
  if (!existingNames.has(baseName)) return baseName
  let suffix = 2
  let candidate = `${baseName} ${suffix}`
  while (existingNames.has(candidate)) {
    suffix++
    candidate = `${baseName} ${suffix}`
  }
  return candidate
}

function scenesMatch(left: Scene, right: Scene) {
  return JSON.stringify(left) === JSON.stringify(right)
}

export type TemplateSlice = {
  // Templates
  customTemplates: CustomSceneTemplate[]
  activeTemplateId: string
  setActiveTemplateId: (id: string) => void
  setCustomTemplates: (templates: CustomSceneTemplate[]) => void

  // Computed helpers
  getActiveBuiltInTemplate: () => (typeof BUILT_IN_TEMPLATES)[number] | null
  getActiveCustomTemplate: () => CustomSceneTemplate | null
  getActiveTemplate: () => (typeof BUILT_IN_TEMPLATES)[number] | CustomSceneTemplate | null
  getHasUnsavedChanges: (currentScene: Scene) => boolean

  // Pure template state actions
  deleteCustomTemplate: (templateId: string) => void
  duplicateCustomTemplate: (templateId: string) => void
  renameCustomTemplate: (templateId: string, newName: string) => string | null

  // Slots
  templateSlots: SceneSlotInfo[]
  activeSlotId: string
  setActiveSlotId: (slotId: string) => void
  setTemplateSlots: (
    updater: SceneSlotInfo[] | ((prev: SceneSlotInfo[]) => SceneSlotInfo[]),
  ) => void
  addSlot: (templateId: string) => Promise<string | null>
  removeSlot: (templateId: string, slotId: string) => Promise<boolean>
  selectSlotForEditing: (slotId: string) => void
  getSlotUrl: (templateId: string, slotId: string, appOrigin: string) => string
  writeSlotNameToStorage: (templateId: string, slotId: string, name: string) => void

  // Init
  initFromStorage: () => void
  loadSlots: () => Promise<void>
}

export const useTemplateStore = create<TemplateSlice>()((set, get) => ({
  customTemplates: [],
  activeTemplateId: DEFAULT_TEMPLATE_ID,
  setActiveTemplateId: (id) => set({ activeTemplateId: id }),
  setCustomTemplates: (templates) => {
    writeCustomTemplatesToStorage(templates)
    set({ customTemplates: templates })
  },

  getActiveBuiltInTemplate: () => {
    const { activeTemplateId } = get()
    return BUILT_IN_TEMPLATES.find((t) => t.id === activeTemplateId) ?? null
  },

  getActiveCustomTemplate: () => {
    const { activeTemplateId, customTemplates } = get()
    return customTemplates.find((t) => t.id === activeTemplateId) ?? null
  },

  getActiveTemplate: () => {
    return get().getActiveBuiltInTemplate() ?? get().getActiveCustomTemplate()
  },

  getHasUnsavedChanges: (currentScene: Scene) => {
    const activeCustom = get().getActiveCustomTemplate()
    if (!activeCustom) return false
    return !scenesMatch(activeCustom.scene, currentScene)
  },

  deleteCustomTemplate: (templateId) => {
    const { customTemplates, activeTemplateId } = get()
    const nextTemplates = customTemplates.filter((t) => t.id !== templateId)
    writeCustomTemplatesToStorage(nextTemplates)
    const updates: Partial<TemplateSlice> = { customTemplates: nextTemplates }
    if (activeTemplateId === templateId) updates.activeTemplateId = ''
    set(updates)
  },

  duplicateCustomTemplate: (templateId) => {
    const { customTemplates } = get()
    const template = customTemplates.find((t) => t.id === templateId)
    if (!template) return
    const timestamp = new Date().toISOString()
    const duplicated: CustomSceneTemplate = {
      id: createCustomTemplateId(),
      name: uniqueTemplateName(`${template.name} 副本`, customTemplates),
      createdAt: timestamp,
      updatedAt: timestamp,
      scene: cloneScene(template.scene),
    }
    const nextTemplates = [duplicated, ...customTemplates]
    writeCustomTemplatesToStorage(nextTemplates)
    set({ customTemplates: nextTemplates })
  },

  renameCustomTemplate: (templateId, newName) => {
    const { customTemplates } = get()
    const template = customTemplates.find((t) => t.id === templateId)
    if (!template) return '模板不存在'
    const trimmedName = newName.trim()
    if (!trimmedName) return '模板名称不能为空'
    const updated: CustomSceneTemplate = {
      ...template,
      name: trimmedName,
      updatedAt: new Date().toISOString(),
    }
    const nextTemplates = customTemplates.map((t) => (t.id === templateId ? updated : t))
    writeCustomTemplatesToStorage(nextTemplates)
    set({ customTemplates: nextTemplates })
    return null
  },

  // Slots
  templateSlots: [],
  activeSlotId: 'default',
  setActiveSlotId: (slotId) => set({ activeSlotId: slotId }),

  setTemplateSlots: (updater) => {
    if (typeof updater === 'function') {
      set((s) => ({ templateSlots: updater(s.templateSlots) }))
    } else {
      set({ templateSlots: updater })
    }
  },

  addSlot: async (templateId) => {
    const { templateSlots, customTemplates } = get()
    const slotId = `slot-${Date.now()}`
    const template =
      BUILT_IN_TEMPLATES.find((t) => t.id === templateId) ??
      customTemplates.find((t) => t.id === templateId)
    const defaultScene = template?.scene ?? createDefaultScene()
    try {
      await fetch('/api/scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, slotId, scene: defaultScene }),
      })
      const templateName = template?.name ?? '未命名模板'
      const name = `${templateName} - 源 ${templateSlots.length + 1}`
      writeSlotNameToStorageFn(templateId, slotId, name)
      const newSlot: SceneSlotInfo = { templateId, slotId, name }
      set((s) => ({ templateSlots: [...s.templateSlots, newSlot], activeSlotId: slotId }))
      return name
    } catch {
      return null
    }
  },

  removeSlot: async (templateId, slotId) => {
    const { activeSlotId, templateSlots } = get()
    removeSlotNameFromStorage(templateId, slotId)
    try {
      const response = await fetch('/api/scene', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, slotId }),
      })
      if (response.ok) {
        set((s) => ({
          templateSlots: s.templateSlots.filter(
            (slot) => !(slot.templateId === templateId && slot.slotId === slotId),
          ),
        }))
        if (activeSlotId === slotId) {
          const remaining = templateSlots.filter(
            (s) => !(s.templateId === templateId && s.slotId === slotId),
          )
          set({ activeSlotId: remaining[0]?.slotId ?? 'default' })
        }
        return true
      }
      return false
    } catch {
      return false
    }
  },

  selectSlotForEditing: (slotId) => set({ activeSlotId: slotId }),

  getSlotUrl: (templateId, slotId, appOrigin) => {
    const origin = appOrigin || ''
    return `${origin}/live?t=${encodeURIComponent(templateId)}&s=${encodeURIComponent(slotId)}`
  },

  writeSlotNameToStorage: (templateId, slotId, name) => {
    writeSlotNameToStorageFn(templateId, slotId, name)
  },

  initFromStorage: () => {
    set({ customTemplates: readCustomTemplatesFromStorage() })
  },

  loadSlots: async () => {
    try {
      const response = await fetch('/api/scene?list=1', { cache: 'no-store' })
      if (!response.ok) return
      const allSlots = (await response.json()) as { templateId: string; slots: string[] }[]
      const slotNames = readSlotNamesFromStorage()
      const currentSlots: SceneSlotInfo[] = []
      for (const entry of allSlots) {
        for (const slotId of entry.slots) {
          currentSlots.push({
            templateId: entry.templateId,
            slotId,
            name: slotNames[`${entry.templateId}/${slotId}`] ?? slotId,
          })
        }
      }
      set({ templateSlots: currentSlots })
    } catch {}
  },
}))

export { cloneScene }
