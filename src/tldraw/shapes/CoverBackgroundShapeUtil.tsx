'use client'

import {
  HTMLContainer,
  Rectangle2d,
  type RecordProps,
  ShapeUtil,
  T,
  track,
  useEditor,
  type TLShape,
} from 'tldraw'

// ── Shape type registration ─────────────────────────────────────────────────

const COVER_BACKGROUND_TYPE = 'cover-background' as const

export type CoverBackgroundProps = {
  w: number
  h: number
  backgroundColor: string
  backgroundOpacity: number
}

declare module 'tldraw' {
  export interface TLGlobalShapePropsMap {
    [COVER_BACKGROUND_TYPE]: CoverBackgroundProps
  }
}

export type CoverBackgroundShape = TLShape<typeof COVER_BACKGROUND_TYPE>

// ── Tracked content component (reads live shape positions) ──────────────────

const CoverBackgroundContent = track(function CoverBackgroundContent({
  shape,
}: {
  shape: CoverBackgroundShape
}) {
  const editor = useEditor()
  const { w, h, backgroundColor, backgroundOpacity } = shape.props

  const shapes = editor?.getCurrentPageShapes() ?? []

  // Find cutout shapes — their positions determine the mask
  const cutoutShapes = shapes.filter((s) => {
    if (s.type !== 'cover-rect' && s.type !== 'cover-ellipse') return false
    if (s.id === shape.id) return false // exclude self
    const props = s.props as { backgroundCutout?: boolean }
    return props.backgroundCutout === true
  })

  const opacity = Number.isFinite(backgroundOpacity)
    ? Math.min(Math.max(backgroundOpacity, 0), 1)
    : 1
  const glowOpacity = Number((0.68 * opacity).toFixed(3))
  const hasMask = cutoutShapes.length > 0

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ overflow: 'visible', display: 'block' }}
    >
      <defs>
        <radialGradient id="cover-bg-glow" cx="48%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#4e72ff" stopOpacity="0.75" />
          <stop offset="64%" stopColor="#2949d7" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#162b94" stopOpacity="0.42" />
        </radialGradient>

        {hasMask && (
          <mask id="cover-bg-mask" maskUnits="userSpaceOnUse">
            <rect width={w} height={h} fill="#ffffff" />
            {cutoutShapes.map((s) => {
              const props = s.props as { w: number; h: number; radius?: number }
              if (s.type === 'cover-ellipse') {
                return (
                  <ellipse
                    key={s.id}
                    cx={s.x + props.w / 2}
                    cy={s.y + props.h / 2}
                    rx={props.w / 2}
                    ry={props.h / 2}
                    fill="#000000"
                  />
                )
              }
              return (
                <rect
                  key={s.id}
                  x={s.x}
                  y={s.y}
                  width={props.w}
                  height={props.h}
                  rx={props.radius ?? 0}
                  fill="#000000"
                />
              )
            })}
          </mask>
        )}
      </defs>

      <g mask={hasMask ? 'url(#cover-bg-mask)' : undefined}>
        <rect width={w} height={h} fill={backgroundColor} opacity={opacity} />
        <rect width={w} height={h} fill="url(#cover-bg-glow)" opacity={glowOpacity} />
      </g>
    </svg>
  )
})

// ── ShapeUtil ──────────────────────────────────────────────────────────────

export class CoverBackgroundShapeUtil extends ShapeUtil<CoverBackgroundShape> {
  static override type = COVER_BACKGROUND_TYPE

  static override props: RecordProps<CoverBackgroundShape> = {
    w: T.number,
    h: T.number,
    backgroundColor: T.string,
    backgroundOpacity: T.number,
  }

  getDefaultProps(): CoverBackgroundShape['props'] {
    return {
      w: 941,
      h: 1672,
      backgroundColor: '#132060',
      backgroundOpacity: 1,
    }
  }

  getGeometry(shape: CoverBackgroundShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  component(shape: CoverBackgroundShape) {
    return (
      <HTMLContainer style={{ width: shape.props.w, height: shape.props.h }}>
        <CoverBackgroundContent shape={shape} />
      </HTMLContainer>
    )
  }

  getIndicatorPath() {
    // No selection indicator for background
    return undefined
  }

  // Background is non-interactive
  canSelect() {
    return false
  }
  canEdit() {
    return false
  }
  canResize() {
    return false
  }
}
