import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildOwned, describeSources, dominantSource, SOURCE_LABEL } from "../aggregate";

/**
 * The shard tally, wired into the profile inventory.
 *
 * Two claims are worth testing and one of them is a performance claim, which is
 * unusual for a unit test and is the reason this file exists. The fusion
 * dataset is 2.2 MB. The Items page, the planner and the dashboard all ask what
 * the player owns, and none of them may be made to pay for that dataset just by
 * asking. So the first test asserts something absent: the module is not even
 * imported until the player's tally has something in it to bridge.
 *
 * The second claim is the ordinary one: when shards do count, they count as
 * shards. "shard inventory" is its own source in the provenance, never folded
 * into an island section, because a player told their shards are "in sacks"
 * will go and open a sack.
 */

const fusion = vi.hoisted(() => ({
  /** Bumped when the mocked module is first evaluated, ie. actually imported. */
  imports: 0,
  /** Bumped per `loadShards` call, which is the 2.2 MB fetch in real life. */
  loads: 0,
}));

vi.mock("../../services/dataService", () => {
  fusion.imports += 1;
  return {
    DataService: {
      getInstance: () => ({
        loadShards: async () => {
          fusion.loads += 1;
          return [
            { key: "C1", internal_id: "SHARD_GROVE" },
            { key: "C2", internal_id: "SHARD_MIST" },
            // A shard the dataset knows by key alone. It must bridge to nothing
            // rather than to a guess.
            { key: "C3", internal_id: null },
          ];
        },
      }),
    },
  };
});

/** A localStorage that behaves like one, since node's global has no methods. */
const fakeStorage = () => {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
};

let storage: ReturnType<typeof fakeStorage>;

beforeEach(() => {
  storage = fakeStorage();
  vi.stubGlobal("localStorage", storage);
  vi.resetModules();
});

describe("the fusion payload is loaded lazily", () => {
  it("is not imported at all until there are shards to bridge", async () => {
    // The overwhelmingly common case: a visitor who has never opened the
    // fusion calculator, so the suite's `inventory` key does not exist.
    const { subscribeShardIds, getShardIds } = await import("../shardIds");

    const drop = subscribeShardIds(() => {});

    expect(fusion.imports).toBe(0);
    expect(fusion.loads).toBe(0);
    expect(getShardIds()).toBeNull();

    drop();

    // Now the player sets their shards on the calculator, which writes the key
    // this module only ever reads, and opens a page that asks what they own.
    storage.setItem("inventory", JSON.stringify({ C1: 96, C2: 3 }));

    const dropAgain = subscribeShardIds(() => {});
    await vi.waitFor(() => expect(getShardIds()).not.toBeNull());

    expect(fusion.imports).toBe(1);
    expect(fusion.loads).toBe(1);
    expect(getShardIds()?.C1).toBe("SHARD_GROVE");
    expect(getShardIds()?.C3).toBeNull();

    dropAgain();
  });

  it("loads once no matter how many consumers ask", async () => {
    storage.setItem("inventory", JSON.stringify({ C1: 96 }));
    const before = fusion.loads;

    const { subscribeShardIds, getShardIds } = await import("../shardIds");

    const seenByA: unknown[] = [];
    const seenByB: unknown[] = [];
    const dropA = subscribeShardIds(() => seenByA.push(getShardIds()));
    const dropB = subscribeShardIds(() => seenByB.push(getShardIds()));

    await vi.waitFor(() => expect(getShardIds()).not.toBeNull());

    expect(fusion.loads).toBe(before + 1);
    // One value, one identity. Two consumers cannot hold different bridges.
    expect(seenByA.at(-1)).toBe(getShardIds());
    expect(seenByB.at(-1)).toBe(getShardIds());

    dropA();
    dropB();
  });

  it("notifies a consumer that subscribed before the dataset arrived", async () => {
    storage.setItem("inventory", JSON.stringify({ C1: 5 }));
    const { subscribeShardIds, getShardIds } = await import("../shardIds");

    let notified = 0;
    const drop = subscribeShardIds(() => (notified += 1));

    // Nothing to read yet: the page renders without shard counts and gains them.
    expect(getShardIds()).toBeNull();
    await vi.waitFor(() => expect(notified).toBe(1));
    expect(getShardIds()?.C1).toBe("SHARD_GROVE");

    drop();
  });
});

describe("shard inventory is its own source", () => {
  const items = { grove: { hypixelId: "SHARD_GROVE" }, mist: { hypixelId: "SHARD_MIST" } };

  it("is named for the player rather than folded into another source", () => {
    expect(SOURCE_LABEL.shards).toBe("shard inventory");
  });

  it("carries its own line in the provenance beside the island sections", () => {
    const owned = buildOwned({
      items,
      shards: { counts: { C1: 96, C2: 3 }, ids: { C1: "SHARD_GROVE", C2: "SHARD_MIST" } },
      shardsAt: 4_242,
    });

    expect(owned.sources).toEqual(["shards"]);
    expect(owned.count("grove")).toBe(96);
    expect(owned.get("grove")?.sources).toEqual([{ source: "shards", feed: null, count: 96, at: 4_242 }]);
    expect(describeSources(owned.get("mist"))).toBe("shard inventory 3");
    expect(dominantSource(owned.get("mist"))?.source).toBe("shards");
  });

  it("still loses to a number the player typed", () => {
    const owned = buildOwned({
      items,
      shards: { counts: { C1: 96 }, ids: { C1: "SHARD_GROVE" } },
      manual: { grove: 2 },
    });

    const entry = owned.get("grove");
    expect(entry?.total).toBe(2);
    expect(entry?.overridden).toBe(true);
    // The shard tally survives underneath, so the UI can offer it back.
    expect(entry?.auto).toBe(96);
    expect(entry?.sources.map((s) => s.source)).toEqual(["shards"]);
  });
});
