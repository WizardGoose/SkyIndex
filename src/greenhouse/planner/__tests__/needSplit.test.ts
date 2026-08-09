import { describe, expect, it } from "vitest";
import { needSplit } from "../needSplit";
import { buildSolverPlan, type PlotEconomy } from "../solverPlan";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { CropDefinition, MutationDefinition } from "../../types/greenhouse";

/**
 * The split that stops a number changing meaning behind the player's back.
 *
 * The rule under test is narrow and worth stating: the split appears exactly
 * when a discount was actually applied, and never otherwise. A row nobody owns
 * any of must stay as clean as it was before this feature existed, because
 * three figures where one would do is its own kind of dishonesty.
 */

const node = (need: number, have: number) => ({ need, have });

describe("needSplit", () => {
  it("splits into raw, owned and remaining when you own some", () => {
    // The live Choconut row: 2,624 asked for, 245 owned, 2,379 left.
    expect(needSplit(node(2379, 245))).toEqual({ raw: 2624, owned: 245, remaining: 2379, discounted: true, covered: false });
  });

  it("stays off when you own none, so unowned rows read exactly as before", () => {
    const split = needSplit(node(2624, 0));
    expect(split.discounted).toBe(false);
    expect(split.remaining).toBe(2624);
    // No invented raw figure: with nothing owned, raw and remaining are one number.
    expect(split.raw).toBe(2624);
  });

  it("stays off when there is nothing left to grow", () => {
    // Only the unplannable rows reach here with need 0, and the stock covered
    // the whole requirement, so `remaining + owned` is not the raw figure.
    expect(needSplit(node(0, 500)).discounted).toBe(false);
    expect(needSplit(node(0, 0)).discounted).toBe(false);
  });

  it("never produces a negative or a fabricated figure from junk input", () => {
    expect(needSplit(node(-5, -5))).toEqual({ raw: 0, owned: 0, remaining: 0, discounted: false, covered: false });
    expect(needSplit(node(Number.NaN, 10)).remaining).toBe(0);
    expect(needSplit(node(10, Number.NaN)).owned).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// The identity the split rests on, checked against the real solver plan rather
// than assumed: raw really is what the plan asked for before the discount.
// ---------------------------------------------------------------------------

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
const ECONOMIES: Record<string, PlotEconomy | null> = {
  gloomgourd: { yield: 72, crops: { pumpkin: 20, melon: 20 } },
  choconut: { yield: 72, crops: { cocoa_beans: 26 } },
};

const rowFor = (id: string, qty: number, have: Record<string, number>) =>
  buildSolverPlan([{ id, qty }], data, ECONOMIES, have)
    .cycles.flatMap((c) => c.produce)
    .find((n) => n.id === id);

describe("the split reconstructs the undiscounted plan exactly", () => {
  it("recovers the same raw need the plan would show with nothing owned", () => {
    const bare = rowFor("choconut", 2624, {});
    const owned = rowFor("choconut", 2624, { choconut: 245 });

    expect(bare?.need).toBe(2624);
    expect(owned?.need).toBe(2379);
    // The number the player used to see, recovered from the discounted row.
    expect(needSplit(owned!).raw).toBe(bare!.need);
  });

  it("holds for a second row with a different stock", () => {
    const bare = rowFor("gloomgourd", 702, {});
    const owned = rowFor("gloomgourd", 702, { gloomgourd: 106 });
    expect(needSplit(owned!).raw).toBe(bare!.need);
    expect(needSplit(owned!)).toEqual({ raw: 702, owned: 106, remaining: 596, discounted: true, covered: false });
  });

  it("shows no split on a row the player owns none of", () => {
    const row = rowFor("choconut", 2624, { gloomgourd: 106 });
    expect(needSplit(row!).discounted).toBe(false);
  });
});
