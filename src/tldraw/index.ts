export { CovercastEditor } from './CovercastEditor'
export type { CovercastEditorProps } from './CovercastEditor'

// ShapeUtils
export { CoverRectShapeUtil } from './shapes/CoverRectShapeUtil'
export type { CoverRectShape, CoverRectProps } from './shapes/CoverRectShapeUtil'
export { CoverEllipseShapeUtil } from './shapes/CoverEllipseShapeUtil'
export type { CoverEllipseShape, CoverEllipseProps } from './shapes/CoverEllipseShapeUtil'
export { CoverImageShapeUtil } from './shapes/CoverImageShapeUtil'
export type { CoverImageShape, CoverImageProps } from './shapes/CoverImageShapeUtil'
export { CoverTextShapeUtil } from './shapes/CoverTextShapeUtil'
export type { CoverTextShape, CoverTextProps } from './shapes/CoverTextShapeUtil'
export { CoverBackgroundShapeUtil } from './shapes/CoverBackgroundShapeUtil'
export type { CoverBackgroundShape, CoverBackgroundProps } from './shapes/CoverBackgroundShapeUtil'

// Bridge: Scene → tldraw
export {
  sceneToTldrawShapes,
  loadSceneIntoEditor,
  createBackgroundShape,
} from './bridge/sceneToTldraw'

// Bridge: tldraw → Scene
export { editorToScene, diffScenes } from './bridge/tldrawToScene'
export type { DiffResult, DiffMismatch } from './bridge/tldrawToScene'
