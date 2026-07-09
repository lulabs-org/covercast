/**
 * @file Uniform-grid spatial index for fast rect queries.
 *
 * Partitions the canvas into fixed-size cells (`CELL_SIZE`) so that
 * proximity queries (e.g. snap/guide candidate lookup) only scan a
 * local neighborhood rather than every element on the canvas.
 */

import type { Rect } from './scene'

const CELL_SIZE = 100

type CellKey = `${number},${number}`

export class SpatialIndex {
  private cells: Map<CellKey, Set<number>> = new Map()
  private elements: Map<number, Rect> = new Map()
  private nextId: number = 0

  /**
   * Resets the index, removing all inserted elements and reusing id space.
   */
  clear(): void {
    this.cells.clear()
    this.elements.clear()
    this.nextId = 0
  }

  /**
   * Inserts a rect into the index, registering it in every grid cell it overlaps.
   * @param rect - The rect to insert.
   * @returns The internal numeric id assigned to the inserted rect.
   */
  insert(rect: Rect): number {
    const id = this.nextId++
    this.elements.set(id, rect)

    const minX = Math.floor(rect.x / CELL_SIZE)
    const maxX = Math.floor((rect.x + rect.width) / CELL_SIZE)
    const minY = Math.floor(rect.y / CELL_SIZE)
    const maxY = Math.floor((rect.y + rect.height) / CELL_SIZE)

    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const key: CellKey = `${cx},${cy}`
        let cell = this.cells.get(key)
        if (!cell) {
          cell = new Set()
          this.cells.set(key, cell)
        }
        cell.add(id)
      }
    }

    return id
  }

  /**
   * Returns all rects near the query rect, expanded by `range` pixels on
   * every side. Each element is returned at most once regardless of how
   * many cells it shares with the query.
   * @param rect - The query rect.
   * @param range - Expansion radius in pixels. Defaults to `200`.
   * @returns An array of nearby rects.
   */
  queryNearby(rect: Rect, range: number = 200): Rect[] {
    const minX = Math.floor((rect.x - range) / CELL_SIZE)
    const maxX = Math.floor((rect.x + rect.width + range) / CELL_SIZE)
    const minY = Math.floor((rect.y - range) / CELL_SIZE)
    const maxY = Math.floor((rect.y + rect.height + range) / CELL_SIZE)

    const result: Rect[] = []
    const seen = new Set<number>()

    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const key: CellKey = `${cx},${cy}`
        const cell = this.cells.get(key)
        if (!cell) continue

        for (const id of cell) {
          if (seen.has(id)) continue
          seen.add(id)

          const element = this.elements.get(id)
          if (element) {
            result.push(element)
          }
        }
      }
    }

    return result
  }

  /**
   * Returns every rect currently stored in the index.
   * @returns An array of all inserted rects.
   */
  queryAll(): Rect[] {
    return Array.from(this.elements.values())
  }
}

/**
 * Builds a fresh `SpatialIndex` populated with the given rects.
 * @param elements - Rects to insert into the index.
 * @returns A populated `SpatialIndex` instance.
 */
export function buildSpatialIndex(elements: Rect[]): SpatialIndex {
  const index = new SpatialIndex()
  for (const el of elements) {
    index.insert(el)
  }
  return index
}
