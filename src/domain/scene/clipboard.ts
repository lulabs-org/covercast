/**
 * 剪贴板领域 (Clipboard Domain)
 *
 * 粘贴元素的纯变换:克隆源元素、生成新 id、去重命名、按 offset 平移并夹取到画布边界内。
 * 不依赖 React、不调用 changeScene——这些副作用由 useClipboard hook 编排。
 */

import type { SceneElement } from './types'
import { uniqueName } from '../template'
import { clamp } from '@/shared/lib'

/** 粘贴元素时画布边界的留白(元素至少 24px 留在画布内) */
const PASTE_EDGE_MARGIN = 24

/**
 * 深拷贝场景元素(通过 JSON 序列化,与 cloneScene 同策略)。
 */
export function cloneSceneElement(element: SceneElement): SceneElement {
  return JSON.parse(JSON.stringify(element)) as SceneElement
}

/**
 * 生成场景元素 id。非纯函数(含 Date.now + Math.random),
 * 但作为 id 生成器,不影响粘贴变换的可测性——测试时可注入 id。
 */
export function createSceneElementId(type: SceneElement['type']): string {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * 在已有元素名称集合中找出不冲突的元素名。
 * 复用 domain/template.ts 的 uniqueName 算法,消除双份拷贝。
 */
export function uniqueSceneElementName(name: string, elements: SceneElement[]): string {
  const existingNames = new Set(elements.map((element) => element.name))
  return uniqueName(name, existingNames)
}

/**
 * 构建粘贴后的新元素:
 * - 深拷贝源元素(避免共享引用)
 * - 生成新 id
 * - 名称加" 副本"后缀并去重
 * - 按 (offsetX, offsetY) 平移
 * - 用 clamp 夹取到画布边界内(元素至少 PASTE_EDGE_MARGIN 像素留在画布内)
 */
export function createPastedSceneElement(
  element: SceneElement,
  elements: SceneElement[],
  offsetX: number,
  offsetY: number,
  canvasWidth: number,
  canvasHeight: number,
): SceneElement {
  return {
    ...cloneSceneElement(element),
    id: createSceneElementId(element.type),
    name: uniqueSceneElementName(`${element.name} 副本`, elements),
    x: clamp(
      element.x + offsetX,
      -element.width + PASTE_EDGE_MARGIN,
      canvasWidth - PASTE_EDGE_MARGIN,
    ),
    y: clamp(
      element.y + offsetY,
      -element.height + PASTE_EDGE_MARGIN,
      canvasHeight - PASTE_EDGE_MARGIN,
    ),
  } as SceneElement
}
