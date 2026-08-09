import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { CropDefinition, MutationDefinition } from "../../types/greenhouse";
import { buildPlanEstimates, type EstimateSettings } from "../planEstimates";
import { buildSolverPlan, type PlotEconomy } from "../solverPlan";
import { needSplit } from "../needSplit";

/**
 * Two discounts, composed in the right order.
 *
 * Owning a mutation and owning its base crops are different kinds of saving and
 * they must not be conflated:
 *
 *   mutation stock  removes plantings. The job itself gets smaller.
 *   crop stock      removes nothing from the job. The same plantings still
 *                   happen; you already hold some of what they consume.
 *
 * So the crop bill has to be measured against the plantings that survive the
 * mutation discount, and only then reduced. The bug this file exists to catch
 * is the tempting parallel version, where both discounts are applied against
 * the original figures: a player owning both would be shown a bill below what
 * they actually have to gather, and would only discover it by running out
 * mid grind.
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

/** Choconut: 72 spots a plot, 26 Cocoa Beans sown per planting. */
const ECONOMIES: Record<string, PlotEconomy | null> = {
  choconut: { yield: 72, crops: { cocoa_beans: 26 } },
};
const SETTINGS: EstimateSettings = { cropGrowth: 0, speedTier: 0, uniqueCrops: 0, plots: 1 };

const run = (qty: number, have: Record<string, number> = {}) => {
  const plan = buildSolverPlan([{ id: "choconut", qty }], data, ECONOMIES, have);
  const mutation = plan.cycles.flatMap((c) => c.produce).find((n) => n.id === "choconut");
  const cocoa = plan.baseCrops.find((c) => c.id === "cocoa_beans");
  return { plan, mutation, cocoa, estimates: buildPlanEstimates(plan, data, ECONOMIES, SETTINGS) };
};

describe("the base crop bill takes owned stock off", () => {
  it("reduces the gather total, and shows its working", () => {
    const bare = run(2624);
    const owned = run(2624, { cocoa_beans: 900 });

    // Same plantings either way: crop stock buys no plantings back.
    expect(owned.mutation?.plots).toBe(bare.mutation?.plots);
    expect(owned.cocoa!.need).toBe(bare.cocoa!.need - 900);

    const split = needSplit(owned.cocoa!);
    expect(split).toEqual({ raw: bare.cocoa!.need, owned: 900, remaining: bare.cocoa!.need - 900, discounted: true, covered: false });
  });

  it("leaves the bill alone when you own none", () => {
    const bare = run(2624);
    expect(needSplit(bare.cocoa!).discounted).toBe(false);
    expect(needSplit(bare.cocoa!).remaining).toBe(bare.cocoa!.need);
  });

  it("clamps at zero and says so when your stock covers the whole bill", () => {
    const covered = run(2624, { cocoa_beans: 10_000_000 });
    expect(covered.cocoa!.need).toBe(0);
    const split = needSplit(covered.cocoa!);
    expect(split.remaining).toBe(0);
    expect(split.covered).toBe(true);
    // No negative bill, and the raw figure survives so the row can still say
    // what it would have cost.
    expect(split.raw).toBeGreaterThan(0);
    expect(split.owned).toBe(split.raw);
  });
});

describe("the two discounts compose sequentially, never in parallel", () => {
  it("measures the crop bill against the plantings that actually remain", () => {
    const bare = run(2624);
    // 400 rather than 900: at 34 surviving plantings the bill is 884, so 900
    // would cover it outright and the partial case is the one worth pinning.
    const both = run(2624, { choconut: 245, cocoa_beans: 400 });

    // The mutation discount shrinks the job first.
    expect(bare.mutation?.plots).toBe(37);
    expect(both.mutation?.plots).toBe(34);

    // The crop bill is 26 per surviving planting, and only then less the stock.
    const billAfterMutationDiscount = 26 * 34;
    expect(billAfterMutationDiscount).toBe(884);
    expect(needSplit(both.cocoa!).raw).toBe(billAfterMutationDiscount);
    expect(both.cocoa!.need).toBe(884 - 400);
  });

  it("is NOT the naive double count, which would understate the gather bill", () => {
    const both = run(2624, { choconut: 245, cocoa_beans: 400 });

    /*
     * The bug shape: credit the mutation saving twice. Owning 245 Choconut
     * already removed 3 plantings, which is 78 Cocoa Beans off the bill.
     * Counting that 78 a second time, as though it were crop stock sitting in
     * a sack alongside the real 400, gives 406 instead of 484.
     */
    const mutationSavingInCocoa = 26 * 37 - 26 * 34;
    expect(mutationSavingInCocoa).toBe(78);
    const naiveDoubleCounted = 26 * 34 - 400 - mutationSavingInCocoa;

    expect(both.cocoa!.need).toBe(484);
    expect(both.cocoa!.need).not.toBe(naiveDoubleCounted);

    // The honest figure is the LARGER one, which is the direction that matters:
    // a plan may overstate the work, never understate it.
    expect(both.cocoa!.need).toBeGreaterThan(naiveDoubleCounted);
  });

  it("never spends one pool of stock on two rows", () => {
    // Cocoa Beans are a crop, not a mutation, so the mutation tiers cannot have
    // consumed them; and owning the mutation must not also discount the crop.
    const onlyMutation = run(2624, { choconut: 245 });
    expect(needSplit(onlyMutation.cocoa!).discounted).toBe(false);
    expect(onlyMutation.cocoa!.need).toBe(26 * 34);
  });
});

describe("the shared estimate path is untouched by the crop discount", () => {
  it("changes the gather bill without moving any planting time", () => {
    // Crop stock buys no time back: the same plantings still have to grow.
    const withoutCrops = run(2624, { choconut: 245 });
    const withCrops = run(2624, { choconut: 245, cocoa_beans: 900 });

    expect(withCrops.estimates.total.expectedSeconds).toBe(withoutCrops.estimates.total.expectedSeconds);
    expect(withCrops.estimates.byId.choconut.expectedSeconds).toBe(withoutCrops.estimates.byId.choconut.expectedSeconds);
    expect(withCrops.plan.totalPlantings).toBe(withoutCrops.plan.totalPlantings);
  });

  it("keeps the mutation discount working exactly as it did", () => {
    const both = run(2624, { choconut: 245, cocoa_beans: 900 });
    expect(both.mutation?.need).toBe(2379);
    expect(needSplit(both.mutation!)).toEqual({ raw: 2624, owned: 245, remaining: 2379, discounted: true, covered: false });
  });
});
