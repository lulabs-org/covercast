'use client'

import { type ReactNode } from 'react'
import { BUILT_IN_TEMPLATES } from '@/lib/templates'
import { type CustomSceneTemplate } from '@/stores/useTemplateStore'
import { CustomTemplateCard } from './CustomTemplateCard'
import styles from './template.module.css'

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
      className={[styles.templateCard, active ? styles.active : '', dirty ? styles.dirty : '']
        .filter(Boolean)
        .join(' ')}
    >
      <button type="button" className={styles.templateCardButton} onClick={onApply}>
        <div className={styles.templateCardContent}>
          <span className={styles.templateCardName}>{name}</span>
          <small className={styles.templateCardDesc}>{description}</small>
        </div>
        <span className={styles.templateCardBadge}>{badge}</span>
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
      <div className={styles.templateLibrary}>
        <div className={styles.templateSection}>
          <div className={styles.templateSectionHeader}>
            <span className={styles.templateSectionTitle}>内置模板</span>
            <span className={styles.templateSectionCount}>{BUILT_IN_TEMPLATES.length} 个</span>
          </div>
          <div className={styles.templateList}>
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
          <div className={styles.templateSection}>
            <div className={styles.templateSectionHeader}>
              <span className={styles.templateSectionTitle}>自定义模板</span>
              <span className={styles.templateSectionCount}>{customTemplates.length} 个</span>
            </div>
            <div className={styles.templateList}>
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
        className={`secondary-button toolbar-template-button ${styles.toolbarTemplateButton}`}
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
