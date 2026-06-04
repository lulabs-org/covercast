import { useEffect } from "react";
import {
  BUILT_IN_TEMPLATES,
  type Scene,
} from "../lib/scene";
import { selectSingle, type SelectionState } from "../lib/selection";

export function useSceneLoader({
  setScene,
  setStatus,
  setActiveTemplateId,
  setSelection,
}: {
  setScene: React.Dispatch<React.SetStateAction<Scene>>;
  setStatus: (status: string) => void;
  setActiveTemplateId: (id: string) => void;
  setSelection: React.Dispatch<React.SetStateAction<SelectionState>>;
}) {
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
}