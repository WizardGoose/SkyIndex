import { describe, expect, it } from "vitest";
import { chestItemToRaw, reforgeKey, valueIslandChests } from "../islandChests";
import { valueItem } from "../itemValue";
import { APPLICATION_WORTH } from "../constants";
import { TEST_CATALOGUE, TEST_PRICES } from "./testPrices";
import type { IslandChest, IslandItem } from "../../island/types";

/**
 * Island chests, the category no other tool can show.
 *
 * The mod sends compact fields rather than NBT, so the point of these tests is
 * the honesty claim as much as the arithmetic: what survives the trip must be
 * priced correctly, and what does not survive must be priced at ZERO rather
 * than guessed at. A chest total that reads high is worse than one that reads
 * low, because it sits next to categories derived from full NBT and nobody
 * looking at the page could tell which one drifted.
 */

const options = { prices: TEST_PRICES, catalogue: TEST_CATALOGUE };

const chest = (items: IslandItem[]): IslandChest => ({
  pos: [10, 70, -4],
  name: "Chest",
  lastSeen: 1_700_000_000_000,
  items,
});

describe("reforge names", () => {
  it("accepts the id Hypixel stores", () => {
    expect(reforgeKey("fabled")).toBe("fabled");
  });

  it("accepts the display name the mod sends", () => {
    expect(reforgeKey("Fabled")).toBe("fabled");
    expect(reforgeKey("Blood-Soaked")).toBe("blood_soaked");
    expect(reforgeKey("Greater Spook")).toBe("greater_spook");
  });

  it("returns null for a reforge with no stone rather than guessing at one", () => {
    expect(reforgeKey("Epic")).toBeNull();
    expect(reforgeKey("")).toBeNull();
    expect(reforgeKey("Not A Reforge")).toBeNull();
  });
});

describe("mod item to item document", () => {
  it("carries the four fields the mod sends and nothing else", () => {
    const raw = chestItemToRaw({
      id: "HYPERION",
      name: "Hyperion",
      count: 1,
      extra: { reforge: "Fabled", stars: 5, recomb: true, ench: { sharpness: 6 } },
    });

    expect(raw.Count).toBe(1);
    expect(raw.tag?.display?.Name).toBe("Hyperion");
    expect(raw.tag?.ExtraAttributes).toEqual({
      id: "HYPERION",
      modifier: "fabled",
      rarity_upgrades: 1,
      upgrade_level: 5,
      enchantments: { sharpness: 6 },
    });
  });

  it("never maps the render texture hash onto the skin modifier", () => {
    // `extra.skin` is a player-head texture for drawing the item. Feeding it to
    // the skin handler would price a render as a cosmetic.
    const raw = chestItemToRaw({
      id: "HYPERION",
      name: "Hyperion",
      count: 1,
      extra: { skin: "a1b2c3d4e5f6" },
    });
    expect(raw.tag?.ExtraAttributes?.skin).toBeUndefined();
  });

  it("leaves a bare stack bare", () => {
    const raw = chestItemToRaw({ id: "LARGE_SCAFFOLDING", name: "Large Scaffolding", count: 12 });
    expect(raw.tag?.ExtraAttributes).toEqual({ id: "LARGE_SCAFFOLDING" });
    expect(raw.Count).toBe(12);
  });

  it("falls back to the id when the mod sent no name", () => {
    expect(chestItemToRaw({ id: "HYPERION", name: "", count: 1 }).tag?.display?.Name).toBe("HYPERION");
  });
});

describe("chest valuation", () => {
  it("prices a bare stack at price times count", () => {
    const { chests } = valueIslandChests(
      [chest([{ id: "LARGE_SCAFFOLDING", name: "Large Scaffolding", count: 12 }])],
      TEST_PRICES,
      TEST_CATALOGUE
    );
    expect(chests[0].total).toBe(1_000 * 12);
  });

  it("applies the four visible modifiers", () => {
    const { chests } = valueIslandChests(
      [
        chest([
          {
            id: "HYPERION",
            name: "Hyperion",
            count: 1,
            extra: { reforge: "Fabled", recomb: true, stars: 5, ench: { sharpness: 6 } },
          },
        ]),
      ],
      TEST_PRICES,
      TEST_CATALOGUE
    );

    const row = chests[0].items[0];
    const types = row.calculation.map((c) => c.type);
    expect(types).toContain("REFORGE");
    expect(types).toContain("RECOMBOBULATOR_3000");
    expect(types).toContain("ENCHANTMENT");
    expect(types).toContain("STAR");
    expect(row.basePrice).toBe(400_000_000);
  });

  it("does not credit a recombobulator on a weapon whose enchantments did not arrive", () => {
    // Upstream's rule is that a recombobulator is only worth something where it
    // did something transferable: enchantments, an accessory, or one of the
    // named armour sets. A bare weapon fails all three, so a chest snapshot
    // carrying `recomb` but no `ench` legitimately values low here. This is the
    // conservative direction and it is pinned rather than worked around, so
    // that a future mod release sending `ench` visibly changes the answer.
    const { chests } = valueIslandChests(
      [chest([{ id: "HYPERION", name: "Hyperion", count: 1, extra: { recomb: true } }])],
      TEST_PRICES,
      TEST_CATALOGUE
    );
    expect(chests[0].items[0].calculation.map((c) => c.type)).not.toContain("RECOMBOBULATOR_3000");
  });

  it("is conservative by exactly the modifiers the mod cannot see", () => {
    // The same item valued twice: once as the mod sends it, once with the full
    // NBT a profile blob would carry. The mod's answer must be LOWER, and the
    // gap must be the modifiers that did not make the trip.
    const modItem: IslandItem = {
      id: "HYPERION",
      name: "Hyperion",
      count: 1,
      extra: { reforge: "Fabled", recomb: true, stars: 5 },
    };

    const full = valueItem(
      {
        Count: 1,
        tag: {
          display: { Name: "Hyperion", Lore: [] },
          ExtraAttributes: {
            id: "HYPERION",
            modifier: "fabled",
            rarity_upgrades: 1,
            upgrade_level: 5,
            enchantments: { sharpness: 6 },
            // Invisible to the mod today.
            hot_potato_count: 15,
            art_of_war_count: 1,
            ability_scroll: ["IMPLOSION_SCROLL"],
          },
        },
      },
      options
    );

    const modValue = valueItem(chestItemToRaw(modItem), options);
    expect(modValue!.price).toBeLessThan(full!.price);
    // Nothing invented: no line the mod could not have known about.
    const modTypes = new Set(modValue!.calculation.map((c) => c.type));
    expect(modTypes.has("HOT_POTATO_BOOK")).toBe(false);
    expect(modTypes.has("THE_ART_OF_WAR")).toBe(false);
    expect(modTypes.has("NECRON_SCROLL")).toBe(false);
  });

  it("sorts chests by value and items within a chest by value", () => {
    const poor = chest([{ id: "LARGE_SCAFFOLDING", name: "Large Scaffolding", count: 1 }]);
    const rich: IslandChest = {
      ...chest([
        { id: "LARGE_SCAFFOLDING", name: "Large Scaffolding", count: 1 },
        { id: "HYPERION", name: "Hyperion", count: 1 },
      ]),
      pos: [0, 70, 0],
    };

    const { chests } = valueIslandChests([poor, rich], TEST_PRICES, TEST_CATALOGUE);
    expect(chests[0].key).toBe("0,70,0");
    expect(chests[0].items[0].id).toBe("HYPERION");
  });

  it("hands the same items to the category aggregator that it priced per chest", () => {
    const { items, chests } = valueIslandChests(
      [chest([{ id: "HYPERION", name: "Hyperion", count: 1 }, { id: "LARGE_SCAFFOLDING", name: "x", count: 3 }])],
      TEST_PRICES,
      TEST_CATALOGUE
    );
    expect(items).toHaveLength(2);
    expect(chests[0].total).toBe(400_000_000 + 3_000);
  });

  it("keeps a chest with nothing priced in it, at zero", () => {
    const { chests } = valueIslandChests(
      [chest([{ id: "NOBODY_PRICES_THIS", name: "Mystery", count: 1 }])],
      TEST_PRICES,
      TEST_CATALOGUE
    );
    expect(chests).toHaveLength(1);
    expect(chests[0].total).toBe(0);
    expect(chests[0].items).toHaveLength(0);
  });

  it("counts a chest item as transferable, because the mod cannot see lore", () => {
    const { chests } = valueIslandChests(
      [chest([{ id: "HYPERION", name: "Hyperion", count: 1 }])],
      TEST_PRICES,
      TEST_CATALOGUE
    );
    expect(chests[0].items[0].soulbound).toBe(false);
  });

  it("prices the reforge stone the mod named", () => {
    const { chests } = valueIslandChests(
      [chest([{ id: "HYPERION", name: "Hyperion", count: 1, extra: { reforge: "Fabled" } }])],
      TEST_PRICES,
      TEST_CATALOGUE
    );
    const reforgeLine = chests[0].items[0].calculation.find((c) => c.type === "REFORGE");
    expect(reforgeLine).toEqual({
      id: "DRAGON_CLAW",
      type: "REFORGE",
      price: 3_000_000 * APPLICATION_WORTH.reforge,
      count: 1,
    });
  });
});
