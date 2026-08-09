import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { solveLocal, validateSolveResponse } from "../index.ts";
import type { SolverDataset } from "../problem.ts";

/**
 * The report that started this file: the recipe needs
 * 2x Soggybud and the plan grew a full-plot layout with 45 support crops.
 * A layout that expensive is indefensible for a need of two.
 *
 * The much better way, measured: a spawn needing 2+2 of two crops can share
 * its support with a neighbouring spawn, so k spawns cost about 2k crops in a
 * flank-chain, not the 5 to 6 per spawn a scattered selection pays. These
 * tests pin the economy, not just the legality.
 */

const here = dirname(fileURLToPath(import.meta.url));
const raw = JSON.parse(
  readFileSync(join(here, "..", "..", "..", "..", "public", "greenhouse", "data.json"), "utf8")
);
const dataset: SolverDataset = { mutations: raw.mutations, crops: raw.crops };

const FULL_GRID: [number, number][] = [];
for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) FULL_GRID.push([r, c]);

const cropCells = (response: ReturnType<typeof solveLocal>): number =>
  response.placements.filter((p) => !p.locked).reduce((sum, p) => sum + p.size * p.size, 0);

describe("small-target economy (the 45-crops-for-2 case)", () => {
  it("2 soggybud costs single-digit crops, not a plot", () => {
    const response = solveLocal(FULL_GRID, [{ mutation: "soggybud", maximize: false, count: 2 }], dataset, {
      seed: 1,
      timeBudgetMs: 1500,
    });
    expect(response.mutations.length).toBe(2);
    expect(validateSolveResponse(response, FULL_GRID, dataset).valid).toBe(true);
    // Two flank-chained spawns genuinely need only 4 shared crops; anything
    // at or under 6 is honest, 45 was the bug.
    expect(cropCells(response)).toBeLessThanOrEqual(6);
  });

  it("5 soggybud lands near 2 crops per spawn", () => {
    const response = solveLocal(FULL_GRID, [{ mutation: "soggybud", maximize: false, count: 5 }], dataset, {
      seed: 1,
      timeBudgetMs: 1500,
    });
    expect(response.mutations.length).toBe(5);
    expect(validateSolveResponse(response, FULL_GRID, dataset).valid).toBe(true);
    expect(cropCells(response)).toBeLessThanOrEqual(12);
  });

  it("single-crop requirement chains too (witherbloom 4x duskbloom)", () => {
    const response = solveLocal(FULL_GRID, [{ mutation: "witherbloom", maximize: false, count: 3 }], dataset, {
      seed: 1,
      timeBudgetMs: 1500,
    });
    expect(response.mutations.length).toBe(3);
    expect(validateSolveResponse(response, FULL_GRID, dataset).valid).toBe(true);
    expect(cropCells(response)).toBeLessThanOrEqual(8);
  });

  it("a capped request never reports more spawns than asked", () => {
    const response = solveLocal(FULL_GRID, [{ mutation: "soggybud", maximize: false, count: 2 }], dataset, {
      seed: 1,
      timeBudgetMs: 1000,
    });
    expect(response.mutations.length).toBeLessThanOrEqual(2);
  });

  it("maximize is untouched by the small-target layer (regression fence)", () => {
    // The iteration cap must be the BINDING limit: with a tight wall clock the
    // deadline fires at a load-dependent iteration count and two "identical"
    // runs legitimately diverge (this flaked under full-suite CPU contention).
    const budget = { seed: 7, timeBudgetMs: 60_000, iterations: 150_000 };
    const a = solveLocal(FULL_GRID, [{ mutation: "choconut", maximize: true, count: null }], dataset, budget);
    const b = solveLocal(FULL_GRID, [{ mutation: "choconut", maximize: true, count: null }], dataset, budget);
    // Deterministic and byte-identical with itself; the capped branch must not
    // have touched the maximize path at all.
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.solver_approach).not.toContain("flank-chain");
  });

  it("full-ring targets decline the chain and stay legal (noctilume 2)", () => {
    const response = solveLocal(FULL_GRID, [{ mutation: "noctilume", maximize: false, count: 2 }], dataset, {
      seed: 1,
      timeBudgetMs: 2000,
    });
    expect(validateSolveResponse(response, FULL_GRID, dataset).valid).toBe(true);
    expect(response.mutations.length).toBe(2);
  });
});
