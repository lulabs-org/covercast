import { useEffect } from 'react'
import {
  type Scene,
  type SceneElement,
  computeGuidesOptimized,
  computeSpacingGuidesOptimized,
  type GuideLine,
  type MeasurementGuide,
  SpatialIndex,
  buildSpatialIndex,
  computeBoundingBox,
  type SelectionState,
  getArrowKeyDelta,
  moveElementsByDelta,
} from '@/domain'

function isCopyPasteModifier(event: KeyboardEvent) {
  return (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  )
}

type UseEditorShortcutsOptions = {
  scene: Scene
  selection: SelectionState
  editingTextId: string | null
  undo: () => void
  redo: () => void
  copySelectedElements: () => void
  pasteCopiedElements: () => void
  deleteSelected: () => void
  selectedElementRef: React.MutableRefObject<SceneElement | null>
  elementClipboardRef: React.MutableRefObject<SceneElement | null>
  elementsClipboardRef: React.MutableRefObject<SceneElement[] | null>
  spatialIndexRef: React.MutableRefObject<SpatialIndex>
  setGuidesSelectedIds: (ids: string[]) => void
  setGuides: (guides: GuideLine[]) => void
  setSpacingGuides: (guides: MeasurementGuide[]) => void
  setScene: (updater: (currentScene: Scene) => Scene) => void
  markSceneEdited: () => void
}

export function useEditorShortcuts(options: UseEditorShortcutsOptions) {
  const {
    scene,
    selection,
    editingTextId,
    undo,
    redo,
    copySelectedElements,
    pasteCopiedElements,
    deleteSelected,
    elementClipboardRef,
    elementsClipboardRef,
    spatialIndexRef,
    setGuidesSelectedIds,
    setGuides,
    setSpacingGuides,
    setScene,
    markSceneEdited,
  } = options

  useEffect(() => {
    function handleArrowKeys(event: KeyboardEvent) {
      const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']

      if (!arrowKeys.includes(event.key)) {
        return false
      }

      if (isEditableTarget(event.target) || editingTextId) {
        return false
      }

      if (selection.selectedIds.length === 0) {
        return false
      }

      const delta = getArrowKeyDelta(event.key, event.shiftKey)
      if (!delta) {
        return false
      }

      event.preventDefault()

      const hasSelectedUnlocked = scene.elements.some(
        (el) => selection.selectedIds.includes(el.id) && !el.locked,
      )
      if (!hasSelectedUnlocked) {
        return false
      }

      // 重建 spatialIndex(排除选中与 locked/hidden 元素)
      const otherElements = scene.elements.filter(
        (el) => !selection.selectedIds.includes(el.id) && !el.locked && el.hidden !== true,
      )
      spatialIndexRef.current = buildSpatialIndex(otherElements)

      // 委托 domain/keyboard:纯变换
      const result = moveElementsByDelta(scene, selection.selectedIds, delta.dx, delta.dy)

      if (result.movedElements.length > 0) {
        const movedBounds = computeBoundingBox(result.movedElements)
        const guides = computeGuidesOptimized(movedBounds, spatialIndexRef.current)
        const spacingGuides = computeSpacingGuidesOptimized(movedBounds, spatialIndexRef.current)

        setGuidesSelectedIds(selection.selectedIds)
        setGuides(guides)
        setSpacingGuides(spacingGuides)
      }

      setScene(() => result.scene)
      markSceneEdited()
      return true
    }

    function handleEditorKeyDown(event: KeyboardEvent) {
      const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']

      // 文本编辑模式下只放行 arrow-keys(用于光标移动)
      if (isEditableTarget(event.target) || editingTextId) {
        if (!arrowKeys.includes(event.key)) {
          return
        }
      }

      const key = event.key.toLowerCase()

      // Undo / Redo
      if ((event.metaKey || event.ctrlKey) && key === 'z') {
        event.preventDefault()
        if (event.shiftKey) {
          redo()
        } else {
          undo()
        }
        return
      }

      // Redo (Ctrl+Y / Cmd+Y)
      if (isCopyPasteModifier(event) && key === 'y') {
        event.preventDefault()
        redo()
        return
      }

      // Delete (Backspace / Delete)
      if (event.key === 'Backspace' || event.key === 'Delete') {
        if (isEditableTarget(event.target) || editingTextId) {
          return
        }

        if (selection.selectedIds.length === 0) {
          return
        }

        event.preventDefault()
        deleteSelected()
        return
      }

      // Arrow-key 移动
      if (handleArrowKeys(event)) {
        return
      }

      // Copy / Paste
      if (!isCopyPasteModifier(event) || isEditableTarget(event.target)) {
        return
      }

      if (key === 'c' && selection.selectedIds.length > 0) {
        event.preventDefault()
        copySelectedElements()
        return
      }

      if (key === 'v' && (elementClipboardRef.current || elementsClipboardRef.current)) {
        event.preventDefault()
        pasteCopiedElements()
      }
    }

    window.addEventListener('keydown', handleEditorKeyDown)

    return () => {
      window.removeEventListener('keydown', handleEditorKeyDown)
    }
  }, [
    copySelectedElements,
    pasteCopiedElements,
    deleteSelected,
    undo,
    redo,
    selection.selectedIds,
    editingTextId,
    scene,
    markSceneEdited,
    elementClipboardRef,
    elementsClipboardRef,
    setGuides,
    setGuidesSelectedIds,
    setScene,
    setSpacingGuides,
    spatialIndexRef,
  ])
}
