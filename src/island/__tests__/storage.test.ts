import { describe, expect, it } from "vitest";
import { decodeFeeds, encodeFeeds } from "../storage";
import { mergeFeeds, modFeed } from "../merge";
import type { IslandFeed } from "../merge";
import type { IslandSnapshot } from "../types";

/**
 * Persistence, and the migration that must never lose anything.
 *
 * A browser that has not opened this page since the single-feed build still has
 * a bare `{ receivedAt, snapshot }` blob sitting in localStorage, and on the day
 * it comes back that blob is the player's entire chest history. Reading it
 * forward is not a one-release courtesy, so it is tested as a permanent
 * behaviour rather than as a migration step.
 */

const snapshot: IslandSnapshot = {
  schema: 1,
  exportedAt: 1754092800000,
  player: { uuid: "b876ec32e396476ba1158438d83c67d4", name: "Steve" },
  profile: { name: "Papaya", gameMode: "ironman" },
  sacks: { ENCHANTED_BROWN_MUSHROOM: 25600 },
  chests: [
    {
      pos: [12, 71, -34],
      name: "Mushroom Storage",
      lastSeen: 1754092700000,
      items: [{ id: "OAK_LOG", name: "Oak Log", count: 64 }],
    },
  ],
  inventory: [{ id: "ROOKIE_HOE", name: "Rookie Hoe", count: 1 }],
  storage: [],
};

const apiHiddenFeed: IslandFeed = {
  source: "api",
  receivedAt: 2000,
  snapshot: { schema: 1, exportedAt: 2000, player: { uuid: "u", name: "" }, profile: { name: "Papaya", gameMode: null }, sacks: {}, chests: [] },
  sections: { sacks: "hidden", chests: "absent", inventory: "absent", enderChest: "absent", storage: "absent" },
};

describe("legacy v1 migration", () => {
  const legacy = JSON.stringify({ receivedAt: 1500, snapshot });

  it("reads a bare {receivedAt, snapshot} blob forward as the mod feed", () => {
    const feeds = decodeFeeds(legacy);
    expect(feeds.mod).toBeDefined();
    expect(feeds.api).toBeUndefined();
    expect(feeds.mod?.source).toBe("mod");
    expect(feeds.mod?.receivedAt).toBe(1500);
  });

  it("loses nothing on the way through", () => {
    const feeds = decodeFeeds(legacy);
    expect(feeds.mod?.snapshot).toStrictEqual(snapshot);

    // Including the distinction the whole feature turns on.
    expect(feeds.mod?.snapshot.storage).toStrictEqual([]);
    expect(feeds.mod?.snapshot.enderChest).toBeUndefined();
    expect("enderChest" in (feeds.mod?.snapshot ?? {})).toBe(false);
  });

  it("derives sensible section states for the migrated feed", () => {
    expect(decodeFeeds(legacy).mod?.sections).toStrictEqual({
      sacks: "captured",
      chests: "captured",
      inventory: "captured",
      enderChest: "absent",
      storage: "empty",
    });
  });

  it("survives the merge intact", () => {
    const merged = mergeFeeds(decodeFeeds(legacy));
    expect(merged.snapshot).toStrictEqual(snapshot);
    expect(merged.sections.chests).toStrictEqual({ state: "captured", source: "mod", at: 1500 });
  });

  it("defaults a legacy blob with no timestamp rather than dropping it", () => {
    const feeds = decodeFeeds(JSON.stringify({ snapshot }));
    expect(feeds.mod?.snapshot.chests).toHaveLength(1);
    expect(feeds.mod?.receivedAt).toBe(0);
  });
});

describe("v2 round trip", () => {
  it("restores both feeds unchanged", () => {
    const feeds = { mod: modFeed(snapshot, 1500), api: apiHiddenFeed };
    const restored = decodeFeeds(encodeFeeds(feeds));
    expect(restored.mod).toStrictEqual(feeds.mod);
    expect(restored.api).toStrictEqual(feeds.api);
  });

  it("remembers that a section was hidden, which cannot be re-derived", () => {
    // An API feed with private sacks stores an empty `sacks` object, so only the
    // persisted state distinguishes "private" from "verified empty".
    const restored = decodeFeeds(encodeFeeds({ api: apiHiddenFeed }));
    expect(restored.api?.sections.sacks).toBe("hidden");
    expect(mergeFeeds(restored).sections.sacks.state).toBe("hidden");
  });

  it("writes nothing but the fields it declares", () => {
    const parsed = JSON.parse(encodeFeeds({ mod: modFeed(snapshot, 1500) })) as Record<string, unknown>;
    expect(Object.keys(parsed).sort()).toStrictEqual(["feeds", "v"]);
    const mod = (parsed.feeds as Record<string, Record<string, unknown>>).mod;
    expect(Object.keys(mod).sort()).toStrictEqual(["receivedAt", "sections", "snapshot"]);
  });

  it("ignores a source label stored inside a feed, trusting only the map key", () => {
    const forged = JSON.stringify({
      v: 2,
      feeds: { api: { receivedAt: 10, snapshot, source: "mod", sections: {} } },
    });
    const restored = decodeFeeds(forged);
    expect(restored.api?.source).toBe("api");
    expect(restored.mod).toBeUndefined();
  });
});

describe("decodeFeeds resilience", () => {
  it("returns nothing for missing or unreadable storage", () => {
    expect(decodeFeeds(null)).toStrictEqual({});
    expect(decodeFeeds("")).toStrictEqual({});
    expect(decodeFeeds("{not json")).toStrictEqual({});
    expect(decodeFeeds("[1,2,3]")).toStrictEqual({});
    expect(decodeFeeds(JSON.stringify({ something: "else" }))).toStrictEqual({});
  });

  it("keeps a good feed when the other one is corrupt", () => {
    const half = JSON.stringify({
      v: 2,
      feeds: {
        mod: { receivedAt: 1500, snapshot, sections: {} },
        api: { receivedAt: 2000, snapshot: { schema: 9 } },
      },
    });
    const restored = decodeFeeds(half);
    expect(restored.mod?.snapshot.chests).toHaveLength(1);
    expect(restored.api).toBeUndefined();
  });

  it("repairs unrecognised section states by re-deriving them", () => {
    const odd = JSON.stringify({
      v: 2,
      feeds: { mod: { receivedAt: 1500, snapshot, sections: { chests: "quantum", sacks: "empty" } } },
    });
    const restored = decodeFeeds(odd);
    // The nonsense value falls back to what the snapshot actually shows…
    expect(restored.mod?.sections.chests).toBe("captured");
    // …while a valid one is trusted even where derivation would disagree.
    expect(restored.mod?.sections.sacks).toBe("empty");
  });

  it("still reads a blob written by a later version that keeps a feeds map", () => {
    const future = JSON.stringify({
      v: 99,
      feeds: { mod: { receivedAt: 1500, snapshot, sections: {} } },
      somethingNew: true,
    });
    expect(decodeFeeds(future).mod?.snapshot.chests).toHaveLength(1);
  });
});
