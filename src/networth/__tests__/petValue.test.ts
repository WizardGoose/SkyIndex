import { describe, expect, it } from "vitest";
import { petLevel, valuePet, isPetSoulbound } from "../petValue";
import { APPLICATION_WORTH, XP_TO_LEVEL_100 } from "../constants";
import { TEST_PRICES } from "./testPrices";
import fixture from "./fixtures/pets.json";
import type { PetData, PriceMap } from "../types";

/**
 * Pet valuation.
 *
 * A pet has no price of its own. The prices file carries anchors at level 1,
 * 100 and 200, and everything between is interpolated, so the level is doing
 * the work and getting it wrong moves the number by orders of magnitude rather
 * than by a rounding error. That is why the level test comes first.
 *
 * The pets are verbatim `petInfo` objects parsed off real auctioned pet items.
 */

const pets = fixture.pets as unknown as Record<string, PetData>;

const value = (pet: PetData, prices: PriceMap = TEST_PRICES, nonCosmetic = false) => {
  const result = valuePet(pet, { prices, nonCosmetic });
  if (!result) throw new Error("expected a valuation");
  return result;
};

describe("pet level", () => {
  it("is 1 at zero experience", () => {
    expect(pets.lowExp.exp).toBe(0);
    expect(petLevel(pets.lowExp).level).toBe(1);
  });

  it("is 100 once the ladder is complete", () => {
    // The captured Enderman has 94 million experience against a legendary
    // ladder that tops out around 25 million.
    expect(pets.highExp.exp).toBeGreaterThan(XP_TO_LEVEL_100.LEGENDARY);
    expect(petLevel(pets.highExp).level).toBe(100);
  });

  it("caps at the pet's own maximum rather than running past it", () => {
    // The loop deliberately runs one step past the end of the ladder, which is
    // why the clamp exists. Without it a maxed pet would read 101.
    const absurd: PetData = { ...pets.highExp, exp: 1e12 };
    expect(petLevel(absurd).level).toBe(100);
  });

  it("reports the rarity's own experience-to-100 as the interpolation denominator", () => {
    expect(petLevel(pets.withHeldItem).xpMaxTo100).toBe(XP_TO_LEVEL_100.LEGENDARY);
  });
});

describe("pet interpolation", () => {
  it("sits exactly on the level 1 anchor at zero experience", () => {
    // slope * 0 + LVL_1 is LVL_1, which is the boundary the formula has to get
    // right for a freshly-hatched pet not to be valued as a maxed one.
    expect(value(pets.lowExp).basePrice).toBe(500_000);
  });

  it("interpolates linearly in experience below level 100", () => {
    const pet = pets.withHeldItem;
    const level = petLevel(pet);
    expect(level.level).toBeLessThan(100);

    const slope = (51_000_000 - 1_000_000) / XP_TO_LEVEL_100.LEGENDARY;
    expect(value(pet).basePrice).toBeCloseTo(slope * level.xp + 1_000_000, 6);
  });

  it("sits on the level 100 anchor once maxed", () => {
    // The skinned anchor wins because it is the larger of the two.
    expect(value(pets.highExp).basePrice).toBe(260_000_000);
  });

  it("drops the skin from a cosmetic-free total", () => {
    expect(value(pets.highExp, TEST_PRICES, true).basePrice).toBe(210_000_000);
  });

  it("never lets an unwanted skin lower the price", () => {
    // The anchors are a Math.max against the unskinned pair, so a skin worth
    // less than the plain pet cannot drag it down.
    const cheapSkin: PriceMap = {
      ...TEST_PRICES,
      LVL_1_MYTHIC_ENDERMAN_SKINNED_ENDERMAN_SLAYER: 1,
      LVL_100_MYTHIC_ENDERMAN_SKINNED_ENDERMAN_SLAYER: 2,
    };
    expect(value(pets.highExp, cheapSkin).basePrice).toBe(210_000_000);
  });
});

describe("pet modifiers", () => {
  it("adds the held item at full worth", () => {
    const result = value(pets.withHeldItem);
    expect(result.calculation).toContainEqual({
      id: "PET_ITEM_MINING_SKILL_BOOST_RARE",
      type: "PET_ITEM",
      price: 3_000_000 * APPLICATION_WORTH.petItem,
      count: 1,
    });
  });

  it("subtracts a capped amount for pet candy", () => {
    const pet = pets.withCandy;
    expect(pet.candyUsed).toBe(1);
    expect(petLevel(pet).level).toBe(100);

    const result = value(pet);
    // Base is the level 100 anchor. The reduction is 35 percent of it, capped
    // at five million for a level 100 pet, so the cap is what binds here.
    const candy = result.calculation.find((c) => c.type === "PET_CANDY");
    expect(candy?.price).toBe(-5_000_000);
    expect(result.price).toBe(102_000_000 + 12_000_000 - 5_000_000);
  });

  it("leaves candy alone on a pet where it does not reduce value", () => {
    // Ender Dragons and the three dragon pets are exempt.
    const exempt: PetData = { ...pets.withCandy, type: "ENDER_DRAGON", candyUsed: 10 };
    expect(value(exempt).calculation.find((c) => c.type === "PET_CANDY")).toBeUndefined();
  });

  it("names the pet with its level and rarity", () => {
    expect(value(pets.lowExp).name).toBe("[Lvl 1] Epic Guardian");
  });

  it("marks a skinned pet in its name", () => {
    expect(value(pets.highExp).name).toContain("(skinned)");
  });

  it("resolves the priced id it actually used", () => {
    expect(value(pets.highExp).customId).toBe("LVL_100_MYTHIC_ENDERMAN_SKINNED_ENDERMAN_SLAYER");
    expect(value(pets.lowExp).customId).toBe("LVL_100_EPIC_GUARDIAN");
  });
});

describe("soulbound pets", () => {
  it("knows the three that cannot be traded", () => {
    expect(isPetSoulbound({ type: "GRANDMA_WOLF", tier: "LEGENDARY", exp: 0 })).toBe(true);
    expect(isPetSoulbound({ type: "KUUDRA", tier: "LEGENDARY", exp: 0 })).toBe(true);
    expect(isPetSoulbound({ type: "BINGO", tier: "COMMON", exp: 0 })).toBe(true);
    expect(isPetSoulbound(pets.lowExp)).toBe(false);
  });

  it("refuses a pet object that is missing the fields a pet has", () => {
    expect(valuePet({ type: "GUARDIAN" } as unknown as PetData, { prices: TEST_PRICES })).toBeNull();
  });
});
