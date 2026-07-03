import type { Scene } from '../types'
import {
  readStoredScene,
  writeStoredScene,
  readSceneBySlot,
  writeSceneBySlot,
  deleteSceneSlot,
  listAllSlots,
} from '../lib/storage'

export async function loadScene(templateId?: string, slotId?: string): Promise<Scene> {
  if (templateId && slotId) {
    return readSceneBySlot(templateId, slotId)
  }
  return readStoredScene()
}

export async function saveScene(scene: Scene, templateId?: string, slotId?: string): Promise<void> {
  if (templateId && slotId) {
    return writeSceneBySlot(templateId, slotId, scene)
  }
  return writeStoredScene(scene)
}

export async function removeSceneSlot(templateId: string, slotId: string): Promise<void> {
  return deleteSceneSlot(templateId, slotId)
}

export async function listAllSceneSlots(): Promise<{ templateId: string; slots: string[] }[]> {
  return listAllSlots()
}
