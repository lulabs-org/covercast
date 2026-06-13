'use client'

import type { ReactNode } from 'react'
import { useEditor } from '../../EditorContext'
import { LayerPanel } from '../../panels/LayerPanel'
import { SourcesPanel } from '../../panels/SourcesPanel'
import { TemplatePanel } from '../../panels/TemplatePanel'
import { CanvasSizeSelector } from '../../controls/CanvasSizeSelector'
import { useEditorStore } from '@/stores/useEditorStore'
import { BUILT_IN_TEMPLATES } from '@/lib/templates'
import styles from '../../SceneEditor.module.css'

interface LeftSidebarProps {
  leftPanelRef: React.RefObject<HTMLDivElement | null>
  leftPanelWidth: number
}

export function LeftSidebar({ leftPanelRef, leftPanelWidth }: LeftSidebarProps) {
  const { toggleElementHidden, toggleElementLocked, moveElementLayer } = useEditor()

  // ── Editor Store ──
  const scene = useEditorStore((s) => s.scene)
  const selection = useEditorStore((s) => s.selection)
  const setSelection = useEditorStore((s) => s.setSelection)
  const changeSceneWithHistory = useEditorStore((s) => s.changeSceneWithHistory)
  const applyTemplateAction = useEditorStore((s) => s.applyTemplateAction)

  // ── Canvas slice ──
  const canvasSize = useEditorStore((s) => s.canvasSize)
  const presets = useEditorStore((s) => s.presets)
  const currentPreset = useEditorStore((s) => s.currentPreset)
  const isCustomSize = useEditorStore((s) => s.isCustomSize)
  const setPresetSize = useEditorStore((s) => s.setPresetSize)
  const setCustomSize = useEditorStore((s) => s.setCustomSize)
  const collapsedSections = useEditorStore((s) => s.collapsedSections)
  const toggleSidebarSection = useEditorStore((s) => s.toggleSidebarSection)
  const setStatus = useEditorStore((s) => s.setStatus)
  const appOrigin = useEditorStore((s) => s.appOrigin)

  // ── Template slice ──
  const customTemplates = useEditorStore((s) => s.customTemplates)
  const activeTemplateId = useEditorStore((s) => s.activeTemplateId)
  const templateSlots = useEditorStore((s) => s.templateSlots)
  const activeSlotId = useEditorStore((s) => s.activeSlotId)
  const setTemplateSlots = useEditorStore((s) => s.setTemplateSlots)
  const addSlot = useEditorStore((s) => s.addSlot)
  const removeSlot = useEditorStore((s) => s.removeSlot)
  const selectSlotForEditing = useEditorStore((s) => s.selectSlotForEditing)
  const getSlotUrl = useEditorStore((s) => s.getSlotUrl)
  const writeSlotNameToStorage = useEditorStore((s) => s.writeSlotNameToStorage)
  const duplicateCustomTemplate = useEditorStore((s) => s.duplicateCustomTemplate)
  const renameCustomTemplate = useEditorStore((s) => s.renameCustomTemplate)
  const deleteCustomTemplate = useEditorStore((s) => s.deleteCustomTemplate)
  const activeTemplate = useEditorStore((s) => s.getActiveCustomTemplate())
  const hasUnsavedCustomTemplateChanges = useEditorStore((s) => s.getHasUnsavedChanges(scene))

  // ── Computed ──
  const activeSlot = templateSlots.find((slot) => slot.slotId === activeSlotId) ?? null
  const editingContextCaption = activeTemplate
    ? hasUnsavedCustomTemplateChanges
      ? '自定义模板有未保存修改'
      : '自定义模板已保存'
    : (activeSlot?.name ?? '未选择 OBS 源')

  // ── Handlers ──
  function handleApplyBuiltInTemplate(templateId: string) {
    const found = BUILT_IN_TEMPLATES.find((t) => t.id === templateId)
    if (found) applyTemplateAction(found)
  }

  function handleAddSlot(templateId: string) {
    void addSlot(templateId).then((name) => {
      if (name) setStatus(`已创建浏览器源「${name}」`)
      else setStatus('创建浏览器源失败')
    })
  }

  function handleRemoveSlot(templateId: string, slotId: string) {
    void removeSlot(templateId, slotId).then((ok) => {
      if (!ok) setStatus('删除浏览器源失败')
    })
  }

  function handleGetSlotUrl(templateId: string, slotId: string) {
    return getSlotUrl(templateId, slotId, appOrigin)
  }

  return (
    <aside
      ref={leftPanelRef}
      className={styles.leftPanel}
      data-scrollable
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
              changeSceneWithHistory((currentScene) => ({
                ...currentScene,
                backgroundColor: value,
              }))
            }
          />
          <OpacityField
            label="背景透明度"
            value={scene.backgroundOpacity}
            onChange={(value) =>
              changeSceneWithHistory((currentScene) => ({
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
        onAddSlot={handleAddSlot}
        onRemoveSlot={handleRemoveSlot}
        onSelectSlot={selectSlotForEditing}
        onRenameSlot={(templateId, slotId, newName) => {
          writeSlotNameToStorage(templateId, slotId, newName)
          setTemplateSlots((prev) =>
            prev.map((s) =>
              s.templateId === templateId && s.slotId === slotId ? { ...s, name: newName } : s,
            ),
          )
        }}
        getSlotUrl={handleGetSlotUrl}
        setStatus={setStatus}
      />

      <TemplatePanel
        customTemplates={customTemplates}
        activeTemplateId={activeTemplateId}
        hasUnsavedCustomTemplateChanges={hasUnsavedCustomTemplateChanges}
        collapsed={collapsedSections.templates}
        onToggle={() => toggleSidebarSection('templates')}
        onApplyBuiltInTemplate={handleApplyBuiltInTemplate}
        onApplyCustomTemplate={applyTemplateAction}
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
