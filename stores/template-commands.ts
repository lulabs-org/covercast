/**
 * 模板操作命令
 *
 * 跨 Scene/Template/CanvasUI Store 的模板操作协调。
 * 非 React 上下文可用（内部使用 getState()）。
 */

import { cloneScene, type Scene } from '@/lib/domain/scene'
import { makeUniqueTemplateName } from '@/lib/domain/template'
import { useSceneStore } from './useSceneStore'
import { useCanvasUIStore } from './useCanvasUIStore'
import { useTemplateStore, type CustomSceneTemplate } from './useTemplateStore'
import { selectSingle, createSelectionState } from '@/lib/domain/selection'

/**
 * 以指定名称保存自定义模板。
 */
export function saveCustomTemplateWithNameAction(name: string) {
  const { scene } = useSceneStore.getState()
  const { customTemplates } = useTemplateStore.getState()
  const timestamp = new Date().toISOString()
  const uniqueName = makeUniqueTemplateName(name, customTemplates)

  const template: CustomSceneTemplate = {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: uniqueName,
    createdAt: timestamp,
    updatedAt: timestamp,
    scene: cloneScene(scene),
  }

  const nextTemplates = [template, ...customTemplates]
  useTemplateStore.setState({
    customTemplates: nextTemplates,
    activeTemplateId: template.id,
  })
  useCanvasUIStore.getState().setStatus(`已保存模板「${uniqueName}」`)
}

/**
 * 以指定场景保存自定义模板。
 */
export function saveCustomTemplateWithSceneAction(name: string, scene: Scene) {
  const { customTemplates } = useTemplateStore.getState()
  const timestamp = new Date().toISOString()
  const uniqueName = makeUniqueTemplateName(name, customTemplates)

  const template: CustomSceneTemplate = {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: uniqueName,
    createdAt: timestamp,
    updatedAt: timestamp,
    scene: cloneScene(scene),
  }

  const nextTemplates = [template, ...customTemplates]
  useTemplateStore.setState({
    customTemplates: nextTemplates,
    activeTemplateId: template.id,
  })
  useCanvasUIStore.getState().setStatus(`已保存模板「${uniqueName}」`)
}

/**
 * 覆盖保存当前激活的自定义模板。
 */
export function saveActiveCustomTemplateAction() {
  const { scene } = useSceneStore.getState()
  const { activeTemplateId, customTemplates } = useTemplateStore.getState()
  const template = customTemplates.find((t) => t.id === activeTemplateId)
  if (!template) return

  const updated: CustomSceneTemplate = {
    ...template,
    scene: cloneScene(scene),
    updatedAt: new Date().toISOString(),
  }
  const nextTemplates = customTemplates.map((t) => (t.id === activeTemplateId ? updated : t))
  useTemplateStore.setState({ customTemplates: nextTemplates })
  useCanvasUIStore.getState().setStatus(`已覆盖保存模板「${template.name}」`)
}

/**
 * 导出模板 JSON。
 */
export function exportTemplateJsonAction() {
  const { scene } = useSceneStore.getState()
  const json = JSON.stringify(scene, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `covercast-template-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
  useCanvasUIStore.getState().setStatus('模板 JSON 已导出')
}

/**
 * 导入模板文件。
 */
export async function importTemplateFileAction(file: File) {
  try {
    const text = await file.text()
    const parsed = JSON.parse(text) as unknown
    if (typeof parsed !== 'object' || parsed === null || !('elements' in parsed)) {
      useCanvasUIStore.getState().setStatus('导入失败：文件格式不正确')
      return
    }

    const scene = parsed as Scene
    const { customTemplates } = useTemplateStore.getState()
    const timestamp = new Date().toISOString()
    const name = makeUniqueTemplateName(
      file.name.replace(/\.json$/i, '').trim() || '导入模板',
      customTemplates,
    )

    const template: CustomSceneTemplate = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      createdAt: timestamp,
      updatedAt: timestamp,
      scene,
    }

    const nextTemplates = [template, ...customTemplates]
    const firstElementId = scene.elements[0]?.id

    useTemplateStore.setState({
      customTemplates: nextTemplates,
      activeTemplateId: template.id,
    })
    useSceneStore.setState({
      scene,
      selection: firstElementId
        ? selectSingle(createSelectionState(), firstElementId)
        : createSelectionState(),
    })
    useCanvasUIStore.getState().setStatus(`已导入模板「${name}」`)
  } catch {
    useCanvasUIStore.getState().setStatus('导入失败：无法解析文件')
  }
}
