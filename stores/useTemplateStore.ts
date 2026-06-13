import { create } from 'zustand'
import {
  BUILT_IN_TEMPLATES,
  DEFAULT_TEMPLATE_ID,
  cloneScene,
  createDefaultScene,
  type Scene,
} from '../lib/scene'
import { selectSingle } from '../lib/selection'
import { useSceneStore } from './useSceneStore'
import { useCanvasStore } from './useCanvasStore'

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

type TemplateExportPayload = {
  format: 'covercast.template'
  version: 1
  template: CustomSceneTemplate
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

function createTemplateExportPayload(name: string, scene: Scene): TemplateExportPayload {
  const timestamp = new Date().toISOString()
  return {
    format: 'covercast.template',
    version: 1,
    template: {
      id: createCustomTemplateId(),
      name: name.trim() || '自定义场景',
      createdAt: timestamp,
      updatedAt: timestamp,
      scene: cloneScene(scene),
    },
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob)
  const download = document.createElement('a')
  download.href = objectUrl
  download.download = filename
  document.body.appendChild(download)
  download.click()
  download.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}

type TemplateStoreState = {
  // Templates
  customTemplates: CustomSceneTemplate[]
  activeTemplateId: string
  setActiveTemplateId: (id: string) => void

  // Computed helpers
  getActiveBuiltInTemplate: () => (typeof BUILT_IN_TEMPLATES)[number] | null
  getActiveCustomTemplate: () => CustomSceneTemplate | null
  getActiveTemplate: () => (typeof BUILT_IN_TEMPLATES)[number] | CustomSceneTemplate | null
  getHasUnsavedChanges: () => boolean

  // Template actions
  applyTemplate: (template: { id: string; name: string; scene: Scene }) => void
  applyBuiltInTemplate: (templateId: string) => void
  saveCustomTemplateWithName: (name: string) => void
  saveCustomTemplateWithScene: (name: string, sceneToSave: Scene) => void
  saveActiveCustomTemplate: () => void
  deleteCustomTemplate: (templateId: string) => void
  duplicateCustomTemplate: (templateId: string) => void
  renameCustomTemplate: (templateId: string, newName: string) => void
  exportTemplateJson: () => void
  importTemplateFile: (file: File) => Promise<void>

  // Slots
  templateSlots: SceneSlotInfo[]
  activeSlotId: string
  setActiveSlotId: (slotId: string) => void
  setTemplateSlots: (
    updater: SceneSlotInfo[] | ((prev: SceneSlotInfo[]) => SceneSlotInfo[]),
  ) => void
  addSlot: (templateId: string) => Promise<void>
  removeSlot: (templateId: string, slotId: string) => Promise<void>
  selectSlotForEditing: (slotId: string) => void
  getSlotUrl: (templateId: string, slotId: string) => string
  writeSlotNameToStorage: (templateId: string, slotId: string, name: string) => void

  // Init
  initFromStorage: () => void
  loadSlots: () => Promise<void>
}

export const useTemplateStore = create<TemplateStoreState>((set, get) => ({
  customTemplates: [],
  activeTemplateId: DEFAULT_TEMPLATE_ID,
  setActiveTemplateId: (id) => set({ activeTemplateId: id }),

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

  getHasUnsavedChanges: () => {
    const activeCustom = get().getActiveCustomTemplate()
    if (!activeCustom) return false
    return !scenesMatch(activeCustom.scene, useSceneStore.getState().scene)
  },

  applyTemplate: (template) => {
    const nextScene = cloneScene(template.scene)
    useSceneStore.getState().setScene(nextScene)
    if (nextScene.elements[0]?.id) {
      useSceneStore.getState().setSelection((prev) => selectSingle(prev, nextScene.elements[0].id))
    }
    set({ activeTemplateId: template.id })

    const { templateSlots } = get()
    const templateSlot = templateSlots.find((s) => s.templateId === template.id)
    if (templateSlot) {
      set({ activeSlotId: templateSlot.slotId })
    } else {
      set({ activeSlotId: 'default' })
    }

    useCanvasStore.getState().setStatus(`已套用「${template.name}」到当前画布`)
  },

  applyBuiltInTemplate: (templateId) => {
    const template = BUILT_IN_TEMPLATES.find((t) => t.id === templateId)
    if (template) get().applyTemplate(template)
  },

  saveCustomTemplateWithName: (name) => {
    const { customTemplates } = get()
    const timestamp = new Date().toISOString()
    const templateName = name.trim() || `自定义模板 ${customTemplates.length + 1}`
    const template: CustomSceneTemplate = {
      id: createCustomTemplateId(),
      name: templateName,
      createdAt: timestamp,
      updatedAt: timestamp,
      scene: cloneScene(useSceneStore.getState().scene),
    }
    const nextTemplates = [template, ...customTemplates]
    try {
      writeCustomTemplatesToStorage(nextTemplates)
      set({ customTemplates: nextTemplates, activeTemplateId: template.id })
      useCanvasStore.getState().setStatus(`已保存「${template.name}」到浏览器缓存`)
    } catch {
      useCanvasStore.getState().setStatus('自定义模板保存失败，浏览器缓存空间可能不足')
    }
  },

  saveCustomTemplateWithScene: (name, sceneToSave) => {
    const { customTemplates } = get()
    const timestamp = new Date().toISOString()
    const templateName = name.trim() || `自定义模板 ${customTemplates.length + 1}`
    const template: CustomSceneTemplate = {
      id: createCustomTemplateId(),
      name: templateName,
      createdAt: timestamp,
      updatedAt: timestamp,
      scene: cloneScene(sceneToSave),
    }
    const nextTemplates = [template, ...customTemplates]
    try {
      writeCustomTemplatesToStorage(nextTemplates)
      set({ customTemplates: nextTemplates, activeTemplateId: template.id })
      useCanvasStore.getState().setStatus(`已创建「${template.name}」`)
    } catch {
      useCanvasStore.getState().setStatus('自定义模板保存失败，浏览器缓存空间可能不足')
    }
  },

  saveActiveCustomTemplate: () => {
    const activeCustom = get().getActiveCustomTemplate()
    const { customTemplates } = get()
    if (!activeCustom) {
      useCanvasStore.getState().setStatus('当前不是自定义模板，请另存为新模板')
      return
    }
    const updated: CustomSceneTemplate = {
      ...activeCustom,
      updatedAt: new Date().toISOString(),
      scene: cloneScene(useSceneStore.getState().scene),
    }
    const nextTemplates = customTemplates.map((t) => (t.id === activeCustom.id ? updated : t))
    try {
      writeCustomTemplatesToStorage(nextTemplates)
      set({ customTemplates: nextTemplates, activeTemplateId: updated.id })
      useCanvasStore.getState().setStatus(`已保存「${updated.name}」的修改`)
    } catch {
      useCanvasStore.getState().setStatus('模板保存失败，浏览器缓存空间可能不足')
    }
  },

  deleteCustomTemplate: (templateId) => {
    const { customTemplates, activeTemplateId } = get()
    const nextTemplates = customTemplates.filter((t) => t.id !== templateId)
    try {
      writeCustomTemplatesToStorage(nextTemplates)
      set({ customTemplates: nextTemplates })
      if (activeTemplateId === templateId) set({ activeTemplateId: '' })
      useCanvasStore.getState().setStatus('已删除自定义模板')
    } catch {
      useCanvasStore.getState().setStatus('自定义模板删除失败，请检查浏览器缓存权限')
    }
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
    try {
      writeCustomTemplatesToStorage(nextTemplates)
      set({ customTemplates: nextTemplates })
      useCanvasStore.getState().setStatus(`已创建副本「${duplicated.name}」`)
    } catch {
      useCanvasStore.getState().setStatus('创建副本失败，浏览器缓存空间可能不足')
    }
  },

  renameCustomTemplate: (templateId, newName) => {
    const { customTemplates } = get()
    const template = customTemplates.find((t) => t.id === templateId)
    if (!template) return
    const trimmedName = newName.trim()
    if (!trimmedName) {
      useCanvasStore.getState().setStatus('模板名称不能为空')
      return
    }
    const updated: CustomSceneTemplate = {
      ...template,
      name: trimmedName,
      updatedAt: new Date().toISOString(),
    }
    const nextTemplates = customTemplates.map((t) => (t.id === templateId ? updated : t))
    try {
      writeCustomTemplatesToStorage(nextTemplates)
      set({ customTemplates: nextTemplates })
      useCanvasStore.getState().setStatus(`已重命名为「${trimmedName}」`)
    } catch {
      useCanvasStore.getState().setStatus('重命名失败，请检查浏览器缓存权限')
    }
  },

  exportTemplateJson: () => {
    const activeTemplate = get().getActiveTemplate()
    const payload = createTemplateExportPayload(
      activeTemplate?.name ?? '自定义场景',
      useSceneStore.getState().scene,
    )
    const filename = `covercast-template-${new Date().toISOString().slice(0, 10)}.json`
    const json = JSON.stringify(payload, null, 2)
    downloadBlob(new Blob([json], { type: 'application/json;charset=utf-8' }), filename)
    useCanvasStore.getState().setStatus(`模板 JSON 已导出：${payload.template.name}`)
  },

  importTemplateFile: async (file) => {
    const isJsonFile = file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')
    if (!isJsonFile) {
      useCanvasStore.getState().setStatus('导入失败，仅支持 JSON 文件')
      return
    }
    useCanvasStore.getState().setStatus('正在导入模板 JSON...')
    try {
      const parsedValue = JSON.parse(await file.text()) as unknown
      if (
        !isRecord(parsedValue) ||
        parsedValue.format !== 'covercast.template' ||
        parsedValue.version !== 1
      ) {
        useCanvasStore.getState().setStatus('导入失败，请选择 Covercast 导出的模板 JSON')
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
        useCanvasStore.getState().setStatus('导入失败，请选择 Covercast 导出的模板 JSON')
        return
      }
      const { customTemplates } = get()
      const imported: CustomSceneTemplate = {
        id: createCustomTemplateId(),
        name: uniqueTemplateName(tpl.name as string, customTemplates),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        scene: cloneScene(tpl.scene as Scene),
      }
      const nextTemplates = [imported, ...customTemplates]
      writeCustomTemplatesToStorage(nextTemplates)
      set({
        customTemplates: nextTemplates,
        activeTemplateId: imported.id,
        activeSlotId: 'default',
      })
      useSceneStore.getState().setScene(cloneScene(imported.scene))
      if (imported.scene.elements[0]?.id) {
        useSceneStore
          .getState()
          .setSelection((prev) => selectSingle(prev, imported.scene.elements[0].id))
      }
      useCanvasStore.getState().setStatus(`已导入模板「${imported.name}」`)
    } catch {
      useCanvasStore.getState().setStatus('导入失败，请检查 JSON 文件内容或浏览器缓存空间')
    }
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
      useCanvasStore.getState().setStatus(`已创建浏览器源「${name}」`)
    } catch {
      useCanvasStore.getState().setStatus('创建浏览器源失败')
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
      }
    } catch {
      useCanvasStore.getState().setStatus('删除浏览器源失败')
    }
  },

  selectSlotForEditing: (slotId) => set({ activeSlotId: slotId }),

  getSlotUrl: (templateId, slotId) => {
    const origin = useCanvasStore.getState().appOrigin || ''
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
