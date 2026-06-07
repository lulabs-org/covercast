import { useRef, useState, useCallback } from "react";
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT, type Scene, type SceneElement } from "../lib/scene";
import { selectSingle, type SelectionState } from "../lib/selection";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function cloneSceneElement(element: SceneElement): SceneElement {
  return JSON.parse(JSON.stringify(element)) as SceneElement;
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

function createPastedSceneElement(
  element: SceneElement,
  elements: SceneElement[],
  offsetMultiplier: number,
  canvasWidth: number,
  canvasHeight: number,
): SceneElement {
  const offset = 24 * offsetMultiplier;

  return {
    ...cloneSceneElement(element),
    id: createSceneElementId(element.type),
    name: uniqueSceneElementName(`${element.name} 副本`, elements),
    x: clamp(element.x + offset, -element.width + 24, canvasWidth - 24),
    y: clamp(element.y + offset, -element.height + 24, canvasHeight - 24),
  } as SceneElement;
}

type UseClipboardOptions = {
  selectedElementRef: React.MutableRefObject<SceneElement | null>;
  sceneElementsRef: React.MutableRefObject<SceneElement[]>;
  changeScene: (updater: (currentScene: Scene) => Scene, description?: string) => void;
  setSelection: (updater: (prev: SelectionState) => SelectionState) => void;
  markSceneEdited: () => void;
  setStatus: (status: string) => void;
  canvasWidth?: number;
  canvasHeight?: number;
};

export function useClipboard(options: UseClipboardOptions) {
  const {
    selectedElementRef,
    sceneElementsRef,
    changeScene,
    setSelection,
    markSceneEdited,
    setStatus,
    canvasWidth = DEFAULT_CANVAS_WIDTH,
    canvasHeight = DEFAULT_CANVAS_HEIGHT,
  } = options;

  const elementClipboardRef = useRef<SceneElement | null>(null);
  const pasteOffsetRef = useRef(1);
  const [canPasteElement, setCanPasteElement] = useState(false);

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
  }, [selectedElementRef, setStatus]);

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
      canvasWidth,
      canvasHeight,
    );
    pasteOffsetRef.current += 1;
    sceneElementsRef.current = [...sceneElementsRef.current, pastedElement];
    selectedElementRef.current = pastedElement;

    changeScene((currentScene) => ({
      ...currentScene,
      elements: [...currentScene.elements, pastedElement],
    }), `粘贴元素「${pastedElement.name}」`);
    setSelection((prev) => selectSingle(prev, pastedElement.id));
    markSceneEdited();
    setStatus(`已粘贴「${pastedElement.name}」`);
  }, [sceneElementsRef, selectedElementRef, changeScene, setSelection, markSceneEdited, setStatus]);

  return {
    elementClipboardRef,
    canPasteElement,
    copySelectedElement,
    pasteCopiedElement,
  };
}