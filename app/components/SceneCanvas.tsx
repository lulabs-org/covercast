import { useEffect, useState, type PointerEvent, type Ref } from "react";
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
import { getMarqueeRect, hasMarqueeSize, hitTestElements, isMarqueeActive, type HitTestStrategy, type MarqueeState } from "../lib/marquee";
import { MarqueeOverlay } from "./canvas/MarqueeOverlay";
import { SmartGuideOverlay } from "./canvas/SmartGuideOverlay";
import { ResizeLabelOverlay } from "./canvas/ResizeLabelOverlay";
import { SpacingGuideOverlay } from "./canvas/SpacingGuideOverlay";
import { SelectionFrame } from "./canvas/SelectionFrame";
import { GroupSelectionFrame } from "./canvas/GroupSelectionFrame";
import {
  computeBoundingBox,
  formatDimension,
  type ResizeHandleType,
} from "../lib/group-drag";

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
  hitTestStrategy?: HitTestStrategy;
  editingTextId?: string | null;
  isGroupDragging?: boolean;
  onCanvasPointerDown?: (event: PointerEvent<SVGSVGElement>) => void;
  onElementPointerDown?: (
    elementId: string,
    event: PointerEvent<SVGGElement>,
  ) => void;
  onResizePointerDown?: (
    elementId: string,
    event: PointerEvent<SVGRectElement>,
  ) => void;
  onGroupDragPointerDown?: (event: PointerEvent<SVGRectElement>) => void;
  onGroupResizePointerDown?: (
    handle: ResizeHandleType,
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
  hitTestStrategy = "intersection",
  editingTextId,
  isGroupDragging = false,
  onCanvasPointerDown,
  onElementPointerDown,
  onResizePointerDown,
  onGroupDragPointerDown,
  onGroupResizePointerDown,
  onTextElementDoubleClick,
}: SceneCanvasProps) {
  const [shiftKeyPressed, setShiftKeyPressed] = useState(false);

  useEffect(() => {
    if (!interactive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setShiftKeyPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setShiftKeyPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [interactive]);

  const visibleElements = scene.elements.filter((element) => element.hidden !== true);
  const selectedElements = visibleElements.filter((element) => selectedIds.includes(element.id));

  let marqueePreviewElements: SceneElement[] = [];
  if (marquee && isMarqueeActive(marquee) && hasMarqueeSize(marquee, 5)) {
    const rect = getMarqueeRect(marquee);
    const hitIds = hitTestElements(rect, visibleElements, hitTestStrategy);
    marqueePreviewElements = visibleElements.filter((element) => hitIds.includes(element.id));
  }

  return (
    <svg
      ref={svgRef}
      className={className}
      viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
      role="img"
      aria-label="Covercast OBS live background"
      preserveAspectRatio="xMidYMid meet"
      onPointerDown={onCanvasPointerDown}
      style={{
        touchAction: interactive ? "none" : undefined,
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
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
          {selectedElements.length > 1 && !isGroupDragging ? (
            <GroupSelectionFrame
              elements={selectedElements}
              shiftKeyPressed={shiftKeyPressed}
              onDragPointerDown={onGroupDragPointerDown}
              onResizePointerDown={onGroupResizePointerDown}
            />
          ) : null}
        </>
      ) : null}

      {interactive && marquee && isMarqueeActive(marquee) ? (
        <MarqueeOverlay marquee={marquee} />
      ) : null}

      {interactive && marqueePreviewElements.length > 0 ? (
        <GroupSelectionFrame elements={marqueePreviewElements} shiftKeyPressed={shiftKeyPressed} />
      ) : null}

      {guides && guides.length > 0 ? (
        <SmartGuideOverlay guides={guides} />
      ) : null}

      {resizeLabel ? (
        <ResizeLabelOverlay resizeLabel={resizeLabel} />
      ) : null}

      {spacingGuides && spacingGuides.length > 0 ? (
        <SpacingGuideOverlay spacingGuides={spacingGuides} />
      ) : null}
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
