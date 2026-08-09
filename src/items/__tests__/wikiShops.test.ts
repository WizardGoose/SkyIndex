import { describe, it, expect } from "vitest";
import { buildShopIndex, describeCosts, parseCosts, parseShopUiPage, type ShopStock } from "../wikiShops";

/**
 * Fixtures are minimal synthetic wikitext shaped exactly like the wiki's
 * `{{Shop UI}}` subpages: the same tooltip syntax (`/` lines, `//` paragraphs,
 * `&x` colour codes, `\,` escaped commas), the same named parameters, the same
 * coordinate-keyed furniture slots. Structure is copied, content is not.
 */

const FARM_STYLE = `{{Shop UI|{{{1|Test Merchant}}}
|Wheat; 3, none, &fWheat &8x3, %inherit%//&7Cost/&630 Coins//&eClick to trade!/&eRight-Click for more trading options!
|Pumpkin, none, %inherit%, %inherit%//&7Cost/&625 Coins//&eClick to trade!
|Ice, none, %inherit%, %inherit%//&7Cost/&61 Coin//&7Stock/&6640 &7remaining//&eClick to trade!
|Winter Sack, none, %inherit%, %inherit%//&7Cost/&6250\\,000 Coins//&eClick to trade!
|arrow=none
}}<!--

--><includeonly>[[Category:Pages with UIs]]</includeonly><!--
--><noinclude>[[Category:UI Subpages]]</noinclude>`;

const BARTER_STYLE = `{{Shop UI
|Salt Cube, none, %inherit%, %inherit%//&7Cost/&aHunk of Ice &8x64//&eClick to trade!
|Fancy Pickaxe, none, %inherit%, %inherit%//&7Cost/&aRusty Pickaxe/&5Enchanted Titanium &8x4/&9Bejeweled Handle//&eClick to trade!
|Plumber's Bucket, none, %inherit%, %inherit%//&7Cost/&d1\\,000 Motes//&eClick to trade!
|Zoo Pet, none, &7[Lvl 100] &9Elephant, &8Farming Pet//&7Health: &a+100//&7Cost/&6100\\,000 Coins/&aEnchanted Dark Oak Wood &8x16//&eClick to trade!
|3, 3=Anvil, none;none, &eApply Salty Reforge, &7Place a rod above.//&7Cost/&aHunk of Ice &8x64
|confirmation=false
|noarrow = true
}}`;

/** Two tabs restating the same shop, as the dungeon-floor pages do. */
const TABBED = `<tabber>
|-|Default=<div class="sbw-ui-tabber">
{{Shop UI|Tab Shop
|Potion I, none, %inherit%, %inherit%//&7Cost/&65\\,000 Coins//&eClick to trade!
}}
</div>
|-|Floor II=<div class='sbw-ui-tabber'>
{{Shop UI|Tab Shop
|Potion I, none, %inherit%, %inherit%//&7Cost/&65\\,000 Coins//&eClick to trade!
|Potion II, none, %inherit%, %inherit%//&7Cost/&610\\,000 Coins//&eClick to trade!
}}
</div>
</tabber>`;

describe("parseCosts", () => {
  it("reads a coin price out of the Cost paragraph and nothing else", () => {
    expect(parseCosts(" none, %inherit%//&7Cost/&630 Coins//&eClick to trade!")).toEqual([
      { kind: "currency", currency: "Coins", amount: 30 },
    ]);
  });

  it("folds the singular Coin into the same currency", () => {
    expect(parseCosts("//&7Cost/&61 Coin//&eClick!")).toEqual([{ kind: "currency", currency: "Coins", amount: 1 }]);
  });

  it("unescapes thousands separators", () => {
    expect(parseCosts("//&7Cost/&6250\\,000 Coins//x")).toEqual([{ kind: "currency", currency: "Coins", amount: 250000 }]);
  });

  it("reads non-coin currencies as they are named", () => {
    expect(parseCosts("//&7Cost/&d5\\,000 Motes//x")).toEqual([{ kind: "currency", currency: "Motes", amount: 5000 }]);
  });

  it("reads item barters, with and without a quantity", () => {
    expect(parseCosts("//&7Cost/&fIron Ingot &8x24//x")).toEqual([{ kind: "item", name: "Iron Ingot", qty: 24 }]);
    expect(parseCosts("//&7Cost/&aCleaver//x")).toEqual([{ kind: "item", name: "Cleaver", qty: 1 }]);
  });

  it("keeps a mixed price in the tooltip's order", () => {
    expect(parseCosts("//&7Cost/&6100\\,000 Coins/&aEnchanted Dark Oak Wood &8x16//x")).toEqual([
      { kind: "currency", currency: "Coins", amount: 100000 },
      { kind: "item", name: "Enchanted Dark Oak Wood", qty: 16 },
    ]);
  });

  it("does not let a Stock paragraph leak into the price", () => {
    const costs = parseCosts("//&7Cost/&610 Coins//&7Stock/&6640 &7remaining//&eClick!");
    expect(costs).toEqual([{ kind: "currency", currency: "Coins", amount: 10 }]);
  });

  it("returns nothing for a tooltip with no Cost paragraph", () => {
    expect(parseCosts("//&7Just some lore//&eClick!")).toEqual([]);
  });
});

describe("parseShopUiPage", () => {
  it("reads a plain merchant page, stacks and all", () => {
    const offers = parseShopUiPage(FARM_STYLE);
    expect(offers).toEqual([
      { item: "Wheat", stack: 3, costs: [{ kind: "currency", currency: "Coins", amount: 30 }] },
      { item: "Pumpkin", stack: 1, costs: [{ kind: "currency", currency: "Coins", amount: 25 }] },
      { item: "Ice", stack: 1, costs: [{ kind: "currency", currency: "Coins", amount: 1 }] },
      { item: "Winter Sack", stack: 1, costs: [{ kind: "currency", currency: "Coins", amount: 250000 }] },
    ]);
  });

  it("skips named parameters and coordinate-keyed furniture slots", () => {
    const offers = parseShopUiPage(BARTER_STYLE);
    expect(offers.map((o) => o.item)).toEqual(["Salt Cube", "Fancy Pickaxe", "Plumber's Bucket", "Zoo Pet"]);
  });

  it("keeps a multi-component barter price intact", () => {
    const offers = parseShopUiPage(BARTER_STYLE);
    expect(offers.find((o) => o.item === "Fancy Pickaxe")!.costs).toEqual([
      { kind: "item", name: "Rusty Pickaxe", qty: 1 },
      { kind: "item", name: "Enchanted Titanium", qty: 4 },
      { kind: "item", name: "Bejeweled Handle", qty: 1 },
    ]);
  });

  it("survives an entry whose lore itself contains commas and paragraphs", () => {
    const offers = parseShopUiPage(BARTER_STYLE);
    expect(offers.find((o) => o.item === "Zoo Pet")!.costs).toEqual([
      { kind: "currency", currency: "Coins", amount: 100000 },
      { kind: "item", name: "Enchanted Dark Oak Wood", qty: 16 },
    ]);
  });

  it("deduplicates entries restated across tabs, keeping genuinely new ones", () => {
    const offers = parseShopUiPage(TABBED);
    expect(offers).toEqual([
      { item: "Potion I", stack: 1, costs: [{ kind: "currency", currency: "Coins", amount: 5000 }] },
      { item: "Potion II", stack: 1, costs: [{ kind: "currency", currency: "Coins", amount: 10000 }] },
    ]);
  });
});

describe("buildShopIndex", () => {
  const shops: ShopStock[] = [
    { npc: "Test Merchant", offers: parseShopUiPage(FARM_STYLE) },
    {
      npc: "Other Merchant",
      offers: [{ item: "Wheat", stack: 1, costs: [{ kind: "currency", currency: "Coins", amount: 10 }] }],
    },
  ];

  it("lists every shop selling an item, in shop order", () => {
    const index = buildShopIndex(shops);
    const listings = index.byItem.get("wheat")!;
    expect(listings.map((l) => l.npc)).toEqual(["Test Merchant", "Other Merchant"]);
  });

  it("answers with nothing, not an empty claim, for an unsold item", () => {
    const index = buildShopIndex(shops);
    expect(index.byItem.get("hyperion")).toBeUndefined();
  });
});

describe("describeCosts", () => {
  it("writes the line the UI shows", () => {
    expect(
      describeCosts([
        { kind: "currency", currency: "Coins", amount: 100000 },
        { kind: "item", name: "Enchanted Dark Oak Wood", qty: 16 },
      ])
    ).toBe("100,000 coins + 16x Enchanted Dark Oak Wood");
  });
});
