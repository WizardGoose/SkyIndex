import { Field } from "./field.ts";
import type { Problem } from "./problem.ts";

/**
 * The small-target layer: when the caller wants k spawns of ONE mutation and k
 * is well under the plot's ceiling, the question inverts. Maximize asks "how
 * many spawns fit"; a capped request asks "what is the CHEAPEST way to get k".
 * The annealer cannot answer that second question, structurally: its score is
 * capped at k, so every field with at least k satisfied spots scores the same
 * and it has no gradient toward planting less. Left alone it returns a
 * maximize-shaped field, selection takes the first k legal anchors in index
 * order, and the player is shown a plot scattered with crops that a need of 2
 * never asked for. (Observed in real use: 45 support crops for a need of
 * 2 Soggybud. The honest answer is 4.)
 *
 * Two tools, both deterministic, both verified through the same Field the
 * search itself uses, so nothing here can claim a spawn the validator would
 * refuse:
 *
 * 1. selectCompactAnchors: given any solved field, choose the k satisfied
 *    spots that share the most support, instead of the first k by index.
 * 2. buildChainCandidate: construct the known-efficient shape directly, a run
 *    of spawn cells flanked by two crop rows, which costs about 2 crops per
 *    spawn against the 5 to 6 a scattered layout pays.
 *
 * The caller compares the constructed candidate against the searched one by
 * (spawns reached, then fewer crops planted) and keeps the winner, so this
 * layer can only ever improve on the search, never regress it.
 */

/** Crops currently planted on a field, by cell count. */
export const plantedCount = (field: Field): number => {
  let planted = 0;
  for (let cell = 0; cell < field.cells.length; cell++) if (field.cells[cell] >= 0) planted++;
  return planted;
};

/**
 * Picks k satisfied anchors that cluster, preferring spots whose rings overlap
 * the rings of spots already picked: shared ring cells are shared support, and
 * shared support is what the pruner turns into fewer planted crops.
 *
 * Greedy and deterministic: seed on the legal anchor with the most legal
 * neighbours within Chebyshev distance 2 (ties by index), then repeatedly add
 * the anchor sharing the most ring cells with the chosen union (ties by
 * proximity to the cluster's first spot, then index).
 */
export const selectCompactAnchors = (field: Field, problem: Problem, k: number): number[] => {
  const legal = field.satisfiedAnchors();
  if (legal.length <= k) return legal;

  const near = (a: number, b: number): number => {
    const aa = problem.anchors[a];
    const bb = problem.anchors[b];
    return Math.max(Math.abs(aa.row - bb.row), Math.abs(aa.col - bb.col));
  };

  let seed = legal[0];
  let seedScore = -1;
  for (const ai of legal) {
    let neighbours = 0;
    for (const other of legal) if (other !== ai && near(ai, other) <= 2) neighbours++;
    if (neighbours > seedScore) {
      seedScore = neighbours;
      seed = ai;
    }
  }

  const chosen = [seed];
  const chosenRing = new Set<number>(problem.anchors[seed].ring);
  const blockTaken = new Set<number>(problem.anchors[seed].block);

  while (chosen.length < k) {
    let best = -1;
    let bestShared = -1;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const ai of legal) {
      if (chosen.includes(ai)) continue;
      const anchor = problem.anchors[ai];
      // A spawn block must not sit on another chosen spawn's cell.
      if (anchor.block.some((cell) => blockTaken.has(cell))) continue;
      let shared = 0;
      for (const cell of anchor.ring) if (chosenRing.has(cell) && field.cells[cell] >= 0) shared++;
      const distance = near(ai, seed);
      if (
        shared > bestShared ||
        (shared === bestShared && distance < bestDistance) ||
        (shared === bestShared && distance === bestDistance && (best === -1 || ai < best))
      ) {
        best = ai;
        bestShared = shared;
        bestDistance = distance;
      }
    }
    if (best === -1) break;
    chosen.push(best);
    for (const cell of problem.anchors[best].ring) chosenRing.add(cell);
    for (const cell of problem.anchors[best].block) blockTaken.add(cell);
  }
  return chosen.sort((a, b) => a - b);
};

/**
 * Constructs the flank-chain shape directly: k spawn cells in a row, a crop
 * row above and below. With requirement total at most 4 the crop rows are
 * exactly as wide as the run (an end spawn sees 2 + 2 cells, diagonals
 * included, which is exactly enough); at 5 or 6 the crop rows extend one cell
 * past each end so every spawn sees 6. Above 6 the shape cannot feed a spawn
 * from two rows and this constructor declines - the full-ring family belongs
 * to the lattice, not to this.
 *
 * Assignment is round-robin from the requirement multiset, offset by half on
 * the bottom row so every window holds both halves of a two-crop requirement.
 * The result is not trusted by construction: every intended spawn is checked
 * through Field.isSatisfied, and one miss returns null so the caller falls
 * back to the searched answer. Locked cells, reserved cells and existing
 * baseline crops all make a row unusable rather than being overwritten.
 */
export const buildChainCandidate = (problem: Problem, k: number): Int16Array | null => {
  if (problem.targets.length !== 1) return null;
  const target = problem.targets[0];
  if (target.size !== 1 || target.fullRing || target.zeroAdjacent) return null;
  if (target.reqSum < 1 || target.reqSum > 6) return null;
  if (k < 1) return null;

  // The multiset the windows must contain, e.g. [melon, melon, gloom, gloom]
  // as palette indices, repeated round-robin along the rows.
  const sequence: number[] = [];
  for (const req of target.requirements) {
    if (req.cropIndex < 0) return null;
    for (let n = 0; n < req.count; n++) sequence.push(req.cropIndex);
  }

  const wide = target.reqSum > 4 ? 1 : 0;
  const runMax = 8; // spawns per row on a 10-wide grid, leaving room for wide ends
  const rows = Math.ceil(k / runMax);
  const perRow = Math.ceil(k / rows);

  const field = new Field(problem);
  field.load(problem.baseline);

  const usable = (cell: number): boolean =>
    problem.plantableMask[cell] === 1 && field.cells[cell] < 0;

  const spawnCells: number[] = [];
  let placedSpawns = 0;
  // Rows of the pattern: crop row, spawn row, crop row, spawn row, crop row...
  // Crop rows between two spawn rows are shared, which is where the shape
  // beats two isolated chains.
  for (let band = 0; band < rows; band++) {
    const spawnRow = 1 + band * 2;
    const cropRowA = spawnRow - 1;
    const cropRowB = spawnRow + 1;
    if (cropRowB > 9) return null;
    const runLength = Math.min(perRow, k - placedSpawns);
    if (runLength <= 0) break;
    const c0 = 1; // leave column 0 for wide ends when needed
    if (c0 + runLength - 1 + wide > 9) return null;

    for (let i = 0; i < runLength; i++) {
      const cell = spawnRow * 10 + c0 + i;
      // A spawn cell must be free and must be a legal anchor position.
      if (!problem.cellMask[cell] || problem.reserved[cell] || field.cells[cell] >= 0) return null;
      spawnCells.push(cell);
    }
    for (const cropRow of [cropRowA, cropRowB]) {
      const from = c0 - wide;
      const to = c0 + runLength - 1 + wide;
      for (let col = from; col <= to; col++) {
        const cell = cropRow * 10 + col;
        if (field.cells[cell] >= 0) continue; // shared row already planted
        if (!usable(cell)) return null;
        // Offset the bottom row by half the sequence so a window of two cells
        // from each row carries both halves of the requirement.
        const offset = cropRow === cropRowB ? Math.floor(sequence.length / 2) : 0;
        field.set(cell, sequence[(col + offset) % sequence.length]);
      }
    }
    placedSpawns += runLength;
  }
  if (placedSpawns < k) return null;

  // Verify every intended spawn through the solver's own satisfaction check.
  const anchorAt = new Map<number, number>();
  problem.anchorsByTarget[0].forEach((ai) => {
    const anchor = problem.anchors[ai];
    anchorAt.set(anchor.row * 10 + anchor.col, ai);
  });
  for (const cell of spawnCells) {
    const ai = anchorAt.get(cell);
    if (ai === undefined || !field.isSatisfied(ai)) return null;
  }
  return field.snapshot();
};

/** Debug-friendly description of a field, for tests and measurements. */
export const describeField = (field: Field, problem: Problem): string => {
  const rows: string[] = [];
  for (let r = 0; r < 10; r++) {
    let line = "";
    for (let c = 0; c < 10; c++) {
      const crop = field.cells[r * 10 + c];
      line += crop < 0 ? "." : problem.palette[crop].charAt(0);
    }
    rows.push(line);
  }
  return rows.join("\n") + `\n(planted ${plantedCount(field)})`;
};
