'use client'

import {
  HTMLContainer,
  Rectangle2d,
  type RecordProps,
  ShapeUtil,
  T,
  type TLShape,
  type TLResizeInfo,
} from 'tldraw'

// ── Shape type registration ─────────────────────────────────────────────────

const COVER_TEXT_TYPE = 'cover-text' as const

export type CoverTextProps = {
  w: number
  h: number
  text: string
  fill: string
  fontSize: number
  fontFamily: string
  fontWeight: number
  align: 'left' | 'center' | 'right'
  lineHeight: number
  opacity: number
}

declare module 'tldraw' {
  export interface TLGlobalShapePropsMap {
    [COVER_TEXT_TYPE]: CoverTextProps
  }
}

export type CoverTextShape = TLShape<typeof COVER_TEXT_TYPE>

// ── ShapeUtil ──────────────────────────────────────────────────────────────

// Maps TextElement.align to SVG text-anchor — mirrors svg-serializer.textAnchorForAlign
function textAnchor(align: CoverTextProps['align']): 'start' | 'middle' | 'end' {
  if (align === 'center') return 'middle'
  if (align === 'right') return 'end'
  return 'start'
}

// Computes the local x position for text based on alignment — mirrors svg-serializer.textX
function localTextX(align: CoverTextProps['align'], w: number): number {
  if (align === 'center') return w / 2
  if (align === 'right') return w
  return 0
}

export class CoverTextShapeUtil extends ShapeUtil<CoverTextShape> {
  static override type = COVER_TEXT_TYPE

  static override props: RecordProps<CoverTextShape> = {
    w: T.number,
    h: T.number,
    text: T.string,
    fill: T.string,
    fontSize: T.number,
    fontFamily: T.string,
    fontWeight: T.number,
    align: T.literalEnum('left', 'center', 'right'),
    lineHeight: T.number,
    opacity: T.number,
  }

  getDefaultProps(): CoverTextShape['props'] {
    return {
      w: 280,
      h: 56,
      text: '新的文字',
      fill: '#ffffff',
      fontSize: 42,
      fontFamily: 'PingFang SC, Microsoft YaHei, Arial, sans-serif',
      fontWeight: 800,
      align: 'center',
      lineHeight: 1.18,
      opacity: 1,
    }
  }

  getGeometry(shape: CoverTextShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  // Render SVG <text> with <tspan> per line — matches svg-serializer.renderTextElement
  // tldraw positions the shape at (shape.x, shape.y), component renders in local coords (0,0).
  component(shape: CoverTextShape) {
    const { w, h, text, fill, fontSize, fontFamily, fontWeight, align, lineHeight, opacity } =
      shape.props

    const lines = text.split('\n')
    const x = localTextX(align, w)
    const anchor = textAnchor(align)
    const lineSpacing = fontSize * lineHeight

    return (
      <HTMLContainer style={{ width: w, height: h, opacity }}>
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
          <text
            x={x}
            y={fontSize}
            fill={fill}
            fontFamily={fontFamily}
            fontSize={fontSize}
            fontWeight={fontWeight}
            textAnchor={anchor}
          >
            {lines.map((line, i) => (
              <tspan key={i} x={x} dy={i === 0 ? 0 : lineSpacing}>
                {line || ' '}
              </tspan>
            ))}
          </text>
        </svg>
      </HTMLContainer>
    )
  }

  getIndicatorPath(shape: CoverTextShape) {
    const path = new Path2D()
    path.rect(0, 0, shape.props.w, shape.props.h)
    return path
  }

  override onResize(shape: CoverTextShape, info: TLResizeInfo<CoverTextShape>) {
    return {
      props: {
        ...shape.props,
        w: Math.max(1, shape.props.w * info.scaleX),
        h: Math.max(1, shape.props.h * info.scaleY),
      },
    }
  }
}
