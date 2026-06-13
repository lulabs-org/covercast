import type { GuideLine, MeasurementGuide } from './guide-types'

type GuideWithMode = {
  mode?: 'keyboard' | 'drag'
}

function filterGuidesByMode<T extends GuideWithMode>(
  guides: T[],
  currentSelectedIds: string[],
  guidesSelectedIds: string[],
): T[] {
  return guides.filter((guide) => {
    if (!guide.mode) {
      return true
    }

    if (guide.mode === 'keyboard') {
      const idsMatch =
        guidesSelectedIds.length === currentSelectedIds.length &&
        guidesSelectedIds.every((id) => currentSelectedIds.includes(id))
      return idsMatch
    }

    return true
  })
}

export function computeVisibleGuides(
  guides: GuideLine[],
  spacingGuides: MeasurementGuide[],
  selectedIds: string[],
  guidesSelectedIds: string[],
) {
  return {
    visibleGuides: filterGuidesByMode(guides, selectedIds, guidesSelectedIds),
    visibleSpacingGuides: filterGuidesByMode(spacingGuides, selectedIds, guidesSelectedIds),
  }
}
