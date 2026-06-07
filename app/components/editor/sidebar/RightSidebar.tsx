"use client";

import type { Ref } from "react";
import { ElementInspector } from "../../panels/ElementInspector";
import type { SceneElement } from "../../../lib/scene";

type RightSidebarProps = {
  // Panel
  rightPanelRef: Ref<HTMLDivElement>;
  rightPanelWidth: number;
  
  // Selected element
  selectedElement: SceneElement | null;
  allElements: SceneElement[];
  
  // ElementInspector actions
  patchSelected: (patch: Partial<SceneElement>) => void;
  copySelectedElement: () => void;
  pasteCopiedElement: () => void;
  canPasteElement: boolean;
  deleteSelected: () => void;
  handleAssetInput: (event: React.ChangeEvent<HTMLInputElement>, mode: "add" | "replace") => void;
};

export function RightSidebar({
  rightPanelRef,
  rightPanelWidth,
  selectedElement,
  allElements,
  patchSelected,
  copySelectedElement,
  pasteCopiedElement,
  canPasteElement,
  deleteSelected,
  handleAssetInput,
}: RightSidebarProps) {
  return (
    <aside
      ref={rightPanelRef}
      className="right-panel"
      aria-label="Selected element settings"
      style={{ width: `${rightPanelWidth}px` }}
    >
      <PanelTitle
        title={selectedElement ? selectedElement.name : "未选择元素"}
        caption={selectedElement ? selectedElement.id : "点击画布元素进行编辑"}
      />

      {selectedElement ? (
        <ElementInspector
          element={selectedElement}
          allElements={allElements}
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