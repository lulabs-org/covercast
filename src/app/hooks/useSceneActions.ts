import {
  createEllipseElement,
  createRectElement,
  createTextElement,
  type Scene,
  type SceneElement,
  clearSelection,
  selectSingle,
  type SelectionState,
  patchElementById,
  toggleElementHidden as toggleElementHiddenInScene,
  toggleElementLocked as toggleElementLockedInScene,
  moveElementLayer as moveElementLayerInScene,
  addElement,
  deleteElementsByIds,
} from '@/domain'

/**
 * 场景操作 hook:把 domain/scene/operations 的纯变换与副作用(history、selection)编排起来。
 * 纯变换逻辑见 domain/scene/operations.ts。
 */
export function useSceneActions({
  scene,
  selection,
  changeScene,
  setSelection,
}: {
  scene: Scene
  selection: SelectionState
  changeScene: (updater: (currentScene: Scene) => Scene, description?: string) => void
  setSelection: React.Dispatch<React.SetStateAction<SelectionState>>
}) {
  function patchElement(elementId: string, patch: Partial<SceneElement>) {
    changeScene((currentScene) => patchElementById(currentScene, elementId, patch), `修改元素属性`)
  }

  function patchSelected(selectedElement: SceneElement | null, patch: Partial<SceneElement>) {
    if (!selectedElement) {
      return
    }
    patchElement(selectedElement.id, patch)
  }

  function toggleElementHidden(elementId: string) {
    changeScene(
      (currentScene) => toggleElementHiddenInScene(currentScene, elementId),
      `切换元素显示状态`,
    )
  }

  function toggleElementLocked(elementId: string) {
    changeScene(
      (currentScene) => toggleElementLockedInScene(currentScene, elementId),
      `切换元素锁定状态`,
    )
  }

  function moveElementLayerAction(elementId: string, direction: 'forward' | 'backward') {
    changeScene(
      (currentScene) => moveElementLayerInScene(currentScene, elementId, direction),
      `调整图层顺序`,
    )
    setSelection(selectSingle(selection, elementId))
  }

  function addTextElement() {
    const element = createTextElement()
    changeScene((currentScene) => addElement(currentScene, element), `添加文字元素`)
    setSelection(selectSingle(selection, element.id))
  }

  function addRectElement() {
    const element = createRectElement()
    changeScene((currentScene) => addElement(currentScene, element), `添加矩形元素`)
    setSelection(selectSingle(selection, element.id))
  }

  function addEllipseElement() {
    const element = createEllipseElement()
    changeScene((currentScene) => addElement(currentScene, element), `添加椭圆元素`)
    setSelection(selectSingle(selection, element.id))
  }

  function deleteSelected() {
    if (selection.selectedIds.length === 0) {
      return
    }

    // changeScene 的 updater 同步执行,闭包内 scene 与 updater 内 currentScene 等价;
    // 因此只需调用一次 deleteElementsByIds 即可同时得到新 scene 与剩余元素的 id。
    const { scene: nextScene, firstRemainingId } = deleteElementsByIds(scene, selection.selectedIds)
    changeScene(() => nextScene, `删除元素`)
    if (firstRemainingId) {
      setSelection(selectSingle(selection, firstRemainingId))
    } else {
      setSelection(clearSelection(selection))
    }
  }

  return {
    patchElement,
    patchSelected,
    toggleElementHidden,
    toggleElementLocked,
    moveElementLayer: moveElementLayerAction,
    addTextElement,
    addRectElement,
    addEllipseElement,
    deleteSelected,
  }
}
