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
import { resolveShapeFillInfo } from './shared/resolveFill'

// ── Shape type registration (tldraw v5 module augmentation) ────────────────

const COVER_RECT_TYPE = 'cover-rect' as const

export type CoverRectProps = {
  w: number
  h: number
  fill: string
  fillMode: 'solid' | 'gradient'
  gradientStartColor: string
  gradientEndColor: string
  gradientDirection: 'horizontal' | 'vertical' | 'diagonal-down' | 'diagonal-up'
  stroke: string
  strokeWidth: number
  radius: number
  opacity: number
  backgroundCutout: boolean
}

declare module 'tldraw' {
  export interface TLGlobalShapePropsMap {
    [COVER_RECT_TYPE]: CoverRectProps
  }
}

export type CoverRectShape = TLShape<typeof COVER_RECT_TYPE>

// ── ShapeUtil ──────────────────────────────────────────────────────────────

export class CoverRectShapeUtil extends ShapeUtil<CoverRectShape> {
  static override type = COVER_RECT_TYPE

  static override props: RecordProps<CoverRectShape> = {
    w: T.number,
    h: T.number,
    fill: T.string,
    fillMode: T.literalEnum('solid', 'gradient'),
    gradientStartColor: T.string,
    gradientEndColor: T.string,
    gradientDirection: T.literalEnum('horizontal', 'vertical', 'diagonal-down', 'diagonal-up'),
    stroke: T.string,
    strokeWidth: T.number,
    radius: T.number,
    opacity: T.number,
    backgroundCutout: T.boolean,
  }

  getDefaultProps(): CoverRectShape['props'] {
    return {
      w: 300,
      h: 180,
      fill: '#ffffff',
      fillMode: 'gradient',
      gradientStartColor: '#ffffff',
      gradientEndColor: '#99f19c',
      gradientDirection: 'horizontal',
      stroke: '',
      strokeWidth: 0,
      radius: 16,
      opacity: 1,
      backgroundCutout: false,
    }
  }

  getGeometry(shape: CoverRectShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  component(shape: CoverRectShape) {
    const { w, h, stroke, strokeWidth, radius } = shape.props

    const fillInfo = resolveShapeFillInfo({
      fill: shape.props.fill,
      fillMode: shape.props.fillMode,
      gradientStartColor: shape.props.gradientStartColor,
      gradientEndColor: shape.props.gradientEndColor,
      gradientDirection: shape.props.gradientDirection,
      backgroundCutout: shape.props.backgroundCutout,
      opacity: shape.props.opacity,
      shapeId: shape.id,
    })

    const hasStroke = stroke && strokeWidth > 0

    return (
      <HTMLContainer style={{ width: w, height: h, opacity: fillInfo.renderOpacity }}>
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
          {fillInfo.gradientId && fillInfo.gradientStops && fillInfo.gradientVector && (
            <defs>
              <linearGradient
                id={fillInfo.gradientId}
                x1={fillInfo.gradientVector.x1}
                y1={fillInfo.gradientVector.y1}
                x2={fillInfo.gradientVector.x2}
                y2={fillInfo.gradientVector.y2}
              >
                {fillInfo.gradientStops.map((stop, i) => (
                  <stop key={i} offset={stop.offset} stopColor={stop.color} />
                ))}
              </linearGradient>
            </defs>
          )}
          <rect
            x={0}
            y={0}
            width={w}
            height={h}
            rx={radius}
            fill={fillInfo.resolvedFill}
            stroke={hasStroke ? stroke : 'none'}
            strokeWidth={hasStroke ? strokeWidth : 0}
            strokeDasharray={fillInfo.isCutout ? '8 4' : undefined}
            strokeOpacity={fillInfo.isCutout ? 0.5 : 1}
          />
        </svg>
      </HTMLContainer>
    )
  }

  getIndicatorPath(shape: CoverRectShape) {
    const path = new Path2D()
    path.roundRect(0, 0, shape.props.w, shape.props.h, shape.props.radius)
    return path
  }

  override onResize(shape: CoverRectShape, info: TLResizeInfo<CoverRectShape>) {
    return {
      props: {
        ...shape.props,
        w: Math.max(1, shape.props.w * info.scaleX),
        h: Math.max(1, shape.props.h * info.scaleY),
      },
    }
  }
}
