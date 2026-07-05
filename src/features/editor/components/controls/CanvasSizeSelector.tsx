import { useState, useCallback, type ChangeEvent } from 'react'
import type { CanvasSize, CanvasSizePreset } from '../../hooks/useCanvasSize'
import styles from './CanvasSizeSelector.module.css'
import formStyles from '../forms.module.css'

type CanvasSizeSelectorProps = {
  canvasSize: CanvasSize
  presets: CanvasSizePreset[]
  currentPreset?: CanvasSizePreset
  isCustomSize: boolean
  onPresetChange: (preset: CanvasSizePreset) => void
  onCustomSizeChange: (width: number, height: number) => void
}

export function CanvasSizeSelector({
  canvasSize,
  presets,
  currentPreset,
  isCustomSize,
  onPresetChange,
  onCustomSizeChange,
}: CanvasSizeSelectorProps) {
  const [customWidth, setCustomWidth] = useState(isCustomSize ? canvasSize.width.toString() : '')
  const [customHeight, setCustomHeight] = useState(isCustomSize ? canvasSize.height.toString() : '')

  const handleSelectChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value

      if (value === 'custom') {
        // 切换到自定义尺寸模式，使用当前画布尺寸作为初始值
        setCustomWidth(canvasSize.width.toString())
        setCustomHeight(canvasSize.height.toString())
        onCustomSizeChange(canvasSize.width, canvasSize.height)
      } else {
        const preset = presets.find((p) => p.id === value)
        if (preset) {
          onPresetChange(preset)
        }
      }
    },
    [presets, canvasSize, onPresetChange, onCustomSizeChange],
  )

  const handleCustomWidthChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setCustomWidth(event.target.value)
  }, [])

  const handleCustomHeightChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setCustomHeight(event.target.value)
  }, [])

  const handleApplyCustomSize = useCallback(() => {
    const width = parseInt(customWidth, 10)
    const height = parseInt(customHeight, 10)

    if (width > 0 && height > 0) {
      onCustomSizeChange(width, height)
    }
  }, [customWidth, customHeight, onCustomSizeChange])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        handleApplyCustomSize()
      }
    },
    [handleApplyCustomSize],
  )

  const selectedValue = isCustomSize ? 'custom' : currentPreset?.id || ''

  return (
    <>
      <label className={formStyles.field}>
        <span>画布尺寸</span>
        <select value={selectedValue} onChange={handleSelectChange}>
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label} ({preset.ratio})
            </option>
          ))}
          <option value="custom">自定义尺寸</option>
        </select>
      </label>

      {isCustomSize && (
        <div className={styles.customInputRow}>
          <input
            type="number"
            className={styles.sizeInput}
            value={customWidth}
            onChange={handleCustomWidthChange}
            onKeyDown={handleKeyDown}
            placeholder="宽度"
            min={100}
            max={4096}
          />
          <span className={styles.sizeSeparator}>×</span>
          <input
            type="number"
            className={styles.sizeInput}
            value={customHeight}
            onChange={handleCustomHeightChange}
            onKeyDown={handleKeyDown}
            placeholder="高度"
            min={100}
            max={4096}
          />
          <button type="button" className={styles.applyButton} onClick={handleApplyCustomSize}>
            应用
          </button>
        </div>
      )}
    </>
  )
}
