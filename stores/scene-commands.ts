/**
 * 场景变更命令
 *
 * 跨 Scene/History/Template/CanvasUI Store 的场景操作协调。
 * 非 React 上下文可用（内部使用 getState()）。
 */

import { cloneScene, type Scene, type SceneElement } from '@/lib/domain/scene'
import { createTextElement, createRectElement, createEllipseElement } from '@/lib/domain/scene'
import { useSceneStore } from './useSceneStore'
import { useHistoryStore } from './useHistoryStore'
import { useCanvasUIStore } from './useCanvasUIStore'
import { useTemplateStore } from './useTemplateStore'
import { BUILT_IN_TEMPLATES, createSceneFromTemplate } from '@/lib/templates'
import { selectSingle, clearSelection, createSelectionState } from '@/lib/domain/selection'

// ── History helpers ──

function pushHistorySnapshot(description: string) {
  const { scene, selection } = useSceneStore.getState()
  useHistoryStore.getState().pushPast({
    scene: cloneScene(scene),
    selectedIds: selection.selectedIds,
    description,
    timestamp: Date.now(),
  })
}

// ── Scene-level commands ──

/**
 * 修改场景并记录历史。
 * 如果提供 description，则将当前状态压入历史栈。
 */
export function changeSceneWithHistory(
  updater: ((prev: Scene) => Scene) | Scene,
  description?: string,
) {
  if (description) {
    pushHistorySnapshot(description)
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

// ── Element-level commands (with history) ──

/** 修改单个元素属性并记录历史 */
export function patchElementWithHistory(
  elementId: string,
  patch: Partial<SceneElement>,
  description = '修改元素属性',
) {
  pushHistorySnapshot(description)
  useSceneStore.getState().patchElement(elementId, patch)
  markSceneEdited()
}

/** 切换元素显示状态并记录历史 */
export function toggleElementHiddenWithHistory(elementId: string) {
  pushHistorySnapshot('切换元素显示状态')
  useSceneStore.getState().toggleElementHidden(elementId)
  markSceneEdited()
}

/** 切换元素锁定状态并记录历史 */
export function toggleElementLockedWithHistory(elementId: string) {
  pushHistorySnapshot('切换元素锁定状态')
  useSceneStore.getState().toggleElementLocked(elementId)
  markSceneEdited()
}

/** 调整图层顺序并记录历史 */
export function moveElementLayerWithHistory(elementId: string, direction: 'forward' | 'backward') {
  pushHistorySnapshot('调整图层顺序')
  useSceneStore.getState().moveElementLayer(elementId, direction)
  markSceneEdited()
}

/** 添加文字元素并记录历史 */
export function addTextElement() {
  const element = createTextElement()
  pushHistorySnapshot('添加文字元素')
  useSceneStore.getState().insertElement(element)
  useSceneStore
    .getState()
    .setSelection(selectSingle(useSceneStore.getState().selection, element.id))
  markSceneEdited()
}

/** 添加矩形元素并记录历史 */
export function addRectElement() {
  const element = createRectElement()
  pushHistorySnapshot('添加矩形元素')
  useSceneStore.getState().insertElement(element)
  useSceneStore
    .getState()
    .setSelection(selectSingle(useSceneStore.getState().selection, element.id))
  markSceneEdited()
}

/** 添加椭圆元素并记录历史 */
export function addEllipseElement() {
  const element = createEllipseElement()
  pushHistorySnapshot('添加椭圆元素')
  useSceneStore.getState().insertElement(element)
  useSceneStore
    .getState()
    .setSelection(selectSingle(useSceneStore.getState().selection, element.id))
  markSceneEdited()
}

/** 删除选中元素并记录历史 */
export function deleteSelected() {
  const { selection, scene } = useSceneStore.getState()
  if (selection.selectedIds.length === 0) return

  pushHistorySnapshot('删除元素')
  useSceneStore.getState().removeElements(selection.selectedIds)

  const remainingElement = scene.elements.find(
    (element) => !selection.selectedIds.includes(element.id),
  )
  if (remainingElement?.id) {
    useSceneStore.getState().setSelection(selectSingle(selection, remainingElement.id))
  } else {
    useSceneStore.getState().setSelection(clearSelection(selection))
  }
  markSceneEdited()
}

// ── Undo / Redo ──

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
  useCanvasUIStore.getState().setStatus('已撤销')
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
  useCanvasUIStore.getState().setStatus('已重做')
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
  useCanvasUIStore
    .getState()
    .setStatus(`已应用模板「${builtIn?.name ?? custom?.name ?? templateId}」`)
}
