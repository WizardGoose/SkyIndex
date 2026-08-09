import { HANDLERS } from "./handlers";
import { SkyBlockItem } from "./itemHelper";
import type { Catalogue, PriceMap, RawItem, ValuedItem } from "./types";

/**
 * Value one SkyBlock item. Ported from SkyHelper-Networth 2.8.0's
 * `SkyBlockItemNetworthCalculator` (MIT, see NOTICE.md).
 *
 * Null means "this item contributes nothing to the total you asked for", which
 * today only happens for a cosmetic item under a cosmetic-free total. It is not
 * an error channel: an item nobody has priced comes back with a price of zero
 * and its own name, because "we do not know what this is worth" and "this is
 * worth nothing" are different statements and the second one is a claim.
 */
export interface ItemValueOptions {
  prices: PriceMap;
  catalogue: Catalogue;
  nonCosmetic?: boolean;
}

export const valueItem = (itemData: RawItem, options: ItemValueOptions): ValuedItem | null => {
  const { prices, catalogue, nonCosmetic = false } = options;

  let item: SkyBlockItem;
  try {
    item = new SkyBlockItem(itemData, catalogue);
  } catch {
    // A document with no display name is not an item. Skipped rather than
    // thrown, because one malformed slot must not cost the player the rest of
    // the container, which is the same rule the chest reader runs on.
    return null;
  }

  item.nonCosmetic = nonCosmetic;

  // Checked twice, before and after the handlers, and both are upstream's.
  // The first test runs against the id Hypixel sent; the second runs against
  // the normalised id, which for a skinned item is a different string and can
  // flip the answer.
  if (nonCosmetic && item.isCosmetic()) return null;

  item.applyBasePrice(prices);
  item.price = 0;
  item.soulboundPortion = 0;
  item.calculation = [];

  for (const handler of HANDLERS) {
    if (!handler.applies(item)) continue;
    if (handler.cosmetic && nonCosmetic) continue;
    handler.calculate(item, prices, catalogue);
  }

  if (nonCosmetic && item.isCosmetic()) return null;

  return {
    name: item.itemName,
    id: typeof item.extraAttributes.id === "string" ? item.extraAttributes.id : item.baseItemId,
    customId: item.itemId,
    price: item.price + item.basePrice,
    basePrice: item.basePrice,
    soulboundPortion: item.soulboundPortion,
    calculation: item.calculation,
    count: typeof itemData.Count === "number" ? itemData.Count : 1,
    soulbound: item.isSoulbound(),
    cosmetic: item.isCosmetic(),
  };
};
