import { describe, expect, it } from "vitest";
import {
  blockCells,
  indexOf,
  neighbours,
  ringCells,
  ringSizeFor,
  rowOf,
  colOf,
} from "../grid.ts";
import { validateSolveResponse } from "../validate.ts";
import type { SolverDataset } from "../problem.ts";
import type { MutationDefinition, SolveResponse } from "../../types/greenhouse";

/**
 * Geometry and the independent validator.
 *
 * The ring rule is the one thing every other file depends on, so it is checked
 * against the literal definition (8-way neighbours of every block cell, minus
 * the block) rather than against the (S+2)^2 shortcut grid.ts actually uses.
 */

const FULL_PLOT: [number, number][] = [];
for (let row = 0; row < 10; row++) for (let col = 0; col < 10; col++) FULL_PLOT.push([row, col]);

/** The literal Rule 4 definition, built the slow way on purpose. */
const ringByDefinition = (row: number, col: number, size: number): Set<number> => {
  const ring = new Set<number>();
  for (let dr = 0; dr < size; dr++) {
    for (let dc = 0; dc < size; dc++) {
      const cellRow = row + dr;
      const cellCol = col + dc;
      for (let nr = cellRow - 1; nr <= cellRow + 1; nr++) {
        for (let nc = cellCol - 1; nc <= cellCol + 1; nc++) {
          if (nr === cellRow && nc === cellCol) continue;
          if (nr < 0 || nc < 0 || nr > 9 || nc > 9) continue;
          if (nr >= row && nr < row + size && nc >= col && nc < col + size) continue;
          ring.add(indexOf(nr, nc));
        }
      }
    }
  }
  return ring;
};

const mutation = (over: Partial<MutationDefinition> & { id: string }): MutationDefinition => ({
  name: over.id,
  size: 1,
  ground: "farmland",
  requirements: [],
  rarity: "common",
  growth_stages: 1,
  positive_buffs: [],
  negative_buffs: [],
  drops: {},
  ...over,
});

const TEST_DATA: SolverDataset = {
  crops: {} as SolverDataset["crops"],
  mutations: {
    pairflower: mutation({ id: "pairflower", requirements: [{ crop: "wheat", count: 2 }] }),
    bigbloom: mutation({
      id: "bigbloom",
      size: 2,
      requirements: [{ crop: "wheat", count: 12 }],
    }),
  },
};

describe("ring geometry", () => {
  it("is 8, 12 and 16 cells for sizes 1, 2 and 3 clear of the edges", () => {
    expect(ringSizeFor(1)).toBe(8);
    expect(ringSizeFor(2)).toBe(12);
    expect(ringSizeFor(3)).toBe(16);
    expect(ringCells(4, 4, 1)).toHaveLength(8);
    expect(ringCells(4, 4, 2)).toHaveLength(12);
    expect(ringCells(4, 4, 3)).toHaveLength(16);
  });

  it("never includes the block's own cells", () => {
    for (const size of [1, 2, 3]) {
      const block = new Set(blockCells(3, 5, size) ?? []);
      for (const cell of ringCells(3, 5, size)) expect(block.has(cell)).toBe(false);
    }
  });

  it("is clipped at the edges rather than wrapping", () => {
    // A corner 1x1 sees 3 neighbours, an edge 1x1 sees 5.
    expect(ringCells(0, 0, 1)).toHaveLength(3);
    expect(ringCells(0, 4, 1)).toHaveLength(5);
    expect(ringCells(9, 9, 1)).toHaveLength(3);
    // A 3x3 in the corner: its 5x5 footprint clips to the 4x4 at rows 0-3 and
    // cols 0-3, and the block itself takes 9 of those, leaving 7.
    expect(ringCells(0, 0, 3)).toHaveLength(7);
    for (const cell of ringCells(0, 0, 2)) {
      expect(rowOf(cell)).toBeGreaterThanOrEqual(0);
      expect(colOf(cell)).toBeGreaterThanOrEqual(0);
    }
  });

  it("matches the literal 8-way-neighbour definition everywhere", () => {
    for (const size of [1, 2, 3]) {
      for (let row = 0; row + size <= 10; row++) {
        for (let col = 0; col + size <= 10; col++) {
          const shortcut = new Set(ringCells(row, col, size));
          const literal = ringByDefinition(row, col, size);
          expect([...shortcut].sort((a, b) => a - b)).toEqual([...literal].sort((a, b) => a - b));
        }
      }
    }
  });

  it("treats a 1x1 ring and the 8-way neighbour list as the same thing", () => {
    expect(neighbours(indexOf(5, 5))).toEqual(ringCells(5, 5, 1));
  });

  it("refuses a block that would fall off the grid", () => {
    expect(blockCells(9, 9, 2)).toBeNull();
    expect(blockCells(8, 8, 2)).toHaveLength(4);
  });
});

describe("validateSolveResponse", () => {
  const legal: SolveResponse = {
    status: "FEASIBLE",
    placements: [
      { crop: "wheat", position: [4, 4], size: 1 },
      { crop: "wheat", position: [4, 6], size: 1 },
    ],
    mutations: [{ mutation: "pairflower", position: [4, 5], size: 1 }],
  };

  it("accepts a hand-built legal layout", () => {
    const report = validateSolveResponse(legal, FULL_PLOT, TEST_DATA);
    expect(report.problems).toEqual([]);
    expect(report.valid).toBe(true);
  });

  it("rejects an unmet requirement", () => {
    const short: SolveResponse = {
      ...legal,
      placements: [{ crop: "wheat", position: [4, 4], size: 1 }],
    };
    const report = validateSolveResponse(short, FULL_PLOT, TEST_DATA);
    expect(report.valid).toBe(false);
    expect(report.problems.join(" ")).toContain("needs 2x wheat but has 1");
  });

  it("rejects overlapping spawn blocks", () => {
    const overlapping: SolveResponse = {
      ...legal,
      mutations: [
        { mutation: "pairflower", position: [4, 5], size: 1 },
        { mutation: "pairflower", position: [4, 5], size: 1 },
      ],
    };
    const report = validateSolveResponse(overlapping, FULL_PLOT, TEST_DATA);
    expect(report.valid).toBe(false);
    expect(report.problems.join(" ")).toContain("claimed twice");
  });

  it("rejects a block that runs off the grid", () => {
    const outside: SolveResponse = {
      status: "FEASIBLE",
      placements: [],
      mutations: [{ mutation: "bigbloom", position: [9, 9], size: 2 }],
    };
    const report = validateSolveResponse(outside, FULL_PLOT, TEST_DATA);
    expect(report.valid).toBe(false);
    expect(report.problems.join(" ")).toContain("out of bounds");
  });

  it("rejects a layout that uses a cell outside the unlocked set", () => {
    const smallPlot: [number, number][] = [
      [0, 0],
      [0, 1],
    ];
    const report = validateSolveResponse(legal, smallPlot, TEST_DATA);
    expect(report.valid).toBe(false);
    expect(report.problems.join(" ")).toContain("locked cell");
  });

  it("does not count another spawn's block as a crop (Rule 6)", () => {
    // Two wheat and a second mutation sitting where a third wheat would be.
    const response: SolveResponse = {
      status: "FEASIBLE",
      placements: [{ crop: "wheat", position: [4, 4], size: 1 }],
      mutations: [
        { mutation: "pairflower", position: [4, 5], size: 1 },
        { mutation: "pairflower", position: [4, 6], size: 1 },
      ],
    };
    const report = validateSolveResponse(response, FULL_PLOT, TEST_DATA);
    expect(report.valid).toBe(false);
    // Both spawns are short: the neighbouring block contributes nothing.
    expect(report.problems.filter((p) => p.includes("needs 2x wheat"))).toHaveLength(2);
  });
});
