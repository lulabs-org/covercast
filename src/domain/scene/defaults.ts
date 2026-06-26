import type { Scene } from './types'
import { BUILT_IN_TEMPLATES, DEFAULT_TEMPLATE_ID } from './templates'

// 画布尺寸常量 SSOT 在 domain/canvas/,不再在此 re-export 以避免重复导出冲突。

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
