import { describe, expect, it } from "vitest";
import {
  filterEntries,
  filterIsIdle,
  groupForDisplay,
  groupedTotal,
  toggleSource,
  NO_FILTER,
} from "../group";
import type { AccessoryView } from "../types";

const view = (over: Partial<AccessoryView> & { id: string }): AccessoryView => ({
  name: over.id,
  tier: null,
  family: null,
  familyRank: null,
  itemId: null,
  craftable: false,
  unlocks: null,
  requirements: [],
  checked: [],
  stats: null,
  rift: false,
  riftTransferable: false,
  group: "other",
  attainability: "unknownReach",
  status: "missing",
  source: "wiki",
  blockedBy: null,
  coveredByFamily: false,
  foldedBehind: null,
  foldedHigher: [],
  eventKey: null,
  ...over,
});

describe("filterEntries", () => {
  const entries: AccessoryView[] = [
    view({ id: "wolf-paw", name: "Wolf Paw", family: "Wolf", source: "mobDrop" }),
    view({ id: "red-claw", name: "Red Claw Talisman", family: "Wolf", source: "craftable" }),
    view({ id: "zombie", name: "Zombie Talisman", source: "quest", coveredByFamily: true }),
  ];

  it("the resting filter passes everything except covered rungs", () => {
    /*
     * Deliberately not "changes nothing" any more. The resting state collapses
     * a rung the player has already upgraded away, because listing it as
     * missing is the bug this default exists to prevent. Everything else passes
     * through untouched.
     */
    expect(filterIsIdle(NO_FILTER)).toBe(true);
    expect(filterEntries(entries, NO_FILTER)).toHaveLength(2);
    expect(filterEntries(entries, { ...NO_FILTER, showCovered: true })).toHaveLength(3);
  });

  it("matches on name and on family", () => {
    expect(filterEntries(entries, { ...NO_FILTER, query: "paw" }).map((e) => e.id)).toEqual(["wolf-paw"]);
    // "Red Claw Talisman" does not contain "wolf" in its name, only in its family.
    expect(filterEntries(entries, { ...NO_FILTER, query: "wolf" }).map((e) => e.id)).toEqual([
      "wolf-paw",
      "red-claw",
    ]);
  });

  it("an empty source list means no source filter, not zero sources", () => {
    // `showCovered` is opened explicitly here so this case is about sources
    // alone; the resting filter now collapses covered rungs.
    expect(filterEntries(entries, { ...NO_FILTER, showCovered: true, sources: [] })).toHaveLength(3);
    expect(
      filterEntries(entries, { ...NO_FILTER, showCovered: true, sources: ["quest"] }).map((e) => e.id)
    ).toEqual(["zombie"]);
    expect(
      filterEntries(entries, { ...NO_FILTER, showCovered: true, sources: ["quest", "mobDrop"] })
    ).toHaveLength(2);
  });

  it("drops covered entries by default, and shows them only when asked", () => {
    /*
     * The polarity that fixes the reported bug. A rung you upgraded away is not
     * a rung you are missing, so the resting state hides it; the toggle is for
     * anyone who wants to see the whole ladder.
     */
    expect(filterEntries(entries, NO_FILTER).map((e) => e.id)).toEqual(["wolf-paw", "red-claw"]);
    expect(filterEntries(entries, { ...NO_FILTER, showCovered: true })).toHaveLength(3);
  });

  it("hides folded rungs at rest, and the toggle reveals them with the covered ones", () => {
    /*
     * The dedup rule as the filter sees it. A missing rung whose line still
     * needs a lower rung first is not the next step, so at rest it hides
     * behind the next step's tile exactly as an owned-covered rung hides
     * behind its owner. One toggle governs both, so nothing is unreachable.
     */
    const withFolded: AccessoryView[] = [
      view({ id: "camp-1", name: "Campfire Badge I" }),
      view({ id: "camp-2", name: "Campfire Badge II", foldedBehind: "camp-1" }),
      view({ id: "camp-3", name: "Campfire Badge III", foldedBehind: "camp-1" }),
    ];

    expect(filterEntries(withFolded, NO_FILTER).map((e) => e.id)).toEqual(["camp-1"]);
    expect(filterEntries(withFolded, { ...NO_FILTER, showCovered: true })).toHaveLength(3);
  });

  it("a search that singles out a folded rung still finds it", () => {
    /*
     * The carve-out that keeps the page from looking like it lost an item:
     * somebody typing "Seal of the Family" is asking about that rung, and it
     * must answer even while folded. The condition is that the query does NOT
     * also match the line's next-step tile, because when it does that tile is
     * already on screen answering for the whole line, and revealing every
     * matching rung would rebuild the Campfire wall the fold exists to
     * prevent.
     */
    const withFolded: AccessoryView[] = [
      view({ id: "shady", name: "Shady Ring" }),
      view({ id: "crooked", name: "Crooked Artifact", foldedBehind: "shady" }),
      view({ id: "seal", name: "Seal of the Family", foldedBehind: "shady" }),
    ];

    // Singled out: revealed even at rest.
    expect(filterEntries(withFolded, { ...NO_FILTER, query: "seal" }).map((e) => e.id)).toEqual(["seal"]);

    // A query the next step already answers keeps the fold closed.
    const campfire: AccessoryView[] = [
      view({ id: "camp-1", name: "Campfire Badge I", family: "CAMPFIRE" }),
      view({ id: "camp-2", name: "Campfire Badge II", family: "CAMPFIRE", foldedBehind: "camp-1" }),
      view({ id: "camp-3", name: "Campfire Badge III", family: "CAMPFIRE", foldedBehind: "camp-1" }),
    ];
    expect(filterEntries(campfire, { ...NO_FILTER, query: "campfire" }).map((e) => e.id)).toEqual([
      "camp-1",
    ]);
  });

  it("reports a filter as active as soon as any part of it is set", () => {
    expect(filterIsIdle({ ...NO_FILTER, query: "x" })).toBe(false);
    expect(filterIsIdle({ ...NO_FILTER, sources: ["shop"] })).toBe(false);
    // Showing covered rungs is now the deviation from the resting state.
    expect(filterIsIdle({ ...NO_FILTER, showCovered: true })).toBe(false);
    expect(filterIsIdle(NO_FILTER)).toBe(true);
  });
});

describe("groupForDisplay", () => {
  const entries: AccessoryView[] = [
    view({ id: "a", status: "missing", attainability: "now" }),
    view({ id: "b", status: "owned", attainability: "now" }),
    view({ id: "c", status: "locked", attainability: "soon" }),
    view({ id: "d", status: "owned", attainability: "long" }),
    view({ id: "e", status: "missing", attainability: "long" }),
  ];

  it("splits by how far away things are, with owned collapsed out", () => {
    /*
     * The page's question is "what can I get right now", so the sections are
     * the answer to it rather than a description of state. A locked item is not
     * a section any more: it lands in the tier its requirement gap puts it in
     * and carries the requirement on its tile.
     */
    const grouped = groupForDisplay(entries, true);
    expect(grouped.mode).toBe("reach");
    if (grouped.mode !== "reach") throw new Error("expected a reach split");

    expect(grouped.tiers.map((t) => t.tier)).toEqual(["now", "soon", "long"]);
    expect(grouped.tiers[0].entries.map((e) => e.id)).toEqual(["a"]);
    expect(grouped.tiers[1].entries.map((e) => e.id)).toEqual(["c"]);
    expect(grouped.tiers[2].entries.map((e) => e.id)).toEqual(["e"]);
    // Owned never enters a tier: it has no distance left to describe.
    expect(grouped.owned.map((e) => e.id)).toEqual(["b", "d"]);
  });

  it("drops empty tiers rather than rendering blank headings", () => {
    const grouped = groupForDisplay([view({ id: "a", attainability: "now" })], true);
    if (grouped.mode !== "reach") throw new Error("expected a reach split");
    expect(grouped.tiers).toHaveLength(1);
  });

  /**
   * The honesty rule. An unreadable bag makes every `status` an unfounded
   * claim, so the page must not sort on it even though the field is populated.
   */
  it("refuses to split on status when the bag was not readable", () => {
    const grouped = groupForDisplay(entries, false);
    expect(grouped.mode).toBe("catalogue");
    if (grouped.mode !== "catalogue") throw new Error("expected a flat catalogue");
    expect(grouped.all).toHaveLength(entries.length);
  });

  it("counts every entry exactly once in either shape", () => {
    expect(groupedTotal(groupForDisplay(entries, true))).toBe(entries.length);
    expect(groupedTotal(groupForDisplay(entries, false))).toBe(entries.length);
  });

  it("leaves the caller's array alone", () => {
    const original = [...entries];
    groupForDisplay(entries, false);
    groupForDisplay(entries, true);
    expect(entries).toEqual(original);
  });

  /**
   * The Rift split. A Rift accessory works only inside the Rift, so it never
   * pads the reach tiers or the Owned band: its own two sections at the
   * bottom are the only place it appears, split missing/owned only.
   */
  it("pulls Rift accessories out of every tier and into their own band", () => {
    const withRift: AccessoryView[] = [
      view({ id: "wolf", status: "missing", attainability: "now" }),
      view({ id: "crux-1", rift: true, status: "missing", attainability: "now" }),
      view({ id: "crux-2", rift: true, status: "locked", attainability: "soon" }),
      view({ id: "iq", rift: true, status: "owned", attainability: "now" }),
      view({ id: "owned-normal", status: "owned", attainability: "now" }),
    ];

    const grouped = groupForDisplay(withRift, true);
    if (grouped.mode !== "reach") throw new Error("expected a reach split");

    expect(grouped.tiers).toHaveLength(1);
    expect(grouped.tiers[0].entries.map((e) => e.id)).toEqual(["wolf"]);
    expect(grouped.owned.map((e) => e.id)).toEqual(["owned-normal"]);
    // Locked rides with missing in the band: the tile still wears its lock.
    expect(grouped.riftMissing.map((e) => e.id)).toEqual(["crux-1", "crux-2"]);
    expect(grouped.riftOwned.map((e) => e.id)).toEqual(["iq"]);
    expect(groupedTotal(grouped)).toBe(withRift.length);
  });

  it("separates Rift accessories even in the keyless catalogue", () => {
    // "This one is a Rift accessory" is a fact about the item, not the
    // player, so it needs no profile.
    const withRift: AccessoryView[] = [
      view({ id: "wolf" }),
      view({ id: "crux-1", rift: true }),
    ];
    const grouped = groupForDisplay(withRift, false);
    if (grouped.mode !== "catalogue") throw new Error("expected a flat catalogue");
    expect(grouped.all.map((e) => e.id)).toEqual(["wolf"]);
    expect(grouped.rift.map((e) => e.id)).toEqual(["crux-1"]);
    expect(groupedTotal(grouped)).toBe(2);
  });

  /**
   * The display rule: a rift-transferable accessory belongs both in the
   * Rift area and outside it. Three cases, and the display duplication must
   * never touch the entries array itself.
   */
  it("lists a rift-transferable in BOTH areas, in both shapes", () => {
    const entries: AccessoryView[] = [
      // Rift-origin AND transferable: both areas.
      view({ id: "silver-fang", rift: true, riftTransferable: true, status: "missing", attainability: "now" }),
      // Rift-origin only: the Rift area alone, exactly as before.
      view({ id: "crux-1", rift: true, status: "missing", attainability: "now" }),
      // Transferable but overworld-origin: its normal tier, plus the Rift area.
      view({ id: "cake-slice", riftTransferable: true, status: "missing", attainability: "now" }),
      // Plain overworld accessory: its tier only.
      view({ id: "wolf", status: "missing", attainability: "now" }),
    ];

    const reach = groupForDisplay(entries, true);
    if (reach.mode !== "reach") throw new Error("expected a reach split");
    expect(reach.tiers[0].entries.map((e) => e.id)).toEqual(["silver-fang", "cake-slice", "wolf"]);
    expect(reach.riftMissing.map((e) => e.id)).toEqual(["silver-fang", "crux-1", "cake-slice"]);

    const catalogue = groupForDisplay(entries, false);
    if (catalogue.mode !== "catalogue") throw new Error("expected a flat catalogue");
    expect(catalogue.all.map((e) => e.id)).toEqual(["silver-fang", "cake-slice", "wolf"]);
    expect(catalogue.rift.map((e) => e.id)).toEqual(["silver-fang", "crux-1", "cake-slice"]);
  });

  it("keeps an owned transferable owned in both areas", () => {
    const entries: AccessoryView[] = [
      view({ id: "silver-fang", rift: true, riftTransferable: true, status: "owned" }),
    ];
    const reach = groupForDisplay(entries, true);
    if (reach.mode !== "reach") throw new Error("expected a reach split");
    expect(reach.owned.map((e) => e.id)).toEqual(["silver-fang"]);
    expect(reach.riftOwned.map((e) => e.id)).toEqual(["silver-fang"]);
    expect(reach.riftMissing).toHaveLength(0);
  });
});

describe("toggleSource", () => {
  it("adds, removes and does not mutate", () => {
    const start: ReadonlyArray<AccessoryView["source"]> = ["shop"];
    expect(toggleSource(start, "quest")).toEqual(["shop", "quest"]);
    expect(toggleSource(start, "shop")).toEqual([]);
    expect(start).toEqual(["shop"]);
  });
});
