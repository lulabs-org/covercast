'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { type SceneElement } from '../lib/scene'
import { type HitTestStrategy } from '../lib/marquee'
import { useScrollVisibility } from './useScrollVisibility'
import { usePanelResize } from './usePanelResize'
import { useLocalFonts } from './useLocalFonts'
import { useLocalAssets } from './useLocalAssets'
import { useCreateBlankCover } from './useCreateBlankCover'
import { useSaveTemplateDialog } from './useSaveTemplateDialog'
import { useAssetManager } from './useAssetManager'
import { useExportScene } from './useExportScene'
import { useSceneLoader } from './useSceneLoader'
import { useDragManager } from './useDragManager'
import { useMarqueeSelection } from './useMarqueeSelection'
import { useClipboard } from './useClipboard'
import { useEditorShortcuts } from './useEditorShortcuts'
import { useSceneActions } from './useSceneActions'
import { useVisibleGuides } from './useVisibleGuides'
import { useSceneStore } from '../stores/useSceneStore'
import { useHistoryStore } from '../stores/useHistoryStore'
import { useCanvasStore } from '../stores/useCanvasStore'
import { useTemplateStore } from '../stores/useTemplateStore'
import { useInteractionStore } from '../stores/useInteractionStore'

const CANVAS_PREVIEW_MAX_WIDTH = 560
const STAGE_VIEWPORT_PADDING = 36

export type EditorBridge = ReturnType<typeof useEditorBridge>

export function useEditorBridge() {
  // ── Scene Store ──
  const scene = useSceneStore((s) => s.scene)
  const selection = useSceneStore((s) => s.selection)
  const editingTextId = useSceneStore((s) => s.editingTextId)
  const setScene = useSceneStore((s) => s.setScene)
  const setSelection = useSceneStore((s) => s.setSelection)
  const setEditingTextId = useSceneStore((s) => s.setEditingTextId)
  const changeScene = useSceneStore((s) => s.changeScene)
  const markSceneEdited = useSceneStore((s) => s.markSceneEdited)

  // ── History Store ──
  const saveHistory = useHistoryStore((s) => s.saveHistory)
  const undo = useHistoryStore((s) => s.undo)
  const redo = useHistoryStore((s) => s.redo)

  // ── Canvas Store ──
  const setStatus = useCanvasStore((s) => s.setStatus)
  const canvasSize = useCanvasStore((s) => s.canvasSize)
  const setCanvasSize = useCanvasStore((s) => s.setCanvasSize)
  const presets = useCanvasStore((s) => s.presets)
  const setAppOrigin = useCanvasStore((s) => s.setAppOrigin)

  // ── Template Store ──
  const customTemplates = useTemplateStore((s) => s.customTemplates)
  const setActiveTemplateId = useTemplateStore((s) => s.setActiveTemplateId)
  const saveCustomTemplateWithName = useTemplateStore((s) => s.saveCustomTemplateWithName)
  const saveCustomTemplateWithScene = useTemplateStore((s) => s.saveCustomTemplateWithScene)
  const exportTemplateJson = useTemplateStore((s) => s.exportTemplateJson)

  // ── Interaction Store ──
  const guidesSelectedIds = useInteractionStore((s) => s.guidesSelectedIds)
  const setGuidesSelectedIds = useInteractionStore((s) => s.setGuidesSelectedIds)

  // ── Refs ──
  const svgRef = useRef<SVGSVGElement>(null)
  const sceneElementsRef = useRef<SceneElement[]>(scene.elements)
  const selectedElementRef = useRef<SceneElement | null>(null)
  const customTemplatesRef = useRef(customTemplates)
  const [hitTestStrategy] = useState<HitTestStrategy>('intersection')

  // ── Layout hooks ──
  const { leftPanelRef, rightPanelRef, stageViewportRef } = useScrollVisibility()
  const { panelWidths, resizerLeftRef, resizerRightRef, handleMouseDown } = usePanelResize()

  // ── Local font manager ──
  const localFontManager = useLocalFonts()

  // ── Local assets ──
  const { resolveSrc } = useLocalAssets(scene)

  // ── Canvas zoom fit-width bridge (ResizeObserver) ──
  useEffect(() => {
    const viewport = stageViewportRef.current
    if (!viewport) return
    const currentViewport = viewport
    const canvasAspectRatio = canvasSize.width / canvasSize.height

    function updateFitWidth() {
      const availableWidth = Math.max(160, currentViewport.clientWidth - STAGE_VIEWPORT_PADDING)
      const availableHeight = Math.max(280, currentViewport.clientHeight - STAGE_VIEWPORT_PADDING)
      const nextFitWidth = Math.min(
        availableWidth,
        availableHeight * canvasAspectRatio,
        CANVAS_PREVIEW_MAX_WIDTH,
      )
      useCanvasStore.getState().setCanvasFitWidth(Math.max(160, nextFitWidth))
    }

    updateFitWidth()
    const observer = new ResizeObserver(updateFitWidth)
    observer.observe(currentViewport)
    window.addEventListener('resize', updateFitWidth)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateFitWidth)
    }
  }, [stageViewportRef, canvasSize.width, canvasSize.height])

  // ── Template store init ──
  useEffect(() => {
    const timer = window.setTimeout(() => {
      useTemplateStore.getState().initFromStorage()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  // ── Slot loading ──
  useEffect(() => {
    useTemplateStore.getState().loadSlots()
  }, [])

  // ── App origin ──
  useEffect(() => {
    const timer = window.setTimeout(() => setAppOrigin(window.location.origin), 0)
    return () => window.clearTimeout(timer)
  }, [setAppOrigin])

  // ── Computed ──
  const selectedElement = useMemo(() => {
    if (selection.selectedIds.length !== 1) return null
    return scene.elements.find((element) => element.id === selection.selectedIds[0]) ?? null
  }, [scene.elements, selection.selectedIds])

  // ── Sync refs ──
  useEffect(() => {
    sceneElementsRef.current = scene.elements
    selectedElementRef.current = selectedElement
  }, [scene.elements, selectedElement])

  useEffect(() => {
    customTemplatesRef.current = customTemplates
  }, [customTemplates])

  // ── Scene loader ──
  useSceneLoader({
    setScene,
    setStatus,
    setActiveTemplateId,
    setSelection,
  })

  // ── Export ──
  const { exportScene } = useExportScene(
    scene,
    setStatus,
    exportTemplateJson,
    canvasSize.width,
    canvasSize.height,
  )

  // ── Create blank cover ──
  const {
    isModalOpen: isCreateBlankCoverModalOpen,
    config: createBlankCoverConfig,
    openModal: openCreateBlankCoverModal,
    closeModal: closeCreateBlankCoverModal,
    updateConfig: updateCreateBlankCoverConfig,
    createBlankCover,
    presetOptions: createBlankCoverPresetOptions,
    templateOptions: createBlankCoverTemplateOptions,
  } = useCreateBlankCover({
    setScene,
    setSelection,
    setCanvasSize,
    setActiveTemplateId,
    setStatus,
    saveCustomTemplate: saveCustomTemplateWithScene,
    canvasSizePresets: presets,
    customTemplates,
  })

  // ── Save template dialog ──
  const saveTemplateDialog = useSaveTemplateDialog({
    customTemplates,
    onSave: saveCustomTemplateWithName,
  })

  // ── Asset manager ──
  const { handleAssetInput } = useAssetManager({
    setStatus,
    selectedElement,
    patchElement: (elementId, patch) => {
      changeScene(
        (currentScene) => ({
          ...currentScene,
          elements: currentScene.elements.map((el) =>
            el.id === elementId ? ({ ...el, ...patch } as SceneElement) : el,
          ),
        }),
        '修改元素属性',
      )
    },
    changeScene,
    selection,
    setSelection,
  })

  // ── Scene actions ──
  const {
    patchSelected,
    toggleElementHidden,
    toggleElementLocked,
    moveElementLayer,
    addTextElement,
    addRectElement,
    addEllipseElement,
    deleteSelected,
  } = useSceneActions({ scene, selection, changeScene, setSelection })

  // ── Marquee selection ──
  const { marquee, handleCanvasPointerDown } = useMarqueeSelection({
    svgRef,
    sceneElementsRef,
    hitTestStrategy,
    editingTextId,
    setSelection,
    setEditingTextId,
  })

  // ── Drag manager ──
  const {
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
  } = useDragManager({
    scene,
    selection,
    editingTextId,
    svgRef,
    saveHistory,
    markSceneEdited,
    setScene,
    setSelection,
    setEditingTextId,
    canvasWidth: canvasSize.width,
    canvasHeight: canvasSize.height,
  })

  // ── Visible guides ──
  const { visibleGuides, visibleSpacingGuides } = useVisibleGuides(
    guides,
    spacingGuides,
    selection.selectedIds,
    guidesSelectedIds,
  )

  // Sync visible guides to interaction store for StagePanel
  useEffect(() => {
    useInteractionStore.getState().setVisibleGuides(visibleGuides)
    useInteractionStore.getState().setVisibleSpacingGuides(visibleSpacingGuides)
  }, [visibleGuides, visibleSpacingGuides])

  // Sync marquee and drag state to interaction store for StagePanel
  useEffect(() => {
    useInteractionStore.getState().setMarquee(marquee)
  }, [marquee])

  useEffect(() => {
    useInteractionStore.getState().setDrag(drag)
    useInteractionStore.getState().setResizeLabel(resizeLabel)
  }, [drag, resizeLabel])

  // ── Clipboard ──
  const {
    elementClipboardRef,
    elementsClipboardRef,
    canPasteElement,
    copySelectedElements,
    pasteCopiedElements,
  } = useClipboard({
    selectedElementRef,
    sceneElementsRef,
    selectedIds: selection.selectedIds,
    changeScene,
    setSelection,
    markSceneEdited,
    setStatus,
    canvasWidth: canvasSize.width,
    canvasHeight: canvasSize.height,
  })

  // ── Editor shortcuts ──
  useEditorShortcuts({
    scene,
    selection,
    editingTextId,
    undo,
    redo,
    copySelectedElements,
    pasteCopiedElements,
    deleteSelected,
    selectedElementRef,
    elementClipboardRef,
    elementsClipboardRef,
    spatialIndexRef,
    setGuidesSelectedIds,
    setGuides,
    setSpacingGuides,
    setScene,
    markSceneEdited,
  })

  // ── Handlers ──
  function handleTextElementDoubleClick(elementId: string) {
    const element = scene.elements.find((item) => item.id === elementId)
    if (!element || element.type !== 'text') return
    setSelection({ selectedIds: [elementId] })
    setEditingTextId(elementId)
  }

  function handleOpenSaveTemplateDialog() {
    saveTemplateDialog.openDialog(useTemplateStore.getState().getActiveTemplate()?.name)
  }

  // ── Return bridge values ──
  return {
    // Layout
    leftPanelRef,
    rightPanelRef,
    stageViewportRef,
    panelWidths,
    resizerLeftRef,
    resizerRightRef,
    handleMouseDown,

    // Refs
    svgRef,
    resolveSrc,
    localFontManager,

    // Scene actions (bridge)
    toggleElementHidden,
    toggleElementLocked,
    moveElementLayer,
    addTextElement,
    addRectElement,
    addEllipseElement,
    deleteSelected,
    patchSelected: (patch: Partial<SceneElement>) => patchSelected(selectedElement, patch),

    // Asset
    handleAssetInput,

    // Clipboard
    canPasteElement,
    copySelectedElements,
    pasteCopiedElements,

    // Blank cover
    isCreateBlankCoverModalOpen,
    createBlankCoverConfig,
    openCreateBlankCoverModal,
    closeCreateBlankCoverModal,
    updateCreateBlankCoverConfig,
    createBlankCover,
    createBlankCoverPresetOptions,
    createBlankCoverTemplateOptions,

    // Save template dialog
    saveTemplateDialog,

    // Export
    exportScene,
    handleOpenSaveTemplateDialog,

    // Stage handlers
    handleCanvasPointerDown,
    handleElementPointerDown,
    handleResizePointerDown,
    handleGroupDragPointerDown,
    handleGroupResizePointerDown,
    handleTextElementDoubleClick,
  }
}
