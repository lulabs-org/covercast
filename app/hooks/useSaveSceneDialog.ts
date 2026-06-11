import { useState, useMemo, useRef } from "react";
import { type Scene } from "../lib/scene";
import { type CustomSceneTemplate, uniqueTemplateName } from "./useTemplateManager";

type UseSaveSceneDialogOptions = {
  customTemplates: CustomSceneTemplate[];
  onSave: (name: string, scene: Scene) => void;
};

export function useSaveSceneDialog(options: UseSaveSceneDialogOptions) {
  const { customTemplates, onSave } = options;

  const [showDialog, setShowDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const pendingSceneRef = useRef<Scene | null>(null);

  const trimmedName = templateName.trim();
  const nameError = useMemo(() => {
    if (!trimmedName) {
      return undefined;
    }
    const isDuplicate = customTemplates.some(
      (template) => template.name === trimmedName
    );
    return isDuplicate ? "模板名称已存在，请使用其他名称" : undefined;
  }, [trimmedName, customTemplates]);

  function openDialog(scene: Scene, defaultName?: string) {
    pendingSceneRef.current = scene;
    const resolvedName = defaultName
      ? uniqueTemplateName(defaultName, customTemplates)
      : "";
    setTemplateName(resolvedName);
    setShowDialog(true);
  }

  function closeDialog() {
    setShowDialog(false);
    setTemplateName("");
    pendingSceneRef.current = null;
  }

  function handleSave() {
    if (nameError || !pendingSceneRef.current) {
      return;
    }
    const finalName = trimmedName || `自定义模板 ${customTemplates.length + 1}`;
    onSave(finalName, pendingSceneRef.current);
    closeDialog();
  }

  return {
    showDialog,
    templateName,
    nameError,
    setTemplateName,
    openDialog,
    closeDialog,
    handleSave,
  };
}
