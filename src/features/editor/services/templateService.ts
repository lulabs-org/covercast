import type { Scene } from '../types'
import { cloneScene } from '../models'

const CUSTOM_TEMPLATE_STORAGE_KEY = 'covercast.customTemplates.v1'
const TEMPLATE_EXPORT_FORMAT = 'covercast.template'

export type CustomSceneTemplate = {
  id: string
  name: string
  createdAt: string
  updatedAt?: string
  scene: Scene
}

export type TemplateExportPayload = {
  format: typeof TEMPLATE_EXPORT_FORMAT
  version: 1
  template: CustomSceneTemplate
}

export function readCustomTemplatesFromStorage(): CustomSceneTemplate[] {
  try {
    const rawValue = window.localStorage.getItem(CUSTOM_TEMPLATE_STORAGE_KEY)
    if (!rawValue) {
      return []
    }

    const parsedValue = JSON.parse(rawValue) as unknown
    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue
      .map(normalizeCustomTemplate)
      .filter((template): template is CustomSceneTemplate => template !== null)
  } catch {
    return []
  }
}

export function writeCustomTemplatesToStorage(templates: CustomSceneTemplate[]): void {
  window.localStorage.setItem(CUSTOM_TEMPLATE_STORAGE_KEY, JSON.stringify(templates))
}

export function createCustomTemplate(name: string, scene: Scene): CustomSceneTemplate {
  const timestamp = new Date().toISOString()
  return {
    id: createCustomTemplateId(),
    name: name.trim() || `自定义模板`,
    createdAt: timestamp,
    updatedAt: timestamp,
    scene: cloneScene(scene),
  }
}

export function updateCustomTemplate(
  template: CustomSceneTemplate,
  updates: Partial<Pick<CustomSceneTemplate, 'name' | 'scene'>>,
): CustomSceneTemplate {
  return {
    ...template,
    ...updates,
    name: updates.name?.trim() || template.name,
    updatedAt: new Date().toISOString(),
    scene: updates.scene ? cloneScene(updates.scene) : template.scene,
  }
}

export function duplicateCustomTemplate(
  template: CustomSceneTemplate,
  existingTemplates: CustomSceneTemplate[],
): CustomSceneTemplate {
  const baseName = `${template.name} 副本`
  const uniqueName = generateUniqueName(baseName, existingTemplates)

  return createCustomTemplate(uniqueName, template.scene)
}

export function createTemplateExportPayload(name: string, scene: Scene): TemplateExportPayload {
  const template = createCustomTemplate(name, scene)

  return {
    format: TEMPLATE_EXPORT_FORMAT,
    version: 1,
    template,
  }
}

export function normalizeTemplateExportPayload(value: unknown): CustomSceneTemplate | null {
  if (!isRecord(value) || value.format !== TEMPLATE_EXPORT_FORMAT || value.version !== 1) {
    return null
  }

  return normalizeCustomTemplate(value.template)
}

function normalizeCustomTemplate(value: unknown): CustomSceneTemplate | null {
  if (!isRecord(value) || !isScene(value.scene)) {
    return null
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.createdAt !== 'string'
  ) {
    return null
  }

  return {
    id: value.id,
    name: value.name,
    createdAt: value.createdAt,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : undefined,
    scene: cloneScene(value.scene),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function isScene(value: unknown): value is Scene {
  if (!isRecord(value)) {
    return false
  }

  return (
    value.version === 1 &&
    typeof value.backgroundColor === 'string' &&
    typeof value.backgroundOpacity === 'number' &&
    Array.isArray(value.elements)
  )
}

function createCustomTemplateId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function generateUniqueName(baseName: string, templates: CustomSceneTemplate[]): string {
  const existingNames = new Set(templates.map((t) => t.name))

  if (!existingNames.has(baseName)) {
    return baseName
  }

  let suffix = 2
  let candidate = `${baseName} ${suffix}`

  while (existingNames.has(candidate)) {
    suffix += 1
    candidate = `${baseName} ${suffix}`
  }

  return candidate
}
