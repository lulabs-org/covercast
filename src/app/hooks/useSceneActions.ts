import {
  createEllipseElement,
  createRectElement,
  createTextElement,
  type Scene,
  type SceneElement,
  clearSelection,
  selectSingle,
  type SelectionState,
} from '@/domain'

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
    changeScene(
      (currentScene) => ({
        ...currentScene,
        elements: currentScene.elements.map((element) =>
          element.id === elementId ? ({ ...element, ...patch } as SceneElement) : element,
        ),
      }),
      `修改元素属性`,
    )
  }

  function patchSelected(selectedElement: SceneElement | null, patch: Partial<SceneElement>) {
    if (!selectedElement) {
      return
    }

    patchElement(selectedElement.id, patch)
  }

  function toggleElementHidden(elementId: string) {
    changeScene(
      (currentScene) => ({
        ...currentScene,
        elements: currentScene.elements.map((element) =>
          element.id === elementId
            ? ({ ...element, hidden: !element.hidden } as SceneElement)
            : element,
        ),
      }),
      `切换元素显示状态`,
    )
  }

  function toggleElementLocked(elementId: string) {
    changeScene(
      (currentScene) => ({
        ...currentScene,
        elements: currentScene.elements.map((element) =>
          element.id === elementId
            ? ({ ...element, locked: !element.locked } as SceneElement)
            : element,
        ),
      }),
      `切换元素锁定状态`,
    )
  }

  function moveElementLayer(elementId: string, direction: 'forward' | 'backward') {
    changeScene((currentScene) => {
      const currentIndex = currentScene.elements.findIndex((element) => element.id === elementId)
      const nextIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1

      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= currentScene.elements.length) {
        return currentScene
      }

      const elements = [...currentScene.elements]
      ;[elements[currentIndex], elements[nextIndex]] = [elements[nextIndex], elements[currentIndex]]
      return { ...currentScene, elements }
    }, `调整图层顺序`)
    setSelection(selectSingle(selection, elementId))
  }

  function addTextElement() {
    const element = createTextElement()
    changeScene(
      (currentScene) => ({
        ...currentScene,
        elements: [...currentScene.elements, element],
      }),
      `添加文字元素`,
    )
    setSelection(selectSingle(selection, element.id))
  }

  function addRectElement() {
    const element = createRectElement()
    changeScene(
      (currentScene) => ({
        ...currentScene,
        elements: [...currentScene.elements, element],
      }),
      `添加矩形元素`,
    )
    setSelection(selectSingle(selection, element.id))
  }

  function addEllipseElement() {
    const element = createEllipseElement()
    changeScene(
      (currentScene) => ({
        ...currentScene,
        elements: [...currentScene.elements, element],
      }),
      `添加椭圆元素`,
    )
    setSelection(selectSingle(selection, element.id))
  }

  function deleteSelected() {
    if (selection.selectedIds.length === 0) {
      return
    }

    changeScene((currentScene) => {
      const elements = currentScene.elements.filter(
        (element) => !selection.selectedIds.includes(element.id),
      )
      return { ...currentScene, elements }
    }, `删除元素`)
    const remainingElement = scene.elements.find(
      (element) => !selection.selectedIds.includes(element.id),
    )
    if (remainingElement?.id) {
      setSelection(selectSingle(selection, remainingElement.id))
    } else {
      setSelection(clearSelection(selection))
    }
  }

  return {
    patchElement,
    patchSelected,
    toggleElementHidden,
    toggleElementLocked,
    moveElementLayer,
    addTextElement,
    addRectElement,
    addEllipseElement,
    deleteSelected,
  }
}
