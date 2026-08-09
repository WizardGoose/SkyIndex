import {
  APPLICATION_WORTH,
  BLOCKED_CANDY_REDUCE_PETS,
  CUSTOM_PET_NAMES,
  LEVELS,
  RARITY_OFFSET,
  SOULBOUND_PETS,
  SPECIAL_LEVELS,
  TIERS,
  XP_TO_LEVEL_100,
} from "./constants";
import { finiteNumber, titleCase } from "./helpers";
import type { CalculationEntry, PetData, PriceMap, ValuedItem } from "./types";

/**
 * Pet valuation, ported from SkyHelper-Networth 2.8.0's `PetNetworthHelper` and
 * `PetNetworthCalculator` (MIT, see NOTICE.md).
 *
 * A pet is not priced by an id lookup. The prices file carries three anchor
 * prices per pet and rarity (`LVL_1_`, `LVL_100_`, `LVL_200_`) and everything
 * between them is interpolated: linearly in EXPERIENCE from level 1 to 100,
 * then linearly in LEVEL from 100 to 200. Those two are not the same kind of
 * interpolation and the difference is upstream's, not a simplification here:
 * the 100 to 200 band exists only for the three dragon pets, where the level
 * number is what the market quotes.
 */

export interface PetLevel {
  level: number;
  /** Total experience the whole ladder holds, used as the pet-candy ceiling test. */
  xpMax: number;
  /** Total experience from level 1 to 100 for this rarity. The interpolation denominator. */
  xpMaxTo100: number;
  xp: number;
}

const tierIndex = (pet: PetData): number => TIERS.indexOf(pet.tier);

/** A Tier Boost held item shows the pet one rarity above what it really is. */
const boostedTierIndex = (pet: PetData): number =>
  pet.heldItem === "PET_ITEM_TIER_BOOST" ? tierIndex(pet) + 1 : tierIndex(pet);

const boostedTierName = (pet: PetData): string => TIERS[boostedTierIndex(pet)];

export const isPetSoulbound = (pet: PetData): boolean => SOULBOUND_PETS.includes(pet.type);

/**
 * Level from experience.
 *
 * Ported literally, including the fact that the loop runs one step past the end
 * of the sliced ladder. That last read is undefined, the running total becomes
 * NaN, the `>` test is false and the level increments once more, which is
 * exactly why upstream clamps with `Math.min` afterwards. Tidying the loop
 * would move every maxed pet's level by one, so it is left alone and explained
 * instead.
 */
export const petLevel = (pet: PetData): PetLevel => {
  const maxLevel = SPECIAL_LEVELS[pet.type] ?? 100;
  const offset = RARITY_OFFSET[pet.type === "BINGO" ? "COMMON" : boostedTierName(pet)];
  const ladder = LEVELS.slice(offset, offset + maxLevel - 1);
  const exp = finiteNumber(pet.exp);

  let level = 1;
  let total = 0;
  for (let i = 0; i < maxLevel; i++) {
    total += ladder[i];
    if (total > exp) break;
    level++;
  }

  return {
    level: Math.min(level, maxLevel),
    xpMax: ladder.reduce((a, b) => a + b, 0),
    xpMaxTo100: XP_TO_LEVEL_100[boostedTierName(pet)],
    xp: exp,
  };
};

interface AnchorPrices {
  LVL_1: number;
  LVL_100: number;
  LVL_200: number;
}

const basePetId = (pet: PetData): string => `${pet.tier}_${pet.type}`;

const skinnedPetId = (pet: PetData): string =>
  `${basePetId(pet)}${pet.skin ? `_SKINNED_${pet.skin}` : ""}`;

/**
 * The three anchor prices.
 *
 * A skin only ever raises an anchor, never lowers it: `Math.max` against the
 * unskinned price is what stops an unwanted skin from making a pet look cheaper
 * than the same pet without one.
 */
const anchorPrices = (pet: PetData, prices: PriceMap, nonCosmetic: boolean): AnchorPrices => {
  const base: AnchorPrices = {
    LVL_1: prices[`LVL_1_${basePetId(pet)}`] ?? 0,
    LVL_100: prices[`LVL_100_${basePetId(pet)}`] ?? 0,
    LVL_200: prices[`LVL_200_${basePetId(pet)}`] ?? 0,
  };

  if (pet.skin && !nonCosmetic) {
    const id = skinnedPetId(pet);
    return {
      LVL_1: Math.max(prices[`LVL_1_${id}`] ?? 0, base.LVL_1),
      LVL_100: Math.max(prices[`LVL_100_${id}`] ?? 0, base.LVL_100),
      LVL_200: Math.max(prices[`LVL_200_${id}`] ?? 0, base.LVL_200),
    };
  }

  return base;
};

const petDisplayName = (pet: PetData, level: number): string => {
  const kind = CUSTOM_PET_NAMES[pet.type] ?? titleCase(pet.type);
  const name = titleCase(`${boostedTierName(pet)} ${kind}`);
  // Upstream marks a skin with a dingbat. A word says the same thing and
  // survives every font this site is read in.
  return `[Lvl ${level}] ${name}${pet.skin ? " (skinned)" : ""}`;
};

export interface PetValueOptions {
  prices: PriceMap;
  nonCosmetic?: boolean;
}

export const valuePet = (pet: PetData, options: PetValueOptions): ValuedItem | null => {
  const { prices, nonCosmetic = false } = options;
  if (typeof pet?.type !== "string" || typeof pet?.tier !== "string" || pet?.exp === undefined) return null;

  const level = petLevel(pet);
  const { LVL_1, LVL_100, LVL_200 } = anchorPrices(pet, prices, nonCosmetic);

  let basePrice = level.level <= 101 ? LVL_100 : LVL_200 || LVL_100;

  if (level.level < 100 && level.xpMax) {
    const slope = (LVL_100 - LVL_1) / level.xpMaxTo100;
    // A zero or NaN slope means the pet has no priced ladder, in which case the
    // anchor above is a better answer than a straight line through nothing.
    if (slope) basePrice = slope * level.xp + LVL_1;
  }

  if (level.level > 100 && level.level < 200) {
    // The level within the second band is the level's own digits after the
    // leading 1: level 150 is 50 percent of the way from 100 to 200.
    const within = Number(String(level.level).slice(1));
    const slope = (LVL_200 - LVL_100) / 100;
    if (slope) basePrice = slope * within + LVL_100;
  }

  const calculation: CalculationEntry[] = [];
  let price = 0;

  // Held item. A Tier Boost is priced here as well as changing the tier above,
  // which is correct: the boost item itself is a tradeable thing.
  if (pet.heldItem) {
    const entry: CalculationEntry = {
      id: pet.heldItem,
      type: "PET_ITEM",
      price: (prices[pet.heldItem] ?? 0) * APPLICATION_WORTH.petItem,
      count: 1,
    };
    calculation.push(entry);
    price += entry.price;
  }

  // A skin on a soulbound pet was never priced into the anchors, because a
  // soulbound pet has no skinned market entry to find.
  if (pet.skin && isPetSoulbound(pet) && !nonCosmetic && prices[`PET_SKIN_${pet.skin}`]) {
    const entry: CalculationEntry = {
      id: pet.skin,
      type: "SOULBOUND_PET_SKIN",
      price: prices[`PET_SKIN_${pet.skin}`] * APPLICATION_WORTH.soulboundPetSkins,
      count: 1,
    };
    calculation.push(entry);
    price += entry.price;
  }

  // Pet candy, last, because it is a percentage of the base price and the
  // handlers above must not be inside that percentage.
  const candyUsed = finiteNumber(pet.candyUsed);
  const xpLessCandy = finiteNumber(pet.exp) - candyUsed * 1_000_000;
  if (candyUsed > 0 && !BLOCKED_CANDY_REDUCE_PETS.includes(pet.type) && xpLessCandy < level.xpMax) {
    // Capped, because past a point the discount stops scaling with the pet.
    const cap = level.level === 100 ? 5_000_000 : 2_500_000;
    const reduction = Math.min(basePrice * (1 - APPLICATION_WORTH.petCandy), cap);
    const entry: CalculationEntry = { id: "CANDY", type: "PET_CANDY", price: -reduction, count: candyUsed };
    calculation.push(entry);
    price += entry.price;
  }

  const customId = LVL_200
    ? `LVL_200_${skinnedPetId(pet)}`
    : LVL_100
      ? `LVL_100_${skinnedPetId(pet)}`
      : `LVL_1_${skinnedPetId(pet)}`;

  return {
    name: petDisplayName(pet, level.level),
    id: pet.type,
    customId,
    price: price + basePrice,
    basePrice,
    soulboundPortion: 0,
    calculation,
    count: 1,
    soulbound: isPetSoulbound(pet),
    cosmetic: !!pet.skin,
    isPet: true,
    petData: pet,
  };
};
