import { useRef, useState, useCallback } from 'react'
import {
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_CANVAS_HEIGHT,
  type Scene,
  type SceneElement,
  selectSingle,
  selectMultiple,
  type SelectionState,
  cloneSceneElement,
  createPastedSceneElement,
} from '@/domain'

type UseClipboardOptions = {
  selectedElementRef: React.MutableRefObject<SceneElement | null>
  sceneElementsRef: React.MutableRefObject<SceneElement[]>
  selectedIds: string[]
  changeScene: (updater: (currentScene: Scene) => Scene, description?: string) => void
  setSelection: (updater: (prev: SelectionState) => SelectionState) => void
  markSceneEdited: () => void
  setStatus: (status: string) => void
  canvasWidth?: number
  canvasHeight?: number
}

/**
 * 剪贴板 hook:把 domain/scene/clipboard 的纯变换与副作用(changeScene / setSelection / setStatus)编排起来。
 * 纯变换见 domain/scene/clipboard.ts。
 */
export function useClipboard(options: UseClipboardOptions) {
  const {
    selectedElementRef,
    sceneElementsRef,
    selectedIds,
    changeScene,
    setSelection,
    markSceneEdited,
    setStatus,
    canvasWidth = DEFAULT_CANVAS_WIDTH,
    canvasHeight = DEFAULT_CANVAS_HEIGHT,
  } = options

  const elementClipboardRef = useRef<SceneElement | null>(null)
  const elementsClipboardRef = useRef<SceneElement[] | null>(null)
  const pasteOffsetRef = useRef(1)
  const [canPasteElement, setCanPasteElement] = useState(false)

  const copySelectedElements = useCallback(() => {
    const selectedCount = selectedIds.length

    if (selectedCount === 0) {
      setStatus('请先选择画布组件')
      return
    }

    const elements = sceneElementsRef.current
    const selectedElements = elements.filter((el) => selectedIds.includes(el.id))

    if (selectedElements.length === 0) {
      setStatus('未找到选中的组件')
      return
    }

    if (selectedElements.length === 1) {
      elementClipboardRef.current = cloneSceneElement(selectedElements[0])
      elementsClipboardRef.current = null
      pasteOffsetRef.current = 1
      setCanPasteElement(true)
      setStatus(`已复制「${selectedElements[0].name}」`)
    } else {
      elementsClipboardRef.current = selectedElements.map((el) => cloneSceneElement(el))
      elementClipboardRef.current = null
      pasteOffsetRef.current = 1
      setCanPasteElement(true)
      setStatus(`已复制 ${selectedElements.length} 个组件`)
    }
  }, [selectedIds, sceneElementsRef, setStatus])

  const pasteCopiedElements = useCallback(() => {
    const sourceElements = elementsClipboardRef.current
    const sourceElement = elementClipboardRef.current

    if (!sourceElements && !sourceElement) {
      setStatus('没有可粘贴的组件')
      return
    }

    const offset = 24 * pasteOffsetRef.current
    const currentElements = sceneElementsRef.current

    if (sourceElement) {
      const pastedElement = createPastedSceneElement(
        sourceElement,
        currentElements,
        offset,
        offset,
        canvasWidth,
        canvasHeight,
      )
      pasteOffsetRef.current += 1
      sceneElementsRef.current = [...currentElements, pastedElement]
      selectedElementRef.current = pastedElement

      changeScene(
        (currentScene) => ({
          ...currentScene,
          elements: [...currentScene.elements, pastedElement],
        }),
        `粘贴元素「${pastedElement.name}」`,
      )
      setSelection((prev) => selectSingle(prev, pastedElement.id))
      markSceneEdited()
      setStatus(`已粘贴「${pastedElement.name}」`)
    } else if (sourceElements && sourceElements.length > 0) {
      const pastedElements: SceneElement[] = []
      let updatedElements = [...currentElements]

      for (const element of sourceElements) {
        const pastedElement = createPastedSceneElement(
          element,
          updatedElements,
          offset,
          offset,
          canvasWidth,
          canvasHeight,
        )
        pastedElements.push(pastedElement)
        updatedElements = [...updatedElements, pastedElement]
      }

      pasteOffsetRef.current += 1
      sceneElementsRef.current = updatedElements
      const pastedIds = pastedElements.map((el) => el.id)

      changeScene(
        (currentScene) => ({
          ...currentScene,
          elements: [...currentScene.elements, ...pastedElements],
        }),
        `粘贴 ${pastedElements.length} 个元素`,
      )
      setSelection((prev) => selectMultiple(prev, pastedIds, false))
      markSceneEdited()
      setStatus(`已粘贴 ${pastedElements.length} 个组件`)
    }
  }, [
    sceneElementsRef,
    selectedElementRef,
    changeScene,
    setSelection,
    markSceneEdited,
    setStatus,
    canvasWidth,
    canvasHeight,
  ])

  return {
    elementClipboardRef,
    elementsClipboardRef,
    canPasteElement,
    copySelectedElements,
    pasteCopiedElements,
  }
}
