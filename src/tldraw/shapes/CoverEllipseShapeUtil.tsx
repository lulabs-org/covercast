'use client'

import {
  HTMLContainer,
  Ellipse2d,
  type RecordProps,
  ShapeUtil,
  T,
  type TLShape,
  type TLResizeInfo,
} from 'tldraw'
import { resolveShapeFillInfo } from './shared/resolveFill'

// ── Shape type registration ─────────────────────────────────────────────────

const COVER_ELLIPSE_TYPE = 'cover-ellipse' as const

export type CoverEllipseProps = {
  w: number
  h: number
  fill: string
  fillMode: 'solid' | 'gradient'
  gradientStartColor: string
  gradientEndColor: string
  gradientDirection: 'horizontal' | 'vertical' | 'diagonal-down' | 'diagonal-up'
  stroke: string
  strokeWidth: number
  opacity: number
  backgroundCutout: boolean
}

declare module 'tldraw' {
  export interface TLGlobalShapePropsMap {
    [COVER_ELLIPSE_TYPE]: CoverEllipseProps
  }
}

export type CoverEllipseShape = TLShape<typeof COVER_ELLIPSE_TYPE>

// ── ShapeUtil ──────────────────────────────────────────────────────────────

export class CoverEllipseShapeUtil extends ShapeUtil<CoverEllipseShape> {
  static override type = COVER_ELLIPSE_TYPE

  static override props: RecordProps<CoverEllipseShape> = {
    w: T.number,
    h: T.number,
    fill: T.string,
    fillMode: T.literalEnum('solid', 'gradient'),
    gradientStartColor: T.string,
    gradientEndColor: T.string,
    gradientDirection: T.literalEnum('horizontal', 'vertical', 'diagonal-down', 'diagonal-up'),
    stroke: T.string,
    strokeWidth: T.number,
    opacity: T.number,
    backgroundCutout: T.boolean,
  }

  getDefaultProps(): CoverEllipseShape['props'] {
    return {
      w: 260,
      h: 160,
      fill: '#ffffff',
      fillMode: 'gradient',
      gradientStartColor: '#ffffff',
      gradientEndColor: '#99f19c',
      gradientDirection: 'horizontal',
      stroke: '',
      strokeWidth: 0,
      opacity: 1,
      backgroundCutout: false,
    }
  }

  getGeometry(shape: CoverEllipseShape) {
    return new Ellipse2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  component(shape: CoverEllipseShape) {
    const { w, h, stroke, strokeWidth } = shape.props

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

    const cx = w / 2
    const cy = h / 2
    const rx = w / 2
    const ry = h / 2
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
          <ellipse
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
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

  getIndicatorPath(shape: CoverEllipseShape) {
    const path = new Path2D()
    path.ellipse(
      shape.props.w / 2,
      shape.props.h / 2,
      shape.props.w / 2,
      shape.props.h / 2,
      0,
      0,
      Math.PI * 2,
    )
    return path
  }

  override onResize(shape: CoverEllipseShape, info: TLResizeInfo<CoverEllipseShape>) {
    return {
      props: {
        ...shape.props,
        w: Math.max(1, shape.props.w * info.scaleX),
        h: Math.max(1, shape.props.h * info.scaleY),
      },
    }
  }
}
