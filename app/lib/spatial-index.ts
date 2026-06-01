import { Rect } from "./smart-guide";

const CELL_SIZE = 100;

type CellKey = `${number},${number}`;

export class SpatialIndex {
  private cells: Map<CellKey, Set<number>> = new Map();
  private elements: Map<number, Rect> = new Map();
  private nextId: number = 0;

  clear(): void {
    this.cells.clear();
    this.elements.clear();
    this.nextId = 0;
  }

  insert(rect: Rect): number {
    const id = this.nextId++;
    this.elements.set(id, rect);

    const minX = Math.floor(rect.x / CELL_SIZE);
    const maxX = Math.floor((rect.x + rect.width) / CELL_SIZE);
    const minY = Math.floor(rect.y / CELL_SIZE);
    const maxY = Math.floor((rect.y + rect.height) / CELL_SIZE);

    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const key: CellKey = `${cx},${cy}`;
        let cell = this.cells.get(key);
        if (!cell) {
          cell = new Set();
          this.cells.set(key, cell);
        }
        cell.add(id);
      }
    }

    return id;
  }

  queryNearby(rect: Rect, range: number = 200): Rect[] {
    const minX = Math.floor((rect.x - range) / CELL_SIZE);
    const maxX = Math.floor((rect.x + rect.width + range) / CELL_SIZE);
    const minY = Math.floor((rect.y - range) / CELL_SIZE);
    const maxY = Math.floor((rect.y + rect.height + range) / CELL_SIZE);

    const result: Rect[] = [];
    const seen = new Set<number>();

    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const key: CellKey = `${cx},${cy}`;
        const cell = this.cells.get(key);
        if (!cell) continue;

        for (const id of cell) {
          if (seen.has(id)) continue;
          seen.add(id);

          const element = this.elements.get(id);
          if (element) {
            result.push(element);
          }
        }
      }
    }

    return result;
  }

  queryAll(): Rect[] {
    return Array.from(this.elements.values());
  }
}

export function buildSpatialIndex(elements: Rect[]): SpatialIndex {
  const index = new SpatialIndex();
  for (const el of elements) {
    index.insert(el);
  }
  return index;
}