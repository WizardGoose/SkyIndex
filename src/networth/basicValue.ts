import { titleCase } from "./helpers";
import type { BasicItem, Catalogue, PriceMap, ValuedItem } from "./types";

/**
 * Items that are nothing but an id and a count: sacks, essence, and the island
 * chest rollup when a stack carries no modifiers. Ported from
 * SkyHelper-Networth 2.8.0's `BasicItemNetworthCalculator` (MIT, see NOTICE.md).
 *
 * Price times amount, and that is the whole rule. Null when the amount is not
 * positive or nothing in the prices file covers the id, because a row worth
 * nothing is noise in a list whose whole job is showing you where value is.
 */
export interface BasicValueOptions {
  prices: PriceMap;
  catalogue: Catalogue;
  nonCosmetic?: boolean;
}

/** `ESSENCE_WITHER` reads as "Wither Essence", not "Essence Wither". */
const basicName = (id: string, catalogue: Catalogue): string => {
  if (id.includes("ESSENCE")) return titleCase(id).split(" ").reverse().join(" ");
  return catalogue[id]?.name || titleCase(id);
};

export const valueBasicItem = (item: BasicItem, options: BasicValueOptions): ValuedItem | null => {
  const { prices, catalogue, nonCosmetic = false } = options;
  const { id, amount } = item;

  if (typeof id !== "string" || !id) return null;
  if (!amount || amount <= 0) return null;
  // A rune in a sack is still a cosmetic.
  if (id.startsWith("RUNE_") && nonCosmetic) return null;

  const unit = prices[id];
  if (!unit) return null;

  const total = unit * amount;
  if (!total || total <= 0) return null;

  return {
    name: basicName(id, catalogue),
    id,
    customId: id,
    price: total,
    basePrice: total,
    soulboundPortion: 0,
    calculation: [],
    count: amount,
    soulbound: false,
    cosmetic: false,
  };
};
