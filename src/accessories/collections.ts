import type { CollectionUnlock, ItemIndex } from "../items/useItemData";
import { norm } from "../items/wikiCrafting";

/**
 * Collection gating: which craftable accessories the player cannot make yet.
 *
 * WHY THIS MATTERS MOST ON IRONMAN
 * --------------------------------
 * On a normal profile a recipe you have not unlocked is an inconvenience,
 * because the finished accessory is on the auction house. On Ironman there is
 * no auction house, so an unmet collection tier is the entire difference
 * between "go and craft this" and "go and farm four thousand cobblestone
 * first". Sorting those two into the same Missing pile would make the list
 * actively misleading for the player it was built for.
 *
 * WHICH FIELD GATES, AND WHICH ONLY LOOKS LIKE IT DOES
 * ----------------------------------------------------
 * A live profile dump settled this. There are two collection fields and they do
 * different jobs:
 *
 *   member.collection                      a flat map of item id to lifetime
 *                                          count (930+ entries, e.g.
 *                                          COBBLESTONE: 2373996). It is a raw
 *                                          counter and it gates nothing.
 *
 *   member.player_data.unlocked_coll_tiers a flat array of tier id strings the
 *                                          player has already crossed (621
 *                                          entries, e.g. GRAVEL_1, GRAVEL_2).
 *                                          THIS is what the game gates on.
 *
 * Gating on the count would mean re-deriving a threshold the game has already
 * evaluated, and getting it wrong in either direction: collection requirements
 * have been rebalanced, and a player who crossed a tier before a change keeps
 * the unlock even if their count no longer meets the new number. So the pass or
 * fail decision is a membership test on `unlocked_coll_tiers` and nothing else.
 * The count is still read, but only to show progress next to the requirement,
 * never to decide.
 *
 * A tier id is `<COLLECTION_ITEM_ID>_<TIER>`, e.g. `GRAVEL_3`.
 *
 * THE MAPPING STEP, AND WHY IT IS ALLOWED TO FAIL
 * -----------------------------------------------
 * Our unlock data comes from the wiki and names a collection by its DISPLAY
 * name ("Acacia Log"). A tier id needs Hypixel's item id ("LOG_2"). The shared
 * item index carries `hypixelId` for names it knows, so the mapping goes
 * through there, and then the resolved key is VALIDATED against the player's
 * own data before it is trusted.
 *
 * When the mapping fails or the validation does not hold, the accessory stays
 * in Missing and is counted as unresolved. It is never filed under "Needs
 * collection first" on a key we could not confirm, because that zone is an
 * instruction to go and grind something: sending somebody to farm the wrong
 * collection is worse than not sorting the item at all.
 */

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Everything gating needs from a profile member, already narrowed. */
export interface CollectionProgress {
  /** Tier ids already crossed, e.g. "GRAVEL_3". */
  unlockedTiers: Set<string>;
  /** Item id to lifetime count. Shown as progress, never used to decide. */
  counts: Record<string, number>;
  /**
   * False when the member carried neither field, which means we cannot gate at
   * all. Distinct from "read it and the player has unlocked nothing".
   */
  known: boolean;
}

export const NO_COLLECTIONS: CollectionProgress = {
  unlockedTiers: new Set(),
  counts: {},
  known: false,
};

/**
 * Pull both collection fields off a member.
 *
 * `player_data.unlocked_coll_tiers` is checked first and a flat
 * `unlocked_coll_tiers` second, on the same principle as the bag reader: a
 * field that has moved once may not have moved for every account.
 */
export function readCollections(member: unknown): CollectionProgress {
  if (!isObject(member)) return NO_COLLECTIONS;

  const playerData = isObject(member.player_data) ? member.player_data : null;
  const rawTiers = playerData?.unlocked_coll_tiers ?? member.unlocked_coll_tiers;

  const unlockedTiers = new Set<string>();
  if (Array.isArray(rawTiers)) {
    for (const t of rawTiers) if (typeof t === "string" && t) unlockedTiers.add(t);
  }

  const counts: Record<string, number> = {};
  if (isObject(member.collection)) {
    for (const [id, raw] of Object.entries(member.collection)) {
      // Same refusal as `readCounts` in hypixel.ts: not `Number(raw)`, because
      // Number(null) is 0 and would turn a broken field into a confident zero.
      if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 0) continue;
      counts[id] = raw;
    }
  }

  const known = Array.isArray(rawTiers) || isObject(member.collection);
  return { unlockedTiers, counts, known };
}

/**
 * Build the display-name to collection-id lookup, once.
 *
 * Keyed by `norm` so punctuation and case cannot break an otherwise perfect
 * match, the same normalisation the catalogue join uses.
 */
export function buildCollectionKeys(items: ItemIndex): Map<string, string> {
  const keys = new Map<string, string>();
  for (const item of Object.values(items)) {
    if (!item.hypixelId) continue;
    const n = norm(item.name);
    if (n && !keys.has(n)) keys.set(n, item.hypixelId);
  }
  return keys;
}

/** Why an accessory is parked in the "needs collection" zone. */
export interface CollectionBlock {
  /** Display name, as the player would search for it. */
  collection: string;
  tier: number;
  required: number;
  have: number;
}

export interface GateResult {
  /** The unmet tier, or null when nothing blocks this accessory. */
  block: CollectionBlock | null;
  /**
   * True when a collection name could not be resolved or validated, so this
   * accessory's gating is unknown and it must stay in Missing.
   */
  unresolved: boolean;
}

export const NOT_BLOCKED: GateResult = { block: null, unresolved: false };

/**
 * Is this tier crossed, according to the player's own record?
 *
 * NOT a plain membership test, and the difference was found on a real
 * live profile rather than theorised: Hypixel's `unlocked_coll_tiers` has
 * HOLES. One lily pad entry reads WATER_LILY 1, 4, 5, 6, 7, 8, 9 - tiers 2
 * and 3 simply absent while 9 is present - and quartz has 8 without 7. The
 * game does not backfill lower tier ids, so exact membership called tier 3
 * locked on a man holding 196,413 lily pads, and the accessories page filed
 * a long-finished unlock under "Soon", which is the bug this fixes.
 *
 * Collections are monotonic: tier N cannot exist without every tier below it
 * having been crossed. So ANY recorded tier at or above the requirement
 * proves it met. This is still purely the game's own record - no count
 * thresholds are re-derived - which is the rule this file was built on.
 * The stray "<KEY>_-1" sentinel entries parse to -1 and can never satisfy a
 * real tier, so they need no special case.
 */
export const tierUnlocked = (unlockedTiers: ReadonlySet<string>, key: string, tier: number): boolean => {
  const prefix = `${key}_`;
  for (const id of unlockedTiers) {
    if (!id.startsWith(prefix)) continue;
    const n = Number(id.slice(prefix.length));
    if (Number.isInteger(n) && n >= tier) return true;
  }
  return false;
};

/**
 * Decide whether an accessory's recipe is still locked.
 *
 * An accessory can be granted by more than one collection tier. Any single
 * satisfied unlock is enough, so this looks for one that passes before it
 * reports one that fails, and it reports the CHEAPEST failure so the player is
 * pointed at the shortest road rather than the first one listed.
 */
export function gateAccessory(
  unlocks: readonly CollectionUnlock[] | null,
  progress: CollectionProgress,
  collectionKeys: Map<string, string>
): GateResult {
  if (!unlocks || unlocks.length === 0) return NOT_BLOCKED;

  // Without the gating field we know nothing, and guessing from raw counts is
  // exactly what the note at the top of this file refuses to do.
  if (!progress.known || progress.unlockedTiers.size === 0) {
    return { block: null, unresolved: true };
  }

  const blocked: CollectionBlock[] = [];
  let anyResolved = false;

  for (const unlock of unlocks) {
    const key = collectionKeys.get(norm(unlock.collection));
    if (!key) continue;

    /*
     * Validate the resolved key before trusting it.
     *
     * A name can resolve to an item id that is not a collection at all, and a
     * tier id built on it would then never appear in `unlocked_coll_tiers`,
     * which reads identically to "not unlocked yet". The two are told apart by
     * asking whether this key is a collection the player has ANY trace of:
     * either a lifetime count or at least one crossed tier. If neither, we are
     * not looking at a collection key and must not gate on it.
     */
    const isRealCollection =
      key in progress.counts || [...progress.unlockedTiers].some((t) => t.startsWith(`${key}_`));
    if (!isRealCollection) continue;

    anyResolved = true;

    if (tierUnlocked(progress.unlockedTiers, key, unlock.tier)) {
      // One satisfied unlock is enough. Nothing else can block it.
      return NOT_BLOCKED;
    }

    blocked.push({
      collection: unlock.collection,
      tier: unlock.tier,
      required: unlock.required,
      have: progress.counts[key] ?? 0,
    });
  }

  // Every unlock named a collection we could not resolve or validate.
  if (!anyResolved) return { block: null, unresolved: true };

  if (blocked.length === 0) return NOT_BLOCKED;

  // The shortest road first.
  blocked.sort((a, b) => a.required - b.required);
  return { block: blocked[0], unresolved: false };
}
