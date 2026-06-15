import { type PointerEvent } from 'react'
import { type SceneElement } from '@/lib/domain/scene'
import { ShapeElementView } from './ShapeElementView'
import { TextElementView } from './TextElementView'
import { ImageElementView } from './ImageElementView'
import styles from '../canvas.module.css'

export function ElementView({
  element,
  idPrefix,
  interactive,
  editingTextId,
  onPointerDown,
  onDoubleClick,
  resolveSrc,
}: {
  element: SceneElement
  idPrefix: string
  interactive: boolean
  editingTextId?: string | null
  onPointerDown?: (elementId: string, event: PointerEvent<SVGGElement>) => void
  onDoubleClick?: (elementId: string) => void
  resolveSrc?: (src: string) => string
}) {
  return (
    <g
      className={
        interactive
          ? `${styles.sceneElement}${element.locked ? ` ${styles.locked}` : ''}`
          : undefined
      }
      data-element-id={element.id}
      onPointerDown={(event) => {
        if (!interactive) {
          return
        }

        event.stopPropagation()
        onPointerDown?.(element.id, event)
      }}
      onDoubleClick={() => {
        if (!interactive || element.type !== 'text') {
          return
        }

        onDoubleClick?.(element.id)
      }}
    >
      {renderElement(element, idPrefix, interactive, editingTextId, resolveSrc)}
    </g>
  )
}

function renderElement(
  element: SceneElement,
  idPrefix: string,
  interactive: boolean,
  editingTextId?: string | null,
  resolveSrc?: (src: string) => string,
) {
  if (element.type === 'text') {
    return (
      <TextElementView
        element={element}
        interactive={interactive}
        editing={editingTextId === element.id}
      />
    )
  }

  if (element.type === 'image') {
    return (
      <ImageElementView
        element={element}
        idPrefix={idPrefix}
        interactive={interactive}
        resolveSrc={resolveSrc}
      />
    )
  }

  return <ShapeElementView element={element} idPrefix={idPrefix} />
}
