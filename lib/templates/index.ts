import type { SceneTemplate } from '../domain/scene'
import { cloneScene } from '../domain/scene'
import type { Scene } from '../domain/scene'
import { emptyScene } from './empty-scene'
import { dualCourseScene } from './dual-course'
import { soloInterviewScene } from './solo-interview'
import { roundtableScene } from './roundtable'
import { launchPosterScene } from './launch-poster'
import { courseSprintScene } from './course-sprint'

export const DEFAULT_TEMPLATE_ID = 'dual-course'

export const BUILT_IN_TEMPLATES = [
  {
    id: 'empty',
    name: '空白封面',
    description: '从空白画布开始创作',
    scene: emptyScene,
  },
  {
    id: DEFAULT_TEMPLATE_ID,
    name: '双讲师课程',
    description: '双人连麦课程直播背景',
    scene: dualCourseScene,
  },
  {
    id: 'solo-interview',
    name: '单人访谈',
    description: '单人开播、公开课、访谈',
    scene: soloInterviewScene,
  },
  {
    id: 'roundtable',
    name: '三人圆桌',
    description: '三人连麦讨论场景',
    scene: roundtableScene,
  },
  {
    id: 'launch-poster',
    name: '发布会海报',
    description: '新课发布、活动预告',
    scene: launchPosterScene,
  },
  {
    id: 'course-sprint',
    name: '训练营直播',
    description: '课程训练营与实战营',
    scene: courseSprintScene,
  },
] satisfies SceneTemplate[]

export { emptyScene } from './empty-scene'
export { dualCourseScene } from './dual-course'
export { soloInterviewScene } from './solo-interview'
export { roundtableScene } from './roundtable'
export { launchPosterScene } from './launch-poster'
export { courseSprintScene } from './course-sprint'

export function createDefaultScene(): Scene {
  return createSceneFromTemplate(DEFAULT_TEMPLATE_ID)
}

export function createSceneFromTemplate(templateId: string): Scene {
  const template =
    BUILT_IN_TEMPLATES.find((item) => item.id === templateId) ?? BUILT_IN_TEMPLATES[0]

  return cloneScene(template.scene)
}

export function createEmptyScene(): Scene {
  return cloneScene(emptyScene)
}
