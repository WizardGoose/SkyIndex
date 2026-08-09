import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { CropDefinition, MutationDefinition } from "../../types/greenhouse";
import { buildPlanEstimates, type EstimateSettings } from "../planEstimates";
import { buildSolverPlan, type PlotEconomy } from "../solverPlan";
import { needSplit } from "../needSplit";

/**
 * What you physically place, and whose stock pays for it.
 *
 * Two things landed together here because they are the same complaint from two
 * directions. The plan spent 106 Gloomgourd on the player's behalf and never
 * mentioned them again: not in the cycle list, not in the gather list, only in
 * the plot preview. So the player could neither SEE the placement nor DECLINE it.
 *
 *   `plan.placed`  every mutation that goes in the ground, with its source, so
 *                  the list finally answers "what do I physically place".
 *   `growFresh`    the spend-or-keep decision handed back, because 106 of
 *                  something might be earmarked for another job entirely.
 *
 * ## The rule the flip must not break
 *
 * `growFresh` declines to spend at the ONE point of subtraction rather than
 * giving stock back afterwards. That is not a style choice. The mutation and
 * crop discounts compose sequentially, in tier order, and a second pass that
 * refunded stock after the fact would be exactly the parallel discount
 * `solverPlan.ts` spends its longest comment warning against. The guards at the
 * bottom pin that, and pin the direction: growing fresh is the MORE expensive
 * answer, and if it ever comes out cheaper something is being counted twice.
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
 * The fixture plot, right-sized, as the solver answers it: 8 spawns off 5 Melon and 5
 * Gloomgourd. Hard-coded so this runs offline and does not move when the solver
 * improves its layouts.
 */
const ECONOMIES: Record<string, PlotEconomy | null> = {
  soggybud: { yield: 8, crops: { melon: 5, gloomgourd: 5 } },
  gloomgourd: { yield: 12, crops: { melon: 3, pumpkin: 2 } },
};
const SETTINGS: EstimateSettings = { cropGrowth: 100, speedTier: 1, uniqueCrops: 0, plots: 1 };

/** The reported case: Melon Juice Mixin wants 2 Soggybud, the sack holds 106. */
const HIS_STOCK = { gloomgourd: 106 };

const run = (have: Record<string, number> = {}, growFresh = new Set<string>()) => {
  const plan = buildSolverPlan([{ id: "soggybud", qty: 2 }], data, ECONOMIES, have, growFresh);
  const nodes = plan.cycles.flatMap((c) => c.produce);
  return {
    plan,
    nodes,
    estimates: buildPlanEstimates(plan, data, ECONOMIES, SETTINGS),
    soggybud: nodes.find((n) => n.id === "soggybud"),
    gloomgourd: nodes.find((n) => n.id === "gloomgourd"),
    melon: plan.baseCrops.find((c) => c.id === "melon"),
    placedGloom: plan.placed.find((p) => p.id === "gloomgourd"),
  };
};

describe("the fixture: 2 Soggybud, 106 Gloomgourd in the sack", () => {
  it("names the Gloomgourd to place, which the plan never used to", () => {
    const r = run(HIS_STOCK);

    // 5 per plot, one planting. The physical act, not the demand.
    expect(r.placedGloom).toEqual({ id: "gloomgourd", name: "Gloomgourd", count: 5, covered: true, have: 106 });

    // Base crops stay crops. The two lists answer different halves of the same
    // question and neither is allowed to swallow the other.
    expect(r.plan.baseCrops.map((c) => c.id)).toEqual(["melon"]);
    expect(r.melon?.need).toBe(5);
  });

  it("still keeps the covered step in the cycle list", () => {
    const r = run(HIS_STOCK);
    expect(r.gloomgourd?.covered).toBe(true);
    expect(r.gloomgourd?.cycle).toBe(0);
    expect(r.soggybud?.cycle).toBe(1);
  });

  it("survives the Hide finished filter, because it is not finished work", () => {
    /*
     * THE ROOT CAUSE OF THE MISSING ROW, pinned as the predicate the ledger
     * uses. A covered row has `plots` of 0, so the old test `done < plots` was
     * `0 < 0` and dropped it, taking the whole cycle section with it when the
     * cycle held nothing else.
     */
    const r = run(HIS_STOCK);
    const kept = (n: { covered?: boolean; plots?: number }, done: number) => Boolean(n.covered) || done < (n.plots ?? 0);

    expect(kept(r.gloomgourd!, 0)).toBe(true);
    // A genuinely finished planting is still hidden, which is what the control
    // promises.
    expect(kept({ plots: 3 }, 3)).toBe(false);
    expect(kept({ plots: 3 }, 1)).toBe(true);
  });

  it("marks a mutation it had to grow as grown, not as stock", () => {
    const bare = run();
    expect(bare.placedGloom?.covered).toBe(false);
    expect(bare.placedGloom?.count).toBe(5);
    expect(bare.gloomgourd?.need).toBe(5);
  });
});

describe("choosing to grow them instead", () => {
  it("declines the stock and prepends the cycles that grow it", () => {
    const spending = run(HIS_STOCK);
    const growing = run(HIS_STOCK, new Set(["gloomgourd"]));

    expect(spending.gloomgourd?.covered).toBe(true);
    expect(spending.gloomgourd?.plots).toBe(0);

    expect(growing.gloomgourd?.covered).toBeUndefined();
    expect(growing.gloomgourd?.need).toBe(5);
    expect(growing.gloomgourd?.plots).toBe(1);
    expect(growing.placedGloom?.covered).toBe(false);
  });

  it("is the more expensive answer, and says so on every axis", () => {
    const spending = run(HIS_STOCK);
    const growing = run(HIS_STOCK, new Set(["gloomgourd"]));

    expect(growing.estimates.total.expectedSeconds).toBeGreaterThan(spending.estimates.total.expectedSeconds);
    expect(growing.plan.totalPlantings).toBeGreaterThan(spending.plan.totalPlantings);
    // Its own base crops join the bill, cascading to true base crops.
    expect(growing.plan.baseCrops.map((c) => c.id).sort()).toEqual(["melon", "pumpkin"]);
  });

  it("does not print a demand that changed meaning behind the player's back", () => {
    /*
     * `needSplit` reconstructs the pre-discount figure as `need + have` when no
     * `rawNeed` was recorded. Growing fresh spends nothing, so without an
     * explicit `rawNeed` the row would read "111 needed, 106 owned" at a row
     * that genuinely asks for 5.
     */
    const growing = run(HIS_STOCK, new Set(["gloomgourd"]));
    const split = needSplit(growing.gloomgourd!);

    expect(split.raw).toBe(5);
    expect(split.remaining).toBe(5);
    expect(split.owned).toBe(0);
    expect(split.discounted).toBe(false);
    expect(split.raw).not.toBe(111);
  });

  it("changes nothing at all unless it is actually used", () => {
    // The default path must not move. An empty set is the same plan, field for
    // field, as no set at all.
    const a = run(HIS_STOCK);
    const b = run(HIS_STOCK, new Set());
    expect(JSON.stringify(b.plan)).toBe(JSON.stringify(a.plan));

    // And flipping something the plan never mentions is inert too.
    const c = run(HIS_STOCK, new Set(["choconut"]));
    expect(JSON.stringify(c.plan)).toBe(JSON.stringify(a.plan));
  });
});

describe("the flip never double counts stock a tier already spent", () => {
  it("is the same plan as simply not owning them", () => {
    /*
     * THE COMPOSITION GUARD. Declining to spend has to land at the one point of
     * subtraction, which means keeping your 106 must produce EXACTLY the plan of
     * a player who has none. Anything else means a second pass is adjusting a
     * discount after the fact, which is the parallel discount this codebase has
     * paid for once already.
     */
    const growing = run(HIS_STOCK, new Set(["gloomgourd"]));
    const ownsNone = run();

    expect(growing.gloomgourd?.need).toBe(ownsNone.gloomgourd?.need);
    expect(growing.gloomgourd?.plots).toBe(ownsNone.gloomgourd?.plots);
    expect(growing.melon?.need).toBe(ownsNone.melon?.need);
    expect(growing.plan.totalPlantings).toBe(ownsNone.plan.totalPlantings);
    expect(growing.estimates.total.expectedSeconds).toBeCloseTo(ownsNone.estimates.total.expectedSeconds, 6);
  });

  it("is NOT the naive refund, which would understate the work", () => {
    const growing = run(HIS_STOCK, new Set(["gloomgourd"]));

    /*
     * The bug shape: decline the spend AND still credit the 106 somewhere, by
     * refunding after the tier walk instead of never spending. The Gloomgourd
     * row would keep the plantings its stock removed, so a job of 1 planting
     * would read as 0 and the Melon its plot eats would vanish with it.
     */
    const naiveRefunded = 0;
    expect(growing.gloomgourd?.plots).toBe(1);
    expect(growing.gloomgourd?.plots).not.toBe(naiveRefunded);
    expect(growing.gloomgourd?.plots).toBeGreaterThan(naiveRefunded);

    // The honest bill is the LARGER one: a plan may overstate the work, never
    // understate it.
    const spending = run(HIS_STOCK);
    expect(growing.melon!.need).toBeGreaterThan(spending.melon!.need);
  });

  it("leaves a pool it declined to spend available to nobody else", () => {
    // Gloomgourd is not a base crop, so the kept stock cannot leak into the
    // gather bill. Melon is billed for the plantings that actually happen.
    const growing = run(HIS_STOCK, new Set(["gloomgourd"]));
    expect(needSplit(growing.melon!).discounted).toBe(false);
    expect(growing.melon!.need).toBe(5 + 3);
  });
});
