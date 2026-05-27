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
import type { GuideLine, ResizeLabel, SpacingGuide } from "../lib/smart-guide";

type SceneCanvasProps = {
  scene: Scene;
  className?: string;
  idPrefix?: string;
  interactive?: boolean;
  selectedId?: string | null;
  guides?: GuideLine[];
  spacingGuides?: SpacingGuide[];
  resizeLabel?: ResizeLabel | null;
  svgRef?: Ref<SVGSVGElement>;
  onCanvasPointerDown?: (event: PointerEvent<SVGSVGElement>) => void;
  onElementPointerDown?: (
    elementId: string,
    event: PointerEvent<SVGGElement>,
  ) => void;
  onResizePointerDown?: (
    elementId: string,
    event: PointerEvent<SVGRectElement>,
  ) => void;
};

export default function SceneCanvas({
  scene,
  className,
  idPrefix = "scene",
  interactive = false,
  selectedId,
  guides,
  spacingGuides,
  resizeLabel,
  svgRef,
  onCanvasPointerDown,
  onElementPointerDown,
  onResizePointerDown,
}: SceneCanvasProps) {
  const visibleElements = scene.elements.filter((element) => element.hidden !== true);
  const selectedElement = visibleElements.find((element) => element.id === selectedId);

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
          onPointerDown={onElementPointerDown}
        />
      ))}

      {interactive && selectedElement ? (
        <SelectionFrame
          element={selectedElement}
          onResizePointerDown={onResizePointerDown}
        />
      ) : null}

      {guides && guides.length > 0 ? (
        <g className="smart-guides-overlay" pointerEvents="none">
          {guides.map((guide, index) => (
            <line
              key={`guide-${guide.type}-${index}`}
              x1={guide.x1}
              y1={guide.y1}
              x2={guide.x2}
              y2={guide.y2}
              stroke="#ff5c8a"
              strokeWidth="2"
            />
          ))}
        </g>
      ) : null}

      {spacingGuides && spacingGuides.length > 0 ? (
        <g className="spacing-guides-overlay" pointerEvents="none">
          {spacingGuides.map((sg, index) => {
            const arrowLen = 8;
            const arrowW = 6;
            const isHorizontal = sg.direction === "horizontal";

            const dx = sg.x2 - sg.x1;
            const dy = sg.y2 - sg.y1;

            const a1x1 = isHorizontal ? sg.x1 : sg.x1 - arrowW;
            const a1y1 = isHorizontal ? sg.y1 - arrowW : sg.y1;
            const a1x2 = isHorizontal ? sg.x1 + arrowLen * Math.sign(dx) : sg.x1;
            const a1y2 = isHorizontal ? sg.y1 : sg.y1 + arrowLen * Math.sign(dy);
            const a1x3 = isHorizontal ? sg.x1 : sg.x1 + arrowW;
            const a1y3 = isHorizontal ? sg.y1 + arrowW : sg.y1;

            const a2x1 = isHorizontal ? sg.x2 : sg.x2 - arrowW;
            const a2y1 = isHorizontal ? sg.y2 - arrowW : sg.y2;
            const a2x2 = isHorizontal ? sg.x2 - arrowLen * Math.sign(dx) : sg.x2;
            const a2y2 = isHorizontal ? sg.y2 : sg.y2 - arrowLen * Math.sign(dy);
            const a2x3 = isHorizontal ? sg.x2 : sg.x2 + arrowW;
            const a2y3 = isHorizontal ? sg.y2 + arrowW : sg.y2;

            const labelText = String(sg.value);
            const labelW = labelText.length * 10 + 10;
            const labelH = 22;
            const labelGap = 5;

            const labelRx = isHorizontal
              ? (sg.x1 + sg.x2) / 2 - labelW / 2
              : sg.x1 + labelGap;
            const labelRy = isHorizontal
              ? sg.y1 - labelGap - labelH
              : (sg.y1 + sg.y2) / 2 - labelH / 2;
            const textCx = isHorizontal
              ? (sg.x1 + sg.x2) / 2
              : labelRx + labelW / 2;
            const textCy = isHorizontal
              ? labelRy + labelH / 2
              : (sg.y1 + sg.y2) / 2;

            return (
              <g key={`spacing-${sg.direction}-${index}`}>
                <line
                  x1={sg.x1}
                  y1={sg.y1}
                  x2={sg.x2}
                  y2={sg.y2}
                  stroke="#ff5c8a"
                  strokeWidth="2"
                />
                <polygon
                  points={`${a1x1},${a1y1} ${a1x2},${a1y2} ${a1x3},${a1y3}`}
                  fill="#ff5c8a"
                />
                <polygon
                  points={`${a2x1},${a2y1} ${a2x2},${a2y2} ${a2x3},${a2y3}`}
                  fill="#ff5c8a"
                />
                <rect
                  x={labelRx} y={labelRy}
                  width={labelW} height={labelH}
                  rx={3} ry={3}
                  fill="#ff5c8a"
                />
                <text
                  x={textCx}
                  y={textCy}
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
  onPointerDown,
}: {
  element: SceneElement;
  idPrefix: string;
  interactive: boolean;
  onPointerDown?: (
    elementId: string,
    event: PointerEvent<SVGGElement>,
  ) => void;
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
    >
      {renderElement(element, idPrefix, interactive)}
    </g>
  );
}

function renderElement(
  element: SceneElement,
  idPrefix: string,
  interactive: boolean,
) {
  if (element.type === "text") {
    return <TextElementView element={element} interactive={interactive} />;
  }

  if (element.type === "image") {
    return <ImageElementView element={element} idPrefix={idPrefix} />;
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
}: {
  element: TextElement;
  interactive: boolean;
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
}: {
  element: ImageElement;
  idPrefix: string;
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
