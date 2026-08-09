/**
 * Number and label formatting for the Networth panel.
 *
 * Coins in SkyBlock span ten orders of magnitude on one screen: a sack of wheat
 * is four figures and an ender chest is eleven. A single format cannot serve
 * both, and a full-precision number cannot be scanned at all, so this abbreviates
 * and the exact figure lives in the `title` on the same element.
 */

/** `1.25B`, `470M`, `12.4k`, `840`. Negative values keep their sign. */
export const coins = (value: number): string => {
  if (!Number.isFinite(value)) return "-";
  const sign = value < 0 ? "-" : "";
  const n = Math.abs(value);

  if (n >= 1e9) return `${sign}${(n / 1e9).toFixed(n / 1e9 >= 100 ? 0 : 2)}B`;
  if (n >= 1e6) return `${sign}${(n / 1e6).toFixed(n / 1e6 >= 100 ? 0 : 1)}M`;
  if (n >= 1e3) return `${sign}${(n / 1e3).toFixed(n / 1e3 >= 100 ? 0 : 1)}k`;
  return `${sign}${Math.round(n)}`;
};

/** The exact figure, for the tooltip that sits behind the abbreviation. */
export const exactCoins = (value: number): string =>
  Number.isFinite(value) ? `${Math.round(value).toLocaleString("en-US")} coins` : "unknown";

/**
 * Category keys to what a player calls them.
 *
 * The order is the order they render in, and it is not alphabetical: it runs
 * from the things a player looks at every session to the things they forget
 * they own, with our own island chests first because they are the reason this
 * page exists.
 */
export const CATEGORY_ORDER: readonly string[] = [
  "island_chests",
  "inventory",
  "enderchest",
  "storage",
  "accessories",
  "armor",
  "equipment",
  "wardrobe",
  "pets",
  "sacks",
  "essence",
  "museum",
  "personal_vault",
  "fishing_bag",
  "potion_bag",
  "sacks_bag",
  "quiver",
  "candy_inventory",
  "carnival_mask_inventory",
  "farming_toolkit",
  "hunting_toolkit",
];

export const CATEGORY_LABELS: Record<string, string> = {
  island_chests: "Island Chests",
  inventory: "Inventory",
  enderchest: "Ender Chest",
  storage: "Storage",
  accessories: "Accessories",
  armor: "Armor",
  equipment: "Equipment",
  wardrobe: "Wardrobe",
  pets: "Pets",
  sacks: "Sacks",
  essence: "Essence",
  museum: "Museum",
  personal_vault: "Personal Vault",
  fishing_bag: "Fishing Bag",
  potion_bag: "Potion Bag",
  sacks_bag: "Sacks Bag",
  quiver: "Quiver",
  candy_inventory: "Candy",
  carnival_mask_inventory: "Carnival Masks",
  farming_toolkit: "Farming Toolkit",
  hunting_toolkit: "Hunting Toolkit",
};

/** A category key nobody has named yet still gets a readable heading. */
export const categoryLabel = (key: string): string =>
  CATEGORY_LABELS[key] ??
  key
    .split("_")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");

/**
 * What a calculation line is, in words.
 *
 * The engine's `type` is an upstream id and reads like one. This is the only
 * place it becomes English, so a breakdown line says "Dungeon star" rather than
 * "STAR".
 */
export const MODIFIER_LABELS: Record<string, string> = {
  RECOMBOBULATOR_3000: "Recombobulator",
  ENCHANTMENT: "Enchantment",
  ENCHANT: "Enchantment",
  ENCHANTMENT_UPGRADE: "Enchantment upgrade",
  SILEX: "Silex",
  REFORGE: "Reforge stone",
  STAR: "Dungeon star",
  STARS: "Dungeon stars",
  PRESTIGE: "Prestige",
  BASE_PRESTIGE_ITEM: "Prestige base item",
  MASTER_STAR: "Master star",
  GEMSTONE: "Gemstone",
  GEMSTONE_SLOT: "Unlocked gemstone slot",
  GEMSTONE_POWER_SCROLL: "Power scroll",
  HOT_POTATO_BOOK: "Hot potato books",
  FUMING_POTATO_BOOK: "Fuming potato books",
  THE_ART_OF_WAR: "The Art of War",
  THE_ART_OF_PEACE: "The Art of Peace",
  NECRON_SCROLL: "Necron blade scroll",
  DRILL_PART: "Drill part",
  ROD_PART: "Rod part",
  ETHERWARP_CONDUIT: "Etherwarp conduit",
  TRANSMISSION_TUNER: "Transmission tuner",
  MANA_DISINTEGRATOR: "Mana disintegrator",
  THUNDER_CHARGE: "Thunder charge",
  TALISMAN_ENRICHMENT: "Enrichment",
  DYE: "Dye",
  RUNE: "Rune",
  BOOSTER: "Booster",
  POLARVOID_BOOK: "Polarvoid books",
  DIVAN_POWDER_COATING: "Divan's powder coating",
  WOOD_SINGULARITY: "Wood singularity",
  FARMING_FOR_DUMMIES: "Farming for Dummies",
  JALAPENO_BOOK: "Jalapeno book",
  POCKET_SACK_IN_A_SACK: "Pocket Sack-in-a-Sack",
  OVERCLOCKER_3000: "Overclocker 3000",
  NEW_YEAR_CAKES: "Cakes in the bag",
  SOULBOUND_SKIN: "Skin",
  SOULBOUND_PET_SKIN: "Pet skin",
  PET_ITEM: "Held item",
  PET_CANDY: "Pet candy",
  PICKONIMBUS: "Durability used",
  SHENS_AUCTION: "Shen's auction price",
  CROWN_OF_AVARICE: "Coins collected",
};

export const modifierLabel = (type: string): string =>
  MODIFIER_LABELS[type] ??
  type
    .toLowerCase()
    .split("_")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
