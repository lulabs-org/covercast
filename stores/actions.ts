/**
 * 跨 Store 协调动作层。
 *
 * Store 只管自身状态，不直接调用其他 Store。
 * 需要跨 Store 协调的逻辑统一放在这里，由消费方（hooks/components）调用。
 */

import { cloneScene, type Scene } from '../lib/scene'
import { selectSingle } from '../lib/selection'
import { useSceneStore } from './useSceneStore'
import { useHistoryStore } from './useHistoryStore'
import { useCanvasStore } from './useCanvasStore'
import { useTemplateStore } from './useTemplateStore'
import type { CustomSceneTemplate } from './useTemplateStore'

// ────────────────────────────────────────────────
// Scene + History 协调
// ────────────────────────────────────────────────

/** 修改场景（带历史记录和模板标记） */
export function changeSceneWithHistory(updater: (scene: Scene) => Scene, description?: string) {
  if (description) {
    const currentScene = useSceneStore.getState().scene
    const { selection } = useSceneStore.getState()
    useHistoryStore.getState().pushPast({
      scene: cloneScene(currentScene),
      selectedIds: selection.selectedIds,
      description,
      timestamp: Date.now(),
    })
  }
  useSceneStore.getState().setScene(updater)
  markSceneEdited()
}

/** 标记场景已编辑（清除内置模板激活状态） */
export function markSceneEdited() {
  const templateStore = useTemplateStore.getState()
  const activeCustom = templateStore.getActiveCustomTemplate()
  if (activeCustom) return
  const activeBuiltIn = templateStore.getActiveBuiltInTemplate()
  if (activeBuiltIn) {
    templateStore.setActiveTemplateId('')
  }
}

// ────────────────────────────────────────────────
// History 协调（undo/redo 需要读写 Scene + 写 Canvas status）
// ────────────────────────────────────────────────

/** 撤销 */
export function undoAction() {
  const previous = useHistoryStore.getState().undoShift()
  if (!previous) {
    useCanvasStore.getState().setStatus('没有可撤销的操作')
    return
  }

  const { scene, selection } = useSceneStore.getState()
  useHistoryStore.getState().pushFuture({
    scene: cloneScene(scene),
    selectedIds: selection.selectedIds,
    description: '当前状态',
    timestamp: Date.now(),
  })

  useSceneStore.getState().setScene(previous.scene)
  useSceneStore.getState().setSelection((prev) => ({
    ...prev,
    selectedIds: previous.selectedIds,
  }))
  useCanvasStore.getState().setStatus(`已撤销：${previous.description}`)
}

/** 重做 */
export function redoAction() {
  const next = useHistoryStore.getState().redoShift()
  if (!next) {
    useCanvasStore.getState().setStatus('没有可重做的操作')
    return
  }

  const { scene, selection } = useSceneStore.getState()
  useHistoryStore.getState().pushPast({
    scene: cloneScene(scene),
    selectedIds: selection.selectedIds,
    description: '当前状态',
    timestamp: Date.now(),
  })

  useSceneStore.getState().setScene(next.scene)
  useSceneStore.getState().setSelection((prev) => ({
    ...prev,
    selectedIds: next.selectedIds,
  }))
  useCanvasStore.getState().setStatus(`已重做：${next.description}`)
}

// ────────────────────────────────────────────────
// Template 协调（模板操作需要读写 Scene + 写 Canvas status）
// ────────────────────────────────────────────────

/** 套用模板到当前画布 */
export function applyTemplateAction(template: { id: string; name: string; scene: Scene }) {
  const nextScene = cloneScene(template.scene)
  useSceneStore.getState().setScene(nextScene)
  if (nextScene.elements[0]?.id) {
    useSceneStore.getState().setSelection((prev) => selectSingle(prev, nextScene.elements[0].id))
  }
  useTemplateStore.getState().setActiveTemplateId(template.id)

  const { templateSlots } = useTemplateStore.getState()
  const templateSlot = templateSlots.find((s) => s.templateId === template.id)
  useTemplateStore.getState().setActiveSlotId(templateSlot ? templateSlot.slotId : 'default')

  useCanvasStore.getState().setStatus(`已套用「${template.name}」到当前画布`)
}

/** 保存当前场景为自定义模板 */
export function saveCustomTemplateWithNameAction(name: string) {
  const { customTemplates } = useTemplateStore.getState()
  const timestamp = new Date().toISOString()
  const templateName = name.trim() || `自定义模板 ${customTemplates.length + 1}`
  const template: CustomSceneTemplate = {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: templateName,
    createdAt: timestamp,
    updatedAt: timestamp,
    scene: cloneScene(useSceneStore.getState().scene),
  }
  const nextTemplates = [template, ...customTemplates]
  try {
    useTemplateStore.getState().setCustomTemplates(nextTemplates)
    useTemplateStore.getState().setActiveTemplateId(template.id)
    useCanvasStore.getState().setStatus(`已保存「${template.name}」到浏览器缓存`)
  } catch {
    useCanvasStore.getState().setStatus('自定义模板保存失败，浏览器缓存空间可能不足')
  }
}

/** 保存指定场景为自定义模板 */
export function saveCustomTemplateWithSceneAction(name: string, sceneToSave: Scene) {
  const { customTemplates } = useTemplateStore.getState()
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
    useTemplateStore.getState().setCustomTemplates(nextTemplates)
    useTemplateStore.getState().setActiveTemplateId(template.id)
    useCanvasStore.getState().setStatus(`已创建「${template.name}」`)
  } catch {
    useCanvasStore.getState().setStatus('自定义模板保存失败，浏览器缓存空间可能不足')
  }
}

/** 覆盖保存当前自定义模板 */
export function saveActiveCustomTemplateAction() {
  const templateStore = useTemplateStore.getState()
  const activeCustom = templateStore.getActiveCustomTemplate()
  if (!activeCustom) {
    useCanvasStore.getState().setStatus('当前不是自定义模板，请另存为新模板')
    return
  }
  const updated: CustomSceneTemplate = {
    ...activeCustom,
    updatedAt: new Date().toISOString(),
    scene: cloneScene(useSceneStore.getState().scene),
  }
  const nextTemplates = templateStore.customTemplates.map((t) =>
    t.id === activeCustom.id ? updated : t,
  )
  try {
    templateStore.setCustomTemplates(nextTemplates)
    templateStore.setActiveTemplateId(updated.id)
    useCanvasStore.getState().setStatus(`已保存「${updated.name}」的修改`)
  } catch {
    useCanvasStore.getState().setStatus('模板保存失败，浏览器缓存空间可能不足')
  }
}

/** 导出模板 JSON */
export function exportTemplateJsonAction() {
  const templateStore = useTemplateStore.getState()
  const activeTemplate = templateStore.getActiveTemplate()
  const scene = useSceneStore.getState().scene
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
  useCanvasStore.getState().setStatus(`模板 JSON 已导出：${payload.template.name}`)
}

/** 导入模板 JSON 文件 */
export async function importTemplateFileAction(file: File) {
  const isJsonFile = file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')
  if (!isJsonFile) {
    useCanvasStore.getState().setStatus('导入失败，仅支持 JSON 文件')
    return
  }
  useCanvasStore.getState().setStatus('正在导入模板 JSON...')
  try {
    const parsedValue = JSON.parse(await file.text()) as unknown

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

    const { customTemplates } = useTemplateStore.getState()
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
    useTemplateStore.getState().setCustomTemplates(nextTemplates)
    useTemplateStore.getState().setActiveTemplateId(imported.id)
    useTemplateStore.getState().setActiveSlotId('default')
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
}
