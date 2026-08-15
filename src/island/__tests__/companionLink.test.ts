import { describe, expect, it } from "vitest";
import {
  COMPANION_LINK_KEY,
  createCompanionLinkStore,
} from "../companionLink";

class MemoryStorage implements Pick<Storage, "getItem" | "setItem" | "removeItem"> {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe("companion mod link preference", () => {
  it("does not probe localhost until Link companion mod is explicitly requested", async () => {
    const storage = new MemoryStorage();
    const store = createCompanionLinkStore(storage);
    let probes = 0;

    expect(store.getSnapshot()).toBe(false);
    expect(probes).toBe(0);

    const linked = await store.link(async () => {
      probes += 1;
      return true;
    });

    expect(linked).toBe(true);
    expect(probes).toBe(1);
    expect(store.getSnapshot()).toBe(true);
    expect(storage.getItem(COMPANION_LINK_KEY)).toBe("1");
  });

  it("does not remember a link when the local health check fails", async () => {
    const storage = new MemoryStorage();
    const store = createCompanionLinkStore(storage);

    expect(await store.link(async () => false)).toBe(false);
    expect(store.getSnapshot()).toBe(false);
    expect(storage.getItem(COMPANION_LINK_KEY)).toBeNull();
  });

  it("restores the local opt-in and unlinks without deleting any island snapshot key", () => {
    const storage = new MemoryStorage();
    storage.setItem(COMPANION_LINK_KEY, "1");
    storage.setItem("wizardsky.island.v1", "keep-me");
    const store = createCompanionLinkStore(storage);

    expect(store.getSnapshot()).toBe(true);
    store.unlink();

    expect(store.getSnapshot()).toBe(false);
    expect(storage.getItem(COMPANION_LINK_KEY)).toBeNull();
    expect(storage.getItem("wizardsky.island.v1")).toBe("keep-me");
  });

  it("publishes only when the linked state actually changes", () => {
    const storage = new MemoryStorage();
    const store = createCompanionLinkStore(storage);
    let changes = 0;
    const unsubscribe = store.subscribe(() => {
      changes += 1;
    });

    store.sync("1");
    store.sync("1");
    store.sync(null);
    unsubscribe();
    store.sync("1");

    expect(changes).toBe(2);
  });
});
