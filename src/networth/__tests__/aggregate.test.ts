import { describe, expect, it } from "vitest";
import { calculateNetworth } from "../profileNetworth";
import { valueBasicItem } from "../basicValue";
import { TEST_CATALOGUE, TEST_PRICES } from "./testPrices";
import itemFixture from "./fixtures/items.json";
import petFixture from "./fixtures/pets.json";
import type { ParsedItems } from "../profileNetworth";
import type { CoinBalances, PetData, RawItem } from "../types";

/**
 * Sacks and essence, and then the category aggregator.
 *
 * The aggregator is where the two totals diverge, so the soulbound split is
 * tested here rather than at item level: the split is a statement about a
 * PROFILE (what could you actually realise) and it is only meaningful once
 * several items with different soulbound states are added up together.
 */

const items = itemFixture.items as unknown as Record<string, RawItem>;
const pets = petFixture.pets as unknown as Record<string, PetData>;

const options = { prices: TEST_PRICES, catalogue: TEST_CATALOGUE };
const NO_COINS: CoinBalances = { purse: 0, bank: 0, personalBank: 0 };

describe("basic items", () => {
  it("is price times amount and nothing else", () => {
    const result = valueBasicItem({ id: "WHEAT", amount: 40_000 }, options);
    expect(result).toMatchObject({ id: "WHEAT", price: 5 * 40_000, count: 40_000, calculation: [] });
  });

  it("drops a sack entry with nothing in it", () => {
    expect(valueBasicItem({ id: "WHEAT", amount: 0 }, options)).toBeNull();
    expect(valueBasicItem({ id: "WHEAT", amount: -5 }, options)).toBeNull();
  });

  it("drops an id nothing has priced rather than calling it worthless", () => {
    expect(valueBasicItem({ id: "NOBODY_PRICES_THIS", amount: 100 }, options)).toBeNull();
  });

  it("reads an essence id the way a player would say it", () => {
    expect(valueBasicItem({ id: "ESSENCE_UNDEAD", amount: 10 }, options)?.name).toBe("Undead Essence");
  });

  it("drops a rune from a cosmetic-free total", () => {
    expect(valueBasicItem({ id: "RUNE_MUSIC_1", amount: 1 }, options)).not.toBeNull();
    expect(valueBasicItem({ id: "RUNE_MUSIC_1", amount: 1 }, { ...options, nonCosmetic: true })).toBeNull();
  });

  it("never counts a sack entry as soulbound", () => {
    expect(valueBasicItem({ id: "WHEAT", amount: 1 }, options)?.soulbound).toBe(false);
  });
});

describe("the aggregator", () => {
  const parsed = (): ParsedItems => ({
    inventory: [structuredClone(items.recombobulated), structuredClone(items.plain)],
    enderchest: [structuredClone(items.etherwarp)],
    pets: [structuredClone(pets.lowExp)],
    sacks: [
      { id: "WHEAT", amount: 1_000 },
      { id: "ENCHANTED_DIAMOND", amount: 64 },
    ],
    essence: [{ id: "ESSENCE_UNDEAD", amount: 100 }],
  });

  it("totals each category from its own items", () => {
    const result = calculateNetworth(parsed(), NO_COINS, options);
    expect(result.types.sacks.total).toBe(5 * 1_000 + 1_200 * 64);
    expect(result.types.essence.total).toBe(900 * 100);
    expect(result.types.pets.total).toBe(500_000);
    expect(result.types.inventory.total).toBe(
      result.types.inventory.items.reduce((n, i) => n + i.price, 0)
    );
  });

  it("adds coins once, not once per category", () => {
    const coins: CoinBalances = { purse: 1_000, bank: 2_000, personalBank: 3_000 };
    const withCoins = calculateNetworth(parsed(), coins, options);
    const without = calculateNetworth(parsed(), NO_COINS, options);
    expect(withCoins.networth - without.networth).toBe(6_000);
    expect(withCoins.purse).toBe(1_000);
    expect(withCoins.bank).toBe(2_000);
    expect(withCoins.personalBank).toBe(3_000);
  });

  it("says nothing about an inventory Hypixel never sent", () => {
    expect(calculateNetworth(parsed(), NO_COINS, options).noInventory).toBe(false);
    expect(calculateNetworth({ enderchest: [] }, NO_COINS, options).noInventory).toBe(true);
  });

  it("sorts each category by price, richest first", () => {
    const rows = calculateNetworth(parsed(), NO_COINS, options).types.inventory.items;
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1].price).toBeGreaterThanOrEqual(rows[i].price);
  });

  it("stacks identical stacks and leaves different ones apart", () => {
    const two = structuredClone(items.plain);
    const alsoTwo = structuredClone(items.plain);
    const result = calculateNetworth({ inventory: [two, alsoTwo] }, NO_COINS, options);
    expect(result.types.inventory.items).toHaveLength(1);
    expect(result.types.inventory.items[0].count).toBe(2);
    expect(result.types.inventory.items[0].price).toBe(2_000);
  });

  it("does not stack two items that differ in what was applied to them", () => {
    // Same id, different per-unit price, so they are two different things a
    // player owns and collapsing them would hide one of them.
    const plain = structuredClone(items.plain);
    const enchanted = structuredClone(items.plain);
    enchanted.tag!.ExtraAttributes!.enchantments = { sharpness: 6 };
    const result = calculateNetworth({ inventory: [plain, enchanted] }, NO_COINS, options);
    expect(result.types.inventory.items).toHaveLength(2);
  });

  it("leaves pets unstacked even when two are identical", () => {
    const result = calculateNetworth(
      { pets: [structuredClone(pets.lowExp), structuredClone(pets.lowExp)] },
      NO_COINS,
      options
    );
    expect(result.types.pets.items).toHaveLength(2);
  });

  it("counts a zero-priced item in the totals but keeps it out of the list", () => {
    const unpriced = structuredClone(items.plain);
    unpriced.tag!.ExtraAttributes!.id = "NOBODY_PRICES_THIS";
    const result = calculateNetworth({ inventory: [unpriced] }, NO_COINS, options);
    expect(result.types.inventory.total).toBe(0);
    expect(result.types.inventory.items).toHaveLength(0);
  });

  it("values a pet found inside a container as a pet", () => {
    // A pet in a chest is an item whose ExtraAttributes carry a petInfo JSON
    // string. It must value identically to one sitting in the pet menu.
    const result = calculateNetworth({ enderchest: [structuredClone(items.petItem)] }, NO_COINS, options);
    const row = result.types.enderchest.items[0];
    expect(row.isPet).toBe(true);
    expect(row.id).toBe("GUARDIAN");
    expect(row.price).toBe(500_000);
  });
});

describe("the soulbound split", () => {
  /**
   * Soulbound items cannot be auctioned, so no captured document carries a
   * marker. Both markers are applied here to verbatim documents, and
   * `tools/networth-parity.mjs` performs the identical transformation against
   * the real SkyHelper library and gets the identical answer, so the rule is
   * proven upstream and this test pins the behaviour locally.
   */
  const SOULBOUND_LORE = "§8§l* §8Soulbound §8§l*";

  it("keeps a soulbound item out of the unsoulbound total entirely", () => {
    const free = structuredClone(items.recombobulated);
    const bound = structuredClone(items.etherwarp);
    bound.tag!.display!.Lore = [...(bound.tag!.display!.Lore ?? []), SOULBOUND_LORE];

    const result = calculateNetworth({ inventory: [free, bound] }, NO_COINS, options);
    const freePrice = result.types.inventory.items.find((i) => i.id === "HYPERION")!.price;

    expect(result.types.inventory.total).toBeGreaterThan(freePrice);
    expect(result.types.inventory.unsoulboundTotal).toBe(freePrice);
  });

  it("subtracts only the soulbound part of an item that is otherwise tradeable", () => {
    // A museum-donated rod part on a rod the player could still sell.
    const rod = structuredClone(items.rodParts);
    (rod.tag!.ExtraAttributes!.hook as Record<string, unknown>).donated_museum = true;

    const result = calculateNetworth({ inventory: [rod] }, NO_COINS, options);
    const row = result.types.inventory.items[0];
    expect(row.soulbound).toBe(false);
    expect(row.soulboundPortion).toBeGreaterThan(0);
    expect(result.types.inventory.unsoulboundTotal).toBe(result.types.inventory.total - row.soulboundPortion);
  });

  it("counts coins as fully transferable", () => {
    const coins: CoinBalances = { purse: 10, bank: 20, personalBank: 30 };
    const bound = structuredClone(items.plain);
    bound.tag!.display!.Lore = [SOULBOUND_LORE];
    const result = calculateNetworth({ inventory: [bound] }, coins, options);
    expect(result.unsoulboundNetworth).toBe(60);
    expect(result.networth).toBe(60 + 1_000);
  });

  it("marks the museum flag as soulbound too", () => {
    const donated = structuredClone(items.plain);
    donated.tag!.ExtraAttributes!.donated_museum = true;
    const result = calculateNetworth({ museum: [donated] }, NO_COINS, options);
    expect(result.types.museum.total).toBe(1_000);
    expect(result.types.museum.unsoulboundTotal).toBe(0);
  });
});
