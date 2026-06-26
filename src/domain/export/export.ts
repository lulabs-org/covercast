/**
 * @file Scene-to-SVG serialization.
 *
 * Converts a `Scene` instance into a standalone SVG markup string suitable
 * for OBS live backgrounds and image export. Handles defs (gradients, masks,
 * filters), background rendering with cutout masks, and per-element rendering
 * for text, shape, and image elements. All string values are escaped to keep
 * the produced SVG well-formed.
 */

import { DEFAULT_CANVAS_HEIGHT, DEFAULT_CANVAS_WIDTH } from '../canvas'
import {
  type ImageElement,
  type Scene,
  type SceneElement,
  type ShapeElement,
  type TextAlign,
  type TextElement,
} from '../scene'

/**
 * Resolves a paint token (e.g. `'courseGradient'`) to an SVG `url(#...)` reference,
 * returning the literal value unchanged when it is a plain color.
 * @param fill - The paint value to resolve.
 * @param prefix - Id prefix used for SVG gradient defs. Defaults to `'covercast'`.
 * @returns The resolved SVG paint value.
 */
export function resolvePaint(fill: string, prefix = 'covercast'): string {
  if (fill === 'courseGradient') {
    return `url(#${prefix}-course-gradient)`
  }

  if (fill === 'accentGradient') {
    return `url(#${prefix}-accent-gradient)`
  }

  return fill
}

/**
 * Maps a text alignment value to the corresponding SVG `text-anchor` keyword.
 * @param align - The alignment to convert.
 * @returns `'start'`, `'middle'`, or `'end'`.
 */
export function textAnchorForAlign(align: TextAlign): 'start' | 'middle' | 'end' {
  if (align === 'center') {
    return 'middle'
  }

  if (align === 'right') {
    return 'end'
  }

  return 'start'
}

/**
 * Computes the SVG `x` coordinate for a text element based on its alignment.
 * @param element - The text element to compute the anchor x for.
 * @returns The x position the `<text>` tag should use.
 */
export function textX(element: TextElement): number {
  if (element.align === 'center') {
    return element.x + element.width / 2
  }

  if (element.align === 'right') {
    return element.x + element.width
  }

  return element.x
}

/**
 * Returns the bounding rect of an arbitrary scene element.
 * @param element - The element to measure.
 * @returns An object with `x`, `y`, `width`, and `height` properties.
 */
export function elementBounds(element: SceneElement) {
  return {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
  }
}

/**
 * Serializes a `Scene` into a complete SVG markup string.
 * Hidden elements are filtered out before rendering.
 * @param scene - The scene to serialize.
 * @param canvasWidth - Output SVG width. Defaults to `DEFAULT_CANVAS_WIDTH`.
 * @param canvasHeight - Output SVG height. Defaults to `DEFAULT_CANVAS_HEIGHT`.
 * @returns A self-contained `<svg>...</svg>` string.
 */
export function sceneToSvgMarkup(
  scene: Scene,
  canvasWidth = DEFAULT_CANVAS_WIDTH,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
): string {
  const visibleElements = scene.elements.filter((element) => element.hidden !== true)
  const visibleScene = { ...scene, elements: visibleElements }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}" role="img" aria-label="Covercast OBS live background">`,
    renderDefs('covercast', visibleScene),
    renderBackground(
      scene.backgroundColor,
      scene.backgroundOpacity,
      'covercast',
      visibleScene,
      canvasWidth,
      canvasHeight,
    ),
    ...visibleElements.map((element) => renderElement(element, 'covercast')),
    '</svg>',
  ].join('')
}

/**
 * Renders the SVG `<defs>` block: built-in gradients/filters plus per-shape
 * custom gradients and the background cutout mask (when applicable).
 * @param prefix - Id prefix used for all defs ids.
 * @param scene - Optional scene used to discover gradient/cutout shapes.
 * @returns The `<defs>...</defs>` markup string.
 */
export function renderDefs(prefix: string, scene?: Scene): string {
  const customGradients =
    scene?.elements
      .filter((element) => element.hidden !== true)
      .filter(
        (
          element,
        ): element is ShapeElement & {
          gradient: NonNullable<ShapeElement['gradient']>
        } => isGradientShape(element),
      )
      .map((element) => renderShapeGradient(element, prefix))
      .join('') ?? ''
  const backgroundMask = renderBackgroundMask(prefix, scene)

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
      ${backgroundMask}
    </defs>
  `
}

/**
 * Renders the scene background: a solid color rect overlaid with a radial glow.
 * When the scene contains background-cutout shapes, the group is masked so those
 * areas become transparent.
 * @param backgroundColor - CSS color for the base rect.
 * @param backgroundOpacity - Opacity (0–1) of the background. Defaults to `1`.
 * @param prefix - Id prefix for referenced mask/gradient ids. Defaults to `'covercast'`.
 * @param scene - Optional scene used to detect background cutouts.
 * @param canvasWidth - Background rect width. Defaults to `DEFAULT_CANVAS_WIDTH`.
 * @param canvasHeight - Background rect height. Defaults to `DEFAULT_CANVAS_HEIGHT`.
 * @returns The background `<g>...</g>` markup string.
 */
export function renderBackground(
  backgroundColor: string,
  backgroundOpacity = 1,
  prefix = 'covercast',
  scene?: Scene,
  canvasWidth = DEFAULT_CANVAS_WIDTH,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
): string {
  const opacity = clampOpacity(backgroundOpacity)
  const glowOpacity = Number((0.68 * opacity).toFixed(3))
  const mask = hasBackgroundCutouts(scene) ? ` mask="url(#${backgroundMaskId(prefix)})"` : ''

  return `
    <g${mask}>
      <rect width="${canvasWidth}" height="${canvasHeight}" fill="${escapeAttribute(backgroundColor)}" opacity="${opacity}" />
      <rect width="${canvasWidth}" height="${canvasHeight}" fill="url(#${prefix}-bg-glow)" opacity="${glowOpacity}" />
    </g>
  `
}

/** Dispatches an element to its dedicated renderer based on its `type`. */
function renderElement(element: SceneElement, prefix: string): string {
  if (element.type === 'text') {
    return renderTextElement(element)
  }

  if (element.type === 'image') {
    return renderImageElement(element, prefix)
  }

  return renderShapeElement(element, prefix)
}

/** Renders a shape element as an SVG `<rect>` or `<ellipse>` with fill, stroke, and opacity. */
function renderShapeElement(element: ShapeElement, prefix: string): string {
  const opacity = element.opacity ?? 1
  const fill = element.backgroundCutout
    ? 'transparent'
    : escapeAttribute(resolveShapeFill(element, prefix))
  const common = `fill="${fill}" opacity="${element.backgroundCutout ? 1 : opacity}"`
  const stroke = element.stroke
    ? ` stroke="${escapeAttribute(element.stroke)}" stroke-width="${element.strokeWidth ?? 1}"`
    : ''

  if (element.type === 'ellipse') {
    return `<ellipse cx="${element.x + element.width / 2}" cy="${element.y + element.height / 2}" rx="${element.width / 2}" ry="${element.height / 2}" ${common}${stroke} />`
  }

  return `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" rx="${element.radius ?? 0}" ${common}${stroke} />`
}

/** Resolves the SVG fill value for a shape: a per-shape gradient reference or a paint token. */
function resolveShapeFill(element: ShapeElement, prefix: string): string {
  if (isGradientShape(element)) {
    return `url(#${shapeGradientId(prefix, element.id)})`
  }

  return resolvePaint(element.fill, prefix)
}

/** Renders an SVG `<linearGradient>` definition for a shape's custom gradient. */
function renderShapeGradient(
  element: ShapeElement & { gradient: NonNullable<ShapeElement['gradient']> },
  prefix: string,
): string {
  const gradient = element.gradient
  const vector = gradientVector(gradient.direction)

  return `
    <linearGradient id="${shapeGradientId(prefix, element.id)}" x1="${vector.x1}" y1="${vector.y1}" x2="${vector.x2}" y2="${vector.y2}">
      <stop offset="0%" stop-color="${escapeAttribute(gradient.startColor)}" />
      <stop offset="100%" stop-color="${escapeAttribute(gradient.endColor)}" />
    </linearGradient>
  `
}

/** Type guard: returns `true` when the element is a visible shape using gradient fill mode. */
function isGradientShape(element: SceneElement): element is ShapeElement & {
  gradient: NonNullable<ShapeElement['gradient']>
} {
  return (
    (element.type === 'rect' || element.type === 'ellipse') &&
    element.hidden !== true &&
    element.fillMode === 'gradient' &&
    Boolean(element.gradient)
  )
}

function shapeGradientId(prefix: string, elementId: string): string {
  return `${prefix}-shape-gradient-${elementId}`
}

/** Builds the SVG `<mask>` used to cut holes in the background for cutout shapes. */
function renderBackgroundMask(
  prefix: string,
  scene?: Scene,
  canvasWidth = DEFAULT_CANVAS_WIDTH,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
): string {
  const cutouts =
    scene?.elements
      .filter((element) => element.hidden !== true)
      .filter((element): element is ShapeElement => isBackgroundCutoutShape(element))
      .map(renderCutoutMaskShape)
      .join('') ?? ''

  if (!cutouts) {
    return ''
  }

  return `
    <mask id="${backgroundMaskId(prefix)}" maskUnits="userSpaceOnUse">
      <rect width="${canvasWidth}" height="${canvasHeight}" fill="#ffffff" />
      ${cutouts}
    </mask>
  `
}

/** Renders the black shape used to punch a hole inside the background mask. */
function renderCutoutMaskShape(element: ShapeElement): string {
  if (element.type === 'ellipse') {
    return `<ellipse cx="${element.x + element.width / 2}" cy="${element.y + element.height / 2}" rx="${element.width / 2}" ry="${element.height / 2}" fill="#000000" />`
  }

  return `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" rx="${element.radius ?? 0}" fill="#000000" />`
}

/** Type guard: returns `true` when the element is a visible shape marked as a background cutout. */
function isBackgroundCutoutShape(element: SceneElement): element is ShapeElement {
  return (
    (element.type === 'rect' || element.type === 'ellipse') &&
    element.hidden !== true &&
    element.backgroundCutout === true
  )
}

/** Returns `true` when the scene contains at least one background cutout shape. */
function hasBackgroundCutouts(scene?: Scene): boolean {
  return scene?.elements.some(isBackgroundCutoutShape) ?? false
}

function backgroundMaskId(prefix: string): string {
  return `${prefix}-background-mask`
}

/**
 * Returns the SVG gradient vector (x1/y1/x2/y2 percentages) for a given
 * gradient direction.
 * @param direction - The gradient direction to convert.
 * @returns An object with `x1`, `y1`, `x2`, `y2` percentage strings.
 */
export function gradientVector(direction: NonNullable<ShapeElement['gradient']>['direction']) {
  if (direction === 'vertical') {
    return { x1: '0%', y1: '0%', x2: '0%', y2: '100%' }
  }

  if (direction === 'diagonal-down') {
    return { x1: '0%', y1: '0%', x2: '100%', y2: '100%' }
  }

  if (direction === 'diagonal-up') {
    return { x1: '0%', y1: '100%', x2: '100%', y2: '0%' }
  }

  return { x1: '0%', y1: '0%', x2: '100%', y2: '0%' }
}

/** Renders a text element as an SVG `<text>` with one `<tspan>` per line. */
function renderTextElement(element: TextElement): string {
  const lines = element.text.split('\n')
  const x = textX(element)
  const anchor = textAnchorForAlign(element.align)
  const lineHeight = element.fontSize * element.lineHeight
  const tspans = lines
    .map((line, index) => {
      const dy = index === 0 ? 0 : lineHeight
      return `<tspan x="${x}" dy="${dy}">${escapeText(line || ' ')}</tspan>`
    })
    .join('')

  return `<text x="${x}" y="${element.y + element.fontSize}" fill="${escapeAttribute(element.fill)}" font-family="${escapeAttribute(element.fontFamily)}" font-size="${element.fontSize}" font-weight="${element.fontWeight}" text-anchor="${anchor}" opacity="${element.opacity ?? 1}">${tspans}</text>`
}

/**
 * Renders an image element. Falls back to a circular placeholder with initials
 * when `src` is empty; otherwise emits an `<image>` tag, optionally clipped to
 * a circle based on `element.shape`.
 */
function renderImageElement(element: ImageElement, prefix: string): string {
  const opacity = element.opacity ?? 1
  const clipId = `${prefix}-clip-${element.id}`
  const preserveAspectRatio = element.fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet'

  if (!element.src) {
    const cx = element.x + element.width / 2
    const cy = element.y + element.height / 2
    const r = Math.min(element.width, element.height) / 2
    const initials = escapeText(element.fallbackText || '图')
    return `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#edf3ff" stroke="#ffffff" stroke-width="5" opacity="${opacity}" />
      <circle cx="${cx}" cy="${cy}" r="${r - 7}" fill="#87a9ff" opacity="0.36" />
      <text x="${cx}" y="${cy + r * 0.22}" text-anchor="middle" fill="#163690" font-family="PingFang SC, Microsoft YaHei, Arial, sans-serif" font-size="${r * 0.72}" font-weight="900">${initials}</text>
    `
  }

  if (element.shape === 'circle') {
    const cx = element.x + element.width / 2
    const cy = element.y + element.height / 2
    const r = Math.min(element.width, element.height) / 2
    return `
      <defs><clipPath id="${clipId}"><circle cx="${cx}" cy="${cy}" r="${r}" /></clipPath></defs>
      <image href="${escapeAttribute(element.src)}" x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" preserveAspectRatio="${preserveAspectRatio}" clip-path="url(#${clipId})" opacity="${opacity}" />
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#ffffff" stroke-width="5" opacity="${opacity}" />
    `
  }

  return `<image href="${escapeAttribute(element.src)}" x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" preserveAspectRatio="${preserveAspectRatio}" opacity="${opacity}" />`
}

/** Escapes XML-significant characters (`&`, `<`, `>`) for safe text content. */
function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Escapes a string for use inside an XML attribute (text escaping plus `"`). */
function escapeAttribute(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;')
}

/** Clamps an opacity value to the `[0, 1]` range, treating non-finite values as `1`. */
function clampOpacity(value: number): number {
  if (!Number.isFinite(value)) {
    return 1
  }

  return Math.min(Math.max(value, 0), 1)
}

// ─── 导出格式 (Export format) ──────────────────────────────────────────────

/** 场景导出格式 */
export type ExportFormat = 'png' | 'jpeg' | 'svg' | 'json'

/** 导出格式选项:扩展名 / 标签 / MIME 类型 / 值 */
export const EXPORT_FORMAT_OPTIONS: {
  extension: string
  label: string
  mimeType: string
  value: ExportFormat
}[] = [
  { extension: 'png', label: 'PNG', mimeType: 'image/png', value: 'png' },
  { extension: 'jpg', label: 'JPG', mimeType: 'image/jpeg', value: 'jpeg' },
  { extension: 'svg', label: 'SVG', mimeType: 'image/svg+xml;charset=utf-8', value: 'svg' },
  { extension: 'json', label: 'JSON', mimeType: 'application/json;charset=utf-8', value: 'json' },
]

/**
 * 按 ExportFormat 查找对应的格式选项,找不到时回退到 PNG。
 */
export function findExportFormatOption(format: ExportFormat) {
  return EXPORT_FORMAT_OPTIONS.find((option) => option.value === format) ?? EXPORT_FORMAT_OPTIONS[0]
}
