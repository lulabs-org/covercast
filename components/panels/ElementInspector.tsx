'use client'

import { useState, type ChangeEvent } from 'react'
import {
  isImageElement,
  isShapeElement,
  isTextElement,
  type ImageElement,
  type GradientDirection,
  type SceneElement,
  type ShapeElement,
  type ShapeFillMode,
  type TextAlign,
  type TextElement,
} from '@/lib/scene'
import { FontFamilyField } from '../FontFamilyField'
import type { useLocalFonts } from '@/hooks/useLocalFonts'

type LocalFontManager = ReturnType<typeof useLocalFonts>

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value)
}

function minimumWidth(element: SceneElement) {
  if (isTextElement(element)) {
    return 40
  }

  if (element.type === 'ellipse') {
    return 14
  }

  return 28
}

function minimumHeight(element: SceneElement) {
  if (isTextElement(element)) {
    return Math.max(24, element.fontSize)
  }

  if (element.type === 'ellipse') {
    return 14
  }

  return 28
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
}) {
  return (
    <label className={`field${error ? ' field-error' : ''}`}>
      <span>{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
      {error ? <span className="field-error-message">{error}</span> : null}
    </label>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea value={value} rows={5} onChange={(event) => onChange(event.currentTarget.value)} />
    </label>
  )
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  precision = 0,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  precision?: number
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value.toFixed(precision) : '0'}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          const nextValue = Number(event.currentTarget.value)
          if (Number.isFinite(nextValue)) {
            onChange(nextValue)
          }
        }}
      />
    </label>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const colorValue = isHexColor(value) ? value : '#ffffff'

  return (
    <label className="field color-field">
      <span>{label}</span>
      <div>
        <input
          type="color"
          value={colorValue}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          placeholder="#ffffff"
        />
      </div>
    </label>
  )
}

function defaultShapeGradient(element: ShapeElement) {
  return {
    startColor: isHexColor(element.fill) ? element.fill : '#ffffff',
    endColor: '#99f19c',
    direction: 'horizontal' as GradientDirection,
  }
}

function TextInspector({
  element,
  onPatch,
  localFontManager,
}: {
  element: TextElement
  onPatch: (patch: Partial<SceneElement>) => void
  localFontManager: LocalFontManager
}) {
  return (
    <>
      <TextAreaField
        label="文字内容"
        value={element.text}
        onChange={(value) => onPatch({ text: value } as Partial<TextElement>)}
      />
      <ColorField
        label="文字颜色"
        value={element.fill}
        onChange={(value) => onPatch({ fill: value } as Partial<TextElement>)}
      />
      <FontFamilyField
        key={element.id}
        value={element.fontFamily}
        onChange={(value) => onPatch({ fontFamily: value } as Partial<TextElement>)}
        localFontManager={localFontManager}
      />
      <div className="field-grid">
        <NumberField
          label="字号"
          value={element.fontSize}
          min={8}
          onChange={(value) => onPatch({ fontSize: value } as Partial<TextElement>)}
        />
        <NumberField
          label="字重"
          value={element.fontWeight}
          min={100}
          max={1000}
          step={100}
          onChange={(value) => onPatch({ fontWeight: value } as Partial<TextElement>)}
        />
        <NumberField
          label="行高"
          value={element.lineHeight}
          min={0.8}
          max={3}
          step={0.05}
          precision={2}
          onChange={(value) => onPatch({ lineHeight: value } as Partial<TextElement>)}
        />
        <label className="field">
          <span>对齐</span>
          <select
            value={element.align}
            onChange={(event) =>
              onPatch({ align: event.currentTarget.value as TextAlign } as Partial<TextElement>)
            }
          >
            <option value="left">左对齐</option>
            <option value="center">居中</option>
            <option value="right">右对齐</option>
          </select>
        </label>
      </div>
    </>
  )
}

function ShapeInspector({
  element,
  onPatch,
}: {
  element: ShapeElement
  onPatch: (patch: Partial<SceneElement>) => void
}) {
  const fillMode = element.fillMode ?? 'solid'
  const gradient = element.gradient ?? defaultShapeGradient(element)

  return (
    <>
      <label className="field checkbox-field">
        <span>背景穿透</span>
        <input
          type="checkbox"
          checked={element.backgroundCutout === true}
          onChange={(event) =>
            onPatch({
              backgroundCutout: event.currentTarget.checked,
            } as Partial<ShapeElement>)
          }
        />
      </label>
      <label className="field">
        <span>填充类型</span>
        <select
          disabled={element.backgroundCutout === true}
          value={fillMode}
          onChange={(event) => {
            const nextMode = event.currentTarget.value as ShapeFillMode
            onPatch({
              fillMode: nextMode,
              gradient: nextMode === 'gradient' ? gradient : element.gradient,
            } as Partial<ShapeElement>)
          }}
        >
          <option value="solid">纯色</option>
          <option value="gradient">渐变</option>
        </select>
      </label>

      {element.backgroundCutout === true ? (
        <p className="field-help">已挖空封面背景，OBS 中可透出后方画面；可继续保留描边。</p>
      ) : fillMode === 'gradient' ? (
        <>
          <ColorField
            label="渐变起点"
            value={gradient.startColor}
            onChange={(value) =>
              onPatch({
                fill: value,
                fillMode: 'gradient',
                gradient: { ...gradient, startColor: value },
              } as Partial<ShapeElement>)
            }
          />
          <ColorField
            label="渐变终点"
            value={gradient.endColor}
            onChange={(value) =>
              onPatch({
                fillMode: 'gradient',
                gradient: { ...gradient, endColor: value },
              } as Partial<ShapeElement>)
            }
          />
          <label className="field">
            <span>渐变方向</span>
            <select
              value={gradient.direction}
              onChange={(event) =>
                onPatch({
                  fillMode: 'gradient',
                  gradient: {
                    ...gradient,
                    direction: event.currentTarget.value as GradientDirection,
                  },
                } as Partial<ShapeElement>)
              }
            >
              <option value="horizontal">水平</option>
              <option value="vertical">垂直</option>
              <option value="diagonal-down">左上到右下</option>
              <option value="diagonal-up">左下到右上</option>
            </select>
          </label>
        </>
      ) : (
        <ColorField
          label="填充"
          value={element.fill}
          onChange={(value) => onPatch({ fill: value, fillMode: 'solid' } as Partial<ShapeElement>)}
        />
      )}
      <ColorField
        label="描边"
        value={element.stroke ?? '#ffffff'}
        onChange={(value) => onPatch({ stroke: value } as Partial<ShapeElement>)}
      />
      <div className="field-grid">
        <NumberField
          label="描边宽"
          value={element.strokeWidth ?? 0}
          min={0}
          onChange={(value) => onPatch({ strokeWidth: value } as Partial<ShapeElement>)}
        />
        {element.type === 'rect' ? (
          <NumberField
            label="圆角"
            value={element.radius ?? 0}
            min={0}
            onChange={(value) => onPatch({ radius: value } as Partial<ShapeElement>)}
          />
        ) : null}
      </div>
    </>
  )
}

function ImageInspector({
  element,
  onPatch,
  onReplaceImage,
}: {
  element: ImageElement
  onPatch: (patch: Partial<SceneElement>) => void
  onReplaceImage: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <>
      <label className="field">
        <span>素材替换</span>
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onReplaceImage} />
      </label>
      <label className="field">
        <span>显示方式</span>
        <select
          value={element.fit}
          onChange={(event) =>
            onPatch({
              fit: event.currentTarget.value as ImageElement['fit'],
            } as Partial<ImageElement>)
          }
        >
          <option value="cover">裁切填充</option>
          <option value="contain">完整显示</option>
        </select>
      </label>
      <label className="field">
        <span>形状</span>
        <select
          value={element.shape}
          onChange={(event) =>
            onPatch({
              shape: event.currentTarget.value as ImageElement['shape'],
            } as Partial<ImageElement>)
          }
        >
          <option value="rect">矩形</option>
          <option value="circle">圆形</option>
        </select>
      </label>
      {!element.src ? (
        <TextField
          label="占位字"
          value={element.fallbackText ?? ''}
          onChange={(value) => onPatch({ fallbackText: value } as Partial<ImageElement>)}
        />
      ) : null}
    </>
  )
}

export function ElementInspector({
  element,
  allElements,
  onPatch,
  onCopy,
  onPaste,
  canPaste,
  onDelete,
  onReplaceImage,
  localFontManager,
}: {
  element: SceneElement
  allElements: SceneElement[]
  onPatch: (patch: Partial<SceneElement>) => void
  onCopy: () => void
  onPaste: () => void
  canPaste: boolean
  onDelete: () => void
  onReplaceImage: (event: ChangeEvent<HTMLInputElement>) => void
  localFontManager: LocalFontManager
}) {
  const [pendingName, setPendingName] = useState<string>(element.name)

  const nameError = allElements.some((el) => el.id !== element.id && el.name === pendingName)
    ? '图层名称已存在，请使用其他名称'
    : undefined

  const handleNameChange = (value: string) => {
    setPendingName(value)
    // 只有当名称不重复时才更新元素
    const isDuplicate = allElements.some((el) => el.id !== element.id && el.name === value)
    if (!isDuplicate) {
      onPatch({ name: value } as Partial<SceneElement>)
    }
  }

  return (
    <div className="inspector">
      <TextField
        label="图层名称"
        value={pendingName}
        onChange={handleNameChange}
        error={nameError}
      />
      <div className="field-grid">
        <NumberField label="X" value={element.x} onChange={(value) => onPatch({ x: value })} />
        <NumberField label="Y" value={element.y} onChange={(value) => onPatch({ y: value })} />
        <NumberField
          label="宽"
          value={element.width}
          min={minimumWidth(element)}
          onChange={(value) => onPatch({ width: value })}
        />
        <NumberField
          label="高"
          value={element.height}
          min={minimumHeight(element)}
          onChange={(value) => onPatch({ height: value })}
        />
      </div>
      <NumberField
        label="透明度"
        value={element.opacity ?? 1}
        min={0}
        max={1}
        step={0.05}
        precision={2}
        onChange={(value) => onPatch({ opacity: value })}
      />

      {isTextElement(element) ? (
        <TextInspector element={element} onPatch={onPatch} localFontManager={localFontManager} />
      ) : null}

      {isShapeElement(element) ? <ShapeInspector element={element} onPatch={onPatch} /> : null}

      {isImageElement(element) ? (
        <ImageInspector element={element} onPatch={onPatch} onReplaceImage={onReplaceImage} />
      ) : null}

      <div className="inspector-action-row">
        <button type="button" className="secondary-button" onClick={onCopy}>
          复制元素
        </button>
        <button type="button" className="secondary-button" onClick={onPaste} disabled={!canPaste}>
          粘贴副本
        </button>
      </div>

      <button type="button" className="danger-button" onClick={onDelete}>
        删除当前元素
      </button>
    </div>
  )
}
