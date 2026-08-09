import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { solveLocal, validateSolveResponse } from "../index.ts";
import type { SolverDataset } from "../index.ts";
import type { CropDefinition, MutationDefinition } from "../../types/greenhouse";

/**
 * What a pinned placement means to the solver.
 *
 * A lock is the player saying "this is already here, work around it". The
 * distinction that matters, and that this file exists to hold in place, is
 * between a pinned CROP and a pinned MUTATION:
 *
 *   a pinned crop is a real crop. It feeds the adjacency of everything beside
 *   it and it must survive even the prune, because the player put it there.
 *
 *   a pinned mutation is an OBSTACLE, not a spawn this plot earns. It used to
 *   be echoed into `mutations`, which was wrong twice: the response claimed a
 *   spawn nothing supported (so our own validator called the layout illegal),
 *   and the results page draws pinned placements itself on top of these, so
 *   the pin was counted twice and inflated the yield shown to the player.
 */

const raw = JSON.parse(
  readFileSync(new URL("../../../../public/greenhouse/data.json", import.meta.url), "utf8")
) as {
  crops: Record<string, Omit<CropDefinition, "id">>;
  mutations: Record<string, Omit<MutationDefinition, "id">>;
};

const withIds = <T>(record: Record<string, T>): Record<string, T & { id: string }> =>
  Object.fromEntries(Object.entries(record).map(([id, value]) => [id, { ...value, id }]));

const dataset: SolverDataset = {
  crops: withIds(raw.crops) as SolverDataset["crops"],
  mutations: withIds(raw.mutations) as SolverDataset["mutations"],
};

const FULL_PLOT: [number, number][] = Array.from({ length: 100 }, (_, i) => [
  Math.floor(i / 10),
  i % 10,
]);

const CHOCONUT = [{ mutation: "choconut", maximize: true, count: null }];
const SEED = { seed: 1 };

describe("pinned placements", () => {
  it("keeps a pinned crop exactly where it was put", () => {
    const result = solveLocal(FULL_PLOT, CHOCONUT, dataset, {
      ...SEED,
      locks: [
        { name: "cocoa_beans", size: 1, position: [0, 0] },
        { name: "cocoa_beans", size: 1, position: [9, 9] },
      ],
    });

    const at = (row: number, col: number) =>
      result.placements.find((p) => p.position[0] === row && p.position[1] === col);

    expect(at(0, 0)?.crop).toBe("cocoa_beans");
    expect(at(9, 9)?.crop).toBe("cocoa_beans");
    expect(validateSolveResponse(result, FULL_PLOT, dataset).valid).toBe(true);
  });

  it("never prunes a pinned crop, even one nothing needs", () => {
    // Wheat does nothing for choconut, so the prune would strip it on sight if
    // it were free to. The player pinned it, so it stays.
    const result = solveLocal(FULL_PLOT, CHOCONUT, dataset, {
      ...SEED,
      locks: [{ name: "wheat", size: 1, position: [0, 0] }],
      removeUnusedCrops: true,
    });

    expect(
      result.placements.some(
        (p) => p.crop === "wheat" && p.position[0] === 0 && p.position[1] === 0
      )
    ).toBe(true);
  });

  it("leaves a pinned mutation's block unplanted", () => {
    const result = solveLocal(FULL_PLOT, CHOCONUT, dataset, {
      ...SEED,
      locks: [{ name: "snoozling", size: 3, position: [4, 4] }],
    });

    const inBlock = result.placements.filter(
      (p) =>
        p.position[0] >= 4 && p.position[0] < 7 && p.position[1] >= 4 && p.position[1] < 7
    );
    expect(inBlock).toEqual([]);
  });

  it("does not report a pinned mutation as a spawn this plot produced", () => {
    const locks = [{ name: "snoozling", size: 3, position: [4, 4] as [number, number] }];
    const result = solveLocal(FULL_PLOT, CHOCONUT, dataset, { ...SEED, locks });

    // The pin is not a spawn, so it must not appear in the yield.
    expect(result.mutations.some((m) => m.mutation === "snoozling")).toBe(false);
    expect(result.mutations.every((m) => m.mutation === "choconut")).toBe(true);

    // Reporting it WOULD have made the layout illegal, because a pinned
    // snoozling sitting on bare ground has none of the five crops it needs.
    // This is the regression: the claim and the check disagreed.
    expect(validateSolveResponse(result, FULL_PLOT, dataset).valid).toBe(true);
  });

  it("still counts a pinned mutation's cells as occupied", () => {
    // It is not a spawn, but it is certainly not free space either. The plot
    // has to be costed with those nine cells spoken for.
    const locks = [{ name: "snoozling", size: 3, position: [4, 4] as [number, number] }];
    const withLock = solveLocal(FULL_PLOT, CHOCONUT, dataset, { ...SEED, locks });

    const counted =
      withLock.placements.reduce((sum, p) => sum + p.size * p.size, 0) +
      withLock.mutations.reduce((sum, m) => sum + m.size * m.size, 0);

    expect(withLock.total_cells_used).toBe(counted + 9);
  });

  it("treats priorities as inert on a single target", () => {
    // Priorities are a multi-target tie-break. A player who has ranked a
    // mutation should not see a different single-target layout because of it.
    //
    // The iteration cap must BIND, with the wall clock as a distant safety
    // valve: at the default budget the deadline fires at a load-dependent
    // iteration count, so the two solves being compared could legitimately do
    // different amounts of work and diverge (this flaked whenever another
    // build ran beside the suite - same class as the smallTarget fence).
    const budget = { ...SEED, timeBudgetMs: 60_000, iterations: 150_000 };
    const plain = solveLocal(FULL_PLOT, CHOCONUT, dataset, budget);
    const ranked = solveLocal(FULL_PLOT, CHOCONUT, dataset, {
      ...budget,
      priorities: { choconut: 34, soggybud: 1 },
    });

    expect(ranked).toEqual(plain);
  });
});
