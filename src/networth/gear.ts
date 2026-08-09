import { petLevel } from "./petValue";
import { titleCase } from "./helpers";
import { recombDisplayTier } from "../ui/kit";
import type { PetData, RawItem } from "./types";

/**
 * Parsed profile containers, turned into what the profile viewer draws.
 *
 * The Island page's gear and pet sections (the profile page is a profile
 * viewer in the SkyCrypt mould; that is its whole goal) read
 * the DECODED containers rather than the valuation's category lists, because
 * the valuation drops zero-priced rows and a profile viewer must not: a
 * worthless helmet is still a helmet you are wearing.
 *
 * Everything here is a pure mapping so it can be tested without rendering
 * anything. Nothing is invented on the way through:
 *
 *   - names come off the item's own display tag, with the game's colour codes
 *     stripped, falling back to the id in title case. An item with neither is
 *     dropped rather than drawn as a mystery tile claiming to be something.
 *   - slot positions are NOT reconstructed. The decoder drops empty slots
 *     before this module ever sees the list (see simplifyItems), so which of
 *     the four armor pieces is missing is genuinely unknowable from this data,
 *     and drawing four positional cells would be a guess wearing a grid.
 */

/** The slot-grid item shape, restated structurally so ui/ stays import-free of networth/. */
export interface GearItem {
  id: string;
  name: string;
  count: number;
  extra?: { ench?: Record<string, number>; recomb?: boolean };
}

/**
 * Which tier a recombed piece displays at. The ladder itself lives in the kit
 * beside the rarity tile maps it exists for (`recombDisplayTier`); this
 * re-export keeps the gear-shaped name the profile page and its tests use.
 */
export const recombTier = recombDisplayTier;

/** Minecraft's section-sign formatting codes, which raw display names carry. */
const stripCodes = (value: string): string => value.replace(/§[0-9a-fk-or]/gi, "");

/**
 * One decoded stack, as a slot. Null when the entry carries nothing we can
 * honestly draw: no id and no name is not an item, it is decoder residue.
 */
export const rawToGearItem = (raw: RawItem): GearItem | null => {
  const id = typeof raw.tag?.ExtraAttributes?.id === "string" ? raw.tag.ExtraAttributes.id : "";
  const rawName = typeof raw.tag?.display?.Name === "string" ? stripCodes(raw.tag.display.Name).trim() : "";
  const name = rawName || (id ? titleCase(id) : "");
  if (!id && !name) return null;

  const count = typeof raw.Count === "number" && Number.isFinite(raw.Count) && raw.Count > 0 ? raw.Count : 1;

  // Enchantments ride along so the shared tooltip can list them; they are the
  // one structured detail the raw tag states in a shape the tooltip already
  // speaks. Everything else in ExtraAttributes stays where it is.
  const enchantments = raw.tag?.ExtraAttributes?.enchantments;
  const ench =
    enchantments && typeof enchantments === "object" && !Array.isArray(enchantments)
      ? Object.fromEntries(
          Object.entries(enchantments as Record<string, unknown>).filter(
            (pair): pair is [string, number] => typeof pair[1] === "number"
          )
        )
      : undefined;

  // The recomb flag, exactly as the accessories bag reader takes it
  // (`rarity_upgrades`, an int that is only ever 1 in live data): it decides
  // which rarity tile the piece wears, because a recombed piece IS the higher
  // rarity in game.
  const upgrades = raw.tag?.ExtraAttributes?.rarity_upgrades;
  const recomb = typeof upgrades === "number" && upgrades >= 1;

  const item: GearItem = { id: id || name.toUpperCase().replace(/\s+/g, "_"), name, count };
  if ((ench && Object.keys(ench).length > 0) || recomb) {
    item.extra = {};
    if (ench && Object.keys(ench).length > 0) item.extra.ench = ench;
    if (recomb) item.extra.recomb = true;
  }
  return item;
};

/** A whole decoded container, in the order the blob stated it, empties already gone. */
export const gearItems = (list: unknown[] | undefined): GearItem[] => {
  if (!Array.isArray(list)) return [];
  const out: GearItem[] = [];
  for (const entry of list) {
    const item = rawToGearItem(entry as RawItem);
    if (item) out.push(item);
  }
  return out;
};

/**
 * Armor reads top-down. The blob stores boots first and helmet last, which is
 * Minecraft's order and nobody's mental model; SkyCrypt draws helmet at the
 * top and so do we.
 */
export const armorItems = (list: unknown[] | undefined): GearItem[] => gearItems(list).reverse();

/** One pet, as the pet grid draws it. */
export interface PetTile {
  /** Stable within one profile: pets carry a uuid, and the fallback includes exp so two identical pets stay apart. */
  key: string;
  name: string;
  /**
   * The wiki's name for the pet's picture. The wiki files pets under
   * "<Kind> Pet" ("Hedgehog Pet.png"), verified against the live wiki
   * 2026-08-03, while the plain kind is the mob's article. Resolving the icon
   * under the display name drew mobs at best and blanks at worst.
   */
  iconName: string;
  /**
   * The `PET_<TYPE>` id spelling, for the texture pack lookup. This is the
   * key catharsis-format packs state pet textures under (their `items/pets/`
   * sub-identifier folder maps to it in `texturePackParse.ts`), and it is
   * not derivable from `iconName`, whose job is the wiki's "<Kind> Pet"
   * article title. Handed to `SlotIcon` as `hypixelId`, never rendered.
   */
  packId: string;
  level: number;
  /** Lowercased tier for the kit's rarity colour map. */
  tier: string;
  /** The currently summoned pet, which deserves saying but not a new colour. */
  active: boolean;
}

/**
 * Pets, sorted the way a player scans them: the active one first, then by
 * level, then by name so equals do not shuffle between renders.
 */
export const petTiles = (pets: unknown[] | undefined): PetTile[] => {
  if (!Array.isArray(pets)) return [];
  const out: PetTile[] = [];
  for (const entry of pets) {
    const pet = entry as PetData;
    if (!pet || typeof pet.type !== "string" || typeof pet.tier !== "string") continue;
    const { level } = petLevel(pet);
    const name = titleCase(pet.type);
    out.push({
      key: typeof pet.uuid === "string" && pet.uuid ? pet.uuid : `${pet.tier}_${pet.type}_${pet.exp ?? 0}`,
      name,
      iconName: `${name} Pet`,
      packId: `PET_${pet.type.toUpperCase()}`,
      level,
      tier: pet.tier.toLowerCase(),
      active: pet.active === true,
    });
  }
  return out.sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    if (a.level !== b.level) return b.level - a.level;
    return a.name.localeCompare(b.name);
  });
};
