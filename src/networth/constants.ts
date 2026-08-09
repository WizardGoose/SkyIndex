/**
 * The valuation constants, ported from SkyHelper-Networth 2.8.0.
 *
 * MIT, (c) 2022 Altpapier, https://github.com/Altpapier/SkyHelper-Networth
 * See NOTICE.md. MIT into GPL-3.0 is a one-way street that is open, so these
 * tables are a direct port rather than a re-derivation, and staying mechanical
 * is the point: a number invented here is a number that disagrees with every
 * other tool reading the same prices file.
 *
 * Nothing in this file is a judgement of ours. When Hypixel adds a modifier and
 * SkyHelper adds a factor, the delta gets ported here verbatim; the version
 * these tables track is stated in RULES_VERSION so the UI can say which
 * ruleset produced a number rather than implying it is timeless.
 */

/** The upstream release these rules were ported from. Shown in the UI. */
export const RULES_VERSION = "2.8.0";

/**
 * How much of a modifier's own market price carries into the item it was
 * applied to. A recombobulator resells at 80 percent of its price, an
 * enchantment at 85, a master star at 100.
 */
export const APPLICATION_WORTH = {
  enrichment: 0.5,
  farmingForDummies: 0.5,
  overclocker3000: 0.9,
  gemstonePowerScroll: 0.5,
  woodSingularity: 0.5,
  artOfWar: 0.6,
  fumingPotatoBook: 0.6,
  gemstoneSlots: 0.6,
  runes: 0.6,
  tunedTransmission: 0.7,
  pocketSackInASack: 0.7,
  essence: 0.75,
  silex: 0.75,
  artOfPeace: 0.8,
  divanPowderCoating: 0.8,
  enchantmentUpgrades: 0.8,
  jalapenoBook: 0.8,
  manaDisintegrator: 0.8,
  recombobulator: 0.8,
  thunderInABottle: 0.8,
  enchantments: 0.85,
  shensAuctionPrice: 0.85,
  booster: 0.8,
  dye: 0.9,
  gemstoneChambers: 0.9,
  rodPart: 1,
  drillPart: 1,
  etherwarp: 1,
  masterStar: 1,
  gemstone: 1,
  hotPotatoBook: 1,
  necronBladeScroll: 1,
  polarvoidBook: 1,
  prestigeItem: 1,
  reforge: 1,
  petCandy: 0.65,
  soulboundPetSkins: 0.8,
  soulboundSkins: 0.8,
  petItem: 1,
} as const;

/** Enchantments whose resale factor differs from the blanket 0.85. */
export const ENCHANTMENTS_WORTH: Record<string, number> = {
  COUNTER_STRIKE: 0.2,
  BIG_BRAIN: 0.35,
  ULTIMATE_INFERNO: 0.35,
  OVERLOAD: 0.35,
  ULTIMATE_SOUL_EATER: 0.35,
  ULTIMATE_FATAL_TEMPO: 0.65,
};

/** Enchantments that cannot be moved off these items, so they carry no value on them. */
export const BLOCKED_ENCHANTMENTS: Record<string, string[]> = {
  BONE_BOOMERANG: ["OVERLOAD", "POWER", "ULTIMATE_SOUL_EATER"],
  DEATH_BOW: ["OVERLOAD", "POWER", "ULTIMATE_SOUL_EATER"],
  GARDENING_AXE: ["REPLENISH"],
  GARDENING_HOE: ["REPLENISH"],
  ADVANCED_GARDENING_AXE: ["REPLENISH"],
  ADVANCED_GARDENING_HOE: ["REPLENISH"],
};

/** Enchantment levels that come free with the item and so are not worth anything. */
export const IGNORED_ENCHANTMENTS: Record<string, number> = {
  SCAVENGER: 5,
};

/**
 * Enchantments whose level is earned rather than bought. Only level 1 is ever
 * purchasable, so the level on the item says nothing about what it cost.
 */
export const STACKING_ENCHANTMENTS = [
  "EXPERTISE",
  "COMPACT",
  "ABSORB",
  "CULTIVATING",
  "CHAMPION",
  "HECATOMB",
  "TOXOPHILITE",
];

/** Items whose Efficiency above 5 did not come from a Silex. */
export const IGNORE_SILEX = ["PROMISING_SPADE", "PROMISING_AXE"];

export const MASTER_STARS = [
  "FIRST_MASTER_STAR",
  "SECOND_MASTER_STAR",
  "THIRD_MASTER_STAR",
  "FOURTH_MASTER_STAR",
  "FIFTH_MASTER_STAR",
];

export const ALLOWED_RECOMBOBULATED_CATEGORIES = [
  "ACCESSORY",
  "NECKLACE",
  "GLOVES",
  "BRACELET",
  "BELT",
  "CLOAK",
  "VACUUM",
];

export const ALLOWED_RECOMBOBULATED_IDS = [
  "DIVAN_HELMET",
  "DIVAN_CHESTPLATE",
  "DIVAN_LEGGINGS",
  "DIVAN_BOOTS",
  "FERMENTO_HELMET",
  "FERMENTO_CHESTPLATE",
  "FERMENTO_LEGGINGS",
  "FERMENTO_BOOTS",
  "SHADOW_ASSASSIN_CLOAK",
  "STARRED_SHADOW_ASSASSIN_CLOAK",
];

/**
 * Every enrichment, priced as the cheapest of the set.
 *
 * An enrichment can be swapped for any other at no cost, so the one sitting on
 * the accessory is worth what the cheapest one costs, not what its own does.
 */
export const ENRICHMENTS = [
  "TALISMAN_ENRICHMENT_CRITICAL_CHANCE",
  "TALISMAN_ENRICHMENT_CRITICAL_DAMAGE",
  "TALISMAN_ENRICHMENT_DEFENSE",
  "TALISMAN_ENRICHMENT_HEALTH",
  "TALISMAN_ENRICHMENT_INTELLIGENCE",
  "TALISMAN_ENRICHMENT_MAGIC_FIND",
  "TALISMAN_ENRICHMENT_WALK_SPEED",
  "TALISMAN_ENRICHMENT_STRENGTH",
  "TALISMAN_ENRICHMENT_ATTACK_SPEED",
  "TALISMAN_ENRICHMENT_FEROCITY",
  "TALISMAN_ENRICHMENT_SEA_CREATURE_CHANCE",
];

/** Enchantments whose display name is not just the title-cased id. */
export const SPECIAL_ENCHANTMENT_NAMES: Record<string, string> = {
  aiming: "Dragon Tracer",
  pristine: "Prismatic",
  counter_strike: "Counter-Strike",
  turbo_cacti: "Turbo-Cacti",
  turbo_cane: "Turbo-Cane",
  turbo_carrot: "Turbo-Carrot",
  turbo_cocoa: "Turbo-Cocoa",
  turbo_melon: "Turbo-Melon",
  turbo_mushrooms: "Turbo-Mushrooms",
  turbo_potato: "Turbo-Potato",
  turbo_pumpkin: "Turbo-Pumpkin",
  turbo_warts: "Turbo-Warts",
  turbo_wheat: "Turbo-Wheat",
  turbo_rose: "Turbo-Rose",
  turbo_moonflower: "Turbo-Moonflower",
  turbo_sunflower: "Turbo-Sunflower",
  ultimate_reiterate: "Ultimate Duplex",
  ultimate_bobbin_time: "Ultimate Bobbin' Time",
  arcane: "Woodsplitter",
  dragon_hunter: "Gravity",
};

export const GEMSTONE_SLOTS = ["COMBAT", "OFFENSIVE", "DEFENSIVE", "MINING", "UNIVERSAL", "CHISEL"];

/** Items the cosmetic heuristic would otherwise catch by name, and should not. */
export const NON_COSMETIC_ITEMS = new Set([
  "ANCIENT_ELEVATOR",
  "BEDROCK",
  "CREATIVE_MIND",
  "DCTR_SPACE_HELM",
  "DEAD_BUSH_OF_LOVE",
  "DUECES_BUILDER_CLAY",
  "GAME_BREAKER",
  "POTATO_BASKET",
]);

/** `tag.ExtraAttributes.modifier` value to the reforge stone that applies it. */
export const REFORGES: Record<string, string> = {
  stiff: "HARDENED_WOOD",
  trashy: "OVERFLOWING_TRASH_CAN",
  salty: "SALT_CUBE",
  aote_stone: "AOTE_STONE",
  blazing: "BLAZEN_SPHERE",
  waxed: "BLAZE_WAX",
  rooted: "BURROWING_SPORES",
  calcified: "CALCIFIED_HEART",
  candied: "CANDY_CORN",
  perfect: "DIAMOND_ATOM",
  fleet: "DIAMONITE",
  fabled: "DRAGON_CLAW",
  spiked: "DRAGON_SCALE",
  royal: "DWARVEN_TREASURE",
  warped: "ENDSTONE_GEODE",
  coldfusion: "ENTROPY_SUPPRESSOR",
  blooming: "FLOWERING_BOUQUET",
  fanged: "FULL_JAW_FANGING_KIT",
  jaded: "JADERALD",
  jerry_stone: "JERRY_STONE",
  magnetic: "LAPIS_CRYSTAL",
  earthy: "LARGE_WALNUT",
  groovy: "MANGROVE_GEM",
  fortified: "METEOR_SHARD",
  gilded: "MIDAS_JEWEL",
  cubic: "MOLTEN_CUBE",
  moonglade: "MOONGLADE_JEWEL",
  lunar: "MOONSTONE",
  necrotic: "NECROMANCER_BROOCH",
  fruitful: "ONYX",
  precise: "OPTICAL_LENS",
  mossy: "OVERGROWN_GRASS",
  pitchin: "PITCHIN_KOI",
  undead: "PREMIUM_FLESH",
  blood_soaked: "PRESUMED_GALLON_OF_RED_PAINT",
  mithraic: "PURE_MITHRIL",
  reinforced: "RARE_DIAMOND",
  ridiculous: "RED_NOSE",
  loving: "RED_SCARF",
  auspicious: "ROCK_GEMSTONE",
  treacherous: "RUSTY_ANCHOR",
  headstrong: "SALMON_OPAL",
  strengthened: "SEARING_STONE",
  glistening: "SHINY_PRISM",
  bustling: "SKYMART_BROCHURE",
  spiritual: "SPIRIT_DECOY",
  squeaky: "SQUEAKY_TOY",
  sunny: "SUNSTONE",
  suspicious: "SUSPICIOUS_VIAL",
  snowy: "TERRY_SNOWGLOBE",
  dimensional: "TITANIUM_TESSERACT",
  ambered: "AMBER_MATERIAL",
  beady: "BEADY_EYES",
  blessed: "BLESSED_FRUIT",
  bulky: "BULKY_STONE",
  buzzing: "CLIPPED_WINGS",
  erudite: "DAEDALUS_NOTES",
  submerged: "DEEP_SEA_ORB",
  renowned: "DRAGON_HORN",
  festive: "FROZEN_BAUBLE",
  giant: "GIANT_TOOTH",
  lustrous: "GLEAMING_CRYSTAL",
  bountiful: "GOLDEN_BALL",
  chomp: "KUUDRA_MANDIBLE",
  lucky: "LUCKY_DICE",
  mantid: "MANTID_CLAW",
  stellar: "PETRIFIED_STARFALL",
  scraped: "POCKET_ICEBERG",
  ancient: "PRECURSOR_GEAR",
  refined: "REFINED_AMBER",
  empowered: "SADAN_BROOCH",
  withered: "WITHER_BLOOD",
  glacial: "FRIGID_HUSK",
  heated: "HOT_STUFF",
  blood_shot: "SHRIVELED_CORNEA",
  // Non-bazaar
  dirty: "DIRT_BOTTLE",
  moil: "MOIL_LOG",
  toil: "TOIL_LOG",
  greater_spook: "BOO_STONE",
};

/**
 * Kuudra armour prestige chains: a prestiged piece back to every piece it was
 * built out of, most recent first.
 *
 * Built rather than transcribed. Upstream spells all 80 entries out; the table
 * is perfectly regular (five families, four slots, four prestige steps) and a
 * generated one cannot contain the transcription typo a hand-copied one can.
 * The order matters: the handler walks the chain and stops at the first tier
 * the prices file actually has, so it has to run newest to oldest.
 */
const PRESTIGE_FAMILIES = ["CRIMSON", "TERROR", "FERVOR", "HOLLOW", "AURORA"];
const PRESTIGE_SLOTS = ["CHESTPLATE", "HELMET", "LEGGINGS", "BOOTS"];
const PRESTIGE_STEPS = ["HOT", "BURNING", "FIERY", "INFERNAL"];

const buildPrestiges = (): Record<string, string[]> => {
  const out: Record<string, string[]> = {};
  for (const family of PRESTIGE_FAMILIES) {
    for (const slot of PRESTIGE_SLOTS) {
      const base = `${family}_${slot}`;
      for (let step = 0; step < PRESTIGE_STEPS.length; step++) {
        const chain: string[] = [];
        for (let lower = step - 1; lower >= 0; lower--) chain.push(`${PRESTIGE_STEPS[lower]}_${base}`);
        chain.push(base);
        out[`${PRESTIGE_STEPS[step]}_${base}`] = chain;
      }
    }
  }
  return out;
};

export const PRESTIGES: Record<string, string[]> = buildPrestiges();

/* -------------------------------------------------------------------------- */
/* Pets                                                                       */
/* -------------------------------------------------------------------------- */

/** Pets whose level cap is not 100. */
export const SPECIAL_LEVELS: Record<string, number> = {
  GOLDEN_DRAGON: 200,
  JADE_DRAGON: 200,
  ROSE_DRAGON: 200,
};

export const SOULBOUND_PETS = ["GRANDMA_WOLF", "KUUDRA", "BINGO"];

/** Pets where pet candy does not reduce the resale value. */
export const BLOCKED_CANDY_REDUCE_PETS = ["ENDER_DRAGON", "GOLDEN_DRAGON", "SCATHA", "JADE_DRAGON", "ROSE_DRAGON"];

/** Where in LEVELS a rarity's level-1 sits. Mythic shares Legendary's offset. */
export const RARITY_OFFSET: Record<string, number> = {
  COMMON: 0,
  UNCOMMON: 6,
  RARE: 11,
  EPIC: 16,
  LEGENDARY: 20,
  MYTHIC: 20,
};

export const TIERS = [
  "COMMON",
  "UNCOMMON",
  "RARE",
  "EPIC",
  "LEGENDARY",
  "MYTHIC",
  "DIVINE",
  "SPECIAL",
  "VERY_SPECIAL",
  "ULTIMATE",
];

/**
 * Pet experience per level, as one flat ladder that every rarity indexes into
 * at its own offset.
 *
 * The two odd entries near index 119 (a 0 and a 5555) are upstream's, verbatim,
 * and they are load bearing: they are the seam where the level 100 to 200
 * ladder for dragon pets begins. Smoothing them would move every dragon pet's
 * level.
 */
export const LEVELS = [
  100, 110, 120, 130, 145, 160, 175, 190, 210, 230, 250, 275, 300, 330, 360, 400, 440, 490, 540, 600, 660, 730, 800,
  880, 960, 1050, 1150, 1260, 1380, 1510, 1650, 1800, 1960, 2130, 2310, 2500, 2700, 2920, 3160, 3420, 3700, 4000, 4350,
  4750, 5200, 5700, 6300, 7000, 7800, 8700, 9700, 10800, 12000, 13300, 14700, 16200, 17800, 19500, 21300, 23200, 25200,
  27400, 29800, 32400, 35200, 38200, 41400, 44800, 48400, 52200, 56200, 60400, 64800, 69400, 74200, 79200, 84700,
  90700, 97200, 104200, 111700, 119700, 128200, 137200, 146700, 156700, 167700, 179700, 192700, 206700, 221700,
  237700, 254700, 272700, 291700, 311700, 333700, 357700, 383700, 411700, 441700, 476700, 516700, 561700, 611700,
  666700, 726700, 791700, 861700, 936700, 1016700, 1101700, 1191700, 1286700, 1386700, 1496700, 1616700, 1746700,
  1886700, 0, 5555, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700,
  1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700,
  1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700,
  1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700,
  1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700,
  1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700,
  1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700,
  1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700,
];

/** Total experience from level 1 to level 100, per rarity. */
export const XP_TO_LEVEL_100: Record<string, number> = Object.fromEntries(
  Object.entries(RARITY_OFFSET).map(([rarity, offset]) => [
    rarity,
    LEVELS.slice(offset, offset + 99).reduce((total, xp) => total + xp, 0),
  ])
);

/** Pets whose display name is not the title-cased type. */
export const CUSTOM_PET_NAMES: Record<string, string> = {
  TYRANNOSAURUS: "T-Rex",
  FRACTURED_MONTEZUMA_SOUL: "Montezuma",
};
