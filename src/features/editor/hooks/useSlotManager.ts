import { useState, useEffect, useRef } from 'react'
import { BUILT_IN_TEMPLATES, createDefaultScene } from '../lib/scene'
import { type SceneSlotInfo, type CustomSceneTemplate } from './useTemplateManager'

const SLOT_NAMES_STORAGE_KEY = 'covercast.slotNames.v1'

function readSlotNamesFromStorage(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(SLOT_NAMES_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

function writeSlotNameToStorage(templateId: string, slotId: string, name: string) {
  const names = readSlotNamesFromStorage()
  names[`${templateId}/${slotId}`] = name
  window.localStorage.setItem(SLOT_NAMES_STORAGE_KEY, JSON.stringify(names))
}

function removeSlotNameFromStorage(templateId: string, slotId: string) {
  const names = readSlotNamesFromStorage()
  delete names[`${templateId}/${slotId}`]
  window.localStorage.setItem(SLOT_NAMES_STORAGE_KEY, JSON.stringify(names))
}

type UseSlotManagerOptions = {
  setStatus: (status: string) => void
  appOrigin: string
}

export function useSlotManager(options: UseSlotManagerOptions) {
  const { setStatus, appOrigin } = options

  const [activeSlotId, setActiveSlotId] = useState<string>('default')
  const [templateSlots, setTemplateSlots] = useState<SceneSlotInfo[]>([])
  const customTemplatesRef = useRef<CustomSceneTemplate[]>([])

  useEffect(() => {
    let active = true

    async function loadSlots() {
      try {
        const response = await fetch('/api/scene?list=1', { cache: 'no-store' })
        if (!response.ok) return

        const allSlots = (await response.json()) as { templateId: string; slots: string[] }[]
        if (!active) return

        const slotNames = readSlotNamesFromStorage()
        const currentSlots: SceneSlotInfo[] = []

        for (const entry of allSlots) {
          for (const slotId of entry.slots) {
            currentSlots.push({
              templateId: entry.templateId,
              slotId,
              name: slotNames[`${entry.templateId}/${slotId}`] ?? slotId,
            })
          }
        }

        setTemplateSlots(currentSlots)
      } catch {
        // slots will remain empty, user can add manually
      }
    }

    void loadSlots()

    return () => {
      active = false
    }
  }, [])

  function getSlotUrl(templateId: string, slotId: string) {
    const origin = appOrigin || ''
    return `${origin}/live?t=${encodeURIComponent(templateId)}&s=${encodeURIComponent(slotId)}`
  }

  async function addSlot(templateId: string) {
    const slotId = `slot-${Date.now()}`
    const template =
      BUILT_IN_TEMPLATES.find((t) => t.id === templateId) ??
      customTemplatesRef.current.find((t) => t.id === templateId)
    const defaultScene = template?.scene ?? createDefaultScene()

    try {
      await fetch('/api/scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          slotId,
          scene: defaultScene,
        }),
      })

      const templateName = template?.name ?? '未命名模板'
      const name = `${templateName} - 源 ${templateSlots.length + 1}`
      writeSlotNameToStorage(templateId, slotId, name)

      const newSlot: SceneSlotInfo = {
        templateId,
        slotId,
        name,
      }

      setTemplateSlots((prev) => [...prev, newSlot])
      setActiveSlotId(slotId)
      setStatus(`已创建浏览器源「${name}」`)
    } catch {
      setStatus('创建浏览器源失败')
    }
  }

  async function removeSlot(templateId: string, slotId: string) {
    removeSlotNameFromStorage(templateId, slotId)

    try {
      const response = await fetch('/api/scene', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, slotId }),
      })

      if (response.ok) {
        setTemplateSlots((prev) =>
          prev.filter((s) => !(s.templateId === templateId && s.slotId === slotId)),
        )

        if (activeSlotId === slotId) {
          const remaining = templateSlots.filter(
            (s) => !(s.templateId === templateId && s.slotId === slotId),
          )
          const nextSlotId = remaining[0]?.slotId ?? 'default'
          setActiveSlotId(nextSlotId)
        }
      }
    } catch {
      setStatus('删除浏览器源失败')
    }
  }

  function selectSlotForEditing(slotId: string) {
    setActiveSlotId(slotId)
  }

  return {
    templateSlots,
    activeSlotId,
    setActiveSlotId,
    setTemplateSlots,
    customTemplatesRef,
    addSlot,
    removeSlot,
    selectSlotForEditing,
    getSlotUrl,
    writeSlotNameToStorage,
  }
}
