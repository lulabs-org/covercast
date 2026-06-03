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
import { sceneToSvgMarkup } from "../lib/scene-svg";
import { computeGuidesOptimized, computeSnapOptimized, computeSpacingGuidesOptimized, computeResizeSnapOptimized, createResizeSnapState, createSnapState, type GuideLine, type MeasurementGuide, type ResizeLabel, type ResizeSnapState, type SnapState, type GuideContext } from "../lib/smart-guide";
import { SpatialIndex, buildSpatialIndex } from "../lib/spatial-index";
import {
  clearSelection,
  createSelectionState,
  handleElementClick,
  isSelected,
  selectMultiple,
  selectSingle,
  type SelectionState,
} from "../lib/selection";
import {
  clearMarquee,
  createMarqueeState,
  getMarqueeRect,
  hasMarqueeSize,
  hitTestElements,
  isMarqueeActive,
  startMarquee,
  updateMarquee,
  type HitTestStrategy,
  type MarqueeState,
} from "../lib/marquee";
import {
  computeBoundingBox,
  computeNewBoundsFromHandle,
  createGroupResizeState,
  type BoundingBox,
  type GroupDragState,
  type GroupResizeState,
  type ResizeHandleType,
} from "../lib/group-drag";
import { useScrollVisibility } from "../lib/use-scroll-visibility";
import { usePanelResize } from "../lib/use-panel-resize";
import { useHistory } from "../hooks/useHistory";
import { useClipboard } from "../hooks/useClipboard";
import { useEditorShortcuts } from "../hooks/useEditorShortcuts";
import { useCanvasZoom } from "../hooks/useCanvasZoom";
import { useTemplateManager, type CustomSceneTemplate, type SceneSlotInfo } from "../hooks/useTemplateManager";
import { useSlotManager } from "../hooks/useSlotManager";
import { ElementInspector } from "./panels/ElementInspector";
import { LayerPanel } from "./panels/LayerPanel";
import { SourcesPanel } from "./panels/SourcesPanel";
import { TemplatePanel, TemplateSaveForm, TemplateToolbarButtons } from "./panels/TemplatePanel";
import SceneCanvas from "./SceneCanvas";

type SingleDragState = {
  id: string;
  mode: "move" | "resize";
  startX: number;
  startY: number;
  element: SceneElement;
};

type DragState = SingleDragState | GroupDragState | GroupResizeState;

type SidebarSectionId = "scene" | "sources" | "templates" | "layers";
type ExportFormat = "png" | "jpeg" | "svg" | "json";

const EXPORT_FORMAT_OPTIONS: {
  extension: string;
  label: string;
  mimeType: string;
  value: ExportFormat;
}[] = [
  { extension: "png", label: "PNG", mimeType: "image/png", value: "png" },
  { extension: "jpg", label: "JPG", mimeType: "image/jpeg", value: "jpeg" },
  { extension: "svg", label: "SVG", mimeType: "image/svg+xml;charset=utf-8", value: "svg" },
  { extension: "json", label: "JSON", mimeType: "application/json;charset=utf-8", value: "json" },
];

export default function SceneEditor() {
  const [scene, setScene] = useState<Scene>(() => createDefaultScene());
  const [selection, setSelection] = useState<SelectionState>(() => createSelectionState());
  const [marquee, setMarquee] = useState<MarqueeState>(() => createMarqueeState());
  const [hitTestStrategy, setHitTestStrategy] = useState<HitTestStrategy>("intersection");
  const [status, setStatus] = useState("正在读取本地场景...");
  const [appOrigin, setAppOrigin] = useState("");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [drag, setDrag] = useState<DragState | null>(null);
  const [guides, setGuides] = useState<GuideLine[]>([]);
  const [spacingGuides, setSpacingGuides] = useState<MeasurementGuide[]>([]);
  const [resizeLabel, setResizeLabel] = useState<ResizeLabel | null>(null);
  const guidesSelectedIdsRef = useRef<string[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const sceneElementsRef = useRef<SceneElement[]>(scene.elements);
  const selectedElementRef = useRef<SceneElement | null>(null);
  const snapStateRef = useRef<SnapState>(createSnapState());
  const resizeSnapStateRef = useRef<ResizeSnapState>(createResizeSnapState());
  const spatialIndexRef = useRef<SpatialIndex>(new SpatialIndex());
  const rafHandleRef = useRef<number>(0);
  const latestMoveRef = useRef<{ dx: number; dy: number; shiftKey: boolean } | null>(null);
  const marqueeRafRef = useRef<number>(0);
  const latestMarqueeRef = useRef<{ x: number; y: number } | null>(null);
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

  useEffect(() => {
    customTemplatesRef.current = customTemplates;
  }, [customTemplates, customTemplatesRef]);

  const selectedElement = useMemo(() => {
    if (selection.selectedIds.length !== 1) {
      return null;
    }
    return scene.elements.find((element) => element.id === selection.selectedIds[0]) ?? null;
  }, [scene.elements, selection.selectedIds]);

  const visibleGuides = useMemo(() => {
    const guidesIds = guidesSelectedIdsRef.current;
    const currentIds = selection.selectedIds;
    
    return guides.filter(guide => {
      if (!guide.mode) {
        return true;
      }
      
      if (guide.mode === "keyboard") {
        const idsMatch = guidesIds.length === currentIds.length && 
          guidesIds.every(id => currentIds.includes(id));
        return idsMatch;
      }
      
      return true;
    });
  }, [guides, selection.selectedIds]);

  const visibleSpacingGuides = useMemo(() => {
    const guidesIds = guidesSelectedIdsRef.current;
    const currentIds = selection.selectedIds;
    
    return spacingGuides.filter(guide => {
      if (!guide.mode) {
        return true;
      }
      
      if (guide.mode === "keyboard") {
        const idsMatch = guidesIds.length === currentIds.length && 
          guidesIds.every(id => currentIds.includes(id));
        return idsMatch;
      }
      
      return true;
    });
  }, [spacingGuides, selection.selectedIds]);

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

  function toggleSidebarSection(sectionId: SidebarSectionId) {
    setCollapsedSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  }

  useEffect(() => {
    if (!drag) {
      return;
    }

    const activeDrag = drag;

    if (activeDrag.mode === "move" || activeDrag.mode === "group-move") {
      snapStateRef.current = createSnapState();
    } else {
      resizeSnapStateRef.current = createResizeSnapState();
    }

    function handlePointerMove(event: PointerEvent) {
      const svg = svgRef.current;
      if (!svg) {
        return;
      }

      const point = getSvgPoint(svg, event.clientX, event.clientY);
      latestMoveRef.current = {
        dx: point.x - activeDrag.startX,
        dy: point.y - activeDrag.startY,
        shiftKey: event.shiftKey,
      };

      if (rafHandleRef.current === 0) {
        rafHandleRef.current = requestAnimationFrame(processMoveFrame);
      }
    }

    function processMoveFrame() {
      rafHandleRef.current = 0;

      const latest = latestMoveRef.current;
      if (!latest) {
        return;
      }

      if (activeDrag.mode === "group-move") {
        const groupBox = computeBoundingBox(activeDrag.elements);
        const rawX = clamp(
          groupBox.x + latest.dx,
          -groupBox.width + 24,
          CANVAS_WIDTH - 24,
        );
        const rawY = clamp(
          groupBox.y + latest.dy,
          -groupBox.height + 24,
          CANVAS_HEIGHT - 24,
        );

        const groupRect = {
          x: rawX,
          y: rawY,
          width: groupBox.width,
          height: groupBox.height,
        };

        const result = computeSnapOptimized(
          groupRect,
          spatialIndexRef.current,
          snapStateRef.current,
        );

        snapStateRef.current = result.snapState;
        setGuides(result.guides);

        const spacing = computeSpacingGuidesOptimized(
          result.snappedRect,
          spatialIndexRef.current,
        );
        setSpacingGuides(spacing);

        setResizeLabel(null);

        const groupDeltaX = result.snappedRect.x - groupBox.x;
        const groupDeltaY = result.snappedRect.y - groupBox.y;

        setScene((currentScene) => ({
          ...currentScene,
          elements: currentScene.elements.map((element) => {
            const dragElement = activeDrag.elements.find((el) => el.id === element.id);
            if (!dragElement) {
              return element;
            }

            return {
              ...element,
              x: dragElement.x + groupDeltaX,
              y: dragElement.y + groupDeltaY,
            } as SceneElement;
          }),
        }));
        markSceneEdited();
        return;
      }

      if (activeDrag.mode === "group-resize") {
        const newBounds = computeNewBoundsFromHandle(
          activeDrag.originalBounds,
          activeDrag.handle,
          latest,
          latest.shiftKey,
        );

        const clampedBounds: BoundingBox = {
          x: clamp(newBounds.x, 0, CANVAS_WIDTH - 10),
          y: clamp(newBounds.y, 0, CANVAS_HEIGHT - 10),
          width: clamp(newBounds.width, 10, CANVAS_WIDTH - newBounds.x),
          height: clamp(newBounds.height, 10, CANVAS_HEIGHT - newBounds.y),
        };

        const resizeSnap = computeResizeSnapOptimized(
          clampedBounds,
          spatialIndexRef.current,
          resizeSnapStateRef.current,
        );

        resizeSnapStateRef.current = resizeSnap.snapState;

        const snappedBounds: BoundingBox = {
          x: clampedBounds.x,
          y: clampedBounds.y,
          width: clamp(resizeSnap.snappedWidth, 10, CANVAS_WIDTH - clampedBounds.x),
          height: clamp(resizeSnap.snappedHeight, 10, CANVAS_HEIGHT - clampedBounds.y),
        };

        const resizeGuides = computeGuidesOptimized(snappedBounds, spatialIndexRef.current);
        setGuides(resizeGuides);

        const resizeSpacing = computeSpacingGuidesOptimized(snappedBounds, spatialIndexRef.current);
        setSpacingGuides(resizeSpacing);

        setResizeLabel({
          x: snappedBounds.x + snappedBounds.width / 2,
          y: snappedBounds.y + snappedBounds.height,
          w: Math.round(snappedBounds.width),
          h: Math.round(snappedBounds.height),
        });

        const scaleMatrix = {
          scaleX: snappedBounds.width / activeDrag.originalBounds.width,
          scaleY: snappedBounds.height / activeDrag.originalBounds.height,
          offsetX: snappedBounds.x - activeDrag.originalBounds.x * (snappedBounds.width / activeDrag.originalBounds.width),
          offsetY: snappedBounds.y - activeDrag.originalBounds.y * (snappedBounds.height / activeDrag.originalBounds.height),
        };

        setScene((currentScene) => ({
          ...currentScene,
          elements: currentScene.elements.map((element) => {
            const dragElement = activeDrag.elements.find((el) => el.id === element.id);
            if (!dragElement) {
              return element;
            }

            return {
              ...element,
              x: dragElement.x * scaleMatrix.scaleX + scaleMatrix.offsetX,
              y: dragElement.y * scaleMatrix.scaleY + scaleMatrix.offsetY,
              width: dragElement.width * scaleMatrix.scaleX,
              height: dragElement.height * scaleMatrix.scaleY,
            } as SceneElement;
          }),
        }));
        markSceneEdited();
        return;
      }

      if (activeDrag.mode === "move") {
        setResizeLabel(null);
        const rawX = clamp(
          activeDrag.element.x + latest.dx,
          -activeDrag.element.width + 24,
          CANVAS_WIDTH - 24,
        );
        const rawY = clamp(
          activeDrag.element.y + latest.dy,
          -activeDrag.element.height + 24,
          CANVAS_HEIGHT - 24,
        );

        const result = computeSnapOptimized(
          { x: rawX, y: rawY, width: activeDrag.element.width, height: activeDrag.element.height },
          spatialIndexRef.current,
          snapStateRef.current,
        );

        snapStateRef.current = result.snapState;
        setGuides(result.guides);

        const spacing = computeSpacingGuidesOptimized(
          result.snappedRect,
          spatialIndexRef.current,
        );
        setSpacingGuides(spacing);

        setScene((currentScene) => ({
          ...currentScene,
          elements: currentScene.elements.map((element) => {
            if (element.id !== activeDrag.id) {
              return element;
            }

            return {
              ...element,
              x: result.snappedRect.x,
              y: result.snappedRect.y,
            } as SceneElement;
          }),
        }));
        markSceneEdited();
        return;
      }

      const rawWidth = clamp(
        activeDrag.element.width + latest.dx,
        minimumWidth(activeDrag.element),
        CANVAS_WIDTH - activeDrag.element.x,
      );
      const rawHeight = clamp(
        activeDrag.element.height + latest.dy,
        minimumHeight(activeDrag.element),
        CANVAS_HEIGHT - activeDrag.element.y,
      );

      const resizeSnap = computeResizeSnapOptimized(
        { x: activeDrag.element.x, y: activeDrag.element.y, width: rawWidth, height: rawHeight },
        spatialIndexRef.current,
        resizeSnapStateRef.current,
      );

      resizeSnapStateRef.current = resizeSnap.snapState;

      const snappedWidth = clamp(
        resizeSnap.snappedWidth,
        minimumWidth(activeDrag.element),
        CANVAS_WIDTH - activeDrag.element.x,
      );
      const snappedHeight = clamp(
        resizeSnap.snappedHeight,
        minimumHeight(activeDrag.element),
        CANVAS_HEIGHT - activeDrag.element.y,
      );

      const snappedRect = {
        x: activeDrag.element.x,
        y: activeDrag.element.y,
        width: snappedWidth,
        height: snappedHeight,
      };

      const resizeGuides = computeGuidesOptimized(snappedRect, spatialIndexRef.current);
      setGuides(resizeGuides);

      const resizeSpacing = computeSpacingGuidesOptimized(snappedRect, spatialIndexRef.current);
      setSpacingGuides(resizeSpacing);

      setResizeLabel({
        x: activeDrag.element.x + snappedWidth / 2,
        y: activeDrag.element.y + snappedHeight,
        w: Math.round(snappedWidth),
        h: Math.round(snappedHeight),
      });

      setScene((currentScene) => ({
        ...currentScene,
        elements: currentScene.elements.map((element) => {
          if (element.id !== activeDrag.id) {
            return element;
          }

          return {
            ...element,
            width: snappedWidth,
            height: snappedHeight,
          } as SceneElement;
        }),
      }));
      markSceneEdited();
    }

    function handlePointerUp() {
      if (rafHandleRef.current !== 0) {
        cancelAnimationFrame(rafHandleRef.current);
        rafHandleRef.current = 0;
      }
      latestMoveRef.current = null;
      setDrag(null);
      setGuides([]);
      setSpacingGuides([]);
      setResizeLabel(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });

    return () => {
      if (rafHandleRef.current !== 0) {
        cancelAnimationFrame(rafHandleRef.current);
        rafHandleRef.current = 0;
      }
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [drag, markSceneEdited]);

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
    guidesSelectedIdsRef,
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

  function handleElementPointerDown(
    elementId: string,
    event: ReactPointerEvent<SVGGElement>,
  ) {
    const svg = svgRef.current;
    const element = scene.elements.find((item) => item.id === elementId);
    if (!svg || !element) {
      return;
    }

    const isShiftPressed = event.shiftKey;
    const wasSelected = isSelected(selection, elementId);

    setSelection(handleElementClick(selection, elementId, isShiftPressed));
    
    if (editingTextId && editingTextId !== elementId) {
      setEditingTextId(null);
    }

    if (element.locked) {
      return;
    }

    const point = getSvgPoint(svg, event.clientX, event.clientY);

    if (wasSelected && selection.selectedIds.length > 1 && !isShiftPressed) {
      const selectedElements = scene.elements.filter(
        (el) => selection.selectedIds.includes(el.id) && !el.locked
      );
      if (selectedElements.length > 0) {
        const otherElements = scene.elements.filter(
          (el) => !selectedElements.some((sel) => sel.id === el.id) && !el.locked && el.hidden !== true
        );
        spatialIndexRef.current = buildSpatialIndex(otherElements);

        setDrag({
          mode: "group-move",
          startX: point.x,
          startY: point.y,
          elements: selectedElements.map((el) => ({ ...el })),
        });
        return;
      }
    }

    const otherElements = scene.elements.filter(
      (el) => el.id !== elementId && !el.locked && el.hidden !== true
    );
    spatialIndexRef.current = buildSpatialIndex(otherElements);

    saveHistory(`移动元素「${element.name}」`);
    setDrag({
      id: elementId,
      mode: "move",
      startX: point.x,
      startY: point.y,
      element: { ...element },
    });
  }

  function handleTextElementDoubleClick(elementId: string) {
    const element = scene.elements.find((item) => item.id === elementId);
    if (!element || element.type !== "text") {
      return;
    }
    
    setSelection(selectSingle(selection, elementId));
    setEditingTextId(elementId);
  }

  function handleResizePointerDown(
    elementId: string,
    event: ReactPointerEvent<SVGRectElement>,
  ) {
    const svg = svgRef.current;
    const element = scene.elements.find((item) => item.id === elementId);
    if (!svg || !element) {
      return;
    }

    setSelection(selectSingle(selection, elementId));
    if (element.locked) {
      return;
    }

    const otherElements = scene.elements.filter(
      (el) => el.id !== elementId && !el.locked && el.hidden !== true
    );
    spatialIndexRef.current = buildSpatialIndex(otherElements);

    saveHistory(`调整元素大小「${element.name}」`);
    const point = getSvgPoint(svg, event.clientX, event.clientY);
    setDrag({
      id: elementId,
      mode: "resize",
      startX: point.x,
      startY: point.y,
      element: { ...element },
    });
  }

  function handleGroupResizePointerDown(
    handle: ResizeHandleType,
    event: ReactPointerEvent<SVGRectElement>,
  ) {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }

    const selectedElements = scene.elements.filter(
      (el) => selection.selectedIds.includes(el.id) && !el.locked,
    );
    if (selectedElements.length === 0) {
      return;
    }

    const otherElements = scene.elements.filter(
      (el) => !selectedElements.some((sel) => sel.id === el.id) && !el.locked && el.hidden !== true
    );
    spatialIndexRef.current = buildSpatialIndex(otherElements);

    const point = getSvgPoint(svg, event.clientX, event.clientY);
    setDrag(createGroupResizeState(handle, point.x, point.y, selectedElements));
  }

  function handleGroupDragPointerDown(
    event: ReactPointerEvent<SVGRectElement>,
  ) {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }

    const selectedElements = scene.elements.filter(
      (el) => selection.selectedIds.includes(el.id) && !el.locked,
    );
    if (selectedElements.length === 0) {
      return;
    }

    const otherElements = scene.elements.filter(
      (el) => !selectedElements.some((sel) => sel.id === el.id) && !el.locked && el.hidden !== true
    );
    spatialIndexRef.current = buildSpatialIndex(otherElements);

    const point = getSvgPoint(svg, event.clientX, event.clientY);
    setDrag({
      mode: "group-move",
      startX: point.x,
      startY: point.y,
      elements: selectedElements.map((el) => ({ ...el })),
    });
  }

  function handleCanvasPointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }

    const point = getSvgPoint(svg, event.clientX, event.clientY);
    const isShiftPressed = event.shiftKey;

    if (!isShiftPressed) {
      setSelection((prev) => clearSelection(prev));
    }
    
    if (editingTextId) {
      setEditingTextId(null);
    }

    setMarquee((prev) => startMarquee(prev, point.x, point.y));
  }

  useEffect(() => {
    if (!isMarqueeActive(marquee)) {
      return;
    }

    function handlePointerMove(event: PointerEvent) {
      const svg = svgRef.current;
      if (!svg) {
        return;
      }

      const point = getSvgPoint(svg, event.clientX, event.clientY);
      latestMarqueeRef.current = { x: point.x, y: point.y };

      if (marqueeRafRef.current === 0) {
        marqueeRafRef.current = requestAnimationFrame(processMarqueeFrame);
      }
    }

    function processMarqueeFrame() {
      marqueeRafRef.current = 0;

      const latest = latestMarqueeRef.current;
      if (!latest) {
        return;
      }

      setMarquee((prev) => updateMarquee(prev, latest.x, latest.y));
    }

    function handlePointerUp(event: PointerEvent) {
      const svg = svgRef.current;
      if (!svg) {
        setMarquee((prev) => clearMarquee(prev));
        return;
      }

      const isShiftPressed = event.shiftKey;

      setMarquee((prevMarquee) => {
        if (hasMarqueeSize(prevMarquee, 5)) {
          const rect = getMarqueeRect(prevMarquee);
          const hitIds = hitTestElements(rect, sceneElementsRef.current, hitTestStrategy);

          if (hitIds.length > 0) {
            setSelection((prevSelection) => selectMultiple(prevSelection, hitIds, isShiftPressed));
          } else if (!isShiftPressed) {
            setSelection((prevSelection) => clearSelection(prevSelection));
          }
        }

        return clearMarquee(prevMarquee);
      });
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });

    return () => {
      if (marqueeRafRef.current !== 0) {
        cancelAnimationFrame(marqueeRafRef.current);
        marqueeRafRef.current = 0;
      }
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [marquee, hitTestStrategy]);

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

  async function exportScene(format: ExportFormat) {
    const formatOption = EXPORT_FORMAT_OPTIONS.find((option) => option.value === format)
      ?? EXPORT_FORMAT_OPTIONS[0];
    setStatus(`正在导出 ${formatOption.label}...`);

    try {
      if (format === "json") {
        exportTemplateJson();
        return;
      }

      const exportScene = await inlineSceneAssets(scene);
      const svgMarkup = sceneToSvgMarkup(exportScene);
      const filename = `covercast-${new Date().toISOString().slice(0, 10)}.${formatOption.extension}`;

      if (format === "svg") {
        downloadBlob(new Blob([svgMarkup], { type: formatOption.mimeType }), filename);
      } else {
        const canvas = await renderSvgToCanvas(svgMarkup, format === "jpeg" ? "#ffffff" : null);
        const blob = await canvasToBlob(
          canvas,
          formatOption.mimeType,
          format === "jpeg" ? 0.92 : undefined,
        );
        downloadBlob(blob, filename);
      }

      setStatus(`${formatOption.label} 已导出，尺寸 ${CANVAS_WIDTH}×${CANVAS_HEIGHT}`);
    } catch {
      setStatus("导出失败，请确认所有素材都能正常显示");
    }
  }

  return (
    <main className="editor-shell">
      <section className="editor-toolbar" aria-label="Covercast editor controls">
        <div>
          <p className="eyebrow">Covercast</p>
          <h1>直播背景编辑器</h1>
        </div>
        <div className="toolbar-actions">
          <button 
            type="button" 
            className="secondary-button"
            onClick={undo}
            disabled={history.past.length === 0}
            title="撤销 (Ctrl+Z)"
          >
            ↶
          </button>
          <button 
            type="button" 
            className="secondary-button"
            onClick={redo}
            disabled={history.future.length === 0}
            title="重做 (Ctrl+Shift+Z 或 Ctrl+Y)"
          >
            ↷
          </button>
          <button type="button" className="secondary-button" onClick={addTextElement}>
            添加文字
          </button>
          <button type="button" className="secondary-button" onClick={addRectElement}>
            添加矩形
          </button>
          <button type="button" className="secondary-button" onClick={addEllipseElement}>
            添加椭圆
          </button>
          <label className="secondary-button file-button">
            添加图片
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => handleAssetInput(event, "add")}
            />
          </label>
          {activeCustomTemplate ? (
            <button
              type="button"
              className="primary-button"
              onClick={saveActiveCustomTemplate}
              disabled={!hasUnsavedCustomTemplateChanges}
              title={hasUnsavedCustomTemplateChanges ? "覆盖保存当前自定义模板" : "当前模板没有未保存修改"}
            >
              保存模板
            </button>
          ) : null}
          <TemplateToolbarButtons
            showTemplateForm={showTemplateForm}
            activeCustomTemplate={activeCustomTemplate}
            onToggleSaveForm={() => setShowTemplateForm((visible) => !visible)}
            onImport={(file) => void importTemplateFile(file)}
          />
          <div className="export-control" aria-label="导出场景">
            <select
              className="export-format-select"
              value={exportFormat}
              onChange={(event) => setExportFormat(event.currentTarget.value as ExportFormat)}
              title="选择导出格式"
            >
              {EXPORT_FORMAT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="primary-button muted"
              onClick={() => void exportScene(exportFormat)}
            >
              导出
            </button>
          </div>
        </div>
      </section>

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

        <section className="stage-panel" aria-label="Canvas preview">
          <div className="stage-header">
            <span className="stage-status">{status}</span>
            <div className="stage-header-tools">
              <span>拖拽移动，右下角黄点缩放</span>
              <div className="canvas-zoom-controls" aria-label="画布缩放" onWheel={handleZoomSliderWheel}>
                <button
                  type="button"
                  className="zoom-button"
                  onClick={zoomCanvasOut}
                  disabled={canvasZoom <= CANVAS_ZOOM_MIN}
                  title="缩小画布"
                >
                  -
                </button>
                <label className="zoom-slider-label">
                  <span>{canvasZoomPercent}%</span>
                  <input
                    type="range"
                    min={CANVAS_ZOOM_MIN}
                    max={CANVAS_ZOOM_MAX}
                    step={CANVAS_ZOOM_STEP}
                    value={canvasZoom}
                    onChange={(event) => setCanvasZoomLevel(Number(event.currentTarget.value))}
                    title="调整画布缩放"
                  />
                </label>
                <button
                  type="button"
                  className="zoom-button"
                  onClick={zoomCanvasIn}
                  disabled={canvasZoom >= CANVAS_ZOOM_MAX}
                  title="放大画布"
                >
                  +
                </button>
                <button
                  type="button"
                  className="zoom-fit-button"
                  onClick={resetCanvasZoom}
                  disabled={canvasZoom === 1}
                  title="恢复适配视图"
                >
                  适配
                </button>
              </div>
            </div>
          </div>
          <div
            className="stage-viewport"
            ref={stageViewportRef}
            onWheel={handleStageWheel}
          >
            <div className="stage-viewport-inner">
              <div
                className="scene-preview-frame"
                style={{ width: canvasPreviewWidth }}
              >
                <SceneCanvas
                  scene={scene}
                  className="scene-preview"
                  idPrefix="editor"
                  interactive
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
              </div>
            </div>
          </div>
        </section>

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

async function inlineSceneAssets(scene: Scene): Promise<Scene> {
  const elements = await Promise.all(
    scene.elements.map(async (element) => {
      if (!isImageElement(element) || !element.src || element.src.startsWith("data:")) {
        return element;
      }

      const response = await fetch(element.src, { cache: "no-store" });
      if (!response.ok) {
        return element;
      }

      const blob = await response.blob();
      const dataUrl = await blobToDataUrl(blob);
      return { ...element, src: dataUrl } satisfies ImageElement;
    }),
  );

  return { ...scene, elements };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function renderSvgToCanvas(
  svgMarkup: string,
  backgroundColor: string | null,
): Promise<HTMLCanvasElement> {
  const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    return await new Promise<HTMLCanvasElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Canvas context unavailable"));
          return;
        }

        if (backgroundColor) {
          context.fillStyle = backgroundColor;
          context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }

        context.drawImage(image, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        resolve(canvas);
      };
      image.onerror = () => reject(new Error("SVG render failed"));
      image.src = svgUrl;
    });
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas export failed"));
          return;
        }

        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const download = document.createElement("a");
  download.href = objectUrl;
  download.download = filename;
  document.body.appendChild(download);
  download.click();
  download.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

function getSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const matrix = svg.getScreenCTM();

  if (!matrix) {
    return { x: 0, y: 0 };
  }

  const nextPoint = point.matrixTransform(matrix.inverse());
  return { x: nextPoint.x, y: nextPoint.y };
}

function minimumWidth(element: SceneElement) {
  if (isTextElement(element)) {
    return 40;
  }

  if (element.type === "ellipse") {
    return 14;
  }

  return 28;
}

function minimumHeight(element: SceneElement) {
  if (isTextElement(element)) {
    return Math.max(24, element.fontSize);
  }

  if (element.type === "ellipse") {
    return 14;
  }

  return 28;
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
