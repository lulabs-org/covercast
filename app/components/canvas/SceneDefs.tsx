import { CANVAS_WIDTH, CANVAS_HEIGHT, type SceneElement, type ShapeElement } from "../../lib/scene";
import { gradientVector } from "../../lib/scene-svg";

type VisibleElement = SceneElement;

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

export function SceneDefs({
  visibleElements,
  idPrefix,
}: {
  visibleElements: VisibleElement[];
  idPrefix: string;
}) {
  return (
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
  );
}

export { backgroundMaskId, hasBackgroundCutouts };