'use client'

import { type PointerEvent as ReactPointerEvent, useRef, useEffect, useCallback } from 'react'
import {
  DEFAULT_CANVAS_HEIGHT,
  DEFAULT_CANVAS_WIDTH,
  isTextElement,
  type Scene,
  type SceneElement,
} from '../../lib/scene'
import {
  computeGuidesOptimized,
  computeSnapOptimized,
  computeSpacingGuidesOptimized,
  computeResizeSnapOptimized,
  createResizeSnapState,
  createSnapState,
  type ResizeSnapState,
  type SnapState,
} from '../../lib/smart-guide'
import { SpatialIndex, buildSpatialIndex } from '../../lib/spatial-index'
import {
  handleElementClick,
  isSelected,
  selectSingle,
  type SelectionState,
} from '../../lib/selection'
import {
  computeBoundingBox,
  computeNewBoundsFromHandle,
  createGroupResizeState,
  type BoundingBox,
  type ResizeHandleType,
} from '../../lib/group-drag'
import { useEditorStore } from '@/stores/useEditorStore'

function getSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const point = svg.createSVGPoint()
  point.x = clientX
  point.y = clientY
  const matrix = svg.getScreenCTM()

  if (!matrix) {
    return { x: 0, y: 0 }
  }

  const nextPoint = point.matrixTransform(matrix.inverse())
  return { x: nextPoint.x, y: nextPoint.y }
}

function minimumWidth(element: SceneElement) {
  if (isTextElement(element)) {
    return 40
  }

  if (element.type === 'ellipse') {
    return 14
  }

  return 28
}

function minimumHeight(element: SceneElement) {
  if (isTextElement(element)) {
    return Math.max(24, element.fontSize)
  }

  if (element.type === 'ellipse') {
    return 14
  }

  return 28
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function useDragManager({
  scene,
  selection,
  editingTextId,
  svgRef,
  pushPast,
  markSceneEdited,
  setScene,
  setSelection,
  setEditingTextId,
  canvasWidth = DEFAULT_CANVAS_WIDTH,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
}: {
  scene: Scene
  selection: SelectionState
  editingTextId: string | null
  svgRef: React.RefObject<SVGSVGElement | null>
  pushPast: (entry: {
    scene: Scene
    selectedIds: string[]
    description: string
    timestamp: number
  }) => void
  markSceneEdited: () => void
  setScene: React.Dispatch<React.SetStateAction<Scene>>
  setSelection: React.Dispatch<React.SetStateAction<SelectionState>>
  setEditingTextId: React.Dispatch<React.SetStateAction<string | null>>
  canvasWidth?: number
  canvasHeight?: number
}) {
  // ── 交互状态直接读写 Zustand store（消除双写） ──
  const drag = useEditorStore((s) => s.drag)

  const snapStateRef = useRef<SnapState>(createSnapState())
  const resizeSnapStateRef = useRef<ResizeSnapState>(createResizeSnapState())
  const spatialIndexRef = useRef<SpatialIndex>(new SpatialIndex())
  const rafHandleRef = useRef<number>(0)
  const latestMoveRef = useRef<{ dx: number; dy: number; shiftKey: boolean } | null>(null)

  useEffect(() => {
    if (!drag) {
      return
    }

    const activeDrag = drag

    if (activeDrag.mode === 'move' || activeDrag.mode === 'group-move') {
      snapStateRef.current = createSnapState()
    } else {
      resizeSnapStateRef.current = createResizeSnapState()
    }

    function handlePointerMove(event: PointerEvent) {
      const svg = svgRef.current
      if (!svg) {
        return
      }

      const point = getSvgPoint(svg, event.clientX, event.clientY)
      latestMoveRef.current = {
        dx: point.x - activeDrag.startX,
        dy: point.y - activeDrag.startY,
        shiftKey: event.shiftKey,
      }

      if (rafHandleRef.current === 0) {
        rafHandleRef.current = requestAnimationFrame(processMoveFrame)
      }
    }

    function processMoveFrame() {
      rafHandleRef.current = 0

      const latest = latestMoveRef.current
      if (!latest) {
        return
      }

      const s = useEditorStore.getState()

      if (activeDrag.mode === 'group-move') {
        const groupBox = computeBoundingBox(activeDrag.elements)
        const rawX = clamp(groupBox.x + latest.dx, -groupBox.width + 24, canvasWidth - 24)
        const rawY = clamp(groupBox.y + latest.dy, -groupBox.height + 24, canvasHeight - 24)

        const groupRect = {
          x: rawX,
          y: rawY,
          width: groupBox.width,
          height: groupBox.height,
        }

        const result = computeSnapOptimized(
          groupRect,
          spatialIndexRef.current,
          snapStateRef.current,
        )

        snapStateRef.current = result.snapState
        s.setGuides(result.guides)

        const spacing = computeSpacingGuidesOptimized(result.snappedRect, spatialIndexRef.current)
        s.setSpacingGuides(spacing)

        s.setResizeLabel(null)

        const groupDeltaX = result.snappedRect.x - groupBox.x
        const groupDeltaY = result.snappedRect.y - groupBox.y

        setScene((currentScene) => ({
          ...currentScene,
          elements: currentScene.elements.map((element) => {
            const dragElement = activeDrag.elements.find((el) => el.id === element.id)
            if (!dragElement) {
              return element
            }

            return {
              ...element,
              x: dragElement.x + groupDeltaX,
              y: dragElement.y + groupDeltaY,
            } as SceneElement
          }),
        }))
        markSceneEdited()
        return
      }

      if (activeDrag.mode === 'group-resize') {
        const newBounds = computeNewBoundsFromHandle(
          activeDrag.originalBounds,
          activeDrag.handle,
          latest,
          latest.shiftKey,
        )

        const clampedBounds: BoundingBox = {
          x: clamp(newBounds.x, 0, canvasWidth - 10),
          y: clamp(newBounds.y, 0, canvasHeight - 10),
          width: clamp(newBounds.width, 10, canvasWidth - newBounds.x),
          height: clamp(newBounds.height, 10, canvasHeight - newBounds.y),
        }

        const resizeSnap = computeResizeSnapOptimized(
          clampedBounds,
          spatialIndexRef.current,
          resizeSnapStateRef.current,
        )

        resizeSnapStateRef.current = resizeSnap.snapState

        const snappedBounds: BoundingBox = {
          x: clampedBounds.x,
          y: clampedBounds.y,
          width: clamp(resizeSnap.snappedWidth, 10, canvasWidth - clampedBounds.x),
          height: clamp(resizeSnap.snappedHeight, 10, canvasHeight - clampedBounds.y),
        }

        const resizeGuides = computeGuidesOptimized(snappedBounds, spatialIndexRef.current)
        s.setGuides(resizeGuides)

        const resizeSpacing = computeSpacingGuidesOptimized(snappedBounds, spatialIndexRef.current)
        s.setSpacingGuides(resizeSpacing)

        s.setResizeLabel({
          x: snappedBounds.x + snappedBounds.width / 2,
          y: snappedBounds.y + snappedBounds.height,
          w: Math.round(snappedBounds.width),
          h: Math.round(snappedBounds.height),
        })

        const scaleMatrix = {
          scaleX: snappedBounds.width / activeDrag.originalBounds.width,
          scaleY: snappedBounds.height / activeDrag.originalBounds.height,
          offsetX:
            snappedBounds.x -
            activeDrag.originalBounds.x * (snappedBounds.width / activeDrag.originalBounds.width),
          offsetY:
            snappedBounds.y -
            activeDrag.originalBounds.y * (snappedBounds.height / activeDrag.originalBounds.height),
        }

        setScene((currentScene) => ({
          ...currentScene,
          elements: currentScene.elements.map((element) => {
            const dragElement = activeDrag.elements.find((el) => el.id === element.id)
            if (!dragElement) {
              return element
            }

            return {
              ...element,
              x: dragElement.x * scaleMatrix.scaleX + scaleMatrix.offsetX,
              y: dragElement.y * scaleMatrix.scaleY + scaleMatrix.offsetY,
              width: dragElement.width * scaleMatrix.scaleX,
              height: dragElement.height * scaleMatrix.scaleY,
            } as SceneElement
          }),
        }))
        markSceneEdited()
        return
      }

      if (activeDrag.mode === 'move') {
        s.setResizeLabel(null)
        const rawX = clamp(
          activeDrag.element.x + latest.dx,
          -activeDrag.element.width + 24,
          canvasWidth - 24,
        )
        const rawY = clamp(
          activeDrag.element.y + latest.dy,
          -activeDrag.element.height + 24,
          canvasHeight - 24,
        )

        const result = computeSnapOptimized(
          { x: rawX, y: rawY, width: activeDrag.element.width, height: activeDrag.element.height },
          spatialIndexRef.current,
          snapStateRef.current,
        )

        snapStateRef.current = result.snapState
        s.setGuides(result.guides)

        const spacing = computeSpacingGuidesOptimized(result.snappedRect, spatialIndexRef.current)
        s.setSpacingGuides(spacing)

        setScene((currentScene) => ({
          ...currentScene,
          elements: currentScene.elements.map((element) => {
            if (element.id !== activeDrag.id) {
              return element
            }

            return {
              ...element,
              x: result.snappedRect.x,
              y: result.snappedRect.y,
            } as SceneElement
          }),
        }))
        markSceneEdited()
        return
      }

      const rawWidth = clamp(
        activeDrag.element.width + latest.dx,
        minimumWidth(activeDrag.element),
        canvasWidth - activeDrag.element.x,
      )
      const rawHeight = clamp(
        activeDrag.element.height + latest.dy,
        minimumHeight(activeDrag.element),
        canvasHeight - activeDrag.element.y,
      )

      const resizeSnap = computeResizeSnapOptimized(
        { x: activeDrag.element.x, y: activeDrag.element.y, width: rawWidth, height: rawHeight },
        spatialIndexRef.current,
        resizeSnapStateRef.current,
      )

      resizeSnapStateRef.current = resizeSnap.snapState

      const snappedWidth = clamp(
        resizeSnap.snappedWidth,
        minimumWidth(activeDrag.element),
        canvasWidth - activeDrag.element.x,
      )
      const snappedHeight = clamp(
        resizeSnap.snappedHeight,
        minimumHeight(activeDrag.element),
        canvasHeight - activeDrag.element.y,
      )

      const snappedRect = {
        x: activeDrag.element.x,
        y: activeDrag.element.y,
        width: snappedWidth,
        height: snappedHeight,
      }

      const resizeGuides = computeGuidesOptimized(snappedRect, spatialIndexRef.current)
      s.setGuides(resizeGuides)

      const resizeSpacing = computeSpacingGuidesOptimized(snappedRect, spatialIndexRef.current)
      s.setSpacingGuides(resizeSpacing)

      s.setResizeLabel({
        x: activeDrag.element.x + snappedWidth / 2,
        y: activeDrag.element.y + snappedHeight,
        w: Math.round(snappedWidth),
        h: Math.round(snappedHeight),
      })

      setScene((currentScene) => ({
        ...currentScene,
        elements: currentScene.elements.map((element) => {
          if (element.id !== activeDrag.id) {
            return element
          }

          return {
            ...element,
            width: snappedWidth,
            height: snappedHeight,
          } as SceneElement
        }),
      }))
      markSceneEdited()
    }

    function handlePointerUp() {
      if (rafHandleRef.current !== 0) {
        cancelAnimationFrame(rafHandleRef.current)
        rafHandleRef.current = 0
      }
      latestMoveRef.current = null
      const s = useEditorStore.getState()
      s.setDrag(null)
      s.setGuides([])
      s.setSpacingGuides([])
      s.setResizeLabel(null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp, { once: true })

    return () => {
      if (rafHandleRef.current !== 0) {
        cancelAnimationFrame(rafHandleRef.current)
        rafHandleRef.current = 0
      }
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [drag, markSceneEdited, svgRef, setScene, canvasWidth, canvasHeight])

  const handleElementPointerDown = useCallback(
    (elementId: string, event: ReactPointerEvent<SVGGElement>) => {
      const svg = svgRef.current
      const element = scene.elements.find((item) => item.id === elementId)
      if (!svg || !element) {
        return
      }

      const isShiftPressed = event.shiftKey
      const wasSelected = isSelected(selection, elementId)

      setSelection(handleElementClick(selection, elementId, isShiftPressed))

      if (editingTextId && editingTextId !== elementId) {
        setEditingTextId(null)
      }

      if (element.locked) {
        return
      }

      const point = getSvgPoint(svg, event.clientX, event.clientY)

      if (wasSelected && selection.selectedIds.length > 1 && !isShiftPressed) {
        const selectedElements = scene.elements.filter(
          (el) => selection.selectedIds.includes(el.id) && !el.locked,
        )
        if (selectedElements.length > 0) {
          const otherElements = scene.elements.filter(
            (el) =>
              !selectedElements.some((sel) => sel.id === el.id) && !el.locked && el.hidden !== true,
          )
          spatialIndexRef.current = buildSpatialIndex(otherElements)

          useEditorStore.getState().setDrag({
            mode: 'group-move',
            startX: point.x,
            startY: point.y,
            elements: selectedElements.map((el) => ({ ...el })),
          })
          return
        }
      }

      const otherElements = scene.elements.filter(
        (el) => el.id !== elementId && !el.locked && el.hidden !== true,
      )
      spatialIndexRef.current = buildSpatialIndex(otherElements)

      pushPast({
        scene: { ...scene },
        selectedIds: selection.selectedIds,
        description: `移动元素「${element.name}」`,
        timestamp: Date.now(),
      })
      useEditorStore.getState().setDrag({
        id: elementId,
        mode: 'move',
        startX: point.x,
        startY: point.y,
        element: { ...element },
      })
    },
    [scene, selection, editingTextId, svgRef, setSelection, setEditingTextId, pushPast],
  )

  const handleResizePointerDown = useCallback(
    (elementId: string, event: ReactPointerEvent<SVGRectElement>) => {
      const svg = svgRef.current
      const element = scene.elements.find((item) => item.id === elementId)
      if (!svg || !element) {
        return
      }

      setSelection(selectSingle(selection, elementId))
      if (element.locked) {
        return
      }

      const otherElements = scene.elements.filter(
        (el) => el.id !== elementId && !el.locked && el.hidden !== true,
      )
      spatialIndexRef.current = buildSpatialIndex(otherElements)

      pushPast({
        scene: { ...scene },
        selectedIds: selection.selectedIds,
        description: `调整元素大小「${element.name}」`,
        timestamp: Date.now(),
      })
      const point = getSvgPoint(svg, event.clientX, event.clientY)
      useEditorStore.getState().setDrag({
        id: elementId,
        mode: 'resize',
        startX: point.x,
        startY: point.y,
        element: { ...element },
      })
    },
    [scene, selection, svgRef, setSelection, pushPast],
  )

  const handleGroupResizePointerDown = useCallback(
    (handle: ResizeHandleType, event: ReactPointerEvent<SVGRectElement>) => {
      const svg = svgRef.current
      if (!svg) {
        return
      }

      const selectedElements = scene.elements.filter(
        (el) => selection.selectedIds.includes(el.id) && !el.locked,
      )
      if (selectedElements.length === 0) {
        return
      }

      const otherElements = scene.elements.filter(
        (el) =>
          !selectedElements.some((sel) => sel.id === el.id) && !el.locked && el.hidden !== true,
      )
      spatialIndexRef.current = buildSpatialIndex(otherElements)

      const point = getSvgPoint(svg, event.clientX, event.clientY)
      useEditorStore
        .getState()
        .setDrag(createGroupResizeState(handle, point.x, point.y, selectedElements))
    },
    [scene, selection, svgRef],
  )

  const handleGroupDragPointerDown = useCallback(
    (event: ReactPointerEvent<SVGRectElement>) => {
      const svg = svgRef.current
      if (!svg) {
        return
      }

      const selectedElements = scene.elements.filter(
        (el) => selection.selectedIds.includes(el.id) && !el.locked,
      )
      if (selectedElements.length === 0) {
        return
      }

      const otherElements = scene.elements.filter(
        (el) =>
          !selectedElements.some((sel) => sel.id === el.id) && !el.locked && el.hidden !== true,
      )
      spatialIndexRef.current = buildSpatialIndex(otherElements)

      const point = getSvgPoint(svg, event.clientX, event.clientY)
      useEditorStore.getState().setDrag({
        mode: 'group-move',
        startX: point.x,
        startY: point.y,
        elements: selectedElements.map((el) => ({ ...el })),
      })
    },
    [scene, selection, svgRef],
  )

  return {
    spatialIndexRef,
    handleElementPointerDown,
    handleResizePointerDown,
    handleGroupResizePointerDown,
    handleGroupDragPointerDown,
  }
}
