import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { withMutationIds } from "../mutationBridge";

/**
 * The bridge that stopped Choconut disappearing.
 *
 * Two properties matter and they pull against each other, so both are pinned:
 * the crafting index must always win where it has an answer, and every
 * greenhouse mutation must end up with an id regardless of what the index
 * knows. The second is what fixes the bug; the first is what stops the fix
 * becoming a competing source of truth.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const raw = JSON.parse(readFileSync(join(ROOT, "public/greenhouse/data.json"), "utf8")) as {
  mutations: Record<string, { name: string }>;
};
const MUTATIONS = Object.entries(raw.mutations).map(([id, m]) => ({ id, name: m.name }));

describe("withMutationIds", () => {
  it("gives every mutation in the bundled dataset a Hypixel id, from an empty index", () => {
    const bridged = withMutationIds({}, MUTATIONS);
    const missing = MUTATIONS.filter((m) => !bridged[m.id]?.hypixelId);
    expect(missing).toEqual([]);
    expect(MUTATIONS.length).toBeGreaterThan(30);
  });

  it("covers the pair from the live bug report", () => {
    // Gloomgourd was in the recipe-derived index and worked; Choconut was not
    // and silently showed nothing despite 245 in the player's backpacks.
    const bridged = withMutationIds({}, MUTATIONS);
    expect(bridged.gloomgourd.hypixelId).toBe("GLOOMGOURD");
    expect(bridged.choconut.hypixelId).toBe("CHOCONUT");
    expect(bridged.lonelily.hypixelId).toBe("LONELILY");
  });

  it("never overrides an id the crafting index already has", () => {
    const index = { choconut: { hypixelId: "SOMETHING_ELSE" } };
    const bridged = withMutationIds(index, MUTATIONS);
    expect(bridged.choconut.hypixelId).toBe("SOMETHING_ELSE");
  });

  it("fills in only where the index has no answer", () => {
    const index = { choconut: { hypixelId: null }, gloomgourd: { hypixelId: "GLOOMGOURD" } };
    const bridged = withMutationIds(index, MUTATIONS);
    expect(bridged.choconut.hypixelId).toBe("CHOCONUT");
    expect(bridged.gloomgourd.hypixelId).toBe("GLOOMGOURD");
  });

  it("keeps every non-mutation entry the index carried", () => {
    const index = { oak_log: { hypixelId: "OAK_LOG" }, wiki_only: { hypixelId: null } };
    const bridged = withMutationIds(index, MUTATIONS);
    expect(bridged.oak_log.hypixelId).toBe("OAK_LOG");
    // An item the site knows by name only is still name-only: it is not a
    // mutation, so nothing here invents an id for it.
    expect(bridged.wiki_only.hypixelId).toBeNull();
  });

  it("handles the punctuated names rather than only the simple ones", () => {
    const bridged = withMutationIds({}, [
      { id: "all_in_aloe", name: "All-in Aloe" },
      { id: "do_not_eat_shroom", name: "Do-not-eat-shroom" },
      { id: "plantboy_advance", name: "PlantBoy Advance" },
    ]);
    expect(bridged.all_in_aloe.hypixelId).toBe("ALL_IN_ALOE");
    expect(bridged.do_not_eat_shroom.hypixelId).toBe("DO_NOT_EAT_SHROOM");
    expect(bridged.plantboy_advance.hypixelId).toBe("PLANTBOY_ADVANCE");
  });

  it("ignores entries with no usable name", () => {
    const bridged = withMutationIds({}, [{ id: "ghost", name: "" }, { id: "", name: "Nothing" }]);
    expect(bridged.ghost).toBeUndefined();
    expect(bridged[""]).toBeUndefined();
  });
});
