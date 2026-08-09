import type { SourceCategory } from "./types";

/**
 * How an accessory's source is written down and coloured.
 *
 * WHY THESE CHIPS ARE ALLOWED TO CARRY COLOUR AT ALL
 * --------------------------------------------------
 * `Tag` in the kit says a coloured chip must not be a status indicator, and
 * that rule stands. A source category is not a status: it does not change when
 * you play, it cannot be "failed" or "running", and it says nothing about you.
 * It is game-semantic metadata about the item itself, in exactly the same class
 * as rarity, and the kit's colour lock names rarity as its one true exception
 * because it "encodes game data, not decoration". Source inherits that
 * exemption. This is the lead's call, recorded here so the next person does not
 * have to re-litigate it against the Tag doc.
 *
 * WHAT THE EXEMPTION DOES NOT BUY
 * -------------------------------
 * Two ramps stay off limits and both refusals are load bearing:
 *
 *   emerald   the interactive accent. If a thing responds to you it is
 *             emerald, so a static chip may never be. Note that in this
 *             codebase `orange`, `purple`, `violet`, `fuchsia` and `sky` were
 *             all folded into that same ramp in index.css, so those five names
 *             are the accent too and are equally unavailable. `text-purple-400`
 *             here renders the accent blue, not purple.
 *
 *   red       destructive or failed. A mob drop is neither.
 *
 * Arcane violet is also refused, and this one is worth spelling out because the
 * kit's summary makes it sound available. The authoritative comment on the
 * token block in index.css is stricter: "Surface material only, everywhere:
 * wash, texture, rules. Never an interactive colour, never a state colour,
 * never text," and it is "deliberately the one that carries no meaning". A
 * source chip is meaning, and it is text. So violet is out.
 *
 * WHAT IS LEFT, MEASURED
 * ----------------------
 * Once the accent family, red and arcane are removed, this palette has exactly
 * five well separated hues, so six coloured categories do not fit cleanly and
 * one pair has to be split by lightness instead of hue. Hue angles:
 *
 *   amber-300   #ffca70    38    quest
 *   yellow-300  #ffe27a    47    event        (the split pair, see below)
 *   green-300   #8ee69f   132    craftable
 *   stat-aqua   #5ef3df   172    mob drop
 *   blue-300    #9aabfa   229    shop
 *   light-purple#fa80d5   318    dark auction
 *
 * Every gap is 40 degrees or more except amber to yellow, which is 9. Those two
 * are told apart by lightness rather than hue (gold against pale lemon), they
 * are the two highest contrast chips on the page, and they carry different
 * words. It is the weakest pair here and it is a property of the palette, not
 * a preference.
 *
 * Contrast, measured against each chip's own tinted ground (the page ground,
 * the panel at 55%, then the chip's own fill at 10%), runs from 7.6:1 on the
 * dark auction chip to 12.8:1 on the event chip. The house floor for 10px text
 * is 4.5:1, so the whole set clears it with room to spare.
 *
 * The one deliberate exception is `wiki`, which takes the kit's plain `Tag`
 * colours and no hue at all. It does not mean "found on the wiki", it means we
 * could not classify this honestly, so it must not look like a confident
 * seventh category sitting alongside six real ones. Absence of colour is the
 * point.
 */

/** Reading order for the legend. Craftable first because it is the actionable one. */
export const SOURCE_ORDER: readonly SourceCategory[] = [
  "craftable",
  "quest",
  "darkAuction",
  "shop",
  "event",
  "mobDrop",
  "wiki",
];

/**
 * Plain words. No jargon, no abbreviations, and `wiki` is phrased as an
 * instruction rather than a category because that is what it is.
 */
export const SOURCE_LABEL: Record<SourceCategory, string> = {
  craftable: "Craftable",
  quest: "Quest",
  darkAuction: "Dark Auction",
  shop: "Shop",
  event: "Event",
  mobDrop: "Mob drop",
  wiki: "See wiki",
};

/**
 * One line each, shown on hover and in the legend. `wiki` says out loud that it
 * is a gap in our data rather than a fact about the item, because a guess
 * dressed as a source is the one failure this page cannot afford.
 */
export const SOURCE_HINT: Record<SourceCategory, string> = {
  craftable: "You can craft it. Open Items for the full recipe tree.",
  quest: "Given by an NPC quest line.",
  darkAuction: "Bought at the Dark Auction.",
  shop: "Sold by an NPC shop.",
  event: "Comes from a timed or seasonal event.",
  mobDrop: "Dropped by a mob.",
  wiki: "We could not classify this one from our data, so we are not guessing. The wiki article is the honest answer.",
};

/**
 * Complete literal class strings, never built by interpolation.
 *
 * Tailwind 4 scans source text, so `text-${hue}-300` produces a class that does
 * not exist and fails silently. Every string below is written out in full so
 * the scanner can see it.
 */
export const SOURCE_CHIP: Record<SourceCategory, string> = {
  craftable: "border-green-300/30 bg-green-300/10 text-green-300",
  quest: "border-amber-300/30 bg-amber-300/10 text-amber-300",
  darkAuction: "border-stat-light-purple/30 bg-stat-light-purple/10 text-stat-light-purple",
  shop: "border-blue-300/30 bg-blue-300/10 text-blue-300",
  event: "border-yellow-300/30 bg-yellow-300/10 text-yellow-300",
  mobDrop: "border-stat-aqua/30 bg-stat-aqua/10 text-stat-aqua",
  wiki: "border-slate-700 bg-slate-800/70 text-slate-300",
};

/**
 * The three ways a missing accessory can be actionable RIGHT NOW, in the
 * priority order a tile wearing several of them resolves to.
 *
 *   craft   it has a recipe and nothing measured blocks it
 *   shop    an NPC shop stocks it today
 *   event   the calendar event it comes from is running at this moment
 *
 * See `actionable.ts` for the rules that decide which of these an entry has;
 * this file only owns their colours.
 */
export type ActionablePath = "craft" | "shop" | "event";

export const ACTIONABLE_ORDER: readonly ActionablePath[] = ["craft", "shop", "event"];

/**
 * The accessory tile's border: OBTAINABLE RIGHT NOW, or nothing.
 *
 * This replaced the earlier source-coloured borders: an accessory the user
 * can get earns a border when they can craft it, buy it from an NPC shop,
 * or the event it is linked to is currently running.
 * So a coloured border is no longer a category, it is an instruction: you can
 * act on this tile today. Everything else, whatever its source, wears the
 * neutral cell. The source category did not lose its words; the hover card
 * still names it on every tile, and the legend chips still carry it.
 *
 * These sit HERE, one line below `SOURCE_CHIP`, on purpose: each path borrows
 * the hue of the source category it corresponds to (craft = the Craftable
 * chip's green, shop = the Shop chip's blue, event = the Event chip's
 * yellow), so the legend chips up top remain the decoder ring for the borders
 * below and a colour that changed in one map without the other would break
 * the decoding. The border runs stronger than the fill (the same /40 over /10
 * treatment the rarity bands use) so the tint reads as an edge with a faint
 * underglow rather than a solid slab.
 */
export const ACTIONABLE_TILE: Record<ActionablePath, string> = {
  craft: "border-green-300/40 bg-green-300/10",
  shop: "border-blue-300/40 bg-blue-300/10",
  event: "border-yellow-300/40 bg-yellow-300/10",
};

/**
 * The same three doors as border-only classes, a step stronger, for tiles
 * whose FILL now belongs to rarity (the rarity tint fills the tile,
 * the actionable border stays the border - both facts on one cell, neither
 * shouting the other down). /60 rather than /40 because a border sharing a
 * cell with a coloured fill has to read over it, where the paired version's
 * border only ever sat on its own faint underglow.
 */
export const ACTIONABLE_EDGE: Record<ActionablePath, string> = {
  craft: "border-green-300/60",
  shop: "border-blue-300/60",
  event: "border-yellow-300/60",
};

/**
 * Every tile with no live path: the neutral cell, in the slot grid's own
 * `border-slate-800` treatment, so "nothing to act on today" reads exactly
 * like the rest of the site's quiet cells rather than like a seventh colour.
 */
export const NEUTRAL_TILE = "border-slate-800 bg-slate-900/60";
