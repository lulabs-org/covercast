/**
 * @file Scene defaults and factory helpers.
 *
 * Centralizes canvas dimension constants, re-exports built-in template
 * identifiers, and provides factory functions for creating new scenes
 * (default, template-based, empty, or deep-cloned copies).
 */

import type { Scene } from './types'
import { BUILT_IN_TEMPLATES, DEFAULT_TEMPLATE_ID } from './templates'

// 画布尺寸常量已迁至 domain/canvas-size.ts,此处仅作向后兼容 re-export。
// 新代码请直接从 @/domain/canvas-size 导入。
export { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from '../canvas-size'

export { BUILT_IN_TEMPLATES, DEFAULT_TEMPLATE_ID }

/**
 * Creates a new scene using the default built-in template.
 * @returns A deep-cloned `Scene` instance based on `DEFAULT_TEMPLATE_ID`.
 */
export function createDefaultScene(): Scene {
  return createSceneFromTemplate(DEFAULT_TEMPLATE_ID)
}

/**
 * Creates a scene from a built-in template identified by `templateId`.
 * Falls back to the first available template when the id is not found.
 * @param templateId - The id of the built-in template to use.
 * @returns A deep-cloned `Scene` instance built from the matched template.
 */
export function createSceneFromTemplate(templateId: string): Scene {
  const template =
    BUILT_IN_TEMPLATES.find((item) => item.id === templateId) ?? BUILT_IN_TEMPLATES[0]

  return cloneScene(template.scene)
}

/**
 * Produces a deep copy of the given scene via JSON serialization.
 * Ensures consumers cannot mutate shared template state.
 * @param scene - The scene to clone.
 * @returns A structurally independent copy of the input scene.
 */
export function cloneScene(scene: Scene): Scene {
  return JSON.parse(JSON.stringify(scene)) as Scene
}

/**
 * Creates a blank scene using the built-in `'empty'` template.
 * @returns A deep-cloned empty `Scene` instance.
 */
export function createEmptyScene(): Scene {
  return createSceneFromTemplate('empty')
}
