'use client'

import { BUILT_IN_TEMPLATES } from '@/lib/templates'
import { type CustomSceneTemplate } from '@/stores/useTemplateStore'
import { CustomTemplateCard } from './CustomTemplateCard'
import styles from './template.module.css'
import ui from '@/styles/ui.module.css'

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
    <section className={ui.sidebarSection}>
      <button
        type="button"
        className={ui.sidebarSectionHeader}
        onClick={onToggle}
        aria-expanded={!collapsed}
      >
        <span>模板</span>
        <small>{`${BUILT_IN_TEMPLATES.length + customTemplates.length} 个`}</small>
        <b>{collapsed ? '＋' : '－'}</b>
      </button>
      {collapsed ? null : (
        <div className={ui.sidebarSectionBody}>
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
        </div>
      )}
    </section>
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
        className={`${ui.secondaryButton} ${styles.toolbarTemplateButton}`}
        onClick={onOpenSaveTemplateDialog}
      >
        {activeCustomTemplate ? '另存为模板' : '保存为模板'}
      </button>
      <label className={`${ui.secondaryButton} ${ui.fileButton}`}>
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
