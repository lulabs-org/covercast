'use client'

import { type ReactNode } from 'react'
import { BUILT_IN_TEMPLATES } from '../../lib/scene'
import { type CustomSceneTemplate } from '../../stores/useTemplateStore'
import { CustomTemplateCard } from './CustomTemplateCard'

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

function TemplateCard({
  name,
  description,
  badge,
  active,
  dirty = false,
  onApply,
}: {
  name: string
  description: string
  badge: string
  active: boolean
  dirty?: boolean
  onApply: () => void
}) {
  return (
    <div
      className={['template-card', active ? 'active' : '', dirty ? 'dirty' : '']
        .filter(Boolean)
        .join(' ')}
    >
      <button type="button" className="template-card-button" onClick={onApply}>
        <div className="template-card-content">
          <span className="template-card-name">{name}</span>
          <small className="template-card-desc">{description}</small>
        </div>
        <span className="template-card-badge">{badge}</span>
      </button>
    </div>
  )
}

export function TemplatePanel({
  customTemplates,
  activeTemplateId,
  hasUnsavedCustomTemplateChanges,
  collapsed,
  onToggle,
  onApplyBuiltInTemplate,
  onApplyCustomTemplate,
  onDuplicateCustomTemplate,
  onRenameCustomTemplate,
  onDeleteCustomTemplate,
}: {
  customTemplates: CustomSceneTemplate[]
  activeTemplateId: string
  hasUnsavedCustomTemplateChanges: boolean
  collapsed: boolean
  onToggle: () => void
  onApplyBuiltInTemplate: (templateId: string) => void
  onApplyCustomTemplate: (template: CustomSceneTemplate) => void
  onDuplicateCustomTemplate: (templateId: string) => void
  onRenameCustomTemplate: (templateId: string, newName: string) => void
  onDeleteCustomTemplate: (templateId: string) => void
}) {
  return (
    <SidebarSection
      title="模板"
      caption={`${BUILT_IN_TEMPLATES.length + customTemplates.length} 个`}
      collapsed={collapsed}
      onToggle={onToggle}
    >
      <div className="template-library">
        <div className="template-section">
          <div className="template-section-header">
            <span className="template-section-title">内置模板</span>
            <span className="template-section-count">{BUILT_IN_TEMPLATES.length} 个</span>
          </div>
          <div className="template-list">
            {BUILT_IN_TEMPLATES.map((template) => (
              <TemplateCard
                key={template.id}
                name={template.name}
                description={template.description}
                badge="内置"
                active={activeTemplateId === template.id}
                onApply={() => onApplyBuiltInTemplate(template.id)}
              />
            ))}
          </div>
        </div>

        {customTemplates.length > 0 && (
          <div className="template-section">
            <div className="template-section-header">
              <span className="template-section-title">自定义模板</span>
              <span className="template-section-count">{customTemplates.length} 个</span>
            </div>
            <div className="template-list">
              {customTemplates.map((template) => (
                <CustomTemplateCard
                  key={template.id}
                  template={template}
                  active={activeTemplateId === template.id}
                  dirty={activeTemplateId === template.id && hasUnsavedCustomTemplateChanges}
                  customTemplates={customTemplates}
                  onApply={() => onApplyCustomTemplate(template)}
                  onDuplicate={() => onDuplicateCustomTemplate(template.id)}
                  onRename={(newName) => onRenameCustomTemplate(template.id, newName)}
                  onDelete={() => onDeleteCustomTemplate(template.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </SidebarSection>
  )
}

export function TemplateToolbarButtons({
  activeCustomTemplate,
  onOpenSaveTemplateDialog,
  onImport,
}: {
  activeCustomTemplate: CustomSceneTemplate | null
  onOpenSaveTemplateDialog: () => void
  onImport: (file: File) => void
}) {
  return (
    <>
      <button
        type="button"
        className="secondary-button toolbar-template-button"
        onClick={onOpenSaveTemplateDialog}
      >
        {activeCustomTemplate ? '另存为模板' : '保存为模板'}
      </button>
      <label className="secondary-button file-button">
        导入
        <input
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            event.currentTarget.value = ''
            if (file) {
              onImport(file)
            }
          }}
        />
      </label>
    </>
  )
}
