import { describe, it, expect } from "vitest";
import { buildCostTree, collectRawMaterials } from "../useItemData";
import type { ItemIndex } from "../useItemData";

/**
 * A cost-tree node's name is a label, never a lookup key.
 *
 * The reported bug was "ruby_veilshroom" rendered in the Accretion
 * Talisman tree and its gather list: the ingredient's index lookup missed, and
 * the node fell back to the normalized key it had looked up WITH. The recipe
 * itself had stated the real name all along; it just was not carried down.
 * These pin the whole fallback chain: index name first, then the recipe's
 * stated name, then a prettified key as the floor - the raw key never shows.
 */

const INDEX = {
  accretion_talisman: {
    name: "Accretion Talisman",
    tier: "common",
    hypixelId: "ACCRETION_TALISMAN",
    npcSell: null,
    yields: 1,
    recipe: [
      { id: "enchanted_ruby_veilshroom", name: "Enchanted Ruby Veilshroom", qty: 2 },
    ],
  },
  enchanted_ruby_veilshroom: {
    name: "Enchanted Ruby Veilshroom",
    tier: "uncommon",
    hypixelId: null,
    npcSell: null,
    yields: 1,
    // The child here has NO index entry of its own, which is the bug's shape.
    recipe: [{ id: "ruby_veilshroom", name: "Ruby Veilshroom", qty: 160 }],
  },
} as unknown as ItemIndex;

describe("cost tree names", () => {
  it("gives an unindexed ingredient the name its recipe stated", () => {
    const tree = buildCostTree("accretion_talisman", 1, INDEX, {}, true);
    const leaf = tree.children[0].children[0];
    expect(leaf.id).toBe("ruby_veilshroom");
    expect(leaf.name).toBe("Ruby Veilshroom");
  });

  it("carries the stated name into the gather list too", () => {
    const tree = buildCostTree("accretion_talisman", 1, INDEX, {}, true);
    const materials = collectRawMaterials(tree);
    expect(materials.get("ruby_veilshroom")?.name).toBe("Ruby Veilshroom");
  });

  it("falls back to a prettified key when even the recipe stated nothing", () => {
    // The root call has no recipe above it to state a name; an unknown root
    // must still not wear its raw key.
    const tree = buildCostTree("some_unknown_thing", 1, {} as ItemIndex, {}, true);
    expect(tree.name).not.toBe("some_unknown_thing");
    expect(tree.name.toLowerCase()).toContain("unknown");
    expect(tree.name).not.toMatch(/_/);
  });
});
