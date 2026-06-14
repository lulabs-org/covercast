'use client'

import { type PointerEvent as ReactPointerEvent, useRef, useEffect, useCallback } from 'react'
import { DEFAULT_CANVAS_HEIGHT, DEFAULT_CANVAS_WIDTH, type Scene } from '@/lib/domain/scene'
import {
  createResizeSnapState,
  createSnapState,
  type ResizeSnapState,
  type SnapState,
} from '@/lib/algorithms'
import { SpatialIndex, buildSpatialIndex } from '@/lib/algorithms/spatial-index'
import {
  handleElementClick,
  isSelected,
  selectSingle,
  type SelectionState,
} from '@/lib/domain/selection'
import { createGroupResizeState, type ResizeHandleType } from '@/lib/algorithms/group-drag'
import { useSceneStore } from '@/stores/useSceneStore'
import { useInteractionStore } from '@/stores/useInteractionStore'
import { getSvgPoint } from './drag/utils'
import { processElementMove, type SingleMoveDragState } from './drag/processElementMove'
import { processElementResize, type SingleResizeDragState } from './drag/processElementResize'
import { processGroupMove } from './drag/processGroupMove'
import { processGroupResize } from './drag/processGroupResize'

export function useDragManager({
  scene,
  selection,
  editingTextId,
  svgRef,
  pushPast,
  markSceneEdited,
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
  canvasWidth?: number
  canvasHeight?: number
}) {
  // ── Store setters ──
  const setScene = useSceneStore((s) => s.setScene)
  const setSelection = useSceneStore((s) => s.setSelection)
  const setEditingTextId = useSceneStore((s) => s.setEditingTextId)
  const setDrag = useInteractionStore((s) => s.setDrag)
  const setGuides = useInteractionStore((s) => s.setGuides)
  const setSpacingGuides = useInteractionStore((s) => s.setSpacingGuides)
  const setResizeLabel = useInteractionStore((s) => s.setResizeLabel)

  // ── 交互状态 ──
  const drag = useInteractionStore((s) => s.drag)

  const snapStateRef = useRef<SnapState>(createSnapState())
  const resizeSnapStateRef = useRef<ResizeSnapState>(createResizeSnapState())
  const spatialIndexRef = useRef<SpatialIndex>(new SpatialIndex())
  const rafHandleRef = useRef<number>(0)
  const latestMoveRef = useRef<{ dx: number; dy: number; shiftKey: boolean } | null>(null)

  // ── 拖拽过程：pointermove + pointerup ──
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

      switch (activeDrag.mode) {
        case 'move': {
          const result = processElementMove(
            activeDrag as SingleMoveDragState,
            latest,
            spatialIndexRef.current,
            snapStateRef.current,
            canvasWidth,
            canvasHeight,
          )
          snapStateRef.current = result.nextSnapState
          setGuides(result.guides)
          setSpacingGuides(result.spacingGuides)
          setResizeLabel(result.resizeLabel)
          setScene(result.sceneUpdater)
          break
        }
        case 'resize': {
          const result = processElementResize(
            activeDrag as SingleResizeDragState,
            latest,
            spatialIndexRef.current,
            resizeSnapStateRef.current,
            canvasWidth,
            canvasHeight,
          )
          resizeSnapStateRef.current = result.nextSnapState
          setGuides(result.guides)
          setSpacingGuides(result.spacingGuides)
          setResizeLabel(result.resizeLabel)
          setScene(result.sceneUpdater)
          break
        }
        case 'group-move': {
          const result = processGroupMove(
            activeDrag,
            latest,
            spatialIndexRef.current,
            snapStateRef.current,
            canvasWidth,
            canvasHeight,
          )
          snapStateRef.current = result.nextSnapState
          setGuides(result.guides)
          setSpacingGuides(result.spacingGuides)
          setResizeLabel(result.resizeLabel)
          setScene(result.sceneUpdater)
          break
        }
        case 'group-resize': {
          const result = processGroupResize(
            activeDrag,
            latest,
            spatialIndexRef.current,
            resizeSnapStateRef.current,
            canvasWidth,
            canvasHeight,
          )
          resizeSnapStateRef.current = result.nextSnapState
          setGuides(result.guides)
          setSpacingGuides(result.spacingGuides)
          setResizeLabel(result.resizeLabel)
          setScene(result.sceneUpdater)
          break
        }
      }

      markSceneEdited()
    }

    function handlePointerUp() {
      if (rafHandleRef.current !== 0) {
        cancelAnimationFrame(rafHandleRef.current)
        rafHandleRef.current = 0
      }
      latestMoveRef.current = null
      setDrag(null)
      setGuides([])
      setSpacingGuides([])
      setResizeLabel(null)
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
  }, [
    drag,
    markSceneEdited,
    svgRef,
    setScene,
    setDrag,
    setGuides,
    setSpacingGuides,
    setResizeLabel,
    canvasWidth,
    canvasHeight,
  ])

  // ── 元素 pointerDown：选中 + 开始拖拽 ──
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

          setDrag({
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
      setDrag({
        id: elementId,
        mode: 'move',
        startX: point.x,
        startY: point.y,
        element: { ...element },
      })
    },
    [scene, selection, editingTextId, svgRef, setSelection, setEditingTextId, setDrag, pushPast],
  )

  // ── 单元素 resize handle pointerDown ──
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
      setDrag({
        id: elementId,
        mode: 'resize',
        startX: point.x,
        startY: point.y,
        element: { ...element },
      })
    },
    [scene, selection, svgRef, setSelection, setDrag, pushPast],
  )

  // ── 多元素 resize handle pointerDown ──
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
      setDrag(createGroupResizeState(handle, point.x, point.y, selectedElements))
    },
    [scene, selection, svgRef, setDrag],
  )

  // ── 多元素拖拽 pointerDown ──
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
      setDrag({
        mode: 'group-move',
        startX: point.x,
        startY: point.y,
        elements: selectedElements.map((el) => ({ ...el })),
      })
    },
    [scene, selection, svgRef, setDrag],
  )

  return {
    spatialIndexRef,
    handleElementPointerDown,
    handleResizePointerDown,
    handleGroupResizePointerDown,
    handleGroupDragPointerDown,
  }
}
