import { useState, useEffect } from "react";
import {
  BUILT_IN_TEMPLATES,
  DEFAULT_TEMPLATE_ID,
  cloneScene,
  type Scene,
  type SceneElement,
  isImageElement,
} from "../lib/scene";
import { selectSingle, type SelectionState } from "../lib/selection";

const TEMPLATE_EXPORT_FORMAT = "covercast.template";
const CUSTOM_TEMPLATE_STORAGE_KEY = "covercast.customTemplates.v1";

type CustomSceneTemplate = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
  scene: Scene;
};

type TemplateExportPayload = {
  format: typeof TEMPLATE_EXPORT_FORMAT;
  version: 1;
  template: CustomSceneTemplate;
};

type SceneSlotInfo = {
  templateId: string;
  slotId: string;
  name: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
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

function scenesMatch(left: Scene, right: Scene) {
  return JSON.stringify(left) === JSON.stringify(right);
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

function createCustomTemplateId() {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function uniqueTemplateName(name: string, templates: CustomSceneTemplate[]) {
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

type UseTemplateManagerOptions = {
  scene: Scene;
  selection: SelectionState;
  setScene: (scene: Scene) => void;
  setSelection: (value: SelectionState | ((prev: SelectionState) => SelectionState)) => void;
  setStatus: (status: string) => void;
  templateSlots: SceneSlotInfo[];
  setActiveSlotId: (slotId: string) => void;
};

export function useTemplateManager(options: UseTemplateManagerOptions) {
  const {
    scene,
    selection,
    setScene,
    setSelection,
    setStatus,
    templateSlots,
    setActiveSlotId,
  } = options;

  const [customTemplates, setCustomTemplates] = useState<CustomSceneTemplate[]>([]);
  const [customTemplateName, setCustomTemplateName] = useState("");
  const [activeTemplateId, setActiveTemplateId] = useState<string>(DEFAULT_TEMPLATE_ID);
  const [showTemplateForm, setShowTemplateForm] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCustomTemplates(readCustomTemplatesFromStorage());
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const activeBuiltInTemplate =
    BUILT_IN_TEMPLATES.find((template) => template.id === activeTemplateId) ?? null;
  const activeCustomTemplate =
    customTemplates.find((template) => template.id === activeTemplateId) ?? null;
  const activeTemplate = activeBuiltInTemplate ?? activeCustomTemplate;
  const hasUnsavedCustomTemplateChanges = activeCustomTemplate
    ? !scenesMatch(activeCustomTemplate.scene, scene)
    : false;

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

  function saveCustomTemplateWithName(name: string) {
    const timestamp = new Date().toISOString();
    const templateName = name.trim() || `自定义模板 ${customTemplates.length + 1}`;
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
      setActiveTemplateId(template.id);
      setStatus(`已保存「${template.name}」到浏览器缓存`);
    } catch {
      setStatus("自定义模板保存失败，浏览器缓存空间可能不足");
    }
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

  function saveSceneAsTemplate(sceneToSave: Scene, templateName: string) {
    const timestamp = new Date().toISOString();
    const name = templateName.trim() || `自定义模板 ${customTemplates.length + 1}`;
    const template: CustomSceneTemplate = {
      id: createCustomTemplateId(),
      name,
      createdAt: timestamp,
      updatedAt: timestamp,
      scene: cloneScene(sceneToSave),
    };
    const nextTemplates = [template, ...customTemplates];

    try {
      writeCustomTemplatesToStorage(nextTemplates);
      setCustomTemplates(nextTemplates);
      setActiveTemplateId(template.id);
      setStatus(`已保存「${template.name}」到浏览器缓存`);
    } catch {
      setStatus("自定义模板保存失败，浏览器缓存空间可能不足");
    }
  }

  function saveCustomTemplateWithScene(name: string, sceneToSave: Scene) {
    const timestamp = new Date().toISOString();
    const templateName = name.trim() || `自定义模板 ${customTemplates.length + 1}`;
    const template: CustomSceneTemplate = {
      id: createCustomTemplateId(),
      name: templateName,
      createdAt: timestamp,
      updatedAt: timestamp,
      scene: cloneScene(sceneToSave),
    };
    const nextTemplates = [template, ...customTemplates];

    try {
      writeCustomTemplatesToStorage(nextTemplates);
      setCustomTemplates(nextTemplates);
      setActiveTemplateId(template.id);
      setStatus(`已创建「${template.name}」`);
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

  function duplicateCustomTemplate(templateId: string) {
    const template = customTemplates.find((t) => t.id === templateId);
    if (!template) {
      return;
    }

    const timestamp = new Date().toISOString();
    const duplicatedTemplate: CustomSceneTemplate = {
      id: createCustomTemplateId(),
      name: uniqueTemplateName(`${template.name} 副本`, customTemplates),
      createdAt: timestamp,
      updatedAt: timestamp,
      scene: cloneScene(template.scene),
    };
    const nextTemplates = [duplicatedTemplate, ...customTemplates];

    try {
      writeCustomTemplatesToStorage(nextTemplates);
      setCustomTemplates(nextTemplates);
      setStatus(`已创建副本「${duplicatedTemplate.name}」`);
    } catch {
      setStatus("创建副本失败，浏览器缓存空间可能不足");
    }
  }

  function renameCustomTemplate(templateId: string, newName: string) {
    const template = customTemplates.find((t) => t.id === templateId);
    if (!template) {
      return;
    }

    const trimmedName = newName.trim();
    if (!trimmedName) {
      setStatus("模板名称不能为空");
      return;
    }

    const updatedTemplate: CustomSceneTemplate = {
      ...template,
      name: trimmedName,
      updatedAt: new Date().toISOString(),
    };
    const nextTemplates = customTemplates.map((t) =>
      t.id === templateId ? updatedTemplate : t,
    );

    try {
      writeCustomTemplatesToStorage(nextTemplates);
      setCustomTemplates(nextTemplates);
      setStatus(`已重命名为「${trimmedName}」`);
    } catch {
      setStatus("重命名失败，请检查浏览器缓存权限");
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

  return {
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
    saveSceneAsTemplate,
    saveCustomTemplateWithName,
    saveCustomTemplateWithScene,
    saveActiveCustomTemplate,
    deleteCustomTemplate,
    duplicateCustomTemplate,
    renameCustomTemplate,
    exportTemplateJson,
    importTemplateFile,
  };
}

export type { CustomSceneTemplate, SceneSlotInfo };