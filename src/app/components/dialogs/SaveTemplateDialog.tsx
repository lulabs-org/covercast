'use client'

import { useEffect, useRef } from 'react'
import {
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/shared/components'
import formStyles from '../forms.module.css'

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
    <Dialog open={show} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <label className={`${formStyles.field}${nameError ? ` ${formStyles.fieldError}` : ''}`}>
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
            {nameError ? <span className={formStyles.fieldErrorMessage}>{nameError}</span> : null}
          </label>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel}>
            取消
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!!nameError}>
            确认保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
