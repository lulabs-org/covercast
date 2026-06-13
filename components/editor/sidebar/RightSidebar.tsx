'use client'

import { useEditor } from '../../EditorContext'
import { ElementInspector } from '../../panels/ElementInspector'
import { useSceneStore } from '../../../../stores/useSceneStore'

export function RightSidebar() {
  const {
    rightPanelRef,
    panelWidths,
    patchSelected,
    copySelectedElements,
    pasteCopiedElements,
    canPasteElement,
    deleteSelected,
    handleAssetInput,
    localFontManager,
  } = useEditor()
  const rightPanelWidth = panelWidths.rightPanel

  // ── Scene Store ──
  const scene = useSceneStore((s) => s.scene)
  const selection = useSceneStore((s) => s.selection)

  // ── Computed ──
  const selectedElement =
    selection.selectedIds.length === 1
      ? (scene.elements.find((el) => el.id === selection.selectedIds[0]) ?? null)
      : null

  return (
    <aside
      ref={rightPanelRef}
      className="right-panel"
      aria-label="Selected element settings"
      style={{ width: `${rightPanelWidth}px` }}
    >
      <PanelTitle
        title={selectedElement ? selectedElement.name : '未选择元素'}
        caption={selectedElement ? selectedElement.id : '点击画布元素进行编辑'}
      />

      {selectedElement ? (
        <ElementInspector
          key={selectedElement.id}
          element={selectedElement}
          allElements={scene.elements}
          onPatch={patchSelected}
          onCopy={copySelectedElements}
          onPaste={pasteCopiedElements}
          canPaste={canPasteElement}
          onDelete={deleteSelected}
          onReplaceImage={(event) => handleAssetInput(event, 'replace')}
          localFontManager={localFontManager}
        />
      ) : (
        <p className="empty-state">选择文字、视频框或图片素材后，可在这里调整位置、大小和样式。</p>
      )}
    </aside>
  )
}

function PanelTitle({ title, caption }: { title: string; caption: string }) {
  return (
    <div className="panel-title">
      <h2>{title}</h2>
      <span>{caption}</span>
    </div>
  )
}
