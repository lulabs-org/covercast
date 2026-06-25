import { cn } from '@/shared/lib'
import { useState } from 'react'
import { Input } from './Input'

function isHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value)
}

export interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  className?: string
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  // 内部维护 draft textValue，用于用户输入非法值时的临时显示
  const [draftValue, setDraftValue] = useState<string | null>(null)

  // 渲染时计算显示值：用户正在编辑时用 draft，否则用外部 value
  const displayValue = draftValue ?? value

  // color input 改变 → 立即 onChange，清除 draft
  const handleColorChange = (color: string) => {
    setDraftValue(null)
    onChange(color)
  }

  // text input 改变 → 合法 HEX 时 onChange 并清除 draft，非法时仅更新 draft
  const handleTextChange = (text: string) => {
    if (isHexColor(text)) {
      setDraftValue(null)
      onChange(text)
    } else {
      setDraftValue(text)
    }
  }

  return (
    <div className={cn('grid grid-cols-[44px_1fr] gap-2 items-center', className)}>
      {/* color input 始终绑定受控 value */}
      <input
        type="color"
        value={value}
        onChange={(e) => handleColorChange(e.currentTarget.value)}
        className="p-[3px] border border-[#cfd8e8] rounded-[6px] bg-white cursor-pointer"
      />
      {/* text input 绑定 displayValue */}
      <Input
        type="text"
        value={displayValue}
        onChange={(e) => handleTextChange(e.currentTarget.value)}
        placeholder="#ffffff"
        className="font-mono"
      />
    </div>
  )
}
