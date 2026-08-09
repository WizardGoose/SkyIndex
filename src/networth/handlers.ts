import {
  ALLOWED_RECOMBOBULATED_CATEGORIES,
  ALLOWED_RECOMBOBULATED_IDS,
  APPLICATION_WORTH,
  BLOCKED_ENCHANTMENTS,
  ENCHANTMENTS_WORTH,
  ENRICHMENTS,
  GEMSTONE_SLOTS,
  IGNORED_ENCHANTMENTS,
  IGNORE_SILEX,
  MASTER_STARS,
  PRESTIGES,
  REFORGES,
  SPECIAL_ENCHANTMENT_NAMES,
  STACKING_ENCHANTMENTS,
} from "./constants";
import { starCosts } from "./essenceStars";
import { finiteNumber, isRecord, titleCase } from "./helpers";
import type { SkyBlockItem } from "./itemHelper";
import type { Catalogue, GemstoneSlot, PriceMap, UpgradeCost } from "./types";

/**
 * The modifier handlers, ported one for one from SkyHelper-Networth 2.8.0's
 * `calculators/handlers/` (MIT, (c) 2022 Altpapier; see NOTICE.md).
 *
 * Each handler is two small functions: does this apply, and what does it add.
 * They are kept tiny and independent so a single one can be unit tested against
 * a single captured item, and so porting the next upstream addition is adding
 * one object to the list rather than editing a switch.
 *
 * ORDER IS PART OF THE ANSWER. Four handlers replace `basePrice` rather than
 * adding to `price` (Avarice, Midas, Shen's auction, enchanted books) and one
 * scales it (Pickonimbus), so a handler that runs before them sees a different
 * floor than one that runs after. `HANDLERS` below is upstream's list in
 * upstream's order; do not sort it.
 */
export interface Handler {
  /** Only for tests and error messages. Never branched on. */
  readonly name: string;
  /** Cosmetic handlers stand down when the caller asked for a cosmetic-free total. */
  readonly cosmetic?: boolean;
  applies: (item: SkyBlockItem) => boolean;
  calculate: (item: SkyBlockItem, prices: PriceMap, catalogue: Catalogue) => void;
}

/** Add one modifier line and its price. The shape almost every handler ends in. */
const add = (item: SkyBlockItem, id: string, type: string, price: number, count: number): void => {
  const entry = { id, type, price, count };
  item.price += entry.price;
  item.calculation.push(entry);
};

/**
 * Dungeon stars, from either of the two fields that record them.
 *
 * `parseInt` after stripping non-digits is upstream's exact reading, and it is
 * there because Hypixel has sent this as both a number and a string with a
 * suffix over the years.
 */
const upgradeLevel = (item: SkyBlockItem): number => {
  const dungeonItemLevel = parseInt(String(item.extraAttributes.dungeon_item_level ?? 0).replace(/\D/g, ""));
  const upgrade = parseInt(String(item.extraAttributes.upgrade_level ?? 0).replace(/\D/g, ""));
  return Math.max(dungeonItemLevel, upgrade);
};

/* -------------------------------------------------------------------------- */

const PICKONIMBUS_DURABILITY = 2000;

const pickonimbus: Handler = {
  name: "Pickonimbus",
  // The presence test is not decoration. An unused Pickonimbus carries no
  // durability field at all, and treating absent as zero would price a pristine
  // one as fully spent.
  applies: (item) =>
    item.itemId === "PICKONIMBUS" &&
    item.extraAttributes.pickonimbus_durability !== undefined &&
    finiteNumber(item.extraAttributes.pickonimbus_durability) < PICKONIMBUS_DURABILITY,
  // A used Pickonimbus is worth its remaining durability, so this SUBTRACTS.
  calculate: (item) => {
    const left = finiteNumber(item.extraAttributes.pickonimbus_durability);
    add(
      item,
      "PICKONIMBUS_DURABLITY",
      "PICKONIMBUS",
      item.basePrice * (left / PICKONIMBUS_DURABILITY - 1),
      PICKONIMBUS_DURABILITY - left
    );
  },
};

const prestige: Handler = {
  name: "Prestige",
  applies: (item) => item.itemId in PRESTIGES,
  /**
   * A prestiged Kuudra piece that the market does not list is worth every tier
   * it was built out of. The walk stops at the first tier that IS listed,
   * because from there the market price already includes everything below it.
   */
  calculate: (item, prices, catalogue) => {
    if (prices[item.itemId]) return;
    for (const prestigeItem of PRESTIGES[item.itemId]) {
      const found = catalogue[prestigeItem];
      if (found?.upgrade_costs) {
        item.price += starCosts(prices, item.calculation, found.upgrade_costs as UpgradeCost[][], prestigeItem);
      }
      if (found?.prestige?.costs) {
        item.price += starCosts(prices, item.calculation, found.prestige.costs, prestigeItem);
      }

      if (prices[prestigeItem]) {
        item.calculation.push({ id: prestigeItem, type: "BASE_PRESTIGE_ITEM", price: prices[prestigeItem], count: 1 });
        item.price += prices[prestigeItem];
        break;
      }
    }
  },
};

const shensAuction: Handler = {
  name: "ShensAuction",
  applies: (item) =>
    item.extraAttributes.price !== undefined &&
    item.extraAttributes.auction !== undefined &&
    item.extraAttributes.bid !== undefined,
  /** What somebody actually paid Shen, when that beats what the item lists for. */
  calculate: (item) => {
    const paid = finiteNumber(item.extraAttributes.price) * APPLICATION_WORTH.shensAuctionPrice;
    if (paid > item.basePrice) {
      item.basePrice = paid;
      item.calculation.push({ id: item.itemId, type: "SHENS_AUCTION", price: paid, count: 1 });
    }
  },
};

const MIDAS_SWORDS: Record<string, { maxBid: number; type: string }> = {
  MIDAS_SWORD: { maxBid: 50_000_000, type: "MIDAS_SWORD_50M" },
  STARRED_MIDAS_SWORD: { maxBid: 250_000_000, type: "STARRED_MIDAS_SWORD_250M" },
  MIDAS_STAFF: { maxBid: 100_000_000, type: "MIDAS_STAFF_100M" },
  STARRED_MIDAS_STAFF: { maxBid: 500_000_000, type: "STARRED_MIDAS_STAFF_500M" },
};

const midasWeapon: Handler = {
  name: "MidasWeapon",
  applies: (item) => item.itemId in MIDAS_SWORDS,
  /** A maxed Midas is its own market. Anything short of the cap uses the ordinary price. */
  calculate: (item, prices) => {
    const { maxBid, type } = MIDAS_SWORDS[item.itemId];
    const winningBid = finiteNumber(item.extraAttributes.winning_bid);
    const additional = finiteNumber(item.extraAttributes.additional_coins);

    if (winningBid + additional >= maxBid && prices[type]) {
      item.basePrice = prices[type];
      item.calculation.push({ id: item.itemId, type, price: prices[type], count: 1 });
    }
  },
};

const avariceCoinsCollected: Handler = {
  name: "AvariceCoinsCollected",
  applies: (item) => finiteNumber(item.extraAttributes.collected_coins) > 0,
  /** A Crown of Avarice is priced by how full it is, linear between empty and one billion. */
  calculate: (item, prices) => {
    const zero = prices["CROWN_OF_AVARICE"] ?? 0;
    const billion = prices["CROWN_OF_AVARICE_1B"] ?? 0;
    const collected = Math.min(finiteNumber(item.extraAttributes.collected_coins), 1_000_000_000);
    const price = zero + (billion - zero) * (collected / 1_000_000_000);

    item.basePrice = price;
    item.calculation.push({ id: "CROWN_OF_AVARICE", type: "CROWN_OF_AVARICE", price, count: collected });
  },
};

/** The enchantments compound, or null. Shared by the two enchantment handlers. */
const enchantmentsOf = (item: SkyBlockItem): Record<string, number> | null => {
  const raw = item.extraAttributes.enchantments;
  if (!isRecord(raw)) return null;
  const out: Record<string, number> = {};
  for (const [name, level] of Object.entries(raw)) out[name] = finiteNumber(level);
  return out;
};

const enchantedBook: Handler = {
  name: "EnchantedBook",
  applies: (item) => item.itemId === "ENCHANTED_BOOK" && Object.keys(enchantmentsOf(item) ?? {}).length > 0,
  /**
   * A book IS its enchantments, so this replaces the base price rather than
   * adding to it. A single-enchant book trades at full price; a combined book
   * is worth 85 percent of its parts, because splitting it costs something.
   */
  calculate: (item, prices) => {
    const enchantments = enchantmentsOf(item) ?? {};
    const single = Object.keys(enchantments).length === 1;
    let total = 0;

    for (const [name, value] of Object.entries(enchantments)) {
      const price = prices[`ENCHANTMENT_${name.toUpperCase()}_${value}`];
      if (!price) continue;
      const entry = {
        id: `${name}_${value}`.toUpperCase(),
        type: "ENCHANT",
        price: price * (single ? 1 : APPLICATION_WORTH.enchantments),
        count: 1,
      };
      total += entry.price;
      item.calculation.push(entry);

      if (single) item.itemName = SPECIAL_ENCHANTMENT_NAMES[name] || titleCase(name.replace(/_/g, " "));
    }

    if (total) item.basePrice = total;
  },
};

const TURBO_CROP_UPGRADES = [
  { upgradeItem: "TURBO_GOURD", tier: 6, oncePerItem: true },
  { upgradeItem: "ENCHANTED_TURBO_GOURD", tier: 7, oncePerItem: true },
];

/** Enchantment levels only reachable by consuming a separate item. */
const ENCHANTMENT_UPGRADES: Record<string, { upgradeItem: string; tier: number; oncePerItem?: boolean }[]> = {
  SCAVENGER: [{ upgradeItem: "GOLDEN_BOUNTY", tier: 6 }],
  PESTERMINATOR: [{ upgradeItem: "PESTHUNTING_GUIDE", tier: 6 }],
  LUCK_OF_THE_SEA: [{ upgradeItem: "GOLD_BOTTLE_CAP", tier: 7 }],
  PISCARY: [{ upgradeItem: "TROUBLED_BUBBLE", tier: 7 }],
  FRAIL: [{ upgradeItem: "SEVERED_PINCER", tier: 7 }],
  SPIKED_HOOK: [{ upgradeItem: "OCTOPUS_TENDRIL", tier: 7 }],
  CHARM: [{ upgradeItem: "CHAIN_END_TIMES", tier: 6 }],
  SMITE: [{ upgradeItem: "SEVERED_HAND", tier: 7 }],
  ENDER_SLAYER: [{ upgradeItem: "ENDSTONE_IDOL", tier: 7 }],
  BANE_OF_ARTHROPODS: [{ upgradeItem: "ENSNARED_SNAIL", tier: 7 }],
  VENOMOUS: [{ upgradeItem: "FATEFUL_STINGER", tier: 7 }],
  TURBO_WHEAT: TURBO_CROP_UPGRADES,
  TURBO_CARROT: TURBO_CROP_UPGRADES,
  TURBO_POTATO: TURBO_CROP_UPGRADES,
  TURBO_PUMPKIN: TURBO_CROP_UPGRADES,
  TURBO_MELON: TURBO_CROP_UPGRADES,
  TURBO_MUSHROOMS: TURBO_CROP_UPGRADES,
  TURBO_COCOA: TURBO_CROP_UPGRADES,
  TURBO_CACTI: TURBO_CROP_UPGRADES,
  TURBO_CANE: TURBO_CROP_UPGRADES,
  TURBO_WARTS: TURBO_CROP_UPGRADES,
  TURBO_SUNFLOWER: TURBO_CROP_UPGRADES,
  TURBO_MOONFLOWER: TURBO_CROP_UPGRADES,
  TURBO_ROSE: TURBO_CROP_UPGRADES,
  THORNS: [{ upgradeItem: "PRICKLY_CREEPER", tier: 4 }],
  SCUBA: [{ upgradeItem: "VIBRANT_CORAL", tier: 6 }],
};

const itemEnchantments: Handler = {
  name: "ItemEnchantments",
  applies: (item) => item.itemId !== "ENCHANTED_BOOK" && Object.keys(enchantmentsOf(item) ?? {}).length > 0,
  calculate: (item, prices) => {
    const applied = new Set<string>();

    for (const [rawName, rawValue] of Object.entries(enchantmentsOf(item) ?? {})) {
      const name = rawName.toUpperCase();
      let value = rawValue;
      if (BLOCKED_ENCHANTMENTS[item.itemId]?.includes(name)) continue;
      if (IGNORED_ENCHANTMENTS[name] === value) continue;

      // A stacking enchantment's level was earned by playing, not bought, so
      // only the level 1 book it started as is worth anything.
      if (STACKING_ENCHANTMENTS.includes(name)) value = 1;

      // Efficiency past the craftable ceiling means Silexes were consumed.
      if (name === "EFFICIENCY" && value >= 6 && !IGNORE_SILEX.includes(item.itemId)) {
        const levels = value - (item.itemId === "STONK_PICKAXE" ? 6 : 5);
        if (levels > 0) {
          add(item, "SIL_EX", "SILEX", (prices["SIL_EX"] ?? 0) * levels * APPLICATION_WORTH.silex, levels);
        }
      }

      for (const { upgradeItem, tier, oncePerItem = false } of ENCHANTMENT_UPGRADES[name] ?? []) {
        if (value >= tier && (!oncePerItem || !applied.has(upgradeItem))) {
          add(
            item,
            upgradeItem,
            "ENCHANTMENT_UPGRADE",
            (prices[upgradeItem] ?? 0) * APPLICATION_WORTH.enchantmentUpgrades,
            1
          );
          if (oncePerItem) applied.add(upgradeItem);
        }
      }

      const price =
        (prices[`ENCHANTMENT_${name}_${value}`] ?? 0) * (ENCHANTMENTS_WORTH[name] || APPLICATION_WORTH.enchantments);
      // Zero-priced enchantments are dropped rather than listed, so the
      // breakdown does not fill up with lines that say nothing.
      if (price) add(item, `${name}_${value}`, "ENCHANTMENT", price, 1);
    }
  },
};

/** The many modifiers that are simply "count times a price times a factor". */
const countedModifier = (
  name: string,
  attribute: string,
  id: string,
  type: string,
  worth: number,
  priceId = id
): Handler => ({
  name,
  applies: (item) => finiteNumber(item.extraAttributes[attribute]) > 0,
  calculate: (item, prices) => {
    const count = finiteNumber(item.extraAttributes[attribute]);
    add(item, id, type, (prices[priceId] ?? 0) * count * worth, count);
  },
});

const pocketSackInASack = countedModifier(
  "PocketSackInASack",
  "sack_pss",
  "POCKET_SACK_IN_A_SACK",
  "POCKET_SACK_IN_A_SACK",
  APPLICATION_WORTH.pocketSackInASack
);

const woodSingularity = countedModifier(
  "WoodSingularity",
  "wood_singularity_count",
  "WOOD_SINGULARITY",
  "WOOD_SINGULARITY",
  APPLICATION_WORTH.woodSingularity
);

const jalapenoBook = countedModifier(
  "JalapenoBook",
  "jalapeno_count",
  "JALAPENO_BOOK",
  "JALAPENO_BOOK",
  APPLICATION_WORTH.jalapenoBook
);

const transmissionTuner = countedModifier(
  "TransmissionTuner",
  "tuned_transmission",
  "TRANSMISSION_TUNER",
  "TRANSMISSION_TUNER",
  APPLICATION_WORTH.tunedTransmission
);

const manaDisintegrator = countedModifier(
  "ManaDisintegrator",
  "mana_disintegrator_count",
  "MANA_DISINTEGRATOR",
  "MANA_DISINTEGRATOR",
  APPLICATION_WORTH.manaDisintegrator
);

const MAX_THUNDER_CHARGE = 5_000_000;

const pulseRingThunder: Handler = {
  name: "PulseRingThunder",
  applies: (item) => item.itemId === "PULSE_RING" && finiteNumber(item.extraAttributes.thunder_charge) > 0,
  calculate: (item, prices) => {
    const upgrades = Math.floor(Math.min(finiteNumber(item.extraAttributes.thunder_charge), MAX_THUNDER_CHARGE) / 50_000);
    add(
      item,
      "THUNDER_IN_A_BOTTLE",
      "THUNDER_CHARGE",
      (prices["THUNDER_IN_A_BOTTLE"] ?? 0) * upgrades * APPLICATION_WORTH.thunderInABottle,
      upgrades
    );
  },
};

const rune: Handler = {
  name: "Rune",
  cosmetic: true,
  applies: (item) => {
    const runes = item.extraAttributes.runes;
    return isRecord(runes) && Object.keys(runes).length > 0 && !item.itemId.startsWith("RUNE");
  },
  calculate: (item, prices) => {
    const runes = item.extraAttributes.runes as Record<string, unknown>;
    const [runeType, runeTier] = Object.entries(runes)[0];
    const runeId = `RUNE_${runeType}_${String(runeTier)}`;
    if (prices[runeId]) add(item, runeId, "RUNE", prices[runeId] * APPLICATION_WORTH.runes, 1);
  },
};

const potatoBooks: Handler = {
  name: "PotatoBooks",
  applies: (item) => finiteNumber(item.extraAttributes.hot_potato_count) > 0,
  /**
   * The first ten are Hot Potato Books and everything past ten is a Fuming.
   * Upstream pushes the fuming line first and the hot line second; that order
   * is preserved because the breakdown is rendered in list order.
   */
  calculate: (item, prices) => {
    const total = finiteNumber(item.extraAttributes.hot_potato_count);
    const hot = Math.min(total, 10);

    if (total > 10) {
      const fuming = total - 10;
      add(
        item,
        "FUMING_POTATO_BOOK",
        "FUMING_POTATO_BOOK",
        (prices["FUMING_POTATO_BOOK"] ?? 0) * fuming * APPLICATION_WORTH.fumingPotatoBook,
        fuming
      );
    }

    add(
      item,
      "HOT_POTATO_BOOK",
      "HOT_POTATO_BOOK",
      (prices["HOT_POTATO_BOOK"] ?? 0) * hot * APPLICATION_WORTH.hotPotatoBook,
      hot
    );
  },
};

const dye: Handler = {
  name: "Dye",
  cosmetic: true,
  applies: (item) => typeof item.extraAttributes.dye_item === "string" && item.extraAttributes.dye_item !== "",
  calculate: (item, prices) => {
    const dyeItem = item.extraAttributes.dye_item as string;
    add(item, dyeItem, "DYE", (prices[dyeItem.toUpperCase()] ?? 0) * APPLICATION_WORTH.dye, 1);
  },
};

const artOfWar = countedModifier(
  "ArtOfWar",
  "art_of_war_count",
  "THE_ART_OF_WAR",
  "THE_ART_OF_WAR",
  APPLICATION_WORTH.artOfWar
);

const artOfPeace = countedModifier(
  "ArtOfPeace",
  "artOfPeaceApplied",
  "THE_ART_OF_PEACE",
  "THE_ART_OF_PEACE",
  APPLICATION_WORTH.artOfPeace
);

const farmingForDummies = countedModifier(
  "FarmingForDummies",
  "farming_for_dummies_count",
  "FARMING_FOR_DUMMIES",
  "FARMING_FOR_DUMMIES",
  APPLICATION_WORTH.farmingForDummies
);

const polarvoidBook = countedModifier(
  "PolarvoidBook",
  "polarvoid",
  "POLARVOID_BOOK",
  "POLARVOID_BOOK",
  APPLICATION_WORTH.polarvoidBook
);

const divanPowderCoating: Handler = {
  name: "DivanPowderCoating",
  applies: (item) => finiteNumber(item.extraAttributes.divan_powder_coating) > 0,
  // The count is reported but the coating is applied once, so the price is not
  // multiplied by it. Upstream's asymmetry, kept.
  calculate: (item, prices) => {
    add(
      item,
      "DIVAN_POWDER_COATING",
      "DIVAN_POWDER_COATING",
      (prices["DIVAN_POWDER_COATING"] ?? 0) * APPLICATION_WORTH.divanPowderCoating,
      finiteNumber(item.extraAttributes.divan_powder_coating)
    );
  },
};

const enrichment: Handler = {
  name: "Enrichment",
  applies: (item) =>
    typeof item.extraAttributes.talisman_enrichment === "string" && item.extraAttributes.talisman_enrichment !== "",
  /** Any enrichment swaps for any other for free, so the set's floor is the price. */
  calculate: (item, prices) => {
    const cheapest = Math.min(...ENRICHMENTS.map((id) => prices[id] ?? Infinity));
    if (cheapest !== Infinity) {
      add(
        item,
        (item.extraAttributes.talisman_enrichment as string).toUpperCase(),
        "TALISMAN_ENRICHMENT",
        cheapest * APPLICATION_WORTH.enrichment,
        1
      );
    }
  },
};

const recombobulator: Handler = {
  name: "Recombobulator",
  /**
   * A recombobulator only holds value where it did something transferable.
   * On a bare, unenchanted weapon the rarity bump is worth nothing on resale,
   * which is why the enchantment and category tests are an OR and not an AND.
   */
  applies: (item) => {
    const hasEnchantments = Object.keys(enchantmentsOf(item) ?? {}).length > 0;
    const allows =
      ALLOWED_RECOMBOBULATED_CATEGORIES.includes(item.skyblockItem.category ?? "") ||
      ALLOWED_RECOMBOBULATED_IDS.includes(item.itemId);
    const lastLore = item.itemLore.length ? item.itemLore.at(-1) : "";
    const isAccessory = !!lastLore?.includes("ACCESSORY") || !!lastLore?.includes("HATCESSORY");
    return item.isRecombobulated() && (hasEnchantments || allows || isAccessory);
  },
  calculate: (item, prices) => {
    // A Bone Boomerang cannot be recombobulated back off, so half worth.
    const worth =
      item.itemId === "BONE_BOOMERANG" ? APPLICATION_WORTH.recombobulator * 0.5 : APPLICATION_WORTH.recombobulator;
    add(item, "RECOMBOBULATOR_3000", "RECOMBOBULATOR_3000", (prices["RECOMBOBULATOR_3000"] ?? 0) * worth, 1);
  },
};

interface Gem {
  type: unknown;
  tier: unknown;
  slotType: string;
}

const IS_DIVAN_ARMOUR = /^DIVAN_(HELMET|CHESTPLATE|LEGGINGS|BOOTS)$/;
const IS_CRIMSON_ARMOUR =
  /^(|HOT_|FIERY_|BURNING_|INFERNAL_)(AURORA|CRIMSON|TERROR|HOLLOW|FERVOR)(_HELMET|_CHESTPLATE|_LEGGINGS|_BOOTS)$/;

const gemstones: Handler = {
  name: "Gemstones",
  applies: (item) =>
    isRecord(item.extraAttributes.gems) &&
    Object.keys(item.extraAttributes.gems).length > 0 &&
    (item.skyblockItem.gemstone_slots?.length ?? 0) > 0,
  /**
   * Two things are being priced here and they are separate: the gems sitting in
   * the slots, and the coins and materials spent UNLOCKING slots that do not
   * come unlocked. Only Divan's and the Crimson family charge for slots.
   *
   * The `gems` compound has had two shapes. The newer one is pre-resolved and
   * flagged `formatted`. The older one interleaves slot types, quality objects
   * and an `unlocked_slots` array, and has to be walked against the catalogue's
   * slot list to work out which gem is in which slot. Hypixel's own discussion
   * of that mess is at PublicAPI#549; the walk below is upstream's reading of it.
   */
  calculate: (item, prices) => {
    const raw = item.extraAttributes.gems as Record<string, unknown>;
    const slots = item.skyblockItem.gemstone_slots ?? [];
    let unlockedSlots: string[] = [];
    let gems: Gem[] = [];

    if (raw.formatted) {
      unlockedSlots = Array.isArray(raw.unlockedSlots) ? (raw.unlockedSlots as string[]) : [];
      gems = Array.isArray(raw.gems) ? (raw.gems as Gem[]) : [];
    } else {
      const working = JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;
      for (const slot of slots) {
        const unlocked = working.unlocked_slots;
        if (slot.costs && Array.isArray(unlocked)) {
          for (const [index, type] of (unlocked as string[]).entries()) {
            if (typeof type === "string" && type.startsWith(slot.slot_type)) {
              unlockedSlots.push(slot.slot_type);
              (unlocked as string[]).splice(index, 1);
              break;
            }
          }
        }
        if (!slot.costs) unlockedSlots.push(slot.slot_type);

        const key = Object.keys(working).find((k) => k.startsWith(slot.slot_type) && !k.endsWith("_gem"));
        if (key) {
          const value = working[key];
          gems.push({
            type: GEMSTONE_SLOTS.includes(slot.slot_type) ? working[`${key}_gem`] : slot.slot_type,
            tier: isRecord(value) ? value.quality : value,
            slotType: slot.slot_type,
          });
          delete working[key];
          if (slot.costs && !working.unlocked_slots) unlockedSlots.push(slot.slot_type);
        }
      }
    }

    const isDivan = IS_DIVAN_ARMOUR.test(item.itemId);
    const isCrimson = IS_CRIMSON_ARMOUR.test(item.itemId);
    if (isDivan || isCrimson) {
      const application = isDivan ? APPLICATION_WORTH.gemstoneChambers : APPLICATION_WORTH.gemstoneSlots;
      // Copied because slots are consumed as they are matched: two unlocked
      // slots of the same type must charge for two different slot entries.
      const remaining: GemstoneSlot[] = JSON.parse(JSON.stringify(slots));
      for (const unlockedSlot of unlockedSlots) {
        const index = remaining.findIndex((s) => s.slot_type === unlockedSlot);
        if (index > -1) {
          let total = 0;
          for (const cost of remaining[index].costs ?? []) {
            if (cost.type === "COINS") total += cost.coins ?? 0;
            else if (cost.type === "ITEM") total += (prices[(cost.item_id ?? "").toUpperCase()] ?? 0) * (cost.amount ?? 0);
          }
          add(item, unlockedSlot, "GEMSTONE_SLOT", total * application, 1);
          remaining.splice(index, 1);
        }
      }
    }

    for (const gem of gems) {
      const id = `${String(gem.tier)}_${String(gem.type)}_GEM`;
      add(item, id, "GEMSTONE", (prices[id.toUpperCase()] ?? 0) * APPLICATION_WORTH.gemstone, 1);
    }
  },
};

const gemstonePowerScroll: Handler = {
  name: "GemstonePowerScroll",
  applies: (item) =>
    typeof item.extraAttributes.power_ability_scroll === "string" && item.extraAttributes.power_ability_scroll !== "",
  calculate: (item, prices) => {
    const scroll = item.extraAttributes.power_ability_scroll as string;
    add(item, scroll, "GEMSTONE_POWER_SCROLL", (prices[scroll] ?? 0) * APPLICATION_WORTH.gemstonePowerScroll, 1);
  },
};

const reforge: Handler = {
  name: "Reforge",
  // An accessory's reforge comes from a reforge stone that stays in the
  // accessory bag, so it is not part of the accessory's own worth.
  applies: (item) =>
    typeof item.extraAttributes.modifier === "string" &&
    item.extraAttributes.modifier !== "" &&
    item.skyblockItem.category !== "ACCESSORY",
  calculate: (item, prices) => {
    const stone = REFORGES[item.extraAttributes.modifier as string];
    if (stone) add(item, stone, "REFORGE", (prices[stone] ?? 0) * APPLICATION_WORTH.reforge, 1);
  },
};

const masterStars: Handler = {
  name: "MasterStars",
  applies: (item) => item.skyblockItem.upgrade_costs !== undefined && upgradeLevel(item) > 5,
  /**
   * Stars 6 to 10 are Master Stars, and only on items whose essence ladder stops
   * at 5. An item with a longer ladder charges for those levels through the
   * essence handler instead, and charging twice would double count.
   */
  calculate: (item, prices) => {
    const used = Math.min(upgradeLevel(item) - 5, 5);
    if ((item.skyblockItem.upgrade_costs?.length ?? 0) <= 5) {
      for (let star = 0; star < used; star++) {
        add(item, MASTER_STARS[star], "MASTER_STAR", (prices[MASTER_STARS[star]] ?? 0) * APPLICATION_WORTH.masterStar, 1);
      }
    }
  },
};

const essenceStars: Handler = {
  name: "EssenceStars",
  applies: (item) => (item.skyblockItem.upgrade_costs?.length ?? 0) > 0 && upgradeLevel(item) > 0,
  calculate: (item, prices) => {
    const level = upgradeLevel(item);
    const costs = item.skyblockItem.upgrade_costs as UpgradeCost[][];
    item.price += starCosts(prices, item.calculation, costs.slice(0, level));
  },
};

const necronBladeScrolls: Handler = {
  name: "NecronBladeScrolls",
  applies: (item) => Array.isArray(item.extraAttributes.ability_scroll) && item.extraAttributes.ability_scroll.length > 0,
  calculate: (item, prices) => {
    for (const id of item.extraAttributes.ability_scroll as string[]) {
      add(item, id, "NECRON_SCROLL", (prices[id.toUpperCase()] ?? 0) * APPLICATION_WORTH.necronBladeScroll, 1);
    }
  },
};

const DRILL_PART_TYPES = ["drill_part_upgrade_module", "drill_part_fuel_tank", "drill_part_engine"];

const drillParts: Handler = {
  name: "DrillParts",
  applies: (item) => DRILL_PART_TYPES.some((type) => type in item.extraAttributes),
  calculate: (item, prices) => {
    for (const type of DRILL_PART_TYPES) {
      const part = item.extraAttributes[type];
      if (typeof part === "string" && part) {
        const id = part.toUpperCase();
        add(item, id, "DRILL_PART", (prices[id] ?? 0) * APPLICATION_WORTH.drillPart, 1);
      }
    }
  },
};

const etherwarpConduit: Handler = {
  name: "EtherwarpConduit",
  applies: (item) => !!item.extraAttributes.ethermerge,
  calculate: (item, prices) => {
    add(item, "ETHERWARP_CONDUIT", "ETHERWARP_CONDUIT", (prices["ETHERWARP_CONDUIT"] ?? 0) * APPLICATION_WORTH.etherwarp, 1);
  },
};

const newYearCakeBag: Handler = {
  name: "NewYearCakeBag",
  // `new_year_cake_bag_years` is not on the wire. It is filled in by the
  // category parser, which decodes the nested blob the bag carries.
  applies: (item) =>
    Array.isArray(item.extraAttributes.new_year_cake_bag_years) &&
    item.extraAttributes.new_year_cake_bag_years.length > 0,
  calculate: (item, prices) => {
    let total = 0;
    for (const year of item.extraAttributes.new_year_cake_bag_years as number[]) {
      total += prices[`NEW_YEAR_CAKE_${year}`] ?? 0;
    }
    add(item, "NEW_YEAR_CAKES", "NEW_YEAR_CAKES", total, 1);
  },
};

const soulboundSkin: Handler = {
  name: "SoulboundSkin",
  cosmetic: true,
  /**
   * A skin on a soulbound item did not get priced into the base id, because the
   * base id never resolved to the skinned variant. The `includes` test is what
   * keeps this from charging twice when it did.
   */
  applies: (item) => {
    const skin = item.extraAttributes.skin;
    return typeof skin === "string" && !!skin && !item.itemId.includes(skin) && item.isSoulbound() && !item.nonCosmetic;
  },
  calculate: (item, prices) => {
    const skin = item.extraAttributes.skin as string;
    if (!prices[skin]) return;
    add(item, skin, "SOULBOUND_SKIN", prices[skin] * APPLICATION_WORTH.soulboundSkins, 1);
  },
};

const ROD_PART_TYPES = ["line", "hook", "sinker"];

const rodParts: Handler = {
  name: "RodParts",
  applies: (item) => ROD_PART_TYPES.some((type) => type in item.extraAttributes),
  /**
   * The one modifier that can be soulbound while its host is not: a rod part
   * donated to the museum stays with the account even though the rod could be
   * sold. That is what `soulboundPortion` exists for.
   */
  calculate: (item, prices) => {
    for (const type of ROD_PART_TYPES) {
      const slot = item.extraAttributes[type];
      if (!isRecord(slot) || typeof slot.part !== "string") continue;
      const id = slot.part.toUpperCase();
      const soulbound = !!slot.donated_museum;
      const price = (prices[id] ?? 0) * APPLICATION_WORTH.rodPart;

      item.price += price;
      if (soulbound) item.soulboundPortion += price;
      item.calculation.push({ id, type: "ROD_PART", price, count: 1, soulbound });
    }
  },
};

const booster: Handler = {
  name: "Booster",
  applies: (item) => Array.isArray(item.extraAttributes.boosters) && item.extraAttributes.boosters.length > 0,
  calculate: (item, prices) => {
    for (const raw of item.extraAttributes.boosters as string[]) {
      const id = `${String(raw).toUpperCase()}_BOOSTER`;
      const price = prices[id] ?? 0;
      if (price) add(item, id, "BOOSTER", price * APPLICATION_WORTH.booster, 1);
    }
  },
};

const overclocker3000 = countedModifier(
  "Overclocker3000",
  "levelable_overclocks",
  "OVERCLOCKER_3000",
  "OVERCLOCKER_3000",
  APPLICATION_WORTH.overclocker3000
);

/** Upstream's list, in upstream's order. See the order note at the top of this file. */
export const HANDLERS: readonly Handler[] = [
  pickonimbus,
  prestige,
  shensAuction,
  midasWeapon,
  avariceCoinsCollected,
  enchantedBook,
  itemEnchantments,
  pocketSackInASack,
  woodSingularity,
  jalapenoBook,
  transmissionTuner,
  manaDisintegrator,
  pulseRingThunder,
  rune,
  potatoBooks,
  dye,
  artOfWar,
  artOfPeace,
  farmingForDummies,
  polarvoidBook,
  divanPowderCoating,
  enrichment,
  recombobulator,
  gemstones,
  gemstonePowerScroll,
  reforge,
  masterStars,
  essenceStars,
  necronBladeScrolls,
  drillParts,
  etherwarpConduit,
  newYearCakeBag,
  soulboundSkin,
  rodParts,
  booster,
  overclocker3000,
];

/** Named lookup, for tests that want to exercise one handler in isolation. */
export const HANDLERS_BY_NAME: Record<string, Handler> = Object.fromEntries(HANDLERS.map((h) => [h.name, h]));
