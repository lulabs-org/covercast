import { useState, useEffect } from 'react'
import { BUILT_IN_TEMPLATES, DEFAULT_TEMPLATE_ID, cloneScene, type Scene } from '../lib/scene'
import { selectSingle, type SelectionState } from '../lib/selection'
import {
  readCustomTemplatesFromStorage,
  writeCustomTemplatesToStorage,
  createCustomTemplate,
  updateCustomTemplate,
  duplicateCustomTemplate as duplicateTemplate,
  createTemplateExportPayload,
  normalizeTemplateExportPayload,
  type CustomSceneTemplate,
} from '../services/templateService'

type SceneSlotInfo = {
  templateId: string
  slotId: string
  name: string
}

function scenesMatch(left: Scene, right: Scene) {
  return JSON.stringify(left) === JSON.stringify(right)
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

type UseTemplateManagerOptions = {
  scene: Scene
  selection: SelectionState
  setScene: (scene: Scene) => void
  setSelection: (value: SelectionState | ((prev: SelectionState) => SelectionState)) => void
  setStatus: (status: string) => void
  templateSlots: SceneSlotInfo[]
  setActiveSlotId: (slotId: string) => void
}

export function useTemplateManager(options: UseTemplateManagerOptions) {
  const { scene, selection, setScene, setSelection, setStatus, templateSlots, setActiveSlotId } =
    options

  const [customTemplates, setCustomTemplates] = useState<CustomSceneTemplate[]>([])
  const [customTemplateName, setCustomTemplateName] = useState('')
  const [activeTemplateId, setActiveTemplateId] = useState<string>(DEFAULT_TEMPLATE_ID)
  const [showTemplateForm, setShowTemplateForm] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCustomTemplates(readCustomTemplatesFromStorage())
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [])

  const activeBuiltInTemplate =
    BUILT_IN_TEMPLATES.find((template) => template.id === activeTemplateId) ?? null
  const activeCustomTemplate =
    customTemplates.find((template) => template.id === activeTemplateId) ?? null
  const activeTemplate = activeBuiltInTemplate ?? activeCustomTemplate
  const hasUnsavedCustomTemplateChanges = activeCustomTemplate
    ? !scenesMatch(activeCustomTemplate.scene, scene)
    : false

  function applyTemplate(template: { id: string; name: string; scene: Scene }) {
    const nextScene = cloneScene(template.scene)
    setScene(nextScene)
    if (nextScene.elements[0]?.id) {
      setSelection(selectSingle(selection, nextScene.elements[0].id))
    }
    setActiveTemplateId(template.id)

    const templateSlot = templateSlots.find((s) => s.templateId === template.id)
    if (templateSlot) {
      setActiveSlotId(templateSlot.slotId)
    } else {
      setActiveSlotId('default')
    }

    setStatus(`已套用「${template.name}」到当前画布`)
  }

  function applyBuiltInTemplate(templateId: string) {
    const template = BUILT_IN_TEMPLATES.find((item) => item.id === templateId)
    if (!template) {
      return
    }

    applyTemplate(template)
  }

  function persistCustomTemplates(nextTemplates: CustomSceneTemplate[]) {
    writeCustomTemplatesToStorage(nextTemplates)
    setCustomTemplates(nextTemplates)
  }

  function saveCustomTemplateWithName(name: string) {
    const template = createCustomTemplate(name, scene)
    const nextTemplates = [template, ...customTemplates]

    try {
      persistCustomTemplates(nextTemplates)
      setActiveTemplateId(template.id)
      setStatus(`已保存「${template.name}」到浏览器缓存`)
    } catch {
      setStatus('自定义模板保存失败，浏览器缓存空间可能不足')
    }
  }

  function saveCustomTemplate() {
    const template = createCustomTemplate(customTemplateName, scene)
    const nextTemplates = [template, ...customTemplates]

    try {
      persistCustomTemplates(nextTemplates)
      setCustomTemplateName('')
      setActiveTemplateId(template.id)
      setStatus(`已保存「${template.name}」到浏览器缓存`)
      setShowTemplateForm(false)
    } catch {
      setStatus('自定义模板保存失败，浏览器缓存空间可能不足')
    }
  }

  function saveCustomTemplateWithScene(name: string, sceneToSave: Scene) {
    const template = createCustomTemplate(name, sceneToSave)
    const nextTemplates = [template, ...customTemplates]

    try {
      persistCustomTemplates(nextTemplates)
      setActiveTemplateId(template.id)
      setStatus(`已创建「${template.name}」`)
    } catch {
      setStatus('自定义模板保存失败，浏览器缓存空间可能不足')
    }
  }

  function saveActiveCustomTemplate() {
    if (!activeCustomTemplate) {
      setShowTemplateForm(true)
      setStatus('当前不是自定义模板，请另存为新模板')
      return
    }

    const updatedTemplate = updateCustomTemplate(activeCustomTemplate, { scene })
    const nextTemplates = customTemplates.map((template) =>
      template.id === activeCustomTemplate.id ? updatedTemplate : template,
    )

    try {
      persistCustomTemplates(nextTemplates)
      setActiveTemplateId(updatedTemplate.id)
      setStatus(`已保存「${updatedTemplate.name}」的修改`)
    } catch {
      setStatus('模板保存失败，浏览器缓存空间可能不足')
    }
  }

  function deleteCustomTemplate(templateId: string) {
    const nextTemplates = customTemplates.filter((template) => template.id !== templateId)

    try {
      persistCustomTemplates(nextTemplates)
      if (activeTemplateId === templateId) {
        setActiveTemplateId('')
      }
      setStatus('已删除自定义模板')
    } catch {
      setStatus('自定义模板删除失败，请检查浏览器缓存权限')
    }
  }

  function doDuplicateCustomTemplate(templateId: string) {
    const template = customTemplates.find((t) => t.id === templateId)
    if (!template) {
      return
    }

    const duplicatedTemplate = duplicateTemplate(template, customTemplates)
    const nextTemplates = [duplicatedTemplate, ...customTemplates]

    try {
      persistCustomTemplates(nextTemplates)
      setStatus(`已创建副本「${duplicatedTemplate.name}」`)
    } catch {
      setStatus('创建副本失败，浏览器缓存空间可能不足')
    }
  }

  function renameCustomTemplate(templateId: string, newName: string) {
    const template = customTemplates.find((t) => t.id === templateId)
    if (!template) {
      return
    }

    const trimmedName = newName.trim()
    if (!trimmedName) {
      setStatus('模板名称不能为空')
      return
    }

    const updatedTemplate = updateCustomTemplate(template, { name: trimmedName })
    const nextTemplates = customTemplates.map((t) => (t.id === templateId ? updatedTemplate : t))

    try {
      persistCustomTemplates(nextTemplates)
      setStatus(`已重命名为「${trimmedName}」`)
    } catch {
      setStatus('重命名失败，请检查浏览器缓存权限')
    }
  }

  function exportTemplateJson() {
    const payload = createTemplateExportPayload(activeTemplate?.name ?? '自定义场景', scene)
    const filename = `covercast-template-${new Date().toISOString().slice(0, 10)}.json`
    const json = JSON.stringify(payload, null, 2)

    downloadBlob(new Blob([json], { type: 'application/json;charset=utf-8' }), filename)
    setStatus(`模板 JSON 已导出：${payload.template.name}`)
  }

  async function importTemplateFile(file: File) {
    const isJsonFile = file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')

    if (!isJsonFile) {
      setStatus('导入失败，仅支持 JSON 文件')
      return
    }

    setStatus('正在导入模板 JSON...')

    try {
      const parsedValue = JSON.parse(await file.text()) as unknown
      const template = normalizeTemplateExportPayload(parsedValue)

      if (!template) {
        setStatus('导入失败，请选择 Covercast 导出的模板 JSON')
        return
      }

      const importedTemplate = createCustomTemplate(template.name, template.scene)
      const nextTemplates = [importedTemplate, ...customTemplates]

      persistCustomTemplates(nextTemplates)
      setScene(cloneScene(importedTemplate.scene))
      if (importedTemplate.scene.elements[0]?.id) {
        setSelection(selectSingle(selection, importedTemplate.scene.elements[0].id))
      }
      setActiveTemplateId(importedTemplate.id)
      setActiveSlotId('default')
      setStatus(`已导入模板「${importedTemplate.name}」`)
    } catch {
      setStatus('导入失败，请检查 JSON 文件内容或浏览器缓存空间')
    }
  }

  return {
    customTemplates,
    customTemplateName,
    activeTemplateId,
    showTemplateForm,
    activeBuiltInTemplate,
    activeCustomTemplate,
    activeTemplate,
    hasUnsavedCustomTemplateChanges,
    setCustomTemplateName,
    setShowTemplateForm,
    setActiveTemplateId,
    applyTemplate,
    applyBuiltInTemplate,
    saveCustomTemplate,
    saveCustomTemplateWithName,
    saveCustomTemplateWithScene,
    saveActiveCustomTemplate,
    deleteCustomTemplate,
    duplicateCustomTemplate,
    renameCustomTemplate,
    exportTemplateJson,
    importTemplateFile,
  }
}

export type { CustomSceneTemplate, SceneSlotInfo }
