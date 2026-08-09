import { NON_COSMETIC_ITEMS } from "./constants";
import { titleCase } from "./helpers";
import type { CalculationEntry, Catalogue, CatalogueEntry, ExtraAttributes, PriceMap, RawItem } from "./types";

/**
 * One item, mid valuation. Ported from SkyHelper-Networth 2.8.0's
 * `SkyBlockItemNetworthHelper` (MIT, (c) 2022 Altpapier; see NOTICE.md).
 *
 * A mutable object rather than a pure function chain, and that is a deliberate
 * copy of upstream's design rather than an accident of translation. Forty
 * handlers each add to `price` and push a line onto `calculation`, a couple of
 * them (Midas, Shen's, Avarice, enchanted books) instead REPLACE `basePrice`,
 * and one (rod parts) adds to `soulboundPortion`. Threading four accumulators
 * through forty pure functions would be the same thing with more ceremony and
 * one more place for the port to drift from the original.
 *
 * The mutation is contained: an instance lives for one item, is never shared,
 * and the only things that touch it are the handler list in `handlers.ts`.
 *
 * ## The id trap, twice
 *
 * `itemId` is REPLACED by the normalised id inside `applyBasePrice`, and every
 * handler that tests an id tests the normalised one. `baseItemId` keeps the
 * original. That is upstream's behaviour and it is load bearing: a skinned
 * Hyperion prices under `HYPERION_SKINNED_...`, and the soulbound-skin handler
 * then correctly declines to charge for the skin a second time because the
 * normalised id already contains it.
 *
 * Separately, the item compound's own `id` key is the legacy numeric Minecraft
 * block id and is never the SkyBlock id. Same trap `src/nbt/items.ts` documents.
 */
export class SkyBlockItem {
  readonly itemData: RawItem;
  readonly extraAttributes: ExtraAttributes;
  readonly skyblockItem: CatalogueEntry;
  readonly itemLore: string[];
  readonly count: number;
  /** The id as Hypixel sent it, before normalisation. */
  readonly baseItemId: string;

  /** Normalised inside `applyBasePrice`. See the class note. */
  itemId: string;
  itemName: string;

  /** Set when calculating the cosmetic-free total, which makes several handlers stand down. */
  nonCosmetic = false;

  calculation: CalculationEntry[] = [];
  basePrice = 0;
  price = 0;
  soulboundPortion = 0;

  constructor(itemData: RawItem, catalogue: Catalogue) {
    this.itemData = itemData;

    const rawName = itemData.tag?.display?.Name;
    if (typeof rawName !== "string") {
      throw new Error("That item has no display name, so it is not an item document.");
    }

    // Colour codes, then the `%%translation_key%%` placeholders Hypixel started
    // putting in names. Upstream's two replacements, in upstream's order.
    this.itemName = rawName.replace(/§[0-9a-fk-or]/gi, "").replace(/%%[^%]+%%/g, "");
    this.extraAttributes = itemData.tag?.ExtraAttributes ?? {};
    const id = typeof this.extraAttributes.id === "string" ? this.extraAttributes.id : "";
    this.itemId = id;
    this.baseItemId = id;
    this.skyblockItem = catalogue[id] ?? {};
    this.itemLore = Array.isArray(itemData.tag?.display?.Lore)
      ? (itemData.tag.display.Lore as string[]).filter((line): line is string => typeof line === "string")
      : [];
    this.count = typeof itemData.Count === "number" ? itemData.Count : 1;
  }

  /**
   * The id the price should be looked up under.
   *
   * Every branch here is a case where the id on the item is not the id the
   * market trades under: a skin, a party hat colour, a rune's type and tier, a
   * new year cake's year, an editioned space helmet, a shiny variant, or a
   * fragged (`STARRED_`) item whose unfragged form is the one that is priced.
   */
  resolveItemId(prices: PriceMap): string {
    const extra = this.extraAttributes;

    // A skin only wins if the skinned variant is actually worth more. A skin
    // nobody wants must not drag the item below its own floor.
    if (typeof extra.skin === "string" && !this.nonCosmetic) {
      const skinnedId = `${this.itemId}_SKINNED_${extra.skin}`;
      if (prices[skinnedId] && prices[skinnedId] > prices[this.itemId]) return skinnedId;
    }

    if (this.itemId === "PARTY_HAT_SLOTH" && typeof extra.party_hat_emoji === "string") {
      const id = `${this.itemId}_${extra.party_hat_emoji.toUpperCase()}`;
      if (prices[id]) return id;
    }

    if ((this.isUniqueRune() || this.isRune()) && !this.nonCosmetic) {
      const runes = extra.runes as Record<string, unknown>;
      const [runeType, runeTier] = Object.entries(runes)[0];
      return `RUNE_${runeType}_${String(runeTier)}`.toUpperCase();
    }

    if (this.itemId === "NEW_YEAR_CAKE") return `NEW_YEAR_CAKE_${String(extra.new_years_cake)}`;

    if (
      ["PARTY_HAT_CRAB", "PARTY_HAT_CRAB_ANIMATED", "BALLOON_HAT_2024", "BALLOON_HAT_2025"].includes(this.itemId) &&
      typeof extra.party_hat_color === "string"
    ) {
      return `${this.itemId}_${extra.party_hat_color.toUpperCase()}`;
    }

    if (this.itemId === "DCTR_SPACE_HELM" && extra.edition !== undefined) return "DCTR_SPACE_HELM_EDITIONED";
    if (this.itemId === "CREATIVE_MIND" && !extra.edition) return "CREATIVE_MIND_UNEDITIONED";
    if (this.itemId === "ANCIENT_ELEVATOR" && extra.edition !== undefined) return "ANCIENT_ELEVATOR_EDITIONED";

    if (extra.is_shiny && prices[`${this.itemId}_SHINY`]) return `${this.itemId}_SHINY`;

    // Fragged. The `STARRED_` form is a dungeon-only variant with no separate
    // market, so it falls back to the plain one when the plain one is priced.
    if (
      this.itemId.startsWith("STARRED_") &&
      !prices[this.itemId] &&
      prices[this.itemId.replace("STARRED_", "")]
    ) {
      return this.itemId.replace("STARRED_", "");
    }

    return this.itemId;
  }

  /** Names that need the tier or variant spelled out, because several items share one name. */
  resolveItemName(): string {
    if (["Beastmaster Crest", "Griffin Upgrade Stone", "Wisp Upgrade Stone"].includes(this.itemName)) {
      const tier = this.skyblockItem.tier ? titleCase(this.skyblockItem.tier.replaceAll("_", " ")) : "Unknown";
      return `${this.itemName} (${tier})`;
    }

    if (this.itemName.endsWith(" Exp Boost")) {
      const id = this.skyblockItem.id ? titleCase(this.skyblockItem.id.split("_").at(-1)) : "Unknown";
      return `${this.itemName} (${id})`;
    }

    return this.itemName;
  }

  isRune(): boolean {
    const runes = this.extraAttributes.runes;
    return this.itemId === "RUNE" && !!runes && typeof runes === "object" && Object.keys(runes).length > 0;
  }

  isUniqueRune(): boolean {
    const runes = this.extraAttributes.runes;
    return this.itemId === "UNIQUE_RUNE" && !!runes && typeof runes === "object" && Object.keys(runes).length > 0;
  }

  /**
   * Cosmetic means "worth nothing to somebody who only wants the stats".
   *
   * The name test is a heuristic and upstream knows it, which is exactly why
   * `NON_COSMETIC_ITEMS` exists: a handful of real items have DYE or SKIN in
   * their id and would otherwise be zeroed out of the non-cosmetic total.
   */
  isCosmetic(): boolean {
    const testId = (this.itemId + this.itemName).toUpperCase();
    const isSkinOrDye = testId.includes("DYE") || testId.includes("SKIN");
    const isCosmetic = this.skyblockItem.category === "COSMETIC" || !!this.itemLore.at(-1)?.includes("COSMETIC");
    const isMemento = this.skyblockItem.category === "MEMENTO";
    const isOnBlacklist = NON_COSMETIC_ITEMS.has(this.baseItemId);

    return isCosmetic || isSkinOrDye || isMemento || isOnBlacklist || this.isRune() || this.isUniqueRune();
  }

  /**
   * `item_tier` present means the rarity upgrade came with the item rather than
   * from a recombobulator, so it cost nobody anything.
   */
  isRecombobulated(): boolean {
    return Number(this.extraAttributes.rarity_upgrades ?? 0) > 0 && !this.extraAttributes.item_tier;
  }

  /**
   * Soulbound, from the two places it is ever stated: the museum-donation flag,
   * and the lore line the game itself prints.
   *
   * The lore strings carry their colour codes on purpose. They are matched
   * against the raw lore, not the stripped name, so a player who renamed an item
   * "Soulbound" cannot make it read as one.
   */
  isSoulbound(): boolean {
    return !!(
      this.extraAttributes.donated_museum ||
      this.itemLore.includes("§8§l* §8Co-op Soulbound §8§l*") ||
      this.itemLore.includes("§8§l* §8Soulbound §8§l*")
    );
  }

  /** Resolve the name and id, then set the floor the handlers build on. */
  applyBasePrice(prices: PriceMap): void {
    this.itemName = this.resolveItemName();
    this.itemId = this.resolveItemId(prices);
    this.basePrice = (prices[this.itemId] ?? 0) * (typeof this.itemData.Count === "number" ? this.itemData.Count : 1);
  }
}
