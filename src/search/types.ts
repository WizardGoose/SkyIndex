import type { RarityKey } from "./rarity";

/**
 * Where pressing Enter on a row actually takes you.
 *
 * The badge on each row prints this, so it has to be the truth rather than a
 * category. Four of them are the ones the brief names; `site` is the fifth and
 * exists because the site's own pages are searchable too and the Dashboard,
 * the Island feed and the Guide belong to none of the three tool families.
 * Labelling those "Items" would have been a lie on the one element whose whole
 * job is to say where you are about to go.
 */
export type Destination = "items" | "greenhouse" | "shards" | "wiki" | "site";

/** Lucide glyphs the page rows draw. Mapped to components in the row itself. */
export type GlyphKey = "dashboard" | "planner" | "solver" | "designer" | "items" | "island" | "fusion" | "recipes" | "owned" | "lines" | "guide";

/** One searchable thing. Items, mutations, targets, shards and pages are all this. */
export interface SearchEntry {
  /** Unique across the whole index. Destination-prefixed so ids cannot collide. */
  key: string;
  name: string;
  destination: Destination;
  /** Route for internal destinations, absolute URL for `wiki`. */
  href: string;
  external?: boolean;
  /** Game rarity, when the thing has one. Null means "no tier", not "common". */
  rarity: RarityKey | null;
  /** What `ItemIcon` should resolve the picture from. */
  iconName: string;
  iconId?: string;
  /** A local asset tried before the wiki image: crop art, shard art. */
  iconSrc?: string;
  /**
   * Set on the site's own pages, which have no picture to resolve. The row
   * draws a lucide glyph keyed by this instead of running `ItemIcon`, which
   * would otherwise chase a wiki image for "Grind dashboard" and settle on the
   * initials tile.
   */
  glyph?: GlyphKey;
  /** Small grey note on the row, e.g. "Mutation". Never the badge. */
  hint?: string;
  /**
   * Ranking nudge, applied on top of the match score. Pages sit above data so
   * typing "plan" reaches the Planner rather than a crafting ingredient.
   */
  weight: number;
  /** Normalised name, matched first and hardest. */
  needle: string;
  /** Normalised alternative spellings, matched at a lower band. */
  aliases: string;
}

/** What one search returns. Everything the dropdown needs and nothing else. */
export interface SearchOutcome {
  /** Ranked and capped, wiki row last. */
  rows: SearchEntry[];
  /** Item matches that did not fit. Zero means there is no overflow to offer. */
  moreInItems: number;
  /** Where the overflow affordance goes. */
  moreHref: string;
}
