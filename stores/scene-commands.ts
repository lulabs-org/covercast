/**
 * 场景变更命令
 *
 * 跨 Scene/History/Template/CanvasUI Store 的场景操作协调。
 * 非 React 上下文可用（内部使用 getState()）。
 */

import { cloneScene, type Scene } from '@/lib/domain/scene'
import { useSceneStore } from './useSceneStore'
import { useHistoryStore } from './useHistoryStore'
import { useCanvasUIStore } from './useCanvasUIStore'
import { useTemplateStore } from './useTemplateStore'
import { BUILT_IN_TEMPLATES, createSceneFromTemplate } from '@/lib/templates'
import { selectSingle, createSelectionState } from '@/lib/domain/selection'

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
