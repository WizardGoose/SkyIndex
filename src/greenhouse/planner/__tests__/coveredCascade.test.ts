import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { CropDefinition, MutationDefinition } from "../../types/greenhouse";
import { buildPlanEstimates, planUnitMaps, progressRow, type EstimateSettings } from "../planEstimates";
import { buildSolverPlan, type PlotEconomy } from "../solverPlan";
import { needSplit } from "../needSplit";

/**
 * A recipe broken down all the way to how you actually get it.
 *
 * THE REPORT THIS FILE COMES FROM. The plan for Melon Juice Mixin said
 * "PLANT THIS: Melon and Gloomgourd" and then listed one step, Soggybud, with
 * base crops of Melon alone. Gloomgourd is itself a mutation. Nothing anywhere
 * on the page said where it comes from, because the reported stock held 106 and
 * a row your stock covered was dropped from the plan outright. The one case
 * where the answer is good news was the case that said nothing at all.
 *
 * Two behaviours have to hold together, and they pull in opposite directions:
 *
 *   STOCK COVERS IT. The step stays, marked covered, at zero plantings and
 *   zero seconds, and its inputs are NOT expanded - nothing has to be grown to
 *   produce something you already hold.
 *
 *   STOCK FALLS SHORT. The step is a real cycle in front of the tier that needs
 *   it, and its own base crops join the bill, recursively, down to true base
 *   crops.
 *
 * ## Why the double-count guard below is the load-bearing test here
 *
 * The Planner and the Dashboard once printed 3.7% and 3.8% for one state. The
 * cause was a second derivation of one quantity - a frozen snapshot crediting
 * stock that had since been spent - and the fix was to make both pages read one
 * construction rather than two that agree.
 *
 * A cascade is the same trap wearing a different hat. It is tempting to work
 * out afresh what your stock covers while walking the tree, and any such
 * calculation is a second opinion on a subtraction `buildSolverPlan` already
 * made. Here it would understate: credit the Gloomgourd stock once as the
 * covered step, then a second time against the Melon its plot would have
 * consumed, and the gather bill comes out below what the player has to gather.
 * They would find out by running short mid grind, which is the worst possible
 * moment.
 *
 * So the tests below pin the composed figure against the naive double-counted
 * one AND pin the direction: the honest bill is the LARGER number. A refactor
 * that parallelises these fails loudly rather than quietly understating.
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

/**
 * The two plots, as the greenhouse solver answered them.
 *
 * Soggybud needs 2x Melon and 2x Gloomgourd adjacent, so its plot sows both and
 * the Gloomgourd half is a mutation that has to come from somewhere. Gloomgourd
 * needs Pumpkin and Melon, which are true base crops, so the cascade is exactly
 * two levels deep and terminates.
 */
const ECONOMIES: Record<string, PlotEconomy | null> = {
  soggybud: { yield: 52, crops: { melon: 27, gloomgourd: 21 } },
  gloomgourd: { yield: 72, crops: { pumpkin: 15, melon: 12 } },
};

const SETTINGS: EstimateSettings = { cropGrowth: 100, speedTier: 1, uniqueCrops: 0, plots: 1 };

const run = (qty: number, have: Record<string, number> = {}) => {
  const plan = buildSolverPlan([{ id: "soggybud", qty }], data, ECONOMIES, have);
  const nodes = plan.cycles.flatMap((c) => c.produce);
  const estimates = buildPlanEstimates(plan, data, ECONOMIES, SETTINGS);
  return {
    plan,
    estimates,
    nodes,
    soggybud: nodes.find((n) => n.id === "soggybud"),
    gloomgourd: nodes.find((n) => n.id === "gloomgourd"),
    melon: plan.baseCrops.find((c) => c.id === "melon"),
    pumpkin: plan.baseCrops.find((c) => c.id === "pumpkin"),
  };
};

/** One planting of Gloomgourd consumes this much Melon. */
const GLOOMGOURD_MELON = 12;

describe("the reported case, 106 Gloomgourd in the sack", () => {
  it("shows the acquisition step it used to hide", () => {
    const covered = run(2, { gloomgourd: 106 });

    // It is in the plan, in the cycle it would have been grown in.
    expect(covered.gloomgourd).toBeDefined();
    expect(covered.gloomgourd?.covered).toBe(true);
    expect(covered.gloomgourd?.cycle).toBe(0);
    expect(covered.soggybud?.cycle).toBe(1);

    // The figures the credit line is printed from: 21 asked for, 106 held.
    expect(needSplit(covered.gloomgourd!).raw).toBe(21);
    expect(needSplit(covered.gloomgourd!).covered).toBe(true);
    expect(covered.gloomgourd?.have).toBe(106);
  });

  it("prices that step at nothing, on every axis", () => {
    const covered = run(2, { gloomgourd: 106 });

    expect(covered.gloomgourd?.need).toBe(0);
    expect(covered.gloomgourd?.plots).toBe(0);
    expect(covered.estimates.byId.gloomgourd.expectedSeconds).toBe(0);
    expect(covered.estimates.byId.gloomgourd.expectedSecondsLeft).toBe(0);

    // And no cycle appears out of nowhere in the totals.
    expect(covered.plan.totalPlantings).toBe(1);
    expect(covered.estimates.total.expectedSeconds).toBe(covered.estimates.byId.soggybud.expectedSeconds);
  });

  it("does not grow base crops for something already in the sack", () => {
    const covered = run(2, { gloomgourd: 106 });

    // Soggybud's own plot bill, and nothing from a Gloomgourd plot that is
    // never sown.
    expect(covered.melon?.need).toBe(27);
    expect(covered.pumpkin).toBeUndefined();
  });
});

describe("the shortfall case, nothing in the sack", () => {
  it("prepends the cycle that grows it, and bills its base crops", () => {
    const bare = run(2);

    expect(bare.gloomgourd?.covered).toBeUndefined();
    expect(bare.gloomgourd?.need).toBe(21);
    expect(bare.gloomgourd?.plots).toBe(1);
    expect(bare.gloomgourd?.cycle).toBe(0);

    // The base crop summary reflects the FULL cascade, not just the top level:
    // Soggybud's 27 Melon plus the Gloomgourd plot's 12, plus its Pumpkin.
    expect(bare.melon?.need).toBe(27 + GLOOMGOURD_MELON);
    expect(bare.pumpkin?.need).toBe(15);
  });

  it("is the longer, honest total", () => {
    const bare = run(2);
    const covered = run(2, { gloomgourd: 106 });

    expect(bare.estimates.total.expectedSeconds).toBeGreaterThan(covered.estimates.total.expectedSeconds);
    expect(bare.plan.totalPlantings).toBeGreaterThan(covered.plan.totalPlantings);
  });

  it("cascades all the way down, never stopping at a mutation", () => {
    const bare = run(2);
    // Every base crop row is a crop the dataset knows as a crop, so nothing in
    // the gather list is secretly a mutation the plan forgot to explain.
    for (const c of bare.plan.baseCrops) {
      expect(data.mutations[c.id]).toBeUndefined();
      expect(data.crops[c.id]).toBeDefined();
    }
    // And every mutation the recipe reaches has a step of its own.
    expect(bare.nodes.map((n) => n.id).sort()).toEqual(["gloomgourd", "soggybud"]);
  });
});

describe("the cascade never credits stock a higher level already spent", () => {
  it("takes off exactly the Gloomgourd plot, and not a unit more", () => {
    const bare = run(2);
    const covered = run(2, { gloomgourd: 106 });

    /*
     * Covering the Gloomgourd removes its planting, and with it the Melon that
     * planting would have eaten. Exactly that, once.
     */
    expect(covered.melon!.need).toBe(bare.melon!.need - GLOOMGOURD_MELON);
  });

  it("is NOT the naive double count, which would understate the gather bill", () => {
    const covered = run(2, { gloomgourd: 106 });

    /*
     * The bug shape: credit the Gloomgourd stock twice. Once as the covered
     * step, which correctly removes its planting and that planting's 12 Melon,
     * and then a second time against the Melon bill, as though those same 12
     * were Melon sitting in a sack alongside the real holding. That gives 15
     * where the honest figure is 27.
     */
    const naiveDoubleCounted = 27 - GLOOMGOURD_MELON;
    expect(naiveDoubleCounted).toBe(15);

    expect(covered.melon!.need).toBe(27);
    expect(covered.melon!.need).not.toBe(naiveDoubleCounted);

    // The honest figure is the LARGER one, which is the direction that matters:
    // a plan may overstate the work, never understate it.
    expect(covered.melon!.need).toBeGreaterThan(naiveDoubleCounted);
  });

  it("never spends one pool of stock on two rows", () => {
    // Gloomgourd stock is not Melon stock. Covering the mutation must leave the
    // crop bill undiscounted, showing its full figure rather than a quiet cut.
    const covered = run(2, { gloomgourd: 106 });
    expect(needSplit(covered.melon!).discounted).toBe(false);
    expect(needSplit(covered.melon!).remaining).toBe(27);
  });

  it("covers the bill, never the whole holding", () => {
    /*
     * The `min(owned, wanted)` clamp, seen from the covered side. 106 held
     * against a bill of 21 spends 21. A cascade that credited the holding
     * instead would have 85 phantom units of demand to give away to the next
     * row that asked.
     */
    const covered = run(2, { gloomgourd: 106 });
    const split = needSplit(covered.gloomgourd!);
    expect(split.raw).toBe(21);
    expect(split.owned).toBe(21);
    expect(split.owned).not.toBe(106);
  });

  it("shortens the tier it feeds, and nothing else", () => {
    const bare = run(2);
    const covered = run(2, { gloomgourd: 106 });

    /*
     * The whole saving is the Gloomgourd row's own clock. Soggybud still has to
     * be grown, at exactly the time it always took: holding an ingredient does
     * not make the thing it feeds grow faster. A double credit would show up
     * here as a total below the difference.
     */
    expect(covered.estimates.byId.soggybud.expectedSeconds).toBeCloseTo(bare.estimates.byId.soggybud.expectedSeconds, 6);
    expect(covered.estimates.total.expectedSeconds).toBeCloseTo(
      bare.estimates.total.expectedSeconds - bare.estimates.byId.gloomgourd.expectedSeconds,
      6
    );
  });
});

describe("a covered step does not break what the plan persists", () => {
  it("states its units, so the all-or-none map still comes out whole", () => {
    /*
     * `planUnitMaps` returns all three maps or null, and a single row that
     * cannot state `wanted`, `need` and `perPlot` collapses the lot. A covered
     * row has a real yield behind it, so it states all three - `perPlot` from
     * the solver, `plots` of 0 - rather than dragging the Dashboard onto the
     * planting-weighted fallback for every other row too.
     */
    const covered = run(2, { gloomgourd: 106 });
    const units = planUnitMaps(covered.nodes.map(progressRow));

    expect(units).not.toBeNull();
    expect(units!.wantedOf.gloomgourd).toBe(21);
    expect(units!.needOf.gloomgourd).toBe(0);
    expect(units!.perPlotOf.gloomgourd).toBe(72);
  });

  it("stays hidden rather than costing every other row its unit figures", () => {
    /*
     * A covered row with no solver answer cannot name a yield, and all-or-none
     * means one such row would collapse the maps for the WHOLE plan and drop
     * the Dashboard onto the planting-weighted fallback. Good news must not be
     * able to make the rest of the page worse, so an unmeasured covered row
     * behaves exactly as it did before this change: it does not appear.
     */
    const unsolved = buildSolverPlan(
      [{ id: "soggybud", qty: 2 }],
      data,
      { ...ECONOMIES, gloomgourd: null },
      { gloomgourd: 106 }
    );
    const nodes = unsolved.cycles.flatMap((c) => c.produce);

    expect(nodes.find((n) => n.id === "gloomgourd")).toBeUndefined();
    expect(planUnitMaps(nodes.map(progressRow))).not.toBeNull();
  });
});
