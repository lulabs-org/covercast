'use client'

import { useState, useRef, useCallback } from 'react'
import type { CustomSceneTemplate } from '@/stores/useTemplateStore'
import { TemplateCardMenu } from './TemplateCardMenu'
import styles from './template.module.css'

interface CustomTemplateCardProps {
  template: CustomSceneTemplate
  active: boolean
  dirty: boolean
  customTemplates: CustomSceneTemplate[]
  onApply: () => void
  onDuplicate: () => void
  onRename: (newName: string) => void
  onDelete: () => void
}

export function CustomTemplateCard({
  template,
  active,
  dirty,
  customTemplates,
  onApply,
  onDuplicate,
  onRename,
  onDelete,
}: CustomTemplateCardProps) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameDraft, setRenameDraft] = useState(template.name)
  const [renameError, setRenameError] = useState<string | undefined>()
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  const handleStartRename = useCallback(() => {
    setRenameDraft(template.name)
    setRenameError(undefined)
    setIsRenaming(true)
  }, [template.name])

  const handleFinishRename = useCallback(() => {
    const trimmed = renameDraft.trim()
    if (!trimmed) {
      setRenameError('名称不能为空')
      return
    }
    if (trimmed !== template.name) {
      const isDuplicate = customTemplates.some(
        (t) => t.id !== template.id && t.name.toLowerCase() === trimmed.toLowerCase(),
      )
      if (isDuplicate) {
        setRenameError('已存在同名模板')
        return
      }
      onRename(trimmed)
    }
    setIsRenaming(false)
    setRenameError(undefined)
  }, [renameDraft, template.name, template.id, customTemplates, onRename])

  const handleMoreClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    setMenuPosition({ x: rect.left, y: rect.bottom + 4 })
    setMenuOpen(true)
  }, [])

  const handleMenuClose = useCallback(() => {
    setMenuOpen(false)
  }, [])

  const handleMenuDuplicate = useCallback(() => {
    onDuplicate()
  }, [onDuplicate])

  const handleMenuRename = useCallback(() => {
    handleStartRename()
  }, [handleStartRename])

  const handleMenuDelete = useCallback(() => {
    onDelete()
  }, [onDelete])

  return (
    <div
      className={[
        styles.templateCard,
        active ? styles.active : '',
        dirty ? styles.dirty : '',
        renameError ? styles.renameError : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isRenaming ? (
        <div className={styles.templateCardRenameWrapper}>
          <input
            className={`${styles.templateCardRenameInput}${renameError ? ` ${styles.error}` : ''}`}
            type="text"
            value={renameDraft}
            onChange={(e) => {
              setRenameDraft(e.currentTarget.value)
              setRenameError(undefined)
            }}
            onBlur={handleFinishRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleFinishRename()
              if (e.key === 'Escape') {
                setIsRenaming(false)
                setRenameError(undefined)
              }
            }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
          {renameError && <span className={styles.templateCardRenameError}>{renameError}</span>}
        </div>
      ) : (
        <button type="button" className={styles.templateCardButton} onClick={onApply}>
          <div className={styles.templateCardContent}>
            <span className={styles.templateCardName}>{template.name}</span>
            <small className={styles.templateCardDesc}>自定义模板</small>
          </div>
          <span className={styles.templateCardBadge}>自定义</span>
        </button>
      )}
      <button
        type="button"
        className={styles.templateCardMore}
        onClick={handleMoreClick}
        title="更多操作"
      >
        ⋯
      </button>
      <TemplateCardMenu
        isOpen={menuOpen}
        position={menuPosition}
        menuRef={menuRef}
        onDuplicate={handleMenuDuplicate}
        onRename={handleMenuRename}
        onDelete={handleMenuDelete}
        onClose={handleMenuClose}
      />
    </div>
  )
}
