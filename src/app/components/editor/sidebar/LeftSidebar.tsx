'use client'

import type { Ref } from 'react'
import { LayerPanel } from '../../panels/LayerPanel'
import { SourcesPanel } from '../../panels/SourcesPanel'
import { TemplatePanel } from '../../panels/TemplatePanel'
import { CanvasSizeSelector } from '../../controls/CanvasSizeSelector'
import { SidebarSection } from './SidebarSection'
import type { Scene } from '../../../lib/scene'
import type { SelectionState } from '../../../lib/selection'
import type { CustomSceneTemplate, SceneSlotInfo } from '../../../hooks/useTemplateManager'
import type { CanvasSize, CanvasSizePreset } from '../../../hooks/useCanvasSize'
import { ColorPicker, Slider } from '@/shared/components'
import { clamp } from '@/shared/lib'
import styles from './LeftSidebar.module.css'
import editorStyles from '../editor.module.css'
import formStyles from '../../forms.module.css'

type SidebarSectionId = 'scene' | 'sources' | 'templates' | 'layers'

type LeftSidebarProps = {
  // Panel
  leftPanelRef: Ref<HTMLDivElement>
  leftPanelWidth: number

  // Context
  activeTemplate: CustomSceneTemplate | null
  hasUnsavedCustomTemplateChanges: boolean
  editingContextCaption: string

  // Sections
  collapsedSections: Record<SidebarSectionId, boolean>
  toggleSidebarSection: (sectionId: SidebarSectionId) => void

  // Scene settings
  scene: Scene
  changeScene: (updater: (currentScene: Scene) => Scene, description?: string) => void

  // Canvas size
  canvasSize: CanvasSize
  presets: CanvasSizePreset[]
  currentPreset?: CanvasSizePreset
  isCustomSize: boolean
  onPresetSizeChange: (preset: CanvasSizePreset) => void
  onCustomSizeChange: (width: number, height: number) => void

  // Sources
  templateSlots: SceneSlotInfo[]
  customTemplates: CustomSceneTemplate[]
  activeSlotId: string
  addSlot: (templateId: string) => Promise<void>
  removeSlot: (templateId: string, slotId: string) => Promise<void>
  selectSlotForEditing: (slotId: string) => void
  writeSlotNameToStorage: (templateId: string, slotId: string, name: string) => void
  setTemplateSlots: React.Dispatch<React.SetStateAction<SceneSlotInfo[]>>
  getSlotUrl: (templateId: string, slotId: string) => string
  setStatus: (status: string) => void

  // Templates
  activeTemplateId: string
  applyBuiltInTemplate: (templateId: string) => void
  applyTemplate: (template: { id: string; name: string; scene: Scene }) => void
  duplicateCustomTemplate: (templateId: string) => void
  renameCustomTemplate: (templateId: string, newName: string) => void
  deleteCustomTemplate: (templateId: string) => void

  // Layers
  selection: SelectionState
  setSelection: React.Dispatch<React.SetStateAction<SelectionState>>
  toggleElementHidden: (elementId: string) => void
  toggleElementLocked: (elementId: string) => void
  moveElementLayer: (elementId: string, direction: 'forward' | 'backward') => void
}

export function LeftSidebar({
  leftPanelRef,
  leftPanelWidth,
  activeTemplate,
  hasUnsavedCustomTemplateChanges,
  editingContextCaption,
  collapsedSections,
  toggleSidebarSection,
  scene,
  changeScene,
  canvasSize,
  presets,
  currentPreset,
  isCustomSize,
  onPresetSizeChange,
  onCustomSizeChange,
  templateSlots,
  customTemplates,
  activeSlotId,
  addSlot,
  removeSlot,
  selectSlotForEditing,
  writeSlotNameToStorage,
  setTemplateSlots,
  getSlotUrl,
  setStatus,
  activeTemplateId,
  applyBuiltInTemplate,
  applyTemplate,
  duplicateCustomTemplate,
  renameCustomTemplate,
  deleteCustomTemplate,
  selection,
  setSelection,
  toggleElementHidden,
  toggleElementLocked,
  moveElementLayer,
}: LeftSidebarProps) {
  return (
    <aside
      ref={leftPanelRef}
      className={editorStyles.leftPanel}
      aria-label="Scene settings"
      style={{ width: `${leftPanelWidth}px` }}
    >
      <div className={styles.sidebarContext}>
        <span className={styles.contextLabel}>当前编辑</span>
        <strong>
          {activeTemplate?.name ?? '自定义场景'}
          {hasUnsavedCustomTemplateChanges ? (
            <span className={styles.unsavedPill}>未保存</span>
          ) : null}
        </strong>
        <small>{editingContextCaption}</small>
      </div>

      <SidebarSection
        title="场景"
        caption={`${canvasSize.width}×${canvasSize.height}`}
        collapsed={collapsedSections.scene}
        onToggle={() => toggleSidebarSection('scene')}
      >
        <div className="section-fields">
          <CanvasSizeSelector
            canvasSize={canvasSize}
            presets={presets}
            currentPreset={currentPreset}
            isCustomSize={isCustomSize}
            onPresetChange={onPresetSizeChange}
            onCustomSizeChange={onCustomSizeChange}
          />
          <ColorField
            label="背景颜色"
            value={scene.backgroundColor}
            onChange={(value) =>
              changeScene((currentScene) => ({
                ...currentScene,
                backgroundColor: value,
              }))
            }
          />
          <OpacityField
            label="背景透明度"
            value={scene.backgroundOpacity}
            onChange={(value) =>
              changeScene((currentScene) => ({
                ...currentScene,
                backgroundOpacity: value,
              }))
            }
          />
        </div>
      </SidebarSection>

      <SourcesPanel
        templateSlots={templateSlots}
        customTemplates={customTemplates}
        activeSlotId={activeSlotId}
        collapsed={collapsedSections.sources}
        onToggle={() => toggleSidebarSection('sources')}
        onAddSlot={(templateId) => void addSlot(templateId)}
        onRemoveSlot={(templateId, slotId) => void removeSlot(templateId, slotId)}
        onSelectSlot={selectSlotForEditing}
        onRenameSlot={(templateId, slotId, newName) => {
          writeSlotNameToStorage(templateId, slotId, newName)
          setTemplateSlots((prev) =>
            prev.map((s) =>
              s.templateId === templateId && s.slotId === slotId ? { ...s, name: newName } : s,
            ),
          )
        }}
        getSlotUrl={getSlotUrl}
        setStatus={setStatus}
      />

      <TemplatePanel
        customTemplates={customTemplates}
        activeTemplateId={activeTemplateId}
        hasUnsavedCustomTemplateChanges={hasUnsavedCustomTemplateChanges}
        collapsed={collapsedSections.templates}
        onToggle={() => toggleSidebarSection('templates')}
        onApplyBuiltInTemplate={applyBuiltInTemplate}
        onApplyCustomTemplate={applyTemplate}
        onDuplicateCustomTemplate={duplicateCustomTemplate}
        onRenameCustomTemplate={renameCustomTemplate}
        onDeleteCustomTemplate={deleteCustomTemplate}
      />

      <LayerPanel
        elements={scene.elements}
        selection={selection}
        collapsed={collapsedSections.layers}
        onToggle={() => toggleSidebarSection('layers')}
        onSelect={setSelection}
        onToggleHidden={toggleElementHidden}
        onToggleLocked={toggleElementLocked}
        onMoveLayer={moveElementLayer}
      />
    </aside>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className={`${formStyles.field} ${formStyles.colorField}`}>
      <span>{label}</span>
      <ColorPicker value={value} onChange={onChange} />
    </label>
  )
}

function OpacityField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  const opacity = clamp(value, 0, 1)

  return (
    <label className={`${formStyles.field} ${formStyles.opacityField}`}>
      <span>{label}</span>
      <div>
        <Slider min={0} max={1} step={0.01} value={opacity} onValueChange={onChange} />
        <input
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={opacity.toFixed(2)}
          onChange={(event) => onChange(Number(event.currentTarget.value))}
        />
      </div>
    </label>
  )
}
