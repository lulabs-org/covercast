import { type ImageElement } from '../../../lib/scene'

export function ImageElementView({
  element,
  idPrefix,
  interactive,
  resolveSrc,
}: {
  element: ImageElement
  idPrefix: string
  interactive?: boolean
  resolveSrc?: (src: string) => string
}) {
  const opacity = element.opacity ?? 1
  const preserveAspectRatio = element.fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet'
  const src = resolveSrc ? resolveSrc(element.src) : element.src

  if (!element.src) {
    const cx = element.x + element.width / 2
    const cy = element.y + element.height / 2
    const r = Math.min(element.width, element.height) / 2

    return (
      <>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="#edf3ff"
          stroke="#ffffff"
          strokeWidth="5"
          opacity={opacity}
        />
        <circle cx={cx} cy={cy} r={r - 7} fill="#87a9ff" opacity="0.36" />
        <text
          x={cx}
          y={cy + r * 0.22}
          textAnchor="middle"
          fill="#163690"
          fontFamily="PingFang SC, Microsoft YaHei, Arial, sans-serif"
          fontSize={r * 0.72}
          fontWeight="900"
          style={{
            userSelect: interactive ? 'none' : undefined,
            pointerEvents: interactive ? 'none' : undefined,
          }}
        >
          {element.fallbackText || '图'}
        </text>
      </>
    )
  }

  if (element.shape === 'circle') {
    const clipId = `${idPrefix}-clip-${element.id}`
    const cx = element.x + element.width / 2
    const cy = element.y + element.height / 2
    const r = Math.min(element.width, element.height) / 2

    return (
      <>
        <defs>
          <clipPath id={clipId}>
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>
        </defs>
        <image
          href={src}
          x={element.x}
          y={element.y}
          width={element.width}
          height={element.height}
          preserveAspectRatio={preserveAspectRatio}
          clipPath={`url(#${clipId})`}
          opacity={opacity}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#ffffff"
          strokeWidth="5"
          opacity={opacity}
        />
      </>
    )
  }

  return (
    <image
      href={src}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      preserveAspectRatio={preserveAspectRatio}
      opacity={opacity}
    />
  )
}
