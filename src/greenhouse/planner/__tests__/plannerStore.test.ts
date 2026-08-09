import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PlannerState } from "../usePlannerState";

/**
 * One planner, however many consumers.
 *
 * `usePlannerState` was the last cross-page fact on this site still held in
 * component state, and component state gives every caller its own copy: the
 * Dashboard, the Planner and the Settings page each parsed the same bytes into
 * a different object, agreed on the frame they mounted, and drifted from there.
 *
 * So these assertions are about IDENTITY and AGREEMENT rather than about any
 * particular value, the same way `datasetStore.test.ts` is. Two components must
 * be handed the same object, not two equal ones, because two equal but distinct
 * objects is exactly the state this conversion exists to end and is exactly
 * what a `toEqual` would have let through.
 *
 * The other two properties are the ones that could have been lost in the move,
 * and both would have been lost silently:
 *
 *   write timing    the old hook saved from an effect keyed on the state. A
 *                   conversion that batched, debounced or deferred the write
 *                   differently loses somebody's last click on a navigation.
 *   foreignFields   a field written by a newer build has to survive a session
 *                   here. That is what makes the stored blob safe to open in
 *                   two builds at once, and nothing else in the file protects
 *                   it.
 *
 * Node environment, no DOM, so `window` and `localStorage` are stood up by hand
 * and the module is imported fresh per test. Both have to exist BEFORE the
 * store is imported, because it reads the blob and registers its cross-tab
 * listener at module load.
 */

/** The literal key, spelled out so a rename fails here rather than in the wild. */
const KEY = "wizardsky.planner.v2";

const bytes = new Map<string, string>();

/** Every `setItem` the store performed, so "when did it write" is answerable. */
const writes: { key: string; value: string }[] = [];

/**
 * A localStorage that screams if anything reaches for the destructive calls.
 *
 * The planner may never enumerate, remove or clear. An earlier pass at this
 * feature shipped a `localStorage.clear()` and took every other tool's data
 * with it, so those paths throw rather than quietly succeed.
 */
const storage = {
  getItem: (k: string) => bytes.get(k) ?? null,
  setItem: (k: string, v: string) => {
    writes.push({ key: k, value: v });
    bytes.set(k, v);
  },
  removeItem: () => {
    throw new Error("removeItem is not allowed from planner code");
  },
  clear: () => {
    throw new Error("clear() is not allowed from planner code");
  },
  key: () => {
    throw new Error("key enumeration is not allowed from planner code");
  },
  get length(): number {
    throw new Error("key enumeration is not allowed from planner code");
  },
};

type Listener = (event: { key: string | null }) => void;

class FakeWindow {
  private handlers = new Map<string, Listener[]>();
  addEventListener(type: string, fn: Listener): void {
    const list = this.handlers.get(type) ?? [];
    list.push(fn);
    this.handlers.set(type, list);
  }
  removeEventListener(type: string, fn: Listener): void {
    this.handlers.set(type, (this.handlers.get(type) ?? []).filter((h) => h !== fn));
  }
  /** What the browser does when another tab writes the key. */
  emit(type: string, event: { key: string | null }): void {
    for (const fn of this.handlers.get(type) ?? []) fn(event);
  }
}

let fakeWindow = new FakeWindow();

vi.stubGlobal("localStorage", storage);
vi.stubGlobal("window", fakeWindow);

/** A blob as some other build left it: our fields, plus two we know nothing about. */
const EXISTING = {
  targets: [{ id: "rose_dragon_pet", kind: "item", qty: 1 }],
  inventory: { choconut: 40 },
  progress: { dustgrain: 3 },
  options: { showBaseCrops: false, hideCompleted: true, showTime: true },
  view: { cycle: 2, mutation: "dustgrain" },
  growth: { cropGrowth: 120, speedTier: 5, uniqueCrops: 0, plots: 2 },
  snapshot: null,
  // Not ours. Written by a build this one has never met.
  islandLayoutDraft: { rows: 4, note: "keep me" },
  someFutureFlag: true,
};

type Store = typeof import("../usePlannerState");

/** A fresh module, reading the bytes this test just laid down. */
const boot = async (blob: unknown = EXISTING): Promise<Store> => {
  bytes.clear();
  writes.length = 0;
  fakeWindow = new FakeWindow();
  vi.stubGlobal("window", fakeWindow);
  bytes.set(KEY, JSON.stringify(blob));
  vi.resetModules();
  return await import("../usePlannerState");
};

const stored = () => JSON.parse(bytes.get(KEY) as string) as Record<string, unknown>;

/** What another tab would leave behind, seen by this one only as an event. */
const otherTabWrites = (blob: unknown) => {
  bytes.set(KEY, JSON.stringify(blob));
  fakeWindow.emit("storage", { key: KEY });
};

/**
 * Render N components that each read the store, and hand back what each saw.
 *
 * A static render is all this environment offers, and it is enough for the
 * question being asked: both components run inside one render pass, so if they
 * are handed distinct objects the store is not a store.
 */
const renderConsumers = (store: Store, count: number) => {
  const seen: PlannerState[] = [];
  const apis: ReturnType<Store["usePlannerState"]>[] = [];

  const Consumer: React.FC = () => {
    const planner = store.usePlannerState();
    seen.push(planner.state);
    apis.push(planner);
    return React.createElement("i", null, String(planner.state.options.hideCompleted));
  };

  const markup = renderToStaticMarkup(
    React.createElement(
      "div",
      null,
      Array.from({ length: count }, (_, i) => React.createElement(Consumer, { key: i }))
    )
  );

  return { seen, apis, markup };
};

let store: Store;

beforeEach(async () => {
  store = await boot();
});

describe("two consumers, one planner", () => {
  it("hands both components the same object rather than two equal ones", () => {
    const { seen } = renderConsumers(store, 2);

    expect(seen).toHaveLength(2);
    // Identity, deliberately. Two equal objects is the bug, not the fix.
    expect(seen[0]).toBe(seen[1]);
    expect(seen[0]).toBe(store.currentPlannerState());
  });

  it("shows a write made through one consumer to the other", () => {
    const first = renderConsumers(store, 2);
    expect(first.markup).toBe("<div><i>true</i><i>true</i></div>");

    // Through the API the FIRST component was handed, not through the module.
    first.apis[0].setOption("hideCompleted", false);

    const second = renderConsumers(store, 2);
    expect(second.markup).toBe("<div><i>false</i><i>false</i></div>");
    expect(second.seen[0]).toBe(second.seen[1]);
    // The value moved, and it moved for both at once.
    expect(second.seen[0]).not.toBe(first.seen[0]);
    expect(second.seen[1].options.hideCompleted).toBe(false);
  });

  it("tells every subscriber about a change exactly once", () => {
    const a: number[] = [];
    const b: number[] = [];
    const offA = store.subscribePlanner(() => a.push(1));
    const offB = store.subscribePlanner(() => b.push(1));

    const { apis } = renderConsumers(store, 1);
    apis[0].bumpProgress("dustgrain", 1);

    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);
    expect(store.currentPlannerState().progress.dustgrain).toBe(4);

    offA();
    offB();
  });

  it("says nothing at all when an action changes nothing", () => {
    const heard: number[] = [];
    const off = store.subscribePlanner(() => heard.push(1));
    const before = store.currentPlannerState();
    writes.length = 0;

    // Already 40, already absent, already this target. Each updater returns the
    // state it was given, which is the `useState` bail out this store keeps.
    const { apis } = renderConsumers(store, 1);
    apis[0].setInventory("choconut", 40);
    apis[0].clearInventoryEntry("never_owned");
    apis[0].addTarget("rose_dragon_pet", "item");

    expect(heard).toHaveLength(0);
    expect(writes).toHaveLength(0);
    expect(store.currentPlannerState()).toBe(before);

    off();
  });
});

describe("the cross-tab listener", () => {
  it("adopts a blob another tab wrote", () => {
    const heard: number[] = [];
    const off = store.subscribePlanner(() => heard.push(1));

    otherTabWrites({ ...EXISTING, progress: { dustgrain: 9 } });

    expect(heard).toHaveLength(1);
    expect(store.currentPlannerState().progress.dustgrain).toBe(9);
    // And the components that were already mounted read the new one.
    expect(renderConsumers(store, 2).seen[0]).toBe(store.currentPlannerState());

    off();
  });

  it("ignores a key it does not own, and a storage that was cleared", () => {
    const heard: number[] = [];
    const off = store.subscribePlanner(() => heard.push(1));
    const before = store.currentPlannerState();

    bytes.set("wizardsky.island.v1", "someone else's data");
    fakeWindow.emit("storage", { key: "wizardsky.island.v1" });
    // A null key means another tab called clear(). Adopting that would wipe a
    // live grind out of memory on the word of code we do not control.
    fakeWindow.emit("storage", { key: null });

    expect(heard).toHaveLength(0);
    expect(store.currentPlannerState()).toBe(before);

    off();
  });

  it("keeps the same object when the bytes have not moved", () => {
    const before = store.currentPlannerState();

    store.refreshPlannerState();
    store.refreshPlannerState();

    // Re-parsing unchanged bytes would build an equal object with a new
    // identity, which every subscriber would read as a change and re-render for.
    expect(store.currentPlannerState()).toBe(before);
  });
});

describe("fields written by a build this one has never met", () => {
  it("carries them through a full read, modify and write cycle", () => {
    renderConsumers(store, 1).apis[0].addTarget("timestalk", "mutation");

    const after = stored();
    expect(after.islandLayoutDraft).toEqual({ rows: 4, note: "keep me" });
    expect(after.someFutureFlag).toBe(true);
    // Ours moved, and everything else of ours came along untouched.
    expect(after.targets).toEqual([
      { id: "rose_dragon_pet", kind: "item", qty: 1 },
      { id: "timestalk", kind: "mutation", qty: 1 },
    ]);
    expect(after.inventory).toEqual({ choconut: 40 });
    expect(after.progress).toEqual({ dustgrain: 3 });
    expect(after.view).toEqual({ cycle: 2, mutation: "dustgrain" });
    for (const key of Object.keys(EXISTING)) expect(after).toHaveProperty(key);
  });

  it("survives every write, not just the first", () => {
    const { apis } = renderConsumers(store, 1);
    apis[0].bumpProgress("dustgrain", 1);
    apis[0].setGrowth("plots", 3);
    apis[0].setView({ cycle: 1 });

    expect(stored().islandLayoutDraft).toEqual({ rows: 4, note: "keep me" });
    expect(stored().someFutureFlag).toBe(true);
  });

  it("picks up a field that arrived from another tab mid session", () => {
    const off = store.subscribePlanner(() => {});

    // Another tab, running a newer build, adds a field this one models nowhere.
    otherTabWrites({ ...EXISTING, aFieldFromTheFuture: ["hello"] });
    renderConsumers(store, 1).apis[0].bumpProgress("dustgrain", 1);

    // Frozen at import, as the old hook's ref was, this would now be gone.
    expect(stored().aFieldFromTheFuture).toEqual(["hello"]);
    expect(stored().islandLayoutDraft).toEqual({ rows: 4, note: "keep me" });
    expect(stored().progress).toEqual({ dustgrain: 4 });

    off();
  });

  it("still touches one key and only one key", () => {
    bytes.set("wizardsky.island.v1", "someone else's data");
    renderConsumers(store, 1).apis[0].clearTargets();

    expect([...new Set(writes.map((w) => w.key))]).toEqual([KEY]);
    expect(bytes.get("wizardsky.island.v1")).toBe("someone else's data");
  });
});

describe("when the write happens", () => {
  it("saves on the change itself, with no timer standing between the two", () => {
    vi.useFakeTimers();
    try {
      const { apis } = renderConsumers(store, 1);
      writes.length = 0;

      apis[0].setProgress("dustgrain", 7);

      // Read back before a single timer, tick or effect has had the chance to
      // run. A debounce or a queued save would leave the old number here.
      expect(stored().progress).toEqual({ dustgrain: 7 });
      expect(writes).toHaveLength(1);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("writes once per change and never coalesces two into one", () => {
    const { apis } = renderConsumers(store, 1);
    writes.length = 0;

    apis[0].bumpProgress("dustgrain", 1);
    apis[0].bumpProgress("dustgrain", 1);
    apis[0].setOption("showTime", false);

    expect(writes).toHaveLength(3);
    expect(stored().progress).toEqual({ dustgrain: 5 });
    expect((stored().options as Record<string, unknown>).showTime).toBe(false);
  });

  it("writes the blob back when the first consumer arrives, as the mount effect did", () => {
    // Nothing has subscribed yet, so nothing has been written yet.
    expect(writes).toHaveLength(0);

    const off = store.subscribePlanner(() => {});

    expect(writes).toHaveLength(1);
    // Lossless, which is what makes a write nobody asked for safe.
    for (const key of Object.keys(EXISTING)) expect(stored()).toHaveProperty(key);
    expect(stored().islandLayoutDraft).toEqual({ rows: 4, note: "keep me" });

    // A second consumer is not a second write.
    const offTwo = store.subscribePlanner(() => {});
    expect(writes).toHaveLength(1);

    off();
    offTwo();
  });

  it("reads before it writes, so a late mount cannot overwrite fresher bytes", () => {
    // Written while nothing was mounted, so no event was ever delivered.
    bytes.set(KEY, JSON.stringify({ ...EXISTING, progress: { dustgrain: 11 } }));

    const off = store.subscribePlanner(() => {});

    expect(store.currentPlannerState().progress).toEqual({ dustgrain: 11 });
    expect(stored().progress).toEqual({ dustgrain: 11 });

    off();
  });
});
