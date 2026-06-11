import { type ChangeEvent } from "react";
import {
  createImageElement,
  isImageElement,
  type ImageElement,
  type Scene,
  type SceneElement,
} from "../lib/scene";
import { selectSingle, type SelectionState } from "../lib/selection";
import {
  buildLocalAssetSrc,
  isSupportedImageType,
  isWithinSizeLimit,
  readFileAsArrayBuffer,
  saveLocalAsset,
  type LocalAssetMeta,
} from "../lib/localAssetStorage";

export function useAssetManager({
  setStatus,
  selectedElement,
  patchElement,
  changeScene,
  selection,
  setSelection,
}: {
  setStatus: (status: string) => void;
  selectedElement: SceneElement | null | undefined;
  patchElement: (elementId: string, patch: Partial<SceneElement>) => void;
  changeScene: (updater: (currentScene: Scene) => Scene, description?: string) => void;
  selection: SelectionState;
  setSelection: React.Dispatch<React.SetStateAction<SelectionState>>;
}) {
  async function uploadAsset(file: File, mode: "add" | "replace") {
    if (!isSupportedImageType(file)) {
      setStatus("素材上传失败，仅支持 PNG、JPG、WebP");
      return;
    }

    if (!isWithinSizeLimit(file)) {
      setStatus("素材上传失败，文件大小不能超过 8MB");
      return;
    }

    setStatus("正在保存素材...");

    try {
      const assetId = `asset-${Date.now()}`;
      const buffer = await readFileAsArrayBuffer(file);

      const meta: LocalAssetMeta = {
        id: assetId,
        name: file.name,
        mime: file.type,
        size: file.size,
        createdAt: new Date().toISOString(),
      };

      await saveLocalAsset(meta, buffer);

      const src = buildLocalAssetSrc(assetId);

      if (mode === "replace" && selectedElement && isImageElement(selectedElement)) {
        patchElement(selectedElement.id, {
          src,
          alt: file.name,
        } as Partial<ImageElement>);
        setStatus("素材已替换到当前画布");
        return;
      }

      const element = createImageElement(src, file.name || "自定义素材");
      changeScene((currentScene) => ({
        ...currentScene,
        elements: [...currentScene.elements, element],
      }));
      setSelection(selectSingle(selection, element.id));
      setStatus("素材已添加到当前画布");
    } catch {
      setStatus("素材保存失败，浏览器存储空间可能不足");
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

  return {
    handleAssetInput,
  };
}
