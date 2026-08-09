import { REFORGES } from "./constants";
import { valueItem } from "./itemValue";
import type { IslandChest, IslandItem } from "../island/types";
import type { Catalogue, ExtraAttributes, PriceMap, RawItem, ValuedItem } from "./types";

/**
 * Island chest contents, valued with the same function everything else uses.
 *
 * This is the category no other tool can show, because the Hypixel API has
 * never published chest contents and never will. It comes from the companion
 * mod, and the mod sends compact structured fields rather than raw NBT, so what
 * arrives is a subset of what a profile blob carries.
 *
 * ## Conservative on purpose, and what that costs
 *
 * Four modifiers survive the trip: reforge, dungeon stars, enchantments and the
 * recombobulator. Those are the big movers on ordinary gear. What is NOT
 * visible, and therefore is NOT counted:
 *
 *   gemstones, hot potato and fuming books, drill and rod parts, dyes, runes,
 *   art of war and peace, enrichments, scrolls, skins, pet items and candy,
 *   and every one-off attribute (Midas bids, Avarice coins, Pickonimbus wear).
 *
 * So a modified item in a chest is valued at or below its true worth, never
 * above it. That direction is the whole point: this number sits beside numbers
 * derived from full NBT, and one category quietly guessing high would make the
 * total dishonest in a way nobody could see. The UI says so in words rather
 * than leaving it in a comment.
 *
 * One consequence is worth stating because it looks like a bug and is not. The
 * recombobulator only counts where it did something transferable, which means
 * enchantments, an accessory, or one of the named armour sets. A chest snapshot
 * that carries `recomb` but no `ench` therefore does NOT charge for the stone.
 * That is the same rule the API path runs, applied to less information, and it
 * errs in the conservative direction like everything else here.
 *
 * The moment the mod ships richer `extra` fields this file gets more of them
 * and nothing else changes, because the valuation itself is shared.
 */

/**
 * The mod sends a reforge as its display name ("Blood-Soaked"), while the
 * valuation table is keyed by the id Hypixel stores ("blood_soaked").
 *
 * Both spellings are tried, and a reforge neither spelling resolves contributes
 * nothing rather than guessing at a stone. A dropped reforge understates by one
 * reforge stone; an invented one overstates by whatever we picked.
 */
export const reforgeKey = (reforge: string): string | null => {
  const raw = reforge.trim();
  if (!raw) return null;
  const direct = raw.toLowerCase();
  if (REFORGES[direct]) return direct;
  const normalised = direct.replace(/[\s-]+/g, "_");
  return REFORGES[normalised] ? normalised : null;
};

/**
 * One mod item as an item document.
 *
 * Built in the same shape a decoded profile blob has, so it goes through
 * `valueItem` untouched rather than through a second, parallel valuation that
 * could drift. `Lore` is empty because the mod does not send lore, which is
 * also why a chest item can never be detected as soulbound: the soulbound
 * marker is a lore line and there is no lore. Chest items therefore count as
 * transferable, which is true of anything a player was able to put in a chest.
 */
export const chestItemToRaw = (item: IslandItem): RawItem => {
  const extra: ExtraAttributes = { id: item.id };
  const detail = item.extra;

  if (detail) {
    if (detail.reforge) {
      const key = reforgeKey(detail.reforge);
      if (key) extra.modifier = key;
    }
    // The mod sends a boolean, and the field Hypixel stores is a count. One is
    // the only count a recombobulator is ever applied in.
    if (detail.recomb) extra.rarity_upgrades = 1;
    if (typeof detail.stars === "number" && detail.stars > 0) extra.upgrade_level = detail.stars;
    if (detail.ench && Object.keys(detail.ench).length > 0) extra.enchantments = { ...detail.ench };
    // `extra.skin` is deliberately not mapped. It is a player-head texture hash
    // for drawing the item, not a SkyBlock skin id, and feeding it to the skin
    // handler would price a render as a cosmetic.
  }

  return {
    Count: item.count,
    tag: { display: { Name: item.name || item.id, Lore: [] }, ExtraAttributes: extra },
  };
};

export interface ChestValue {
  /** `x,y,z`, the chest's identity. Matches the key the Island page already uses. */
  key: string;
  name: string;
  pos: [number, number, number];
  lastSeen: number;
  total: number;
  items: ValuedItem[];
}

export interface IslandChestValues {
  /** Every chest item, flattened, for the category aggregator. */
  items: RawItem[];
  /** Per chest, for the drilldown. Sorted by value, richest first. */
  chests: ChestValue[];
}

/**
 * Value the chests, both as one category and chest by chest.
 *
 * The per-chest pass values the same documents a second time rather than
 * reusing the category's rows, because the category stacks identical stacks
 * across chests and a stacked row cannot say which chest it came from. Two
 * passes over a few hundred items is nothing; a drilldown that attributes items
 * to the wrong chest is worse than none.
 */
export const valueIslandChests = (
  chests: readonly IslandChest[],
  prices: PriceMap,
  catalogue: Catalogue,
  nonCosmetic = false
): IslandChestValues => {
  const items: RawItem[] = [];
  const out: ChestValue[] = [];

  for (const chest of chests) {
    const rows: ValuedItem[] = [];
    let total = 0;

    for (const item of chest.items) {
      const raw = chestItemToRaw(item);
      items.push(raw);
      const valued = valueItem(raw, { prices, catalogue, nonCosmetic });
      if (!valued || !valued.price) continue;
      total += valued.price;
      rows.push(valued);
    }

    rows.sort((a, b) => b.price - a.price);
    out.push({
      key: chest.pos.join(","),
      name: chest.name,
      pos: chest.pos,
      lastSeen: chest.lastSeen,
      total,
      items: rows,
    });
  }

  out.sort((a, b) => b.total - a.total);
  return { items, chests: out };
};
