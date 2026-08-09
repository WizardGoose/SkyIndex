import { describe, it, expect } from "vitest";
import {
  buildForgeIndex,
  formatDuration,
  mergeForgeItems,
  parseDetailedListLua,
  parseDuration,
  parseForgeTable,
} from "../wikiForge";
import type { ItemIndex } from "../useItemData";

/**
 * Fixtures are minimal synthetic wikitext shaped exactly like the real markup
 * on `The Forge/Table` and `Module:DetailedList/Data`: the same templates, the
 * same rowspan habits, the same cell forms. Structure is copied, content is
 * not; a handful of short verbatim template calls is what keeps the shapes
 * honest without republishing the page.
 */

const LUA = `return {
	['Bejeweled Handle'] = {
		{ num = 3, item = 'Glacite Jewel', },
	},
	['Divan\\'s Drill'] = {
		{ num = 30, item = 'Corleonite' },
		{ num = 1, item = 'Divan\\'s Alloy' },
	},
	['Gemstone Chamber'] = {
		{ num = 100, item = 'Worm Membrane' },
		{ num = 25000, item = 'Coins' },
	},
}`;

const TABLE = `=== List of Items ===
==== Forging ====
Refine your ores into parts used in lots of gear.
{| class="sortable mw-collapsible wikitable" style="text-align: center"
!class="unsortable"| Icon
! Name
! Cost
! Duration
! [[HotM]]<br>and other Requirements
! data-sort-type="number" scope="col" style="width:100px" |Material Cost
|-
|{{Slot|Bejeweled Handle}}
|[[Bejeweled Handle]]
|{{DRL|/Bejeweled Handle/}}
|30 Seconds
|rowspan="2" |II
|{{BZC|*3 Glacite Jewel}}
|-
|{{Slot|Drill Motor}}
|[[Drill Motor]]
|{{DRL|/Drill Motor/}}
|1 Day 6 Hours
|{{BZC|*10 Treasurite}}
|-
|{{Slot|Divan's Drill}}
|[[Divan's Drill]]
|{{DRL|/Divan's Drill/}}
|4 Hours 30 Minutes
|VII<br>{{Coll|Glacite III}}
|{{c|50m}} + {{ID|Divan's Alloy}}
|}

==== Gear ====
Forge helpful accessories.
{| class="sortable mw-collapsible wikitable" style="text-align: center"
!class="unsortable"| Icon
! Name
! Cost
! Duration
! [[HotM]]<br>and other Requirements
! data-sort-type="number" scope="col" style="width:100px" |Material Cost
|-
|{{Slot|Mithril Necklace}}
|[[Mithril Necklace]]
|rowspan="2" |{{RL|3 Enchanted Mithril}}
|rowspan="2" |1 Hour
|rowspan="2" |II
|rowspan="2" |{{BZC|*3 Enchanted Mithril}}
|-
|{{Slot|Mithril Cloak}}
|[[Mithril Cloak]]
|-
|{{Slot|Gemstone Chamber}}
|[[Gemstone Chamber]]
|{{RL|100 Worm Membrane|25000 Coins}}
|4 Hours
|IV
|{{BZC|*100 Worm Membrane *25000}}
|-
|{{Slot|Mole Pet}}
|[[Mole Pet|Mole]]
|{{RL|1 Claw Fossil|300,000 Coins}}
|3 Days
|VII<br>Donating {{ID|Webbed Fossil}} to {{NPCSprite|Dr. Stone}}
|{{bzc|300000|1 Claw Fossil}}
|}
==== Pets ====
Forge... Pets? and Pet Items.
{| class="sortable mw-collapsible wikitable" style="text-align: center"
!class="unsortable"| Icon
! Name
! Cost
! Duration
! [[HotM]]<br>and other Requirements
! data-sort-type="number" scope="col" style="width:100px" |Material Cost
|-
|{{Slot|Ammonite Pet}}
|[[Ammonite]]
|{{RL|1 Helix Fossil|300,000 Coins}}
|3 Days
|IV
|{{bzc|300000|1 Helix Fossil}}
|-
|{{Slot|Bejeweled Collar}}
|[[Bejeweled Collar]]
|{{RL|1 Bejeweled Handle|4 Refined Mithril}}
|2 Hours
|II
|{{BZC|*1 Bejeweled Handle *4 refined Mithril}}
|}`;

describe("parseDetailedListLua", () => {
  const data = parseDetailedListLua(LUA);

  it("reads every entry, including names with escaped quotes", () => {
    expect(data.size).toBe(3);
    expect(data.get("Bejeweled Handle")).toEqual([{ name: "Glacite Jewel", qty: 3 }]);
    expect(data.get("Divan's Drill")).toEqual([
      { name: "Corleonite", qty: 30 },
      { name: "Divan's Alloy", qty: 1 },
    ]);
  });

  it("keeps coin components verbatim; splitting them is the table parser's job", () => {
    expect(data.get("Gemstone Chamber")).toEqual([
      { name: "Worm Membrane", qty: 100 },
      { name: "Coins", qty: 25000 },
    ]);
  });
});

describe("parseDuration", () => {
  it("handles every unit the table uses", () => {
    expect(parseDuration("30 Seconds")).toBe(30);
    expect(parseDuration("30 Minutes")).toBe(1800);
    expect(parseDuration("6 Hours")).toBe(21600);
    expect(parseDuration("1 Day 6 Hours")).toBe(108000);
    expect(parseDuration("4 Hours 30 Minutes")).toBe(16200);
    expect(parseDuration("7 Days")).toBe(604800);
  });

  it("returns null rather than zero for words that are not a duration", () => {
    expect(parseDuration("unknown")).toBeNull();
    expect(parseDuration("")).toBeNull();
  });
});

describe("formatDuration", () => {
  it("round-trips the table's phrasing into row-sized text", () => {
    expect(formatDuration(30)).toBe("30s");
    expect(formatDuration(108000)).toBe("1d 6h");
    expect(formatDuration(16200)).toBe("4h 30m");
    expect(formatDuration(0)).toBe("0s");
  });
});

describe("parseForgeTable", () => {
  const drl = parseDetailedListLua(LUA);
  const recipes = parseForgeTable(TABLE, drl);
  const byName = new Map(recipes.map((r) => [r.name, r]));

  it("finds every data row and none of the headers", () => {
    expect(recipes.map((r) => r.name)).toEqual([
      "Bejeweled Handle",
      "Drill Motor",
      "Divan's Drill",
      "Mithril Necklace",
      "Mithril Cloak",
      "Gemstone Chamber",
      "Mole Pet",
      "Ammonite",
      "Bejeweled Collar",
    ]);
  });

  it("keeps the icon cell's title only when it differs from the article", () => {
    // The real page draws `{{Slot|Ammonite Pet}}` on a row whose article is
    // plain [[Ammonite]], and `File:Ammonite.png` does not exist. The cell's
    // title is the wiki's own statement of where the image lives.
    expect(byName.get("Ammonite")!.wikiTitle).toBe("Ammonite Pet");
    // These rows draw exactly what they link, so there is nothing to carry.
    expect(byName.get("Bejeweled Collar")!.wikiTitle).toBeNull();
    expect(byName.get("Mole Pet")!.wikiTitle).toBeNull();
    expect(byName.get("Gemstone Chamber")!.wikiTitle).toBeNull();
  });

  it("resolves a DRL cost cell through the module data", () => {
    const r = byName.get("Bejeweled Handle")!;
    expect(r.ingredients).toEqual([{ name: "Glacite Jewel", qty: 3 }]);
    expect(r.seconds).toBe(30);
    expect(r.hotm).toBe(2);
    expect(r.section).toBe("Forging");
  });

  it("carries a spanned requirement cell down to the rows below it", () => {
    // Drill Motor's row has no requirement cell of its own; the II above
    // covers it via rowspan. Misplacing this shifts a duration into the
    // requirement column, which is why it is pinned here.
    const r = byName.get("Drill Motor")!;
    expect(r.hotm).toBe(2);
    expect(r.seconds).toBe(108000);
  });

  it("leaves ingredients empty when the module has no entry, rather than guessing", () => {
    expect(byName.get("Drill Motor")!.ingredients).toEqual([]);
  });

  it("cleans a templated requirement into readable words", () => {
    const r = byName.get("Divan's Drill")!;
    expect(r.hotm).toBe(7);
    expect(r.requirement).toBe("Glacite III collection");
    expect(r.ingredients).toEqual([
      { name: "Corleonite", qty: 30 },
      { name: "Divan's Alloy", qty: 1 },
    ]);
  });

  it("shares a spanned cost cell across its rows", () => {
    // Four Mithril accessories share one cost cell on the real page; two here.
    const necklace = byName.get("Mithril Necklace")!;
    const cloak = byName.get("Mithril Cloak")!;
    expect(necklace.ingredients).toEqual([{ name: "Enchanted Mithril", qty: 3 }]);
    expect(cloak.ingredients).toEqual([{ name: "Enchanted Mithril", qty: 3 }]);
    expect(cloak.seconds).toBe(3600);
    expect(cloak.hotm).toBe(2);
    expect(cloak.section).toBe("Gear");
  });

  it("splits coins out of an inline RL cost", () => {
    const r = byName.get("Gemstone Chamber")!;
    expect(r.ingredients).toEqual([{ name: "Worm Membrane", qty: 100 }]);
    expect(r.coins).toBe(25000);
  });

  it("reads a piped name link's target and a comma-grouped coin amount", () => {
    const r = byName.get("Mole Pet")!;
    expect(r.coins).toBe(300000);
    expect(r.ingredients).toEqual([{ name: "Claw Fossil", qty: 1 }]);
    expect(r.seconds).toBe(3 * 86400);
    expect(r.requirement).toBe("Donating Webbed Fossil to Dr. Stone");
  });
});

describe("mergeForgeItems", () => {
  const drl = parseDetailedListLua(LUA);
  const forge = buildForgeIndex(parseForgeTable(TABLE, drl));

  const base = (): ItemIndex => ({
    glacite_jewel: {
      name: "Glacite Jewel",
      hypixelId: "GLACITE_JEWEL",
      tier: "RARE",
      category: null,
      npcSell: null,
      yields: 1,
      recipe: null,
    },
    mithril_necklace: {
      name: "Mithril Necklace",
      hypixelId: null,
      tier: null,
      category: "NECKLACE",
      npcSell: null,
      yields: 1,
      recipe: [{ id: "diamond", name: "Diamond", qty: 1 }],
    },
  });

  it("adds a forge output the index had never heard of, with its recipe", () => {
    const merged = mergeForgeItems(base(), forge, new Set());
    expect(merged.bejeweled_handle).toBeDefined();
    expect(merged.bejeweled_handle.recipe).toEqual([{ id: "glacite_jewel", name: "Glacite Jewel", qty: 3 }]);
    expect(merged.bejeweled_handle.hypixelId).toBeNull();
  });

  it("never replaces a grid recipe with the forge one", () => {
    const merged = mergeForgeItems(base(), forge, new Set());
    expect(merged.mithril_necklace.recipe).toEqual([{ id: "diamond", name: "Diamond", qty: 1 }]);
  });

  it("keeps coins out of the recipe; a Coins node can never resolve", () => {
    const merged = mergeForgeItems(base(), forge, new Set());
    expect(merged.gemstone_chamber.recipe).toEqual([{ id: "worm_membrane", name: "Worm Membrane", qty: 100 }]);
  });

  it("takes a derived id only when the bazaar itself lists it", () => {
    const merged = mergeForgeItems(base(), forge, new Set(["BEJEWELED_HANDLE"]));
    expect(merged.bejeweled_handle.hypixelId).toBe("BEJEWELED_HANDLE");
    // Nothing confirms this one, so it stays honestly unknown.
    expect(merged.drill_motor.hypixelId).toBeNull();
  });

  it("extends the reverse index so an ingredient names what it forges", () => {
    const merged = mergeForgeItems(base(), forge, new Set());
    expect(merged.glacite_jewel.usedIn).toContain("bejeweled_handle");
    expect(merged.glacite_jewel.usedInTotal).toBe(1);
  });

  it("creates entries for unknown ingredients, so tree nodes have real names", () => {
    const merged = mergeForgeItems(base(), forge, new Set(["WORM_MEMBRANE"]));
    // Worm Membrane appears only as a forge ingredient, never as an output.
    expect(merged.worm_membrane).toBeDefined();
    expect(merged.worm_membrane.name).toBe("Worm Membrane");
    expect(merged.worm_membrane.recipe).toBeNull();
    expect(merged.worm_membrane.hypixelId).toBe("WORM_MEMBRANE");
    expect(merged.worm_membrane.usedIn).toContain("gemstone_chamber");
  });

  it("does not mutate its input", () => {
    const input = base();
    const frozenEntry = input.glacite_jewel;
    mergeForgeItems(input, forge, new Set());
    expect(input.glacite_jewel).toBe(frozenEntry);
    expect(input.glacite_jewel.usedIn).toBeUndefined();
    expect(input.bejeweled_handle).toBeUndefined();
  });

  it("carries the icon title onto the merged item, and only to fill a gap", () => {
    const merged = mergeForgeItems(base(), forge, new Set());
    expect(merged.ammonite.wikiTitle).toBe("Ammonite Pet");
    // A row whose icon matches its article contributes no title at all.
    expect(merged.bejeweled_collar.wikiTitle).toBeUndefined();

    const preTitled: ItemIndex = {
      ammonite: {
        name: "Ammonite",
        wikiTitle: "Somewhere Else",
        hypixelId: null,
        tier: null,
        category: null,
        npcSell: null,
        yields: 1,
        recipe: null,
      },
    };
    // An index that already resolves an image keeps its own answer.
    expect(mergeForgeItems(preTitled, forge, new Set()).ammonite.wikiTitle).toBe("Somewhere Else");
  });

  it("accepts a PET_ id for a Pets-section row only when the resource confirms it", () => {
    // Measured live 2026-08-03 the items resource lists none of the pet ids,
    // so the production answer is "none resolve"; the mechanism still has to
    // work the day Hypixel adds them, which is what the synthetic resource
    // check stands in for here.
    const confirming = (id: string) => id === "PET_AMMONITE";
    const merged = mergeForgeItems(base(), forge, new Set(), confirming);
    expect(merged.ammonite.hypixelId).toBe("PET_AMMONITE");
    // Bejeweled Collar sits in the Pets section but PET_BEJEWELED_COLLAR is
    // not a real id, so the guard keeps the guess off the index.
    expect(merged.bejeweled_collar.hypixelId).toBeNull();
    // Without confirmation nothing is guessed, section or no section.
    expect(mergeForgeItems(base(), forge, new Set()).ammonite.hypixelId).toBeNull();
    // Rows outside the Pets section never even derive a PET_ id.
    const everything = mergeForgeItems(base(), forge, new Set(), () => true);
    expect(everything.gemstone_chamber.hypixelId).toBeNull();
  });
});
