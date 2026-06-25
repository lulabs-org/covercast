import type { Scene } from './types'
import { BUILT_IN_TEMPLATES, DEFAULT_TEMPLATE_ID } from './templates'

// 画布尺寸常量已迁至 domain/canvas-size.ts,此处仅作向后兼容 re-export。
// 新代码请直接从 @/domain/canvas-size 导入。
export { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from '../canvas-size'

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
