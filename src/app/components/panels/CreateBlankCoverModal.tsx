'use client'

import { useState, useCallback, type ChangeEvent } from 'react'
import type { BlankCoverConfig } from '../../hooks/useCreateBlankCover'
import {
  ColorPicker,
  Slider,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/shared/components'
import { clamp } from '@/shared/lib'
import formStyles from '../forms.module.css'

type TemplateOption = {
  id: string
  name: string
  description: string
}

type PresetOption = {
  id: string
  label: string
  width: number
  height: number
  ratio: string
}

type CreateBlankCoverModalProps = {
  isOpen: boolean
  config: BlankCoverConfig
  presetOptions: PresetOption[]
  templateOptions: TemplateOption[]
  onCancel: () => void
  onConfirm: () => void
  onUpdateConfig: (updates: Partial<BlankCoverConfig>) => void
}

export function CreateBlankCoverModal({
  isOpen,
  config,
  presetOptions,
  templateOptions,
  onCancel,
  onConfirm,
  onUpdateConfig,
}: CreateBlankCoverModalProps) {
  const [isCustomSize, setIsCustomSize] = useState(false)
  const [currentPresetId, setCurrentPresetId] = useState('vertical_16_9')

  const handleTemplateChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      onUpdateConfig({ templateId: e.target.value })
    },
    [onUpdateConfig],
  )

  const handlePresetChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value
      if (value === 'custom') {
        setIsCustomSize(true)
      } else {
        setIsCustomSize(false)
        setCurrentPresetId(value)
        const preset = presetOptions.find((p) => p.id === value)
        if (preset) {
          onUpdateConfig({
            canvasSize: { width: preset.width, height: preset.height },
          })
        }
      }
    },
    [presetOptions, onUpdateConfig],
  )

  const handleWidthChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const width = parseInt(e.target.value, 10)
      if (!isNaN(width) && width > 0) {
        onUpdateConfig({
          canvasSize: { ...config.canvasSize, width },
        })
      }
    },
    [config.canvasSize, onUpdateConfig],
  )

  const handleHeightChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const height = parseInt(e.target.value, 10)
      if (!isNaN(height) && height > 0) {
        onUpdateConfig({
          canvasSize: { ...config.canvasSize, height },
        })
      }
    },
    [config.canvasSize, onUpdateConfig],
  )

  const handleColorChange = useCallback(
    (color: string) => {
      onUpdateConfig({ backgroundColor: color })
    },
    [onUpdateConfig],
  )

  const handleOpacityChange = useCallback(
    (opacity: number) => {
      onUpdateConfig({ backgroundOpacity: clamp(opacity, 0, 1) })
    },
    [onUpdateConfig],
  )

  const handleCoverNameChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onUpdateConfig({ coverName: e.target.value })
    },
    [onUpdateConfig],
  )

  const selectedSizeValue = isCustomSize ? 'custom' : currentPresetId
  const opacity = clamp(config.backgroundOpacity, 0, 1)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>新建封面</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <div className="mb-5 last:mb-0">
            <h3 className="mb-3 text-sm font-bold text-[var(--muted)]">基本信息</h3>
            <label className={formStyles.field}>
              <span>封面名称</span>
              <input
                type="text"
                value={config.coverName}
                onChange={handleCoverNameChange}
                placeholder="输入封面名称"
              />
            </label>
          </div>

          <div className="mb-5 last:mb-0">
            <h3 className="mb-3 text-sm font-bold text-[var(--muted)]">引用模板</h3>
            <label className={formStyles.field}>
              <span>选择模板</span>
              <select value={config.templateId} onChange={handleTemplateChange}>
                {templateOptions.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.description}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mb-5 last:mb-0">
            <h3 className="mb-3 text-sm font-bold text-[var(--muted)]">封面尺寸</h3>
            <label className={formStyles.field}>
              <span>预设尺寸</span>
              <select value={selectedSizeValue} onChange={handlePresetChange}>
                {presetOptions.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label} ({preset.width}×{preset.height})
                  </option>
                ))}
                <option value="custom">自定义尺寸</option>
              </select>
            </label>

            {isCustomSize && (
              <div className="grid grid-cols-2 gap-2.5 mt-2.5">
                <label className={formStyles.field}>
                  <span>宽度</span>
                  <input
                    type="number"
                    value={config.canvasSize.width}
                    onChange={handleWidthChange}
                    min={1}
                  />
                </label>
                <label className={formStyles.field}>
                  <span>高度</span>
                  <input
                    type="number"
                    value={config.canvasSize.height}
                    onChange={handleHeightChange}
                    min={1}
                  />
                </label>
              </div>
            )}
          </div>

          <div className="mb-5 last:mb-0">
            <h3 className="mb-3 text-sm font-bold text-[var(--muted)]">背景设置</h3>
            <label className={formStyles.field}>
              <span>背景颜色</span>
              <ColorPicker value={config.backgroundColor} onChange={handleColorChange} />
            </label>
            <label className={formStyles.field}>
              <span>不透明度</span>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={opacity}
                onValueChange={handleOpacityChange}
              />
              <span className={formStyles.opacityValue}>{Math.round(opacity * 100)}%</span>
            </label>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={onCancel}>
            取消
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
