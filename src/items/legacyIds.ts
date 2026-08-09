/**
 * Legacy Minecraft ids, translated to the names a player actually reads.
 *
 * WHY THIS EXISTS
 * ---------------
 * SkyBlock still speaks 1.8. A sack, a collection or an API-sourced stack can
 * arrive as `INK_SACK:4`, and every layer downstream of that is wrong at once:
 *
 *   1. `prettify` splits on `[_\s:]+`, so `INK_SACK:4` reads "Ink Sack 4" and
 *      `LOG_2:1` reads "Log 2 1". Neither is a thing.
 *   2. The wiki icon ladder derives its URL from that name, so it goes looking
 *      for `File:Ink_Sack_4.png`, which cannot exist. The icon misses for the
 *      same reason the label is wrong, and fixing the label fixes both.
 *
 * The pair `<id>:<damage>` is the pre-flattening item identity: one numeric id
 * plus a damage value that selected the variant. `INK_SACK:4` is Lapis Lazuli,
 * `LOG_2:1` is Dark Oak Log, and no amount of title-casing gets there.
 *
 * WHERE THESE VALUES CAME FROM
 * ----------------------------
 * Every name below was read off Hypixel's own `/resources/skyblock/items`
 * response, which is the same table the game builds its tooltips from. It is
 * the authority for what the player sees in-game, so a name here matches the
 * name on their screen rather than a third party's guess at it. Each one was
 * then probed against the wiki's `imageinfo` API to confirm a real file exists
 * under that exact title, so a corrected name is also a resolvable icon.
 *
 * WHAT IS DELIBERATELY ABSENT
 * ---------------------------
 * A damage value Hypixel does not list is left out rather than guessed at.
 * `INK_SACK:15` is Bone Meal in vanilla and `LOG:4`/`LOG:5` are bark-on-all-
 * sides variants, but none of the three appear in Hypixel's item table, so
 * none of them are here. An unmapped id falls through to exactly the old
 * behaviour, which is ugly but honest. A wrong name is worse than an ugly one,
 * because the player will go and act on it.
 *
 * Nothing here is bundled wiki or Mojang content. These are game identifiers
 * and the short item names that pair with them, hand-checked class by class.
 */

/**
 * Names indexed by damage value, so position IS the damage.
 *
 * Index 0 is the bare id, matching the vanilla rule that damage 0 and no
 * damage are the same item. A gap at the end of an array is not an oversight:
 * it is a damage value Hypixel does not list, left unmapped on purpose.
 */
const BY_DAMAGE: Readonly<Record<string, readonly string[]>> = {
  // Dyes. The one that started this: `INK_SACK:4` is Lapis Lazuli, not a sack.
  // Four of these keep their 1.8 names in Hypixel's table rather than the
  // modern ones, so Rose Red is not "Red Dye" and Dandelion Yellow is not
  // "Yellow Dye". The wiki files follow Hypixel here, so these are the titles
  // that resolve.
  INK_SACK: [
    "Ink Sac",
    "Rose Red",
    "Cactus Green",
    "Cocoa Beans",
    "Lapis Lazuli",
    "Purple Dye",
    "Cyan Dye",
    "Light Gray Dye",
    "Gray Dye",
    "Pink Dye",
    "Lime Dye",
    "Dandelion Yellow",
    "Light Blue Dye",
    "Magenta Dye",
    "Orange Dye",
  ],

  // Woods came in two blocks because one block ran out of damage bits at four
  // species. That is why `LOG_2` exists at all, and why it is a whole separate
  // id rather than `LOG` damage 4.
  LOG: ["Oak Log", "Spruce Log", "Birch Log", "Jungle Log"],
  LOG_2: ["Acacia Log", "Dark Oak Log"],

  // Small flowers. `RED_ROSE` covers eight of them despite the name; only the
  // dandelion sits in its own id.
  RED_ROSE: [
    "Poppy",
    "Blue Orchid",
    "Allium",
    "Azure Bluet",
    "Red Tulip",
    "Orange Tulip",
    "White Tulip",
    "Pink Tulip",
    "Oxeye Daisy",
  ],
  YELLOW_FLOWER: ["Dandelion"],

  // Two-block-tall plants.
  DOUBLE_PLANT: ["Sunflower", "Lilac", "Double Tallgrass", "Large Fern", "Rose Bush", "Peony"],

  // Fish. The base is cod, which had no species word before the flattening.
  RAW_FISH: ["Raw Cod", "Raw Salmon", "Tropical Fish", "Pufferfish"],

  // Ids whose modern name is simply a different word. No damage variants, but
  // they live here so there is one table rather than two.
  POTATO_ITEM: ["Potato"],
  CARROT_ITEM: ["Carrot"],
  SULPHUR: ["Gunpowder"],
};

/** The twelve gemstones, and the five qualities each one is mined at. */
const GEMS: readonly string[] = [
  "Amber", "Amethyst", "Aquamarine", "Citrine", "Jade", "Jasper",
  "Onyx", "Opal", "Peridot", "Ruby", "Sapphire", "Topaz",
];

const GEM_TIERS: readonly string[] = ["Rough", "Flawed", "Fine", "Flawless", "Perfect"];

const GEM_SET = new Set(GEMS.map((g) => g.toUpperCase()));
const GEM_TIER_SET = new Set(GEM_TIERS.map((t) => t.toUpperCase()));

/** "RUBY" -> "Ruby". The sets are upper-cased for lookup; display wants title case. */
const titleWord = (upper: string): string => upper[0] + upper.slice(1).toLowerCase();

/**
 * Split a legacy id into its base and its damage value.
 *
 * THE TRAP THIS AVOIDS
 * --------------------
 * `LOG_2` is a real id in its own right, not `LOG` with damage 2, and
 * `LOG_2:1` is that id with damage 1. Anything that treats a trailing digit as
 * a damage value, or that splits on the first separator it sees, gets Dark Oak
 * Log wrong in a way that looks plausible.
 *
 * So the only separator is a colon, only the last one counts, and the tail
 * after it must be nothing but digits. Everything before it stays intact,
 * underscores and digits and all. `LOG_2` has no colon, so it splits to
 * `LOG_2` with no damage; the underscore is never a separator.
 *
 * Returns the damage as a number, or 0 when there is none, since the vanilla
 * rule is that a bare id and damage 0 are the same item.
 */
export const splitLegacyId = (id: string): { base: string; damage: number } => {
  const trimmed = id.trim();
  const colon = trimmed.lastIndexOf(":");
  if (colon <= 0) return { base: trimmed, damage: 0 };

  const tail = trimmed.slice(colon + 1);
  // A colon with anything other than digits after it is not a damage value, so
  // the whole string is the base and we have no business carving it up.
  if (!/^\d+$/.test(tail)) return { base: trimmed, damage: 0 };

  return { base: trimmed.slice(0, colon), damage: Number(tail) };
};

/**
 * The display name for a legacy id, or null when we do not confidently know it.
 *
 * Null is the important half of this contract. It means the caller must fall
 * back to whatever it did before this module existed, so adding the module can
 * only ever improve a name and never degrade one.
 */
export const legacyItemName = (id: string): string | null => {
  const { base, damage } = splitLegacyId(id);
  if (!base) return null;

  const upper = base.toUpperCase();

  const table = BY_DAMAGE[upper];
  if (table) return table[damage] ?? null;

  // Gemstones are a rule rather than a table: five qualities times twelve gems
  // is sixty ids that all read `<TIER>_<GEM>_GEM` and all resolve to
  // "<Tier> <Gem> Gemstone". Both halves are checked against a closed list, so
  // an id merely shaped like a gemstone does not get an invented name.
  if (damage === 0) {
    const parts = upper.split("_");
    if (parts.length === 3 && parts[2] === "GEM" && GEM_TIER_SET.has(parts[0]) && GEM_SET.has(parts[1])) {
      return `${titleWord(parts[0])} ${titleWord(parts[1])} Gemstone`;
    }
  }

  return null;
};

/**
 * A broader wiki title worth trying when a legacy display name has no file of
 * its own, or null when there is nothing broader to try.
 *
 * WHY THIS IS KEYED ON THE NAME AND NOT THE ID
 * --------------------------------------------
 * By the time the icon ladder runs, the id is gone; it only ever has a display
 * name, which may have come from the mod rather than from `legacyItemName`.
 * The gemstone rule works either way, because "Rough Sapphire Gemstone" is as
 * recognisable as `ROUGH_SAPPHIRE_GEM` is, and keying on the name means a
 * mod-supplied gemstone gets the same fallback as an id-derived one.
 *
 * Every one of the sixty tiered gemstone files exists on the wiki today, so
 * this rung is not reached in practice. It is insurance of exactly the kind
 * `stripReforge` is: a lower rung is only ever consulted after the browser has
 * really failed on the ones above it, so a name that resolves as-is never
 * touches this.
 */
export const legacyWikiTitle = (display: string): string | null => {
  const words = display.trim().split(/\s+/).filter(Boolean);
  if (words.length !== 3) return null;

  const [tier, gem, noun] = words;
  if (noun.toLowerCase() !== "gemstone") return null;
  if (!GEM_TIER_SET.has(tier.toUpperCase()) || !GEM_SET.has(gem.toUpperCase())) return null;

  return `${titleWord(gem.toUpperCase())} Gemstone`;
};
