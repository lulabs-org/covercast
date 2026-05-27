import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./scene";

export type GuideDirection = "horizontal" | "vertical";

export type GuideType =
  | "left"
  | "center-h"
  | "right"
  | "top"
  | "center-v"
  | "bottom";

export type GuideLine = {
  direction: GuideDirection;
  type: GuideType;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ExtensionLine = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type MeasurementGuide = {
  direction: "horizontal" | "vertical";
  measurementLine: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  extensionLines: ExtensionLine[];
  label: {
    x: number;
    y: number;
    value: number;
  };
};

export type ResizeLabel = {
  x: number;
  y: number;
  w: number;
  h: number;
};

const DEFAULT_THRESHOLD = 5;

export function computeGuides(
  dragged: Rect,
  others: Rect[],
  threshold = DEFAULT_THRESHOLD,
): GuideLine[] {
  const guides: GuideLine[] = [];

  const dLeft = dragged.x;
  const dCenterH = dragged.x + dragged.width / 2;
  const dRight = dragged.x + dragged.width;
  const dTop = dragged.y;
  const dCenterV = dragged.y + dragged.height / 2;
  const dBottom = dragged.y + dragged.height;

  const canvasCx = CANVAS_WIDTH / 2;
  const canvasCy = CANVAS_HEIGHT / 2;

  if (Math.abs(dLeft - 0) < threshold) {
    guides.push({
      direction: "vertical",
      type: "left",
      x1: 0,
      y1: 0,
      x2: 0,
      y2: CANVAS_HEIGHT,
    });
  }

  if (Math.abs(dRight - CANVAS_WIDTH) < threshold) {
    guides.push({
      direction: "vertical",
      type: "right",
      x1: CANVAS_WIDTH,
      y1: 0,
      x2: CANVAS_WIDTH,
      y2: CANVAS_HEIGHT,
    });
  }

  if (Math.abs(dCenterH - canvasCx) < threshold) {
    guides.push({
      direction: "vertical",
      type: "center-h",
      x1: canvasCx,
      y1: 0,
      x2: canvasCx,
      y2: CANVAS_HEIGHT,
    });
  }

  if (Math.abs(dTop - 0) < threshold) {
    guides.push({
      direction: "horizontal",
      type: "top",
      x1: 0,
      y1: 0,
      x2: CANVAS_WIDTH,
      y2: 0,
    });
  }

  if (Math.abs(dBottom - CANVAS_HEIGHT) < threshold) {
    guides.push({
      direction: "horizontal",
      type: "bottom",
      x1: 0,
      y1: CANVAS_HEIGHT,
      x2: CANVAS_WIDTH,
      y2: CANVAS_HEIGHT,
    });
  }

  if (Math.abs(dCenterV - canvasCy) < threshold) {
    guides.push({
      direction: "horizontal",
      type: "center-v",
      x1: 0,
      y1: canvasCy,
      x2: CANVAS_WIDTH,
      y2: canvasCy,
    });
  }

  if (others.length === 0) {
    return guides;
  }

  for (const other of others) {
    const oLeft = other.x;
    const oCenterH = other.x + other.width / 2;
    const oRight = other.x + other.width;
    const oTop = other.y;
    const oCenterV = other.y + other.height / 2;
    const oBottom = other.y + other.height;

    const spanX1 = Math.min(dLeft, oLeft);
    const spanX2 = Math.max(dRight, oRight);
    const spanY1 = Math.min(dTop, oTop);
    const spanY2 = Math.max(dBottom, oBottom);

    if (Math.abs(dLeft - oLeft) < threshold) {
      guides.push({
        direction: "vertical",
        type: "left",
        x1: dLeft,
        y1: spanY1,
        x2: dLeft,
        y2: spanY2,
      });
    }

    if (Math.abs(dLeft - oRight) < threshold) {
      guides.push({
        direction: "vertical",
        type: "left",
        x1: dLeft,
        y1: spanY1,
        x2: dLeft,
        y2: spanY2,
      });
    }

    if (Math.abs(dCenterH - oCenterH) < threshold) {
      guides.push({
        direction: "vertical",
        type: "center-h",
        x1: dCenterH,
        y1: spanY1,
        x2: dCenterH,
        y2: spanY2,
      });
    }

    if (Math.abs(dCenterH - oLeft) < threshold) {
      guides.push({
        direction: "vertical",
        type: "center-h",
        x1: dCenterH,
        y1: spanY1,
        x2: dCenterH,
        y2: spanY2,
      });
    }

    if (Math.abs(dCenterH - oRight) < threshold) {
      guides.push({
        direction: "vertical",
        type: "center-h",
        x1: dCenterH,
        y1: spanY1,
        x2: dCenterH,
        y2: spanY2,
      });
    }

    if (Math.abs(dRight - oRight) < threshold) {
      guides.push({
        direction: "vertical",
        type: "right",
        x1: dRight,
        y1: spanY1,
        x2: dRight,
        y2: spanY2,
      });
    }

    if (Math.abs(dRight - oLeft) < threshold) {
      guides.push({
        direction: "vertical",
        type: "right",
        x1: dRight,
        y1: spanY1,
        x2: dRight,
        y2: spanY2,
      });
    }

    if (Math.abs(dTop - oTop) < threshold) {
      guides.push({
        direction: "horizontal",
        type: "top",
        x1: spanX1,
        y1: dTop,
        x2: spanX2,
        y2: dTop,
      });
    }

    if (Math.abs(dTop - oBottom) < threshold) {
      guides.push({
        direction: "horizontal",
        type: "top",
        x1: spanX1,
        y1: dTop,
        x2: spanX2,
        y2: dTop,
      });
    }

    if (Math.abs(dCenterV - oCenterV) < threshold) {
      guides.push({
        direction: "horizontal",
        type: "center-v",
        x1: spanX1,
        y1: dCenterV,
        x2: spanX2,
        y2: dCenterV,
      });
    }

    if (Math.abs(dCenterV - oTop) < threshold) {
      guides.push({
        direction: "horizontal",
        type: "center-v",
        x1: spanX1,
        y1: dCenterV,
        x2: spanX2,
        y2: dCenterV,
      });
    }

    if (Math.abs(dCenterV - oBottom) < threshold) {
      guides.push({
        direction: "horizontal",
        type: "center-v",
        x1: spanX1,
        y1: dCenterV,
        x2: spanX2,
        y2: dCenterV,
      });
    }

    if (Math.abs(dBottom - oBottom) < threshold) {
      guides.push({
        direction: "horizontal",
        type: "bottom",
        x1: spanX1,
        y1: dBottom,
        x2: spanX2,
        y2: dBottom,
      });
    }

    if (Math.abs(dBottom - oTop) < threshold) {
      guides.push({
        direction: "horizontal",
        type: "bottom",
        x1: spanX1,
        y1: dBottom,
        x2: spanX2,
        y2: dBottom,
      });
    }
  }

  return guides;
}

// --- Snap engine types ---

export type AxisSnapState = {
  type: GuideType;
  target: number;
} | null;

export type SnapState = {
  x: AxisSnapState;
  y: AxisSnapState;
};

export type SnapResult = {
  snappedRect: Rect;
  guides: GuideLine[];
  snapDx: number;
  snapDy: number;
  snapState: SnapState;
};

type SnapCandidate = {
  delta: number;
  type: GuideType;
};

export const SNAP_THRESHOLD = 5;
export const SNAP_HYSTERESIS = 10;

export function createSnapState(): SnapState {
  return { x: null, y: null };
}

export function computeSnap(
  rawRect: Rect,
  others: Rect[],
  prevSnap: SnapState | null = null,
  threshold = SNAP_THRESHOLD,
  hysteresis = SNAP_HYSTERESIS,
): SnapResult {
  const nextSnap: SnapState = { x: null, y: null };
  let snapDx = 0;
  let snapDy = 0;

  const dLeft = rawRect.x;
  const dCenterH = rawRect.x + rawRect.width / 2;
  const dRight = rawRect.x + rawRect.width;
  const dTop = rawRect.y;
  const dCenterV = rawRect.y + rawRect.height / 2;
  const dBottom = rawRect.y + rawRect.height;

  const xCandidates: SnapCandidate[] = [];
  const yCandidates: SnapCandidate[] = [];

  const canvasCx = CANVAS_WIDTH / 2;
  const canvasCy = CANVAS_HEIGHT / 2;

  if (Math.abs(dLeft - 0) < threshold) {
    xCandidates.push({ delta: 0 - dLeft, type: "left" });
  }

  if (Math.abs(dRight - CANVAS_WIDTH) < threshold) {
    xCandidates.push({ delta: CANVAS_WIDTH - dRight, type: "right" });
  }

  if (Math.abs(dCenterH - canvasCx) < threshold) {
    xCandidates.push({ delta: canvasCx - dCenterH, type: "center-h" });
  }

  if (Math.abs(dTop - 0) < threshold) {
    yCandidates.push({ delta: 0 - dTop, type: "top" });
  }

  if (Math.abs(dBottom - CANVAS_HEIGHT) < threshold) {
    yCandidates.push({ delta: CANVAS_HEIGHT - dBottom, type: "bottom" });
  }

  if (Math.abs(dCenterV - canvasCy) < threshold) {
    yCandidates.push({ delta: canvasCy - dCenterV, type: "center-v" });
  }

  for (const other of others) {
    const oLeft = other.x;
    const oCenterH = other.x + other.width / 2;
    const oRight = other.x + other.width;
    const oTop = other.y;
    const oCenterV = other.y + other.height / 2;
    const oBottom = other.y + other.height;

    const dxLoLo = oLeft - dLeft;
    const dxLoRo = oRight - dLeft;
    const dxCoCo = oCenterH - dCenterH;
    const dxCoLo = oLeft - dCenterH;
    const dxCoRo = oRight - dCenterH;
    const dxRoRo = oRight - dRight;
    const dxRoLo = oLeft - dRight;

    const dyToTo = oTop - dTop;
    const dyToBo = oBottom - dTop;
    const dyCvCv = oCenterV - dCenterV;
    const dyCvTo = oTop - dCenterV;
    const dyCvBo = oBottom - dCenterV;
    const dyBoBo = oBottom - dBottom;
    const dyBoTo = oTop - dBottom;

    if (Math.abs(dxLoLo) < threshold)
      xCandidates.push({ delta: dxLoLo, type: "left" });
    if (Math.abs(dxLoRo) < threshold)
      xCandidates.push({ delta: dxLoRo, type: "left" });
    if (Math.abs(dxCoCo) < threshold)
      xCandidates.push({ delta: dxCoCo, type: "center-h" });
    if (Math.abs(dxCoLo) < threshold)
      xCandidates.push({ delta: dxCoLo, type: "center-h" });
    if (Math.abs(dxCoRo) < threshold)
      xCandidates.push({ delta: dxCoRo, type: "center-h" });
    if (Math.abs(dxRoRo) < threshold)
      xCandidates.push({ delta: dxRoRo, type: "right" });
    if (Math.abs(dxRoLo) < threshold)
      xCandidates.push({ delta: dxRoLo, type: "right" });

    if (Math.abs(dyToTo) < threshold)
      yCandidates.push({ delta: dyToTo, type: "top" });
    if (Math.abs(dyToBo) < threshold)
      yCandidates.push({ delta: dyToBo, type: "top" });
    if (Math.abs(dyCvCv) < threshold)
      yCandidates.push({ delta: dyCvCv, type: "center-v" });
    if (Math.abs(dyCvTo) < threshold)
      yCandidates.push({ delta: dyCvTo, type: "center-v" });
    if (Math.abs(dyCvBo) < threshold)
      yCandidates.push({ delta: dyCvBo, type: "center-v" });
    if (Math.abs(dyBoBo) < threshold)
      yCandidates.push({ delta: dyBoBo, type: "bottom" });
    if (Math.abs(dyBoTo) < threshold)
      yCandidates.push({ delta: dyBoTo, type: "bottom" });
  }

  const prevX = prevSnap?.x ?? null;
  if (prevX) {
    const rawDiff = Math.abs(rawRect.x - prevX.target);
    if (rawDiff < hysteresis) {
      snapDx = prevX.target - rawRect.x;
      nextSnap.x = prevX;
    }
  }

  if (nextSnap.x === null && xCandidates.length > 0) {
    xCandidates.sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta));
    const best = xCandidates[0];
    snapDx = best.delta;
    nextSnap.x = { type: best.type, target: rawRect.x + best.delta };
  }

  const prevY = prevSnap?.y ?? null;
  if (prevY) {
    const rawDiff = Math.abs(rawRect.y - prevY.target);
    if (rawDiff < hysteresis) {
      snapDy = prevY.target - rawRect.y;
      nextSnap.y = prevY;
    }
  }

  if (nextSnap.y === null && yCandidates.length > 0) {
    yCandidates.sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta));
    const best = yCandidates[0];
    snapDy = best.delta;
    nextSnap.y = { type: best.type, target: rawRect.y + best.delta };
  }

  const snappedRect: Rect = {
    x: rawRect.x + snapDx,
    y: rawRect.y + snapDy,
    width: rawRect.width,
    height: rawRect.height,
  };

  const guides =
    snappedRect.x !== rawRect.x || snappedRect.y !== rawRect.y
      ? computeGuides(snappedRect, others, threshold)
      : [];

  return {
    snappedRect,
    guides,
    snapDx,
    snapDy,
    snapState: nextSnap,
  };
}

const SPACING_ALIGN_THRESHOLD = 5;

type MeasurementCandidate = {
  guide: MeasurementGuide;
  distance: number;
  hasAlignment: boolean;
  position: "left" | "right" | "top" | "bottom";
};

export function computeSpacingGuides(
  dragged: Rect,
  others: Rect[],
  alignThreshold = SPACING_ALIGN_THRESHOLD,
): MeasurementGuide[] {
  if (others.length === 0) return [];

  const dLeft = dragged.x;
  const dCenterH = dragged.x + dragged.width / 2;
  const dRight = dragged.x + dragged.width;
  const dTop = dragged.y;
  const dCenterV = dragged.y + dragged.height / 2;
  const dBottom = dragged.y + dragged.height;

  const leftCandidates: MeasurementCandidate[] = [];
  const rightCandidates: MeasurementCandidate[] = [];
  const topCandidates: MeasurementCandidate[] = [];
  const bottomCandidates: MeasurementCandidate[] = [];

  for (const other of others) {
    const oLeft = other.x;
    const oCenterH = other.x + other.width / 2;
    const oRight = other.x + other.width;
    const oTop = other.y;
    const oCenterV = other.y + other.height / 2;
    const oBottom = other.y + other.height;

    if (dRight <= oLeft) {
      const gap = oLeft - dRight;
      const vAlign = checkVerticalAlignment(
        dTop, dCenterV, dBottom,
        oTop, oCenterV, oBottom,
        alignThreshold
      );
      if (vAlign) {
        const guide = createHorizontalMeasurementGuide(
          dRight, oLeft, dCenterV,
          dTop, dBottom, oTop, oBottom,
          gap
        );
        rightCandidates.push({
          guide,
          distance: gap,
          hasAlignment: vAlign,
          position: "right",
        });
      }
    } else if (oRight <= dLeft) {
      const gap = dLeft - oRight;
      const vAlign = checkVerticalAlignment(
        dTop, dCenterV, dBottom,
        oTop, oCenterV, oBottom,
        alignThreshold
      );
      if (vAlign) {
        const guide = createHorizontalMeasurementGuide(
          oRight, dLeft, dCenterV,
          oTop, oBottom, dTop, dBottom,
          gap
        );
        leftCandidates.push({
          guide,
          distance: gap,
          hasAlignment: vAlign,
          position: "left",
        });
      }
    }

    if (dBottom <= oTop) {
      const gap = oTop - dBottom;
      const hAlign = checkHorizontalAlignment(
        dLeft, dCenterH, dRight,
        oLeft, oCenterH, oRight,
        alignThreshold
      );
      if (hAlign) {
        const guide = createVerticalMeasurementGuide(
          dBottom, oTop, dCenterH,
          dLeft, dRight, oLeft, oRight,
          gap
        );
        bottomCandidates.push({
          guide,
          distance: gap,
          hasAlignment: hAlign,
          position: "bottom",
        });
      }
    } else if (oBottom <= dTop) {
      const gap = dTop - oBottom;
      const hAlign = checkHorizontalAlignment(
        dLeft, dCenterH, dRight,
        oLeft, oCenterH, oRight,
        alignThreshold
      );
      if (hAlign) {
        const guide = createVerticalMeasurementGuide(
          oBottom, dTop, dCenterH,
          oLeft, oRight, dLeft, dRight,
          gap
        );
        topCandidates.push({
          guide,
          distance: gap,
          hasAlignment: hAlign,
          position: "top",
        });
      }
    }
  }

  const selectedGuides: MeasurementGuide[] = [];

  const bestLeft = selectBestCandidate(leftCandidates);
  if (bestLeft) selectedGuides.push(bestLeft.guide);

  const bestRight = selectBestCandidate(rightCandidates);
  if (bestRight) selectedGuides.push(bestRight.guide);

  const bestTop = selectBestCandidate(topCandidates);
  if (bestTop) selectedGuides.push(bestTop.guide);

  const bestBottom = selectBestCandidate(bottomCandidates);
  if (bestBottom) selectedGuides.push(bestBottom.guide);

  return selectedGuides;
}

function selectBestCandidate(candidates: MeasurementCandidate[]): MeasurementCandidate | null {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  candidates.sort((a, b) => {
    if (a.hasAlignment !== b.hasAlignment) {
      return a.hasAlignment ? -1 : 1;
    }
    return a.distance - b.distance;
  });

  return candidates[0];
}

function checkVerticalAlignment(
  dTop: number,
  dCenterV: number,
  dBottom: number,
  oTop: number,
  oCenterV: number,
  oBottom: number,
  threshold: number
): boolean {
  return (
    Math.abs(dCenterV - oTop) < threshold ||
    Math.abs(dCenterV - oCenterV) < threshold ||
    Math.abs(dCenterV - oBottom) < threshold ||
    Math.abs(dTop - oTop) < threshold ||
    Math.abs(dTop - oBottom) < threshold ||
    Math.abs(dBottom - oTop) < threshold ||
    Math.abs(dBottom - oBottom) < threshold
  );
}

function checkHorizontalAlignment(
  dLeft: number,
  dCenterH: number,
  dRight: number,
  oLeft: number,
  oCenterH: number,
  oRight: number,
  threshold: number
): boolean {
  return (
    Math.abs(dCenterH - oLeft) < threshold ||
    Math.abs(dCenterH - oCenterH) < threshold ||
    Math.abs(dCenterH - oRight) < threshold ||
    Math.abs(dLeft - oLeft) < threshold ||
    Math.abs(dLeft - oRight) < threshold ||
    Math.abs(dRight - oLeft) < threshold ||
    Math.abs(dRight - oRight) < threshold
  );
}

function createHorizontalMeasurementGuide(
  startX: number,
  endX: number,
  centerY: number,
  startTop: number,
  startBottom: number,
  endTop: number,
  endBottom: number,
  gap: number
): MeasurementGuide {
  const measurementLine = {
    x1: startX,
    y1: centerY,
    x2: endX,
    y2: centerY,
  };

  const extensionLines: ExtensionLine[] = [];

  const startContainsCenter = centerY >= startTop && centerY <= startBottom;
  const endContainsCenter = centerY >= endTop && centerY <= endBottom;

  if (!startContainsCenter) {
    const nearestStartEdge = findNearestEdge(centerY, startTop, startBottom);
    extensionLines.push({
      x1: startX,
      y1: nearestStartEdge,
      x2: startX,
      y2: centerY,
    });
  }

  if (!endContainsCenter) {
    const nearestEndEdge = findNearestEdge(centerY, endTop, endBottom);
    extensionLines.push({
      x1: endX,
      y1: nearestEndEdge,
      x2: endX,
      y2: centerY,
    });
  }

  const labelX = (startX + endX) / 2;
  const labelY = centerY;

  return {
    direction: "horizontal",
    measurementLine,
    extensionLines,
    label: {
      x: labelX,
      y: labelY,
      value: Math.round(gap),
    },
  };
}

function createVerticalMeasurementGuide(
  startY: number,
  endY: number,
  centerX: number,
  startLeft: number,
  startRight: number,
  endLeft: number,
  endRight: number,
  gap: number
): MeasurementGuide {
  const measurementLine = {
    x1: centerX,
    y1: startY,
    x2: centerX,
    y2: endY,
  };

  const extensionLines: ExtensionLine[] = [];

  const startContainsCenter = centerX >= startLeft && centerX <= startRight;
  const endContainsCenter = centerX >= endLeft && centerX <= endRight;

  if (!startContainsCenter) {
    const nearestStartEdge = findNearestEdge(centerX, startLeft, startRight);
    extensionLines.push({
      x1: nearestStartEdge,
      y1: startY,
      x2: centerX,
      y2: startY,
    });
  }

  if (!endContainsCenter) {
    const nearestEndEdge = findNearestEdge(centerX, endLeft, endRight);
    extensionLines.push({
      x1: nearestEndEdge,
      y1: endY,
      x2: centerX,
      y2: endY,
    });
  }

  const labelX = centerX;
  const labelY = (startY + endY) / 2;

  return {
    direction: "vertical",
    measurementLine,
    extensionLines,
    label: {
      x: labelX,
      y: labelY,
      value: Math.round(gap),
    },
  };
}

function findNearestEdge(value: number, min: number, max: number): number {
  const distToMin = Math.abs(value - min);
  const distToMax = Math.abs(value - max);
  return distToMin <= distToMax ? min : max;
}

// --- Resize snap engine ---

export type AxisResizeSnapState = {
  type: GuideType;
  target: number;
} | null;

export type ResizeSnapState = {
  w: AxisResizeSnapState;
  h: AxisResizeSnapState;
};

export type ResizeSnapResult = {
  snappedWidth: number;
  snappedHeight: number;
  snapDw: number;
  snapDh: number;
  snapState: ResizeSnapState;
};

export function createResizeSnapState(): ResizeSnapState {
  return { w: null, h: null };
}

export function computeResizeSnap(
  rawRect: Rect,
  others: Rect[],
  prevSnap: ResizeSnapState | null = null,
  threshold = SNAP_THRESHOLD,
  hysteresis = SNAP_HYSTERESIS,
): ResizeSnapResult {
  const nextSnap: ResizeSnapState = { w: null, h: null };
  let snapDw = 0;
  let snapDh = 0;

  const dLeft = rawRect.x;
  const dCenterH = rawRect.x + rawRect.width / 2;
  const dRight = rawRect.x + rawRect.width;
  const dTop = rawRect.y;
  const dCenterV = rawRect.y + rawRect.height / 2;
  const dBottom = rawRect.y + rawRect.height;

  const wCandidates: SnapCandidate[] = [];
  const hCandidates: SnapCandidate[] = [];

  const canvasCx = CANVAS_WIDTH / 2;
  const canvasCy = CANVAS_HEIGHT / 2;

  if (Math.abs(dRight - CANVAS_WIDTH) < threshold) {
    wCandidates.push({ delta: CANVAS_WIDTH - dRight, type: "right" });
  }

  if (Math.abs(dCenterH - canvasCx) < threshold) {
    wCandidates.push({ delta: 2 * (canvasCx - dCenterH), type: "center-h" });
  }

  if (Math.abs(dBottom - CANVAS_HEIGHT) < threshold) {
    hCandidates.push({ delta: CANVAS_HEIGHT - dBottom, type: "bottom" });
  }

  if (Math.abs(dCenterV - canvasCy) < threshold) {
    hCandidates.push({ delta: 2 * (canvasCy - dCenterV), type: "center-v" });
  }

  for (const other of others) {
    const oLeft = other.x;
    const oCenterH = other.x + other.width / 2;
    const oRight = other.x + other.width;
    const oTop = other.y;
    const oCenterV = other.y + other.height / 2;
    const oBottom = other.y + other.height;

    const dwLo = oLeft - dRight;
    const dwRo = oRight - dRight;
    const dwCo = oCenterH - dRight;
    const dwCc = oCenterH - dCenterH;

    const dhTo = oTop - dBottom;
    const dhBo = oBottom - dBottom;
    const dhCv = oCenterV - dBottom;
    const dhCvc = oCenterV - dCenterV;

    if (Math.abs(dwLo) < threshold)
      wCandidates.push({ delta: dwLo, type: "left" });
    if (Math.abs(dwRo) < threshold)
      wCandidates.push({ delta: dwRo, type: "right" });
    if (Math.abs(dwCo) < threshold)
      wCandidates.push({ delta: dwCo, type: "center-h" });
    if (Math.abs(dwCc) < threshold)
      wCandidates.push({ delta: 2 * dwCc, type: "center-h" });

    if (Math.abs(dhTo) < threshold)
      hCandidates.push({ delta: dhTo, type: "top" });
    if (Math.abs(dhBo) < threshold)
      hCandidates.push({ delta: dhBo, type: "bottom" });
    if (Math.abs(dhCv) < threshold)
      hCandidates.push({ delta: dhCv, type: "center-v" });
    if (Math.abs(dhCvc) < threshold)
      hCandidates.push({ delta: 2 * dhCvc, type: "center-v" });
  }

  const prevW = prevSnap?.w ?? null;
  if (prevW) {
    const rawDiff = Math.abs(rawRect.width - prevW.target);
    if (rawDiff < hysteresis) {
      snapDw = prevW.target - rawRect.width;
      nextSnap.w = prevW;
    }
  }

  if (nextSnap.w === null && wCandidates.length > 0) {
    wCandidates.sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta));
    const best = wCandidates[0];
    snapDw = best.delta;
    nextSnap.w = { type: best.type, target: rawRect.width + best.delta };
  }

  const prevH = prevSnap?.h ?? null;
  if (prevH) {
    const rawDiff = Math.abs(rawRect.height - prevH.target);
    if (rawDiff < hysteresis) {
      snapDh = prevH.target - rawRect.height;
      nextSnap.h = prevH;
    }
  }

  if (nextSnap.h === null && hCandidates.length > 0) {
    hCandidates.sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta));
    const best = hCandidates[0];
    snapDh = best.delta;
    nextSnap.h = { type: best.type, target: rawRect.height + best.delta };
  }

  return {
    snappedWidth: rawRect.width + snapDw,
    snappedHeight: rawRect.height + snapDh,
    snapDw,
    snapDh,
    snapState: nextSnap,
  };
}
