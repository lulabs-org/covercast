import type { GuideLine } from "../../lib/smart-guide";

type ArrowCapLine = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type CrossMarker = {
  line1: ArrowCapLine;
  line2: ArrowCapLine;
};

function computeCrossMarker(
  x: number,
  y: number,
  size: number
): CrossMarker {
  return {
    line1: { x1: x - size, y1: y - size, x2: x + size, y2: y + size },
    line2: { x1: x - size, y1: y + size, x2: x + size, y2: y - size },
  };
}

export function SmartGuideOverlay({ guides }: { guides: GuideLine[] }) {
  return (
    <g className="smart-guides-overlay" pointerEvents="none">
      {guides.map((guide, index) => {
        const crossSize = 6;
        const cross1 = computeCrossMarker(guide.x1, guide.y1, crossSize);
        const cross2 = computeCrossMarker(guide.x2, guide.y2, crossSize);

        return (
          <g key={`guide-${guide.type}-${index}`}>
            <line
              x1={guide.x1}
              y1={guide.y1}
              x2={guide.x2}
              y2={guide.y2}
              stroke="#ff5c8a"
              strokeWidth="2"
            />
            <line
              x1={cross1.line1.x1}
              y1={cross1.line1.y1}
              x2={cross1.line1.x2}
              y2={cross1.line1.y2}
              stroke="#ff5c8a"
              strokeWidth="2"
            />
            <line
              x1={cross1.line2.x1}
              y1={cross1.line2.y1}
              x2={cross1.line2.x2}
              y2={cross1.line2.y2}
              stroke="#ff5c8a"
              strokeWidth="2"
            />
            <line
              x1={cross2.line1.x1}
              y1={cross2.line1.y1}
              x2={cross2.line1.x2}
              y2={cross2.line1.y2}
              stroke="#ff5c8a"
              strokeWidth="2"
            />
            <line
              x1={cross2.line2.x1}
              y1={cross2.line2.y1}
              x2={cross2.line2.x2}
              y2={cross2.line2.y2}
              stroke="#ff5c8a"
              strokeWidth="2"
            />
          </g>
        );
      })}
    </g>
  );
}