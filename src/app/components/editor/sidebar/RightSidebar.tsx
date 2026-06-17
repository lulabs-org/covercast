'use client'

import type { Ref } from 'react'
import { ElementInspector } from '../../panels/ElementInspector'
import type { SceneElement } from '@/domain'
import type { useLocalFonts } from '../../../hooks/useLocalFonts'

type LocalFontManager = ReturnType<typeof useLocalFonts>

type RightSidebarProps = {
  // Panel
  rightPanelRef: Ref<HTMLDivElement>
  rightPanelWidth: number

  // Selected element
  selectedElement: SceneElement | null
  allElements: SceneElement[]

  // ElementInspector actions
  patchSelected: (patch: Partial<SceneElement>) => void
  copySelectedElements: () => void
  pasteCopiedElements: () => void
  canPasteElement: boolean
  deleteSelected: () => void
  handleAssetInput: (event: React.ChangeEvent<HTMLInputElement>, mode: 'add' | 'replace') => void

  // Local font manager
  localFontManager: LocalFontManager
}

export function RightSidebar({
  rightPanelRef,
  rightPanelWidth,
  selectedElement,
  allElements,
  patchSelected,
  copySelectedElements,
  pasteCopiedElements,
  canPasteElement,
  deleteSelected,
  handleAssetInput,
  localFontManager,
}: RightSidebarProps) {
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
          allElements={allElements}
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
