/**
 * NPC sell value: what the NPCs would pay for the raw stacks you hold.
 *
 * The defining example: enchanted mithril, a bunch stored in chests at
 * base and the same amount in sacks; find both, then give the total value
 * for all of the mithril in NPC sell prices. So this is a cross-source
 * aggregation - one row per item id,
 * counted across sacks, chests, inventory, ender chest and backpacks - valued
 * at the NPC unit price Hypixel publishes in its item resource.
 *
 * WHAT THIS NUMBER IS, AND IS NOT
 * -------------------------------
 * It is a floor: the coins you could realise by walking to any merchant, on
 * any game mode - NPC selling is the one market an Ironman still has. It is
 * NOT part of the networth total above it, which prices the same items at
 * market rates through the SkyHelper rules; adding the two would count every
 * stack twice. The panel says so in words.
 *
 * An item with no NPC price (enchanted books, most accessories) is excluded
 * from the total and COUNTED as excluded, because a sum that silently skips
 * half the warehouse reads as a claim about the whole of it.
 *
 * Pure functions only. The page supplies the counts and the price lookup; this
 * module owes it arithmetic and nothing else, so every rule here is testable
 * without a browser.
 */

export interface NpcCountedItem {
  id: string;
  name: string;
  count: number;
}

/** One source of stacks, already cleaned by the caller (chrome filtered etc). */
export interface NpcSellSource {
  /** Short label the breakdown shows, e.g. "sacks", "chests". */
  label: string;
  items: readonly NpcCountedItem[];
}

export interface NpcSellRow {
  id: string;
  name: string;
  /** Total held across every source. */
  count: number;
  /** NPC unit price. */
  unit: number;
  /** count x unit. */
  total: number;
  /** Where the count came from, in source order, zero-count sources dropped. */
  sources: { label: string; count: number }[];
}

export interface NpcSellSummary {
  /** Sum over every priced row. */
  total: number;
  /** Priced rows, biggest total first. */
  rows: NpcSellRow[];
  /** Distinct item ids that were held but have no NPC price. */
  unpricedIds: number;
  /** Total stacks behind those unpriced ids, so the exclusion has a size. */
  unpricedCount: number;
}

/**
 * Aggregate and value the lot.
 *
 * `priceOf` returns the NPC unit price for a Hypixel id, or null when no NPC
 * buys it. `nameOf` may return a better display name than the stacks carried;
 * the first non-empty stack name wins otherwise, and the id itself is the
 * honest last resort.
 */
export const npcSellSummary = (
  sources: readonly NpcSellSource[],
  priceOf: (id: string) => number | null,
  nameOf?: (id: string) => string | null
): NpcSellSummary => {
  interface Acc {
    name: string;
    count: number;
    perSource: Map<string, number>;
  }
  const byId = new Map<string, Acc>();

  for (const source of sources) {
    for (const item of source.items) {
      if (!item.id || !(item.count > 0)) continue;
      let acc = byId.get(item.id);
      if (!acc) {
        acc = { name: "", count: 0, perSource: new Map() };
        byId.set(item.id, acc);
      }
      if (!acc.name && item.name) acc.name = item.name;
      acc.count += item.count;
      acc.perSource.set(source.label, (acc.perSource.get(source.label) ?? 0) + item.count);
    }
  }

  const rows: NpcSellRow[] = [];
  let total = 0;
  let unpricedIds = 0;
  let unpricedCount = 0;

  for (const [id, acc] of byId) {
    const unit = priceOf(id);
    if (unit === null || !(unit > 0)) {
      unpricedIds++;
      unpricedCount += acc.count;
      continue;
    }
    const name = nameOf?.(id) || acc.name || id;
    const rowTotal = unit * acc.count;
    total += rowTotal;
    rows.push({
      id,
      name,
      count: acc.count,
      unit,
      total: rowTotal,
      // Source order is the order the caller listed the sources in, which is
      // the order the island page presents them; a map preserves insertion.
      sources: [...acc.perSource].map(([label, count]) => ({ label, count })),
    });
  }

  rows.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  return { total, rows, unpricedIds, unpricedCount };
};
