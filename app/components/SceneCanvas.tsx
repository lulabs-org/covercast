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

type SceneCanvasProps = {
  scene: Scene;
  className?: string;
  idPrefix?: string;
  interactive?: boolean;
  selectedId?: string | null;
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
  svgRef,
  onCanvasPointerDown,
  onElementPointerDown,
  onResizePointerDown,
}: SceneCanvasProps) {
  const selectedElement = scene.elements.find((element) => element.id === selectedId);

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
        {scene.elements
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
      </defs>

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

      {scene.elements.map((element) => (
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
      className={interactive ? "scene-element" : undefined}
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
    fill: resolveShapeFill(element, idPrefix),
    stroke: element.stroke,
    strokeWidth: element.strokeWidth,
    opacity: element.opacity ?? 1,
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
    element.fillMode === "gradient" &&
    Boolean(element.gradient)
  );
}

function shapeGradientId(prefix: string, elementId: string): string {
  return `${prefix}-shape-gradient-${elementId}`;
}
