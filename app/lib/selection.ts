export type SelectionState = {
  selectedIds: string[];
};

export function createSelectionState(): SelectionState {
  return {
    selectedIds: [],
  };
}

export function selectSingle(
  state: SelectionState,
  elementId: string
): SelectionState {
  return {
    ...state,
    selectedIds: [elementId],
  };
}

export function toggleSelection(
  state: SelectionState,
  elementId: string
): SelectionState {
  const isSelected = state.selectedIds.includes(elementId);

  if (isSelected) {
    return {
      ...state,
      selectedIds: state.selectedIds.filter((id) => id !== elementId),
    };
  }

  return {
    ...state,
    selectedIds: [...state.selectedIds, elementId],
  };
}

export function clearSelection(state: SelectionState): SelectionState {
  if (state.selectedIds.length === 0) {
    return state;
  }

  return {
    ...state,
    selectedIds: [],
  };
}

export function isSelected(state: SelectionState, elementId: string): boolean {
  return state.selectedIds.includes(elementId);
}

export function getSelectedCount(state: SelectionState): number {
  return state.selectedIds.length;
}

export function hasSelection(state: SelectionState): boolean {
  return state.selectedIds.length > 0;
}

export function getFirstSelectedId(state: SelectionState): string | null {
  return state.selectedIds[0] ?? null;
}

export function handleElementClick(
  state: SelectionState,
  elementId: string,
  isShiftPressed: boolean
): SelectionState {
  if (isShiftPressed) {
    return toggleSelection(state, elementId);
  }

  if (state.selectedIds.includes(elementId) && state.selectedIds.length === 1) {
    return state;
  }

  return selectSingle(state, elementId);
}

export function selectMultiple(
  state: SelectionState,
  elementIds: string[],
  isShiftPressed: boolean
): SelectionState {
  if (isShiftPressed) {
    const newIds = [...state.selectedIds];
    for (const id of elementIds) {
      if (!newIds.includes(id)) {
        newIds.push(id);
      }
    }
    return {
      ...state,
      selectedIds: newIds,
    };
  }

  return {
    ...state,
    selectedIds: elementIds,
  };
}