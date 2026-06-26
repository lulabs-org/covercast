/**
 * 键盘快捷键领域 (Keyboard Shortcuts Domain)
 *
 * 把 useEditorShortcuts 的 arrow-key 移动逻辑抽出为纯函数。
 * - `getArrowKeyDelta`:arrow-key → {dx, dy} 映射(支持 shift 加速)
 * - `moveElementsByDelta`:按 delta 平移选中的元素,返回新 scene 与被移动的元素
 *
 * 不依赖 React、不调用 setState——这些副作用由 useEditorShortcuts hook 编排。
 * 不依赖 DOM——`isEditableTarget` / `isCopyPasteModifier` 留在 hook(它们检查 event.target / modifier 键)。
 */

import { type Scene, type SceneElement } from './types'

/** arrow-key 移动时的基础步长 */
const ARROW_KEY_STEP = 1

/** 按住 shift 时的加速步长 */
const ARROW_KEY_SHIFT_STEP = 10

/**
 * 把 arrow-key 事件转换为位移 delta。
 * - ArrowUp/Down/Left/Right → 对应方向的 {dx, dy}
 * - shift 按住时步长为 10,否则为 1
 * - 非 arrow-key 返回 null
 */
export function getArrowKeyDelta(
  key: string,
  shiftKey: boolean,
): { dx: number; dy: number } | null {
  const step = shiftKey ? ARROW_KEY_SHIFT_STEP : ARROW_KEY_STEP

  switch (key) {
    case 'ArrowUp':
      return { dx: 0, dy: -step }
    case 'ArrowDown':
      return { dx: 0, dy: step }
    case 'ArrowLeft':
      return { dx: -step, dy: 0 }
    case 'ArrowRight':
      return { dx: step, dy: 0 }
    default:
      return null
  }
}

/**
 * 按 delta 平移选中的元素(跳过 locked 元素)。
 * 返回新 scene 与被移动的元素列表(用于后续 guide 计算)。
 */
export function moveElementsByDelta(
  scene: Scene,
  selectedIds: readonly string[],
  dx: number,
  dy: number,
): { scene: Scene; movedElements: SceneElement[] } {
  const selectedSet = new Set(selectedIds)

  const updatedElements = scene.elements.map((element) => {
    if (!selectedSet.has(element.id) || element.locked) {
      return element
    }

    return {
      ...element,
      x: element.x + dx,
      y: element.y + dy,
    } as SceneElement
  })

  const movedElements = updatedElements.filter((el) => selectedSet.has(el.id) && !el.locked)

  return {
    scene: { ...scene, elements: updatedElements },
    movedElements,
  }
}
