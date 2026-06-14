/**
 * 跨 Store 协调模块
 *
 * 原先在 useEditorStore 中，Scene/History/Template/Canvas slice 之间存在隐式耦合
 * （如 changeSceneWithHistory 同时操作 Scene + History + Template）。
 * 拆分为独立 Store 后，这些跨 Store 操作提升到此模块，依赖关系变为显式。
 *
 * 使用方式：
 * - 在 React 组件中通过 useEditorOrchestrator() hook 获取
 * - 在非 React 上下文中直接调用函数（内部使用 getState()）
 */

import { cloneScene, type Scene } from '@/lib/domain/scene'
import { useSceneStore } from './useSceneStore'
import { useHistoryStore, type HistoryEntry } from './useHistoryStore'
import { useCanvasStore } from './useCanvasStore'
import { useTemplateStore, type CustomSceneTemplate } from './useTemplateStore'
import { BUILT_IN_TEMPLATES, createDefaultScene, createSceneFromTemplate } from '@/lib/templates'
import { selectSingle, createSelectionState } from '@/lib/domain/selection'

// ── 协调函数（非 React 上下文可用） ──

/**
 * 修改场景并记录历史。
 * 如果提供 description，则将当前状态压入历史栈。
 */
export function changeSceneWithHistory(
  updater: ((prev: Scene) => Scene) | Scene,
  description?: string,
) {
  if (description) {
    const { scene, selection } = useSceneStore.getState()
    useHistoryStore.getState().pushPast({
      scene: cloneScene(scene),
      selectedIds: selection.selectedIds,
      description,
      timestamp: Date.now(),
    })
  }

  if (typeof updater === 'function') {
    useSceneStore.setState((state) => ({ scene: updater(state.scene) }))
  } else {
    useSceneStore.setState({ scene: updater })
  }

  markSceneEdited()
}

/**
 * 标记场景已编辑：如果当前激活的是内置模板，则清除 activeTemplateId。
 */
export function markSceneEdited() {
  const { activeTemplateId } = useTemplateStore.getState()
  if (!activeTemplateId) return
  const isBuiltIn = BUILT_IN_TEMPLATES.some((t) => t.id === activeTemplateId)
  if (isBuiltIn) {
    useTemplateStore.setState({ activeTemplateId: '' })
  }
}

/**
 * 撤销：从历史栈弹出上一状态，恢复场景和选区。
 */
export function undoAction() {
  const previous = useHistoryStore.getState().undoShift()
  if (!previous) return

  const { scene, selection } = useSceneStore.getState()

  useHistoryStore.getState().pushFuture({
    scene: cloneScene(scene),
    selectedIds: selection.selectedIds,
    description: previous.description,
    timestamp: previous.timestamp,
  })

  useSceneStore.setState({
    scene: previous.scene,
    selection: { ...selection, selectedIds: previous.selectedIds },
  })
  useCanvasStore.getState().setStatus('已撤销')
}

/**
 * 重做：从未来栈弹出下一状态，恢复场景和选区。
 */
export function redoAction() {
  const next = useHistoryStore.getState().redoShift()
  if (!next) return

  const { scene, selection } = useSceneStore.getState()

  useHistoryStore.getState().pushPast({
    scene: cloneScene(scene),
    selectedIds: selection.selectedIds,
    description: next.description,
    timestamp: next.timestamp,
  })

  useSceneStore.setState({
    scene: next.scene,
    selection: { ...selection, selectedIds: next.selectedIds },
  })
  useCanvasStore.getState().setStatus('已重做')
}

/**
 * 应用模板：加载模板场景并更新选区、模板状态。
 */
export function applyTemplateAction(templateId: string) {
  const builtIn = BUILT_IN_TEMPLATES.find((t) => t.id === templateId)
  const custom = useTemplateStore.getState().customTemplates.find((t) => t.id === templateId)

  let newScene: Scene
  if (custom) {
    newScene = cloneScene(custom.scene)
  } else if (builtIn) {
    newScene = createSceneFromTemplate(templateId)
  } else {
    return
  }

  const firstElementId = newScene.elements[0]?.id

  useSceneStore.setState({
    scene: newScene,
    selection: firstElementId
      ? selectSingle(createSelectionState(), firstElementId)
      : createSelectionState(),
  })
  useTemplateStore.setState({
    activeTemplateId: templateId,
    activeSlotId: 'default',
  })
  useCanvasStore
    .getState()
    .setStatus(`已应用模板「${builtIn?.name ?? custom?.name ?? templateId}」`)
}

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
  useCanvasStore.getState().setStatus(`已保存模板「${uniqueName}」`)
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
  useCanvasStore.getState().setStatus(`已保存模板「${uniqueName}」`)
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
  useCanvasStore.getState().setStatus(`已覆盖保存模板「${template.name}」`)
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
  useCanvasStore.getState().setStatus('模板 JSON 已导出')
}

/**
 * 导入模板文件。
 */
export async function importTemplateFileAction(file: File) {
  try {
    const text = await file.text()
    const parsed = JSON.parse(text) as unknown
    if (typeof parsed !== 'object' || parsed === null || !('elements' in parsed)) {
      useCanvasStore.getState().setStatus('导入失败：文件格式不正确')
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
    useCanvasStore.getState().setStatus(`已导入模板「${name}」`)
  } catch {
    useCanvasStore.getState().setStatus('导入失败：无法解析文件')
  }
}

// ── Helper ──

function makeUniqueTemplateName(name: string, templates: CustomSceneTemplate[]): string {
  const baseName = name.trim() || '自定义模板'
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

// ── React Hook（组件中使用） ──

/**
 * 编辑器跨 Store 协调 Hook。
 * 返回所有需要跨 Store 协调的操作函数。
 */
export function useEditorOrchestrator() {
  return {
    changeSceneWithHistory,
    markSceneEdited,
    undoAction,
    redoAction,
    applyTemplateAction,
    saveCustomTemplateWithNameAction,
    saveCustomTemplateWithSceneAction,
    saveActiveCustomTemplateAction,
    exportTemplateJsonAction,
    importTemplateFileAction,
  }
}
