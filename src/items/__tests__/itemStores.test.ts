import { describe, it, expect, beforeEach, vi } from "vitest";
import type { CraftingSnapshot } from "../wikiCrafting";

/**
 * The crafting and bazaar stores.
 *
 * These two used to fetch per component and got away with it only because
 * routing kept their consumers exclusive. The point of these tests is the thing
 * routing was accidentally providing and no longer will: two consumers mounted
 * at once must see one value, produced by one request. So every test here
 * subscribes twice, deliberately, before the request settles.
 *
 * `getSnapshot` identity is asserted rather than deep equality, because
 * `useSyncExternalStore` compares by identity: two equal-but-distinct objects
 * are exactly the bug, not the fix.
 */

const wiki = vi.hoisted(() => ({
  /** What `readCraftingCache` should hand back. */
  cache: null as CraftingSnapshot | null,
  /** How many times the store went to the network. The number under test. */
  fetches: 0,
  /** Settled by the test, so two subscribers can race an in-flight request. */
  settle: null as { resolve: (s: CraftingSnapshot) => void; reject: (e: Error) => void } | null,
}));

vi.mock("../wikiCrafting", () => ({
  CACHE_KEY: "wizardsky.crafting.v2",
  CRAFTING_TTL: 24 * 60 * 60 * 1000,
  readCraftingCache: () => wiki.cache,
  fetchCraftingData: () => {
    wiki.fetches += 1;
    return new Promise<CraftingSnapshot>((resolve, reject) => {
      wiki.settle = { resolve, reject };
    });
  },
}));

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

const snapshotOf = (fetchedAt: number): CraftingSnapshot => ({
  fetchedAt,
  items: {
    grove: {
      name: "Grove",
      hypixelId: "SHARD_GROVE",
      tier: null,
      category: null,
      npcSell: null,
      yields: 1,
      recipe: null,
    },
  },
});

let storage: ReturnType<typeof fakeStorage>;

beforeEach(() => {
  wiki.cache = null;
  wiki.fetches = 0;
  wiki.settle = null;
  storage = fakeStorage();
  vi.stubGlobal("localStorage", storage);
  vi.resetModules();
});

describe("the crafting store", () => {
  it("serves two consumers one value from one fetch", async () => {
    const { recipesStore } = await import("../useItemData");

    const seenByA: unknown[] = [];
    const seenByB: unknown[] = [];
    const dropA = recipesStore.subscribe(() => seenByA.push(recipesStore.getSnapshot()));
    const dropB = recipesStore.subscribe(() => seenByB.push(recipesStore.getSnapshot()));

    // The second consumer joined an existing request rather than opening one.
    expect(wiki.fetches).toBe(1);

    wiki.settle?.resolve(snapshotOf(1_234));
    await vi.waitFor(() => expect(recipesStore.getSnapshot().loading).toBe(false));

    const value = recipesStore.getSnapshot();
    expect(value.items.grove?.hypixelId).toBe("SHARD_GROVE");
    expect(value.fetchedAt).toBe(1_234);
    expect(value.error).toBeNull();
    // The same object, not two that happen to match.
    expect(seenByA.at(-1)).toBe(value);
    expect(seenByB.at(-1)).toBe(value);
    expect(wiki.fetches).toBe(1);

    dropA();
    dropB();
  });

  it("shows a cached copy immediately and still refreshes behind it", async () => {
    // Older than the 24 hour TTL, so the cache is usable but due a refresh.
    wiki.cache = snapshotOf(Date.now() - 48 * 60 * 60 * 1000);

    const { recipesStore } = await import("../useItemData");
    const drop = recipesStore.subscribe(() => {});

    // Rendered before anything hit the network.
    expect(recipesStore.getSnapshot().loading).toBe(false);
    expect(recipesStore.getSnapshot().items.grove).toBeDefined();
    expect(wiki.fetches).toBe(1);

    drop();
  });

  it("does not fetch at all while the cache is inside its TTL", async () => {
    wiki.cache = snapshotOf(Date.now() - 60_000);

    const { recipesStore } = await import("../useItemData");
    const dropA = recipesStore.subscribe(() => {});
    const dropB = recipesStore.subscribe(() => {});

    expect(wiki.fetches).toBe(0);
    expect(recipesStore.getSnapshot().items.grove).toBeDefined();

    dropA();
    dropB();
  });

  it("keeps good cached data when the refresh fails", async () => {
    const cachedAt = Date.now() - 48 * 60 * 60 * 1000;
    wiki.cache = snapshotOf(cachedAt);

    const { recipesStore } = await import("../useItemData");
    const drop = recipesStore.subscribe(() => {});

    wiki.settle?.reject(new Error("Module:Crafting/Data responded 503"));
    await vi.waitFor(() => expect(recipesStore.getSnapshot().error).not.toBeNull());

    const value = recipesStore.getSnapshot();
    expect(value.error).toBe("Module:Crafting/Data responded 503");
    // The index the player was reading is still the index the player is reading.
    expect(value.items.grove).toBeDefined();
    expect(value.fetchedAt).toBe(cachedAt);
    expect(value.loading).toBe(false);

    drop();
  });
});

describe("the bazaar store", () => {
  const products = {
    products: {
      SHARD_GROVE: { quick_status: { buyPrice: 120, sellPrice: 100 } },
      ENCHANTED_DIAMOND: { quick_status: { buyPrice: 5_000 } },
    },
  };

  it("serves two consumers one price snapshot from one request", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const fetchMock = vi.fn(async () => {
      await gate;
      return { ok: true, json: async () => products } as unknown as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    const { bazaarStore } = await import("../useItemData");

    const seenByA: unknown[] = [];
    const seenByB: unknown[] = [];
    const dropA = bazaarStore.subscribe(() => seenByA.push(bazaarStore.getSnapshot()));
    const dropB = bazaarStore.subscribe(() => seenByB.push(bazaarStore.getSnapshot()));

    expect(fetchMock).toHaveBeenCalledTimes(1);

    release();
    await vi.waitFor(() => expect(bazaarStore.getSnapshot().fetchedAt).not.toBeNull());

    const value = bazaarStore.getSnapshot();
    expect(value.prices.SHARD_GROVE).toEqual({ buy: 120, sell: 100 });
    // A missing half is 0, but a missing product stays absent: undefined is
    // "not on the bazaar", never "free".
    expect(value.prices.ENCHANTED_DIAMOND).toEqual({ buy: 5_000, sell: 0 });
    expect(value.prices.NOT_TRADEABLE).toBeUndefined();
    expect(seenByA.at(-1)).toBe(value);
    expect(seenByB.at(-1)).toBe(value);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    dropA();
    dropB();
  });

  it("reuses a cache inside the ten minute TTL without calling out", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    storage.setItem(
      "wizardsky.bazaar.v1",
      JSON.stringify({ at: Date.now() - 60_000, prices: { SHARD_GROVE: { buy: 7, sell: 6 } } })
    );

    const { bazaarStore } = await import("../useItemData");
    const dropA = bazaarStore.subscribe(() => {});
    const dropB = bazaarStore.subscribe(() => {});

    expect(fetchMock).not.toHaveBeenCalled();
    expect(bazaarStore.getSnapshot().prices.SHARD_GROVE).toEqual({ buy: 7, sell: 6 });

    dropA();
    dropB();
  });

  it("writes the cache back under the key it has always used", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => products }) as unknown as Response);
    vi.stubGlobal("fetch", fetchMock);

    const { bazaarStore } = await import("../useItemData");
    const drop = bazaarStore.subscribe(() => {});

    await vi.waitFor(() => expect(storage.getItem("wizardsky.bazaar.v1")).not.toBeNull());
    const written = JSON.parse(storage.getItem("wizardsky.bazaar.v1")!) as {
      at: number;
      prices: Record<string, { buy: number; sell: number }>;
    };
    expect(written.prices.SHARD_GROVE).toEqual({ buy: 120, sell: 100 });

    drop();
  });
});
