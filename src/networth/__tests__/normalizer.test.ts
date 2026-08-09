import { describe, expect, it } from "vitest";
import { SkyBlockItem } from "../itemHelper";
import { TEST_CATALOGUE, TEST_PRICES } from "./testPrices";
import fixture from "./fixtures/items.json";
import type { PriceMap, RawItem } from "../types";

/**
 * The id normaliser.
 *
 * Every case here is a real item where the id Hypixel stores is NOT the id the
 * market trades under. Getting one wrong does not throw; it silently prices a
 * skinned Hyperion as a plain one, or a party hat as the wrong colour, and the
 * total is quietly low by however much the difference was. That is the failure
 * shape these tests exist for.
 *
 * The items are verbatim auction documents (see fixtures/items.json). Only the
 * price table is ours, and it is written so each expectation is legible.
 */

const items = fixture.items as unknown as Record<string, RawItem>;

const resolve = (item: RawItem, prices: PriceMap = TEST_PRICES): string =>
  new SkyBlockItem(item, TEST_CATALOGUE).resolveItemId(prices);

describe("item id normalisation", () => {
  it("leaves an ordinary item alone", () => {
    expect(resolve(items.plain)).toBe("LARGE_SCAFFOLDING");
  });

  it("prefers the shiny variant when the prices file has one", () => {
    // The captured Hyperion carries `is_shiny: 1`.
    expect(items.shiny.tag?.ExtraAttributes?.is_shiny).toBeTruthy();
    expect(resolve(items.shiny)).toBe("HYPERION_SHINY");
  });

  it("falls back to the plain id when the shiny variant is not priced", () => {
    const withoutShiny: PriceMap = { ...TEST_PRICES };
    delete withoutShiny.HYPERION_SHINY;
    expect(resolve(items.shiny, withoutShiny)).toBe("HYPERION");
  });

  it("uses the skinned id only when the skin is worth more", () => {
    expect(items.skinned.tag?.ExtraAttributes?.skin).toBe("NUTCRACKER_KNIGHT");
    expect(resolve(items.skinned)).toBe("NUTCRACKER_HELMET_SKINNED_NUTCRACKER_KNIGHT");
  });

  it("ignores a skin that would make the item look cheaper", () => {
    // The rule is a strict `>`, not "a skinned entry exists". An unwanted skin
    // must not drag the item below its own floor.
    const cheapSkin: PriceMap = {
      ...TEST_PRICES,
      NUTCRACKER_HELMET_SKINNED_NUTCRACKER_KNIGHT: 10,
    };
    expect(resolve(items.skinned, cheapSkin)).toBe("NUTCRACKER_HELMET");
  });

  it("resolves a sloth party hat by its emoji", () => {
    expect(items.partyHatEmoji.tag?.ExtraAttributes?.party_hat_emoji).toBe("tears");
    expect(resolve(items.partyHatEmoji)).toBe("PARTY_HAT_SLOTH_TEARS");
  });

  it("resolves a balloon hat by its colour", () => {
    expect(items.partyHatColour.tag?.ExtraAttributes?.party_hat_color).toBe("red");
    expect(resolve(items.partyHatColour)).toBe("BALLOON_HAT_2024_RED");
  });

  it("resolves a new year cake by its year", () => {
    expect(items.newYearCake.tag?.ExtraAttributes?.new_years_cake).toBe(169);
    expect(resolve(items.newYearCake)).toBe("NEW_YEAR_CAKE_169");
  });

  it("resolves a rune to its type and tier", () => {
    // The carrier item is a Hyperion with `runes: { MUSIC: 3 }`. The rune
    // branch only fires for an item whose own id is RUNE or UNIQUE_RUNE, so
    // this proves the branch does NOT capture an item merely wearing one.
    expect(items.runeCarrier.tag?.ExtraAttributes?.runes).toEqual({ MUSIC: 3 });
    expect(resolve(items.runeCarrier)).toBe("HYPERION_SHINY");
  });

  it("does not treat an ordinary editioned item as a special edition", () => {
    // Only three ids read `edition`. A Great Spook Boots carrying one is the
    // negative case that stops the rule being written as "any edition field".
    expect(items.editioned.tag?.ExtraAttributes?.edition).toBeDefined();
    expect(resolve(items.editioned)).toBe("GREAT_SPOOK_BOOTS");
  });

  it("unfrags a STARRED_ id when only the plain one is priced", () => {
    expect(items.starredFragged.tag?.ExtraAttributes?.id).toBe("STARRED_BAT_WAND");
    // BAT_WAND is priced, STARRED_BAT_WAND is not.
    expect(resolve(items.starredFragged)).toBe("BAT_WAND");
  });

  it("keeps a STARRED_ id when it has its own price", () => {
    const withStarred: PriceMap = { ...TEST_PRICES, STARRED_BAT_WAND: 99_000_000 };
    expect(resolve(items.starredFragged, withStarred)).toBe("STARRED_BAT_WAND");
  });
});

describe("item flags", () => {
  it("reads a recombobulator off rarity_upgrades", () => {
    const item = new SkyBlockItem(items.recombobulated, TEST_CATALOGUE);
    expect(item.isRecombobulated()).toBe(true);
  });

  it("does not count a rarity upgrade that came with the item", () => {
    // `item_tier` present means the rarity was granted, not bought. Built from
    // the captured Hyperion with that one attribute added, which is the whole
    // difference the rule turns on.
    const withItemTier: RawItem = structuredClone(items.recombobulated);
    withItemTier.tag!.ExtraAttributes!.item_tier = 5;
    expect(new SkyBlockItem(withItemTier, TEST_CATALOGUE).isRecombobulated()).toBe(false);
  });

  it("is not soulbound without a marker", () => {
    expect(new SkyBlockItem(items.recombobulated, TEST_CATALOGUE).isSoulbound()).toBe(false);
  });

  it("reads soulbound off the museum flag and off the lore line", () => {
    // Soulbound items cannot be auctioned, so no captured document carries
    // either marker. Both markers are applied here to a verbatim item, and the
    // parity script performs the identical transformation against the real
    // library, so the rule itself is proven upstream rather than only here.
    const donated: RawItem = structuredClone(items.recombobulated);
    donated.tag!.ExtraAttributes!.donated_museum = true;
    expect(new SkyBlockItem(donated, TEST_CATALOGUE).isSoulbound()).toBe(true);

    const lored: RawItem = structuredClone(items.recombobulated);
    lored.tag!.display!.Lore = [...(lored.tag!.display!.Lore ?? []), "§8§l* §8Soulbound §8§l*"];
    expect(new SkyBlockItem(lored, TEST_CATALOGUE).isSoulbound()).toBe(true);
  });

  it("strips colour codes from the display name", () => {
    const item = new SkyBlockItem(items.recombobulated, TEST_CATALOGUE);
    expect(item.itemName).not.toContain("§");
    expect(item.itemName.length).toBeGreaterThan(0);
  });

  it("only sees a skin as cosmetic once the id has been normalised", () => {
    // Before normalisation the id is NUTCRACKER_HELMET and the name carries no
    // SKIN or DYE, so the heuristic cannot fire. After `applyBasePrice` the id
    // is NUTCRACKER_HELMET_SKINNED_NUTCRACKER_KNIGHT and it can. Upstream
    // checks the flag on both sides of the handlers for exactly this reason,
    // and this test pins the ordering rather than the convenient half of it.
    const skinned = new SkyBlockItem(items.skinned, TEST_CATALOGUE);
    expect(skinned.isCosmetic()).toBe(false);
    skinned.applyBasePrice(TEST_PRICES);
    expect(skinned.isCosmetic()).toBe(true);

    const plain = new SkyBlockItem(items.plain, TEST_CATALOGUE);
    plain.applyBasePrice(TEST_PRICES);
    expect(plain.isCosmetic()).toBe(false);
  });

  it("refuses a document with no display name", () => {
    expect(() => new SkyBlockItem({ Count: 1 }, TEST_CATALOGUE)).toThrow(/display name/i);
  });
});
