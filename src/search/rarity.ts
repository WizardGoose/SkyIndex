/**
 * Rarity classes, written out in full.
 *
 * WHY THIS IS A MAP OF LITERALS AND NEVER A TEMPLATE
 * -------------------------------------------------
 * Tailwind builds its stylesheet by scanning source files for complete class
 * strings. It does not run the code. So `text-rarity-${tier}` produces exactly
 * nothing: the scanner sees a fragment, no rule is generated, and the name
 * renders in the inherited colour with no error anywhere to explain why. This
 * project has already been bitten by that once.
 *
 * Every one of the ten tiers therefore appears below as a whole string that a
 * text search would find. The build is checked afterwards by grepping the
 * emitted CSS for all ten, which is the only proof that matters.
 *
 * The colours themselves are game data and live on `--color-rarity-*` in
 * index.css, deliberately off the chrome ramps so a future retint of the site
 * accent cannot reach them. See the game-data block there.
 */

/** The ten tiers the game has, spelled the way the CSS tokens spell them. */
export type RarityKey =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic"
  | "divine"
  | "special"
  | "very-special"
  | "supreme";

/** Complete class strings. Do not build these, do not interpolate them. */
export const RARITY_TEXT: Record<RarityKey, string> = {
  common: "text-rarity-common",
  uncommon: "text-rarity-uncommon",
  rare: "text-rarity-rare",
  epic: "text-rarity-epic",
  legendary: "text-rarity-legendary",
  mythic: "text-rarity-mythic",
  divine: "text-rarity-divine",
  special: "text-rarity-special",
  "very-special": "text-rarity-very-special",
  supreme: "text-rarity-supreme",
};

const KEYS = Object.keys(RARITY_TEXT) as RarityKey[];

/**
 * Whatever the three data sources call a tier, turned into one of the ten keys.
 *
 * The crafting index says `VERY_SPECIAL`, the greenhouse dataset says
 * `common`, the shard table says `Common`. All three land on the same key, and
 * anything unrecognised returns null rather than guessing a colour, because a
 * wrong rarity is worse than no rarity.
 */
export const rarityKey = (raw: string | null | undefined): RarityKey | null => {
  if (!raw) return null;
  const k = raw.toLowerCase().trim().replace(/[\s_]+/g, "-");
  return (KEYS as string[]).includes(k) ? (k as RarityKey) : null;
};

/** The class for a tier, or the neutral name colour when the tier is unknown. */
export const rarityClass = (key: RarityKey | null): string => (key ? RARITY_TEXT[key] : "text-slate-200");
