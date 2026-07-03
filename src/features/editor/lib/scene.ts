export const DEFAULT_CANVAS_WIDTH = 941
export const DEFAULT_CANVAS_HEIGHT = 1672

// Legacy constants for backward compatibility
export const CANVAS_WIDTH = DEFAULT_CANVAS_WIDTH
export const CANVAS_HEIGHT = DEFAULT_CANVAS_HEIGHT

export { DEFAULT_FONT_FAMILY } from './fonts'

export type {
  GradientDirection,
  ImageElement,
  ImageFit,
  ImageShape,
  Scene,
  SceneElement,
  SceneTemplate,
  ShapeElement,
  ShapeFillMode,
  ShapeGradient,
  TextAlign,
  TextElement,
} from '../types'

export {
  BUILT_IN_TEMPLATES,
  cloneScene,
  createDefaultScene,
  createEllipseElement,
  createEmptyScene,
  createImageElement,
  createRectElement,
  createSceneFromTemplate,
  createTextElement,
  DEFAULT_TEMPLATE_ID,
  isImageElement,
  isShapeElement,
  isTextElement,
} from '../models'
