'use client'

import { useEffect, useRef } from 'react'
import { Button, Input } from '@/shared/components/ui'
import { Dialog } from '@/shared/components/overlay'

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

  const handleSave = () => {
    if (nameError) {
      return
    }
    onSave()
  }

  return (
    <Dialog open={show} onClose={onCancel}>
      <h3 className="text-[18px] font-black text-[var(--foreground)]">{title}</h3>
      <label className={`field${nameError ? ' field-error' : ''}`}>
        <span>模板名称</span>
        <Input
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
        {nameError ? <span className="field-error-message">{nameError}</span> : null}
      </label>
      <div className="flex items-center justify-end gap-[10px]">
        <Button variant="secondary" onClick={onCancel}>
          取消
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={!!nameError}>
          确认保存
        </Button>
      </div>
    </Dialog>
  )
}
