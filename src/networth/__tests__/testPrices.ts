import catalogueFixture from "./fixtures/catalogue.json";
import type { Catalogue, PriceMap } from "../types";

/**
 * Prices for the tests, written here rather than captured.
 *
 * The ITEMS in these tests are verbatim off Hypixel and nothing about their
 * shape is invented. The PRICES are not, and deliberately so, for two reasons.
 *
 *   A test that asserts a real market price asserts something that changes
 *   every fifteen minutes, so it would either be rewritten constantly or
 *   loosened until it proved nothing.
 *
 *   The SkyHelper prices repository carries no licence, and this project's
 *   position (NOTICE.md) is that it fetches that file at runtime and never
 *   redistributes it. Committing a slice of it as a fixture would be
 *   redistributing it.
 *
 * So these are round numbers chosen to make each modifier's arithmetic legible
 * in the assertion: if a factor is 0.8 and the price is 10,000,000 then the
 * expected line is 8,000,000 and a reader can check it without a calculator.
 * Agreement with the real numbers is what `pnpm parity:networth` is for, and it
 * uses the real file against the real library.
 */
export const TEST_PRICES: PriceMap = {
  // Base items
  HYPERION: 400_000_000,
  HYPERION_SHINY: 500_000_000,
  TANK_WITHER_CHESTPLATE: 20_000_000,
  CHAMP_ROD: 5_000_000,
  TITANIUM_DRILL_2: 8_000_000,
  TITANIUM_DRILL_4: 30_000_000,
  ASPECT_OF_THE_VOID: 12_000_000,
  GYROKINETIC_WAND: 4_000_000,
  FIGSTONE_AXE: 6_000_000,
  ADVANCED_GARDENING_HOE: 2_000_000,
  PULSE_RING: 25_000_000,
  NUTCRACKER_HELMET: 1_000_000,
  NUTCRACKER_HELMET_SKINNED_NUTCRACKER_KNIGHT: 3_000_000,
  LARGE_SCAFFOLDING: 1_000,
  BAT_WAND: 7_000_000,
  MIDAS_SWORD: 40_000_000,
  // Priced so the STARRED_ id survives normalisation. Without an entry the
  // unfrag fallback rewrites it to MIDAS_SWORD and a different cap applies,
  // which is upstream behaviour and is covered by the second Midas case.
  STARRED_MIDAS_SWORD: 600_000_000,
  STARRED_MIDAS_SWORD_250M: 900_000_000,
  MIDAS_SWORD_50M: 120_000_000,
  BALLOON_HAT_2024: 100_000,
  BALLOON_HAT_2024_RED: 900_000,
  PARTY_HAT_SLOTH: 200_000,
  PARTY_HAT_SLOTH_TEARS: 800_000,
  NEW_YEAR_CAKE: 1_000,
  NEW_YEAR_CAKE_169: 4_000_000,
  NEW_YEAR_CAKE_BAG: 500_000,
  GREAT_SPOOK_BOOTS: 700_000,

  // Modifiers
  RECOMBOBULATOR_3000: 10_000_000,
  HOT_POTATO_BOOK: 100_000,
  FUMING_POTATO_BOOK: 1_000_000,
  THE_ART_OF_WAR: 5_000_000,
  THE_ART_OF_PEACE: 20_000_000,
  DRAGON_CLAW: 3_000_000,
  PRECURSOR_GEAR: 1_500_000,
  ROCK_GEMSTONE: 600_000,
  MOONGLADE_JEWEL: 900_000,
  BLESSED_FRUIT: 400_000,
  RUNE_MUSIC_3: 2_000_000,
  JASPER_POWER_SCROLL: 8_000_000,
  IMPLOSION_SCROLL: 30_000_000,
  WITHER_SHIELD_SCROLL: 31_000_000,
  SHADOW_WARP_SCROLL: 32_000_000,
  FINE_JASPER_GEM: 400_000,
  FINE_SAPPHIRE_GEM: 300_000,
  PERFECT_AMBER_GEM: 9_000_000,
  ESSENCE_WITHER: 1_000,
  FIRST_MASTER_STAR: 50_000_000,
  SECOND_MASTER_STAR: 60_000_000,
  THIRD_MASTER_STAR: 70_000_000,
  FOURTH_MASTER_STAR: 80_000_000,
  FIFTH_MASTER_STAR: 90_000_000,
  ETHERWARP_CONDUIT: 15_000_000,
  TRANSMISSION_TUNER: 2_000_000,
  MANA_DISINTEGRATOR: 3_000_000,
  THUNDER_IN_A_BOTTLE: 500_000,
  POLARVOID_BOOK: 1_100_000,
  DIVAN_POWDER_COATING: 60_000_000,
  WOOD_SINGULARITY: 4_000_000,
  FARMING_FOR_DUMMIES: 700_000,
  SIL_EX: 5_000_000,
  MITHRIL_DRILL_ENGINE: 2_500_000,
  MITHRIL_FUEL_TANK: 1_200_000,
  COMMON_HOOK: 300_000,
  SPEEDY_LINE: 400_000,
  JUNK_SINKER: 500_000,
  FORAGING_WISDOM_BOOSTER: 2_200_000,
  BLACK_CAT_BOOSTER: 2_300_000,

  // Enrichments. The handler prices the CHEAPEST of the set, so these are
  // deliberately unequal and the expected value is the smallest one.
  TALISMAN_ENRICHMENT_CRITICAL_CHANCE: 9_000_000,
  TALISMAN_ENRICHMENT_CRITICAL_DAMAGE: 8_000_000,
  TALISMAN_ENRICHMENT_DEFENSE: 7_000_000,
  TALISMAN_ENRICHMENT_HEALTH: 6_000_000,
  TALISMAN_ENRICHMENT_INTELLIGENCE: 5_000_000,
  TALISMAN_ENRICHMENT_MAGIC_FIND: 4_000_000,
  TALISMAN_ENRICHMENT_WALK_SPEED: 3_000_000,
  TALISMAN_ENRICHMENT_STRENGTH: 2_000_000,
  TALISMAN_ENRICHMENT_ATTACK_SPEED: 1_000_000,
  TALISMAN_ENRICHMENT_FEROCITY: 1_500_000,
  TALISMAN_ENRICHMENT_SEA_CREATURE_CHANCE: 2_500_000,

  // Enchantments
  ENCHANTMENT_ULTIMATE_WISE_5: 20_000_000,
  ENCHANTMENT_CHAMPION_1: 10_000_000,
  ENCHANTMENT_SCAVENGER_5: 99_000_000,
  ENCHANTMENT_SHARPNESS_6: 4_000_000,
  ENCHANTMENT_COUNTER_STRIKE_5: 100_000_000,

  // Pets
  LVL_1_LEGENDARY_MITHRIL_GOLEM: 1_000_000,
  LVL_100_LEGENDARY_MITHRIL_GOLEM: 51_000_000,
  LVL_1_EPIC_GUARDIAN: 500_000,
  LVL_100_EPIC_GUARDIAN: 9_500_000,
  LVL_1_MYTHIC_ENDERMAN: 10_000_000,
  LVL_100_MYTHIC_ENDERMAN: 210_000_000,
  LVL_1_MYTHIC_ENDERMAN_SKINNED_ENDERMAN_SLAYER: 12_000_000,
  LVL_100_MYTHIC_ENDERMAN_SKINNED_ENDERMAN_SLAYER: 260_000_000,
  LVL_1_LEGENDARY_GRIFFIN: 2_000_000,
  LVL_100_LEGENDARY_GRIFFIN: 102_000_000,
  PET_ITEM_MINING_SKILL_BOOST_RARE: 3_000_000,
  PET_ITEM_BUBBLEGUM: 7_000_000,
  DWARF_TURTLE_SHELMET: 12_000_000,

  // Sacks and essence
  WHEAT: 5,
  ENCHANTED_DIAMOND: 1_200,
  ESSENCE_UNDEAD: 900,
  RUNE_MUSIC_1: 1_000,
};

/** The trimmed catalogue slice captured for exactly the ids these tests use. */
export const TEST_CATALOGUE = catalogueFixture.items as unknown as Catalogue;
