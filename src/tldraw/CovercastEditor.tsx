'use client'

import { useEffect, useMemo, useRef } from 'react'
import { type Editor, Tldraw, type TLComponents } from 'tldraw'
import 'tldraw/tldraw.css'
import { CoverRectShapeUtil } from './shapes/CoverRectShapeUtil'
import { CoverEllipseShapeUtil } from './shapes/CoverEllipseShapeUtil'
import { CoverImageShapeUtil } from './shapes/CoverImageShapeUtil'
import { CoverTextShapeUtil } from './shapes/CoverTextShapeUtil'
import { CoverBackgroundShapeUtil } from './shapes/CoverBackgroundShapeUtil'
import { loadSceneIntoEditor } from './bridge/sceneToTldraw'
import { editorToScene } from './bridge/tldrawToScene'
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT, type Scene } from '@/domain'

const customShapeUtils = [
  CoverRectShapeUtil,
  CoverEllipseShapeUtil,
  CoverImageShapeUtil,
  CoverTextShapeUtil,
  CoverBackgroundShapeUtil,
]

export type CovercastEditorProps = {
  scene: Scene
  canvasWidth?: number
  canvasHeight?: number
  /** Resolves local-asset: srcs to blob URLs for rendering. */
  resolveSrc?: (src: string) => string
  /** Increments when blob URLs are built — triggers reload to pick up resolved srcs. */
  srcVersion?: number
  /** Called when the tldraw editor instance is ready. */
  onEditorReady?: (editor: Editor) => void
  /** Called when the user edits shapes (debounced 300ms). Receives the converted Scene. */
  onSceneChange?: (scene: Scene) => void
  /** Called when the tldraw selection changes. Receives Scene element IDs (via meta.originalId). */
  onSelectionChange?: (elementIds: string[]) => void
}

export function CovercastEditor({
  scene,
  canvasWidth = DEFAULT_CANVAS_WIDTH,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
  resolveSrc,
  srcVersion = 0,
  onEditorReady,
  onSceneChange,
  onSelectionChange,
}: CovercastEditorProps) {
  const editorRef = useRef<Editor | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const unsubRef = useRef<(() => void) | null>(null)
  const unsubSelectionRef = useRef<(() => void) | null>(null)
  // Latest resolveSrc — kept in a ref to avoid triggering useEffect on every
  // render. srcVersion controls when reload actually happens.
  const resolveSrcRef = useRef(resolveSrc)
  useEffect(() => {
    resolveSrcRef.current = resolveSrc
  })
  // Prevent infinite loop: when onSceneChange updates scene state,
  // the useEffect below would reload shapes into tldraw, which would
  // trigger store.listen again. This flag breaks the cycle.
  const skipNextReloadRef = useRef(false)
  // Suppress selection callbacks during scene reload (deleting + recreating
  // shapes clears tldraw selection, which would clear SceneEditor selection)
  const isReloadingRef = useRef(false)
  // Track last selection to avoid redundant callbacks
  const lastSelectionRef = useRef<string>('')

  const components = useMemo<TLComponents>(
    () => ({
      Toolbar: null,
      StylePanel: null,
      PageMenu: null,
      ContextMenu: null,
      ActionsMenu: null,
      HelpMenu: null,
      ZoomMenu: null,
      MainMenu: null,
      Minimap: null,
      SharePanel: null,
    }),
    [],
  )

  const handleMount = (editor: Editor) => {
    editorRef.current = editor

    loadSceneIntoEditor(editor, scene, canvasWidth, canvasHeight, resolveSrcRef.current)

    // Camera constraints — lock to canvas bounds
    editor.setCameraOptions({
      constraints: {
        bounds: { x: 0, y: 0, w: canvasWidth, h: canvasHeight },
        padding: { x: 40, y: 40 },
        origin: { x: 0.5, y: 0.5 },
        initialZoom: 'fit-min',
        baseZoom: 'default',
        behavior: 'inside',
      },
    })

    editor.zoomToBounds(
      { x: 0, y: 0, w: canvasWidth, h: canvasHeight },
      { animation: { duration: 0 } },
    )

    onEditorReady?.(editor)

    // Set up store listener for scene auto-sync
    if (onSceneChange) {
      unsubRef.current = editor.store.listen(
        () => {
          // Skip during external reload — loadSceneIntoEditor triggers
          // store changes but we don't want to sync those back
          if (isReloadingRef.current) return
          if (debounceRef.current) clearTimeout(debounceRef.current)
          debounceRef.current = setTimeout(() => {
            skipNextReloadRef.current = true
            const converted = editorToScene(editor)
            onSceneChange(converted)
          }, 300)
        },
        { source: 'user', scope: 'document' },
      )
    }

    // Set up selection listener — fires on all store changes,
    // but only calls back when the selection actually changed.
    if (onSelectionChange) {
      const checkSelection = () => {
        if (isReloadingRef.current) return // Skip during reload
        const selectedShapeIds = editor.getSelectedShapeIds()
        // Map tldraw shape IDs → Scene element IDs via meta.originalId
        const elementIds = selectedShapeIds
          .map((id) => {
            const shape = editor.getShape(id)
            const meta = shape?.meta as { originalId?: string }
            return meta?.originalId
          })
          .filter((id): id is string => !!id && id !== '__background__')

        const key = elementIds.join(',')
        if (key !== lastSelectionRef.current) {
          lastSelectionRef.current = key
          onSelectionChange(elementIds)
        }
      }

      // Listen to session scope (includes selection state changes)
      unsubSelectionRef.current = editor.store.listen(() => checkSelection(), {
        source: 'user',
        scope: 'session',
      })
    }
  }

  // Reload scene when it changes externally (template switch, add element, etc.)
  // Skips reload when the change originated from tldraw (via onSceneChange)
  // Preserves selection across reload by suppressing callbacks + re-selecting
  useEffect(() => {
    if (skipNextReloadRef.current) {
      skipNextReloadRef.current = false
      return
    }
    const editor = editorRef.current
    if (!editor) return

    // Capture current selection (element IDs) before reload
    const selectedElementIds = editor
      .getSelectedShapeIds()
      .map((id) => {
        const shape = editor.getShape(id)
        const meta = shape?.meta as { originalId?: string }
        return meta?.originalId
      })
      .filter((id): id is string => !!id && id !== '__background__')

    // Clear any pending debounce from user edits before reload
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }

    // Suppress selection + scene sync callbacks during reload
    isReloadingRef.current = true
    loadSceneIntoEditor(editor, scene, canvasWidth, canvasHeight, resolveSrcRef.current)

    // Re-select shapes by matching originalId
    if (selectedElementIds.length > 0) {
      const shapesToSelect = editor
        .getCurrentPageShapes()
        .filter((s) => {
          if (s.type === 'cover-background') return false
          const meta = s.meta as { originalId?: string }
          return meta?.originalId && selectedElementIds.includes(meta.originalId)
        })
        .map((s) => s.id)
      if (shapesToSelect.length > 0) {
        editor.setSelectedShapes(shapesToSelect)
      }
    }
    isReloadingRef.current = false
  }, [scene, canvasWidth, canvasHeight, srcVersion])

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      unsubRef.current?.()
      unsubSelectionRef.current?.()
    }
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Tldraw shapeUtils={customShapeUtils} components={components} onMount={handleMount} />
    </div>
  )
}
