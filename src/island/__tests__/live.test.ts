import { describe, expect, it } from "vitest";
import { applyLiveMessage, applyLivePayload } from "../live";
import { modFeed } from "../merge";
import type { FeedSet } from "../merge";
import type { IslandSnapshot } from "../types";

/**
 * The Server-Sent Events path, tested without an `EventSource`.
 *
 * The connection is the browser's problem; what matters here is what a message
 * is allowed to do once it arrives. The property under test in every failure
 * case is the same one: a bad live update must not cost the player the snapshot
 * they already had. Because these functions return the caller's own `feeds`
 * object on failure, that is checked with `toBe` rather than `toEqual` - not
 * merely equal data, the identical object, which means the store literally
 * cannot have replaced anything.
 */

const snapshot = (over: Partial<IslandSnapshot> = {}): IslandSnapshot => ({
  schema: 1,
  exportedAt: 1754092800000,
  player: { uuid: "b876ec32-e396-476b-a115-8438d83c67d4", name: "Steve" },
  profile: { name: "Papaya", gameMode: "ironman" },
  sacks: { OAK_LOG: 64 },
  chests: [{ pos: [1, 70, 2], name: "Chest", lastSeen: 500, items: [{ id: "OAK_LOG", name: "Oak Log", count: 64 }] }],
  ...over,
});

/** A store that already holds good data, which every failure case must leave alone. */
const existing = (): FeedSet => ({ mod: modFeed(snapshot({ sacks: { COBBLESTONE: 4096 } }), 1000) });

describe("applyLiveMessage, good payload", () => {
  it("accepts a snapshot and files it as the mod feed", () => {
    const before: FeedSet = {};
    const result = applyLiveMessage(before, JSON.stringify(snapshot()), 5000);

    expect(result.error).toBeNull();
    expect(result.snapshot).toStrictEqual(snapshot());
    expect(result.feeds.mod?.source).toBe("mod");
    expect(result.feeds.mod?.receivedAt).toBe(5000);
    expect(result.feeds.mod?.sections.chests).toBe("captured");
    // The input is never mutated; a new set comes back.
    expect(result.feeds).not.toBe(before);
    expect(before.mod).toBeUndefined();
  });

  it("replaces an older mod feed but leaves the api feed alone", () => {
    const before: FeedSet = {
      ...existing(),
      api: {
        source: "api",
        receivedAt: 2000,
        snapshot: snapshot({ sacks: { ENCHANTED_BROWN_MUSHROOM: 12 } }),
        sections: { sacks: "captured", chests: "absent", inventory: "absent", enderChest: "absent", storage: "absent" },
      },
    };
    const result = applyLiveMessage(before, JSON.stringify(snapshot()), 5000);

    expect(result.feeds.mod?.snapshot.sacks).toStrictEqual({ OAK_LOG: 64 });
    expect(result.feeds.api).toBe(before.api);
  });

  it("carries the omitted-versus-empty distinction through the stream", () => {
    const payload = JSON.stringify(snapshot({ storage: [], inventory: [{ id: "A", name: "A", count: 1 }] }));
    const result = applyLiveMessage({}, payload, 5000);

    expect(result.feeds.mod?.sections.storage).toBe("empty");
    expect(result.feeds.mod?.sections.inventory).toBe("captured");
    expect(result.feeds.mod?.sections.enderChest).toBe("absent");
    expect(result.feeds.mod?.snapshot.enderChest).toBeUndefined();
  });
});

describe("applyLiveMessage, malformed payload", () => {
  it("rejects data that is not JSON and keeps the stored snapshot untouched", () => {
    const before = existing();
    const result = applyLiveMessage(before, "{ this is not json", 5000);

    expect(result.error).toMatch(/not valid JSON/i);
    expect(result.snapshot).toBeNull();
    // The identical object, so the store cannot have replaced anything.
    expect(result.feeds).toBe(before);
    expect(result.feeds.mod?.snapshot.sacks).toStrictEqual({ COBBLESTONE: 4096 });
    expect(result.feeds.mod?.receivedAt).toBe(1000);
  });

  it("rejects an empty or non-string data field", () => {
    const before = existing();

    for (const bad of ["", "   ", undefined, null, 42, { id: 1 }]) {
      const result = applyLiveMessage(before, bad, 5000);
      expect(result.error).toMatch(/empty live update/i);
      expect(result.feeds).toBe(before);
    }
  });
});

describe("applyLiveMessage, payload that fails validation", () => {
  it("rejects a wrong schema version and keeps the stored snapshot untouched", () => {
    const before = existing();
    const result = applyLiveMessage(before, JSON.stringify({ ...snapshot(), schema: 2 }), 5000);

    // The validator's own message, not a second looser one invented for SSE.
    expect(result.error).toMatch(/schema version 2.*only understands version 1/i);
    expect(result.snapshot).toBeNull();
    expect(result.feeds).toBe(before);
    expect(result.feeds.mod?.snapshot.sacks).toStrictEqual({ COBBLESTONE: 4096 });
  });

  it("rejects valid JSON that is not an island at all", () => {
    const before = existing();
    const result = applyLiveMessage(before, JSON.stringify({ hello: "world" }), 5000);

    expect(result.error).toMatch(/no schema version/i);
    expect(result.feeds).toBe(before);
  });

  it("rejects a chests field that is present but not a list", () => {
    const before = existing();
    const result = applyLiveMessage(before, JSON.stringify({ ...snapshot(), chests: {} }), 5000);

    expect(result.error).toMatch(/'chests'.*not a list/i);
    expect(result.feeds).toBe(before);
  });
});

describe("applyLivePayload", () => {
  it("is the same gate the stream uses, for an already-parsed poll result", () => {
    const streamed = applyLiveMessage({}, JSON.stringify(snapshot()), 5000);
    const polled = applyLivePayload({}, snapshot(), 5000);

    expect(polled.feeds.mod?.snapshot).toStrictEqual(streamed.feeds.mod?.snapshot);
    expect(polled.feeds.mod?.sections).toStrictEqual(streamed.feeds.mod?.sections);
  });

  it("refuses a bad poll result exactly as it refuses a bad message", () => {
    const before = existing();
    const result = applyLivePayload(before, { schema: 2 }, 5000);

    expect(result.error).toMatch(/version 2/i);
    expect(result.feeds).toBe(before);
  });
});
