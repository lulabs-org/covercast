import { cn } from '@/shared/lib'
import { useEffect, useState } from 'react'
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
  // 内部维护 draft textValue
  const [textValue, setTextValue] = useState(value)

  // value 变化时同步 textValue
  useEffect(() => {
    setTextValue(value)
  }, [value])

  // color input 改变 → 立即 onChange
  const handleColorChange = (color: string) => {
    setTextValue(color)
    onChange(color)
  }

  // text input 改变 → 合法 HEX 时 onChange，非法时仅更新本地显示
  const handleTextChange = (text: string) => {
    setTextValue(text)
    if (isHexColor(text)) {
      onChange(text)
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
      {/* text input 绑定 draft textValue */}
      <Input
        type="text"
        value={textValue}
        onChange={(e) => handleTextChange(e.currentTarget.value)}
        placeholder="#ffffff"
        className="font-mono"
      />
    </div>
  )
}
