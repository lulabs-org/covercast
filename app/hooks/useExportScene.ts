"use client";

import { CANVAS_HEIGHT, CANVAS_WIDTH, isImageElement, type ImageElement, type Scene } from "../lib/scene";
import { sceneToSvgMarkup } from "../lib/scene-svg";

export type ExportFormat = "png" | "jpeg" | "svg" | "json";

export const EXPORT_FORMAT_OPTIONS: {
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

export function useExportScene(
  scene: Scene,
  setStatus: (status: string) => void,
  exportTemplateJson: () => void,
) {
  const exportScene = async (format: ExportFormat) => {
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
  };

  return {
    exportScene,
  };
}