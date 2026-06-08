import { useEffect } from "react";
import { type Scene, type SceneElement } from "../lib/scene";
import { computeGuidesOptimized, computeSpacingGuidesOptimized, type GuideLine, type MeasurementGuide, type GuideContext } from "../lib/smart-guide";
import { SpatialIndex, buildSpatialIndex } from "../lib/spatial-index";
import { computeBoundingBox, type BoundingBox } from "../lib/group-drag";
import { type SelectionState } from "../lib/selection";

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

type UseEditorShortcutsOptions = {
  scene: Scene;
  selection: SelectionState;
  editingTextId: string | null;
  undo: () => void;
  redo: () => void;
  copySelectedElements: () => void;
  pasteCopiedElements: () => void;
  deleteSelected: () => void;
  selectedElementRef: React.MutableRefObject<SceneElement | null>;
  elementClipboardRef: React.MutableRefObject<SceneElement | null>;
  elementsClipboardRef: React.MutableRefObject<SceneElement[] | null>;
  spatialIndexRef: React.MutableRefObject<SpatialIndex>;
  setGuidesSelectedIds: (ids: string[]) => void;
  setGuides: (guides: GuideLine[]) => void;
  setSpacingGuides: (guides: MeasurementGuide[]) => void;
  setScene: (updater: (currentScene: Scene) => Scene) => void;
  markSceneEdited: () => void;
};

export function useEditorShortcuts(options: UseEditorShortcutsOptions) {
  const {
    scene,
    selection,
    editingTextId,
    undo,
    redo,
    copySelectedElements,
    pasteCopiedElements,
    deleteSelected,
    selectedElementRef,
    elementClipboardRef,
    elementsClipboardRef,
    spatialIndexRef,
    setGuidesSelectedIds,
    setGuides,
    setSpacingGuides,
    setScene,
    markSceneEdited,
  } = options;

  useEffect(() => {
    function handleEditorKeyDown(event: KeyboardEvent) {
      const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      
      if (isEditableTarget(event.target) || editingTextId) {
        if (!arrowKeys.includes(event.key)) {
          return;
        }
      }
      
      const key = event.key.toLowerCase();
      
      if ((event.metaKey || event.ctrlKey) && key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      }

      // 处理删除快捷键 (Backspace/Delete)
      // Windows: Backspace 和 Delete 键
      // Mac: Backspace 键（标记为 "delete"）和 Fn+Delete 键
      if (event.key === "Backspace" || event.key === "Delete") {
        if (isEditableTarget(event.target) || editingTextId) {
          return;
        }
        
        if (selection.selectedIds.length === 0) {
          return;
        }
        
        event.preventDefault();
        deleteSelected();
        return;
      }

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
            
            setGuidesSelectedIds(selection.selectedIds);
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

      if ((event.metaKey || event.ctrlKey) && key === "y") {
        event.preventDefault();
        redo();
        return;
      }
      
      if (arrowKeys.includes(event.key)) {
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
            
            setGuidesSelectedIds(selection.selectedIds);
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

      if (key === "c" && selection.selectedIds.length > 0) {
        event.preventDefault();
        copySelectedElements();
        return;
      }

      if (key === "v" && (elementClipboardRef.current || elementsClipboardRef.current)) {
        event.preventDefault();
        pasteCopiedElements();
      }
    }

    window.addEventListener("keydown", handleEditorKeyDown);

    return () => {
      window.removeEventListener("keydown", handleEditorKeyDown);
    };
  }, [copySelectedElements, pasteCopiedElements, deleteSelected, undo, redo, selection.selectedIds, editingTextId, scene.elements, markSceneEdited]);
}