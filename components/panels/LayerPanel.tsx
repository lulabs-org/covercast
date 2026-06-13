'use client'

import { type ReactNode } from 'react'
import { type SceneElement } from '@/lib/domain/scene'
import { isSelected, selectSingle, type SelectionState } from '@/lib/domain/selection'

function elementTypeLabel(element: SceneElement) {
  if (element.type === 'text') {
    return '文字'
  }

  if (element.type === 'image') {
    return '图片'
  }

  if (element.type === 'ellipse') {
    return '椭圆'
  }

  return '矩形'
}

function elementTypeGlyph(element: SceneElement) {
  if (element.type === 'text') {
    return 'T'
  }

  if (element.type === 'image') {
    return 'I'
  }

  if (element.type === 'ellipse') {
    return 'O'
  }

  return 'R'
}

function SidebarSection({
  title,
  caption,
  collapsed,
  onToggle,
  children,
}: {
  title: string
  caption: string
  collapsed: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <section className="sidebar-section">
      <button
        type="button"
        className="sidebar-section-header"
        onClick={onToggle}
        aria-expanded={!collapsed}
      >
        <span>{title}</span>
        <small>{caption}</small>
        <b>{collapsed ? '＋' : '－'}</b>
      </button>
      {collapsed ? null : <div className="sidebar-section-body">{children}</div>}
    </section>
  )
}

export function LayerPanel({
  elements,
  selection,
  collapsed,
  onToggle,
  onSelect,
  onToggleHidden,
  onToggleLocked,
  onMoveLayer,
}: {
  elements: SceneElement[]
  selection: SelectionState
  collapsed: boolean
  onToggle: () => void
  onSelect: (selection: SelectionState) => void
  onToggleHidden: (elementId: string) => void
  onToggleLocked: (elementId: string) => void
  onMoveLayer: (elementId: string, direction: 'forward' | 'backward') => void
}) {
  const visualLayers = elements.map((element, index) => ({ element, index })).reverse()

  return (
    <SidebarSection
      title="图层"
      caption={`${elements.length} 个`}
      collapsed={collapsed}
      onToggle={onToggle}
    >
      <div className="layer-list">
        {visualLayers.map(({ element, index }) => {
          const isActive = isSelected(selection, element.id)
          const isTop = index === elements.length - 1
          const isBottom = index === 0

          return (
            <div
              key={element.id}
              className={[
                'layer-row',
                isActive ? 'active' : '',
                element.hidden ? 'muted' : '',
                element.locked ? 'locked' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <button
                type="button"
                className="layer-main"
                onClick={() => onSelect(selectSingle(selection, element.id))}
              >
                <span className="layer-type">{elementTypeGlyph(element)}</span>
                <span className="layer-name">{element.name}</span>
                <small>{elementTypeLabel(element)}</small>
              </button>
              <div className="layer-actions">
                <button
                  type="button"
                  className={element.hidden ? 'layer-action active' : 'layer-action'}
                  onClick={() => onToggleHidden(element.id)}
                  title={element.hidden ? '显示图层' : '隐藏图层'}
                >
                  {element.hidden ? '隐' : '显'}
                </button>
                <button
                  type="button"
                  className={element.locked ? 'layer-action active' : 'layer-action'}
                  onClick={() => onToggleLocked(element.id)}
                  title={element.locked ? '解锁图层' : '锁定图层'}
                >
                  {element.locked ? '锁' : '解'}
                </button>
                <button
                  type="button"
                  className="layer-action"
                  disabled={isTop}
                  onClick={() => onMoveLayer(element.id, 'forward')}
                  title="上移一层"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="layer-action"
                  disabled={isBottom}
                  onClick={() => onMoveLayer(element.id, 'backward')}
                  title="下移一层"
                >
                  ↓
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </SidebarSection>
  )
}
