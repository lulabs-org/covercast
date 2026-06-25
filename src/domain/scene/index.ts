// Types
export {
  type TextAlign,
  type ImageFit,
  type ImageShape,
  type ShapeFillMode,
  type GradientDirection,
  type ShapeGradient,
  type TextElement,
  type ShapeElement,
  type ImageElement,
  type SceneElement,
  type Scene,
  type SceneTemplate,
  isTextElement,
  isShapeElement,
  isImageElement,
} from './types'

// Factories
export {
  createTextElement,
  createRectElement,
  createEllipseElement,
  createImageElement,
} from './factories'

// Defaults
export {
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_CANVAS_HEIGHT,
  BUILT_IN_TEMPLATES,
  DEFAULT_TEMPLATE_ID,
  createDefaultScene,
  createSceneFromTemplate,
  cloneScene,
  createEmptyScene,
} from './defaults'

// Operations (scene 纯变换)
export {
  patchElementById,
  toggleElementHidden,
  toggleElementLocked,
  moveElementLayer,
  addElement,
  deleteElementsByIds,
} from './operations'

// Font family (re-export for convenience)
export { DEFAULT_FONT_FAMILY } from '@/config/fonts'
