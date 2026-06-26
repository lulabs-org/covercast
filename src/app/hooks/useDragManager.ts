'use client'

import {
  type PointerEvent as ReactPointerEvent,
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react'
import {
  DEFAULT_CANVAS_HEIGHT,
  DEFAULT_CANVAS_WIDTH,
  type Scene,
  createResizeSnapState,
  createSnapState,
  type GuideLine,
  type MeasurementGuide,
  type ResizeLabel,
  type ResizeSnapState,
  type SnapState,
  SpatialIndex,
  buildSpatialIndex,
  handleElementClick,
  isSelected,
  selectSingle,
  type SelectionState,
  createGroupResizeState,
  type ResizeHandleType,
  type DragState,
  computeDragFrame,
} from '@/domain'

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

export function useDragManager({
  scene,
  selection,
  editingTextId,
  svgRef,
  saveHistory,
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
  saveHistory: (description: string, snapshot: Scene) => void
  markSceneEdited: () => void
  setScene: React.Dispatch<React.SetStateAction<Scene>>
  setSelection: React.Dispatch<React.SetStateAction<SelectionState>>
  setEditingTextId: React.Dispatch<React.SetStateAction<string | null>>
  canvasWidth?: number
  canvasHeight?: number
}) {
  const [drag, setDrag] = useState<DragState | null>(null)
  const [guides, setGuides] = useState<GuideLine[]>([])
  const [spacingGuides, setSpacingGuides] = useState<MeasurementGuide[]>([])
  const [resizeLabel, setResizeLabel] = useState<ResizeLabel | null>(null)

  const snapStateRef = useRef<SnapState>(createSnapState())
  const resizeSnapStateRef = useRef<ResizeSnapState>(createResizeSnapState())
  const spatialIndexRef = useRef<SpatialIndex>(new SpatialIndex())
  const rafHandleRef = useRef<number>(0)
  const latestMoveRef = useRef<{ dx: number; dy: number; shiftKey: boolean } | null>(null)
  // 跟踪最新 scene,让 rAF 回调能拿到最新值而不依赖 effect 闭包
  const sceneRef = useRef<Scene>(scene)
  useEffect(() => {
    sceneRef.current = scene
  }, [scene])

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

      // 委托 domain/drag:纯变换计算(吸附 / clamp / scene 更新)
      const result = computeDragFrame(activeDrag, latest, sceneRef.current, {
        canvasWidth,
        canvasHeight,
        spatialIndex: spatialIndexRef.current,
        snapState: snapStateRef.current,
        resizeSnapState: resizeSnapStateRef.current,
      })

      // 副作用:更新吸附状态与 UI 状态
      snapStateRef.current = result.snapState
      resizeSnapStateRef.current = result.resizeSnapState
      setGuides(result.guides)
      setSpacingGuides(result.spacingGuides)
      setResizeLabel(result.resizeLabel)
      setScene(result.scene)
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

      saveHistory(`移动元素「${element.name}」`, scene)
      setDrag({
        id: elementId,
        mode: 'move',
        startX: point.x,
        startY: point.y,
        element: { ...element },
      })
    },
    [scene, selection, editingTextId, svgRef, setSelection, setEditingTextId, saveHistory],
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

      saveHistory(`调整元素大小「${element.name}」`, scene)
      const point = getSvgPoint(svg, event.clientX, event.clientY)
      setDrag({
        id: elementId,
        mode: 'resize',
        startX: point.x,
        startY: point.y,
        element: { ...element },
      })
    },
    [scene, selection, svgRef, setSelection, saveHistory],
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
      setDrag(createGroupResizeState(handle, point.x, point.y, selectedElements))
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
      setDrag({
        mode: 'group-move',
        startX: point.x,
        startY: point.y,
        elements: selectedElements.map((el) => ({ ...el })),
      })
    },
    [scene, selection, svgRef],
  )

  return {
    drag,
    guides,
    spacingGuides,
    resizeLabel,
    spatialIndexRef,
    setGuides,
    setSpacingGuides,
    handleElementPointerDown,
    handleResizePointerDown,
    handleGroupResizePointerDown,
    handleGroupDragPointerDown,
  }
}
