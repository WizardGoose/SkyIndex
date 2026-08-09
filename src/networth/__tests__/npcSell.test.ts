import { describe, expect, it } from "vitest";
import { npcSellSummary, type NpcSellSource } from "../npcSell";

/**
 * The defining example is the spec: enchanted mithril in chests AND in
 * sacks is one row, both counts found, valued at the NPC unit price. Items no
 * NPC buys are excluded and the exclusion is counted, never silent.
 */

const PRICES: Record<string, number> = {
  ENCHANTED_MITHRIL: 800,
  WHEAT: 1,
  HYPERION: 10,
};

const priceOf = (id: string) => PRICES[id] ?? null;

const sources = (over: Partial<Record<string, NpcSellSource["items"]>>): NpcSellSource[] =>
  [
    { label: "sacks", items: over.sacks ?? [] },
    { label: "chests", items: over.chests ?? [] },
    { label: "inventory", items: over.inventory ?? [] },
  ];

describe("npcSellSummary", () => {
  it("finds the same item across sources and totals it once", () => {
    const summary = npcSellSummary(
      sources({
        sacks: [{ id: "ENCHANTED_MITHRIL", name: "Enchanted Mithril", count: 1000 }],
        chests: [{ id: "ENCHANTED_MITHRIL", name: "Enchanted Mithril", count: 1000 }],
      }),
      priceOf
    );

    expect(summary.rows).toHaveLength(1);
    const row = summary.rows[0];
    expect(row.count).toBe(2000);
    expect(row.unit).toBe(800);
    expect(row.total).toBe(1_600_000);
    expect(summary.total).toBe(1_600_000);
    // The breakdown keeps the halves apart, in source order.
    expect(row.sources).toEqual([
      { label: "sacks", count: 1000 },
      { label: "chests", count: 1000 },
    ]);
  });

  it("sums repeated stacks within one source", () => {
    const summary = npcSellSummary(
      sources({
        chests: [
          { id: "WHEAT", name: "Wheat", count: 64 },
          { id: "WHEAT", name: "Wheat", count: 32 },
        ],
      }),
      priceOf
    );
    expect(summary.rows[0].count).toBe(96);
    expect(summary.rows[0].sources).toEqual([{ label: "chests", count: 96 }]);
  });

  it("excludes unpriced items from the total and counts the exclusion", () => {
    const summary = npcSellSummary(
      sources({
        sacks: [{ id: "ENCHANTED_MITHRIL", name: "Enchanted Mithril", count: 10 }],
        inventory: [
          { id: "ENCHANTMENT_ULTIMATE_WISE_5", name: "Ultimate Wise 5", count: 3 },
          { id: "SOME_ACCESSORY", name: "Some Accessory", count: 1 },
        ],
      }),
      priceOf
    );

    expect(summary.rows).toHaveLength(1);
    expect(summary.rows[0].id).toBe("ENCHANTED_MITHRIL");
    expect(summary.unpricedIds).toBe(2);
    expect(summary.unpricedCount).toBe(4);
  });

  it("treats a zero price as no price, because zero coins is not a market", () => {
    const summary = npcSellSummary(
      sources({ sacks: [{ id: "FREE_ITEM", name: "Free Item", count: 5 }] }),
      () => 0
    );
    expect(summary.rows).toHaveLength(0);
    expect(summary.unpricedIds).toBe(1);
  });

  it("sorts biggest total first, name as the tiebreak", () => {
    const summary = npcSellSummary(
      sources({
        sacks: [
          { id: "WHEAT", name: "Wheat", count: 10 },
          { id: "HYPERION", name: "Hyperion", count: 1 },
          { id: "ENCHANTED_MITHRIL", name: "Enchanted Mithril", count: 5 },
        ],
      }),
      priceOf
    );
    // Wheat and Hyperion tie at 10 coins, so the name breaks it.
    expect(summary.rows.map((r) => r.id)).toEqual(["ENCHANTED_MITHRIL", "HYPERION", "WHEAT"]);
  });

  it("prefers the resolver's name, falls back to the stack's, then the id", () => {
    const summary = npcSellSummary(
      sources({
        sacks: [
          { id: "ENCHANTED_MITHRIL", name: "", count: 1 },
          { id: "WHEAT", name: "wheat from a stack", count: 1 },
        ],
      }),
      priceOf,
      (id) => (id === "ENCHANTED_MITHRIL" ? "Enchanted Mithril" : null)
    );
    const byId = Object.fromEntries(summary.rows.map((r) => [r.id, r.name]));
    expect(byId.ENCHANTED_MITHRIL).toBe("Enchanted Mithril");
    expect(byId.WHEAT).toBe("wheat from a stack");
  });

  it("ignores zero and negative counts rather than valuing them", () => {
    const summary = npcSellSummary(
      sources({
        sacks: [
          { id: "WHEAT", name: "Wheat", count: 0 },
          { id: "ENCHANTED_MITHRIL", name: "Enchanted Mithril", count: -3 },
        ],
      }),
      priceOf
    );
    expect(summary.rows).toHaveLength(0);
    expect(summary.total).toBe(0);
    expect(summary.unpricedIds).toBe(0);
  });

  it("returns an honest empty summary for no sources at all", () => {
    const summary = npcSellSummary([], priceOf);
    expect(summary).toEqual({ total: 0, rows: [], unpricedIds: 0, unpricedCount: 0 });
  });
});
