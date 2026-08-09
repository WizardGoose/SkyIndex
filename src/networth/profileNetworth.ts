import { valueBasicItem } from "./basicValue";
import { valueItem } from "./itemValue";
import { valuePet } from "./petValue";
import { isRecord } from "./helpers";
import type {
  BasicItem,
  CategoryResult,
  CoinBalances,
  NetworthOptions,
  NetworthResult,
  PetData,
  RawItem,
  ValuedItem,
} from "./types";

/**
 * The aggregator. Ported from SkyHelper-Networth 2.8.0's
 * `ProfileNetworthCalculator` (MIT, see NOTICE.md).
 *
 * Everything above this file values ONE thing. This file is the only place that
 * knows a profile has categories, that coins are added once rather than per
 * category, and how the soulbound split is drawn.
 *
 * It takes already-parsed items rather than a profile payload, which is the
 * same seam upstream exposes as `fromPreParsed`. That seam is what makes the
 * parity script possible at all: the real library and this port can be handed
 * the identical item objects, so any delta is a valuation delta and not a
 * decoding one.
 */

/** Which calculator a category's entries go through. Anything unlisted is a full item. */
export type CategoryKind = "item" | "pet" | "basic";

export const CATEGORY_KINDS: Record<string, CategoryKind> = {
  pets: "pet",
  sacks: "basic",
  essence: "basic",
};

export type ParsedItems = Record<string, unknown[]>;

/**
 * The soulbound split, stated once.
 *
 * A soulbound item contributes its whole value to `total` and nothing to
 * `unsoulboundTotal`. An item that is NOT soulbound but carries a soulbound
 * part (a museum-donated rod part on a tradeable rod) contributes everything
 * except that part. Those are two different situations and collapsing them
 * would either overstate what a player could realise or understate what they
 * own.
 */
const accumulate = (category: CategoryResult, result: ValuedItem): void => {
  const price = Number.isFinite(result.price) ? result.price : 0;
  const soulboundPortion = Number.isFinite(result.soulboundPortion) ? result.soulboundPortion : 0;
  category.total += price;
  if (!result.soulbound) category.unsoulboundTotal += price - soulboundPortion;
};

/**
 * Collapse identical stacks into one row.
 *
 * The equality test is id, per-unit price and soulbound state, all three. Two
 * Hyperions with different enchantments are not the same row even though they
 * share an id, and the per-unit price is what separates them without having to
 * compare two calculation trees.
 */
const stack = (items: ValuedItem[]): ValuedItem[] => {
  const out: ValuedItem[] = [];
  for (const item of items) {
    if (item.isPet) {
      out.push(item);
      continue;
    }
    const existing = out.find(
      (candidate) =>
        candidate.id === item.id &&
        candidate.price / candidate.count === item.price / item.count &&
        candidate.soulbound === item.soulbound
    );
    if (existing) {
      existing.price += item.price;
      existing.count += item.count;
      existing.soulboundPortion += item.soulboundPortion;
    } else {
      out.push({ ...item });
    }
  }
  return out;
};

/** A pet hiding inside an item's NBT, which is how a pet in a chest is stored. */
const petInfoOf = (entry: unknown): PetData | null => {
  if (!isRecord(entry)) return null;
  const raw = (entry as RawItem).tag?.ExtraAttributes?.petInfo;
  if (typeof raw !== "string") return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isRecord(parsed) ? (parsed as unknown as PetData) : null;
  } catch {
    return null;
  }
};

export const calculateNetworth = (
  items: ParsedItems,
  coins: CoinBalances,
  options: NetworthOptions
): NetworthResult => {
  const { prices, catalogue, nonCosmetic = false, stackItems = true, sortItems = true } = options;

  const types: Record<string, CategoryResult> = {};

  for (const [category, entries] of Object.entries(items)) {
    const result: CategoryResult = { total: 0, unsoulboundTotal: 0, items: [] };
    types[category] = result;
    if (!Array.isArray(entries)) continue;

    const kind = CATEGORY_KINDS[category] ?? "item";

    for (const entry of entries) {
      if (!isRecord(entry) || Object.keys(entry).length === 0) continue;

      let valued: ValuedItem | null;
      const pet = petInfoOf(entry);

      if (pet) {
        valued = valuePet(pet, { prices, nonCosmetic });
      } else if (kind === "pet") {
        valued = valuePet(entry as unknown as PetData, { prices, nonCosmetic });
      } else if (kind === "basic") {
        valued = valueBasicItem(entry as unknown as BasicItem, { prices, catalogue, nonCosmetic });
      } else {
        // An entry with neither NBT nor an exp field nor a string id is not
        // something this can value, and guessing would be worse than skipping.
        const raw = entry as RawItem;
        if (!raw.tag?.ExtraAttributes && raw.exp === undefined && typeof raw.id !== "string") continue;
        valued = valueItem(raw, { prices, catalogue, nonCosmetic });
      }

      if (!valued) continue;
      accumulate(result, valued);
      // Zero-priced rows are counted in the totals (where they add nothing) and
      // left out of the list, so a container of worthless blocks does not bury
      // the one thing in it that matters. A `keepZeroPriced` option briefly
      // lived here for the networth panel's item grids; the panel stopped
      // itemising (the division of labour: the tabs browse items, networth
      // states values), so the engine is back to upstream's exact behaviour.
      if (valued.price) result.items.push(valued);
    }

    if (sortItems && result.items.length > 0) result.items.sort((a, b) => b.price - a.price);
    if (stackItems) result.items = stack(result.items);
  }

  const rawCoins = coins.bank + coins.purse + coins.personalBank;
  const networth = Object.values(types).reduce((acc, c) => acc + c.total, 0) + rawCoins;
  const unsoulboundNetworth = Object.values(types).reduce((acc, c) => acc + c.unsoulboundTotal, 0) + rawCoins;

  return {
    networth,
    unsoulboundNetworth,
    // Not "the inventory is empty". Hypixel omits the field entirely when the
    // player's Inventory API toggle is off, and the two must not read alike.
    noInventory: !(Array.isArray(items.inventory) && items.inventory.length > 0),
    purse: coins.purse,
    bank: coins.bank,
    personalBank: coins.personalBank,
    types,
  };
};
