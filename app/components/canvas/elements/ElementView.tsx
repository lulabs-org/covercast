import { type PointerEvent } from "react";
import { type SceneElement } from "../../../lib/scene";
import { ShapeElementView } from "./ShapeElementView";
import { TextElementView } from "./TextElementView";
import { ImageElementView } from "./ImageElementView";

export function ElementView({
  element,
  idPrefix,
  interactive,
  editingTextId,
  onPointerDown,
  onDoubleClick,
}: {
  element: SceneElement;
  idPrefix: string;
  interactive: boolean;
  editingTextId?: string | null;
  onPointerDown?: (
    elementId: string,
    event: PointerEvent<SVGGElement>,
  ) => void;
  onDoubleClick?: (elementId: string) => void;
}) {
  return (
    <g
      className={interactive ? `scene-element${element.locked ? " locked" : ""}` : undefined}
      data-element-id={element.id}
      onPointerDown={(event) => {
        if (!interactive) {
          return;
        }

        event.stopPropagation();
        onPointerDown?.(element.id, event);
      }}
      onDoubleClick={() => {
        if (!interactive || element.type !== "text") {
          return;
        }
        
        onDoubleClick?.(element.id);
      }}
    >
      {renderElement(element, idPrefix, interactive, editingTextId)}
    </g>
  );
}

function renderElement(
  element: SceneElement,
  idPrefix: string,
  interactive: boolean,
  editingTextId?: string | null,
) {
  if (element.type === "text") {
    return <TextElementView element={element} interactive={interactive} editing={editingTextId === element.id} />;
  }

  if (element.type === "image") {
    return <ImageElementView element={element} idPrefix={idPrefix} interactive={interactive} />;
  }

  return <ShapeElementView element={element} idPrefix={idPrefix} />;
}