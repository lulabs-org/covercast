"use client";

import {
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type WheelEvent as ReactWheelEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEFAULT_FONT_FAMILY,
  DEFAULT_TEMPLATE_ID,
  cloneScene,
  createDefaultScene,
  isShapeElement,
  isTextElement,
  type GradientDirection,
  type Scene,
  type SceneElement,
  type ShapeElement,
  type ShapeFillMode,
  type TextAlign,
  type TextElement,
} from "../lib/scene";
import {
  type GuideLine,
  type MeasurementGuide,
  type ResizeLabel,
  type GuideContext,
} from "../lib/smart-guide";
import {
  clearSelection,
  createSelectionState,
  selectSingle,
  type SelectionState,
} from "../lib/selection";
import {
  type HitTestStrategy,
} from "../lib/marquee";
import { useScrollVisibility } from "../lib/use-scroll-visibility";
import { usePanelResize } from "../lib/use-panel-resize";
import { useHistory } from "../hooks/useHistory";
import { useClipboard } from "../hooks/useClipboard";
import { useEditorShortcuts } from "../hooks/useEditorShortcuts";
import { useCanvasZoom } from "../hooks/useCanvasZoom";
import { useTemplateManager, type CustomSceneTemplate, type SceneSlotInfo } from "../hooks/useTemplateManager";
import { useSlotManager } from "../hooks/useSlotManager";
import { useDragManager } from "../hooks/useDragManager";
import { useMarqueeSelection } from "../hooks/useMarqueeSelection";
import { useExportScene, type ExportFormat, EXPORT_FORMAT_OPTIONS } from "../hooks/useExportScene";
import { useSceneActions } from "../hooks/useSceneActions";
import { useAssetManager } from "../hooks/useAssetManager";
import { useSceneLoader } from "../hooks/useSceneLoader";
import { useVisibleGuides } from "../hooks/useVisibleGuides";
import { TemplateSaveForm } from "./panels/TemplatePanel";
import { SceneToolbar } from "./editor/SceneToolbar";
import { StagePanel } from "./editor/StagePanel";
import { LeftSidebar } from "./editor/sidebar/LeftSidebar";
import { RightSidebar } from "./editor/sidebar/RightSidebar";

type SidebarSectionId = "scene" | "sources" | "templates" | "layers";

export default function SceneEditor() {
  const [scene, setScene] = useState<Scene>(() => createDefaultScene());
  const [selection, setSelection] = useState<SelectionState>(() => createSelectionState());
  const [hitTestStrategy, setHitTestStrategy] = useState<HitTestStrategy>("intersection");
  const [status, setStatus] = useState("正在读取本地场景...");
  const [appOrigin, setAppOrigin] = useState("");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [guidesSelectedIds, setGuidesSelectedIds] = useState<string[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const sceneElementsRef = useRef<SceneElement[]>(scene.elements);
  const selectedElementRef = useRef<SceneElement | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<SidebarSectionId, boolean>>({
    scene: false,
    sources: false,
    templates: false,
    layers: false,
  });
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const { leftPanelRef, rightPanelRef, stageViewportRef } = useScrollVisibility();
  const { panelWidths, resizerLeftRef, resizerRightRef, handleMouseDown } = usePanelResize();
  const {
    canvasZoom,
    canvasPreviewWidth,
    canvasZoomPercent,
    setCanvasZoomLevel,
    zoomCanvasIn,
    zoomCanvasOut,
    resetCanvasZoom,
    handleStageWheel,
    handleZoomSliderWheel,
    CANVAS_ZOOM_MIN,
    CANVAS_ZOOM_MAX,
    CANVAS_ZOOM_STEP,
  } = useCanvasZoom({ stageViewportRef });
  const { history, saveHistory, undo, redo } = useHistory({
    scene,
    selectedIds: selection.selectedIds,
    setScene,
    setSelection,
    setStatus,
  });
  const {
    templateSlots,
    activeSlotId,
    setActiveSlotId,
    setTemplateSlots,
    customTemplatesRef,
    addSlot,
    removeSlot,
    selectSlotForEditing,
    getSlotUrl,
    writeSlotNameToStorage,
  } = useSlotManager({
    setStatus,
    appOrigin,
  });
  const {
    customTemplates,
    customTemplateName,
    activeTemplateId,
    showTemplateForm,
    activeBuiltInTemplate,
    activeCustomTemplate,
    activeTemplate,
    hasUnsavedCustomTemplateChanges,
    setCustomTemplateName,
    setShowTemplateForm,
    setActiveTemplateId,
    applyTemplate,
    applyBuiltInTemplate,
    saveCustomTemplate,
    saveActiveCustomTemplate,
    deleteCustomTemplate,
    duplicateCustomTemplate,
    renameCustomTemplate,
    exportTemplateJson,
    importTemplateFile,
  } = useTemplateManager({
    scene,
    selection,
    setScene,
    setSelection,
    setStatus,
    templateSlots,
    setActiveSlotId,
  });

  const { exportScene } = useExportScene(scene, setStatus, exportTemplateJson);

  const activeSlot = templateSlots.find((slot) => slot.slotId === activeSlotId) ?? null;
  const editingContextCaption = activeCustomTemplate
    ? hasUnsavedCustomTemplateChanges
      ? "自定义模板有未保存修改"
      : "自定义模板已保存"
    : activeSlot?.name ?? "未选择 OBS 源";
  const markSceneEdited = useCallback(() => {
    if (activeCustomTemplate) {
      return;
    }

    if (activeBuiltInTemplate) {
      setActiveTemplateId("");
    }
  }, [activeBuiltInTemplate, activeCustomTemplate]);

  useEffect(() => {
    customTemplatesRef.current = customTemplates;
  }, [customTemplates, customTemplatesRef]);

  const {
    marquee,
    setMarquee,
    handleCanvasPointerDown,
  } = useMarqueeSelection({
    svgRef,
    sceneElementsRef,
    hitTestStrategy,
    editingTextId,
    setSelection,
    setEditingTextId,
  });

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
  });

  const selectedElement = useMemo(() => {
    if (selection.selectedIds.length !== 1) {
      return null;
    }
    return scene.elements.find((element) => element.id === selection.selectedIds[0]) ?? null;
  }, [scene.elements, selection.selectedIds]);

  const { visibleGuides, visibleSpacingGuides } = useVisibleGuides(
    guides,
    spacingGuides,
    selection.selectedIds,
    guidesSelectedIds
  );

  useEffect(() => {
    sceneElementsRef.current = scene.elements;
    selectedElementRef.current = selectedElement;
  }, [scene.elements, selectedElement]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAppOrigin(window.location.origin);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  function toggleSidebarSection(sectionId: SidebarSectionId) {
    setCollapsedSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  }

  const changeScene = useCallback((updater: (currentScene: Scene) => Scene, description?: string) => {
    if (description) {
      const currentSceneSnapshot = cloneScene(scene);
      saveHistory(description, currentSceneSnapshot);
    }
    setScene(updater);
    markSceneEdited();
  }, [scene, saveHistory, markSceneEdited]);

  const { elementClipboardRef, canPasteElement, copySelectedElement, pasteCopiedElement } = useClipboard({
    selectedElementRef,
    sceneElementsRef,
    changeScene,
    setSelection,
    markSceneEdited,
    setStatus,
  });

  useEditorShortcuts({
    scene,
    selection,
    editingTextId,
    undo,
    redo,
    copySelectedElement,
    pasteCopiedElement,
    selectedElementRef,
    elementClipboardRef,
    spatialIndexRef,
    setGuidesSelectedIds,
    setGuides,
    setSpacingGuides,
    setScene,
    markSceneEdited,
  });

  const {
    patchElement,
    patchSelected,
    toggleElementHidden,
    toggleElementLocked,
    moveElementLayer,
    addTextElement,
    addRectElement,
    addEllipseElement,
    deleteSelected,
  } = useSceneActions({
    scene,
    selection,
    changeScene,
    setSelection,
  });

  const { handleAssetInput } = useAssetManager({
    setStatus,
    selectedElement,
    patchElement,
    changeScene,
    selection,
    setSelection,
  });

  useSceneLoader({
    setScene,
    setStatus,
    setActiveTemplateId,
    setSelection,
  });

  function handleTextElementDoubleClick(elementId: string) {
    const element = scene.elements.find((item) => item.id === elementId);
    if (!element || element.type !== "text") {
      return;
    }
    
    setSelection(selectSingle(selection, elementId));
    setEditingTextId(elementId);
  }

  return (
    <main className="editor-shell">
      <SceneToolbar
        undo={undo}
        redo={redo}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        addTextElement={addTextElement}
        addRectElement={addRectElement}
        addEllipseElement={addEllipseElement}
        handleAssetInput={handleAssetInput}
        activeCustomTemplate={activeCustomTemplate}
        hasUnsavedCustomTemplateChanges={hasUnsavedCustomTemplateChanges}
        saveActiveCustomTemplate={saveActiveCustomTemplate}
        showTemplateForm={showTemplateForm}
        setShowTemplateForm={setShowTemplateForm}
        importTemplateFile={importTemplateFile}
        exportFormat={exportFormat}
        setExportFormat={setExportFormat}
        exportScene={exportScene}
        EXPORT_FORMAT_OPTIONS={EXPORT_FORMAT_OPTIONS}
      />

      <TemplateSaveForm
        show={showTemplateForm}
        activeCustomTemplate={activeCustomTemplate}
        customTemplateName={customTemplateName}
        onSetName={setCustomTemplateName}
        onSave={saveCustomTemplate}
        onCancel={() => setShowTemplateForm(false)}
      />

      <section className="editor-grid">
        <LeftSidebar
          leftPanelRef={leftPanelRef}
          leftPanelWidth={panelWidths.leftPanel}
          activeTemplate={activeCustomTemplate}
          hasUnsavedCustomTemplateChanges={hasUnsavedCustomTemplateChanges}
          editingContextCaption={editingContextCaption}
          collapsedSections={collapsedSections}
          toggleSidebarSection={toggleSidebarSection}
          scene={scene}
          changeScene={changeScene}
          templateSlots={templateSlots}
          customTemplates={customTemplates}
          activeSlotId={activeSlotId}
          addSlot={addSlot}
          removeSlot={removeSlot}
          selectSlotForEditing={selectSlotForEditing}
          writeSlotNameToStorage={writeSlotNameToStorage}
          setTemplateSlots={setTemplateSlots}
          getSlotUrl={getSlotUrl}
          setStatus={setStatus}
          activeTemplateId={activeTemplateId}
          applyBuiltInTemplate={applyBuiltInTemplate}
          applyTemplate={applyTemplate}
          duplicateCustomTemplate={duplicateCustomTemplate}
          renameCustomTemplate={renameCustomTemplate}
          deleteCustomTemplate={deleteCustomTemplate}
          selection={selection}
          setSelection={setSelection}
          toggleElementHidden={toggleElementHidden}
          toggleElementLocked={toggleElementLocked}
          moveElementLayer={moveElementLayer}
        />

        <div
          ref={resizerLeftRef}
          className="panel-resizer"
          onMouseDown={(e) => handleMouseDown("left", e)}
        />

        <StagePanel
          status={status}
          canvasZoom={canvasZoom}
          canvasZoomPercent={canvasZoomPercent}
          canvasPreviewWidth={canvasPreviewWidth}
          CANVAS_ZOOM_MIN={CANVAS_ZOOM_MIN}
          CANVAS_ZOOM_MAX={CANVAS_ZOOM_MAX}
          CANVAS_ZOOM_STEP={CANVAS_ZOOM_STEP}
          setCanvasZoomLevel={setCanvasZoomLevel}
          zoomCanvasIn={zoomCanvasIn}
          zoomCanvasOut={zoomCanvasOut}
          resetCanvasZoom={resetCanvasZoom}
          handleZoomSliderWheel={handleZoomSliderWheel}
          handleStageWheel={handleStageWheel}
          stageViewportRef={stageViewportRef}
          scene={scene}
          selectedIds={selection.selectedIds}
          guides={visibleGuides}
          spacingGuides={visibleSpacingGuides}
          resizeLabel={resizeLabel}
          svgRef={svgRef}
          marquee={marquee}
          hitTestStrategy={hitTestStrategy}
          editingTextId={editingTextId}
          isGroupDragging={drag?.mode === "group-move"}
          onCanvasPointerDown={handleCanvasPointerDown}
          onElementPointerDown={handleElementPointerDown}
          onResizePointerDown={handleResizePointerDown}
          onGroupDragPointerDown={handleGroupDragPointerDown}
          onGroupResizePointerDown={handleGroupResizePointerDown}
          onTextElementDoubleClick={handleTextElementDoubleClick}
        />

        <div
          ref={resizerRightRef}
          className="panel-resizer"
          onMouseDown={(e) => handleMouseDown("right", e)}
        />

        <RightSidebar
          rightPanelRef={rightPanelRef}
          rightPanelWidth={panelWidths.rightPanel}
          selectedElement={selectedElement}
          patchSelected={(patch) => patchSelected(selectedElement, patch)}
          copySelectedElement={copySelectedElement}
          pasteCopiedElement={pasteCopiedElement}
          canPasteElement={canPasteElement}
          deleteSelected={deleteSelected}
          handleAssetInput={handleAssetInput}
        />
      </section>
    </main>
  );
}
