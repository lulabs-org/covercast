import { useMemo } from "react";
import type { GuideLine, MeasurementGuide } from "../lib/smart-guide";

type GuideWithMode = {
  mode?: "keyboard" | "drag";
};

function filterGuidesByMode<T extends GuideWithMode>(
  guides: T[],
  currentSelectedIds: string[],
  guidesSelectedIds: string[]
): T[] {
  return guides.filter((guide) => {
    if (!guide.mode) {
      return true;
    }

    if (guide.mode === "keyboard") {
      const idsMatch =
        guidesSelectedIds.length === currentSelectedIds.length &&
        guidesSelectedIds.every((id) => currentSelectedIds.includes(id));
      return idsMatch;
    }

    return true;
  });
}

export function useVisibleGuides(
  guides: GuideLine[],
  spacingGuides: MeasurementGuide[],
  selectedIds: string[],
  guidesSelectedIds: string[]
) {
  const visibleGuides = useMemo(
    () => filterGuidesByMode(guides, selectedIds, guidesSelectedIds),
    [guides, selectedIds, guidesSelectedIds]
  );

  const visibleSpacingGuides = useMemo(
    () => filterGuidesByMode(spacingGuides, selectedIds, guidesSelectedIds),
    [spacingGuides, selectedIds, guidesSelectedIds]
  );

  return {
    visibleGuides,
    visibleSpacingGuides,
  };
}