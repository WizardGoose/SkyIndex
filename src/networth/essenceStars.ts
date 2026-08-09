import { APPLICATION_WORTH } from "./constants";
import type { CalculationEntry, PriceMap, UpgradeCost } from "./types";

/**
 * What dungeon stars and Kuudra prestiges cost, priced off the catalogue's own
 * upgrade tables. Ported from SkyHelper-Networth 2.8.0 (MIT, see NOTICE.md).
 *
 * Essence is discounted (`APPLICATION_WORTH.essence`, 0.75) because it is
 * bought at bazaar price and sunk; an item cost, like a Kuudra Teeth, is not
 * discounted at all.
 */

/** One star's cost, or undefined when nothing in the prices file covers it. */
export const starCost = (prices: PriceMap, upgrade: UpgradeCost, star?: number): CalculationEntry | undefined => {
  const upgradePrice = upgrade.essence_type
    ? prices[`ESSENCE_${upgrade.essence_type}`]
    : upgrade.item_id
      ? prices[upgrade.item_id]
      : undefined;
  if (!upgradePrice) return undefined;

  const entry: CalculationEntry = {
    id: upgrade.essence_type ? `${upgrade.essence_type}_ESSENCE` : (upgrade.item_id ?? ""),
    type: star ? "STAR" : "PRESTIGE",
    price: (upgrade.amount ?? 0) * upgradePrice * (upgrade.essence_type ? APPLICATION_WORTH.essence : 1),
    count: upgrade.amount ?? 0,
  };
  if (star) entry.star = star;
  return entry;
};

/**
 * Total the star or prestige ladder, pushing one calculation line per step.
 *
 * `prestigeItem` changes the shape of the answer rather than the arithmetic.
 * Without it every star is its own line, which is what a starred dungeon item
 * wants. With it the whole ladder collapses into a single line named after the
 * prestige tier, because a prestiged Kuudra piece is bought as one thing and
 * listing sixteen essence rows under it would be noise.
 *
 * `upgrades` is an array whose entries are either one cost or an array of costs
 * for that star. Both shapes come straight off Hypixel's catalogue.
 */
export const starCosts = (
  prices: PriceMap,
  calculation: CalculationEntry[],
  upgrades: (UpgradeCost | UpgradeCost[])[],
  prestigeItem?: string
): number => {
  let price = 0;
  let star = 0;
  const entries: (CalculationEntry | undefined)[] = [];

  for (const upgrade of upgrades) {
    star++;
    if (Array.isArray(upgrade)) {
      for (const cost of upgrade) {
        const data = starCost(prices, cost, star);
        entries.push(data);
        if (!prestigeItem && data) {
          price += data.price;
          calculation.push(data);
        }
      }
    } else {
      const data = starCost(prices, upgrade);
      entries.push(data);
      if (!prestigeItem && data) {
        price += data.price;
        calculation.push(data);
      }
    }
  }

  if (prestigeItem && entries.length && entries[0]) {
    const prestige = entries[0].type === "PRESTIGE";
    const rolled: CalculationEntry = {
      id: prestigeItem,
      type: prestige ? "PRESTIGE" : "STARS",
      price: entries.reduce((acc, val) => acc + (val?.price ?? 0), 0),
      count: prestige ? 1 : star,
    };
    price += rolled.price;
    calculation.push(rolled);
  }

  return price;
};
