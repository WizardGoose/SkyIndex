import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { solveLocal, validateSolveResponse } from "../index.ts";
import type { SolverDataset } from "../index.ts";
import type { MutationDefinition, MutationGoal, SolveResponse } from "../../types/greenhouse";

/**
 * End-to-end behaviour against the real bundled dataset.
 *
 * Every yield assertion is paired with a legality check, because a solver that
 * reports a big number for a plot nobody can build is worse than one that
 * reports a small honest one.
 */

const raw = JSON.parse(
  readFileSync("public/greenhouse/data.json", "utf8")
) as {
  crops: Record<string, Record<string, unknown>>;
  mutations: Record<string, MutationDefinition>;
};

// data.json keys entries by id and stores no `id` field; every app consumer
// rehydrates it, so the tests do the same.
for (const [id, definition] of Object.entries(raw.mutations)) definition.id = id;
const DATA = raw as unknown as SolverDataset;

const FULL_PLOT: [number, number][] = [];
for (let row = 0; row < 10; row++) for (let col = 0; col < 10; col++) FULL_PLOT.push([row, col]);

const maximize = (mutation: string): MutationGoal[] => [{ mutation, maximize: true, count: null }];

/** Independent reference: the Designer's own counting, rebuilt from its shape. */
const designerLegalPositions = (
  response: SolveResponse,
  definition: MutationDefinition
): Set<string> => {
  const cropAtCell = new Map<string, string>();
  for (const placement of response.placements) {
    const [row, col] = placement.position;
    for (let dr = 0; dr < placement.size; dr++) {
      for (let dc = 0; dc < placement.size; dc++) {
        cropAtCell.set(`${row + dr},${col + dc}`, placement.crop);
      }
    }
  }

  const legal = new Set<string>();
  for (let row = 0; row <= 10 - definition.size; row++) {
    for (let col = 0; col <= 10 - definition.size; col++) {
      const adjacent = new Map<string, Set<string>>();
      for (let dr = 0; dr < definition.size; dr++) {
        for (let dc = 0; dc < definition.size; dc++) {
          const cellRow = row + dr;
          const cellCol = col + dc;
          for (const [nr, nc] of [
            [cellRow - 1, cellCol],
            [cellRow + 1, cellCol],
            [cellRow, cellCol - 1],
            [cellRow, cellCol + 1],
            [cellRow - 1, cellCol - 1],
            [cellRow - 1, cellCol + 1],
            [cellRow + 1, cellCol - 1],
            [cellRow + 1, cellCol + 1],
          ]) {
            if (nr >= row && nr < row + definition.size && nc >= col && nc < col + definition.size) continue;
            const crop = cropAtCell.get(`${nr},${nc}`);
            if (!crop) continue;
            if (!adjacent.has(crop)) adjacent.set(crop, new Set());
            adjacent.get(crop)!.add(`${nr},${nc}`);
          }
        }
      }
      const met = definition.requirements.every((req) => {
        const cells = adjacent.get(req.crop);
        return cells !== undefined && cells.size >= req.count;
      });
      if (met) legal.add(`${row},${col}`);
    }
  }
  return legal;
};

describe("requirement counting", () => {
  it("agrees with the Designer's own validator on a produced layout", () => {
    const response = solveLocal(FULL_PLOT, maximize("choconut"), DATA, { iterations: 40_000 });
    const legal = designerLegalPositions(response, DATA.mutations.choconut);
    expect(response.mutations.length).toBeGreaterThan(0);
    for (const spawn of response.mutations) {
      expect(legal.has(`${spawn.position[0]},${spawn.position[1]}`)).toBe(true);
    }
  });
});

describe("determinism", () => {
  it("returns a byte-identical response for the same seed and budget", () => {
    const options = { seed: 12345, iterations: 60_000 };
    const first = solveLocal(FULL_PLOT, maximize("scourroot"), DATA, options);
    const second = solveLocal(FULL_PLOT, maximize("scourroot"), DATA, options);
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });

  it("gives a different seed room to find something different", () => {
    const a = solveLocal(FULL_PLOT, maximize("ashwreath"), DATA, { seed: 1, iterations: 60_000 });
    const b = solveLocal(FULL_PLOT, maximize("ashwreath"), DATA, { seed: 2, iterations: 60_000 });
    // Not asserting they differ - a seed may converge to the same layout - only
    // that both are legal, which is what a seed change must never break.
    expect(validateSolveResponse(a, FULL_PLOT, DATA).valid).toBe(true);
    expect(validateSolveResponse(b, FULL_PLOT, DATA).valid).toBe(true);
  });
});

describe("lonelily, the zero-adjacent special", () => {
  it("spawns the spaced natural pattern: 25 on a bare plot, never packed", () => {
    /*
     * This used to assert 100 - the whole plot, shoulder to shoulder - and
     * the remote records the same 100. The game does not: a spawned lonelily
     * occupies its cell, so its neighbours no longer have the empty ring the
     * spawn condition demands, and the real pattern is spaced (confirmed
     * against the live greenhouse display). The kings-graph maximum
     * on a 10x10 is 25, the 2x2-tile bound proves it, and the spacing itself
     * is asserted below rather than trusted.
     */
    const response = solveLocal(FULL_PLOT, maximize("lonelily"), DATA, { iterations: 10_000 });
    expect(response.mutations).toHaveLength(25);
    expect(response.placements).toHaveLength(0);
    expect(response.status).toBe("OPTIMAL");
    expect(validateSolveResponse(response, FULL_PLOT, DATA).valid).toBe(true);

    for (const a of response.mutations) {
      for (const b of response.mutations) {
        if (a === b) continue;
        const apart =
          Math.max(Math.abs(a.position[0] - b.position[0]), Math.abs(a.position[1] - b.position[1]));
        expect(apart, "two lonelilies touching").toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("is invalidated by an adjacent planted crop", () => {
    const response: SolveResponse = {
      status: "FEASIBLE",
      placements: [{ crop: "wheat", position: [5, 5], size: 1 }],
      mutations: [{ mutation: "lonelily", position: [5, 6], size: 1 }],
    };
    const report = validateSolveResponse(response, FULL_PLOT, DATA);
    expect(report.valid).toBe(false);
    expect(report.problems.join(" ")).toContain("requires zero adjacent crops");
  });

  it("works around a locked crop rather than ignoring the constraint", () => {
    const response = solveLocal(FULL_PLOT, maximize("lonelily"), DATA, {
      iterations: 10_000,
      locks: [{ name: "wheat", size: 1, position: [5, 5] }],
    });
    // The locked cell and its 8 neighbours can no longer spawn, and the
    // survivors still keep their spacing. 24 is what the search finds,
    // measured stable across seeds; it is one under the bare plot's 25 and
    // carries no OPTIMAL claim because no bound proves it maximal here.
    expect(response.mutations).toHaveLength(24);
    expect(response.status).toBe("FEASIBLE");
    expect(validateSolveResponse(response, FULL_PLOT, DATA).valid).toBe(true);
  });
});

describe("mutations no layout can produce", () => {
  it.each(["shellfruit", "godseed", "jerryflower"])("returns a clean zero for %s", (id) => {
    const response = solveLocal(FULL_PLOT, maximize(id), DATA, { iterations: 10_000 });
    expect(response.status).toBe("INFEASIBLE");
    expect(response.mutations).toHaveLength(0);
    expect(response.placements).toHaveLength(0);
    expect(response.solver_approach).toContain("no adjacency layout");
  });
});

describe("the full-ring family", () => {
  it("reaches the provable bound on snoozling, noctilume and duskbloom", () => {
    for (const [id, want] of [
      ["snoozling", 4],
      ["noctilume", 9],
      ["duskbloom", 16],
    ] as const) {
      const response = solveLocal(FULL_PLOT, maximize(id), DATA);
      expect(response.mutations.length, id).toBeGreaterThanOrEqual(want);
      expect(response.status, id).toBe("OPTIMAL");
      expect(validateSolveResponse(response, FULL_PLOT, DATA).problems, id).toEqual([]);
    }
  });

  it("matches the remote on every multi-cell-support target, with legal blocks", { timeout: 40_000 }, () => {
    // This test used to assert 16 / 9 / 16 / 16 here and call them wins over
    // the remote's 4 / 4 / 11 / 13. All four were disproved against the
    // remote's real layouts: snoozling is 3x3 and noctilume 2x2,
    // the main engine planted every support on one cell, and the "wins" were
    // physically impossible plots. The honest bar is the remote's numbers with
    // supports placed as true blocks, and the block-placement search in
    // multiCell.ts reaches all four - verified legal by the same
    // footprint-enforcing validator that caught the original lie.
    for (const [id, want] of [
      ["stoplight_petal", 4],
      ["plantboy_advance", 4],
      ["puffercloud", 11],
      ["thunderling", 13],
    ] as const) {
      const response = solveLocal(FULL_PLOT, maximize(id), DATA, { timeBudgetMs: 4_000 });
      expect(response.status, id).toBe("FEASIBLE");
      expect(response.mutations.length, id).toBeGreaterThanOrEqual(want);
      expect(validateSolveResponse(response, FULL_PLOT, DATA).problems, id).toEqual([]);
    }
  });

  it("still refuses JOINT solves that mix in multi-cell-support targets", () => {
    // The joint packing machinery has not learned blocks yet; refusing
    // honestly beats emitting a plot nobody can build.
    const response = solveLocal(
      FULL_PLOT,
      [...maximize("stoplight_petal"), ...maximize("duskbloom")],
      DATA
    );
    expect(response.status).toBe("INFEASIBLE");
    expect(response.solver_approach).toContain("multi-cell support crops");
    expect(response.mutations).toEqual([]);
  });

  it("accepts the remote's recorded multi-cell layout under the footprint validator", () => {
    // The recorded remote layout for stoplight_petal places snoozling as 3x3
    // blocks and noctilume as 2x2, and is legal under PER-CELL adjacency
    // counting - the experiment that settled the game's counting semantics.
    // If this ever fails, either the baseline moved or the validator's
    // semantics drifted, and both deserve a loud stop.
    const baseline = JSON.parse(readFileSync("tools/solver-parity-baseline.json", "utf8"));
    const recorded = baseline.single.stoplight_petal.variants.false.response;
    const report = validateSolveResponse(recorded, FULL_PLOT, DATA);
    expect(report.problems).toEqual([]);
    // And the 1x1-support version of the same layout - the exact shape of the
    // old lie - is mechanically rejected.
    const flattened = {
      ...recorded,
      placements: recorded.placements.map((p: { size: number }) => ({ ...p, size: 1 })),
    };
    const rejected = validateSolveResponse(flattened, FULL_PLOT, DATA);
    expect(rejected.valid).toBe(false);
    expect(rejected.problems.join(" ")).toContain("occupies 3x3");
  });
});

describe("multi-target", () => {
  it("never spawns two mutations on one cell", () => {
    const response = solveLocal(
      FULL_PLOT,
      [...maximize("choconut"), ...maximize("dustgrain")],
      DATA,
      { iterations: 120_000 }
    );
    expect(validateSolveResponse(response, FULL_PLOT, DATA).problems).toEqual([]);
    expect(response.mutations.length).toBeLessThanOrEqual(100);
  });

  it("never does worse than the best single target alone", () => {
    const budget = { iterations: 200_000 };
    const single = solveLocal(FULL_PLOT, maximize("duskbloom"), DATA, budget);
    const joint = solveLocal(
      FULL_PLOT,
      [...maximize("duskbloom"), ...maximize("noctilume")],
      DATA,
      budget
    );
    expect(joint.mutations.length).toBeGreaterThanOrEqual(single.mutations.length);
    expect(validateSolveResponse(joint, FULL_PLOT, DATA).problems).toEqual([]);
  });

  it("honours an explicit target count instead of maximizing", () => {
    const response = solveLocal(
      FULL_PLOT,
      [{ mutation: "duskbloom", maximize: false, count: 3 }],
      DATA,
      { iterations: 80_000 }
    );
    expect(response.mutations).toHaveLength(3);
    expect(validateSolveResponse(response, FULL_PLOT, DATA).problems).toEqual([]);
  });
});

describe("locks", () => {
  it("keeps a locked crop in the response and never prunes it", () => {
    const response = solveLocal(FULL_PLOT, maximize("choconut"), DATA, {
      iterations: 40_000,
      removeUnusedCrops: true,
      // nether_wart is useless to choconut, so an unlocked one would be pruned.
      locks: [{ name: "nether_wart", size: 1, position: [0, 0] }],
    });
    const locked = response.placements.filter((p) => p.locked);
    expect(locked).toHaveLength(1);
    expect(locked[0].crop).toBe("nether_wart");
    expect(locked[0].position).toEqual([0, 0]);
    expect(validateSolveResponse(response, FULL_PLOT, DATA).problems).toEqual([]);
  });

  it("never plants on a cell reserved by a locked mutation", () => {
    const response = solveLocal(FULL_PLOT, maximize("choconut"), DATA, {
      iterations: 40_000,
      locks: [{ name: "noctilume", size: 2, position: [4, 4] }],
    });
    const reserved = new Set(["4,4", "4,5", "5,4", "5,5"]);
    for (const placement of response.placements) {
      expect(reserved.has(`${placement.position[0]},${placement.position[1]}`)).toBe(false);
    }
    for (const spawn of response.mutations) {
      if (spawn.mutation === "noctilume") continue;
      expect(reserved.has(`${spawn.position[0]},${spawn.position[1]}`)).toBe(false);
    }
  });

  it("fails cleanly on a lock outside the unlocked cells", () => {
    const cornerPlot: [number, number][] = [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ];
    const response = solveLocal(cornerPlot, maximize("choconut"), DATA, {
      locks: [{ name: "wheat", size: 1, position: [5, 5] }],
    });
    expect(response.status).toBe("INFEASIBLE");
    expect(response.solver_approach).toContain("locked cell");
  });

  it("fails cleanly on overlapping locks", () => {
    const response = solveLocal(FULL_PLOT, maximize("choconut"), DATA, {
      locks: [
        { name: "wheat", size: 2, position: [2, 2] },
        { name: "carrot", size: 1, position: [3, 3] },
      ],
    });
    expect(response.status).toBe("INFEASIBLE");
    expect(response.solver_approach).toContain("overlaps another lock");
  });
});

describe("priorities", () => {
  it("cannot change a single-target solve", () => {
    const options = { seed: 7, iterations: 60_000 };
    const plain = solveLocal(FULL_PLOT, maximize("veilshroom"), DATA, options);
    const ranked = solveLocal(FULL_PLOT, maximize("veilshroom"), DATA, {
      ...options,
      priorities: { veilshroom: 34 },
    });
    expect(JSON.stringify(ranked)).toBe(JSON.stringify(plain));
  });
});

describe("removeUnusedCrops", () => {
  it("shrinks the crop list without changing the yield", () => {
    const options = { seed: 3, iterations: 120_000 };
    const kept = solveLocal(FULL_PLOT, maximize("choconut"), DATA, options);
    const pruned = solveLocal(FULL_PLOT, maximize("choconut"), DATA, {
      ...options,
      removeUnusedCrops: true,
    });
    expect(pruned.mutations.length).toBe(kept.mutations.length);
    expect(pruned.placements.length).toBeLessThanOrEqual(kept.placements.length);
    expect(validateSolveResponse(pruned, FULL_PLOT, DATA).problems).toEqual([]);
  });
});

describe("partial plots", () => {
  it("stays inside the unlocked cells", () => {
    const plot: [number, number][] = [];
    for (let row = 2; row < 7; row++) for (let col = 2; col < 7; col++) plot.push([row, col]);
    const response = solveLocal(plot, maximize("choconut"), DATA, { iterations: 80_000 });
    expect(validateSolveResponse(response, plot, DATA).problems).toEqual([]);
    expect(response.mutations.length).toBeGreaterThan(0);
  });
});
