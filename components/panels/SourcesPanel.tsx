'use client'

import { type ReactNode, useState } from 'react'
import { BUILT_IN_TEMPLATES } from '@/lib/templates'
import { type CustomSceneTemplate, type SceneSlotInfo } from '@/stores/useTemplateStore'

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

function EditableSlotName({ name, onSave }: { name: string; onSave: (value: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)

  if (editing) {
    return (
      <input
        className="slot-name-input"
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.currentTarget.value)}
        onBlur={() => {
          const trimmed = draft.trim()
          if (trimmed && trimmed !== name) {
            onSave(trimmed)
          }
          setEditing(false)
          setDraft(name)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const trimmed = draft.trim()
            if (trimmed && trimmed !== name) {
              onSave(trimmed)
            }
            setEditing(false)
            setDraft(name)
          }
          if (e.key === 'Escape') {
            setEditing(false)
            setDraft(name)
          }
        }}
        autoFocus
        onClick={(e) => e.stopPropagation()}
      />
    )
  }

  return (
    <span
      className="slot-name"
      onClick={(e) => {
        e.stopPropagation()
        setDraft(name)
        setEditing(true)
      }}
      title="点击重命名"
    >
      {name}
    </span>
  )
}

export function SourcesPanel({
  templateSlots,
  customTemplates,
  activeSlotId,
  collapsed,
  onToggle,
  onAddSlot,
  onRemoveSlot,
  onSelectSlot,
  onRenameSlot,
  getSlotUrl,
  setStatus,
}: {
  templateSlots: SceneSlotInfo[]
  customTemplates: CustomSceneTemplate[]
  activeSlotId: string
  collapsed: boolean
  onToggle: () => void
  onAddSlot: (templateId: string) => void
  onRemoveSlot: (templateId: string, slotId: string) => void
  onSelectSlot: (slotId: string) => void
  onRenameSlot: (templateId: string, slotId: string, newName: string) => void
  getSlotUrl: (templateId: string, slotId: string) => string
  setStatus: (status: string) => void
}) {
  return (
    <SidebarSection
      title="OBS 源"
      caption={`${templateSlots.length} 个源`}
      collapsed={collapsed}
      onToggle={onToggle}
    >
      <div className="source-create-row">
        <span>新建浏览器源</span>
        <select
          className="template-select-dropdown"
          value=""
          onChange={(e) => {
            if (e.currentTarget.value) {
              onAddSlot(e.currentTarget.value)
              e.currentTarget.value = ''
            }
          }}
          title="选择模板创建浏览器源"
        >
          <option value="" disabled>
            选择模板...
          </option>
          <optgroup label="内置模板">
            {BUILT_IN_TEMPLATES.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </optgroup>
          {customTemplates.length > 0 && (
            <optgroup label="自定义模板">
              {customTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {templateSlots.length === 0 ? (
        <div className="live-url-empty">
          <p>暂无浏览器源，请从上方选择模板创建</p>
        </div>
      ) : (
        <div className="slot-list">
          {templateSlots.map((slot) => {
            const url = getSlotUrl(slot.templateId, slot.slotId)
            const isActive = slot.slotId === activeSlotId
            const template =
              BUILT_IN_TEMPLATES.find((t) => t.id === slot.templateId) ??
              customTemplates.find((t) => t.id === slot.templateId)
            const templateName = template?.name ?? '未命名模板'

            return (
              <div
                key={`${slot.templateId}/${slot.slotId}`}
                className={`slot-item${isActive ? ' active' : ''}`}
                onClick={() => onSelectSlot(slot.slotId)}
              >
                <div className="slot-item-header">
                  <div className="slot-title-group">
                    <span className="slot-template-badge">{templateName}</span>
                    <EditableSlotName
                      name={slot.name}
                      onSave={(newName) => onRenameSlot(slot.templateId, slot.slotId, newName)}
                    />
                  </div>
                  <button
                    type="button"
                    className="slot-delete-button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveSlot(slot.templateId, slot.slotId)
                    }}
                    title="删除此浏览器源"
                  >
                    ×
                  </button>
                </div>
                <div className="slot-item-url">
                  <code>{url}</code>
                  <button
                    type="button"
                    className="slot-copy-button"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigator.clipboard.writeText(url).then(() => {
                        setStatus('URL 已复制到剪贴板')
                      })
                    }}
                    title="复制到剪贴板"
                  >
                    复制 URL
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </SidebarSection>
  )
}
