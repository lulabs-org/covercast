'use client'

import { useEffect, useRef } from 'react'
import styles from '../overlay.module.css'
import ui from '@/styles/ui.module.css'

export function SaveTemplateDialog({
  show,
  title,
  templateName,
  nameError,
  onSetName,
  onSave,
  onCancel,
}: {
  show: boolean
  title: string
  templateName: string
  nameError: string | undefined
  onSetName: (name: string) => void
  onSave: () => void
  onCancel: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (show && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [show])

  useEffect(() => {
    if (show) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onCancel()
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [show, onCancel])

  if (!show) {
    return null
  }

  const handleSave = () => {
    if (nameError) {
      return
    }
    onSave()
  }

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onCancel()
    }
  }

  return (
    <div
      className={styles.dialogBackdrop}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-template-dialog-title"
    >
      <div className={styles.dialogContent}>
        <h3 id="save-template-dialog-title" className={styles.dialogTitle}>
          {title}
        </h3>
        <label className={nameError ? ui.fieldError : ui.field}>
          <span>模板名称</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="未命名模板"
            value={templateName}
            onChange={(event) => onSetName(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleSave()
              }
            }}
          />
          {nameError ? <span className={ui.fieldErrorMessage}>{nameError}</span> : null}
        </label>
        <div className={styles.dialogActions}>
          <button
            type="button"
            className={`${ui.secondaryButton} ${ui.dialogButton}`}
            onClick={onCancel}
          >
            取消
          </button>
          <button
            type="button"
            className={`${ui.primaryButton} ${ui.dialogButton}`}
            onClick={handleSave}
            disabled={!!nameError}
          >
            确认保存
          </button>
        </div>
      </div>
    </div>
  )
}
