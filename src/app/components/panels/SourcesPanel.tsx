'use client'

import { useState } from 'react'
import { BUILT_IN_TEMPLATES, type CustomSceneTemplate } from '@/domain'
import type { SceneSlotInfo } from '../../hooks/useTemplateManager'
import { cn } from '@/shared/lib'
import { SidebarSection } from '../editor/sidebar/SidebarSection'
import styles from './SourcesPanel.module.css'

function EditableSlotName({ name, onSave }: { name: string; onSave: (value: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)

  if (editing) {
    return (
      <input
        className={styles.slotNameInput}
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
      className={styles.slotName}
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
      <div className={styles.sourceCreateRow}>
        <span>新建浏览器源</span>
        <select
          className={styles.templateSelectDropdown}
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
        <div className={styles.liveUrlEmpty}>
          <p>暂无浏览器源，请从上方选择模板创建</p>
        </div>
      ) : (
        <div className={styles.slotList}>
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
                className={cn(styles.slotItem, isActive && styles.slotItemActive)}
                onClick={() => onSelectSlot(slot.slotId)}
              >
                <div className={styles.slotItemHeader}>
                  <div className={styles.slotTitleGroup}>
                    <span className={styles.slotTemplateBadge}>{templateName}</span>
                    <EditableSlotName
                      name={slot.name}
                      onSave={(newName) => onRenameSlot(slot.templateId, slot.slotId, newName)}
                    />
                  </div>
                  <button
                    type="button"
                    className={styles.slotDeleteButton}
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveSlot(slot.templateId, slot.slotId)
                    }}
                    title="删除此浏览器源"
                  >
                    ×
                  </button>
                </div>
                <div className={styles.slotItemUrl}>
                  <code>{url}</code>
                  <button
                    type="button"
                    className={styles.slotCopyButton}
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
