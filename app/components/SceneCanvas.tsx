import type { PointerEvent, Ref } from "react";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  type ImageElement,
  type Scene,
  type SceneElement,
  type ShapeElement,
  type TextElement,
} from "../lib/scene";
import {
  elementBounds,
  gradientVector,
  resolvePaint,
  textAnchorForAlign,
  textX,
} from "../lib/scene-svg";
import type { GuideLine, MeasurementGuide, ResizeLabel } from "../lib/smart-guide";
import { getMarqueeRect, isMarqueeActive, type MarqueeState } from "../lib/marquee";
import { computeBoundingBox, formatDimension } from "../lib/group-drag";

type ArrowCapLine = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type ArrowCap = {
  line1: ArrowCapLine;
  line2: ArrowCapLine;
};

type ArrowDirection = "left" | "right" | "top" | "bottom";

function computeArrowCap(
  x: number,
  y: number,
  orientation: "horizontal" | "vertical",
  direction: ArrowDirection,
  arrowLen: number,
  arrowW: number
): ArrowCap {
  if (orientation === "horizontal") {
    if (direction === "left") {
      return {
        line1: { x1: x, y1: y, x2: x + arrowLen, y2: y - arrowW },
        line2: { x1: x, y1: y, x2: x + arrowLen, y2: y + arrowW },
      };
    } else {
      return {
        line1: { x1: x, y1: y, x2: x - arrowLen, y2: y - arrowW },
        line2: { x1: x, y1: y, x2: x - arrowLen, y2: y + arrowW },
      };
    }
  } else {
    if (direction === "top") {
      return {
        line1: { x1: x, y1: y, x2: x - arrowW, y2: y + arrowLen },
        line2: { x1: x, y1: y, x2: x + arrowW, y2: y + arrowLen },
      };
    } else {
      return {
        line1: { x1: x, y1: y, x2: x - arrowW, y2: y - arrowLen },
        line2: { x1: x, y1: y, x2: x + arrowW, y2: y - arrowLen },
      };
    }
  }
}

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

type SceneCanvasProps = {
  scene: Scene;
  className?: string;
  idPrefix?: string;
  interactive?: boolean;
  selectedIds?: string[];
  guides?: GuideLine[];
  spacingGuides?: MeasurementGuide[];
  resizeLabel?: ResizeLabel | null;
  svgRef?: Ref<SVGSVGElement>;
  marquee?: MarqueeState;
  editingTextId?: string | null;
  onCanvasPointerDown?: (event: PointerEvent<SVGSVGElement>) => void;
  onElementPointerDown?: (
    elementId: string,
    event: PointerEvent<SVGGElement>,
  ) => void;
  onResizePointerDown?: (
    elementId: string,
    event: PointerEvent<SVGRectElement>,
  ) => void;
  onTextElementDoubleClick?: (elementId: string) => void;
};

export default function SceneCanvas({
  scene,
  className,
  idPrefix = "scene",
  interactive = false,
  selectedIds = [],
  guides,
  spacingGuides,
  resizeLabel,
  svgRef,
  marquee,
  editingTextId,
  onCanvasPointerDown,
  onElementPointerDown,
  onResizePointerDown,
  onTextElementDoubleClick,
}: SceneCanvasProps) {
  const visibleElements = scene.elements.filter((element) => element.hidden !== true);
  const selectedElements = visibleElements.filter((element) => selectedIds.includes(element.id));

  return (
    <svg
      ref={svgRef}
      className={className}
      viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
      role="img"
      aria-label="Covercast OBS live background"
      preserveAspectRatio="xMidYMid meet"
      onPointerDown={onCanvasPointerDown}
      style={{ touchAction: interactive ? "none" : undefined }}
    >
      <defs>
        <radialGradient id={`${idPrefix}-bg-glow`} cx="48%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#4e72ff" stopOpacity="0.75" />
          <stop offset="64%" stopColor="#2949d7" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#162b94" stopOpacity="0.42" />
        </radialGradient>
        <linearGradient
          id={`${idPrefix}-course-gradient`}
          x1="0%"
          y1="50%"
          x2="100%"
          y2="50%"
        >
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="54%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#99f19c" />
        </linearGradient>
        <linearGradient
          id={`${idPrefix}-accent-gradient`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#73f08c" />
          <stop offset="100%" stopColor="#2859d7" />
        </linearGradient>
        {visibleElements
          .filter((element): element is ShapeElement & {
            gradient: NonNullable<ShapeElement["gradient"]>;
          } => isGradientShape(element))
          .map((element) => {
            const vector = gradientVector(element.gradient.direction);

            return (
              <linearGradient
                key={element.id}
                id={shapeGradientId(idPrefix, element.id)}
                x1={vector.x1}
                y1={vector.y1}
                x2={vector.x2}
                y2={vector.y2}
              >
                <stop offset="0%" stopColor={element.gradient.startColor} />
                <stop offset="100%" stopColor={element.gradient.endColor} />
              </linearGradient>
            );
          })}
        {hasBackgroundCutouts(visibleElements) ? (
          <mask id={backgroundMaskId(idPrefix)} maskUnits="userSpaceOnUse">
            <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#ffffff" />
            {visibleElements
              .filter(
                (element): element is ShapeElement =>
                  isBackgroundCutoutShape(element),
              )
              .map((element) =>
                element.type === "ellipse" ? (
                  <ellipse
                    key={element.id}
                    cx={element.x + element.width / 2}
                    cy={element.y + element.height / 2}
                    rx={element.width / 2}
                    ry={element.height / 2}
                    fill="#000000"
                  />
                ) : (
                  <rect
                    key={element.id}
                    x={element.x}
                    y={element.y}
                    width={element.width}
                    height={element.height}
                    rx={element.radius ?? 0}
                    fill="#000000"
                  />
                ),
              )}
          </mask>
        ) : null}
      </defs>

      <g
        mask={
          hasBackgroundCutouts(visibleElements)
            ? `url(#${backgroundMaskId(idPrefix)})`
            : undefined
        }
      >
        <rect
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          fill={scene.backgroundColor}
          opacity={clampOpacity(scene.backgroundOpacity)}
        />
        <rect
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          fill={`url(#${idPrefix}-bg-glow)`}
          opacity={0.68 * clampOpacity(scene.backgroundOpacity)}
        />
      </g>

      {visibleElements.map((element) => (
        <ElementView
          key={element.id}
          element={element}
          idPrefix={idPrefix}
          interactive={interactive}
          editingTextId={editingTextId}
          onPointerDown={onElementPointerDown}
          onDoubleClick={onTextElementDoubleClick}
        />
      ))}

      {interactive && selectedElements.length > 0 ? (
        <>
          {selectedElements.map((element) => (
            <SelectionFrame
              key={element.id}
              element={element}
              onResizePointerDown={selectedElements.length === 1 ? onResizePointerDown : undefined}
            />
          ))}
          {selectedElements.length > 1 ? (
            <GroupSelectionFrame elements={selectedElements} />
          ) : null}
        </>
      ) : null}

      {interactive && marquee && isMarqueeActive(marquee) ? (
        <MarqueeOverlay marquee={marquee} />
      ) : null}

      {guides && guides.length > 0 ? (
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
      ) : null}

      {spacingGuides && spacingGuides.length > 0 ? (
        <g className="spacing-guides-overlay" pointerEvents="none">
          {spacingGuides.map((mg, index) => {
            const { measurementLine, extensionLines, label, direction } = mg;
            const isHorizontal = direction === "horizontal";
            const arrowSize = 6;

            const cap1 = computeArrowCap(
              measurementLine.x1,
              measurementLine.y1,
              direction,
              isHorizontal ? "left" : "top",
              arrowSize,
              arrowSize
            );
            const cap2 = computeArrowCap(
              measurementLine.x2,
              measurementLine.y2,
              direction,
              isHorizontal ? "right" : "bottom",
              arrowSize,
              arrowSize
            );

            const labelText = String(label.value);
            const labelW = labelText.length * 10 + 10;
            const labelH = 22;
            const labelGap = 5;

            const labelRx = isHorizontal
              ? label.x - labelW / 2
              : label.x + labelGap;
            const labelRy = isHorizontal
              ? label.y - labelGap - labelH
              : label.y - labelH / 2;

            return (
              <g key={`measurement-${direction}-${index}`}>
                {extensionLines.map((ext, extIndex) => {
                  const extTickLen = 6;
                  const extIsVertical = ext.x1 === ext.x2;
                  const extTick1x1 = extIsVertical ? ext.x1 - extTickLen : ext.x1;
                  const extTick1y1 = extIsVertical ? ext.y1 : ext.y1 - extTickLen;
                  const extTick1x2 = extIsVertical ? ext.x1 + extTickLen : ext.x1;
                  const extTick1y2 = extIsVertical ? ext.y1 : ext.y1 + extTickLen;
                  const extTick2x1 = extIsVertical ? ext.x2 - extTickLen : ext.x2;
                  const extTick2y1 = extIsVertical ? ext.y2 : ext.y2 - extTickLen;
                  const extTick2x2 = extIsVertical ? ext.x2 + extTickLen : ext.x2;
                  const extTick2y2 = extIsVertical ? ext.y2 : ext.y2 + extTickLen;

                  return (
                    <g key={`ext-group-${extIndex}`}>
                      <line
                        x1={ext.x1}
                        y1={ext.y1}
                        x2={ext.x2}
                        y2={ext.y2}
                        stroke="#ff5c8a"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        opacity="0.6"
                      />
                      <line
                        x1={extTick1x1}
                        y1={extTick1y1}
                        x2={extTick1x2}
                        y2={extTick1y2}
                        stroke="#ff5c8a"
                        strokeWidth="2"
                        opacity="0.6"
                      />
                      <line
                        x1={extTick2x1}
                        y1={extTick2y1}
                        x2={extTick2x2}
                        y2={extTick2y2}
                        stroke="#ff5c8a"
                        strokeWidth="2"
                        opacity="0.6"
                      />
                    </g>
                  );
                })}
                <line
                  x1={measurementLine.x1}
                  y1={measurementLine.y1}
                  x2={measurementLine.x2}
                  y2={measurementLine.y2}
                  stroke="#ff5c8a"
                  strokeWidth="2"
                />
                <line
                  x1={cap1.line1.x1}
                  y1={cap1.line1.y1}
                  x2={cap1.line1.x2}
                  y2={cap1.line1.y2}
                  stroke="#ff5c8a"
                  strokeWidth="2"
                />
                <line
                  x1={cap1.line2.x1}
                  y1={cap1.line2.y1}
                  x2={cap1.line2.x2}
                  y2={cap1.line2.y2}
                  stroke="#ff5c8a"
                  strokeWidth="2"
                />
                <line
                  x1={cap2.line1.x1}
                  y1={cap2.line1.y1}
                  x2={cap2.line1.x2}
                  y2={cap2.line1.y2}
                  stroke="#ff5c8a"
                  strokeWidth="2"
                />
                <line
                  x1={cap2.line2.x1}
                  y1={cap2.line2.y1}
                  x2={cap2.line2.x2}
                  y2={cap2.line2.y2}
                  stroke="#ff5c8a"
                  strokeWidth="2"
                />
                {label.value > 0 ? (
                  <>
                    <rect
                      x={labelRx}
                      y={labelRy}
                      width={labelW}
                      height={labelH}
                      rx={3}
                      ry={3}
                      fill="#ff5c8a"
                    />
                    <text
                      x={labelRx + labelW / 2}
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
                  </>
                ) : null}
              </g>
            );
          })}
        </g>
      ) : null}

      {resizeLabel ? (() => {
        const labelText = `${resizeLabel.w} × ${resizeLabel.h}`;
        const labelW = labelText.length * 10 + 10;
        const labelH = 22;
        const labelGap = 5;
        const labelRx = resizeLabel.x - labelW / 2;
        const labelRy = resizeLabel.y + labelGap;
        return (
          <g className="resize-label-overlay" pointerEvents="none">
            <rect
              x={labelRx} y={labelRy}
              width={labelW} height={labelH}
              rx={3} ry={3}
              fill="#ff5c8a"
            />
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
        );
      })() : null}
    </svg>
  );
}

function ElementView({
  element,
  idPrefix,
  interactive,
  editingTextId,
  onPointerDown,
  onDoubleClick,
}: {
  element: SceneElement;
  idPrefix: string;
  interactive: boolean;
  editingTextId?: string | null;
  onPointerDown?: (
    elementId: string,
    event: PointerEvent<SVGGElement>,
  ) => void;
  onDoubleClick?: (elementId: string) => void;
}) {
  return (
    <g
      className={interactive ? `scene-element${element.locked ? " locked" : ""}` : undefined}
      data-element-id={element.id}
      onPointerDown={(event) => {
        if (!interactive) {
          return;
        }

        event.stopPropagation();
        onPointerDown?.(element.id, event);
      }}
      onDoubleClick={() => {
        if (!interactive || element.type !== "text") {
          return;
        }
        
        onDoubleClick?.(element.id);
      }}
    >
      {renderElement(element, idPrefix, interactive, editingTextId)}
    </g>
  );
}

function renderElement(
  element: SceneElement,
  idPrefix: string,
  interactive: boolean,
  editingTextId?: string | null,
) {
  if (element.type === "text") {
    return <TextElementView element={element} interactive={interactive} editing={editingTextId === element.id} />;
  }

  if (element.type === "image") {
    return <ImageElementView element={element} idPrefix={idPrefix} interactive={interactive} />;
  }

  return <ShapeElementView element={element} idPrefix={idPrefix} />;
}

function ShapeElementView({
  element,
  idPrefix,
}: {
  element: ShapeElement;
  idPrefix: string;
}) {
  const commonProps = {
    fill: element.backgroundCutout ? "transparent" : resolveShapeFill(element, idPrefix),
    stroke: element.stroke,
    strokeWidth: element.strokeWidth,
    opacity: element.backgroundCutout ? 1 : (element.opacity ?? 1),
  };

  if (element.type === "ellipse") {
    return (
      <ellipse
        cx={element.x + element.width / 2}
        cy={element.y + element.height / 2}
        rx={element.width / 2}
        ry={element.height / 2}
        {...commonProps}
      />
    );
  }

  return (
    <rect
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rx={element.radius ?? 0}
      {...commonProps}
    />
  );
}

function TextElementView({
  element,
  interactive,
  editing,
}: {
  element: TextElement;
  interactive: boolean;
  editing?: boolean;
}) {
  const x = textX(element);
  const lines = element.text.split("\n");
  const lineHeight = element.fontSize * element.lineHeight;

  return (
    <>
      {interactive ? (
        <rect
          x={element.x}
          y={element.y}
          width={element.width}
          height={element.height}
          fill="transparent"
        />
      ) : null}
      <text
        x={x}
        y={element.y + element.fontSize}
        fill={element.fill}
        fontFamily={element.fontFamily}
        fontSize={element.fontSize}
        fontWeight={element.fontWeight}
        textAnchor={textAnchorForAlign(element.align)}
        opacity={element.opacity ?? 1}
        style={{
          userSelect: interactive && !editing ? "none" : undefined,
          pointerEvents: interactive && !editing ? "none" : undefined,
        }}
      >
        {lines.map((line, index) => (
          <tspan key={`${element.id}-${index}`} x={x} dy={index === 0 ? 0 : lineHeight}>
            {line || " "}
          </tspan>
        ))}
      </text>
    </>
  );
}

function ImageElementView({
  element,
  idPrefix,
  interactive,
}: {
  element: ImageElement;
  idPrefix: string;
  interactive?: boolean;
}) {
  const opacity = element.opacity ?? 1;
  const preserveAspectRatio =
    element.fit === "cover" ? "xMidYMid slice" : "xMidYMid meet";

  if (!element.src) {
    const cx = element.x + element.width / 2;
    const cy = element.y + element.height / 2;
    const r = Math.min(element.width, element.height) / 2;

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
            userSelect: interactive ? "none" : undefined,
            pointerEvents: interactive ? "none" : undefined,
          }}
        >
          {element.fallbackText || "图"}
        </text>
      </>
    );
  }

  if (element.shape === "circle") {
    const clipId = `${idPrefix}-clip-${element.id}`;
    const cx = element.x + element.width / 2;
    const cy = element.y + element.height / 2;
    const r = Math.min(element.width, element.height) / 2;

    return (
      <>
        <defs>
          <clipPath id={clipId}>
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>
        </defs>
        <image
          href={element.src}
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
    );
  }

  return (
    <image
      href={element.src}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      preserveAspectRatio={preserveAspectRatio}
      opacity={opacity}
    />
  );
}

function SelectionFrame({
  element,
  onResizePointerDown,
}: {
  element: SceneElement;
  onResizePointerDown?: (
    elementId: string,
    event: PointerEvent<SVGRectElement>,
  ) => void;
}) {
  const bounds = elementBounds(element);
  const handleSize = 20;

  return (
    <g className="selection-frame">
      <rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        fill="none"
        stroke="#f8d84a"
        strokeWidth="3"
        vectorEffect="non-scaling-stroke"
        pointerEvents="none"
      />
      <rect
        className="selection-handle"
        x={bounds.x + bounds.width - handleSize / 2}
        y={bounds.y + bounds.height - handleSize / 2}
        width={handleSize}
        height={handleSize}
        rx="4"
        fill="#f8d84a"
        stroke="#132060"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        onPointerDown={(event) => {
          event.stopPropagation();
          onResizePointerDown?.(element.id, event);
        }}
      />
    </g>
  );
}

function clampOpacity(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(Math.max(value, 0), 1);
}

function resolveShapeFill(element: ShapeElement, idPrefix: string) {
  if (isGradientShape(element)) {
    return `url(#${shapeGradientId(idPrefix, element.id)})`;
  }

  return resolvePaint(element.fill, idPrefix);
}

function isGradientShape(element: SceneElement): element is ShapeElement & {
  gradient: NonNullable<ShapeElement["gradient"]>;
} {
  return (
    (element.type === "rect" || element.type === "ellipse") &&
    element.hidden !== true &&
    element.fillMode === "gradient" &&
    Boolean(element.gradient)
  );
}

function shapeGradientId(prefix: string, elementId: string): string {
  return `${prefix}-shape-gradient-${elementId}`;
}

function isBackgroundCutoutShape(element: SceneElement): element is ShapeElement {
  return (
    (element.type === "rect" || element.type === "ellipse") &&
    element.hidden !== true &&
    element.backgroundCutout === true
  );
}

function hasBackgroundCutouts(elements: SceneElement[]) {
  return elements.some(isBackgroundCutoutShape);
}

function backgroundMaskId(prefix: string) {
  return `${prefix}-background-mask`;
}

function MarqueeOverlay({ marquee }: { marquee: MarqueeState }) {
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

function GroupSelectionFrame({
  elements,
}: {
  elements: SceneElement[];
}) {
  const bounds = computeBoundingBox(elements);
  const labelText = formatDimension(bounds.width, bounds.height);
  const labelW = labelText.length * 10 + 10;
  const labelH = 22;
  const labelGap = 5;
  const labelRx = bounds.x + bounds.width / 2 - labelW / 2;
  const labelRy = bounds.y + bounds.height + labelGap;

  return (
    <g className="group-selection-frame" pointerEvents="none">
      <rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        fill="none"
        stroke="#336FFF"
        strokeWidth="3"
        vectorEffect="non-scaling-stroke"
      />
      <rect
        x={labelRx}
        y={labelRy}
        width={labelW}
        height={labelH}
        rx={3}
        ry={3}
        fill="#336FFF"
      />
      <text
        x={bounds.x + bounds.width / 2}
        y={labelRy + labelH / 2}
        textAnchor="middle"
        fill="#ffffff"
        fontSize="16"
        fontFamily="PingFang SC, Microsoft YaHei, Arial, sans-serif"
        fontWeight="600"
        dominantBaseline="central"
      >
        {labelText}
      </text>
    </g>
  );
}
