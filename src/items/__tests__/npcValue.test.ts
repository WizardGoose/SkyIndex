import { describe, it, expect } from "vitest";
import { buildCostTree, collectRawMaterials, sumNpcValue, type ItemIndex, type Item } from "../useItemData";

/**
 * NPC valuation on Ironman.
 *
 * On Ironman there is no bazaar and no auction house, so every coin figure the
 * old build showed was blank. The replacement is what an NPC pays. The whole
 * risk in that change is a missing price quietly becoming zero, which would
 * make a gather list of unsellable items look worthless and, worse, make one
 * expensive branch look free. These tests exist mostly to pin that down.
 */

const item = (over: Partial<Item> & { name: string }): Item => ({
  hypixelId: over.name.toUpperCase().replace(/ /g, "_"),
  tier: null,
  category: null,
  npcSell: null,
  yields: 1,
  recipe: null,
  ...over,
});

/** Enchanted Bread is crafted from Wheat; Mystery Slab has no NPC price. */
const ITEMS: ItemIndex = {
  wheat: item({ name: "Wheat", npcSell: 3 }),
  slab: item({ name: "Mystery Slab", npcSell: null }),
  bread: item({
    name: "Enchanted Bread",
    npcSell: 500,
    recipe: [
      { id: "wheat", name: "Wheat", qty: 32 },
      { id: "slab", name: "Mystery Slab", qty: 2 },
    ],
  }),
};

describe("npcValue on a cost tree", () => {
  it("scales the NPC price by the quantity at that node", () => {
    const tree = buildCostTree("wheat", 10, ITEMS, {}, true);
    expect(tree.npcValue).toBe(30);
  });

  it("stays null for an item with no NPC price, never zero", () => {
    const tree = buildCostTree("slab", 64, ITEMS, {}, true);
    expect(tree.npcValue).toBeNull();
    // The distinction that matters: null renders as unknown, 0 would render as
    // a real and confident valuation of nothing.
    expect(tree.npcValue).not.toBe(0);
  });

  it("is populated on children as well as the root", () => {
    const tree = buildCostTree("bread", 1, ITEMS, {}, true);
    const wheat = tree.children.find((c) => c.id === "wheat");
    const slab = tree.children.find((c) => c.id === "slab");
    expect(wheat?.npcValue).toBe(96); // 32 wheat at 3
    expect(slab?.npcValue).toBeNull();
  });

  it("does not turn NPC value into a buy decision on Ironman", () => {
    const tree = buildCostTree("bread", 1, ITEMS, {}, true);
    // Ironman cannot buy anything, so the tree must still expand to raw
    // materials. A valuation is not a purchase option.
    expect(tree.children).toHaveLength(2);
    expect(tree.action).not.toBe("buy");
    expect(tree.buyCost).toBeNull();
    expect(tree.npcValue).toBe(500);
  });

  it("keeps bazaar pricing untouched off Ironman", () => {
    const prices = { WHEAT: { buy: 7, sell: 5 } };
    const tree = buildCostTree("wheat", 10, ITEMS, prices, false);
    expect(tree.buyCost).toBe(70);
    // Valuation is computed in both modes; it simply is not shown off Ironman.
    expect(tree.npcValue).toBe(30);
  });
});

describe("sumNpcValue", () => {
  it("totals what it can price and counts what it cannot", () => {
    const tree = buildCostTree("bread", 1, ITEMS, {}, true);
    const materials = [...collectRawMaterials(tree).entries()].map(([id, v]) => ({ id, ...v }));
    const roll = sumNpcValue(materials, ITEMS);

    expect(roll.total).toBe(96); // wheat only
    expect(roll.known).toBe(1);
    expect(roll.unknown).toBe(1); // the slab
  });

  it("never lets an unpriced material silently count as zero", () => {
    const roll = sumNpcValue([{ id: "slab", qty: 1000 }], ITEMS);
    expect(roll.known).toBe(0);
    expect(roll.unknown).toBe(1);
    // total is 0 because nothing was priced, but `known: 0` is what tells the
    // caller to render "?" rather than a confident zero.
    expect(roll.total).toBe(0);
  });

  it("ignores materials that are not in the index at all", () => {
    const roll = sumNpcValue([{ id: "ghost", qty: 5 }], ITEMS);
    expect(roll.known).toBe(0);
    expect(roll.unknown).toBe(1);
  });

  it("adds up several priced materials", () => {
    const roll = sumNpcValue(
      [
        { id: "wheat", qty: 10 },
        { id: "bread", qty: 2 },
      ],
      ITEMS
    );
    expect(roll.total).toBe(30 + 1000);
    expect(roll.known).toBe(2);
    expect(roll.unknown).toBe(0);
  });
});
