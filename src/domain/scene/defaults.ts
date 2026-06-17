import type { Scene } from './types'
import { BUILT_IN_TEMPLATES, DEFAULT_TEMPLATE_ID } from './templates'

export const DEFAULT_CANVAS_WIDTH = 941
export const DEFAULT_CANVAS_HEIGHT = 1672

// Legacy constants for backward compatibility
export const CANVAS_WIDTH = DEFAULT_CANVAS_WIDTH
export const CANVAS_HEIGHT = DEFAULT_CANVAS_HEIGHT

export { BUILT_IN_TEMPLATES, DEFAULT_TEMPLATE_ID }

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
  return createSceneFromTemplate('empty')
}
