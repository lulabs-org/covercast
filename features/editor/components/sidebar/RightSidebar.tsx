'use client'

import { useEditorActions } from '../contexts/EditorActionContext'
import { useEditorAsset } from '../contexts/EditorAssetContext'
import { useEditorFont } from '../contexts/EditorFontContext'
import { ElementInspector } from '../panels/ElementInspector'
import { useSceneStore, selectSelectedElement } from '@/stores/useSceneStore'
import styles from '@/features/editor/styles/editor-page.module.css'
import ui from '@/styles/ui.module.css'

interface RightSidebarProps {
  rightPanelRef: React.RefObject<HTMLDivElement | null>
  rightPanelWidth: number
}

export function RightSidebar({ rightPanelRef, rightPanelWidth }: RightSidebarProps) {
  const {
    patchElement,
    copySelectedElements,
    pasteCopiedElements,
    canPasteElement,
    deleteSelected,
  } = useEditorActions()
  const { handleAssetInput } = useEditorAsset()
  const localFontManager = useEditorFont()

  // ── Derived selected element via selector ──
  const selectedElement = useSceneStore(selectSelectedElement)
  const allElements = useSceneStore((s) => s.scene.elements)

  return (
    <aside
      ref={rightPanelRef}
      className={styles.rightPanel}
      data-scrollable
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
          allElements={allElements}
          onPatch={(patch) => patchElement(selectedElement.id, patch)}
          onCopy={copySelectedElements}
          onPaste={pasteCopiedElements}
          canPaste={canPasteElement}
          onDelete={deleteSelected}
          onReplaceImage={(event) => handleAssetInput(event, 'replace')}
          localFontManager={localFontManager}
        />
      ) : (
        <p className={ui.emptyState}>
          选择文字、视频框或图片素材后，可在这里调整位置、大小和样式。
        </p>
      )}
    </aside>
  )
}

function PanelTitle({ title, caption }: { title: string; caption: string }) {
  return (
    <div className={styles.panelTitle}>
      <h2>{title}</h2>
      <span>{caption}</span>
    </div>
  )
}
