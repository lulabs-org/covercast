import { getMarqueeRect, type MarqueeState } from "../../lib/marquee";

export function MarqueeOverlay({ marquee }: { marquee: MarqueeState }) {
  const rect = getMarqueeRect(marquee);

  if (rect.width === 0 && rect.height === 0) {
    return null;
  }

  return (
    <g className="marquee-overlay" pointerEvents="none">
      <rect
        x={rect.x}
        y={rect.y}
        width={rect.width}
        height={rect.height}
        fill="#336FFF"
        fillOpacity="0.15"
        stroke="#336FFF"
        strokeWidth="3"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}