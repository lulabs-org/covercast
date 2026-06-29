/**
 * @file Element selection state and operations.
 *
 * Provides a small immutable reducer-style API over a list of selected
 * element ids: single-select, toggle, multi-select, clear, and read-only
 * queries (count, has, first). All operations return new state objects
 * rather than mutating in place.
 */

export type SelectionState = {
  selectedIds: string[]
}

/**
 * Creates an empty selection state.
 * @returns A `SelectionState` with no selected ids.
 */
export function createSelectionState(): SelectionState {
  return {
    selectedIds: [],
  }
}

/**
 * Replaces the current selection with a single element.
 * @param state - The current selection state.
 * @param elementId - The id to select.
 * @returns A new `SelectionState` containing only `elementId`.
 */
export function selectSingle(state: SelectionState, elementId: string): SelectionState {
  return {
    ...state,
    selectedIds: [elementId],
  }
}

/**
 * Toggles an element's membership in the selection.
 * @param state - The current selection state.
 * @param elementId - The id to add or remove.
 * @returns A new `SelectionState` with the element added or removed.
 */
export function toggleSelection(state: SelectionState, elementId: string): SelectionState {
  const isSelected = state.selectedIds.includes(elementId)

  if (isSelected) {
    return {
      ...state,
      selectedIds: state.selectedIds.filter((id) => id !== elementId),
    }
  }

  return {
    ...state,
    selectedIds: [...state.selectedIds, elementId],
  }
}

/**
 * Clears the selection. Returns the input state unchanged when already empty.
 * @param state - The current selection state.
 * @returns A new `SelectionState` with an empty id list.
 */
export function clearSelection(state: SelectionState): SelectionState {
  if (state.selectedIds.length === 0) {
    return state
  }

  return {
    ...state,
    selectedIds: [],
  }
}

/**
 * Returns whether an element is currently selected.
 * @param state - The current selection state.
 * @param elementId - The id to check.
 * @returns `true` when the element is selected.
 */
export function isSelected(state: SelectionState, elementId: string): boolean {
  return state.selectedIds.includes(elementId)
}

/**
 * Returns the number of currently selected elements.
 * @param state - The current selection state.
 * @returns The selection count.
 */
export function getSelectedCount(state: SelectionState): number {
  return state.selectedIds.length
}

/**
 * Returns whether any element is currently selected.
 * @param state - The current selection state.
 * @returns `true` when at least one element is selected.
 */
export function hasSelection(state: SelectionState): boolean {
  return state.selectedIds.length > 0
}

/**
 * Returns the first selected id, or `null` when nothing is selected.
 * @param state - The current selection state.
 * @returns The first selected id or `null`.
 */
export function getFirstSelectedId(state: SelectionState): string | null {
  return state.selectedIds[0] ?? null
}

/**
 * Handles a click on an element, taking modifier keys into account.
 * With shift pressed, toggles the element; otherwise selects it as the
 * single active selection (no-op when it is already the only selection).
 * @param state - The current selection state.
 * @param elementId - The clicked element's id.
 * @param isShiftPressed - Whether shift was held during the click.
 * @returns A new `SelectionState` reflecting the click result.
 */
export function handleElementClick(
  state: SelectionState,
  elementId: string,
  isShiftPressed: boolean,
): SelectionState {
  if (isShiftPressed) {
    return toggleSelection(state, elementId)
  }

  if (state.selectedIds.includes(elementId) && state.selectedIds.length === 1) {
    return state
  }

  return selectSingle(state, elementId)
}

/**
 * Replaces or extends the selection with multiple element ids.
 * With shift pressed, ids are appended to the existing selection (deduped);
 * otherwise the selection is replaced by `elementIds`.
 * @param state - The current selection state.
 * @param elementIds - The ids to select.
 * @param isShiftPressed - Whether shift was held during the operation.
 * @returns A new `SelectionState` reflecting the result.
 */
export function selectMultiple(
  state: SelectionState,
  elementIds: string[],
  isShiftPressed: boolean,
): SelectionState {
  if (isShiftPressed) {
    const newIds = [...state.selectedIds]
    for (const id of elementIds) {
      if (!newIds.includes(id)) {
        newIds.push(id)
      }
    }
    return {
      ...state,
      selectedIds: newIds,
    }
  }

  return {
    ...state,
    selectedIds: elementIds,
  }
}
