import { StateCreator } from 'zustand'
import type { GuideLine, MeasurementGuide, ResizeLabel } from '../lib/smart-guide'
import type { MarqueeState } from '../lib/marquee'
import { createMarqueeState } from '../lib/marquee'
import type { ResizeHandleType } from '../lib/group-drag'
import type { SceneElement } from '../lib/scene'
import type { BoundingBox } from '../lib/group-drag'
import type { EditorStore } from './useEditorStore'

type SingleDragState = {
  id: string
  mode: 'move' | 'resize'
  startX: number
  startY: number
  element: SceneElement
}

type GroupDragState = {
  mode: 'group-move'
  startX: number
  startY: number
  elements: SceneElement[]
}

type GroupResizeState = {
  mode: 'group-resize'
  handle: ResizeHandleType
  startX: number
  startY: number
  elements: SceneElement[]
  originalBounds: BoundingBox
}

export type DragState = SingleDragState | GroupDragState | GroupResizeState

export type InteractionSlice = {
  // Drag
  drag: DragState | null
  setDrag: (drag: DragState | null) => void

  // Guides
  guides: GuideLine[]
  setGuides: (guides: GuideLine[]) => void
  spacingGuides: MeasurementGuide[]
  setSpacingGuides: (guides: MeasurementGuide[]) => void
  resizeLabel: ResizeLabel | null
  setResizeLabel: (label: ResizeLabel | null) => void
  guidesSelectedIds: string[]
  setGuidesSelectedIds: (ids: string[]) => void

  // Visible (filtered) guides
  visibleGuides: GuideLine[]
  setVisibleGuides: (guides: GuideLine[]) => void
  visibleSpacingGuides: MeasurementGuide[]
  setVisibleSpacingGuides: (guides: MeasurementGuide[]) => void

  // Marquee
  marquee: MarqueeState
  setMarquee: (updater: MarqueeState | ((prev: MarqueeState) => MarqueeState)) => void
}

export const createInteractionSlice: StateCreator<EditorStore, [], [], InteractionSlice> = (
  set,
) => ({
  drag: null,
  setDrag: (drag) => set({ drag }),

  guides: [],
  setGuides: (guides) => set({ guides }),
  spacingGuides: [],
  setSpacingGuides: (spacingGuides) => set({ spacingGuides }),
  resizeLabel: null,
  setResizeLabel: (resizeLabel) => set({ resizeLabel }),
  guidesSelectedIds: [],
  setGuidesSelectedIds: (ids) => set({ guidesSelectedIds: ids }),

  visibleGuides: [],
  setVisibleGuides: (visibleGuides) => set({ visibleGuides }),
  visibleSpacingGuides: [],
  setVisibleSpacingGuides: (visibleSpacingGuides) => set({ visibleSpacingGuides }),

  marquee: createMarqueeState(),
  setMarquee: (updater) => {
    if (typeof updater === 'function') {
      set((s) => ({ marquee: updater(s.marquee) }))
    } else {
      set({ marquee: updater })
    }
  },
})
