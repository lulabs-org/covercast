/**
 * 自定义模板领域 (Custom Template Domain)
 *
 * 与 `scene/templates.ts`(内置模板数据表)区分:
 * - 内置模板:静态、代码内、只读。
 * - 自定义模板:运行时构造、可被用户创建/重命名/删除、需要校验外部输入(JSON 导入)。
 *
 * 本模块只放纯逻辑:类型 + 校验器 + 工厂 + 去重命名算法。
 * localStorage 持久化、DOM 下载、React 状态由 useTemplateManager hook 编排。
 *
 * 注意:不依赖 `document` / `window` / `localStorage`,可独立单测。
 */

import { cloneScene, type Scene, type SceneElement } from '../scene'

/** 自定义模板导出文件格式标识 */
export const TEMPLATE_EXPORT_FORMAT = 'covercast.template'

/** 自定义模板实体 */
export type CustomSceneTemplate = {
  id: string
  name: string
  createdAt: string
  updatedAt?: string
  scene: Scene
}

/** 模板导出 JSON 的载荷结构 */
export type TemplateExportPayload = {
  format: typeof TEMPLATE_EXPORT_FORMAT
  version: 1
  template: CustomSceneTemplate
}

/**
 * 在已有名称集合中找出与 `desired` 不冲突的名称。
 * 冲突时追加 " 2" / " 3" / ... 后缀,直到不冲突。
 *
 * 这是元素名与模板名共用的去重算法,消除此前 useClipboard / useTemplateManager 各一份的拷贝。
 *
 * @param desired 期望名称(调用方负责 trim)
 * @param existingNames 已存在名称集合
 */
export function uniqueName(desired: string, existingNames: Set<string>): string {
  if (!existingNames.has(desired)) {
    return desired
  }

  let suffix = 2
  let candidate = `${desired} ${suffix}`

  while (existingNames.has(candidate)) {
    suffix += 1
    candidate = `${desired} ${suffix}`
  }

  return candidate
}

/**
 * 在模板列表中找出不冲突的名称。
 * 期望名称为空时回退到 `fallback`。
 */
export function uniqueTemplateName(
  name: string,
  templates: CustomSceneTemplate[],
  fallback = '导入模板',
): string {
  const baseName = name.trim() || fallback
  const existingNames = new Set(templates.map((t) => t.name))
  return uniqueName(baseName, existingNames)
}

/**
 * 生成自定义模板 id。非纯函数(含 Date.now + Math.random),
 * 但作为 id 生成器,不影响校验/去重等核心逻辑的可测性。
 */
export function createCustomTemplateId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * 构建模板导出载荷(深拷贝 scene 避免后续 mutation 影响快照)。
 */
export function createTemplateExportPayload(name: string, scene: Scene): TemplateExportPayload {
  const timestamp = new Date().toISOString()

  return {
    format: TEMPLATE_EXPORT_FORMAT,
    version: 1,
    template: {
      id: createCustomTemplateId(),
      name: name.trim() || '自定义场景',
      createdAt: timestamp,
      updatedAt: timestamp,
      scene: cloneScene(scene),
    },
  }
}

/**
 * 通过 JSON 序列化比较两个场景是否完全一致。
 * 用于检测"自定义模板相对当前 scene 是否有未保存修改"。
 */
export function scenesMatch(left: Scene, right: Scene): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

// ─── 校验器 ────────────────────────────────────────────────────────────────
// 用于校验从 localStorage / 导入 JSON 等外部来源读取的未知数据。

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

export function isScene(value: unknown): value is Scene {
  if (!isRecord(value)) {
    return false
  }

  return (
    value.version === 1 &&
    typeof value.backgroundColor === 'string' &&
    typeof value.backgroundOpacity === 'number' &&
    Array.isArray(value.elements) &&
    value.elements.every(isStoredSceneElement)
  )
}

function isStoredSceneElement(value: unknown): value is SceneElement {
  if (!isRecord(value)) {
    return false
  }

  const hasBounds =
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.x === 'number' &&
    typeof value.y === 'number' &&
    typeof value.width === 'number' &&
    typeof value.height === 'number'

  if (!hasBounds) {
    return false
  }

  if (value.type === 'text') {
    return (
      typeof value.text === 'string' &&
      typeof value.fill === 'string' &&
      typeof value.fontSize === 'number' &&
      typeof value.fontFamily === 'string' &&
      typeof value.fontWeight === 'number' &&
      (value.align === 'left' || value.align === 'center' || value.align === 'right') &&
      typeof value.lineHeight === 'number'
    )
  }

  if (value.type === 'image') {
    return (
      typeof value.src === 'string' &&
      typeof value.alt === 'string' &&
      (value.fit === 'cover' || value.fit === 'contain') &&
      (value.shape === 'rect' || value.shape === 'circle')
    )
  }

  if (value.type === 'rect' || value.type === 'ellipse') {
    return typeof value.fill === 'string'
  }

  return false
}

/**
 * 把未知值规整为自定义模板;无法规整时返回 null。
 * 规整过程中对 scene 做深拷贝,避免外部对象后续被 mutation 影响模板快照。
 */
export function normalizeCustomTemplate(value: unknown): CustomSceneTemplate | null {
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

/**
 * 把未知值规整为导出载荷中的模板;无法规整时返回 null。
 */
export function normalizeTemplateExportPayload(value: unknown): CustomSceneTemplate | null {
  if (!isRecord(value) || value.format !== TEMPLATE_EXPORT_FORMAT || value.version !== 1) {
    return null
  }

  return normalizeCustomTemplate(value.template)
}
