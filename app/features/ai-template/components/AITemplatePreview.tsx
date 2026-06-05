"use client";

import type { Scene, ShapeElement, SceneElement } from "@/app/lib/scene";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/app/lib/scene";
import { 
  resolvePaint, 
  gradientVector,
  textAnchorForAlign,
  textX,
} from "@/app/lib/scene-svg";

interface AITemplatePreviewProps {
  scene: Scene | null;
  isGenerating: boolean;
}

export function AITemplatePreview({ scene, isGenerating }: AITemplatePreviewProps) {
  if (isGenerating) {
    return (
      <div className="ai-preview-container">
        <div className="ai-preview-loading">
          <div className="ai-preview-spinner" />
          <span>AI 正在生成设计图...</span>
        </div>
      </div>
    );
  }

  if (!scene) {
    return (
      <div className="ai-preview-container">
        <div className="ai-preview-empty">
          <span>等待 AI 生成结果</span>
        </div>
      </div>
    );
  }

  const visibleElements = scene.elements.filter((element) => element.hidden !== true);
  const hasBackgroundCutouts = visibleElements.some(isBackgroundCutoutShape);
  const gradientShapes = visibleElements.filter(isGradientShape);
  const prefix = "ai-preview";

  return (
    <div className="ai-preview-container">
      <div className="ai-preview-canvas-wrapper">
        <svg
          className="ai-preview-canvas"
          viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
          style={{
            width: "100%",
            height: "auto",
            maxWidth: "100%",
          }}
        >
          {/* Defs: gradients, masks, clips */}
          <defs>
            {/* Background glow gradient */}
            <radialGradient id={`${prefix}-bg-glow`} cx="48%" cy="28%" r="72%">
              <stop offset="0%" stopColor="#4e72ff" stopOpacity="0.75" />
              <stop offset="64%" stopColor="#2949d7" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#162b94" stopOpacity="0.42" />
            </radialGradient>
            
            {/* Course gradient */}
            <linearGradient id={`${prefix}-course-gradient`} x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="54%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#99f19c" />
            </linearGradient>
            
            {/* Accent gradient */}
            <linearGradient id={`${prefix}-accent-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#73f08c" />
              <stop offset="100%" stopColor="#2859d7" />
            </linearGradient>
            
            {/* Custom shape gradients */}
            {gradientShapes.map((element) => (
              <linearGradient
                key={`${prefix}-shape-gradient-${element.id}`}
                id={`${prefix}-shape-gradient-${element.id}`}
                x1={gradientVector(element.gradient!.direction).x1}
                y1={gradientVector(element.gradient!.direction).y1}
                x2={gradientVector(element.gradient!.direction).x2}
                y2={gradientVector(element.gradient!.direction).y2}
              >
                <stop offset="0%" stopColor={element.gradient!.startColor} />
                <stop offset="100%" stopColor={element.gradient!.endColor} />
              </linearGradient>
            ))}
            
            {/* Background mask for cutouts */}
            {hasBackgroundCutouts && (
              <mask id={`${prefix}-background-mask`} maskUnits="userSpaceOnUse">
                <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#ffffff" />
                {visibleElements
                  .filter(isBackgroundCutoutShape)
                  .map((element) => renderCutoutMaskShape(element))}
              </mask>
            )}
            
            {/* Image clips for circle shapes */}
            {visibleElements
              .filter((el) => el.type === "image" && el.shape === "circle")
              .map((element) => {
                if (element.type !== "image") return null;
                const cx = element.x + element.width / 2;
                const cy = element.y + element.height / 2;
                const r = Math.min(element.width, element.height) / 2;
                return (
                  <clipPath key={`${prefix}-clip-${element.id}`} id={`${prefix}-clip-${element.id}`}>
                    <circle cx={cx} cy={cy} r={r} />
                  </clipPath>
                );
              })}
          </defs>

          {/* Background */}
          <g mask={hasBackgroundCutouts ? `url(#${prefix}-background-mask)` : undefined}>
            <rect
              x={0}
              y={0}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              fill={scene.backgroundColor}
              opacity={scene.backgroundOpacity}
            />
            <rect
              x={0}
              y={0}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              fill={`url(#${prefix}-bg-glow)`}
              opacity={scene.backgroundOpacity * 0.68}
            />
          </g>

          {/* Elements */}
          {visibleElements.map((element) => renderPreviewElement(element, prefix))}
        </svg>
      </div>
    </div>
  );
}

function renderPreviewElement(element: SceneElement, prefix: string) {
  if (element.type === "text") {
    return renderPreviewText(element);
  }

  if (element.type === "image") {
    return renderPreviewImage(element, prefix);
  }

  return renderPreviewShape(element, prefix);
}

function renderPreviewText(element: SceneElement & { type: "text" }) {
  const lines = element.text.split("\n");
  const x = textX(element);
  const anchor = textAnchorForAlign(element.align);
  const lineHeight = element.fontSize * element.lineHeight;

  return (
    <text
      key={element.id}
      x={x}
      y={element.y + element.fontSize}
      fill={element.fill}
      fontFamily={element.fontFamily}
      fontSize={element.fontSize}
      fontWeight={element.fontWeight}
      textAnchor={anchor}
      opacity={element.opacity ?? 1}
    >
      {lines.map((line, index) => (
        <tspan key={`${element.id}-${index}`} x={x} dy={index === 0 ? 0 : lineHeight}>
          {line || " "}
        </tspan>
      ))}
    </text>
  );
}

function renderPreviewShape(element: SceneElement & { type: "rect" | "ellipse" }, prefix: string) {
  const opacity = element.opacity ?? 1;
  const fill = element.backgroundCutout
    ? "transparent"
    : resolveShapeFill(element, prefix);
  const actualOpacity = element.backgroundCutout ? 1 : opacity;

  const commonProps = {
    fill,
    opacity: actualOpacity,
    stroke: element.stroke,
    strokeWidth: element.strokeWidth,
  };

  if (element.type === "ellipse") {
    return (
      <ellipse
        key={element.id}
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
      key={element.id}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rx={element.radius ?? 0}
      {...commonProps}
    />
  );
}

function renderPreviewImage(element: SceneElement & { type: "image" }, prefix: string) {
  const opacity = element.opacity ?? 1;
  const preserveAspectRatio = element.fit === "cover" ? "xMidYMid slice" : "xMidYMid meet";

  if (!element.src) {
    const cx = element.x + element.width / 2;
    const cy = element.y + element.height / 2;
    const r = Math.min(element.width, element.height) / 2;

    return (
      <g key={element.id}>
        <circle cx={cx} cy={cy} r={r} fill="#edf3ff" stroke="#ffffff" strokeWidth="5" opacity={opacity} />
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
      </g>
    );
  }

  if (element.shape === "circle") {
    const cx = element.x + element.width / 2;
    const cy = element.y + element.height / 2;
    const r = Math.min(element.width, element.height) / 2;
    const clipId = `${prefix}-clip-${element.id}`;

    return (
      <g key={element.id}>
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
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ffffff" strokeWidth="5" opacity={opacity} />
      </g>
    );
  }

  return (
    <image
      key={element.id}
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

function resolveShapeFill(element: ShapeElement, prefix: string): string {
  if (isGradientShape(element)) {
    return `url(#${prefix}-shape-gradient-${element.id})`;
  }

  return resolvePaint(element.fill, prefix);
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

function isBackgroundCutoutShape(element: SceneElement): element is ShapeElement {
  return (
    (element.type === "rect" || element.type === "ellipse") &&
    element.hidden !== true &&
    element.backgroundCutout === true
  );
}

function renderCutoutMaskShape(element: ShapeElement) {
  if (element.type === "ellipse") {
    return (
      <ellipse
        key={`mask-${element.id}`}
        cx={element.x + element.width / 2}
        cy={element.y + element.height / 2}
        rx={element.width / 2}
        ry={element.height / 2}
        fill="#000000"
      />
    );
  }

  return (
    <rect
      key={`mask-${element.id}`}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rx={element.radius ?? 0}
      fill="#000000"
    />
  );
}