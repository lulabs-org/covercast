'use client'

import { createPortal } from 'react-dom'

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
      className="template-card-menu"
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
        className="template-card-menu-item"
        onClick={handleDuplicateClick}
        role="menuitem"
      >
        创建副本
      </button>
      <button
        type="button"
        className="template-card-menu-item"
        onClick={handleRenameClick}
        role="menuitem"
      >
        重命名
      </button>
      <button
        type="button"
        className="template-card-menu-item template-card-menu-item-danger"
        onClick={handleDeleteClick}
        role="menuitem"
      >
        删除
      </button>
    </div>
  )

  return createPortal(menuContent, document.body)
}
