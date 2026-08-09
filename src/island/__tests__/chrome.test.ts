import { describe, expect, it } from "vitest";
import { isContainerChrome, withoutChrome } from "../chrome";
import { validateSnapshot } from "../validate";
import type { IslandItem } from "../types";
import reference from "./fixtures/island-ref.json";
import missing from "./fixtures/missing-images.json";

/**
 * Container chrome, tested against a real export rather than a guess.
 *
 * `island-ref.json` is an actual island: 62 chests, 2134 captured entries,
 * with the real names, the real page-navigation glyphs and the real ambiguities
 * that a synthetic fixture would never have thought to include. It is the
 * difference between believing this filter works and knowing it does.
 *
 * The asymmetry that governs every assertion here: leaving a widget on screen
 * is untidy, deleting something the player owns is the failure this feature
 * exists to prevent. So the false-positive tests matter more than the
 * false-negative ones, and they are the ones with the awkward names in them.
 */

const snapshot = validateSnapshot(reference);

const everyEntry: IslandItem[] = [
  ...(snapshot.inventory ?? []),
  ...(snapshot.enderChest ?? []),
  ...(snapshot.storage ?? []),
  ...snapshot.chests.flatMap((c) => c.items),
];

describe("the real export", () => {
  it("is a valid snapshot with the expected shape", () => {
    // Guards the fixture itself: if it is ever replaced with something smaller,
    // the coverage claims below stop meaning what they say.
    expect(snapshot.chests).toHaveLength(62);
    expect(snapshot.enderChest).toHaveLength(317);
    expect(snapshot.storage).toHaveLength(299);
    expect(snapshot.inventory).toHaveLength(18);
    expect(everyEntry.length).toBe(2134);
  });
});

describe("isContainerChrome", () => {
  it("catches all 21 known widgets from the real capture", () => {
    const gui: string[] = missing.gui;
    expect(gui).toHaveLength(21);
    for (const name of gui) {
      expect(isContainerChrome({ name }), name).toBe(true);
    }
  });

  it("catches the page navigation the known list missed", () => {
    // These were sitting in the "real items" bucket, glyphs and all.
    for (const name of ["« First Page", "← Previous Page", "Next Page →", "Last Page »"]) {
      expect(isContainerChrome({ name }), name).toBe(true);
    }
  });

  it("catches the remaining widgets found in the export", () => {
    for (const name of ["Go Back", "SkyBlock Menu (Click)", "Ender Chest Page 1", "Ender Chest Page 9"]) {
      expect(isContainerChrome({ name }), name).toBe(true);
    }
  });

  it("never touches a genuine item, including the awkward ones", () => {
    // Every one of these is a real thing a player can own, and every one of
    // them would fall to a substring rule on "back", "page" or "chest".
    const genuine = [
      "Chest",
      "Trapped Chest",
      "Ender Chest",
      "Large Backpack",
      "Greater Backpack",
      "Jumbo Backpack",
      "Backpack of Holding",
      "Back to the Grind",
      "Page of Wisdom",
      "Hyperion",
      "Rapid Juju Shortbow ✪✪✪✪",
      "Heroic Midas Staff ✪✪✪✪✪",
      "Jaded Helmet of Divan ✦",
      "Beady InfiniVacuum™ Hooverius",
      "Closed Chest",
      "Backpacker's Boots",
    ];
    for (const name of genuine) {
      expect(isContainerChrome({ name }), name).toBe(false);
    }
  });

  it("ignores an item with no name at all", () => {
    expect(isContainerChrome({ name: "" })).toBe(false);
    expect(isContainerChrome({ name: null })).toBe(false);
    expect(isContainerChrome({})).toBe(false);
  });
});

describe("withoutChrome over the real export", () => {
  const cleaned = withoutChrome(everyEntry);
  const dropped = everyEntry.filter((i) => isContainerChrome(i));

  it("removes every widget and keeps everything else", () => {
    expect(dropped).toHaveLength(131);
    expect(cleaned).toHaveLength(2134 - 131);
  });

  it("drops nothing that carries gear detail or a head texture", () => {
    // The strongest available signal that something is a real possession: no
    // navigation button has a reforge, stars, enchantments or a skin hash.
    for (const item of dropped) {
      expect(item.extra?.reforge, item.name).toBeUndefined();
      expect(item.extra?.stars, item.name).toBeUndefined();
      expect(item.extra?.ench, item.name).toBeUndefined();
      expect(item.extra?.skin, item.name).toBeUndefined();
    }
  });

  it("keeps a sample of genuine items from real storage", () => {
    const survivors = new Set(cleaned.map((i) => i.name));
    for (const name of [
      "Hyperion",
      "Rapid Juju Shortbow ✪✪✪✪",
      "Jaded Chestplate of Divan",
      "Shiny Shard",
      "Hilt of True Ice",
      "Plasmaflux Power Orb ✦",
    ]) {
      // Only assert on names the export actually contains, so this stays a
      // survival test rather than a spelling test.
      if (everyEntry.some((i) => i.name === name)) {
        expect(survivors.has(name), name).toBe(true);
      }
    }
  });

  it("leaves the stored snapshot completely untouched", () => {
    // The filter is a display concern. The mod owns history, the site owns
    // display, and a rule that proves too aggressive has to be fixable in a
    // release rather than by asking the player to export again.
    const before = JSON.stringify(everyEntry);
    const out = withoutChrome(everyEntry);

    expect(out).not.toBe(everyEntry);
    expect(everyEntry).toHaveLength(2134);
    expect(JSON.stringify(everyEntry)).toBe(before);
    // And re-validating the raw fixture still yields the widgets, proving
    // nothing upstream was mutated either.
    expect(validateSnapshot(reference).enderChest).toHaveLength(317);
  });

  it("is idempotent", () => {
    expect(withoutChrome(cleaned)).toHaveLength(cleaned.length);
  });
});
