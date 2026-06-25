import { useState, useMemo } from 'react'
import type { CustomSceneTemplate } from '@/domain'

type UseSaveTemplateDialogOptions = {
  customTemplates: CustomSceneTemplate[]
  onSave: (name: string) => void
}

export function useSaveTemplateDialog(options: UseSaveTemplateDialogOptions) {
  const { customTemplates, onSave } = options

  const [showDialog, setShowDialog] = useState(false)
  const [templateName, setTemplateName] = useState('')

  const trimmedName = templateName.trim()
  const nameError = useMemo(() => {
    if (!trimmedName) {
      return undefined
    }
    const isDuplicate = customTemplates.some((template) => template.name === trimmedName)
    return isDuplicate ? '模板名称已存在，请使用其他名称' : undefined
  }, [trimmedName, customTemplates])

  function openDialog(defaultName?: string) {
    setTemplateName(defaultName ?? '')
    setShowDialog(true)
  }

  function closeDialog() {
    setShowDialog(false)
    setTemplateName('')
  }

  function handleSave() {
    if (nameError) {
      return
    }
    const finalName = trimmedName || `自定义模板 ${customTemplates.length + 1}`
    onSave(finalName)
    closeDialog()
  }

  return {
    showDialog,
    templateName,
    nameError,
    setTemplateName,
    openDialog,
    closeDialog,
    handleSave,
  }
}
