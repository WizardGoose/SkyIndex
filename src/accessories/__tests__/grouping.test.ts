import { describe, it, expect } from "vitest";
import { attainabilityOf, groupOf, SOON_SLAYER_LEVELS } from "../grouping";
import type { CheckedRequirement } from "../requirements";

/**
 * The two lenses, and the one rule neither is allowed to break.
 *
 * Attainability is a claim about how much work the player has left, so it may
 * never be stated over an unmeasured requirement. That is the property most of
 * these cases exist to hold down.
 */

const req = (over: Partial<CheckedRequirement> = {}): CheckedRequirement => ({
  kind: "slayer",
  target: "Tarantula Broodfather Slayer",
  threshold: "7",
  how: "Level it.",
  raw: "SLAYER",
  state: "met",
  have: "7",
  gap: null,
  ...over,
});

const reach = (over: Partial<Parameters<typeof attainabilityOf>[0]> = {}) =>
  attainabilityOf({ checked: [], source: "craftable", collectionRequired: null, ...over });

describe("attainabilityOf", () => {
  it("calls an unblocked accessory available now", () => {
    expect(reach()).toBe("now");
    expect(reach({ checked: [req({ state: "met" })] })).toBe("now");
  });

  it("calls a small slayer gap soon", () => {
    expect(reach({ checked: [req({ state: "unmet", gap: SOON_SLAYER_LEVELS })] })).toBe("soon");
  });

  it("calls a big slayer gap a long haul", () => {
    expect(reach({ checked: [req({ state: "unmet", gap: SOON_SLAYER_LEVELS + 1 })] })).toBe("long");
  });

  it("judges a collection by how much of it is done, not by items left", () => {
    const collection = (gap: number, required: number) =>
      reach({
        checked: [req({ kind: "collection", state: "unmet", gap })],
        collectionRequired: required,
      });

    /*
     * The same absolute gap, two very different errands. Being 200 short of a
     * 250 collection means barely started; being 200 short of a 50,000 one
     * means all but finished. Judging on items remaining would call both the
     * same, which is why the rule is a fraction of the whole.
     */
    expect(collection(200, 250)).toBe("long");
    expect(collection(200, 50_000)).toBe("soon");

    // And the boundary itself: exactly half done counts as nearly there.
    expect(collection(125, 250)).toBe("soon");
    expect(collection(126, 250)).toBe("long");
  });

  it("takes the furthest requirement, since clearing the others changes nothing", () => {
    expect(
      reach({
        checked: [req({ state: "unmet", gap: 1 }), req({ state: "unmet", gap: 6 })],
      })
    ).toBe("long");
  });

  it("never states a distance over a requirement nobody measured", () => {
    /*
     * The safety property. Each of now, soon and long is a claim about the
     * player's remaining work, and an unknown requirement means we have no
     * standing to make any of them.
     */
    expect(reach({ checked: [req({ state: "unknown", have: null, gap: null })] })).toBe("unknownReach");
    // Even alongside requirements we did measure and they passed.
    expect(
      reach({ checked: [req({ state: "met" }), req({ state: "unknown", have: null, gap: null })] })
    ).toBe("unknownReach");
  });

  it("treats a seasonal source as a long haul even with nothing else in the way", () => {
    // Every requirement met and still unobtainable today, because the event is
    // not running. Calling that "get now" would be a lie on most days.
    expect(reach({ source: "event" })).toBe("long");
  });

  it("does not treat the Dark Auction as seasonal", () => {
    // It runs on a short repeating timer, so it really is available today.
    expect(reach({ source: "darkAuction" })).toBe("now");
  });
});

describe("groupOf", () => {
  const group = (over: Partial<Parameters<typeof groupOf>[0]> = {}) =>
    groupOf({ checked: [], source: "craftable", stats: null, ...over });

  it("reads the requirement first, because it is exact", () => {
    expect(group({ checked: [req({ kind: "slayer" })] })).toBe("combat");
    expect(group({ checked: [req({ kind: "heartOfTheMountain" })] })).toBe("mining");
    expect(group({ checked: [req({ kind: "trophyFishing" })] })).toBe("fishing");
  });

  it("falls back to the stat block", () => {
    expect(group({ stats: { farming_fortune: 5 } })).toBe("farming");
    expect(group({ stats: { mining_speed: 20 } })).toBe("mining");
    expect(group({ stats: { sea_creature_chance: 2 } })).toBe("fishing");
    expect(group({ stats: { strength: 5 } })).toBe("combat");
  });

  it("matches stat keys whatever case Hypixel sends them in", () => {
    // The live data really does carry `WALK_SPEED` beside `walk_speed`.
    expect(group({ stats: { MINING_SPEED: 20 } })).toBe("mining");
    expect(group({ stats: { STRENGTH: 5 } })).toBe("combat");
  });

  it("files a Rift-only accessory with the Rift", () => {
    expect(group({ stats: { rift_time: 11, rift_intelligence: 2 } })).toBe("rift");
    // Mixed stats are not Rift: it only counts when that is all the item does.
    expect(group({ stats: { rift_time: 11, farming_fortune: 5 } })).toBe("farming");
  });

  it("uses the source only as a last resort", () => {
    expect(group({ source: "event" })).toBe("event");
    // A stat wins over the source: a farming accessory handed out at an event
    // is still a farming accessory.
    expect(group({ source: "event", stats: { farming_fortune: 5 } })).toBe("farming");
  });

  it("says other rather than inventing a home", () => {
    // Most accessories give walk speed or intelligence and belong nowhere in
    // particular. An honest leftovers bucket beats a wrong label.
    expect(group({ stats: { walk_speed: 3 } })).toBe("other");
    expect(group()).toBe("other");
  });
});
