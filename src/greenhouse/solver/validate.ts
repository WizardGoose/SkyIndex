import type { SolveResponse } from "../types/greenhouse";
import type { SolverDataset } from "./problem.ts";
import { isLayoutImpossible, isZeroAdjacent } from "./problem.ts";

/**
 * A second opinion, on purpose.
 *
 * This file deliberately shares NO code with the solver's scoring. It rebuilds
 * every ring from the literal rule - the union of the 8-way neighbours of every
 * block cell, minus the block's own cells - rather than reusing grid.ts's
 * (S+2)^2 shortcut, and it counts requirements with the same
 * Map<cropId, Set<cellKey>> shape the Designer's own validator uses. If the
 * solver has a geometry bug, sharing a helper would hide it; re-deriving here
 * is what makes a passing check mean something.
 *
 * The parity harness uses this to prove our layouts are LEGAL, not merely
 * numerous.
 */

const key = (row: number, col: number): string => `${row},${col}`;

export interface ValidationReport {
  valid: boolean;
  problems: string[];
}

export const validateSolveResponse = (
  response: SolveResponse,
  cells: [number, number][],
  dataset: SolverDataset
): ValidationReport => {
  const problems: string[] = [];
  const unlocked = new Set<string>();
  for (const [row, col] of cells) unlocked.add(key(row, col));

  // Occupancy: which cell holds which planted crop, and which cell belongs to
  // which spawn block. Rule 2 says these never overlap.
  const cropAt = new Map<string, string>();
  const blockAt = new Map<string, string>();

  const claim = (
    row: number,
    col: number,
    size: number,
    label: string,
    into: Map<string, string>,
    what: string
  ): void => {
    if (!Number.isInteger(size) || size < 1) {
      problems.push(`${what} ${label} has invalid size ${size}`);
      return;
    }
    for (let dr = 0; dr < size; dr++) {
      for (let dc = 0; dc < size; dc++) {
        const r = row + dr;
        const c = col + dc;
        const at = key(r, c);
        if (r < 0 || c < 0 || r > 9 || c > 9) {
          problems.push(`${what} ${label} at [${row},${col}] extends out of bounds to [${r},${c}]`);
          continue;
        }
        if (!unlocked.has(at)) {
          problems.push(`${what} ${label} occupies locked cell [${r},${c}]`);
          continue;
        }
        const existingCrop = cropAt.get(at);
        const existingBlock = blockAt.get(at);
        if (existingCrop !== undefined || existingBlock !== undefined) {
          problems.push(
            `cell [${r},${c}] is claimed twice: ${existingCrop ?? existingBlock} and ${label}`
          );
          continue;
        }
        into.set(at, label);
      }
    }
  };

  for (const placement of response.placements) {
    // A planted crop that is itself a mutation occupies that mutation's full
    // block. Placing a 3x3 snoozling as a single cell is how this project
    // claimed four provably-impossible "wins" (disproved against the
    // remote's real layouts), so the footprint is now enforced
    // here, in the second opinion, where the solver cannot argue with it.
    // Counting SEMANTICS are per-cell, settled by data: the remote's recorded
    // multi-cell layouts are legal under per-cell counting and illegal under
    // per-instance, so the existing cell-set counting below is already right.
    const asMutation = dataset.mutations[placement.crop];
    const trueSize = asMutation?.size ?? 1;
    if (placement.size !== trueSize) {
      problems.push(
        `planted ${placement.crop} with size ${placement.size} but it occupies ${trueSize}x${trueSize}`
      );
    }
    claim(placement.position[0], placement.position[1], placement.size, placement.crop, cropAt, "crop");
  }
  for (const spawn of response.mutations) {
    const definition = dataset.mutations[spawn.mutation];
    if (!definition) {
      problems.push(`unknown mutation ${spawn.mutation}`);
      continue;
    }
    if (spawn.size !== definition.size) {
      problems.push(
        `${spawn.mutation} reported size ${spawn.size} but the dataset says ${definition.size}`
      );
    }
    claim(spawn.position[0], spawn.position[1], spawn.size, spawn.mutation, blockAt, "mutation");
  }

  // Requirements, re-derived from scratch for every spawn.
  for (const spawn of response.mutations) {
    const definition = dataset.mutations[spawn.mutation];
    if (!definition) continue;
    if (isLayoutImpossible(definition)) {
      problems.push(`${spawn.mutation} cannot be produced by a plot layout but was placed`);
      continue;
    }

    const [row, col] = spawn.position;
    const size = definition.size;
    const inBlock = (r: number, c: number): boolean =>
      r >= row && r < row + size && c >= col && c < col + size;

    // Rule 4, literally: 8-way neighbours of every block cell, minus the block.
    const ring = new Set<string>();
    for (let dr = 0; dr < size; dr++) {
      for (let dc = 0; dc < size; dc++) {
        const cellRow = row + dr;
        const cellCol = col + dc;
        for (let nr = cellRow - 1; nr <= cellRow + 1; nr++) {
          for (let nc = cellCol - 1; nc <= cellCol + 1; nc++) {
            if (nr === cellRow && nc === cellCol) continue;
            if (nr < 0 || nc < 0 || nr > 9 || nc > 9) continue;
            if (inBlock(nr, nc)) continue;
            ring.add(key(nr, nc));
          }
        }
      }
    }

    // Rule 6: only deliberately planted crops count. A ring cell holding
    // another spawn's block, or nothing at all, contributes nothing.
    const byCrop = new Map<string, Set<string>>();
    let plantedInRing = 0;
    for (const at of ring) {
      const crop = cropAt.get(at);
      if (crop === undefined) continue;
      plantedInRing++;
      let set = byCrop.get(crop);
      if (!set) {
        set = new Set<string>();
        byCrop.set(crop, set);
      }
      set.add(at);
    }

    if (isZeroAdjacent(definition)) {
      if (plantedInRing > 0) {
        problems.push(
          `${spawn.mutation} at [${row},${col}] requires zero adjacent crops but has ${plantedInRing}`
        );
      }
      // Other SPAWNS break the condition too: a spawned lonelily occupies its
      // cell, so nothing can appear beside it - the game grows them in a
      // spaced natural pattern, never shoulder to shoulder (the solver
      // used to report 100 packed lonelilies as OPTIMAL).
      for (const at of ring) {
        const neighbour = blockAt.get(at);
        if (neighbour !== undefined) {
          problems.push(
            `${spawn.mutation} at [${row},${col}] requires an empty ring but touches spawn ${neighbour} at [${at}]`
          );
        }
      }
      continue;
    }

    for (const requirement of definition.requirements) {
      const found = byCrop.get(requirement.crop);
      const count = found ? found.size : 0;
      if (count < requirement.count) {
        problems.push(
          `${spawn.mutation} at [${row},${col}] needs ${requirement.count}x ${requirement.crop} but has ${count}`
        );
      }
    }
  }

  return { valid: problems.length === 0, problems };
};
