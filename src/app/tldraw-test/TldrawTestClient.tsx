'use client'

import { useMemo, useState, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import SceneCanvas from '@/app/components/SceneCanvas'
import { type Scene, type ShapeElement, type ImageElement, type TextElement } from '@/domain'
import { editorToScene, diffScenes, type DiffResult } from '@/tldraw/bridge/tldrawToScene'
import type { Editor } from 'tldraw'

// Dynamic import with ssr: false — tldraw uses browser APIs
const CovercastEditor = dynamic(
  () => import('@/tldraw/CovercastEditor').then((m) => m.CovercastEditor),
  { ssr: false, loading: () => <div style={{ padding: 24 }}>Loading tldraw...</div> },
)

// ── Test scene covering all element types ────────────────────────────────────

function createTestScene(): Scene {
  const texts: TextElement[] = [
    {
      id: 'text-multiline',
      name: 'Multi-line',
      type: 'text',
      x: 50,
      y: 920,
      width: 400,
      height: 100,
      text: '播客封面\n第二行文字',
      fill: '#ffffff',
      fontSize: 36,
      fontFamily: 'PingFang SC, Microsoft YaHei, Arial, sans-serif',
      fontWeight: 800,
      align: 'center',
      lineHeight: 1.18,
    },
    {
      id: 'text-left',
      name: 'Left Align',
      type: 'text',
      x: 500,
      y: 920,
      width: 300,
      height: 50,
      text: '左对齐文字',
      fill: '#f8d84a',
      fontSize: 28,
      fontFamily: 'PingFang SC, Microsoft YaHei, Arial, sans-serif',
      fontWeight: 600,
      align: 'left',
      lineHeight: 1.2,
    },
    {
      id: 'text-right',
      name: 'Right Align',
      type: 'text',
      x: 500,
      y: 980,
      width: 300,
      height: 50,
      text: '右对齐文字',
      fill: '#7ee787',
      fontSize: 28,
      fontFamily: 'PingFang SC, Microsoft YaHei, Arial, sans-serif',
      fontWeight: 600,
      align: 'right',
      lineHeight: 1.2,
    },
    {
      id: 'text-opacity',
      name: 'Opacity Text',
      type: 'text',
      x: 50,
      y: 1040,
      width: 400,
      height: 50,
      text: '半透明文字',
      fill: '#336FFF',
      fontSize: 32,
      fontFamily: 'PingFang SC, Microsoft YaHei, Arial, sans-serif',
      fontWeight: 900,
      align: 'center',
      lineHeight: 1.18,
      opacity: 0.5,
    },
  ]

  const rects: ShapeElement[] = [
    {
      id: 'rect-solid',
      name: 'Solid',
      type: 'rect',
      x: 50,
      y: 50,
      width: 200,
      height: 120,
      fill: '#336FFF',
      fillMode: 'solid',
      stroke: '#ffffff',
      strokeWidth: 3,
      radius: 12,
      opacity: 1,
    },
    {
      id: 'rect-grad-h',
      name: 'Gradient H',
      type: 'rect',
      x: 300,
      y: 50,
      width: 200,
      height: 120,
      fill: '#ffffff',
      fillMode: 'gradient',
      gradient: { startColor: '#ffffff', endColor: '#99f19c', direction: 'horizontal' },
      radius: 12,
      opacity: 1,
    },
    {
      id: 'rect-grad-v',
      name: 'Gradient V',
      type: 'rect',
      x: 550,
      y: 50,
      width: 200,
      height: 120,
      fill: '#ffffff',
      fillMode: 'gradient',
      gradient: { startColor: '#73f08c', endColor: '#2859d7', direction: 'vertical' },
      radius: 12,
      opacity: 1,
    },
    {
      id: 'rect-cutout',
      name: 'Cutout',
      type: 'rect',
      x: 50,
      y: 220,
      width: 200,
      height: 120,
      fill: '#000000',
      fillMode: 'solid',
      backgroundCutout: true,
      stroke: '#ffffff',
      strokeWidth: 2,
      radius: 8,
      opacity: 1,
    },
    {
      id: 'rect-opacity',
      name: 'Opacity 0.5',
      type: 'rect',
      x: 300,
      y: 220,
      width: 200,
      height: 120,
      fill: '#336FFF',
      fillMode: 'solid',
      opacity: 0.5,
      radius: 16,
    },
    {
      id: 'rect-plain',
      name: 'Plain',
      type: 'rect',
      x: 550,
      y: 220,
      width: 200,
      height: 120,
      fill: '#f8d84a',
      fillMode: 'solid',
      radius: 0,
    },
    {
      id: 'rect-course',
      name: 'Course Gradient',
      type: 'rect',
      x: 50,
      y: 390,
      width: 200,
      height: 120,
      fill: 'courseGradient',
      fillMode: 'solid',
      radius: 12,
    },
    {
      id: 'rect-accent',
      name: 'Accent Gradient',
      type: 'rect',
      x: 300,
      y: 390,
      width: 200,
      height: 120,
      fill: 'accentGradient',
      fillMode: 'solid',
      radius: 12,
    },
  ]

  const ellipses: ShapeElement[] = [
    {
      id: 'ellipse-solid',
      name: 'Ellipse Solid',
      type: 'ellipse',
      x: 550,
      y: 390,
      width: 200,
      height: 120,
      fill: '#336FFF',
      fillMode: 'solid',
      stroke: '#ffffff',
      strokeWidth: 3,
      opacity: 1,
    },
    {
      id: 'ellipse-grad',
      name: 'Ellipse Gradient',
      type: 'ellipse',
      x: 50,
      y: 560,
      width: 200,
      height: 120,
      fill: '#ffffff',
      fillMode: 'gradient',
      gradient: { startColor: '#73f08c', endColor: '#2859d7', direction: 'diagonal-down' },
      opacity: 1,
    },
    {
      id: 'ellipse-cutout',
      name: 'Ellipse Cutout',
      type: 'ellipse',
      x: 300,
      y: 560,
      width: 200,
      height: 120,
      fill: '#000000',
      fillMode: 'solid',
      backgroundCutout: true,
      stroke: '#ffffff',
      strokeWidth: 2,
      opacity: 1,
    },
  ]

  const images: ImageElement[] = [
    {
      id: 'image-rect',
      name: 'Image Rect',
      type: 'image',
      x: 550,
      y: 560,
      width: 200,
      height: 120,
      src: '/covercast-logo.png',
      alt: 'Logo',
      fit: 'cover',
      shape: 'rect',
      opacity: 1,
    },
    {
      id: 'image-circle',
      name: 'Image Circle',
      type: 'image',
      x: 50,
      y: 730,
      width: 120,
      height: 120,
      src: '/covercast-logo.png',
      alt: 'Logo Circle',
      fit: 'cover',
      shape: 'circle',
      opacity: 1,
    },
    {
      id: 'image-placeholder',
      name: 'Placeholder',
      type: 'image',
      x: 210,
      y: 730,
      width: 120,
      height: 120,
      src: '',
      alt: 'Placeholder',
      fit: 'cover',
      shape: 'circle',
      opacity: 1,
      fallbackText: '图',
    },
    {
      id: 'image-contain',
      name: 'Image Contain',
      type: 'image',
      x: 370,
      y: 730,
      width: 200,
      height: 120,
      src: '/covercast-logo.png',
      alt: 'Logo Contain',
      fit: 'contain',
      shape: 'rect',
      opacity: 0.8,
    },
  ]

  return {
    version: 1,
    backgroundColor: '#132060',
    backgroundOpacity: 1,
    elements: [...texts, ...rects, ...ellipses, ...images],
  }
}

const TEST_CANVAS_WIDTH = 800
const TEST_CANVAS_HEIGHT = 1120

export default function TldrawTestClient() {
  const originalScene = useMemo(() => createTestScene(), [])
  const editorRef = useRef<Editor | null>(null)
  const [syncedScene, setSyncedScene] = useState<Scene | null>(null)
  const [diff, setDiff] = useState<DiffResult | null>(null)
  const [autoSync, setAutoSync] = useState(false)

  const handleEditorReady = useCallback((editor: Editor) => {
    editorRef.current = editor
  }, [])

  const doSync = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    const converted = editorToScene(editor)
    const result = diffScenes(originalScene, converted)
    setSyncedScene(converted)
    setDiff(result)
  }, [originalScene])

  const handleSceneChange = useCallback(
    (converted: Scene) => {
      const result = diffScenes(originalScene, converted)
      setSyncedScene(converted)
      setDiff(result)
    },
    [originalScene],
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <div
        style={{
          padding: '8px 16px',
          background: '#1a1a2e',
          color: '#fff',
          fontSize: 14,
          fontFamily: 'monospace',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>
          Phase 2 — All primitives (Rect + Ellipse + Image + Text) with round-triff + auto-sync
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
            />
            Auto Sync
          </label>
          <button
            onClick={doSync}
            style={{
              padding: '4px 16px',
              background: '#238636',
              color: '#fff',
              border: '1px solid #2ea043',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontFamily: 'monospace',
            }}
          >
            Sync to Scene
          </button>
        </div>
      </div>

      {/* Three-panel comparison */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Original SceneCanvas */}
        <Panel label="SceneCanvas (Original)" color="#58a6ff">
          <SceneCanvas
            scene={originalScene}
            idPrefix="original"
            interactive={false}
            canvasWidth={TEST_CANVAS_WIDTH}
            canvasHeight={TEST_CANVAS_HEIGHT}
            style={{ width: '100%', height: '100%' }}
          />
        </Panel>

        {/* Center: tldraw editor */}
        <Panel label="tldraw (Editor)" color="#7ee787">
          <CovercastEditor
            scene={originalScene}
            canvasWidth={TEST_CANVAS_WIDTH}
            canvasHeight={TEST_CANVAS_HEIGHT}
            onEditorReady={handleEditorReady}
            onSceneChange={autoSync ? handleSceneChange : undefined}
          />
        </Panel>

        {/* Right: Synced SceneCanvas */}
        <Panel
          label={syncedScene ? 'SceneCanvas (Synced)' : 'SceneCanvas (— click Sync —)'}
          color={diff && diff.mismatches.length === 0 ? '#7ee787' : '#f85149'}
        >
          {syncedScene ? (
            <SceneCanvas
              scene={syncedScene}
              idPrefix="synced"
              interactive={false}
              canvasWidth={TEST_CANVAS_WIDTH}
              canvasHeight={TEST_CANVAS_HEIGHT}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#6e7681',
                fontFamily: 'monospace',
                fontSize: 13,
              }}
            >
              Click &quot;Sync to Scene&quot; or enable &quot;Auto Sync&quot;
            </div>
          )}
        </Panel>
      </div>

      {/* Diff panel */}
      {diff && (
        <div
          style={{
            maxHeight: '25%',
            overflow: 'auto',
            background: '#0d1117',
            borderTop: '2px solid #333',
            padding: '8px 16px',
            fontFamily: 'monospace',
            fontSize: 12,
          }}
        >
          <div
            style={{
              color: diff.mismatches.length === 0 ? '#7ee787' : '#f85149',
              fontWeight: 'bold',
              marginBottom: '4px',
            }}
          >
            {diff.mismatches.length === 0
              ? `✓ Round-trip verified — ${diff.elementCount.converted}/${diff.elementCount.original} elements match perfectly`
              : `✗ ${diff.mismatches.length} mismatches found (${diff.elementCount.original} → ${diff.elementCount.converted})`}
          </div>
          {diff.mismatches.length > 0 && (
            <div style={{ color: '#f85149' }}>
              {diff.mismatches.slice(0, 20).map((m, i) => (
                <div key={i}>
                  [{m.id}] {m.field}: {JSON.stringify(m.original)} → {JSON.stringify(m.converted)}
                </div>
              ))}
              {diff.mismatches.length > 20 && <div>...and {diff.mismatches.length - 20} more</div>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Panel helper ──────────────────────────────────────────────────────────────

function Panel({
  label,
  color,
  children,
}: {
  label: string
  color: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '2px solid #333',
      }}
    >
      <div
        style={{
          padding: '4px 12px',
          background: '#0d1117',
          color,
          fontSize: 12,
          fontFamily: 'monospace',
        }}
      >
        {label}
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d1117',
          overflow: 'auto',
          position: 'relative',
        }}
      >
        {children}
      </div>
    </div>
  )
}
