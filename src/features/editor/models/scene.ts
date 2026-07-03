import type { ImageElement, Scene, SceneElement, ShapeElement, TextElement } from '../types'
import { BUILT_IN_TEMPLATES, DEFAULT_TEMPLATE_ID } from './templates'

export function createDefaultScene(): Scene {
  return createSceneFromTemplate(DEFAULT_TEMPLATE_ID)
}

export function createSceneFromTemplate(templateId: string): Scene {
  const template =
    BUILT_IN_TEMPLATES.find((item) => item.id === templateId) ?? BUILT_IN_TEMPLATES[0]

  return cloneScene(template.scene)
}

export function cloneScene(scene: Scene): Scene {
  return JSON.parse(JSON.stringify(scene)) as Scene
}

export function createEmptyScene(): Scene {
  return {
    version: 1,
    backgroundColor: '#1e293b',
    backgroundOpacity: 1,
    elements: [],
  }
}

export function isTextElement(element: SceneElement): element is TextElement {
  return element.type === 'text'
}

export function isShapeElement(element: SceneElement): element is ShapeElement {
  return element.type === 'rect' || element.type === 'ellipse'
}

export function isImageElement(element: SceneElement): element is ImageElement {
  return element.type === 'image'
}
