import { useRef, useState, useCallback } from 'react'
import {
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_CANVAS_HEIGHT,
  type Scene,
  type SceneElement,
} from '../../lib/scene'
import { selectSingle, selectMultiple } from '../../lib/selection'
import { useEditorStore } from '@/stores/useEditorStore'

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function cloneSceneElement(element: SceneElement): SceneElement {
  return JSON.parse(JSON.stringify(element)) as SceneElement
}

function createSceneElementId(type: SceneElement['type']) {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function uniqueSceneElementName(name: string, elements: SceneElement[]) {
  const existingNames = new Set(elements.map((element) => element.name))

  if (!existingNames.has(name)) {
    return name
  }

  let suffix = 2
  let candidate = `${name} ${suffix}`

  while (existingNames.has(candidate)) {
    suffix += 1
    candidate = `${name} ${suffix}`
  }

  return candidate
}

function createPastedSceneElement(
  element: SceneElement,
  elements: SceneElement[],
  offsetX: number,
  offsetY: number,
  canvasWidth: number,
  canvasHeight: number,
): SceneElement {
  return {
    ...cloneSceneElement(element),
    id: createSceneElementId(element.type),
    name: uniqueSceneElementName(`${element.name} 副本`, elements),
    x: clamp(element.x + offsetX, -element.width + 24, canvasWidth - 24),
    y: clamp(element.y + offsetY, -element.height + 24, canvasHeight - 24),
  } as SceneElement
}

type UseClipboardOptions = {
  selectedElementRef: React.MutableRefObject<SceneElement | null>
  sceneElementsRef: React.MutableRefObject<SceneElement[]>
  selectedIds: string[]
  changeScene: (updater: (currentScene: Scene) => Scene, description?: string) => void
  markSceneEdited: () => void
  setStatus: (status: string) => void
  canvasWidth?: number
  canvasHeight?: number
}

export function useClipboard(options: UseClipboardOptions) {
  const {
    selectedElementRef,
    sceneElementsRef,
    selectedIds,
    changeScene,
    markSceneEdited,
    setStatus,
    canvasWidth = DEFAULT_CANVAS_WIDTH,
    canvasHeight = DEFAULT_CANVAS_HEIGHT,
  } = options

  // ── 直接从 store 获取 setter（消除双写） ──
  const setSelection = useEditorStore((s) => s.setSelection)

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
