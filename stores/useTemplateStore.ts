import { StateCreator } from 'zustand'
import { cloneScene, type Scene } from '@/lib/domain/scene'
import { BUILT_IN_TEMPLATES, DEFAULT_TEMPLATE_ID, createDefaultScene } from '@/lib/templates'
import { selectSingle } from '@/lib/domain/selection'
import type { EditorStore } from './useEditorStore'

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

  // Cross-slice actions (from actions.ts)
  applyTemplateAction: (template: { id: string; name: string; scene: Scene }) => void
  saveCustomTemplateWithNameAction: (name: string) => void
  saveCustomTemplateWithSceneAction: (name: string, sceneToSave: Scene) => void
  saveActiveCustomTemplateAction: () => void
  exportTemplateJsonAction: () => void
  importTemplateFileAction: (file: File) => Promise<void>
}

export const createTemplateSlice: StateCreator<EditorStore, [], [], TemplateSlice> = (
  set,
  get,
) => ({
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

  // ── Cross-slice actions (from actions.ts) ──

  applyTemplateAction: (template) => {
    const nextScene = cloneScene(template.scene)
    const { templateSlots } = get()
    const templateSlot = templateSlots.find((s) => s.templateId === template.id)
    set({
      scene: nextScene,
      selection: nextScene.elements[0]?.id
        ? selectSingle(get().selection, nextScene.elements[0].id)
        : get().selection,
      activeTemplateId: template.id,
      activeSlotId: templateSlot ? templateSlot.slotId : 'default',
      status: `已套用「${template.name}」到当前画布`,
    })
  },

  saveCustomTemplateWithNameAction: (name) => {
    const { customTemplates, scene } = get()
    const timestamp = new Date().toISOString()
    const templateName = name.trim() || `自定义模板 ${customTemplates.length + 1}`
    const template: CustomSceneTemplate = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: templateName,
      createdAt: timestamp,
      updatedAt: timestamp,
      scene: cloneScene(scene),
    }
    const nextTemplates = [template, ...customTemplates]
    try {
      get().setCustomTemplates(nextTemplates)
      set({ activeTemplateId: template.id, status: `已保存「${template.name}」到浏览器缓存` })
    } catch {
      set({ status: '自定义模板保存失败，浏览器缓存空间可能不足' })
    }
  },

  saveCustomTemplateWithSceneAction: (name, sceneToSave) => {
    const { customTemplates } = get()
    const timestamp = new Date().toISOString()
    const templateName = name.trim() || `自定义模板 ${customTemplates.length + 1}`
    const template: CustomSceneTemplate = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: templateName,
      createdAt: timestamp,
      updatedAt: timestamp,
      scene: cloneScene(sceneToSave),
    }
    const nextTemplates = [template, ...customTemplates]
    try {
      get().setCustomTemplates(nextTemplates)
      set({ activeTemplateId: template.id, status: `已创建「${template.name}」` })
    } catch {
      set({ status: '自定义模板保存失败，浏览器缓存空间可能不足' })
    }
  },

  saveActiveCustomTemplateAction: () => {
    const activeCustom = get().getActiveCustomTemplate()
    if (!activeCustom) {
      set({ status: '当前不是自定义模板，请另存为新模板' })
      return
    }
    const { scene, customTemplates } = get()
    const updated: CustomSceneTemplate = {
      ...activeCustom,
      updatedAt: new Date().toISOString(),
      scene: cloneScene(scene),
    }
    const nextTemplates = customTemplates.map((t) => (t.id === activeCustom.id ? updated : t))
    try {
      get().setCustomTemplates(nextTemplates)
      set({ activeTemplateId: updated.id, status: `已保存「${updated.name}」的修改` })
    } catch {
      set({ status: '模板保存失败，浏览器缓存空间可能不足' })
    }
  },

  exportTemplateJsonAction: () => {
    const activeTemplate = get().getActiveTemplate()
    const { scene } = get()
    const timestamp = new Date().toISOString()
    const payload = {
      format: 'covercast.template' as const,
      version: 1,
      template: {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: activeTemplate?.name ?? '自定义场景',
        createdAt: timestamp,
        updatedAt: timestamp,
        scene: cloneScene(scene),
      },
    }
    const filename = `covercast-template-${new Date().toISOString().slice(0, 10)}.json`
    const json = JSON.stringify(payload, null, 2)
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    const objectUrl = URL.createObjectURL(blob)
    const download = document.createElement('a')
    download.href = objectUrl
    download.download = filename
    document.body.appendChild(download)
    download.click()
    download.remove()
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
    set({ status: `模板 JSON 已导出：${payload.template.name}` })
  },

  importTemplateFileAction: async (file) => {
    const isJsonFile = file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')
    if (!isJsonFile) {
      set({ status: '导入失败，仅支持 JSON 文件' })
      return
    }
    set({ status: '正在导入模板 JSON...' })
    try {
      const parsedValue = JSON.parse(await file.text()) as unknown

      if (
        !isRecord(parsedValue) ||
        parsedValue.format !== 'covercast.template' ||
        parsedValue.version !== 1
      ) {
        set({ status: '导入失败，请选择 Covercast 导出的模板 JSON' })
        return
      }
      const tpl = parsedValue.template as unknown
      if (
        !isRecord(tpl) ||
        !isScene(tpl.scene) ||
        typeof tpl.id !== 'string' ||
        typeof tpl.name !== 'string' ||
        typeof tpl.createdAt !== 'string'
      ) {
        set({ status: '导入失败，请选择 Covercast 导出的模板 JSON' })
        return
      }

      const { customTemplates } = get()
      const baseName = (tpl.name as string).trim() || '导入模板'
      const existingNames = new Set(customTemplates.map((t) => t.name))
      let name = baseName
      let suffix = 2
      while (existingNames.has(name)) {
        name = `${baseName} ${suffix}`
        suffix++
      }

      const imported: CustomSceneTemplate = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        scene: cloneScene(tpl.scene as Scene),
      }
      const nextTemplates = [imported, ...customTemplates]
      get().setCustomTemplates(nextTemplates)
      set({
        activeTemplateId: imported.id,
        activeSlotId: 'default',
        scene: cloneScene(imported.scene),
        selection: imported.scene.elements[0]?.id
          ? selectSingle(get().selection, imported.scene.elements[0].id)
          : get().selection,
        status: `已导入模板「${imported.name}」`,
      })
    } catch {
      set({ status: '导入失败，请检查 JSON 文件内容或浏览器缓存空间' })
    }
  },
})
