import type { CustomSceneTemplate } from '@/stores/useTemplateStore'

export function makeUniqueTemplateName(name: string, templates: CustomSceneTemplate[]): string {
  const baseName = name.trim() || '导入模板'
  const existingNames = new Set(templates.map((t) => t.name))
  if (!existingNames.has(baseName)) return baseName
  let suffix = 2
  let candidate = `${baseName} ${suffix}`
  while (existingNames.has(candidate)) {
    suffix++
    candidate = `${baseName} ${suffix}`
  }
  return candidate
}
