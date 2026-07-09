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

const COVER_IMAGE_TYPE = 'cover-image' as const

export type CoverImageProps = {
  w: number
  h: number
  src: string
  alt: string
  fit: 'cover' | 'contain'
  shape: 'rect' | 'circle'
  opacity: number
  fallbackText: string
}

declare module 'tldraw' {
  export interface TLGlobalShapePropsMap {
    [COVER_IMAGE_TYPE]: CoverImageProps
  }
}

export type CoverImageShape = TLShape<typeof COVER_IMAGE_TYPE>

// ── ShapeUtil ──────────────────────────────────────────────────────────────

export class CoverImageShapeUtil extends ShapeUtil<CoverImageShape> {
  static override type = COVER_IMAGE_TYPE

  static override props: RecordProps<CoverImageShape> = {
    w: T.number,
    h: T.number,
    src: T.string,
    alt: T.string,
    fit: T.literalEnum('cover', 'contain'),
    shape: T.literalEnum('rect', 'circle'),
    opacity: T.number,
    fallbackText: T.string,
  }

  getDefaultProps(): CoverImageShape['props'] {
    return {
      w: 230,
      h: 230,
      src: '',
      alt: '图片',
      fit: 'contain',
      shape: 'rect',
      opacity: 1,
      fallbackText: '图',
    }
  }

  getGeometry(shape: CoverImageShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  component(shape: CoverImageShape) {
    const { w, h, src, alt, fit, shape: imgShape, opacity, fallbackText } = shape.props

    const preserveAspectRatio = fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet'
    const cx = w / 2
    const cy = h / 2
    const r = Math.min(w, h) / 2
    const clipId = `cover-image-clip-${shape.id.replace(/[^a-zA-Z0-9-]/g, '')}`

    // Fallback: circle placeholder with initials (matches svg-serializer)
    if (!src) {
      return (
        <HTMLContainer style={{ width: w, height: h, opacity }}>
          <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
            <circle cx={cx} cy={cy} r={r} fill="#edf3ff" stroke="#ffffff" strokeWidth={5} />
            <circle cx={cx} cy={cy} r={r - 7} fill="#87a9ff" opacity={0.36} />
            <text
              x={cx}
              y={cy + r * 0.22}
              textAnchor="middle"
              fill="#163690"
              fontFamily="PingFang SC, Microsoft YaHei, Arial, sans-serif"
              fontSize={r * 0.72}
              fontWeight={900}
            >
              {fallbackText || '图'}
            </text>
          </svg>
        </HTMLContainer>
      )
    }

    // Circle image: <image> with clipPath + border circle
    if (imgShape === 'circle') {
      return (
        <HTMLContainer style={{ width: w, height: h, opacity }}>
          <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
            <defs>
              <clipPath id={clipId}>
                <circle cx={cx} cy={cy} r={r} />
              </clipPath>
            </defs>
            <image
              href={src}
              x={0}
              y={0}
              width={w}
              height={h}
              preserveAspectRatio={preserveAspectRatio}
              clipPath={`url(#${clipId})`}
            />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ffffff" strokeWidth={5} />
          </svg>
        </HTMLContainer>
      )
    }

    // Rect image: plain <image>
    return (
      <HTMLContainer style={{ width: w, height: h, opacity }}>
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
          <image
            href={src}
            x={0}
            y={0}
            width={w}
            height={h}
            preserveAspectRatio={preserveAspectRatio}
          />
          {/* Accessibility — hidden in visual but available to screen readers */}
          <title>{alt}</title>
        </svg>
      </HTMLContainer>
    )
  }

  getIndicatorPath(shape: CoverImageShape) {
    const path = new Path2D()
    path.rect(0, 0, shape.props.w, shape.props.h)
    return path
  }

  override onResize(shape: CoverImageShape, info: TLResizeInfo<CoverImageShape>) {
    return {
      props: {
        ...shape.props,
        w: Math.max(1, shape.props.w * info.scaleX),
        h: Math.max(1, shape.props.h * info.scaleY),
      },
    }
  }
}
