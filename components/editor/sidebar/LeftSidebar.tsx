'use client'

import type { ReactNode } from 'react'
import { useEditor } from '../../EditorContext'
import { LayerPanel } from '../../panels/LayerPanel'
import { SourcesPanel } from '../../panels/SourcesPanel'
import { TemplatePanel } from '../../panels/TemplatePanel'
import { CanvasSizeSelector } from '../../controls/CanvasSizeSelector'
import { useSceneStore } from '@/stores/useSceneStore'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useTemplateStore } from '@/stores/useTemplateStore'

export function LeftSidebar() {
  const { leftPanelRef, panelWidths, toggleElementHidden, toggleElementLocked, moveElementLayer } =
    useEditor()
  const leftPanelWidth = panelWidths.leftPanel

  // ── Scene Store ──
  const scene = useSceneStore((s) => s.scene)
  const changeScene = useSceneStore((s) => s.changeScene)
  const selection = useSceneStore((s) => s.selection)
  const setSelection = useSceneStore((s) => s.setSelection)

  // ── Canvas Store ──
  const canvasSize = useCanvasStore((s) => s.canvasSize)
  const presets = useCanvasStore((s) => s.presets)
  const currentPreset = useCanvasStore((s) => s.currentPreset)
  const isCustomSize = useCanvasStore((s) => s.isCustomSize)
  const setPresetSize = useCanvasStore((s) => s.setPresetSize)
  const setCustomSize = useCanvasStore((s) => s.setCustomSize)
  const collapsedSections = useCanvasStore((s) => s.collapsedSections)
  const toggleSidebarSection = useCanvasStore((s) => s.toggleSidebarSection)
  const setStatus = useCanvasStore((s) => s.setStatus)

  // ── Template Store ──
  const customTemplates = useTemplateStore((s) => s.customTemplates)
  const activeTemplateId = useTemplateStore((s) => s.activeTemplateId)
  const templateSlots = useTemplateStore((s) => s.templateSlots)
  const activeSlotId = useTemplateStore((s) => s.activeSlotId)
  const setTemplateSlots = useTemplateStore((s) => s.setTemplateSlots)
  const addSlot = useTemplateStore((s) => s.addSlot)
  const removeSlot = useTemplateStore((s) => s.removeSlot)
  const selectSlotForEditing = useTemplateStore((s) => s.selectSlotForEditing)
  const getSlotUrl = useTemplateStore((s) => s.getSlotUrl)
  const writeSlotNameToStorage = useTemplateStore((s) => s.writeSlotNameToStorage)
  const applyTemplate = useTemplateStore((s) => s.applyTemplate)
  const applyBuiltInTemplate = useTemplateStore((s) => s.applyBuiltInTemplate)
  const duplicateCustomTemplate = useTemplateStore((s) => s.duplicateCustomTemplate)
  const renameCustomTemplate = useTemplateStore((s) => s.renameCustomTemplate)
  const deleteCustomTemplate = useTemplateStore((s) => s.deleteCustomTemplate)
  const activeTemplate = useTemplateStore((s) => s.getActiveCustomTemplate())
  const hasUnsavedCustomTemplateChanges = useTemplateStore((s) => s.getHasUnsavedChanges())

  // ── Computed ──
  const activeSlot = templateSlots.find((slot) => slot.slotId === activeSlotId) ?? null
  const editingContextCaption = activeTemplate
    ? hasUnsavedCustomTemplateChanges
      ? '自定义模板有未保存修改'
      : '自定义模板已保存'
    : (activeSlot?.name ?? '未选择 OBS 源')
  return (
    <aside
      ref={leftPanelRef}
      className="left-panel"
      aria-label="Scene settings"
      style={{ width: `${leftPanelWidth}px` }}
    >
      <div className="sidebar-context">
        <span className="context-label">当前编辑</span>
        <strong>
          {activeTemplate?.name ?? '自定义场景'}
          {hasUnsavedCustomTemplateChanges ? <span className="unsaved-pill">未保存</span> : null}
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
            onPresetChange={setPresetSize}
            onCustomSizeChange={setCustomSize}
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

function SidebarSection({
  title,
  caption,
  collapsed,
  onToggle,
  children,
}: {
  title: string
  caption: string
  collapsed: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <section className="sidebar-section">
      <button
        type="button"
        className="sidebar-section-header"
        onClick={onToggle}
        aria-expanded={!collapsed}
      >
        <span>{title}</span>
        <small>{caption}</small>
        <b>{collapsed ? '＋' : '－'}</b>
      </button>
      {collapsed ? null : <div className="sidebar-section-body">{children}</div>}
    </section>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function isHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value)
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
  const colorValue = isHexColor(value) ? value : '#ffffff'

  return (
    <label className="field color-field">
      <span>{label}</span>
      <div>
        <input
          type="color"
          value={colorValue}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          placeholder="#ffffff"
        />
      </div>
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
    <label className="field opacity-field">
      <span>{label}</span>
      <div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={opacity}
          onChange={(event) => onChange(Number(event.currentTarget.value))}
        />
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
