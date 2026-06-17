import { cn } from '@/shared/lib'
import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export type DialogSize = 'sm' | 'md' | 'lg'

export interface DialogProps {
  open: boolean
  onClose: () => void
  size?: DialogSize
  children: React.ReactNode
}

const sizeStyles: Record<DialogSize, string> = {
  sm: 'min-w-[320px] max-w-[360px]',
  md: 'min-w-[320px] max-w-[420px]',
  lg: 'min-w-[480px] max-w-[560px]',
}

export function Dialog({ open, onClose, size = 'md', children }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // Escape 键关闭
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  // 点击遮罩关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-[rgba(15,23,42,0.45)] z-[100] animate-[fadeInBackdrop_0.15s_ease]"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        className={cn(
          // base styles from overlay.css .dialog-content
          'flex flex-col gap-4 p-5 px-6',
          'bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl',
          'shadow-[0_8px_24px_rgba(15,23,42,0.2)]',
          'animate-[slideInDialog_0.2s_ease]',
          // size styles
          sizeStyles[size],
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
