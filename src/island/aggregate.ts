import type { IslandItem, IslandSnapshot } from "./types";

/**
 * Turning island data into answers for the rest of the site.
 *
 * The two sides of this file speak different languages and that is the whole
 * problem it solves. The site indexes items by its own internal key (the key of
 * the crafting index, wiki-derived). The mod speaks Hypixel ids. `sackLookup`
 * is the translation layer, built once per snapshot so a page rendering two
 * thousand rows does two thousand map reads rather than two thousand scans.
 */

/**
 * A sack-count reader, keyed by the site's internal item key.
 *
 * `has` is the important half. Most visitors will never run the companion mod,
 * and a "In sacks" column full of blanks is worse than no column, so callers
 * check `has` and drop the column entirely rather than rendering an empty one.
 */
export interface SackLookup {
  get(itemKey: string): number | undefined;
  has: boolean;
}

const EMPTY: SackLookup = { get: () => undefined, has: false };

/**
 * Map the site's item keys onto sack totals from a snapshot.
 *
 * Matching is on `hypixelId`, exact first. The case-insensitive second pass
 * exists because of one line in the spec: when an item has no
 * `ExtraAttributes.id` the mod falls back to the vanilla registry id
 * upper-cased, so `minecraft:oak_log` arrives as `OAK_LOG`. Our index mostly
 * agrees, but not everywhere, and a case mismatch on a vanilla log is not a
 * reason to tell the player they own none.
 *
 * Exact wins whenever both exist, so a genuine `Foo` / `FOO` pair (unlikely,
 * but the ids are not ours to guarantee) is never silently conflated.
 *
 * An item with a null `hypixelId` is one the site knows by name only. It has
 * nothing to match against and must never fall through to a fuzzy guess, so it
 * simply never matches.
 */
export function sackLookup(
  snapshot: IslandSnapshot | null | undefined,
  items: Record<string, { hypixelId: string | null }>
): SackLookup {
  const sacks = snapshot?.sacks;
  if (!sacks) return EMPTY;

  const entries = Object.entries(sacks);
  if (entries.length === 0) return EMPTY;

  // Lower-cased shadow index for the fallback pass. First writer wins, so a
  // pathological pair of sack keys differing only in case resolves
  // deterministically instead of by object-key iteration luck.
  const lower = new Map<string, number>();
  for (const [id, count] of entries) {
    const key = id.toLowerCase();
    if (!lower.has(key)) lower.set(key, count);
  }

  const byItemKey = new Map<string, number>();
  for (const [itemKey, item] of Object.entries(items)) {
    const hypixelId = item?.hypixelId;
    if (!hypixelId) continue;

    const exact = sacks[hypixelId];
    if (typeof exact === "number") {
      byItemKey.set(itemKey, exact);
      continue;
    }

    const loose = lower.get(hypixelId.toLowerCase());
    if (typeof loose === "number") byItemKey.set(itemKey, loose);
  }

  return {
    get: (itemKey: string) => byItemKey.get(itemKey),
    has: true,
  };
}

/**
 * Roll a flat item list up by id.
 *
 * The spec is explicit that counts are per entry as seen and that the website
 * aggregates: a chest holding four separate stacks of 64 cobblestone sends four
 * rows, and the player wants to read "256". The display name is taken from the
 * first entry that carries one, since every entry for an id should agree and
 * the first is as good as any.
 */
/** A container cell: a stack, or an empty slot that is genuinely empty. */
export type ContainerCell = IslandItem | null;

/**
 * Lay a container out the way it really is.
 *
 * When the mod ships `slot`, a chest can be drawn as the thing the player
 * actually opened: a Large Chest as its true 9x6, with the gaps where the gaps
 * are. The gaps are the point. A packed grid of only the occupied cells is a
 * different shape from the chest in game, and the whole reason to draw a grid
 * at all is that people remember storage spatially.
 *
 * Returns null when no entry carries a slot, which is the honest answer for
 * every snapshot produced before the field existed and for any producer that
 * chooses not to send it. Callers fall back to the packed grid, so old data
 * keeps rendering exactly as it did.
 *
 * Robustness matters more than cleverness here, because this is fed by a young
 * mod: a slot outside the container, a duplicate slot, and a mix of slotted and
 * unslotted entries all have to produce a grid rather than an exception.
 */
export function slotLayout(list: IslandItem[], capacity: number): ContainerCell[] | null {
  const slotted = list.filter((i) => typeof i.slot === "number" && Number.isInteger(i.slot) && i.slot >= 0);
  if (slotted.length === 0) return null;

  // Grow to fit anything that lands past the nominal capacity rather than
  // dropping it, rounded to whole rows so the grid stays rectangular. A stack
  // we cannot place is a stack the player cannot find.
  const highest = slotted.reduce((max, i) => Math.max(max, i.slot as number), 0);
  const rows = Math.max(Math.ceil(capacity / 9), Math.ceil((highest + 1) / 9));
  const cells: ContainerCell[] = new Array<ContainerCell>(rows * 9).fill(null);

  const overflow: IslandItem[] = [];
  for (const item of slotted) {
    const at = item.slot as number;
    // First writer wins on a duplicate slot; the loser is placed in the first
    // free cell instead of being silently discarded.
    if (cells[at] === null) cells[at] = item;
    else overflow.push(item);
  }

  // Entries with no slot at all, in a container where others had one.
  for (const item of list) {
    if (typeof item.slot === "number" && Number.isInteger(item.slot) && item.slot >= 0) continue;
    overflow.push(item);
  }

  for (const item of overflow) {
    const free = cells.indexOf(null);
    if (free === -1) cells.push(item);
    else cells[free] = item;
  }

  return cells;
}

export function totalItems(list: IslandItem[]): Map<string, { name: string; count: number }> {
  const out = new Map<string, { name: string; count: number }>();
  for (const item of list) {
    const prev = out.get(item.id);
    if (prev) {
      prev.count += item.count;
      if (!prev.name) prev.name = item.name;
    } else {
      out.set(item.id, { name: item.name, count: item.count });
    }
  }
  return out;
}
