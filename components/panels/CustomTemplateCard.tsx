'use client'

import { useState, useRef, useEffect } from 'react'
import { type CustomSceneTemplate } from '@/stores/useTemplateStore'
import { useTemplateCardMenu } from '@/hooks/useTemplateCardMenu'
import { TemplateCardMenu } from './TemplateCardMenu'

function formatTemplateDate(value: string, prefix = '保存于') {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '保存在浏览器缓存'
  }

  return `${prefix} ${date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  })}`
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
}: {
  template: CustomSceneTemplate
  active: boolean
  dirty: boolean
  customTemplates: CustomSceneTemplate[]
  onApply: () => void
  onDuplicate: () => void
  onRename: (newName: string) => void
  onDelete: () => void
}) {
  const { isOpen, position, triggerRef, menuRef, openMenu, closeMenu } = useTemplateCardMenu()
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(template.name)
  const renameInputRef = useRef<HTMLInputElement>(null)

  const description = dirty
    ? '有未保存修改'
    : formatTemplateDate(
        template.updatedAt ?? template.createdAt,
        template.updatedAt ? '更新于' : '保存于',
      )

  const badge = dirty ? '未保存' : '自定义'

  const renameError =
    renameValue.trim() &&
    renameValue.trim() !== template.name &&
    customTemplates.some((t) => t.id !== template.id && t.name === renameValue.trim())
      ? '模板名称已存在'
      : undefined

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [isRenaming])

  function handleStartRename() {
    setIsRenaming(true)
    setRenameValue(template.name)
    closeMenu()
  }

  function handleRenameSubmit() {
    if (renameError) {
      return
    }
    const trimmedValue = renameValue.trim()
    if (trimmedValue && trimmedValue !== template.name) {
      onRename(trimmedValue)
    }
    setIsRenaming(false)
  }

  function handleRenameKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleRenameSubmit()
    } else if (event.key === 'Escape') {
      setIsRenaming(false)
      setRenameValue(template.name)
    }
  }

  return (
    <div
      className={[
        'template-card',
        active ? 'active' : '',
        dirty ? 'dirty' : '',
        renameError ? 'rename-error' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button type="button" className="template-card-button" onClick={onApply}>
        <div className="template-card-content">
          {isRenaming ? (
            <div className="template-card-rename-wrapper">
              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.currentTarget.value)}
                onKeyDown={handleRenameKeyDown}
                onBlur={handleRenameSubmit}
                className={`template-card-rename-input${renameError ? ' error' : ''}`}
              />
              {renameError ? (
                <span className="template-card-rename-error">{renameError}</span>
              ) : null}
            </div>
          ) : (
            <span className="template-card-name">{template.name}</span>
          )}
          <small className="template-card-desc">{description}</small>
        </div>
        <span className="template-card-badge">{badge}</span>
      </button>
      <button
        ref={triggerRef}
        type="button"
        className="template-card-more"
        aria-label={`更多操作 ${template.name}`}
        onClick={openMenu}
        title="更多操作"
      >
        ⋯
      </button>
      <TemplateCardMenu
        key={isOpen ? 'open' : 'closed'}
        isOpen={isOpen}
        position={position}
        menuRef={menuRef}
        onDuplicate={onDuplicate}
        onRename={handleStartRename}
        onDelete={onDelete}
        onClose={closeMenu}
      />
    </div>
  )
}
