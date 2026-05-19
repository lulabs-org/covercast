"use client";

import {
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  createDefaultScene,
  createImageElement,
  createTextElement,
  isImageElement,
  isShapeElement,
  isTextElement,
  type ImageElement,
  type Scene,
  type SceneElement,
  type ShapeElement,
  type TextAlign,
  type TextElement,
} from "../lib/scene";
import { sceneToSvgMarkup } from "../lib/scene-svg";
import SceneCanvas from "./SceneCanvas";

type DragState = {
  id: string;
  mode: "move" | "resize";
  startX: number;
  startY: number;
  element: SceneElement;
};

export default function SceneEditor() {
  const [scene, setScene] = useState<Scene>(() => createDefaultScene());
  const [selectedId, setSelectedId] = useState<string>("main-title");
  const [status, setStatus] = useState("正在读取本地场景...");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [drag, setDrag] = useState<DragState | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const selectedElement = useMemo(
    () => scene.elements.find((element) => element.id === selectedId) ?? null,
    [scene.elements, selectedId],
  );

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
          setHasUnsavedChanges(false);
          setSelectedId(nextScene.elements[0]?.id ?? "");
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
    if (!drag) {
      return;
    }

    const activeDrag = drag;

    function handlePointerMove(event: PointerEvent) {
      const svg = svgRef.current;
      if (!svg) {
        return;
      }

      const point = getSvgPoint(svg, event.clientX, event.clientY);
      const dx = point.x - activeDrag.startX;
      const dy = point.y - activeDrag.startY;

      setScene((currentScene) => ({
        ...currentScene,
        elements: currentScene.elements.map((element) => {
          if (element.id !== activeDrag.id) {
            return element;
          }

          if (activeDrag.mode === "move") {
            return {
              ...element,
              x: clamp(
                activeDrag.element.x + dx,
                -activeDrag.element.width + 24,
                CANVAS_WIDTH - 24,
              ),
              y: clamp(
                activeDrag.element.y + dy,
                -activeDrag.element.height + 24,
                CANVAS_HEIGHT - 24,
              ),
            } as SceneElement;
          }

          return {
            ...element,
            width: clamp(
              activeDrag.element.width + dx,
              minimumWidth(activeDrag.element),
              CANVAS_WIDTH - activeDrag.element.x,
            ),
            height: clamp(
              activeDrag.element.height + dy,
              minimumHeight(activeDrag.element),
              CANVAS_HEIGHT - activeDrag.element.y,
            ),
          } as SceneElement;
        }),
      }));
      setHasUnsavedChanges(true);
    }

    function handlePointerUp() {
      setDrag(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [drag]);

  function changeScene(updater: (currentScene: Scene) => Scene) {
    setScene(updater);
    setHasUnsavedChanges(true);
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

  function handleElementPointerDown(
    elementId: string,
    event: ReactPointerEvent<SVGGElement>,
  ) {
    const svg = svgRef.current;
    const element = scene.elements.find((item) => item.id === elementId);
    if (!svg || !element) {
      return;
    }

    const point = getSvgPoint(svg, event.clientX, event.clientY);
    setSelectedId(elementId);
    setDrag({
      id: elementId,
      mode: "move",
      startX: point.x,
      startY: point.y,
      element: { ...element },
    });
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

    const point = getSvgPoint(svg, event.clientX, event.clientY);
    setSelectedId(elementId);
    setDrag({
      id: elementId,
      mode: "resize",
      startX: point.x,
      startY: point.y,
      element: { ...element },
    });
  }

  async function saveScene() {
    setStatus("正在保存到 OBS 场景...");
    try {
      const response = await fetch("/api/scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scene),
      });

      if (!response.ok) {
        throw new Error("Save failed");
      }

      setStatus("已保存，/live 会在 1 秒内同步");
      setHasUnsavedChanges(false);
    } catch {
      setStatus("保存失败，请确认开发服务器仍在运行");
    }
  }

  function resetTemplate() {
    const nextScene = createDefaultScene();
    setScene(nextScene);
    setSelectedId("main-title");
    setStatus("已恢复默认模板，保存后 OBS 生效");
    setHasUnsavedChanges(true);
  }

  function addTextElement() {
    const element = createTextElement();
    changeScene((currentScene) => ({
      ...currentScene,
      elements: [...currentScene.elements, element],
    }));
    setSelectedId(element.id);
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
        setStatus("素材已替换，保存后 OBS 生效");
        return;
      }

      const element = createImageElement(payload.src, payload.name || "自定义素材");
      changeScene((currentScene) => ({
        ...currentScene,
        elements: [...currentScene.elements, element],
      }));
      setSelectedId(element.id);
      setStatus("素材已添加，保存后 OBS 生效");
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
    if (!selectedElement) {
      return;
    }

    changeScene((currentScene) => {
      const elements = currentScene.elements.filter(
        (element) => element.id !== selectedElement.id,
      );
      return { ...currentScene, elements };
    });
    setSelectedId(scene.elements.find((element) => element.id !== selectedElement.id)?.id ?? "");
  }

  async function exportPng() {
    setStatus("正在导出 PNG...");

    try {
      const exportScene = await inlineSceneAssets(scene);
      const svgMarkup = sceneToSvgMarkup(exportScene);
      const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);

      await new Promise<void>((resolve, reject) => {
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

          context.drawImage(image, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          const download = document.createElement("a");
          download.href = canvas.toDataURL("image/png");
          download.download = `covercast-${new Date().toISOString().slice(0, 10)}.png`;
          download.click();
          resolve();
        };
        image.onerror = () => reject(new Error("SVG render failed"));
        image.src = svgUrl;
      });

      URL.revokeObjectURL(svgUrl);
      setStatus("PNG 已导出，尺寸 941×1672");
    } catch {
      setStatus("导出失败，请确认所有素材都能正常显示");
    }
  }

  const liveUrl = "http://localhost:3000/live";

  return (
    <main className="editor-shell">
      <section className="editor-toolbar" aria-label="Covercast editor controls">
        <div>
          <p className="eyebrow">Covercast</p>
          <h1>OBS 直播背景编辑器</h1>
        </div>
        <div className="toolbar-actions">
          <button type="button" className="secondary-button" onClick={addTextElement}>
            添加文字
          </button>
          <label className="secondary-button file-button">
            添加图片
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => handleAssetInput(event, "add")}
            />
          </label>
          <button type="button" className="secondary-button" onClick={resetTemplate}>
            重置模板
          </button>
          <button type="button" className="primary-button" onClick={() => void saveScene()}>
            保存到 OBS
          </button>
          <button type="button" className="primary-button muted" onClick={() => void exportPng()}>
            导出 PNG
          </button>
        </div>
      </section>

      <section className="editor-grid">
        <aside className="left-panel" aria-label="Scene settings">
          <PanelTitle title="画布" caption="941×1672 竖屏" />
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
          <div className="live-url">
            <span>OBS 浏览器源</span>
            <a href="/live" target="_blank" rel="noreferrer">
              {liveUrl}
            </a>
          </div>

          <PanelTitle title="元素" caption={`${scene.elements.length} 个图层`} />
          <div className="element-list">
            {scene.elements.map((element) => (
              <button
                key={element.id}
                type="button"
                className={element.id === selectedId ? "element-row active" : "element-row"}
                onClick={() => setSelectedId(element.id)}
              >
                <span>{element.name}</span>
                <small>{element.type}</small>
              </button>
            ))}
          </div>
        </aside>

        <section className="stage-panel" aria-label="Canvas preview">
          <div className="stage-header">
            <span>{hasUnsavedChanges ? "有未保存更改" : status}</span>
            <span>拖拽移动，右下角黄点缩放</span>
          </div>
          <div className="stage-viewport">
            <SceneCanvas
              scene={scene}
              className="scene-preview"
              idPrefix="editor"
              interactive
              selectedId={selectedId}
              svgRef={svgRef}
              onCanvasPointerDown={() => setSelectedId("")}
              onElementPointerDown={handleElementPointerDown}
              onResizePointerDown={handleResizePointerDown}
            />
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
  onDelete,
  onReplaceImage,
}: {
  element: SceneElement;
  onPatch: (patch: Partial<SceneElement>) => void;
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
      <TextField
        label="字体"
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

function ShapeInspector({
  element,
  onPatch,
}: {
  element: ShapeElement;
  onPatch: (patch: Partial<SceneElement>) => void;
}) {
  return (
    <>
      <ColorField
        label="填充"
        value={element.fill}
        onChange={(value) => onPatch({ fill: value } as Partial<ShapeElement>)}
      />
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

function PanelTitle({ title, caption }: { title: string; caption: string }) {
  return (
    <div className="panel-title">
      <h2>{title}</h2>
      <span>{caption}</span>
    </div>
  );
}

function TextField({
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
      <input type="text" value={value} onChange={(event) => onChange(event.currentTarget.value)} />
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

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}
