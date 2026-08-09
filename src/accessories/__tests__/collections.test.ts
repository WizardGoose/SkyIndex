import { describe, it, expect } from "vitest";
import { buildCollectionKeys, gateAccessory, readCollections, NO_COLLECTIONS } from "../collections";
import type { CollectionUnlock, ItemIndex } from "../../items/useItemData";

/**
 * Collection gating.
 *
 * The rule under test is that the pass or fail decision comes from
 * `unlocked_coll_tiers` and never from a raw count, and that an unresolved
 * collection name leaves an accessory in Missing rather than sending the player
 * off to grind a collection we only guessed at.
 */

const items: ItemIndex = {
  acacia_log: {
    name: "Acacia Log",
    hypixelId: "LOG_2",
    tier: null,
    category: null,
    npcSell: null,
    yields: 1,
    recipe: null,
  },
  mithril: {
    name: "Mithril",
    hypixelId: "MITHRIL_ORE",
    tier: null,
    category: null,
    npcSell: null,
    yields: 1,
    recipe: null,
  },
};

const keys = buildCollectionKeys(items);

const unlock = (collection: string, tier: number, required: number): CollectionUnlock => ({
  collection,
  tier,
  required,
  type: "Recipe",
});

const member = (tiers: string[], counts: Record<string, number> = {}) => ({
  player_data: { unlocked_coll_tiers: tiers },
  collection: counts,
});

describe("readCollections", () => {
  it("reads the gating field and the counts", () => {
    const progress = readCollections(member(["LOG_2_1", "LOG_2_2"], { LOG_2: 4000 }));

    expect(progress.known).toBe(true);
    expect(progress.unlockedTiers.has("LOG_2_2")).toBe(true);
    expect(progress.counts.LOG_2).toBe(4000);
  });

  it("accepts the older flat position for the tier list", () => {
    const progress = readCollections({ unlocked_coll_tiers: ["LOG_2_1"] });
    expect(progress.unlockedTiers.has("LOG_2_1")).toBe(true);
  });

  it("reports a member with neither field as unknown", () => {
    expect(readCollections({}).known).toBe(false);
    expect(readCollections(null).known).toBe(false);
  });

  it("drops counts that are not real numbers rather than reading them as zero", () => {
    const progress = readCollections({
      player_data: { unlocked_coll_tiers: [] },
      collection: { LOG_2: null, MITHRIL_ORE: "many", GRAVEL: -5, DIRT: 12 },
    });
    expect(progress.counts).toStrictEqual({ DIRT: 12 });
  });
});

describe("gateAccessory with Hypixel's holey tier list", () => {
  /**
   * The exact shape read off a real live profile, 2026-08-03: lily pad
   * tiers 1, 4-9 present, 2 and 3 absent, plus a stray "-1" sentinel. Exact
   * membership called tier 3 locked on a man holding 196,413 lily pads and
   * filed the Healing Talisman under "Soon". Collections are monotonic, so a
   * recorded tier at or above the bar proves it crossed.
   */
  it("treats a higher recorded tier as proof of every tier below it", () => {
    const progress = readCollections(
      member(
        ["LOG_2_1", "LOG_2_4", "LOG_2_5", "LOG_2_6", "LOG_2_7", "LOG_2_8", "LOG_2_9", "LOG_2_-1"],
        { LOG_2: 196_413 }
      )
    );
    const result = gateAccessory([unlock("Acacia Log", 3, 250)], progress, keys);
    expect(result).toStrictEqual({ block: null, unresolved: false });
  });

  it("still blocks a tier above every recorded one", () => {
    const progress = readCollections(member(["LOG_2_1", "LOG_2_4"], { LOG_2: 5000 }));
    const result = gateAccessory([unlock("Acacia Log", 6, 10_000)], progress, keys);
    expect(result.block).toStrictEqual({ collection: "Acacia Log", tier: 6, required: 10_000, have: 5000 });
  });

  it("never lets the -1 sentinel satisfy anything", () => {
    const progress = readCollections(member(["LOG_2_-1"], { LOG_2: 50 }));
    const result = gateAccessory([unlock("Acacia Log", 1, 50)], progress, keys);
    expect(result.block?.tier).toBe(1);
  });
});

describe("gateAccessory", () => {
  it("passes an accessory whose tier is already unlocked", () => {
    const progress = readCollections(member(["LOG_2_1", "LOG_2_2", "LOG_2_3"], { LOG_2: 4000 }));
    const result = gateAccessory([unlock("Acacia Log", 3, 250)], progress, keys);

    expect(result.block).toBeNull();
    expect(result.unresolved).toBe(false);
  });

  it("blocks an accessory whose tier is not unlocked, and says what is short", () => {
    const progress = readCollections(member(["LOG_2_1"], { LOG_2: 40 }));
    const result = gateAccessory([unlock("Acacia Log", 6, 250)], progress, keys);

    expect(result.unresolved).toBe(false);
    expect(result.block).toStrictEqual({ collection: "Acacia Log", tier: 6, required: 250, have: 40 });
  });

  it("decides on the tier list, not on the count", () => {
    /*
     * The count is nowhere near the requirement, but the tier is recorded as
     * crossed. That happens after a rebalance, and the game keeps the unlock.
     * Gating on the count would wrongly tell this player to go and grind.
     */
    const progress = readCollections(member(["LOG_2_6"], { LOG_2: 3 }));
    expect(gateAccessory([unlock("Acacia Log", 6, 250)], progress, keys).block).toBeNull();
  });

  it("accepts any one satisfied unlock when several grant the same item", () => {
    const progress = readCollections(member(["MITHRIL_ORE_4"], { LOG_2: 0, MITHRIL_ORE: 9000 }));
    const result = gateAccessory(
      [unlock("Acacia Log", 6, 250), unlock("Mithril", 4, 3000)],
      progress,
      keys
    );
    expect(result.block).toBeNull();
  });

  it("points at the cheapest road when several are blocked", () => {
    const progress = readCollections(member(["LOG_2_1"], { LOG_2: 10, MITHRIL_ORE: 5 }));
    const result = gateAccessory(
      [unlock("Acacia Log", 6, 25000), unlock("Mithril", 4, 3000)],
      progress,
      keys
    );
    expect(result.block?.collection).toBe("Mithril");
  });

  it("leaves an unresolvable collection name in Missing rather than gating on a guess", () => {
    const progress = readCollections(member(["LOG_2_1"], { LOG_2: 10 }));
    const result = gateAccessory([unlock("Some Collection We Cannot Map", 3, 100)], progress, keys);

    expect(result.block).toBeNull();
    expect(result.unresolved).toBe(true);
  });

  it("refuses to gate on a key that resolves but is not a collection", () => {
    /*
     * "Mithril" resolves to MITHRIL_ORE, but this player has no trace of that
     * collection at all, so a tier id built on it would be absent for a reason
     * we cannot distinguish from "not unlocked". Declining is the honest answer.
     */
    const progress = readCollections(member(["LOG_2_1"], { LOG_2: 10 }));
    const result = gateAccessory([unlock("Mithril", 4, 3000)], progress, keys);

    expect(result.block).toBeNull();
    expect(result.unresolved).toBe(true);
  });

  it("cannot gate at all without the tier field", () => {
    const result = gateAccessory([unlock("Acacia Log", 6, 250)], NO_COLLECTIONS, keys);
    expect(result.block).toBeNull();
    expect(result.unresolved).toBe(true);
  });

  it("says nothing about an accessory no collection grants", () => {
    const progress = readCollections(member(["LOG_2_1"], { LOG_2: 10 }));
    expect(gateAccessory(null, progress, keys)).toStrictEqual({ block: null, unresolved: false });
    expect(gateAccessory([], progress, keys)).toStrictEqual({ block: null, unresolved: false });
  });
});
