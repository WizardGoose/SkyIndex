/**
 * Grid geometry. Everything here is pure integer arithmetic on a fixed 10x10
 * plot, matching what the game and the Designer both assume.
 *
 * The one rule worth stating out loud, because every other file depends on it:
 * a mutation of size S occupies an SxS BLOCK, and its RING is the union of the
 * 8-way neighbours of every cell of that block, minus the block's own cells,
 * clipped to the grid. That makes |ring| = (S+2)^2 - S^2, so 8 / 12 / 16 for
 * S = 1 / 2 / 3 whenever the block sits far enough from an edge.
 */

/** The plot is always 10x10. Locked cells are handled by the cell mask, not by resizing. */
export const GRID_SIZE = 10;

export const CELL_COUNT = GRID_SIZE * GRID_SIZE;

/** Flat index for a cell. Callers must have already bounds-checked. */
export const indexOf = (row: number, col: number): number => row * GRID_SIZE + col;

export const rowOf = (index: number): number => Math.floor(index / GRID_SIZE);

export const colOf = (index: number): number => index % GRID_SIZE;

export const inBounds = (row: number, col: number): boolean =>
  row >= 0 && col >= 0 && row < GRID_SIZE && col < GRID_SIZE;

/** Ring size for a block of side S sitting clear of every edge. */
export const ringSizeFor = (size: number): number => (size + 2) * (size + 2) - size * size;

/**
 * The SxS cells occupied by a block anchored at (row, col).
 * Returns null when any cell falls off the grid.
 */
export const blockCells = (row: number, col: number, size: number): number[] | null => {
  if (size <= 0) return null;
  const out: number[] = [];
  for (let dr = 0; dr < size; dr++) {
    for (let dc = 0; dc < size; dc++) {
      const r = row + dr;
      const c = col + dc;
      if (!inBounds(r, c)) return null;
      out.push(indexOf(r, c));
    }
  }
  return out;
};

/**
 * The ring of a block anchored at (row, col), clipped to the grid.
 *
 * Built as the (S+2)x(S+2) square centred on the block minus the block itself,
 * which is provably the same set as "8-way neighbours of every block cell minus
 * the block" and costs one pass instead of 8*S^2 lookups with dedup.
 */
export const ringCells = (row: number, col: number, size: number): number[] => {
  const out: number[] = [];
  for (let r = row - 1; r <= row + size; r++) {
    for (let c = col - 1; c <= col + size; c++) {
      if (r >= row && r < row + size && c >= col && c < col + size) continue;
      if (!inBounds(r, c)) continue;
      out.push(indexOf(r, c));
    }
  }
  return out;
};

/** 8-way neighbours of a single cell, clipped to the grid. */
export const neighbours = (index: number): number[] => ringCells(rowOf(index), colOf(index), 1);

/** Turns the request's cell list into a fast membership mask. */
export const buildCellMask = (cells: [number, number][]): Uint8Array => {
  const mask = new Uint8Array(CELL_COUNT);
  for (const [row, col] of cells) {
    if (!inBounds(row, col)) continue;
    mask[indexOf(row, col)] = 1;
  }
  return mask;
};
