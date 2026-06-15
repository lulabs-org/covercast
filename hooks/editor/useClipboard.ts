import { useRef, useState, useCallback } from 'react'
import {
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_CANVAS_HEIGHT,
  type Scene,
  type SceneElement,
} from '@/lib/domain/scene'
import { selectSingle, selectMultiple } from '@/lib/domain/selection'
import { useSceneStore } from '@/stores/useSceneStore'
import { changeSceneWithHistory } from '@/stores/scene-commands'

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
  selectedIds: string[]
  setStatus: (status: string) => void
  canvasWidth?: number
  canvasHeight?: number
}

export function useClipboard(options: UseClipboardOptions) {
  const {
    selectedIds,
    setStatus,
    canvasWidth = DEFAULT_CANVAS_WIDTH,
    canvasHeight = DEFAULT_CANVAS_HEIGHT,
  } = options

  // ── 直接从 SceneStore 获取 setter ──
  const setSelection = useSceneStore((s) => s.setSelection)

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

    const elements = useSceneStore.getState().scene.elements
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
  }, [selectedIds, setStatus])

  const pasteCopiedElements = useCallback(() => {
    const sourceElements = elementsClipboardRef.current
    const sourceElement = elementClipboardRef.current

    if (!sourceElements && !sourceElement) {
      setStatus('没有可粘贴的组件')
      return
    }

    const offset = 24 * pasteOffsetRef.current
    const currentElements = useSceneStore.getState().scene.elements

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

      changeSceneWithHistory(
        (currentScene) => ({
          ...currentScene,
          elements: [...currentScene.elements, pastedElement],
        }),
        `粘贴元素「${pastedElement.name}」`,
      )
      setSelection((prev) => selectSingle(prev, pastedElement.id))
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
      const pastedIds = pastedElements.map((el) => el.id)

      changeSceneWithHistory(
        (currentScene) => ({
          ...currentScene,
          elements: [...currentScene.elements, ...pastedElements],
        }),
        `粘贴 ${pastedElements.length} 个元素`,
      )
      setSelection((prev) => selectMultiple(prev, pastedIds, false))
      setStatus(`已粘贴 ${pastedElements.length} 个组件`)
    }
  }, [setSelection, setStatus, canvasWidth, canvasHeight])

  return {
    elementClipboardRef,
    elementsClipboardRef,
    canPasteElement,
    copySelectedElements,
    pasteCopiedElements,
  }
}
