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
import SceneCanvas from "./SceneCanvas";

type SingleDragState = {
  id: string;
  mode: "move" | "resize";
  startX: number;
  startY: number;
  element: SceneElement;
};

type DragState = SingleDragState | GroupDragState | GroupResizeState;

type CustomSceneTemplate = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
  scene: Scene;
};

type SceneSlotInfo = {
  templateId: string;
  slotId: string;
  name: string;
};

const TEMPLATE_EXPORT_FORMAT = "covercast.template";
const CUSTOM_FONT_FAMILY_VALUE = "__custom-font-family__";
const CANVAS_ASPECT_RATIO = CANVAS_WIDTH / CANVAS_HEIGHT;
const CANVAS_ZOOM_MIN = 0.25;
const CANVAS_ZOOM_MAX = 3;
const CANVAS_ZOOM_STEP = 0.1;
const CANVAS_PREVIEW_MAX_WIDTH = 560;
const STAGE_VIEWPORT_PADDING = 36;

type SidebarSectionId = "scene" | "sources" | "templates" | "layers";
type ExportFormat = "png" | "jpeg" | "svg" | "json";
type TemplateExportPayload = {
  format: typeof TEMPLATE_EXPORT_FORMAT;
  version: 1;
  template: CustomSceneTemplate;
};

const CUSTOM_TEMPLATE_STORAGE_KEY = "covercast.customTemplates.v1";
const SLOT_NAMES_STORAGE_KEY = "covercast.slotNames.v1";
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
const FONT_FAMILY_OPTIONS = [
  {
    label: "系统默认",
    value: DEFAULT_FONT_FAMILY,
  },
  {
    label: "苹方 / PingFang SC",
    value: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  },
  {
    label: "微软雅黑",
    value: '"Microsoft YaHei", "PingFang SC", sans-serif',
  },
  {
    label: "思源黑体 / Noto Sans SC",
    value: '"Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei", sans-serif',
  },
  {
    label: "阿里巴巴普惠体",
    value: '"Alibaba PuHuiTi", "Alibaba PuHuiTi 2.0", "PingFang SC", sans-serif',
  },
  {
    label: "黑体 / SimHei",
    value: 'SimHei, "Microsoft YaHei", sans-serif',
  },
  {
    label: "宋体 / SimSun",
    value: 'SimSun, "Songti SC", serif',
  },
  {
    label: "楷体 / KaiTi",
    value: 'KaiTi, "Kaiti SC", serif',
  },
  {
    label: "Arial",
    value: "Arial, Helvetica, sans-serif",
  },
  {
    label: "Georgia",
    value: 'Georgia, "Times New Roman", serif',
  },
];

export default function SceneEditor() {
  const [scene, setScene] = useState<Scene>(() => createDefaultScene());
  const [selection, setSelection] = useState<SelectionState>(() => createSelectionState());
  const [marquee, setMarquee] = useState<MarqueeState>(() => createMarqueeState());
  const [hitTestStrategy, setHitTestStrategy] = useState<HitTestStrategy>("intersection");
  const [status, setStatus] = useState("正在读取本地场景...");
  const [customTemplates, setCustomTemplates] = useState<CustomSceneTemplate[]>([]);
  const [customTemplateName, setCustomTemplateName] = useState("");
  const [activeTemplateId, setActiveTemplateId] = useState<string>(DEFAULT_TEMPLATE_ID);
  const [appOrigin, setAppOrigin] = useState("");
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasFitWidth, setCanvasFitWidth] = useState(CANVAS_PREVIEW_MAX_WIDTH);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [guides, setGuides] = useState<GuideLine[]>([]);
  const [spacingGuides, setSpacingGuides] = useState<MeasurementGuide[]>([]);
  const [resizeLabel, setResizeLabel] = useState<ResizeLabel | null>(null);
  const guidesSelectedIdsRef = useRef<string[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const stageViewportRef = useRef<HTMLDivElement>(null);
  const elementClipboardRef = useRef<SceneElement | null>(null);
  const pasteOffsetRef = useRef(1);
  const sceneElementsRef = useRef<SceneElement[]>(scene.elements);
  const selectedElementRef = useRef<SceneElement | null>(null);
  const snapStateRef = useRef<SnapState>(createSnapState());
  const resizeSnapStateRef = useRef<ResizeSnapState>(createResizeSnapState());
  const spatialIndexRef = useRef<SpatialIndex>(new SpatialIndex());
  const rafHandleRef = useRef<number>(0);
  const latestMoveRef = useRef<{ dx: number; dy: number; shiftKey: boolean } | null>(null);
  const marqueeRafRef = useRef<number>(0);
  const latestMarqueeRef = useRef<{ x: number; y: number } | null>(null);
  const [activeSlotId, setActiveSlotId] = useState<string>("default");
  const [templateSlots, setTemplateSlots] = useState<SceneSlotInfo[]>([]);
  const [canPasteElement, setCanPasteElement] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<SidebarSectionId, boolean>>({
    scene: false,
    sources: false,
    templates: false,
    layers: false,
  });
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

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
      setCustomTemplates(readCustomTemplatesFromStorage());
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
          setActiveTemplateId(findMatchingBuiltInTemplateId(nextScene));
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

  useEffect(() => {
    let active = true;

    async function loadSlots() {
      try {
        const response = await fetch("/api/scene?list=1", { cache: "no-store" });
        if (!response.ok) return;

        const allSlots = (await response.json()) as { templateId: string; slots: string[] }[];
        if (!active) return;

        const slotNames = readSlotNamesFromStorage();
        const currentSlots: SceneSlotInfo[] = [];

        for (const entry of allSlots) {
          for (const slotId of entry.slots) {
            currentSlots.push({
              templateId: entry.templateId,
              slotId,
              name: slotNames[`${entry.templateId}/${slotId}`] ?? slotId,
            });
          }
        }

        setTemplateSlots(currentSlots);
      } catch {
        // slots will remain empty, user can add manually
      }
    }

    void loadSlots();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const viewport = stageViewportRef.current;

    if (!viewport) {
      return;
    }

    const currentViewport = viewport;

    function updateFitWidth() {
      const availableWidth = Math.max(160, currentViewport.clientWidth - STAGE_VIEWPORT_PADDING);
      const availableHeight = Math.max(280, currentViewport.clientHeight - STAGE_VIEWPORT_PADDING);
      const nextFitWidth = Math.min(
        availableWidth,
        availableHeight * CANVAS_ASPECT_RATIO,
        CANVAS_PREVIEW_MAX_WIDTH,
      );

      setCanvasFitWidth(Math.max(160, nextFitWidth));
    }

    updateFitWidth();

    const observer = new ResizeObserver(updateFitWidth);
    observer.observe(currentViewport);
    window.addEventListener("resize", updateFitWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateFitWidth);
    };
  }, []);

  const activeBuiltInTemplate =
    BUILT_IN_TEMPLATES.find((template) => template.id === activeTemplateId) ?? null;
  const activeCustomTemplate =
    customTemplates.find((template) => template.id === activeTemplateId) ?? null;
  const activeTemplate = activeBuiltInTemplate ?? activeCustomTemplate;
  const activeSlot = templateSlots.find((slot) => slot.slotId === activeSlotId) ?? null;
  const hasUnsavedCustomTemplateChanges = activeCustomTemplate
    ? !scenesMatch(activeCustomTemplate.scene, scene)
    : false;
  const editingContextCaption = activeCustomTemplate
    ? hasUnsavedCustomTemplateChanges
      ? "自定义模板有未保存修改"
      : "自定义模板已保存"
    : activeSlot?.name ?? "未选择 OBS 源";
  const visualLayers = scene.elements
    .map((element, index) => ({ element, index }))
    .reverse();
  const canvasPreviewWidth = Math.round(canvasFitWidth * canvasZoom);
  const canvasZoomPercent = Math.round(canvasZoom * 100);

  const markSceneEdited = useCallback(() => {
    if (activeCustomTemplate) {
      return;
    }

    if (activeBuiltInTemplate) {
      setActiveTemplateId("");
    }
  }, [activeBuiltInTemplate, activeCustomTemplate]);

  function getSlotUrl(templateId: string, slotId: string) {
    const origin = appOrigin || "";
    return `${origin}/live?t=${encodeURIComponent(templateId)}&s=${encodeURIComponent(slotId)}`;
  }

  function readSlotNamesFromStorage(): Record<string, string> {
    try {
      const raw = window.localStorage.getItem(SLOT_NAMES_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      return {};
    }
  }

  function writeSlotNameToStorage(templateId: string, slotId: string, name: string) {
    const names = readSlotNamesFromStorage();
    names[`${templateId}/${slotId}`] = name;
    window.localStorage.setItem(SLOT_NAMES_STORAGE_KEY, JSON.stringify(names));
  }

  function removeSlotNameFromStorage(templateId: string, slotId: string) {
    const names = readSlotNamesFromStorage();
    delete names[`${templateId}/${slotId}`];
    window.localStorage.setItem(SLOT_NAMES_STORAGE_KEY, JSON.stringify(names));
  }

  async function addSlot(templateId: string) {
    const slotId = `slot-${Date.now()}`;
    const template = BUILT_IN_TEMPLATES.find((t) => t.id === templateId)
      ?? customTemplates.find((t) => t.id === templateId);
    const defaultScene = template?.scene ?? createDefaultScene();

    try {
      await fetch("/api/scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          slotId,
          scene: defaultScene,
        }),
      });

      const templateName = template?.name ?? "未命名模板";
      const name = `${templateName} - 源 ${templateSlots.length + 1}`;
      writeSlotNameToStorage(templateId, slotId, name);

      const newSlot: SceneSlotInfo = {
        templateId,
        slotId,
        name,
      };

      setTemplateSlots((prev) => [...prev, newSlot]);
      setActiveSlotId(slotId);
      setStatus(`已创建浏览器源「${name}」`);
    } catch {
      setStatus("创建浏览器源失败");
    }
  }

  async function removeSlot(templateId: string, slotId: string) {
    removeSlotNameFromStorage(templateId, slotId);

    try {
      const response = await fetch("/api/scene", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, slotId }),
      });

      if (response.ok) {
        setTemplateSlots((prev) =>
          prev.filter((s) => !(s.templateId === templateId && s.slotId === slotId)),
        );

        if (activeSlotId === slotId) {
          const remaining = templateSlots.filter((s) => !(s.templateId === templateId && s.slotId === slotId));
          const nextSlotId = remaining[0]?.slotId ?? "default";
          setActiveSlotId(nextSlotId);
        }
      }
    } catch {
      setStatus("删除浏览器源失败");
    }
  }

  function selectSlotForEditing(slotId: string) {
    setActiveSlotId(slotId);
  }

  function toggleSidebarSection(sectionId: SidebarSectionId) {
    setCollapsedSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  }

  function setCanvasZoomLevel(value: number) {
    setCanvasZoom(clampZoom(value));
  }

  function zoomCanvasIn() {
    setCanvasZoom((value) => clampZoom(value + CANVAS_ZOOM_STEP));
  }

  function zoomCanvasOut() {
    setCanvasZoom((value) => clampZoom(value - CANVAS_ZOOM_STEP));
  }

  function resetCanvasZoom() {
    setCanvasZoom(1);
  }

  function handleStageWheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }

    event.preventDefault();
    const direction = event.deltaY < 0 ? 1 : -1;
    setCanvasZoom((value) => clampZoom(value + direction * CANVAS_ZOOM_STEP));
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

  const copySelectedElement = useCallback(() => {
    const element = selectedElementRef.current;

    if (!element) {
      setStatus("请先选择一个画布组件");
      return;
    }

    elementClipboardRef.current = cloneSceneElement(element);
    pasteOffsetRef.current = 1;
    setCanPasteElement(true);
    setStatus(`已复制「${element.name}」`);
  }, []);

  const pasteCopiedElement = useCallback(() => {
    const sourceElement = elementClipboardRef.current;

    if (!sourceElement) {
      setStatus("没有可粘贴的组件");
      return;
    }

    const pastedElement = createPastedSceneElement(
      sourceElement,
      sceneElementsRef.current,
      pasteOffsetRef.current,
    );
    pasteOffsetRef.current += 1;
    sceneElementsRef.current = [...sceneElementsRef.current, pastedElement];
    selectedElementRef.current = pastedElement;

    setScene((currentScene) => ({
      ...currentScene,
      elements: [...currentScene.elements, pastedElement],
    }));
    setSelection((prev) => selectSingle(prev, pastedElement.id));
    markSceneEdited();
    setStatus(`已粘贴「${pastedElement.name}」`);
  }, [markSceneEdited]);

  useEffect(() => {
    function handleEditorKeyDown(event: KeyboardEvent) {
      const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      
      if (arrowKeys.includes(event.key)) {
        if (isEditableTarget(event.target) || editingTextId) {
          return;
        }
        
        if (selection.selectedIds.length === 0) {
          return;
        }
        
        event.preventDefault();
        
        const selectedElements = scene.elements.filter(
          (el) => selection.selectedIds.includes(el.id) && !el.locked
        );
        
        if (selectedElements.length === 0) {
          return;
        }
        
        const movementStep = event.shiftKey ? 10 : 1;
        
        let dx = 0;
        let dy = 0;
        
        switch (event.key) {
          case "ArrowUp":
            dy = -movementStep;
            break;
          case "ArrowDown":
            dy = movementStep;
            break;
          case "ArrowLeft":
            dx = -movementStep;
            break;
          case "ArrowRight":
            dx = movementStep;
            break;
        }
        
        const otherElements = scene.elements.filter(
          (el) => !selection.selectedIds.includes(el.id) && !el.locked && el.hidden !== true
        );
        spatialIndexRef.current = buildSpatialIndex(otherElements);
        
        const keyboardContext: GuideContext = { mode: "keyboard" };
        
        setScene((currentScene) => {
          const updatedElements = currentScene.elements.map((element) => {
            if (!selection.selectedIds.includes(element.id) || element.locked) {
              return element;
            }
            
            return {
              ...element,
              x: element.x + dx,
              y: element.y + dy,
            } as SceneElement;
          });
          
          const updatedSelectedElements = updatedElements.filter(
            (el) => selection.selectedIds.includes(el.id) && !el.locked
          );
          
          if (updatedSelectedElements.length > 0) {
            const movedBounds = computeBoundingBox(updatedSelectedElements);
            const guides = computeGuidesOptimized(movedBounds, spatialIndexRef.current, undefined, keyboardContext);
            const spacingGuides = computeSpacingGuidesOptimized(movedBounds, spatialIndexRef.current, keyboardContext);
            
            guidesSelectedIdsRef.current = selection.selectedIds;
            setGuides(guides);
            setSpacingGuides(spacingGuides);
          }
          
          return {
            ...currentScene,
            elements: updatedElements,
          };
        });
        markSceneEdited();
        return;
      }

      if (!isCopyPasteModifier(event) || isEditableTarget(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "c" && selectedElementRef.current) {
        event.preventDefault();
        copySelectedElement();
        return;
      }

      if (key === "v" && elementClipboardRef.current) {
        event.preventDefault();
        pasteCopiedElement();
      }
    }

    window.addEventListener("keydown", handleEditorKeyDown);

    return () => {
      window.removeEventListener("keydown", handleEditorKeyDown);
    };
  }, [copySelectedElement, pasteCopiedElement, selection.selectedIds, editingTextId, scene.elements, markSceneEdited]);

  function changeScene(updater: (currentScene: Scene) => Scene) {
    setScene(updater);
    markSceneEdited();
  }

  function patchElement(elementId: string, patch: Partial<SceneElement>) {
    changeScene((currentScene) => ({
      ...currentScene,
      elements: currentScene.elements.map((element) =>
        element.id === elementId ? ({ ...element, ...patch } as SceneElement) : element,
      ),
    }));
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
    }));
  }

  function toggleElementLocked(elementId: string) {
    changeScene((currentScene) => ({
      ...currentScene,
      elements: currentScene.elements.map((element) =>
        element.id === elementId
          ? ({ ...element, locked: !element.locked } as SceneElement)
          : element,
      ),
    }));
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
    });
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

  function applyTemplate(template: { id: string; name: string; scene: Scene }) {
    const nextScene = cloneScene(template.scene);
    setScene(nextScene);
    if (nextScene.elements[0]?.id) {
      setSelection(selectSingle(selection, nextScene.elements[0].id));
    }
    setActiveTemplateId(template.id);

    const templateSlot = templateSlots.find((s) => s.templateId === template.id);
    if (templateSlot) {
      setActiveSlotId(templateSlot.slotId);
    } else {
      setActiveSlotId("default");
    }

    setStatus(`已套用「${template.name}」到当前画布`);
  }

  function applyBuiltInTemplate(templateId: string) {
    const template = BUILT_IN_TEMPLATES.find((item) => item.id === templateId);
    if (!template) {
      return;
    }

    applyTemplate(template);
  }

  function saveCustomTemplate() {
    const timestamp = new Date().toISOString();
    const templateName =
      customTemplateName.trim() || `自定义模板 ${customTemplates.length + 1}`;
    const template: CustomSceneTemplate = {
      id: createCustomTemplateId(),
      name: templateName,
      createdAt: timestamp,
      updatedAt: timestamp,
      scene: cloneScene(scene),
    };
    const nextTemplates = [template, ...customTemplates];

    try {
      writeCustomTemplatesToStorage(nextTemplates);
      setCustomTemplates(nextTemplates);
      setCustomTemplateName("");
      setActiveTemplateId(template.id);
      setStatus(`已保存「${template.name}」到浏览器缓存`);
      setShowTemplateForm(false);
    } catch {
      setStatus("自定义模板保存失败，浏览器缓存空间可能不足");
    }
  }

  function saveActiveCustomTemplate() {
    if (!activeCustomTemplate) {
      setShowTemplateForm(true);
      setStatus("当前不是自定义模板，请另存为新模板");
      return;
    }

    const updatedTemplate: CustomSceneTemplate = {
      ...activeCustomTemplate,
      updatedAt: new Date().toISOString(),
      scene: cloneScene(scene),
    };
    const nextTemplates = customTemplates.map((template) =>
      template.id === activeCustomTemplate.id ? updatedTemplate : template,
    );

    try {
      writeCustomTemplatesToStorage(nextTemplates);
      setCustomTemplates(nextTemplates);
      setActiveTemplateId(updatedTemplate.id);
      setStatus(`已保存「${updatedTemplate.name}」的修改`);
    } catch {
      setStatus("模板保存失败，浏览器缓存空间可能不足");
    }
  }

  function deleteCustomTemplate(templateId: string) {
    const nextTemplates = customTemplates.filter((template) => template.id !== templateId);

    try {
      writeCustomTemplatesToStorage(nextTemplates);
      setCustomTemplates(nextTemplates);
      if (activeTemplateId === templateId) {
        setActiveTemplateId("");
      }
      setStatus("已删除自定义模板");
    } catch {
      setStatus("自定义模板删除失败，请检查浏览器缓存权限");
    }
  }

  function exportTemplateJson() {
    const payload = createTemplateExportPayload(
      activeTemplate?.name ?? "自定义场景",
      scene,
    );
    const filename = `covercast-template-${new Date().toISOString().slice(0, 10)}.json`;
    const json = JSON.stringify(payload, null, 2);

    downloadBlob(
      new Blob([json], { type: "application/json;charset=utf-8" }),
      filename,
    );
    setStatus(`模板 JSON 已导出：${payload.template.name}`);
  }

  async function importTemplateFile(file: File) {
    const isJsonFile =
      file.type === "application/json" || file.name.toLowerCase().endsWith(".json");

    if (!isJsonFile) {
      setStatus("导入失败，仅支持 JSON 文件");
      return;
    }

    setStatus("正在导入模板 JSON...");

    try {
      const parsedValue = JSON.parse(await file.text()) as unknown;
      const template = normalizeTemplateExportPayload(parsedValue);

      if (!template) {
        setStatus("导入失败，请选择 Covercast 导出的模板 JSON");
        return;
      }

      const importedTemplate: CustomSceneTemplate = {
        ...template,
        id: createCustomTemplateId(),
        name: uniqueTemplateName(template.name, customTemplates),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        scene: cloneScene(template.scene),
      };
      const nextTemplates = [importedTemplate, ...customTemplates];

      writeCustomTemplatesToStorage(nextTemplates);
      setCustomTemplates(nextTemplates);
      setScene(cloneScene(importedTemplate.scene));
      if (importedTemplate.scene.elements[0]?.id) {
        setSelection(selectSingle(selection, importedTemplate.scene.elements[0].id));
      }
      setActiveTemplateId(importedTemplate.id);
      setActiveSlotId("default");
      setStatus(`已导入模板「${importedTemplate.name}」`);
    } catch {
      setStatus("导入失败，请检查 JSON 文件内容或浏览器缓存空间");
    }
  }

  function addTextElement() {
    const element = createTextElement();
    changeScene((currentScene) => ({
      ...currentScene,
      elements: [...currentScene.elements, element],
    }));
    setSelection(selectSingle(selection, element.id));
  }

  function addRectElement() {
    const element = createRectElement();
    changeScene((currentScene) => ({
      ...currentScene,
      elements: [...currentScene.elements, element],
    }));
    setSelection(selectSingle(selection, element.id));
  }

  function addEllipseElement() {
    const element = createEllipseElement();
    changeScene((currentScene) => ({
      ...currentScene,
      elements: [...currentScene.elements, element],
    }));
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

  function handleTemplateImportInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (file) {
      void importTemplateFile(file);
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
    });
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
          <button
            type="button"
            className={`secondary-button toolbar-template-button${showTemplateForm ? " active" : ""}`}
            onClick={() => setShowTemplateForm((visible) => !visible)}
            aria-expanded={showTemplateForm}
            aria-controls="template-save-panel"
          >
            {activeCustomTemplate ? "另存为模板" : "保存为模板"}
          </button>
          <label className="secondary-button file-button">
            导入
            <input
              type="file"
              accept="application/json,.json"
              onChange={handleTemplateImportInput}
            />
          </label>
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

      {showTemplateForm && (
        <section
          className="template-save-panel"
          id="template-save-panel"
          aria-label="保存当前场景为模板"
        >
          <TextField
            label="模板名称"
            placeholder="未命名模板"
            value={customTemplateName}
            onChange={setCustomTemplateName}
          />
          <button
            type="button"
            className="primary-button"
            onClick={saveCustomTemplate}
          >
            确认保存
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setShowTemplateForm(false)}
          >
            取消
          </button>
        </section>
      )}

      <section className="editor-grid">
        <aside className="left-panel" aria-label="Scene settings">
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

          <SidebarSection
            title="OBS 源"
            caption={`${templateSlots.length} 个源`}
            collapsed={collapsedSections.sources}
            onToggle={() => toggleSidebarSection("sources")}
          >
            <div className="source-create-row">
              <span>新建浏览器源</span>
              <select
                className="template-select-dropdown"
                value=""
                onChange={(e) => {
                  if (e.currentTarget.value) {
                    void addSlot(e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
                title="选择模板创建浏览器源"
              >
                <option value="" disabled>选择模板...</option>
                <optgroup label="内置模板">
                  {BUILT_IN_TEMPLATES.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </optgroup>
                {customTemplates.length > 0 && (
                  <optgroup label="自定义模板">
                    {customTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {templateSlots.length === 0 ? (
              <div className="live-url-empty">
                <p>暂无浏览器源，请从上方选择模板创建</p>
              </div>
            ) : (
              <div className="slot-list">
                {templateSlots.map((slot) => {
                  const url = getSlotUrl(slot.templateId, slot.slotId);
                  const isActive = slot.slotId === activeSlotId;
                  const template = BUILT_IN_TEMPLATES.find((t) => t.id === slot.templateId)
                    ?? customTemplates.find((t) => t.id === slot.templateId);
                  const templateName = template?.name ?? "未命名模板";

                  return (
                    <div
                      key={`${slot.templateId}/${slot.slotId}`}
                      className={`slot-item${isActive ? " active" : ""}`}
                      onClick={() => selectSlotForEditing(slot.slotId)}
                    >
                      <div className="slot-item-header">
                        <div className="slot-title-group">
                          <span className="slot-template-badge">{templateName}</span>
                          <EditableSlotName
                            name={slot.name}
                            onSave={(newName) => {
                              writeSlotNameToStorage(slot.templateId, slot.slotId, newName);
                              setTemplateSlots((prev) =>
                                prev.map((s) =>
                                  s.templateId === slot.templateId && s.slotId === slot.slotId
                                    ? { ...s, name: newName }
                                    : s,
                                ),
                              );
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          className="slot-delete-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void removeSlot(slot.templateId, slot.slotId);
                          }}
                          title="删除此浏览器源"
                        >
                          ×
                        </button>
                      </div>
                      <div className="slot-item-url">
                        <code>{url}</code>
                        <button
                          type="button"
                          className="slot-copy-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(url).then(() => {
                              setStatus("URL 已复制到剪贴板");
                            });
                          }}
                          title="复制到剪贴板"
                        >
                          复制 URL
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SidebarSection>

          <SidebarSection
            title="模板"
            caption={`${BUILT_IN_TEMPLATES.length + customTemplates.length} 个`}
            collapsed={collapsedSections.templates}
            onToggle={() => toggleSidebarSection("templates")}
          >
            <div className="template-library">
              <div className="template-section">
                <div className="template-section-header">
                  <span className="template-section-title">内置模板</span>
                  <span className="template-section-count">{BUILT_IN_TEMPLATES.length} 个</span>
                </div>
                <div className="template-list">
                  {BUILT_IN_TEMPLATES.map((template) => (
                    <TemplateCard
                      key={template.id}
                      name={template.name}
                      description={template.description}
                      badge="内置"
                      active={activeTemplateId === template.id}
                      onApply={() => applyBuiltInTemplate(template.id)}
                    />
                  ))}
                </div>
              </div>

              {customTemplates.length > 0 && (
                <div className="template-section">
                  <div className="template-section-header">
                    <span className="template-section-title">自定义模板</span>
                    <span className="template-section-count">{customTemplates.length} 个</span>
                  </div>
                  <div className="template-list">
                    {customTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        name={template.name}
                        description={
                          activeTemplateId === template.id && hasUnsavedCustomTemplateChanges
                            ? "有未保存修改"
                            : formatTemplateDate(
                              template.updatedAt ?? template.createdAt,
                              template.updatedAt ? "更新于" : "保存于",
                            )
                        }
                        badge={
                          activeTemplateId === template.id && hasUnsavedCustomTemplateChanges
                            ? "未保存"
                            : "自定义"
                        }
                        active={activeTemplateId === template.id}
                        dirty={activeTemplateId === template.id && hasUnsavedCustomTemplateChanges}
                        onApply={() => applyTemplate(template)}
                        onDelete={() => deleteCustomTemplate(template.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

            </div>
          </SidebarSection>

          <SidebarSection
            title="图层"
            caption={`${scene.elements.length} 个`}
            collapsed={collapsedSections.layers}
            onToggle={() => toggleSidebarSection("layers")}
          >
            <div className="layer-list">
              {visualLayers.map(({ element, index }) => {
                const isActive = isSelected(selection, element.id);
                const isTop = index === scene.elements.length - 1;
                const isBottom = index === 0;

                return (
                  <div
                    key={element.id}
                    className={[
                      "layer-row",
                      isActive ? "active" : "",
                      element.hidden ? "muted" : "",
                      element.locked ? "locked" : "",
                    ].filter(Boolean).join(" ")}
                  >
                    <button
                      type="button"
                      className="layer-main"
                      onClick={() => setSelection(selectSingle(selection, element.id))}
                    >
                      <span className="layer-type">{elementTypeGlyph(element)}</span>
                      <span className="layer-name">{element.name}</span>
                      <small>{elementTypeLabel(element)}</small>
                    </button>
                    <div className="layer-actions">
                      <button
                        type="button"
                        className={element.hidden ? "layer-action active" : "layer-action"}
                        onClick={() => toggleElementHidden(element.id)}
                        title={element.hidden ? "显示图层" : "隐藏图层"}
                      >
                        {element.hidden ? "隐" : "显"}
                      </button>
                      <button
                        type="button"
                        className={element.locked ? "layer-action active" : "layer-action"}
                        onClick={() => toggleElementLocked(element.id)}
                        title={element.locked ? "解锁图层" : "锁定图层"}
                      >
                        {element.locked ? "锁" : "解"}
                      </button>
                      <button
                        type="button"
                        className="layer-action"
                        disabled={isTop}
                        onClick={() => moveElementLayer(element.id, "forward")}
                        title="上移一层"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="layer-action"
                        disabled={isBottom}
                        onClick={() => moveElementLayer(element.id, "backward")}
                        title="下移一层"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </SidebarSection>
        </aside>

        <section className="stage-panel" aria-label="Canvas preview">
          <div className="stage-header">
            <span className="stage-status">{status}</span>
            <div className="stage-header-tools">
              <span>拖拽移动，右下角黄点缩放</span>
              <div className="canvas-zoom-controls" aria-label="画布缩放">
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

        <aside className="right-panel" aria-label="Selected element settings">
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

function ElementInspector({
  element,
  onPatch,
  onCopy,
  onPaste,
  canPaste,
  onDelete,
  onReplaceImage,
}: {
  element: SceneElement;
  onPatch: (patch: Partial<SceneElement>) => void;
  onCopy: () => void;
  onPaste: () => void;
  canPaste: boolean;
  onDelete: () => void;
  onReplaceImage: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="inspector">
      <TextField
        label="图层名称"
        value={element.name}
        onChange={(value) => onPatch({ name: value } as Partial<SceneElement>)}
      />
      <div className="field-grid">
        <NumberField label="X" value={element.x} onChange={(value) => onPatch({ x: value })} />
        <NumberField label="Y" value={element.y} onChange={(value) => onPatch({ y: value })} />
        <NumberField
          label="宽"
          value={element.width}
          min={minimumWidth(element)}
          onChange={(value) => onPatch({ width: value })}
        />
        <NumberField
          label="高"
          value={element.height}
          min={minimumHeight(element)}
          onChange={(value) => onPatch({ height: value })}
        />
      </div>
      <NumberField
        label="透明度"
        value={element.opacity ?? 1}
        min={0}
        max={1}
        step={0.05}
        precision={2}
        onChange={(value) => onPatch({ opacity: value })}
      />

      {isTextElement(element) ? (
        <TextInspector element={element} onPatch={onPatch} />
      ) : null}

      {isShapeElement(element) ? (
        <ShapeInspector element={element} onPatch={onPatch} />
      ) : null}

      {isImageElement(element) ? (
        <ImageInspector
          element={element}
          onPatch={onPatch}
          onReplaceImage={onReplaceImage}
        />
      ) : null}

      <div className="inspector-action-row">
        <button type="button" className="secondary-button" onClick={onCopy}>
          复制元素
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={onPaste}
          disabled={!canPaste}
        >
          粘贴副本
        </button>
      </div>

      <button type="button" className="danger-button" onClick={onDelete}>
        删除当前元素
      </button>
    </div>
  );
}

function TextInspector({
  element,
  onPatch,
}: {
  element: TextElement;
  onPatch: (patch: Partial<SceneElement>) => void;
}) {
  return (
    <>
      <TextAreaField
        label="文字内容"
        value={element.text}
        onChange={(value) => onPatch({ text: value } as Partial<TextElement>)}
      />
      <ColorField
        label="文字颜色"
        value={element.fill}
        onChange={(value) => onPatch({ fill: value } as Partial<TextElement>)}
      />
      <FontFamilyField
        key={element.id}
        value={element.fontFamily}
        onChange={(value) => onPatch({ fontFamily: value } as Partial<TextElement>)}
      />
      <div className="field-grid">
        <NumberField
          label="字号"
          value={element.fontSize}
          min={8}
          onChange={(value) => onPatch({ fontSize: value } as Partial<TextElement>)}
        />
        <NumberField
          label="字重"
          value={element.fontWeight}
          min={100}
          max={1000}
          step={100}
          onChange={(value) => onPatch({ fontWeight: value } as Partial<TextElement>)}
        />
        <NumberField
          label="行高"
          value={element.lineHeight}
          min={0.8}
          max={3}
          step={0.05}
          precision={2}
          onChange={(value) => onPatch({ lineHeight: value } as Partial<TextElement>)}
        />
        <label className="field">
          <span>对齐</span>
          <select
            value={element.align}
            onChange={(event) =>
              onPatch({ align: event.currentTarget.value as TextAlign } as Partial<TextElement>)
            }
          >
            <option value="left">左对齐</option>
            <option value="center">居中</option>
            <option value="right">右对齐</option>
          </select>
        </label>
      </div>
    </>
  );
}

function FontFamilyField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const matchedOption = findFontFamilyOption(value);
  const usesCustomFont = customOpen || !matchedOption;
  const selectedValue = usesCustomFont
    ? CUSTOM_FONT_FAMILY_VALUE
    : matchedOption.value;

  return (
    <div className="font-family-field">
      <label className="field">
        <span>字体</span>
        <select
          value={selectedValue}
          onChange={(event) => {
            const nextValue = event.currentTarget.value;

            if (nextValue === CUSTOM_FONT_FAMILY_VALUE) {
              setCustomOpen(true);
              return;
            }

            setCustomOpen(false);
            onChange(nextValue);
          }}
        >
          {FONT_FAMILY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          <option value={CUSTOM_FONT_FAMILY_VALUE}>自定义字体栈</option>
        </select>
      </label>
      {usesCustomFont ? (
        <TextField
          label="自定义字体栈"
          value={value}
          placeholder={DEFAULT_FONT_FAMILY}
          onChange={onChange}
        />
      ) : null}
      <div className="font-preview" style={{ fontFamily: value }}>
        直播背景 Aa 123
      </div>
    </div>
  );
}

function ShapeInspector({
  element,
  onPatch,
}: {
  element: ShapeElement;
  onPatch: (patch: Partial<SceneElement>) => void;
}) {
  const fillMode = element.fillMode ?? "solid";
  const gradient = element.gradient ?? defaultShapeGradient(element);

  return (
    <>
      <label className="field checkbox-field">
        <span>背景穿透</span>
        <input
          type="checkbox"
          checked={element.backgroundCutout === true}
          onChange={(event) =>
            onPatch({
              backgroundCutout: event.currentTarget.checked,
            } as Partial<ShapeElement>)
          }
        />
      </label>
      <label className="field">
        <span>填充类型</span>
        <select
          disabled={element.backgroundCutout === true}
          value={fillMode}
          onChange={(event) => {
            const nextMode = event.currentTarget.value as ShapeFillMode;
            onPatch({
              fillMode: nextMode,
              gradient: nextMode === "gradient" ? gradient : element.gradient,
            } as Partial<ShapeElement>);
          }}
        >
          <option value="solid">纯色</option>
          <option value="gradient">渐变</option>
        </select>
      </label>

      {element.backgroundCutout === true ? (
        <p className="field-help">已挖空封面背景，OBS 中可透出后方画面；可继续保留描边。</p>
      ) : fillMode === "gradient" ? (
        <>
          <ColorField
            label="渐变起点"
            value={gradient.startColor}
            onChange={(value) =>
              onPatch({
                fill: value,
                fillMode: "gradient",
                gradient: { ...gradient, startColor: value },
              } as Partial<ShapeElement>)
            }
          />
          <ColorField
            label="渐变终点"
            value={gradient.endColor}
            onChange={(value) =>
              onPatch({
                fillMode: "gradient",
                gradient: { ...gradient, endColor: value },
              } as Partial<ShapeElement>)
            }
          />
          <label className="field">
            <span>渐变方向</span>
            <select
              value={gradient.direction}
              onChange={(event) =>
                onPatch({
                  fillMode: "gradient",
                  gradient: {
                    ...gradient,
                    direction: event.currentTarget.value as GradientDirection,
                  },
                } as Partial<ShapeElement>)
              }
            >
              <option value="horizontal">水平</option>
              <option value="vertical">垂直</option>
              <option value="diagonal-down">左上到右下</option>
              <option value="diagonal-up">左下到右上</option>
            </select>
          </label>
        </>
      ) : (
        <ColorField
          label="填充"
          value={element.fill}
          onChange={(value) =>
            onPatch({ fill: value, fillMode: "solid" } as Partial<ShapeElement>)
          }
        />
      )}
      <ColorField
        label="描边"
        value={element.stroke ?? "#ffffff"}
        onChange={(value) => onPatch({ stroke: value } as Partial<ShapeElement>)}
      />
      <div className="field-grid">
        <NumberField
          label="描边宽"
          value={element.strokeWidth ?? 0}
          min={0}
          onChange={(value) => onPatch({ strokeWidth: value } as Partial<ShapeElement>)}
        />
        {element.type === "rect" ? (
          <NumberField
            label="圆角"
            value={element.radius ?? 0}
            min={0}
            onChange={(value) => onPatch({ radius: value } as Partial<ShapeElement>)}
          />
        ) : null}
      </div>
    </>
  );
}

function defaultShapeGradient(element: ShapeElement) {
  return {
    startColor: isHexColor(element.fill) ? element.fill : "#ffffff",
    endColor: "#99f19c",
    direction: "horizontal" as GradientDirection,
  };
}

function ImageInspector({
  element,
  onPatch,
  onReplaceImage,
}: {
  element: ImageElement;
  onPatch: (patch: Partial<SceneElement>) => void;
  onReplaceImage: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <>
      <label className="field">
        <span>素材替换</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onReplaceImage}
        />
      </label>
      <label className="field">
        <span>显示方式</span>
        <select
          value={element.fit}
          onChange={(event) =>
            onPatch({ fit: event.currentTarget.value as ImageElement["fit"] } as Partial<ImageElement>)
          }
        >
          <option value="cover">裁切填充</option>
          <option value="contain">完整显示</option>
        </select>
      </label>
      <label className="field">
        <span>形状</span>
        <select
          value={element.shape}
          onChange={(event) =>
            onPatch({ shape: event.currentTarget.value as ImageElement["shape"] } as Partial<ImageElement>)
          }
        >
          <option value="rect">矩形</option>
          <option value="circle">圆形</option>
        </select>
      </label>
      {!element.src ? (
        <TextField
          label="占位字"
          value={element.fallbackText ?? ""}
          onChange={(value) => onPatch({ fallbackText: value } as Partial<ImageElement>)}
        />
      ) : null}
    </>
  );
}

function TemplateCard({
  name,
  description,
  badge,
  active,
  dirty = false,
  onApply,
  onDelete,
}: {
  name: string;
  description: string;
  badge: string;
  active: boolean;
  dirty?: boolean;
  onApply: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className={[
      "template-card",
      active ? "active" : "",
      dirty ? "dirty" : "",
    ].filter(Boolean).join(" ")}>
      <button type="button" className="template-card-button" onClick={onApply}>
        <div className="template-card-content">
          <span className="template-card-name">{name}</span>
          <small className="template-card-desc">{description}</small>
        </div>
        <span className="template-card-badge">{badge}</span>
      </button>
      {onDelete ? (
        <button
          type="button"
          className="template-card-delete"
          aria-label={`删除模板 ${name}`}
          onClick={onDelete}
          title="删除模板"
        >
          ×
        </button>
      ) : null}
    </div>
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

function elementTypeLabel(element: SceneElement) {
  if (element.type === "text") {
    return "文字";
  }

  if (element.type === "image") {
    return "图片";
  }

  if (element.type === "ellipse") {
    return "椭圆";
  }

  return "矩形";
}

function elementTypeGlyph(element: SceneElement) {
  if (element.type === "text") {
    return "T";
  }

  if (element.type === "image") {
    return "I";
  }

  if (element.type === "ellipse") {
    return "O";
  }

  return "R";
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

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea value={value} rows={5} onChange={(event) => onChange(event.currentTarget.value)} />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  precision = 0,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value.toFixed(precision) : "0"}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          const nextValue = Number(event.currentTarget.value);
          if (Number.isFinite(nextValue)) {
            onChange(nextValue);
          }
        }}
      />
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

function readCustomTemplatesFromStorage(): CustomSceneTemplate[] {
  try {
    const rawValue = window.localStorage.getItem(CUSTOM_TEMPLATE_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .map(normalizeCustomTemplate)
      .filter((template): template is CustomSceneTemplate => template !== null);
  } catch {
    return [];
  }
}

function writeCustomTemplatesToStorage(templates: CustomSceneTemplate[]) {
  window.localStorage.setItem(CUSTOM_TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
}

function createTemplateExportPayload(name: string, scene: Scene): TemplateExportPayload {
  const timestamp = new Date().toISOString();

  return {
    format: TEMPLATE_EXPORT_FORMAT,
    version: 1,
    template: {
      id: createCustomTemplateId(),
      name: name.trim() || "自定义场景",
      createdAt: timestamp,
      updatedAt: timestamp,
      scene: cloneScene(scene),
    },
  };
}

function normalizeTemplateExportPayload(value: unknown): CustomSceneTemplate | null {
  if (
    !isRecord(value) ||
    value.format !== TEMPLATE_EXPORT_FORMAT ||
    value.version !== 1
  ) {
    return null;
  }

  return normalizeCustomTemplate(value.template);
}

function normalizeCustomTemplate(value: unknown): CustomSceneTemplate | null {
  if (!isRecord(value) || !isScene(value.scene)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.createdAt !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    createdAt: value.createdAt,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : undefined,
    scene: cloneScene(value.scene),
  };
}

function createCustomTemplateId() {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function uniqueTemplateName(name: string, templates: CustomSceneTemplate[]) {
  const baseName = name.trim() || "导入模板";
  const existingNames = new Set(templates.map((template) => template.name));

  if (!existingNames.has(baseName)) {
    return baseName;
  }

  let suffix = 2;
  let candidate = `${baseName} ${suffix}`;

  while (existingNames.has(candidate)) {
    suffix += 1;
    candidate = `${baseName} ${suffix}`;
  }

  return candidate;
}

function findFontFamilyOption(value: string) {
  const normalizedValue = value.trim();

  return FONT_FAMILY_OPTIONS.find((option) => option.value.trim() === normalizedValue) ?? null;
}

function isScene(value: unknown): value is Scene {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.version === 1 &&
    typeof value.backgroundColor === "string" &&
    typeof value.backgroundOpacity === "number" &&
    Array.isArray(value.elements) &&
    value.elements.every(isStoredSceneElement)
  );
}

function isStoredSceneElement(value: unknown): value is SceneElement {
  if (!isRecord(value)) {
    return false;
  }

  const hasBounds =
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.x === "number" &&
    typeof value.y === "number" &&
    typeof value.width === "number" &&
    typeof value.height === "number";

  if (!hasBounds) {
    return false;
  }

  if (value.type === "text") {
    return (
      typeof value.text === "string" &&
      typeof value.fill === "string" &&
      typeof value.fontSize === "number" &&
      typeof value.fontFamily === "string" &&
      typeof value.fontWeight === "number" &&
      (value.align === "left" || value.align === "center" || value.align === "right") &&
      typeof value.lineHeight === "number"
    );
  }

  if (value.type === "image") {
    return (
      typeof value.src === "string" &&
      typeof value.alt === "string" &&
      (value.fit === "cover" || value.fit === "contain") &&
      (value.shape === "rect" || value.shape === "circle")
    );
  }

  if (value.type === "rect" || value.type === "ellipse") {
    return typeof value.fill === "string";
  }

  return false;
}

function formatTemplateDate(value: string, prefix = "保存于") {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "保存在浏览器缓存";
  }

  return `${prefix} ${date.toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  })}`;
}

function findMatchingBuiltInTemplateId(scene: Scene) {
  return (
    BUILT_IN_TEMPLATES.find((template) => scenesMatch(template.scene, scene))?.id ?? ""
  );
}

function scenesMatch(left: Scene, right: Scene) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function cloneSceneElement(element: SceneElement): SceneElement {
  return JSON.parse(JSON.stringify(element)) as SceneElement;
}

function createPastedSceneElement(
  element: SceneElement,
  elements: SceneElement[],
  offsetMultiplier: number,
): SceneElement {
  const offset = 24 * offsetMultiplier;

  return {
    ...cloneSceneElement(element),
    id: createSceneElementId(element.type),
    name: uniqueSceneElementName(`${element.name} 副本`, elements),
    x: clamp(element.x + offset, -element.width + 24, CANVAS_WIDTH - 24),
    y: clamp(element.y + offset, -element.height + 24, CANVAS_HEIGHT - 24),
  } as SceneElement;
}

function createSceneElementId(type: SceneElement["type"]) {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function uniqueSceneElementName(name: string, elements: SceneElement[]) {
  const existingNames = new Set(elements.map((element) => element.name));

  if (!existingNames.has(name)) {
    return name;
  }

  let suffix = 2;
  let candidate = `${name} ${suffix}`;

  while (existingNames.has(candidate)) {
    suffix += 1;
    candidate = `${name} ${suffix}`;
  }

  return candidate;
}

function isCopyPasteModifier(event: KeyboardEvent) {
  return (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
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

function clampZoom(value: number) {
  return clamp(Number.isFinite(value) ? value : 1, CANVAS_ZOOM_MIN, CANVAS_ZOOM_MAX);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function EditableSlotName({
  name,
  onSave,
}: {
  name: string;
  onSave: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  if (editing) {
    return (
      <input
        className="slot-name-input"
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.currentTarget.value)}
        onBlur={() => {
          const trimmed = draft.trim();
          if (trimmed && trimmed !== name) {
            onSave(trimmed);
          }
          setEditing(false);
          setDraft(name);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const trimmed = draft.trim();
            if (trimmed && trimmed !== name) {
              onSave(trimmed);
            }
            setEditing(false);
            setDraft(name);
          }
          if (e.key === "Escape") {
            setEditing(false);
            setDraft(name);
          }
        }}
        autoFocus
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <span
      className="slot-name"
      onClick={(e) => {
        e.stopPropagation();
        setDraft(name);
        setEditing(true);
      }}
      title="点击重命名"
    >
      {name}
    </span>
  );
}
