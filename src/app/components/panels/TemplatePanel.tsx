'use client'

import { BUILT_IN_TEMPLATES } from '@/domain'
import { type CustomSceneTemplate } from '../../hooks/useTemplateManager'
import { CustomTemplateCard } from './CustomTemplateCard'
import { Button } from '@/shared/components'
import { cn } from '@/shared/lib'
import { SidebarSection } from '../editor/sidebar/SidebarSection'
import styles from './TemplatePanel.module.css'

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
      className={cn(
        styles.templateCard,
        active && styles.templateCardActive,
        dirty && styles.templateCardDirty,
      )}
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
      <Button variant="secondary" onClick={onOpenSaveTemplateDialog}>
        {activeCustomTemplate ? '另存为模板' : '保存为模板'}
      </Button>
      <Button variant="secondary" asChild>
        <label className="relative overflow-hidden cursor-pointer">
          导入
          <input
            type="file"
            accept="application/json,.json"
            className="absolute inset-[-10px] opacity-0 cursor-inherit"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0]
              event.currentTarget.value = ''
              if (file) {
                onImport(file)
              }
            }}
          />
        </label>
      </Button>
    </>
  )
}
