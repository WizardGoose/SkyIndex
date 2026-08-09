import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as ProfileModule from "../useProfile";

/**
 * Game mode, auto-detected, and the rule that stops it running away with the
 * player's own choice.
 *
 * The site's whole cost model hangs off this one setting: on Ironman nothing
 * can be bought, so every tree bottoms out in what you gather. Setting it wrong
 * does not throw and does not look broken, it just quietly answers a different
 * question than the one that was asked. So the precedence is pinned here rather
 * than left as a comment.
 *
 * The other half of the file is the storage contract. `wizardsky.profile.v1` is
 * frozen legacy: the key keeps that exact name forever, and the `source` field
 * added inside it must not disturb a blob written before it existed.
 */

/** The literal key, spelled out so a rename fails here rather than in the wild. */
const KEY = "wizardsky.profile.v1";

const store = new Map<string, string>();

const stub = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: () => {
    throw new Error("removeItem is not allowed from the profile store");
  },
  clear: () => {
    throw new Error("clear() is not allowed from the profile store");
  },
  key: () => {
    throw new Error("key enumeration is not allowed from the profile store");
  },
  get length(): number {
    throw new Error("key enumeration is not allowed from the profile store");
  },
};

(globalThis as unknown as { localStorage: unknown }).localStorage = stub;

/** A fresh copy, so the module-level read sees whatever the test just seeded. */
const fresh = () => {
  vi.resetModules();
  return import("../useProfile");
};

/**
 * The hook's own `setMode`, pulled out of one server render.
 *
 * Rendering is how you get at it honestly: `setMode` is created inside
 * `useProfile`, and reaching around it to call `write` directly would prove
 * that `write` works while proving nothing about the control the player
 * actually presses. `renderToStaticMarkup` runs no effects and needs no DOM,
 * and `useSyncExternalStore` reads its server snapshot, which is the same
 * `getSnapshot` this store passes for both.
 */
const readSetMode = (mod: typeof ProfileModule): ((mode: ProfileModule.GameMode) => void) => {
  let captured: ((mode: ProfileModule.GameMode) => void) | null = null;
  const Probe = () => {
    captured = mod.useProfile().setMode;
    return null;
  };
  renderToStaticMarkup(createElement(Probe));
  if (!captured) throw new Error("the probe never rendered");
  return captured;
};

beforeEach(() => {
  store.clear();
});

/* -------------------------------------------------------------------------- */
/* The mapping                                                                */
/* -------------------------------------------------------------------------- */

describe("detectGameMode", () => {
  it("reads Ironman off the wire", async () => {
    const { detectGameMode } = await fresh();
    expect(detectGameMode("ironman")).toBe("ironman");
    expect(detectGameMode("IRONMAN")).toBe("ironman");
    expect(detectGameMode(" ironman ")).toBe("ironman");
  });

  it("treats Stranded as Ironman, because it is strictly more restricted", async () => {
    const { detectGameMode } = await fresh();
    expect(detectGameMode("island")).toBe("ironman");
  });

  it("reads an absent game_mode as a normal profile", async () => {
    const { detectGameMode } = await fresh();
    // Hypixel omits the field entirely on a normal profile, so this is the
    // common case rather than an edge one.
    expect(detectGameMode(null)).toBe("normal");
    expect(detectGameMode(undefined)).toBe("normal");
    expect(detectGameMode("")).toBe("normal");
  });

  it("declines to guess at a mode it does not know", async () => {
    const { detectGameMode } = await fresh();
    // Null means "we did not understand this", which is different from normal
    // and must stay different: guessing here silently rewrites the cost model.
    expect(detectGameMode("bingo")).toBeNull();
    expect(detectGameMode("something_new")).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/* Precedence                                                                 */
/* -------------------------------------------------------------------------- */

describe("auto-detect", () => {
  it("fills in the mode when nobody has said anything", async () => {
    const { applyApiGameMode, currentProfile } = await fresh();

    expect(currentProfile()).toStrictEqual({ mode: "ironman", source: "default" });

    applyApiGameMode("ironman");
    expect(currentProfile()).toStrictEqual({ mode: "ironman", source: "api" });
  });

  it("tags the value even when it matches the default, so the chip can appear", async () => {
    const { applyApiGameMode, currentProfile } = await fresh();

    // The default is already ironman, so nothing visible moves. The provenance
    // does, and that is the difference between "we assumed" and "we checked".
    applyApiGameMode("ironman");
    expect(currentProfile().source).toBe("api");
  });

  it("switches a default profile to normal when the field is absent", async () => {
    const { applyApiGameMode, currentProfile } = await fresh();

    applyApiGameMode(null);
    expect(currentProfile()).toStrictEqual({ mode: "normal", source: "api" });
  });

  it("does nothing at all for a mode it does not recognise", async () => {
    const { applyApiGameMode, currentProfile } = await fresh();

    applyApiGameMode("bingo");
    expect(currentProfile()).toStrictEqual({ mode: "ironman", source: "default" });
    // And nothing was written, so the key stays absent rather than gaining a
    // record of a decision that was never made.
    expect(store.has(KEY)).toBe(false);
  });

  it("persists what it detected", async () => {
    const { applyApiGameMode } = await fresh();

    applyApiGameMode("island");
    expect(JSON.parse(store.get(KEY) as string)).toStrictEqual({ mode: "ironman", source: "api" });
    expect([...store.keys()]).toStrictEqual([KEY]);
  });
});

describe("a manual choice wins", () => {
  it("is not overwritten by the next pull, going through the real toggle", async () => {
    const mod = await fresh();

    // Pull first: the API fills the setting in, exactly as it would on load.
    mod.applyApiGameMode("ironman");
    expect(mod.currentProfile()).toStrictEqual({ mode: "ironman", source: "api" });

    // Then the player disagrees. This is the toggle's own code path rather than
    // a hand-written store poke: `setMode` comes back out of the hook, rendered
    // once on the server, so what is under test is what the nav actually calls.
    const setMode = readSetMode(mod);
    setMode("normal");
    expect(mod.currentProfile()).toStrictEqual({ mode: "normal", source: "manual" });

    // Every later pull, including one that agrees with the API's first answer.
    mod.applyApiGameMode("ironman");
    mod.applyApiGameMode("island");
    mod.applyApiGameMode(null);
    expect(mod.currentProfile()).toStrictEqual({ mode: "normal", source: "manual" });
  });

  it("survives every later detection, including a contradicting one", async () => {
    const { applyApiGameMode, currentProfile } = await fresh();

    // Seed a manual choice the way the toggle does, through the store.
    store.set(KEY, JSON.stringify({ mode: "normal", source: "manual" }));
    const reloaded = await fresh();
    expect(reloaded.currentProfile()).toStrictEqual({ mode: "normal", source: "manual" });

    reloaded.applyApiGameMode("ironman");
    expect(reloaded.currentProfile()).toStrictEqual({ mode: "normal", source: "manual" });

    reloaded.applyApiGameMode(null);
    expect(reloaded.currentProfile()).toStrictEqual({ mode: "normal", source: "manual" });

    // The first module instance is untouched by all of that; this is only here
    // to make the reload boundary explicit.
    expect(typeof applyApiGameMode).toBe("function");
    expect(currentProfile().source).toBe("default");
  });

  it("hands the setting back when the player asks for it", async () => {
    store.set(KEY, JSON.stringify({ mode: "normal", source: "manual" }));
    const { applyApiGameMode, clearModeOverride, currentProfile } = await fresh();

    clearModeOverride();
    expect(currentProfile()).toStrictEqual({ mode: "normal", source: "default" });

    applyApiGameMode("ironman");
    expect(currentProfile()).toStrictEqual({ mode: "ironman", source: "api" });
  });

  it("leaves an api value alone when asked to clear an override that is not there", async () => {
    const { applyApiGameMode, clearModeOverride, currentProfile } = await fresh();

    applyApiGameMode("ironman");
    clearModeOverride();
    expect(currentProfile()).toStrictEqual({ mode: "ironman", source: "api" });
  });
});

/* -------------------------------------------------------------------------- */
/* The legacy blob                                                            */
/* -------------------------------------------------------------------------- */

describe("a profile written before provenance existed", () => {
  it("is read as the player's own choice and is never overwritten", async () => {
    // The only thing that ever wrote this key was the toggle, so a stored value
    // with no `source` can only have come from somebody pressing it. Reading it
    // as a default instead would let the first API pull silently undo a choice
    // made months ago, which is the exact failure this arrangement prevents.
    store.set(KEY, JSON.stringify({ mode: "normal" }));

    const { applyApiGameMode, currentProfile } = await fresh();
    expect(currentProfile()).toStrictEqual({ mode: "normal", source: "manual" });

    applyApiGameMode("ironman");
    expect(currentProfile().mode).toBe("normal");
    expect(currentProfile().source).toBe("manual");
  });

  it("keeps reading a malformed mode as Ironman, exactly as it always did", async () => {
    store.set(KEY, JSON.stringify({ mode: "nonsense" }));
    const { currentProfile } = await fresh();
    expect(currentProfile().mode).toBe("ironman");
  });

  it("falls back to the default when there is nothing readable at all", async () => {
    store.set(KEY, "{not json");
    const { currentProfile } = await fresh();
    expect(currentProfile()).toStrictEqual({ mode: "ironman", source: "default" });
  });
});

/* -------------------------------------------------------------------------- */
/* The keys that came before this one                                         */
/* -------------------------------------------------------------------------- */

/**
 * A player who last used the site before this store existed has no
 * `wizardsky.profile.v1` at all, and the default is Ironman. CalculatorPage is
 * the reason that matters: it folds this store into `form.ironManView` and is
 * the only author of that field, so an unseeded default rewrites a saved Normal
 * form on first load and the autosave keeps the loss. These pin the reading of
 * what the player already said.
 */
const LEGACY_MODE_KEY = "skyshards_profile_type";
const LEGACY_FORM_KEY = "calculator_data";

describe("seedFromLegacy", () => {
  it("takes the welcome modal's answer as a choice, whichever way it went", async () => {
    const { seedFromLegacy } = await fresh();
    // That key had exactly one writer, and it only ran on a direct question.
    expect(seedFromLegacy("normal", null)).toStrictEqual({ mode: "normal", source: "manual" });
    expect(seedFromLegacy("ironman", null)).toStrictEqual({ mode: "ironman", source: "manual" });
  });

  it("reads a saved form that moved off the Ironman default", async () => {
    const { seedFromLegacy } = await fresh();
    expect(seedFromLegacy(null, JSON.stringify({ ironManView: false }))).toStrictEqual({
      mode: "normal",
      source: "manual",
    });
  });

  it("does not read a saved Ironman form as a choice, because that is the default", async () => {
    const { seedFromLegacy } = await fresh();
    // `ironManView` starts true, so `true` is equally consistent with a player
    // who never touched it. Calling that manual would lock the API out of a
    // setting nobody set.
    expect(seedFromLegacy(null, JSON.stringify({ ironManView: true }))).toStrictEqual({
      mode: "ironman",
      source: "default",
    });
  });

  it("prefers the direct answer over the saved form when the two disagree", async () => {
    const { seedFromLegacy } = await fresh();
    expect(seedFromLegacy("ironman", JSON.stringify({ ironManView: false }))).toStrictEqual({
      mode: "ironman",
      source: "manual",
    });
  });

  it("says nothing on an unreadable or empty form blob", async () => {
    const { seedFromLegacy } = await fresh();
    for (const blob of [null, "", "{not json", JSON.stringify({}), JSON.stringify(null), "[]"]) {
      expect(seedFromLegacy(null, blob)).toStrictEqual({ mode: "ironman", source: "default" });
    }
  });

  it("carries the returning Normal player's mode into the live store", async () => {
    // The whole point, end to end: nothing under the new key, the old keys
    // still present, and the store comes up Normal instead of on its default.
    store.set(LEGACY_MODE_KEY, "normal");
    store.set(LEGACY_FORM_KEY, JSON.stringify({ ironManView: false }));

    const { currentProfile } = await fresh();
    expect(currentProfile()).toStrictEqual({ mode: "normal", source: "manual" });
  });

  it("lets the store's own key win once it exists", async () => {
    store.set(LEGACY_MODE_KEY, "normal");
    store.set(KEY, JSON.stringify({ mode: "ironman", source: "manual" }));

    const { currentProfile } = await fresh();
    expect(currentProfile()).toStrictEqual({ mode: "ironman", source: "manual" });
  });

  it("still comes up on the default when no old key was ever written", async () => {
    const { currentProfile } = await fresh();
    expect(currentProfile()).toStrictEqual({ mode: "ironman", source: "default" });
  });
});
