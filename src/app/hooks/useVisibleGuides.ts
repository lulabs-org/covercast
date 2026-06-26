import { useMemo } from 'react'
import { filterGuidesByMode, type GuideLine, type MeasurementGuide } from '@/domain'

export function useVisibleGuides(
  guides: GuideLine[],
  spacingGuides: MeasurementGuide[],
  selectedIds: string[],
  guidesSelectedIds: string[],
) {
  const visibleGuides = useMemo(
    () => filterGuidesByMode(guides, selectedIds, guidesSelectedIds),
    [guides, selectedIds, guidesSelectedIds],
  )

  const visibleSpacingGuides = useMemo(
    () => filterGuidesByMode(spacingGuides, selectedIds, guidesSelectedIds),
    [spacingGuides, selectedIds, guidesSelectedIds],
  )

  return {
    visibleGuides,
    visibleSpacingGuides,
  }
}
