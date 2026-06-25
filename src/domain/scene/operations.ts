/**
 * 场景操作领域 (Scene Operations Domain)
 *
 * 纯场景变换函数:接收 Scene,返回新 Scene(或带副作用信息的对象)。
 * 不依赖 React、不调用 history、不调 setSelection——这些副作用由调用方(hook)编排。
 *
 * 命名约定:
 * - `patchXxx` — 局部更新某个元素
 * - `toggleXxx` — 切换布尔属性
 * - `moveXxx` — 调整层级
 * - `addXxx` / `removeXxx` — 增删元素
 */

import type { Scene, SceneElement } from './types'

/**
 * 按 id 更新单个元素的部分属性。
 */
export function patchElementById(
  scene: Scene,
  elementId: string,
  patch: Partial<SceneElement>,
): Scene {
  return {
    ...scene,
    elements: scene.elements.map((element) =>
      element.id === elementId ? ({ ...element, ...patch } as SceneElement) : element,
    ),
  }
}

/**
 * 切换元素显示状态。
 */
export function toggleElementHidden(scene: Scene, elementId: string): Scene {
  return {
    ...scene,
    elements: scene.elements.map((element) =>
      element.id === elementId
        ? ({ ...element, hidden: !element.hidden } as SceneElement)
        : element,
    ),
  }
}

/**
 * 切换元素锁定状态。
 */
export function toggleElementLocked(scene: Scene, elementId: string): Scene {
  return {
    ...scene,
    elements: scene.elements.map((element) =>
      element.id === elementId
        ? ({ ...element, locked: !element.locked } as SceneElement)
        : element,
    ),
  }
}

/**
 * 调整元素层级(向前/向后交换)。
 * 越界时返回原 scene。
 */
export function moveElementLayer(
  scene: Scene,
  elementId: string,
  direction: 'forward' | 'backward',
): Scene {
  const currentIndex = scene.elements.findIndex((element) => element.id === elementId)
  const nextIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1

  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= scene.elements.length) {
    return scene
  }

  const elements = [...scene.elements]
  ;[elements[currentIndex], elements[nextIndex]] = [elements[nextIndex], elements[currentIndex]]
  return { ...scene, elements }
}

/**
 * 追加元素到场景末尾。
 */
export function addElement(scene: Scene, element: SceneElement): Scene {
  return {
    ...scene,
    elements: [...scene.elements, element],
  }
}

/**
 * 按 id 集合删除元素,并返回删除后剩余元素中的第一个 id(供调用方恢复选中)。
 */
export function deleteElementsByIds(
  scene: Scene,
  ids: string[],
): { scene: Scene; firstRemainingId: string | null } {
  const idSet = new Set(ids)
  const elements = scene.elements.filter((element) => !idSet.has(element.id))
  const firstRemainingId = elements.length > 0 ? elements[0].id : null
  return { scene: { ...scene, elements }, firstRemainingId }
}
