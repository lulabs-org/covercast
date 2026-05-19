import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  type ImageElement,
  type Scene,
  type SceneElement,
  type ShapeElement,
  type TextAlign,
  type TextElement,
} from "./scene";

export function resolvePaint(fill: string, prefix = "covercast"): string {
  if (fill === "courseGradient") {
    return `url(#${prefix}-course-gradient)`;
  }

  if (fill === "accentGradient") {
    return `url(#${prefix}-accent-gradient)`;
  }

  return fill;
}

export function textAnchorForAlign(align: TextAlign): "start" | "middle" | "end" {
  if (align === "center") {
    return "middle";
  }

  if (align === "right") {
    return "end";
  }

  return "start";
}

export function textX(element: TextElement): number {
  if (element.align === "center") {
    return element.x + element.width / 2;
  }

  if (element.align === "right") {
    return element.x + element.width;
  }

  return element.x;
}

export function elementBounds(element: SceneElement) {
  return {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
  };
}

export function sceneToSvgMarkup(scene: Scene): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}" role="img" aria-label="Covercast OBS live background">`,
    renderDefs("covercast", scene),
    renderBackground(scene.backgroundColor, scene.backgroundOpacity),
    ...scene.elements.map((element) => renderElement(element, "covercast")),
    "</svg>",
  ].join("");
}

export function renderDefs(prefix: string, scene?: Scene): string {
  const customGradients =
    scene?.elements
      .filter(
        (element): element is ShapeElement & {
          gradient: NonNullable<ShapeElement["gradient"]>;
        } => isGradientShape(element),
      )
      .map((element) => renderShapeGradient(element, prefix))
      .join("") ?? "";

  return `
    <defs>
      <radialGradient id="${prefix}-bg-glow" cx="48%" cy="28%" r="72%">
        <stop offset="0%" stop-color="#4e72ff" stop-opacity="0.75" />
        <stop offset="64%" stop-color="#2949d7" stop-opacity="0.18" />
        <stop offset="100%" stop-color="#162b94" stop-opacity="0.42" />
      </radialGradient>
      <linearGradient id="${prefix}-course-gradient" x1="0%" y1="50%" x2="100%" y2="50%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="54%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#99f19c" />
      </linearGradient>
      <linearGradient id="${prefix}-accent-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#73f08c" />
        <stop offset="100%" stop-color="#2859d7" />
      </linearGradient>
      <filter id="${prefix}-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#142070" flood-opacity="0.28" />
      </filter>
      ${customGradients}
    </defs>
  `;
}

export function renderBackground(backgroundColor: string, backgroundOpacity = 1): string {
  const opacity = clampOpacity(backgroundOpacity);
  const glowOpacity = Number((0.68 * opacity).toFixed(3));

  return `
    <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="${escapeAttribute(backgroundColor)}" opacity="${opacity}" />
    <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="url(#covercast-bg-glow)" opacity="${glowOpacity}" />
  `;
}

function renderElement(element: SceneElement, prefix: string): string {
  if (element.type === "text") {
    return renderTextElement(element);
  }

  if (element.type === "image") {
    return renderImageElement(element, prefix);
  }

  return renderShapeElement(element, prefix);
}

function renderShapeElement(element: ShapeElement, prefix: string): string {
  const opacity = element.opacity ?? 1;
  const common = `fill="${escapeAttribute(resolveShapeFill(element, prefix))}" opacity="${opacity}"`;
  const stroke = element.stroke
    ? ` stroke="${escapeAttribute(element.stroke)}" stroke-width="${element.strokeWidth ?? 1}"`
    : "";

  if (element.type === "ellipse") {
    return `<ellipse cx="${element.x + element.width / 2}" cy="${element.y + element.height / 2}" rx="${element.width / 2}" ry="${element.height / 2}" ${common}${stroke} />`;
  }

  return `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" rx="${element.radius ?? 0}" ${common}${stroke} />`;
}

function resolveShapeFill(element: ShapeElement, prefix: string): string {
  if (isGradientShape(element)) {
    return `url(#${shapeGradientId(prefix, element.id)})`;
  }

  return resolvePaint(element.fill, prefix);
}

function renderShapeGradient(
  element: ShapeElement & { gradient: NonNullable<ShapeElement["gradient"]> },
  prefix: string,
): string {
  const gradient = element.gradient;
  const vector = gradientVector(gradient.direction);

  return `
    <linearGradient id="${shapeGradientId(prefix, element.id)}" x1="${vector.x1}" y1="${vector.y1}" x2="${vector.x2}" y2="${vector.y2}">
      <stop offset="0%" stop-color="${escapeAttribute(gradient.startColor)}" />
      <stop offset="100%" stop-color="${escapeAttribute(gradient.endColor)}" />
    </linearGradient>
  `;
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

export function gradientVector(direction: NonNullable<ShapeElement["gradient"]>["direction"]) {
  if (direction === "vertical") {
    return { x1: "0%", y1: "0%", x2: "0%", y2: "100%" };
  }

  if (direction === "diagonal-down") {
    return { x1: "0%", y1: "0%", x2: "100%", y2: "100%" };
  }

  if (direction === "diagonal-up") {
    return { x1: "0%", y1: "100%", x2: "100%", y2: "0%" };
  }

  return { x1: "0%", y1: "0%", x2: "100%", y2: "0%" };
}

function renderTextElement(element: TextElement): string {
  const lines = element.text.split("\n");
  const x = textX(element);
  const anchor = textAnchorForAlign(element.align);
  const lineHeight = element.fontSize * element.lineHeight;
  const tspans = lines
    .map((line, index) => {
      const dy = index === 0 ? 0 : lineHeight;
      return `<tspan x="${x}" dy="${dy}">${escapeText(line || " ")}</tspan>`;
    })
    .join("");

  return `<text x="${x}" y="${element.y + element.fontSize}" fill="${escapeAttribute(element.fill)}" font-family="${escapeAttribute(element.fontFamily)}" font-size="${element.fontSize}" font-weight="${element.fontWeight}" text-anchor="${anchor}" opacity="${element.opacity ?? 1}">${tspans}</text>`;
}

function renderImageElement(element: ImageElement, prefix: string): string {
  const opacity = element.opacity ?? 1;
  const clipId = `${prefix}-clip-${element.id}`;
  const preserveAspectRatio =
    element.fit === "cover" ? "xMidYMid slice" : "xMidYMid meet";

  if (!element.src) {
    const cx = element.x + element.width / 2;
    const cy = element.y + element.height / 2;
    const r = Math.min(element.width, element.height) / 2;
    const initials = escapeText(element.fallbackText || "图");
    return `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#edf3ff" stroke="#ffffff" stroke-width="5" opacity="${opacity}" />
      <circle cx="${cx}" cy="${cy}" r="${r - 7}" fill="#87a9ff" opacity="0.36" />
      <text x="${cx}" y="${cy + r * 0.22}" text-anchor="middle" fill="#163690" font-family="PingFang SC, Microsoft YaHei, Arial, sans-serif" font-size="${r * 0.72}" font-weight="900">${initials}</text>
    `;
  }

  if (element.shape === "circle") {
    const cx = element.x + element.width / 2;
    const cy = element.y + element.height / 2;
    const r = Math.min(element.width, element.height) / 2;
    return `
      <defs><clipPath id="${clipId}"><circle cx="${cx}" cy="${cy}" r="${r}" /></clipPath></defs>
      <image href="${escapeAttribute(element.src)}" x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" preserveAspectRatio="${preserveAspectRatio}" clip-path="url(#${clipId})" opacity="${opacity}" />
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#ffffff" stroke-width="5" opacity="${opacity}" />
    `;
  }

  return `<image href="${escapeAttribute(element.src)}" x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" preserveAspectRatio="${preserveAspectRatio}" opacity="${opacity}" />`;
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeText(value).replace(/"/g, "&quot;");
}

function clampOpacity(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(Math.max(value, 0), 1);
}
