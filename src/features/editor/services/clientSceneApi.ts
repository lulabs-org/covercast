import type { Scene } from '../types'

export async function fetchScene(templateId?: string, slotId?: string): Promise<Scene> {
  const params = new URLSearchParams()
  if (templateId) params.set('t', templateId)
  if (slotId) params.set('s', slotId)

  const response = await fetch(`/api/scene?${params.toString()}`, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error('Scene request failed')
  }
  return response.json() as Promise<Scene>
}

export async function fetchAllSceneSlots(): Promise<{ templateId: string; slots: string[] }[]> {
  const response = await fetch('/api/scene?list=1', { cache: 'no-store' })
  if (!response.ok) {
    throw new Error('Failed to list scene slots')
  }
  return response.json() as Promise<{ templateId: string; slots: string[] }[]>
}

export async function postScene(scene: Scene, templateId?: string, slotId?: string): Promise<void> {
  const response = await fetch('/api/scene', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ templateId, slotId, scene }),
  })
  if (!response.ok) {
    throw new Error('Failed to save scene')
  }
}

export async function deleteSceneSlotApi(templateId: string, slotId: string): Promise<void> {
  const response = await fetch('/api/scene', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ templateId, slotId }),
  })
  if (!response.ok) {
    throw new Error('Failed to delete scene slot')
  }
}
