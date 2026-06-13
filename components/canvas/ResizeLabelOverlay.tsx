import type { ResizeLabel } from '@/lib/algorithms'

export function ResizeLabelOverlay({ resizeLabel }: { resizeLabel: ResizeLabel }) {
  const labelText = `${resizeLabel.w} × ${resizeLabel.h}`
  const labelW = labelText.length * 10 + 10
  const labelH = 22
  const labelGap = 5
  const labelRx = resizeLabel.x - labelW / 2
  const labelRy = resizeLabel.y + labelGap

  return (
    <g className="resize-label-overlay" pointerEvents="none">
      <rect x={labelRx} y={labelRy} width={labelW} height={labelH} rx={3} ry={3} fill="#336FFF" />
      <text
        x={resizeLabel.x}
        y={labelRy + labelH / 2}
        fill="#ffffff"
        fontSize="16"
        fontFamily="PingFang SC, Microsoft YaHei, Arial, sans-serif"
        fontWeight="600"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {labelText}
      </text>
    </g>
  )
}
