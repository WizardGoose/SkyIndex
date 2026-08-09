import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { CropDefinition, MutationDefinition } from "../../types/greenhouse";
import { buildPlanEstimates, type EstimateSettings } from "../planEstimates";
import { buildSolverPlan, type PlotEconomy } from "../solverPlan";

/**
 * Owned counts must come off the plan, once and only once.
 *
 * The discount is not a separate calculation bolted onto the estimates. It
 * happens exactly where demand becomes plantings, in `buildSolverPlan`:
 *
 *   need = wanted - min(owned, wanted)
 *
 * and everything downstream reads that already-reduced `need`. `node.plots`
 * comes from it, `nodeEstimate` is handed it as `demand.need`, the cycle rows
 * and grand total sum those, and the Dashboard snapshot records them. One
 * subtraction, one path, no second opinion.
 *
 * These tests exist because a second discount is a genuinely tempting bug: the
 * estimates layer also has `need` and `have` in scope, and re-applying
 * `max(0, need - owned)` there looks harmless while quietly removing the stock
 * twice. The Gloomgourd row below is the live case that would have caught it -
 * 702 wanted against 106 owned is 596, and never 490.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const raw = JSON.parse(readFileSync(join(ROOT, "public/greenhouse/data.json"), "utf8")) as {
  crops: Record<string, Omit<CropDefinition, "id">>;
  mutations: Record<string, Omit<MutationDefinition, "id">>;
};
const withIds = <T,>(rec: Record<string, T>): Record<string, T & { id: string }> =>
  Object.fromEntries(Object.entries(rec).map(([id, v]) => [id, { ...v, id }]));
const data = { crops: withIds(raw.crops), mutations: withIds(raw.mutations) } as {
  crops: Record<string, CropDefinition>;
  mutations: Record<string, MutationDefinition>;
};

/** Solver answers captured from `npx tsx tools/solver-plan.ts`, so this runs offline. */
const ECONOMIES: Record<string, PlotEconomy | null> = {
  gloomgourd: { yield: 72, crops: { pumpkin: 20, melon: 20 } },
  choconut: { yield: 72, crops: { cocoa_beans: 26 } },
};

const SETTINGS: EstimateSettings = { cropGrowth: 0, speedTier: 0, uniqueCrops: 0, plots: 1 };

const plan = (id: string, qty: number, have: Record<string, number> = {}) => {
  const p = buildSolverPlan([{ id, qty }], data, ECONOMIES, have);
  const node = p.cycles.flatMap((c) => c.produce).find((n) => n.id === id);
  const estimates = buildPlanEstimates(p, data, ECONOMIES, SETTINGS);
  return { plan: p, node, est: estimates.byId[id], estimates };
};

describe("the owned discount reaches every number", () => {
  it("takes owned off the need, the plantings and the time", () => {
    const none = plan("gloomgourd", 702);
    const owned = plan("gloomgourd", 702, { gloomgourd: 106 });

    expect(none.node?.need).toBe(702);
    expect(owned.node?.need).toBe(596);

    // Fewer plantings, and a shorter clock, from the same single subtraction.
    expect(owned.node?.plots).toBeLessThan(none.node?.plots ?? 0);
    expect(owned.est.expectedSeconds).toBeLessThan(none.est.expectedSeconds);
    expect(owned.est.p90Seconds).toBeLessThan(none.est.p90Seconds);
  });

  it("carries the same reduction into the cycle rollup and the grand total", () => {
    const none = plan("choconut", 2624);
    const owned = plan("choconut", 2624, { choconut: 245 });

    expect(owned.node?.need).toBe(2379);
    expect(owned.estimates.total.expectedSeconds).toBeLessThan(none.estimates.total.expectedSeconds);

    // The rollup is the sum of its rows, through the shared path, not a
    // separately computed figure that could disagree with them.
    const cycle = owned.estimates.cycles.find((c) => c.index === owned.node?.cycle);
    const sum = owned.plan.cycles
      .find((c) => c.index === owned.node?.cycle)!
      .produce.reduce((s, n) => s + (owned.estimates.byId[n.id]?.expectedSeconds ?? 0), 0);
    expect(cycle?.expectedSeconds).toBeCloseTo(sum, 6);
  });

  it("discounts exactly once, never twice", () => {
    // The double-discount bug would land here: 702 - 106 - 106 = 490.
    const owned = plan("gloomgourd", 702, { gloomgourd: 106 });
    expect(owned.node?.need).toBe(596);
    expect(owned.node?.need).not.toBe(490);

    // And the estimate is measured against that need, not against a second one.
    const direct = plan("gloomgourd", 596);
    expect(owned.est.expectedSeconds).toBeCloseTo(direct.est.expectedSeconds, 6);
    expect(owned.node?.plots).toBe(direct.node?.plots);
  });

  it("clamps at zero when you already own more than the plan asks for", () => {
    /*
     * `need = wanted - min(owned, wanted)` cannot go negative, and a row with
     * nothing left to grow costs nothing.
     *
     * It used to VANISH, and that was the bug: a covered row is an acquisition
     * step for the tier above it, so dropping it left the plan telling you to
     * plant an ingredient it never explained where to get. It stays now, marked
     * covered, priced at zero on every axis.
     */
    const owned = plan("gloomgourd", 100, { gloomgourd: 5_000 });
    expect(owned.node?.need).toBe(0);
    expect(owned.node?.covered).toBe(true);
    expect(owned.node?.plots).toBe(0);
    expect(owned.plan.totalPlantings).toBe(0);
    // No negative clock, and no phantom time for a job already done.
    expect(owned.estimates.total.expectedSeconds).toBe(0);
    expect(owned.estimates.total.p90Seconds).toBe(0);
  });

  it("survives owning exactly the amount required", () => {
    const exact = plan("gloomgourd", 702, { gloomgourd: 702 });
    expect(exact.node?.need).toBe(0);
    expect(exact.node?.covered).toBe(true);
    expect(exact.plan.totalPlantings).toBe(0);
    expect(exact.estimates.total.expectedSeconds).toBe(0);

    // One short of it still leaves a real, positive job, and is NOT covered.
    const nearly = plan("gloomgourd", 702, { gloomgourd: 701 });
    expect(nearly.node?.need).toBe(1);
    expect(nearly.node?.plots).toBe(1);
    expect(nearly.node?.covered).toBeUndefined();
    expect(nearly.estimates.total.expectedSeconds).toBeGreaterThan(0);
  });

  it("leaves untouched anything the player does not own", () => {
    const none = plan("choconut", 2624);
    const other = plan("choconut", 2624, { gloomgourd: 106 });
    expect(other.node?.need).toBe(none.node?.need);
    expect(other.est.expectedSeconds).toBeCloseTo(none.est.expectedSeconds, 6);
  });
});
