import { describe, expect, it } from "vitest";
import { valueItem } from "../itemValue";
import { APPLICATION_WORTH } from "../constants";
import { TEST_CATALOGUE, TEST_PRICES } from "./testPrices";
import fixture from "./fixtures/items.json";
import type { CalculationEntry, PriceMap, RawItem, ValuedItem } from "../types";

/**
 * The modifier handlers, one real item at a time.
 *
 * Each item below is a verbatim auction document that genuinely carries the
 * attribute under test, so these prove the handler fires on the shape Hypixel
 * actually sends rather than on a shape written to make it fire.
 *
 * The assertions are on the CALCULATION LINE, not on the total. A handler that
 * quietly adds to the wrong total still moves the number; one that produces the
 * wrong id, type or price is caught here.
 */

const items = fixture.items as unknown as Record<string, RawItem>;

const value = (item: RawItem, prices: PriceMap = TEST_PRICES, nonCosmetic = false): ValuedItem => {
  const result = valueItem(item, { prices, catalogue: TEST_CATALOGUE, nonCosmetic });
  if (!result) throw new Error("expected a valuation");
  return result;
};

const line = (result: ValuedItem, type: string): CalculationEntry | undefined =>
  result.calculation.find((c) => c.type === type);

const linesOf = (result: ValuedItem, type: string): CalculationEntry[] =>
  result.calculation.filter((c) => c.type === type);

describe("Recombobulator", () => {
  it("charges 80 percent of the stone on an enchanted item", () => {
    const result = value(items.recombobulated);
    expect(line(result, "RECOMBOBULATOR_3000")).toEqual({
      id: "RECOMBOBULATOR_3000",
      type: "RECOMBOBULATOR_3000",
      price: 10_000_000 * APPLICATION_WORTH.recombobulator,
      count: 1,
    });
  });

  it("stands down on an item that is neither enchanted, an accessory, nor on the allow list", () => {
    // A plain block with a rarity upgrade cannot resell that upgrade, so the
    // stone is worth nothing on it.
    const plainRecombed: RawItem = structuredClone(items.plain);
    plainRecombed.tag!.ExtraAttributes!.rarity_upgrades = 1;
    expect(line(value(plainRecombed), "RECOMBOBULATOR_3000")).toBeUndefined();
  });
});

describe("PotatoBooks", () => {
  it("splits fifteen books into ten hot and five fuming", () => {
    expect(items.hotPotato.tag?.ExtraAttributes?.hot_potato_count).toBe(15);
    const result = value(items.hotPotato);

    expect(line(result, "HOT_POTATO_BOOK")).toEqual({
      id: "HOT_POTATO_BOOK",
      type: "HOT_POTATO_BOOK",
      price: 100_000 * 10 * APPLICATION_WORTH.hotPotatoBook,
      count: 10,
    });
    expect(line(result, "FUMING_POTATO_BOOK")).toEqual({
      id: "FUMING_POTATO_BOOK",
      type: "FUMING_POTATO_BOOK",
      price: 1_000_000 * 5 * APPLICATION_WORTH.fumingPotatoBook,
      count: 5,
    });
  });
});

describe("Reforge", () => {
  it("prices the stone behind the modifier", () => {
    // `fabled` is applied by a Dragon Claw.
    expect(items.recombobulated.tag?.ExtraAttributes?.modifier).toBe("fabled");
    expect(line(value(items.recombobulated), "REFORGE")).toEqual({
      id: "DRAGON_CLAW",
      type: "REFORGE",
      price: 3_000_000 * APPLICATION_WORTH.reforge,
      count: 1,
    });
  });

  it("ignores a modifier with no stone behind it", () => {
    // The captured rod carries `modifier: "epic"`, which is a rarity prefix
    // rather than a reforge, so no stone exists and nothing is charged.
    expect(items.rodParts.tag?.ExtraAttributes?.modifier).toBe("epic");
    expect(line(value(items.rodParts), "REFORGE")).toBeUndefined();
  });
});

describe("ArtOfWar and ArtOfPeace", () => {
  it("charges 60 percent for the Art of War", () => {
    expect(line(value(items.artOfWar), "THE_ART_OF_WAR")).toEqual({
      id: "THE_ART_OF_WAR",
      type: "THE_ART_OF_WAR",
      price: 5_000_000 * 1 * APPLICATION_WORTH.artOfWar,
      count: 1,
    });
  });

  it("charges 80 percent for the Art of Peace", () => {
    const applied = items.artOfPeace.tag?.ExtraAttributes?.artOfPeaceApplied as number;
    expect(applied).toBeGreaterThan(0);
    expect(line(value(items.artOfPeace), "THE_ART_OF_PEACE")).toEqual({
      id: "THE_ART_OF_PEACE",
      type: "THE_ART_OF_PEACE",
      price: 20_000_000 * applied * APPLICATION_WORTH.artOfPeace,
      count: applied,
    });
  });
});

describe("Gemstones", () => {
  it("prices each gem sitting in a slot", () => {
    // The captured Hyperion holds a FINE Jasper in a COMBAT slot and a FINE
    // Sapphire in its own. The COMBAT slot is a universal one, so its gem type
    // comes from the `COMBAT_0_gem` sibling key rather than from the slot name.
    const result = value(items.gemstoned);
    const gems = linesOf(result, "GEMSTONE");
    expect(gems.map((g) => g.id).sort()).toEqual(["FINE_JASPER_GEM", "FINE_SAPPHIRE_GEM"]);
    expect(gems.find((g) => g.id === "FINE_JASPER_GEM")?.price).toBe(400_000 * APPLICATION_WORTH.gemstone);
    expect(gems.find((g) => g.id === "FINE_SAPPHIRE_GEM")?.price).toBe(300_000 * APPLICATION_WORTH.gemstone);
  });

  it("charges nothing for unlocking slots on an item that is not Divan or Crimson", () => {
    // Only Divan's and the Crimson family charge for their slots. A Hyperion's
    // are free, so no GEMSTONE_SLOT line may appear.
    expect(linesOf(value(items.gemstoned), "GEMSTONE_SLOT")).toHaveLength(0);
  });
});

describe("EssenceStars and MasterStars", () => {
  it("charges each essence star at 75 percent, one line per star", () => {
    // Five stars on the captured Hyperion, and its catalogue ladder is
    // 150, 300, 500, 900, 1500 Wither Essence.
    expect(items.starred.tag?.ExtraAttributes?.upgrade_level).toBe(5);
    const stars = linesOf(value(items.starred), "STAR");
    expect(stars.map((s) => s.count)).toEqual([150, 300, 500, 900, 1500]);
    expect(stars.map((s) => s.star)).toEqual([1, 2, 3, 4, 5]);
    expect(stars[0]).toEqual({
      id: "WITHER_ESSENCE",
      type: "STAR",
      price: 150 * 1_000 * APPLICATION_WORTH.essence,
      count: 150,
      star: 1,
    });
  });

  it("adds master stars for levels past five", () => {
    // Nine stars, on an item whose essence ladder stops at five, is four
    // master stars.
    expect(items.masterStarred.tag?.ExtraAttributes?.upgrade_level).toBe(9);
    const masters = linesOf(value(items.masterStarred), "MASTER_STAR");
    expect(masters.map((m) => m.id)).toEqual([
      "FIRST_MASTER_STAR",
      "SECOND_MASTER_STAR",
      "THIRD_MASTER_STAR",
      "FOURTH_MASTER_STAR",
    ]);
    expect(masters[0].price).toBe(50_000_000 * APPLICATION_WORTH.masterStar);
  });

  it("adds no master stars at exactly five", () => {
    expect(linesOf(value(items.starred), "MASTER_STAR")).toHaveLength(0);
  });
});

describe("RodParts", () => {
  it("prices each part and marks a museum-donated one as soulbound", () => {
    const result = value(items.rodParts);
    const parts = linesOf(result, "ROD_PART");
    expect(parts.map((p) => p.id).sort()).toEqual(["COMMON_HOOK", "JUNK_SINKER", "SPEEDY_LINE"]);
    expect(parts.every((p) => p.soulbound === false)).toBe(true);
    expect(result.soulboundPortion).toBe(0);

    // The one modifier that can be soulbound while its host is not. Applied to
    // the verbatim document, because a donated part cannot be auctioned.
    const donatedPart: RawItem = structuredClone(items.rodParts);
    (donatedPart.tag!.ExtraAttributes!.hook as Record<string, unknown>).donated_museum = true;
    const withDonation = value(donatedPart);
    expect(withDonation.soulbound).toBe(false);
    expect(withDonation.soulboundPortion).toBe(300_000 * APPLICATION_WORTH.rodPart);
  });
});

describe("DrillParts", () => {
  it("prices the parts named on the drill", () => {
    const parts = linesOf(value(items.drillParts), "DRILL_PART");
    expect(parts.map((p) => p.id).sort()).toEqual(["MITHRIL_DRILL_ENGINE", "MITHRIL_FUEL_TANK"]);
    expect(parts.find((p) => p.id === "MITHRIL_DRILL_ENGINE")?.price).toBe(
      2_500_000 * APPLICATION_WORTH.drillPart
    );
  });
});

describe("Enrichment", () => {
  it("prices the cheapest enrichment, not the one that is fitted", () => {
    // Any enrichment swaps for any other at no cost, so the fitted one
    // (`magic_find`, priced 4,000,000 here) is worth what the cheapest costs.
    expect(items.enrichment.tag?.ExtraAttributes?.talisman_enrichment).toBe("magic_find");
    expect(line(value(items.enrichment), "TALISMAN_ENRICHMENT")).toEqual({
      id: "MAGIC_FIND",
      type: "TALISMAN_ENRICHMENT",
      price: 1_000_000 * APPLICATION_WORTH.enrichment,
      count: 1,
    });
  });
});

describe("PulseRingThunder", () => {
  it("converts thunder charge into bottles, capped", () => {
    // Five million charge is the cap, and one bottle is fifty thousand.
    expect(items.thunder.tag?.ExtraAttributes?.thunder_charge).toBe(5_000_000);
    expect(line(value(items.thunder), "THUNDER_CHARGE")).toEqual({
      id: "THUNDER_IN_A_BOTTLE",
      type: "THUNDER_CHARGE",
      price: 500_000 * 100 * APPLICATION_WORTH.thunderInABottle,
      count: 100,
    });
  });
});

describe("ItemEnchantments", () => {
  it("prices an enchantment at 85 percent by default", () => {
    const result = value(items.manaDisintegrator);
    expect(line(result, "ENCHANTMENT")).toEqual({
      id: "ULTIMATE_WISE_5",
      type: "ENCHANTMENT",
      price: 20_000_000 * APPLICATION_WORTH.enchantments,
      count: 1,
    });
  });

  it("flattens a stacking enchantment to level one", () => {
    // The captured Hyperion has Champion 5, which was earned rather than
    // bought, so only the level 1 book it started as is worth anything.
    expect(items.stackingEnchant.tag?.ExtraAttributes?.enchantments).toMatchObject({ champion: 5 });
    const enchants = linesOf(value(items.stackingEnchant), "ENCHANTMENT");
    expect(enchants.find((e) => e.id.startsWith("CHAMPION"))?.id).toBe("CHAMPION_1");
    expect(enchants.find((e) => e.id === "CHAMPION_5")).toBeUndefined();
  });

  it("ignores an enchantment level the item came with", () => {
    // Scavenger 5 is on the ignore list, and the price table deliberately
    // carries a large ENCHANTMENT_SCAVENGER_5 so a regression would be loud.
    expect(items.stackingEnchant.tag?.ExtraAttributes?.enchantments).toMatchObject({ scavenger: 5 });
    const enchants = linesOf(value(items.stackingEnchant), "ENCHANTMENT");
    expect(enchants.find((e) => e.id === "SCAVENGER_5")).toBeUndefined();
  });

  it("charges for Silexes behind Efficiency above five", () => {
    // The captured drill carries Efficiency 6 or higher.
    const efficiency = (items.silex.tag?.ExtraAttributes?.enchantments as Record<string, number>).efficiency;
    expect(efficiency).toBeGreaterThanOrEqual(6);
    expect(line(value(items.silex), "SILEX")).toEqual({
      id: "SIL_EX",
      type: "SILEX",
      price: 5_000_000 * (efficiency - 5) * APPLICATION_WORTH.silex,
      count: efficiency - 5,
    });
  });

  it("uses the per-enchantment factor where one exists", () => {
    // Counter-Strike resells at 0.2, not 0.85, because the market for it is
    // thin. Applied to a verbatim item by adding the one enchantment.
    const withCounterStrike: RawItem = structuredClone(items.manaDisintegrator);
    withCounterStrike.tag!.ExtraAttributes!.enchantments = { counter_strike: 5 };
    expect(line(value(withCounterStrike), "ENCHANTMENT")).toEqual({
      id: "COUNTER_STRIKE_5",
      type: "ENCHANTMENT",
      price: 100_000_000 * 0.2,
      count: 1,
    });
  });
});

describe("NecronBladeScrolls", () => {
  it("prices every scroll at full worth", () => {
    const scrolls = linesOf(value(items.abilityScroll), "NECRON_SCROLL");
    expect(scrolls.map((s) => s.id).sort()).toEqual([
      "IMPLOSION_SCROLL",
      "SHADOW_WARP_SCROLL",
      "WITHER_SHIELD_SCROLL",
    ]);
    expect(scrolls.find((s) => s.id === "IMPLOSION_SCROLL")?.price).toBe(
      30_000_000 * APPLICATION_WORTH.necronBladeScroll
    );
  });
});

describe("EtherwarpConduit and TransmissionTuner", () => {
  it("prices the conduit at full worth and each tuner at 70 percent", () => {
    const result = value(items.etherwarp);
    expect(line(result, "ETHERWARP_CONDUIT")?.price).toBe(15_000_000 * APPLICATION_WORTH.etherwarp);

    const tuned = items.transmissionTuner.tag?.ExtraAttributes?.tuned_transmission as number;
    expect(tuned).toBe(4);
    expect(line(result, "TRANSMISSION_TUNER")).toEqual({
      id: "TRANSMISSION_TUNER",
      type: "TRANSMISSION_TUNER",
      price: 2_000_000 * 4 * APPLICATION_WORTH.tunedTransmission,
      count: 4,
    });
  });
});

describe("Rune", () => {
  it("prices a rune fitted to another item at 60 percent", () => {
    expect(line(value(items.runeCarrier), "RUNE")).toEqual({
      id: "RUNE_MUSIC_3",
      type: "RUNE",
      price: 2_000_000 * APPLICATION_WORTH.runes,
      count: 1,
    });
  });

  it("drops the rune entirely from a cosmetic-free total", () => {
    expect(line(value(items.runeCarrier, TEST_PRICES, true), "RUNE")).toBeUndefined();
  });
});

describe("MidasWeapon", () => {
  it("switches to the maxed market price once the bid reaches the cap", () => {
    // The captured sword was won for 312,980,000, past the 250 million cap a
    // starred Midas Sword tops out at.
    expect(items.midasWeapon.tag?.ExtraAttributes?.winning_bid).toBe(312_980_000);
    const result = value(items.midasWeapon);
    expect(line(result, "STARRED_MIDAS_SWORD_250M")?.price).toBe(900_000_000);
    // Replaces the base price rather than adding to it, so a maxed Midas is
    // not its ordinary price plus a premium.
    expect(result.basePrice).toBe(900_000_000);
  });

  it("leaves the ordinary price alone below the cap", () => {
    const underBid: RawItem = structuredClone(items.midasWeapon);
    underBid.tag!.ExtraAttributes!.winning_bid = 1_000_000;
    const result = value(underBid);
    expect(line(result, "STARRED_MIDAS_SWORD_250M")).toBeUndefined();
    expect(result.basePrice).toBe(600_000_000);
  });
});

describe("Booster and Polarvoid", () => {
  it("prices foraging boosters at 80 percent", () => {
    const boosters = items.boosters.tag?.ExtraAttributes?.boosters as string[];
    expect(boosters.length).toBeGreaterThan(0);
    const lines = linesOf(value(items.boosters), "BOOSTER");
    // Only boosters the price table knows produce a line, which is the rule.
    for (const entry of lines) {
      expect(entry.price).toBe((TEST_PRICES[entry.id] ?? 0) * APPLICATION_WORTH.booster);
    }
  });

  it("prices polarvoid books by count", () => {
    const count = items.polarvoid.tag?.ExtraAttributes?.polarvoid as number;
    expect(count).toBe(5);
    expect(line(value(items.polarvoid), "POLARVOID_BOOK")).toEqual({
      id: "POLARVOID_BOOK",
      type: "POLARVOID_BOOK",
      price: 1_100_000 * 5 * APPLICATION_WORTH.polarvoidBook,
      count: 5,
    });
  });
});

describe("the base price", () => {
  it("multiplies by the stack count", () => {
    const stacked: RawItem = structuredClone(items.plain);
    stacked.Count = 16;
    expect(value(stacked).basePrice).toBe(1_000 * 16);
    expect(value(stacked).count).toBe(16);
  });

  it("is zero for an item nothing has priced, and the item still comes back", () => {
    const unknown: RawItem = structuredClone(items.plain);
    unknown.tag!.ExtraAttributes!.id = "SOMETHING_NOBODY_HAS_PRICED";
    const result = value(unknown);
    // Zero, not null. "We do not know what this is worth" is not the same
    // claim as "this is worth nothing", and the row still names the item.
    expect(result.price).toBe(0);
    expect(result.id).toBe("SOMETHING_NOBODY_HAS_PRICED");
  });
});
