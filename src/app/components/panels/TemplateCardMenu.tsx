'use client'

import { createPortal } from 'react-dom'
import { cn } from '@/shared/lib'
import styles from './TemplatePanel.module.css'

type TemplateCardMenuProps = {
  isOpen: boolean
  position: { x: number; y: number }
  menuRef: React.RefObject<HTMLDivElement | null>
  onDuplicate: () => void
  onRename: () => void
  onDelete: () => void
  onClose: () => void
}

export function TemplateCardMenu({
  isOpen,
  position,
  menuRef,
  onDuplicate,
  onRename,
  onDelete,
  onClose,
}: TemplateCardMenuProps) {
  if (!isOpen) {
    return null
  }

  function handleDuplicateClick() {
    onDuplicate()
    onClose()
  }

  function handleRenameClick() {
    onRename()
  }

  function handleDeleteClick() {
    onDelete()
    onClose()
  }

  const menuContent = (
    <div
      ref={menuRef}
      className={styles.templateCardMenu}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
      }}
      role="menu"
      aria-label="模板操作菜单"
    >
      <button
        type="button"
        className={styles.templateCardMenuItem}
        onClick={handleDuplicateClick}
        role="menuitem"
      >
        创建副本
      </button>
      <button
        type="button"
        className={styles.templateCardMenuItem}
        onClick={handleRenameClick}
        role="menuitem"
      >
        重命名
      </button>
      <button
        type="button"
        className={cn(styles.templateCardMenuItem, styles.templateCardMenuItemDanger)}
        onClick={handleDeleteClick}
        role="menuitem"
      >
        删除
      </button>
    </div>
  )

  return createPortal(menuContent, document.body)
}
