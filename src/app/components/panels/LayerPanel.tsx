'use client'

import { type SceneElement, isSelected, selectSingle, type SelectionState } from '@/domain'
import { cn } from '@/shared/lib'
import { SidebarSection } from '../editor/sidebar/SidebarSection'
import styles from './LayerPanel.module.css'

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
      <div className={styles.layerList}>
        {visualLayers.map(({ element, index }) => {
          const isActive = isSelected(selection, element.id)
          const isTop = index === elements.length - 1
          const isBottom = index === 0

          return (
            <div
              key={element.id}
              className={cn(
                styles.layerRow,
                isActive && styles.layerRowActive,
                element.hidden && styles.muted,
                element.locked && styles.locked,
              )}
            >
              <button
                type="button"
                className={styles.layerMain}
                onClick={() => onSelect(selectSingle(selection, element.id))}
              >
                <span className={styles.layerType}>{elementTypeGlyph(element)}</span>
                <span className={styles.layerName}>{element.name}</span>
                <small>{elementTypeLabel(element)}</small>
              </button>
              <div className={styles.layerActions}>
                <button
                  type="button"
                  className={cn(styles.layerAction, element.hidden && styles.layerActionActive)}
                  onClick={() => onToggleHidden(element.id)}
                  title={element.hidden ? '显示图层' : '隐藏图层'}
                >
                  {element.hidden ? '隐' : '显'}
                </button>
                <button
                  type="button"
                  className={cn(styles.layerAction, element.locked && styles.layerActionActive)}
                  onClick={() => onToggleLocked(element.id)}
                  title={element.locked ? '解锁图层' : '锁定图层'}
                >
                  {element.locked ? '锁' : '解'}
                </button>
                <button
                  type="button"
                  className={styles.layerAction}
                  disabled={isTop}
                  onClick={() => onMoveLayer(element.id, 'forward')}
                  title="上移一层"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={styles.layerAction}
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
