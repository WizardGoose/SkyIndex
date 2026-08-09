import { describe, expect, it } from "vitest";
import { sackLookup, slotLayout, totalItems } from "../aggregate";
import type { IslandItem, IslandSnapshot } from "../types";

/**
 * The Items-page integration contract.
 *
 * `sackLookup` is the only place the site's internal item keys and the mod's
 * Hypixel ids meet, so the tests here are mostly about the ways that match can
 * go wrong: a null id, a case difference introduced by the mod's vanilla-item
 * fallback, and the no-mod case where the column should disappear entirely.
 */

const snapshotWith = (sacks: Record<string, number>): IslandSnapshot => ({
  schema: 1,
  exportedAt: 1754092800000,
  player: { uuid: "u", name: "Steve" },
  profile: { name: "Papaya", gameMode: "ironman" },
  sacks,
  chests: [],
});

describe("sackLookup", () => {
  it("matches the site's item keys against hypixel ids", () => {
    const lookup = sackLookup(snapshotWith({ ENCHANTED_BROWN_MUSHROOM: 25600, OAK_LOG: 4096 }), {
      "enchanted-brown-mushroom": { hypixelId: "ENCHANTED_BROWN_MUSHROOM" },
      "oak-log": { hypixelId: "OAK_LOG" },
      "jungle-log": { hypixelId: "JUNGLE_LOG" },
    });

    expect(lookup.has).toBe(true);
    expect(lookup.get("enchanted-brown-mushroom")).toBe(25600);
    expect(lookup.get("oak-log")).toBe(4096);
    // In the index but not in any sack: undefined, which the page renders as a
    // blank rather than a zero.
    expect(lookup.get("jungle-log")).toBeUndefined();
    expect(lookup.get("not-an-item-at-all")).toBeUndefined();
  });

  it("never matches an item with no hypixel id", () => {
    const lookup = sackLookup(snapshotWith({ OAK_LOG: 12, "": 99 }), {
      "wiki-only-thing": { hypixelId: null },
      "oak-log": { hypixelId: "OAK_LOG" },
    });

    expect(lookup.get("wiki-only-thing")).toBeUndefined();
    expect(lookup.get("oak-log")).toBe(12);
  });

  it("falls back to a case-insensitive match for vanilla ids", () => {
    // The mod upper-cases the vanilla registry id, so `minecraft:oak_log`
    // arrives as OAK_LOG while our index may hold `Oak_Log`.
    const lookup = sackLookup(snapshotWith({ OAK_LOG: 4096 }), {
      "oak-log": { hypixelId: "Oak_Log" },
    });
    expect(lookup.get("oak-log")).toBe(4096);
  });

  it("prefers an exact match over the case-insensitive one", () => {
    const lookup = sackLookup(snapshotWith({ oak_log: 7, OAK_LOG: 4096 }), {
      "lower-key": { hypixelId: "oak_log" },
      "upper-key": { hypixelId: "OAK_LOG" },
    });
    expect(lookup.get("lower-key")).toBe(7);
    expect(lookup.get("upper-key")).toBe(4096);
  });

  it("reports has=false when there is nothing to look up", () => {
    const items = { "oak-log": { hypixelId: "OAK_LOG" } };

    expect(sackLookup(null, items).has).toBe(false);
    expect(sackLookup(undefined, items).has).toBe(false);
    expect(sackLookup(snapshotWith({}), items).has).toBe(false);

    // And a false `has` still answers reads, so a caller that forgets to check
    // gets blanks rather than a crash.
    expect(sackLookup(null, items).get("oak-log")).toBeUndefined();
  });

  it("handles a realistic index where most items are not in sacks", () => {
    const items: Record<string, { hypixelId: string | null }> = {};
    for (let i = 0; i < 500; i++) items[`item-${i}`] = { hypixelId: `ITEM_${i}` };
    items["nameless"] = { hypixelId: null };

    const lookup = sackLookup(snapshotWith({ ITEM_7: 64, ITEM_400: 1_000_000, GHOST_ITEM: 3 }), items);

    expect(lookup.get("item-7")).toBe(64);
    expect(lookup.get("item-400")).toBe(1_000_000);
    expect(lookup.get("item-8")).toBeUndefined();
    expect(lookup.get("nameless")).toBeUndefined();
  });
});

describe("totalItems", () => {
  it("aggregates duplicate ids across a list", () => {
    const list: IslandItem[] = [
      { id: "COBBLESTONE", name: "Cobblestone", count: 64 },
      { id: "OAK_LOG", name: "Oak Log", count: 32 },
      { id: "COBBLESTONE", name: "Cobblestone", count: 64 },
      { id: "COBBLESTONE", name: "Cobblestone", count: 5 },
    ];

    const totals = totalItems(list);
    expect(totals.size).toBe(2);
    expect(totals.get("COBBLESTONE")).toStrictEqual({ name: "Cobblestone", count: 133 });
    expect(totals.get("OAK_LOG")).toStrictEqual({ name: "Oak Log", count: 32 });
  });

  it("returns an empty map for an empty list", () => {
    expect(totalItems([]).size).toBe(0);
  });

  it("takes a display name from the first entry that has one", () => {
    const totals = totalItems([
      { id: "OAK_LOG", name: "", count: 1 },
      { id: "OAK_LOG", name: "Oak Log", count: 2 },
    ]);
    expect(totals.get("OAK_LOG")).toStrictEqual({ name: "Oak Log", count: 3 });
  });
});

/**
 * Slot-true container layout.
 *
 * The empty cells are the feature, not padding. A packed grid of only the
 * occupied stacks is a different shape from the chest the player actually
 * opened, and the whole reason to draw a grid is that storage is remembered
 * spatially. So the tests care as much about where the gaps land as about
 * where the items do.
 *
 * The other half is robustness. This is fed by a young mod, so a slot past the
 * end of the container, two stacks claiming one slot, and a mix of slotted and
 * unslotted entries all have to produce a grid rather than an exception.
 */
describe("slotLayout", () => {
  const at = (slot: number, id = `ITEM_${slot}`): IslandItem => ({ id, name: id, count: 1, slot });

  it("returns null when nothing carries a slot, so callers fall back to packed", () => {
    const noSlots: IslandItem[] = [
      { id: "OAK_LOG", name: "Oak Log", count: 64 },
      { id: "COBBLESTONE", name: "Cobblestone", count: 12 },
    ];
    expect(slotLayout(noSlots, 54)).toBeNull();
    expect(slotLayout([], 54)).toBeNull();
  });

  it("places stacks in their true slots and fills the rest with empties", () => {
    const cells = slotLayout([at(0), at(4), at(53)], 54);
    expect(cells).not.toBeNull();
    expect(cells).toHaveLength(54);
    expect(cells?.[0]?.id).toBe("ITEM_0");
    expect(cells?.[4]?.id).toBe("ITEM_4");
    expect(cells?.[53]?.id).toBe("ITEM_53");
    expect(cells?.filter((c) => c !== null)).toHaveLength(3);
  });

  it("renders a gap in the middle as a genuinely empty cell", () => {
    const cells = slotLayout([at(0), at(2)], 27);
    expect(cells?.[0]?.id).toBe("ITEM_0");
    // The whole point: slot 1 is empty, and stays empty rather than closing up.
    expect(cells?.[1]).toBeNull();
    expect(cells?.[2]?.id).toBe("ITEM_2");
  });

  it("keeps the grid rectangular at nine wide", () => {
    for (const capacity of [27, 36, 54]) {
      const cells = slotLayout([at(0)], capacity);
      expect(cells).toHaveLength(capacity);
      expect((cells?.length ?? 0) % 9).toBe(0);
    }
  });

  it("grows whole rows rather than dropping a slot past the end", () => {
    // A stack we cannot place is a stack the player cannot find.
    const cells = slotLayout([at(0), at(60)], 27);
    expect(cells?.length).toBe(63);
    expect((cells?.length ?? 0) % 9).toBe(0);
    expect(cells?.[60]?.id).toBe("ITEM_60");
  });

  it("keeps both stacks when two claim the same slot", () => {
    const first: IslandItem = { id: "FIRST", name: "First", count: 1, slot: 5 };
    const second: IslandItem = { id: "SECOND", name: "Second", count: 1, slot: 5 };
    const cells = slotLayout([first, second], 27);

    expect(cells?.[5]?.id).toBe("FIRST");
    const ids = cells?.filter((c): c is IslandItem => c !== null).map((c) => c.id).sort();
    expect(ids).toStrictEqual(["FIRST", "SECOND"]);
  });

  it("places unslotted entries alongside slotted ones instead of losing them", () => {
    const mixed: IslandItem[] = [at(3), { id: "NO_SLOT", name: "No Slot", count: 9 }];
    const cells = slotLayout(mixed, 27);

    expect(cells?.[3]?.id).toBe("ITEM_3");
    const ids = cells?.filter((c): c is IslandItem => c !== null).map((c) => c.id).sort();
    expect(ids).toStrictEqual(["ITEM_3", "NO_SLOT"]);
  });

  it("survives a container with every slot occupied", () => {
    const full = Array.from({ length: 54 }, (_, i) => at(i));
    const cells = slotLayout(full, 54);
    expect(cells).toHaveLength(54);
    expect(cells?.every((c) => c !== null)).toBe(true);
  });

  it("does not aggregate: two separate stacks of one id stay two cells", () => {
    const twoStacks: IslandItem[] = [
      { id: "COBBLESTONE", name: "Cobblestone", count: 64, slot: 0 },
      { id: "COBBLESTONE", name: "Cobblestone", count: 32, slot: 1 },
    ];
    const cells = slotLayout(twoStacks, 27);
    expect(cells?.[0]?.count).toBe(64);
    expect(cells?.[1]?.count).toBe(32);
  });
});
