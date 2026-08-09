import { describe, it, expect } from "vitest";
import { buildItemIndex, parseCraftingLua, slug, type HypixelItem, type ParsedRecipe } from "../wikiCrafting";
import type { CollectionUnlock } from "../useItemData";

/**
 * The index is built from the crafting module, which only knows about things
 * made on a grid. Greenhouse mutations are grown, so most of them appear in no
 * recipe at all and used to be dropped along with their Hypixel ids. That id is
 * what every "how many do I already own" lookup keys on, so losing it quietly
 * broke the feature for 25 of the 40 mutations.
 */

const noUnlocks = new Map<string, CollectionUnlock[]>();

/** A recipe that mentions one mutation, so the other is reachable only by category. */
const recipes = (): Map<string, ParsedRecipe> =>
  new Map([
    [
      "Mutation Sack",
      { yields: 1, ingredients: [{ name: "Chocoberry", qty: 8, alternatives: [] }] },
    ],
  ]);

/** Shaped exactly like Hypixel's `/resources/skyblock/items` entries. */
const hypixel: HypixelItem[] = [
  { id: "CHOCOBERRY", name: "Chocoberry", category: "MUTATION", tier: "COMMON" },
  { id: "ASHWREATH", name: "Ashwreath", category: "MUTATION", tier: "COMMON" },
  { id: "LONELILY", name: "Lonelily", category: "MUTATION", tier: "RARE", npc_sell_price: 12 },
  { id: "ALL_IN_ALOE", name: "All-in Aloe", category: "MUTATION", tier: "LEGENDARY" },
  { id: "MUTATION_SACK", name: "Mutation Sack", category: "MISC" },
  { id: "DIAMOND", name: "Diamond", category: "MISC" },
];

describe("buildItemIndex", () => {
  it("keeps a mutation that no recipe mentions, with its Hypixel id", () => {
    const index = buildItemIndex(recipes(), noUnlocks, hypixel);

    // Ashwreath is in no recipe and is not an ingredient anywhere.
    expect(index.ashwreath).toBeDefined();
    expect(index.ashwreath.hypixelId).toBe("ASHWREATH");
    expect(index.ashwreath.name).toBe("Ashwreath");
    expect(index.ashwreath.recipe).toBeNull();
    expect(index.ashwreath.category).toBe("MUTATION");
    expect(index.ashwreath.tier).toBe("COMMON");
  });

  it("gives every mutation an id, whether or not a recipe uses it", () => {
    const index = buildItemIndex(recipes(), noUnlocks, hypixel);
    const mutations = hypixel.filter((h) => h.category === "MUTATION");

    for (const m of mutations) {
      const entry = index[slug(m.name!)];
      expect(entry, `${m.name} missing from the index`).toBeDefined();
      expect(entry.hypixelId, `${m.name} lost its Hypixel id`).toBe(m.id);
    }
    expect(mutations).toHaveLength(4);
  });

  it("keys a punctuated mutation the same way the greenhouse does", () => {
    // "All-in Aloe" has to land on `all_in_aloe`, which is the greenhouse's
    // own mutation id, or the bridge does not connect.
    const index = buildItemIndex(recipes(), noUnlocks, hypixel);
    expect(index.all_in_aloe?.hypixelId).toBe("ALL_IN_ALOE");
  });

  it("carries the rest of the metadata onto a recipe-less entry", () => {
    const index = buildItemIndex(recipes(), noUnlocks, hypixel);
    expect(index.lonelily.npcSell).toBe(12);
    expect(index.lonelily.tier).toBe("RARE");
    expect(index.lonelily.yields).toBe(1);
  });

  it("still indexes recipes and their ingredients exactly as before", () => {
    const index = buildItemIndex(recipes(), noUnlocks, hypixel);

    expect(index.mutation_sack.recipe).toEqual([{ id: "chocoberry", name: "Chocoberry", qty: 8 }]);
    expect(index.mutation_sack.hypixelId).toBe("MUTATION_SACK");
    // The reverse index still runs over the new entries without tripping.
    expect(index.chocoberry.usedIn).toEqual(["mutation_sack"]);
    expect(index.chocoberry.usedInTotal).toBe(1);
  });

  it("does not drag in every item Hypixel knows about", () => {
    const index = buildItemIndex(recipes(), noUnlocks, hypixel);
    // Diamond is neither crafted here nor a mutation, so it stays out. Only
    // the categories we name are rescued, not the whole 5,500 item resource.
    expect(index.diamond).toBeUndefined();
  });

  it("invents nothing when Hypixel has never heard of an item", () => {
    const index = buildItemIndex(
      new Map([["Ghost Widget", { yields: 1, ingredients: [{ name: "Diamond", qty: 1, alternatives: [] }] }]]),
      noUnlocks,
      []
    );
    expect(index.ghost_widget.hypixelId).toBeNull();
    expect(index.ghost_widget.tier).toBeNull();
  });

  it("survives an empty Hypixel resource, which is what a failed fetch looks like", () => {
    const index = buildItemIndex(recipes(), noUnlocks, []);
    expect(index.mutation_sack).toBeDefined();
    expect(index.ashwreath).toBeUndefined();
  });

  it("treats Hypixel's UNOBTAINABLE flag as no tier at all", () => {
    // ENCHANTED_CLOCK (admin relic, tier UNOBTAINABLE) and
    // ENCHANTED_TIME_CLOCK (the craftable LEGENDARY) share the display name
    // "Enchanted Clock"; first-wins must not paint the craftable item with a
    // flag nothing can render, and a null tier is what lets the wiki fill ask.
    const resource: HypixelItem[] = [
      { id: "ENCHANTED_CLOCK", name: "Enchanted Clock", tier: "UNOBTAINABLE" },
      { id: "ENCHANTED_TIME_CLOCK", name: "Enchanted Clock", tier: "LEGENDARY" },
    ];
    const index = buildItemIndex(
      new Map([["Enchanted Clock", { yields: 1, ingredients: [{ name: "Clock", qty: 1, alternatives: [] }] }]]),
      noUnlocks,
      resource
    );
    expect(index.enchanted_clock.tier).toBeNull();
  });

  it("marks a vanilla-section recipe, unless Hypixel itself states a tier for it", () => {
    // The rescue exists because the module's vanilla section has been edited
    // wrong: eight real SkyBlock items (Juju Shortbow among them) sit in it,
    // and Hypixel stating a rarity is the signal that pulls them back.
    const withVanilla = new Map<string, ParsedRecipe>([
      ["Mutation Sack", { yields: 1, ingredients: [{ name: "Chocoberry", qty: 8, alternatives: [] }] }],
      ["Plain Door", { yields: 3, ingredients: [{ name: "Chocoberry", qty: 6, alternatives: [] }], vanilla: true }],
      ["Misfiled Bow", { yields: 1, ingredients: [{ name: "Chocoberry", qty: 1, alternatives: [] }], vanilla: true }],
    ]);
    const resource: HypixelItem[] = [...hypixel, { id: "MISFILED_BOW", name: "Misfiled Bow", tier: "EPIC" }];
    const index = buildItemIndex(withVanilla, noUnlocks, resource);

    expect(index.plain_door.vanilla).toBe(true);
    // Tiered by Hypixel, so the misfile does not hide it.
    expect(index.misfiled_bow.vanilla).toBeUndefined();
    expect(index.mutation_sack.vanilla).toBeUndefined();
    // Ingredients of a vanilla recipe are not themselves flagged.
    expect(index.chocoberry.vanilla).toBeUndefined();
  });
});

describe("parseCraftingLua section markers", () => {
  const lua = `-- header prose
return {
	['Sky Sword'] = {'A1 "Sky Ingot, 2"'},
	-- Vanilla Recipes
	['Plain Door, 3'] = {'*1*2 "Plain Planks"'},
	-- Templates
	['T:Enchanted'] = {'B2 "{1}, 32"'},
}`;

  it("flags recipes after the vanilla marker and only those", () => {
    const parsed = parseCraftingLua(lua);
    expect(parsed.get("Sky Sword")?.vanilla).toBeUndefined();
    expect(parsed.get("Plain Door")?.vanilla).toBe(true);
    expect(parsed.get("Plain Door")?.yields).toBe(3);
  });

  it("drops template-section keys; 'T:Enchanted' is a definition, not an item", () => {
    const parsed = parseCraftingLua(lua);
    expect(parsed.has("T:Enchanted")).toBe(false);
  });

  it("parses a markerless module exactly as before", () => {
    const parsed = parseCraftingLua(`return {
	['Sky Sword'] = {'A1 "Sky Ingot, 2"'},
}`);
    expect(parsed.get("Sky Sword")?.vanilla).toBeUndefined();
    expect(parsed.size).toBe(1);
  });
});

describe("parseCraftingLua entries with a trailing argument", () => {
  /**
   * Live-verified against the module and the items' own infoboxes
   * 2026-08-03: Haste Block's entry carries `, Output = 'Haste Block, 8'`
   * after its QRS string, and the wiki states `mat_cost_bazaar = *8
   * Enchanted End Stone *1 Enchanted Feather` with `Output = Haste Block, 8`
   * on the crafting table itself - the true recipe makes 8 per craft.
   */
  it("keeps a recipe whose entry has a trailing Output argument, instead of dropping it", () => {
    const lua = `return {
	['Haste Block'] = {'A*B13C* "Enchanted End Stone" B2 "Enchanted Feather"', Output = 'Haste Block, 8'},
}`;
    const parsed = parseCraftingLua(lua).get("Haste Block");
    expect(parsed).toBeDefined();
    expect(parsed?.yields).toBe(8);
    expect(parsed?.ingredients).toEqual([
      { name: "Enchanted End Stone", qty: 8, alternatives: [] },
      { name: "Enchanted Feather", qty: 1, alternatives: [] },
    ]);
  });

  it("keeps a recipe whose entry has a trailing ver argument, instead of dropping it", () => {
    const lua = `return {
	['Sky Sword'] = {'A1 "Sky Ingot, 2"', ver = 2},
}`;
    const parsed = parseCraftingLua(lua).get("Sky Sword");
    expect(parsed).toBeDefined();
    expect(parsed?.ingredients).toEqual([{ name: "Sky Ingot", qty: 2, alternatives: [] }]);
  });

  it("does not guess a yield from a multi-name Output list", () => {
    // Enchanted Paper's Output is 'Enchanted Paper; Enchanted Paper, 2' - two
    // names for two '//' variants. Picking either would be a guess about
    // which variant this entry's first-variant-only ingredients belong to,
    // and the wiki's own infobox states the true recipe (192 Sugar Cane,
    // the first variant here) yields 1, which is what declining gives it.
    const lua = `return {
	['Enchanted Paper'] = {'A3B2C1 "Sugar Cane, 64" // A*B* "Sugar Cane, 64"', Output = 'Enchanted Paper; Enchanted Paper, 2'},
}`;
    const parsed = parseCraftingLua(lua).get("Enchanted Paper");
    expect(parsed?.yields).toBe(1);
    expect(parsed?.ingredients).toEqual([{ name: "Sugar Cane", qty: 192, alternatives: [] }]);
  });

  it("does not borrow a yield stated for a differently-named output", () => {
    // Diamond Head's Output names seven Golden-Head recipes, none of them
    // spelled "Diamond Head". A name mismatch must decline, not grab the
    // first number it sees.
    const lua = `return {
	['Diamond Head'] = {'A*B13C* "Enchanted Diamond Block" B2 "Golden Bonzo Head"', Output = 'Diamond Bonzo Head, 3'},
}`;
    const parsed = parseCraftingLua(lua).get("Diamond Head");
    expect(parsed?.yields).toBe(1);
  });
});

describe("parseCraftingLua alternate recipe variants ('//')", () => {
  /**
   * Live-verified against the wiki's own infoboxes 2026-08-03:
   *   Enchanted Charcoal: `mat_cost_bazaar = *128 Coal *32 Oak Wood`
   *   Beacon Block:       `ingredients = ... 3 Obsidian, 5 Glass` + one
   *                        Nether Star item (Catalyst OR Hyper Catalyst OR
   *                        Eternal Crystal)
   * Both match their module entry's FIRST `//` segment exactly, which is the
   * shape these fixtures copy.
   */
  it("reads only the first variant when a same-total variant follows (Enchanted Charcoal)", () => {
    const lua = `return {
	['Enchanted Charcoal'] = {'A2B13C2 "Coal, 32" B2 "Oak Log, 32; Birch Log, 32" // A*B1 "Coal, 32" B2 "Oak Log, 32; Birch Log, 32"'},
}`;
    const parsed = parseCraftingLua(lua).get("Enchanted Charcoal");
    const coal = parsed?.ingredients.find((i) => i.name === "Coal");
    const log = parsed?.ingredients.find((i) => i.name === "Oak Log");
    // Not 256: the second variant is an alternate slot arrangement of the
    // SAME 128, not a second 128 to add on top.
    expect(coal?.qty).toBe(128);
    expect(log?.qty).toBe(32);
    expect(parsed?.ingredients).toHaveLength(2);
  });

  it("reads only the first variant when later variants name different ingredients (Beacon Block)", () => {
    const lua = `return {
	['Beacon Block'] = {'A*B13 "Glass" B2 "Catalyst" C* "Obsidian" // A*B13 "Glass" B2 "Hyper Catalyst" C* "Obsidian" // A*B13 "Glass" B2 "Eternal Crystal" C* "Obsidian"'},
}`;
    const parsed = parseCraftingLua(lua).get("Beacon Block");
    // Not tripled, and not all three catalyst types at once: Hyper Catalyst
    // and Eternal Crystal belong to variants this recipe never reads.
    expect(parsed?.ingredients).toEqual([
      { name: "Glass", qty: 5, alternatives: [] },
      { name: "Catalyst", qty: 1, alternatives: [] },
      { name: "Obsidian", qty: 3, alternatives: [] },
    ]);
  });
});

/**
 * The wiki's own punctuation slips must not become item names.
 *
 * Cruxmotion's live entry quotes four cruxes with a trailing comma INSIDE the
 * string - `"Shadow Crux,"` - a comma someone forgot to delete, with no
 * quantity after it. The built page showed the comma rendered
 * verbatim, and the poisoned name then missed every icon rung. A name never
 * ends in a comma; the parser strips it on every path.
 */
describe("trailing commas inside quoted ingredient names", () => {
  it("strips the comma the Cruxmotion entry carries", () => {
    const lua = `return {
	['Cruxmotion'] = {'A1 "Shy Crux" B1 "Scribe Crux" A2 "Shadow Crux," B2 "Frosty Crux," A3 "Volt Crux," B3 "Splatter Crux,"'},
}`;
    const parsed = parseCraftingLua(lua).get("Cruxmotion");
    const names = parsed!.ingredients.map((i) => i.name).sort();
    expect(names).toEqual(["Frosty Crux", "Scribe Crux", "Shadow Crux", "Shy Crux", "Splatter Crux", "Volt Crux"]);
    for (const ing of parsed!.ingredients) expect(ing.qty).toBe(1);
  });

  it("still reads a real quantity after a comma, and strips nothing it should not", () => {
    const lua = `return {
	['Bloodbadge'] = {'A2B13C2 "Coven Seal, 16" A3 "Bacte Fragment, 2"'},
}`;
    const parsed = parseCraftingLua(lua).get("Bloodbadge");
    const seal = parsed!.ingredients.find((i) => i.name === "Coven Seal");
    // Four slots at 16 each.
    expect(seal!.qty).toBe(64);
    expect(parsed!.ingredients.find((i) => i.name === "Bacte Fragment")!.qty).toBe(2);
  });

  it("tolerates a stray comma OUTSIDE the quotes between slot groups", () => {
    // The Steak Stake entry's live shape: `"Cruxmotion", B2 "Steak Stake"`.
    const lua = `return {
	['Super Stake'] = {'A*B13C* "Cruxmotion", B2 "Steak Stake"'},
}`;
    const parsed = parseCraftingLua(lua).get("Super Stake");
    const names = parsed!.ingredients.map((i) => i.name).sort();
    expect(names).toEqual(["Cruxmotion", "Steak Stake"]);
  });
});
