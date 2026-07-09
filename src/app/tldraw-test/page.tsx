import type { Metadata } from 'next'
import TldrawTestClient from './TldrawTestClient'

export const metadata: Metadata = {
  title: 'tldraw Test — Covercast',
  description: 'Phase 1A: Side-by-side comparison of SceneCanvas SVG vs tldraw custom ShapeUtil',
}

export default function TldrawTestPage() {
  return <TldrawTestClient />
}
