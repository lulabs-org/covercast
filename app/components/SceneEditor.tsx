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
  BUILT_IN_TEMPLATES,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEFAULT_FONT_FAMILY,
  DEFAULT_TEMPLATE_ID,
  cloneScene,
  createDefaultScene,
  createEllipseElement,
  createImageElement,
  createRectElement,
  createTextElement,
  isImageElement,
  isShapeElement,
  isTextElement,
  type ImageElement,
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
import { ElementInspector } from "./panels/ElementInspector";
import { LayerPanel } from "./panels/LayerPanel";
import { SourcesPanel } from "./panels/SourcesPanel";
import { TemplatePanel, TemplateSaveForm } from "./panels/TemplatePanel";
import { SceneToolbar } from "./editor/SceneToolbar";
import { StagePanel } from "./editor/StagePanel";

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

  const visibleGuides = useMemo(() => {
    const currentIds = selection.selectedIds;
    
    return guides.filter(guide => {
      if (!guide.mode) {
        return true;
      }
      
      if (guide.mode === "keyboard") {
        const idsMatch = guidesSelectedIds.length === currentIds.length && 
          guidesSelectedIds.every(id => currentIds.includes(id));
        return idsMatch;
      }
      
      return true;
    });
  }, [guides, selection.selectedIds, guidesSelectedIds]);

  const visibleSpacingGuides = useMemo(() => {
    const currentIds = selection.selectedIds;
    
    return spacingGuides.filter(guide => {
      if (!guide.mode) {
        return true;
      }
      
      if (guide.mode === "keyboard") {
        const idsMatch = guidesSelectedIds.length === currentIds.length && 
          guidesSelectedIds.every(id => currentIds.includes(id));
        return idsMatch;
      }
      
      return true;
    });
  }, [spacingGuides, selection.selectedIds, guidesSelectedIds]);

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

  useEffect(() => {
    let active = true;

    async function loadScene() {
      try {
        const response = await fetch("/api/scene", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Scene request failed");
        }

        const nextScene = (await response.json()) as Scene;
        if (active) {
          setScene(nextScene);
          setStatus("已读取本地场景");
          const matchingTemplateId = BUILT_IN_TEMPLATES.find(
            (template) => JSON.stringify(template.scene) === JSON.stringify(nextScene)
          )?.id ?? "";
          setActiveTemplateId(matchingTemplateId);
          if (nextScene.elements[0]?.id) {
            setSelection((prev) => selectSingle(prev, nextScene.elements[0].id));
          }
        }
      } catch {
        if (active) {
          setStatus("使用默认模板，保存后会写入本地场景");
        }
      }
    }

    void loadScene();

    return () => {
      active = false;
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

  function patchElement(elementId: string, patch: Partial<SceneElement>) {
    changeScene((currentScene) => ({
      ...currentScene,
      elements: currentScene.elements.map((element) =>
        element.id === elementId ? ({ ...element, ...patch } as SceneElement) : element,
      ),
    }), `修改元素属性`);
  }

  function patchSelected(patch: Partial<SceneElement>) {
    if (!selectedElement) {
      return;
    }

    patchElement(selectedElement.id, patch);
  }

  function toggleElementHidden(elementId: string) {
    changeScene((currentScene) => ({
      ...currentScene,
      elements: currentScene.elements.map((element) =>
        element.id === elementId
          ? ({ ...element, hidden: !element.hidden } as SceneElement)
          : element,
      ),
    }), `切换元素显示状态`);
  }

  function toggleElementLocked(elementId: string) {
    changeScene((currentScene) => ({
      ...currentScene,
      elements: currentScene.elements.map((element) =>
        element.id === elementId
          ? ({ ...element, locked: !element.locked } as SceneElement)
          : element,
      ),
    }), `切换元素锁定状态`);
  }

  function moveElementLayer(elementId: string, direction: "forward" | "backward") {
    changeScene((currentScene) => {
      const currentIndex = currentScene.elements.findIndex((element) => element.id === elementId);
      const nextIndex = direction === "forward" ? currentIndex + 1 : currentIndex - 1;

      if (
        currentIndex < 0 ||
        nextIndex < 0 ||
        nextIndex >= currentScene.elements.length
      ) {
        return currentScene;
      }

      const elements = [...currentScene.elements];
      [elements[currentIndex], elements[nextIndex]] = [elements[nextIndex], elements[currentIndex]];
      return { ...currentScene, elements };
    }, `调整图层顺序`);
    setSelection(selectSingle(selection, elementId));
  }

  function handleTextElementDoubleClick(elementId: string) {
    const element = scene.elements.find((item) => item.id === elementId);
    if (!element || element.type !== "text") {
      return;
    }
    
    setSelection(selectSingle(selection, elementId));
    setEditingTextId(elementId);
  }

  function addTextElement() {
    const element = createTextElement();
    changeScene((currentScene) => ({
      ...currentScene,
      elements: [...currentScene.elements, element],
    }), `添加文字元素`);
    setSelection(selectSingle(selection, element.id));
  }

  function addRectElement() {
    const element = createRectElement();
    changeScene((currentScene) => ({
      ...currentScene,
      elements: [...currentScene.elements, element],
    }), `添加矩形元素`);
    setSelection(selectSingle(selection, element.id));
  }

  function addEllipseElement() {
    const element = createEllipseElement();
    changeScene((currentScene) => ({
      ...currentScene,
      elements: [...currentScene.elements, element],
    }), `添加椭圆元素`);
    setSelection(selectSingle(selection, element.id));
  }

  async function uploadAsset(file: File, mode: "add" | "replace") {
    setStatus("正在上传素材...");

    const formData = new FormData();
    formData.append("asset", file);

    try {
      const response = await fetch("/api/assets", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const payload = (await response.json()) as { src: string; name: string };

      if (mode === "replace" && selectedElement && isImageElement(selectedElement)) {
        patchElement(selectedElement.id, {
          src: payload.src,
          alt: payload.name,
        } as Partial<ImageElement>);
        setStatus("素材已替换到当前画布");
        return;
      }

      const element = createImageElement(payload.src, payload.name || "自定义素材");
      changeScene((currentScene) => ({
        ...currentScene,
        elements: [...currentScene.elements, element],
      }));
      setSelection(selectSingle(selection, element.id));
      setStatus("素材已添加到当前画布");
    } catch {
      setStatus("素材上传失败，仅支持 PNG、JPG、WebP");
    }
  }

  function handleAssetInput(
    event: ChangeEvent<HTMLInputElement>,
    mode: "add" | "replace",
  ) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (file) {
      void uploadAsset(file, mode);
    }
  }

  function deleteSelected() {
    if (selection.selectedIds.length === 0) {
      return;
    }

    changeScene((currentScene) => {
      const elements = currentScene.elements.filter(
        (element) => !selection.selectedIds.includes(element.id),
      );
      return { ...currentScene, elements };
    }, `删除元素`);
    const remainingElement = scene.elements.find(
      (element) => !selection.selectedIds.includes(element.id),
    );
    if (remainingElement?.id) {
      setSelection(selectSingle(selection, remainingElement.id));
    } else {
      setSelection(clearSelection(selection));
    }
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
        <aside
          ref={leftPanelRef}
          className="left-panel"
          aria-label="Scene settings"
          style={{ width: `${panelWidths.leftPanel}px` }}
        >
          <div className="sidebar-context">
            <span className="context-label">当前编辑</span>
            <strong>
              {activeTemplate?.name ?? "自定义场景"}
              {hasUnsavedCustomTemplateChanges ? (
                <span className="unsaved-pill">未保存</span>
              ) : null}
            </strong>
            <small>{editingContextCaption}</small>
          </div>

          <SidebarSection
            title="场景"
            caption="941×1672 竖屏"
            collapsed={collapsedSections.scene}
            onToggle={() => toggleSidebarSection("scene")}
          >
            <div className="section-fields">
              <ColorField
                label="背景颜色"
                value={scene.backgroundColor}
                onChange={(value) =>
                  changeScene((currentScene) => ({
                    ...currentScene,
                    backgroundColor: value,
                  }))
                }
              />
              <OpacityField
                label="背景透明度"
                value={scene.backgroundOpacity}
                onChange={(value) =>
                  changeScene((currentScene) => ({
                    ...currentScene,
                    backgroundOpacity: value,
                  }))
                }
              />
            </div>
          </SidebarSection>

          <SourcesPanel
            templateSlots={templateSlots}
            customTemplates={customTemplates}
            activeSlotId={activeSlotId}
            collapsed={collapsedSections.sources}
            onToggle={() => toggleSidebarSection("sources")}
            onAddSlot={(templateId) => void addSlot(templateId)}
            onRemoveSlot={(templateId, slotId) => void removeSlot(templateId, slotId)}
            onSelectSlot={selectSlotForEditing}
            onRenameSlot={(templateId, slotId, newName) => {
              writeSlotNameToStorage(templateId, slotId, newName);
              setTemplateSlots((prev) =>
                prev.map((s) =>
                  s.templateId === templateId && s.slotId === slotId
                    ? { ...s, name: newName }
                    : s,
                ),
              );
            }}
            getSlotUrl={getSlotUrl}
            setStatus={setStatus}
          />

          <TemplatePanel
            customTemplates={customTemplates}
            activeTemplateId={activeTemplateId}
            hasUnsavedCustomTemplateChanges={hasUnsavedCustomTemplateChanges}
            collapsed={collapsedSections.templates}
            onToggle={() => toggleSidebarSection("templates")}
            onApplyBuiltInTemplate={applyBuiltInTemplate}
            onApplyCustomTemplate={applyTemplate}
            onDeleteCustomTemplate={deleteCustomTemplate}
          />

          <LayerPanel
            elements={scene.elements}
            selection={selection}
            collapsed={collapsedSections.layers}
            onToggle={() => toggleSidebarSection("layers")}
            onSelect={setSelection}
            onToggleHidden={toggleElementHidden}
            onToggleLocked={toggleElementLocked}
            onMoveLayer={moveElementLayer}
          />
        </aside>

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

        <aside
          ref={rightPanelRef}
          className="right-panel"
          aria-label="Selected element settings"
          style={{ width: `${panelWidths.rightPanel}px` }}
        >
          <PanelTitle
            title={selectedElement ? selectedElement.name : "未选择元素"}
            caption={selectedElement ? selectedElement.id : "点击画布元素进行编辑"}
          />

          {selectedElement ? (
            <ElementInspector
              element={selectedElement}
              onPatch={patchSelected}
              onCopy={copySelectedElement}
              onPaste={pasteCopiedElement}
              canPaste={canPasteElement}
              onDelete={deleteSelected}
              onReplaceImage={(event) => handleAssetInput(event, "replace")}
            />
          ) : (
            <p className="empty-state">选择文字、视频框或图片素材后，可在这里调整位置、大小和样式。</p>
          )}
        </aside>
      </section>
    </main>
  );
}

function PanelTitle({ title, caption }: { title: string; caption: string }) {
  return (
    <div className="panel-title">
      <h2>{title}</h2>
      <span>{caption}</span>
    </div>
  );
}

function SidebarSection({
  title,
  caption,
  collapsed,
  onToggle,
  children,
}: {
  title: string;
  caption: string;
  collapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="sidebar-section">
      <button
        type="button"
        className="sidebar-section-header"
        onClick={onToggle}
        aria-expanded={!collapsed}
      >
        <span>{title}</span>
        <small>{caption}</small>
        <b>{collapsed ? "＋" : "－"}</b>
      </button>
      {collapsed ? null : <div className="sidebar-section-body">{children}</div>}
    </section>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const colorValue = isHexColor(value) ? value : "#ffffff";

  return (
    <label className="field color-field">
      <span>{label}</span>
      <div>
        <input
          type="color"
          value={colorValue}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          placeholder="#ffffff"
        />
      </div>
    </label>
  );
}

function OpacityField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const opacity = clamp(value, 0, 1);

  return (
    <label className="field opacity-field">
      <span>{label}</span>
      <div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={opacity}
          onChange={(event) => onChange(Number(event.currentTarget.value))}
        />
        <input
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={opacity.toFixed(2)}
          onChange={(event) => {
            const nextValue = Number(event.currentTarget.value);
            if (Number.isFinite(nextValue)) {
              onChange(clamp(nextValue, 0, 1));
            }
          }}
        />
      </div>
    </label>
  );
}

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}
