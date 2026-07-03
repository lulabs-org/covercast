import type { SceneElement } from './element'

export type Scene = {
  version: 1
  backgroundColor: string
  backgroundOpacity: number
  elements: SceneElement[]
}
