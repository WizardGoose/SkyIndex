import type { ShopIndex } from "../../items/wikiShops";
import { norm } from "../../items/wikiCrafting";
import { isEventLive } from "../skyblockCalendar";
import type { ActionablePath } from "./sourceMeta";
import type { AccessoryView } from "./types";

/**
 * Which tiles the player can act on RIGHT NOW, and by which door.
 *
 * This is the rule behind the coloured borders, kept pure and out of the
 * components so it can be tested against a pinned clock and a synthetic shop
 * index. The rule: an accessory the user can get earns a border when they
 * can craft it, buy it from an NPC shop, or the event it is linked to is
 * currently running. Three doors, tested in a fixed priority
 * (craft beats shop beats event) so a tile with several open doors wears
 * exactly one colour and always the same one.
 *
 * WHAT "RIGHT NOW" REFUSES TO CLAIM
 * ---------------------------------
 *   craft   requires a recipe AND no measured-unmet requirement. `blockedBy`
 *           is already exactly that judgement (a collection tier still to
 *           grind, a slayer level not reached), so a collection-blocked
 *           craftable is NOT actionable: the border would be telling somebody
 *           to craft a thing the game will not let them craft today. An
 *           UNKNOWN requirement does not block, same as everywhere else on
 *           this page: unknown is not unmet, and the tile still shows the
 *           requirement in words.
 *   shop    the wiki's shop stock index actually lists an offer for it, by
 *           the same name join the Items page's "Sold by" panel uses, AND the
 *           counter is open today. A listing whose NPC article states an
 *           availability gate (`SHOP_EVENTS` in wikiShops.ts: the Bingo NPC
 *           exists for the first seven real-world days of each month, the
 *           Fear Mongerer only during the Spooky Festival) counts only while
 *           `isEventLive` says that gate is open; a gate of `unknown`
 *           (Drakuu's Kuudra progression, the Great Spook) never counts,
 *           same refusal as the event door below. An empty index (not yet
 *           fetched, or fetch failed) simply lights no shop borders, which
 *           is honest: we could not confirm a counter sells it today.
 *   event   the accessory's own article named a calendar event AND the
 *           calendar says that event is running at `now`. `isEventLive`
 *           answers "unknown" for events Hypixel schedules off-calendar, and
 *           unknown NEVER lights a border: a border is an instruction to go
 *           and act, and "maybe" is not one.
 *
 * Owned tiles never get a path: there is nothing left to act on. A blocking
 * requirement closes doors by what it actually gates, which is the same
 * distinction `composeSnapshot` draws: a COLLECTION gate locks the recipe and
 * nothing else, so it closes only the craft door (a shop selling the same item
 * is still a live route); one of Hypixel's own requirements (a slayer level, a
 * trophy tier) gates the item however it is acquired, so it closes every door.
 */
export function actionablePathOf(
  entry: AccessoryView,
  shops: ShopIndex,
  now: number
): ActionablePath | null {
  if (entry.status === "owned") return null;
  // A measured-unmet requirement of Hypixel's own gates the item outright.
  if (entry.blockedBy !== null && entry.blockedBy.kind !== "collection") return null;

  if (entry.craftable && entry.blockedBy === null) return "craft";

  // A listing only counts while its counter is actually open. No stated gate
  // means an ordinary shop, open; a stated gate must be LIVE, and "unknown"
  // is not live, because a border is an instruction to go and act.
  const listings = shops.byItem.get(norm(entry.name));
  const open = listings?.some((l) => l.event === undefined || isEventLive(l.event, now) === true);
  if (open) return "shop";

  if (entry.eventKey !== null && isEventLive(entry.eventKey, now) === true) return "event";

  return null;
}
