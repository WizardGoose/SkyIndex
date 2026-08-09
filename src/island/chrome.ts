import type { IslandItem } from "./types";

/**
 * Container navigation widgets, filtered out on the way to the screen.
 *
 * The mod reads what the client renders, and a SkyBlock container screen is not
 * only items: it also holds the buttons that operate it. Back arrows, the Close
 * barrier, backpack selector heads, page navigation. Those were captured as if
 * they were stacks, so they land in snapshots and then pollute the profile
 * inventory, the aggregate totals and search results.
 *
 * TWO RULES SHAPE THIS FILE
 * -------------------------
 * **It is a display filter and never touches stored data.** The snapshot stays
 * exactly as received, because the mod owns history and the site owns display,
 * and because a rule that turns out to be too aggressive has to be fixable in a
 * release rather than by asking every player to export again. Nothing here
 * mutates; everything returns a new list.
 *
 * **The two failure directions are not equally bad.** A missed widget leaves a
 * bit of junk on screen, which is untidy. A false positive silently deletes
 * something the player owns from their own storage view, which is the exact
 * failure this whole feature exists to prevent. So every rule below is anchored
 * and exact rather than a substring, and where there was any doubt the item
 * stays.
 *
 * MATCHING IS ON NAME, NOT ID, AND THAT IS DELIBERATE
 * ---------------------------------------------------
 * Checked against a real 2134-entry snapshot: the widgets carry ordinary item
 * ids. `PLAYER_HEAD` is the id of the page-navigation heads AND of every pet
 * and custom-head item in the game. `CHEST` is the "Backpacks" button AND a
 * chest a player can own. `ARROW` and `BARRIER` are likewise real items. An
 * id-based filter would delete genuine possessions.
 */

/**
 * Optional leading and trailing decoration on a navigation label.
 *
 * Real captures carry a mix: `« First Page`, `← Previous Page`, `Next Page →`,
 * `Last Page »`. The glyph set is kept to actual arrows and chevrons rather
 * than "any non-letter", so an item whose name merely starts with punctuation
 * is not swept up.
 */
const NAV_GLYPH = "[\\u00ab\\u00bb\\u2039\\u203a\\u2190\\u2192\\u21e6\\u21e8<>]";

const PATTERNS: readonly RegExp[] = [
  // Bare buttons. Anchored and exact, so "Backpack of Holding" is untouched.
  /^(?:Go )?Back$/,
  /^Close$/,
  /^Backpacks$/,

  // The backpack selector strip: "Backpack Slot 3", "Empty Backpack Slot 14".
  /^(?:Empty )?Backpack Slot \d{1,3}$/,

  // Ender chest and backpack page selectors.
  /^Ender Chest Page \d{1,3}$/,
  /^Backpack Page \d{1,3}$/,

  // Page navigation, with or without a leading or trailing glyph.
  new RegExp(`^(?:${NAV_GLYPH}\\s*)?(?:First|Previous|Prev|Next|Last) Page(?:\\s*${NAV_GLYPH})?$`),

  // The menu shortcut every SkyBlock container carries in its corner.
  /^SkyBlock Menu(?: \(Click\))?$/,
];

/**
 * Is this captured stack actually a container button?
 *
 * Exported so tests can name the rule directly rather than only observing it
 * through a filtered list.
 */
export const isContainerChrome = (item: { name?: string | null }): boolean => {
  const name = (item.name ?? "").trim();
  if (!name) return false;
  return PATTERNS.some((p) => p.test(name));
};

/**
 * Drop container chrome from a list on its way to the screen.
 *
 * Returns a new array and never touches the input, so the same stored snapshot
 * can be re-rendered by a later build with a different rule.
 */
export const withoutChrome = (list: readonly IslandItem[]): IslandItem[] =>
  list.filter((item) => !isContainerChrome(item));
