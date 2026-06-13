import { useEffect } from 'react'
import { type Scene } from '@/lib/domain/scene'
import { BUILT_IN_TEMPLATES } from '@/lib/templates'
import { selectSingle } from '@/lib/domain/selection'
import { useEditorStore } from '@/stores/useEditorStore'

export function useSceneLoader({
  setStatus,
  setActiveTemplateId,
}: {
  setStatus: (status: string) => void
  setActiveTemplateId: (id: string) => void
}) {
  // ── 直接从 store 获取 setter（消除双写） ──
  const setScene = useEditorStore((s) => s.setScene)
  const setSelection = useEditorStore((s) => s.setSelection)

  useEffect(() => {
    let active = true

    async function loadScene() {
      try {
        const response = await fetch('/api/scene', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('Scene request failed')
        }

        const nextScene = (await response.json()) as Scene
        if (active) {
          setScene(nextScene)
          setStatus('已读取本地场景')
          const matchingTemplateId =
            BUILT_IN_TEMPLATES.find(
              (template) => JSON.stringify(template.scene) === JSON.stringify(nextScene),
            )?.id ?? ''
          setActiveTemplateId(matchingTemplateId)
          if (nextScene.elements[0]?.id) {
            setSelection((prev) => selectSingle(prev, nextScene.elements[0].id))
          }
        }
      } catch {
        if (active) {
          setStatus('使用默认模板，保存后会写入本地场景')
        }
      }
    }

    void loadScene()

    return () => {
      active = false
    }
  }, [setScene, setSelection, setStatus, setActiveTemplateId])
}
