import React from "react";
import { NUM } from "./kit";

/**
 * The item hover card.
 *
 * Modelled on SkyCrypt's density, not its skin: a rarity-tinted header band, a
 * tight stack of facts under it, hairlines instead of boxes. Obsidian ground,
 * kit tokens, documented radii, and no Mojang art anywhere.
 *
 * THE RULE THAT SHAPES EVERYTHING HERE
 * ------------------------------------
 * Every row is composed from something we actually hold. Nothing is invented,
 * nothing is estimated, and no row renders blank waiting for data that is not
 * coming. An item with no `extra` shows a name, a count and an id, and that is
 * a complete tooltip rather than a broken one, because for a plain stack of
 * cobblestone there is genuinely nothing else true to say.
 *
 * That is why every section below is behind a real check rather than a
 * placeholder, and why there is no "Item value: unknown" line: a tooltip in a
 * "where is my stuff" tool earns its place by being trustworthy at a glance.
 *
 * ENCHANT DESCRIPTIONS ARE DELIBERATELY ABSENT
 * --------------------------------------------
 * Only the enchant name and level are rendered. The wiki's enchantment module
 * is in this repo, but it stores templated descriptions rather than finished
 * text, and three separate things would have to go right to render one
 * correctly. Getting any of them wrong produces exactly the mangled output
 * this component is supposed to avoid, so it renders what it can stand behind.
 * The measurements are in the report accompanying this change.
 *
 * Layering: this takes plain structural props rather than importing island
 * types, so `src/ui` stays free of feature imports and anything else that
 * grows an item hover can reuse it.
 */

export interface ItemTooltipExtra {
  reforge?: string;
  stars?: number;
  ench?: Record<string, number>;
  recomb?: boolean;
}

export interface ItemTooltipProps {
  id: string;
  name: string;
  count: number;
  extra?: ItemTooltipExtra;
  /** Rarity tier from the item index, e.g. "LEGENDARY". Absent when unknown. */
  tier?: string | null;
  /** Where this section came from, already phrased by the caller. */
  provenance?: string | null;
  /**
   * Unit bazaar price. The caller passes null on Ironman, where there is no
   * bazaar and a coin figure would be a number the player cannot act on.
   */
  unitPrice?: number | null;
  /**
   * What the unit price is a price OF. Defaults to the bazaar wording, which
   * is what this tooltip has always claimed. The networth grids pass their own
   * label because their figure is a valuation, not a market quote, and calling
   * one the other would be exactly the confident mislabel this component
   * exists to avoid.
   */
  priceLabel?: string;
}

/**
 * Tier to classes. The ten `--color-rarity-*` tokens cover every tier the game
 * uses, and rarity is game data, so it never borrows the interface accent.
 *
 * Written out as whole literal class strings rather than composed from a token
 * name. Tailwind finds classes by scanning source text, so a class built as
 * `text-${token}` is a class that never gets generated and a colour that
 * silently never appears.
 */
interface RarityStyle {
  text: string;
  band: string;
}

const RARITY: Record<string, RarityStyle> = {
  COMMON: { text: "text-rarity-common", band: "border-rarity-common/40 bg-rarity-common/10" },
  UNCOMMON: { text: "text-rarity-uncommon", band: "border-rarity-uncommon/40 bg-rarity-uncommon/10" },
  RARE: { text: "text-rarity-rare", band: "border-rarity-rare/40 bg-rarity-rare/10" },
  EPIC: { text: "text-rarity-epic", band: "border-rarity-epic/40 bg-rarity-epic/10" },
  LEGENDARY: { text: "text-rarity-legendary", band: "border-rarity-legendary/40 bg-rarity-legendary/10" },
  MYTHIC: { text: "text-rarity-mythic", band: "border-rarity-mythic/40 bg-rarity-mythic/10" },
  DIVINE: { text: "text-rarity-divine", band: "border-rarity-divine/40 bg-rarity-divine/10" },
  SPECIAL: { text: "text-rarity-special", band: "border-rarity-special/40 bg-rarity-special/10" },
  VERY_SPECIAL: {
    text: "text-rarity-very-special",
    band: "border-rarity-very-special/40 bg-rarity-very-special/10",
  },
  SUPREME: { text: "text-rarity-supreme", band: "border-rarity-supreme/40 bg-rarity-supreme/10" },
};

/** Levels are small and the game writes them in roman, so this covers the range that exists. */
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const roman = (n: number): string => (n >= 1 && n < ROMAN.length ? ROMAN[n] : String(n));

/** BIG_BRAIN -> Big Brain. The same shape the id prettifier uses elsewhere. */
const enchantName = (id: string): string =>
  id
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

/** 1.2M, 45.3k, 812. Coins are read at a glance, not audited. */
const coins = (n: number): string => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return Math.round(n).toLocaleString();
};

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-baseline justify-between gap-3">
    <span className="text-[9px] uppercase tracking-wider text-slate-500">{label}</span>
    <span className="text-[10px] text-slate-200 text-right">{children}</span>
  </div>
);

export const ItemTooltip: React.FC<ItemTooltipProps> = ({
  id,
  name,
  count,
  extra,
  tier,
  provenance,
  unitPrice,
  priceLabel = "Bazaar each",
}) => {
  const rarity = RARITY[(tier ?? "").toUpperCase()] ?? null;
  const enchants = extra?.ench ? Object.entries(extra.ench) : [];
  const stars = extra?.stars && extra.stars > 0 ? extra.stars : 0;

  return (
    <span className="block w-56 overflow-hidden rounded-md border border-slate-700 bg-slate-950 text-left shadow-lg">
      {/* Header band. Tinted by rarity when we know it, neutral when we do not,
          because a default tint would be a claim about the tier. */}
      <span className={`block border-b px-2 py-1.5 ${rarity ? rarity.band : "border-slate-800 bg-slate-900"}`}>
        <span className={`block text-[11px] font-medium ${rarity ? rarity.text : "text-slate-100"}`}>
          {/* Reforge and stars sit in the name line, the way the game writes them. */}
          {extra?.reforge ? `${extra.reforge} ` : ""}
          {name}
          {stars > 0 && <span className="text-rarity-legendary"> {"✪".repeat(Math.min(stars, 10))}</span>}
        </span>
        {(tier || extra?.recomb) && (
          <span className="mt-0.5 flex items-center gap-1.5">
            {tier && (
              <span
                className={`text-[9px] font-semibold uppercase tracking-wider ${
                  rarity ? rarity.text : "text-slate-500"
                }`}
              >
                {tier.replace(/_/g, " ")}
              </span>
            )}
            {extra?.recomb && (
              <span className="text-[9px] font-semibold uppercase tracking-wider text-rarity-epic">recombobulated</span>
            )}
          </span>
        )}
      </span>

      <span className="block space-y-1 px-2 py-1.5">
        <Row label="Count">
          <span className={NUM}>{count.toLocaleString()}</span>
        </Row>

        {/* Non-Ironman and priced only. The caller nulls this out on Ironman,
            where there is no bazaar and the number would be unactionable. */}
        {typeof unitPrice === "number" && unitPrice > 0 && (
          <>
            <Row label={priceLabel}>
              <span className={NUM}>{coins(unitPrice)}</span>
            </Row>
            <Row label="Stack value">
              <span className={`${NUM} text-rarity-legendary`}>{coins(unitPrice * count)}</span>
            </Row>
          </>
        )}

        {provenance && <Row label="Obtained">{provenance}</Row>}

        <Row label="Id">
          <span className={`${NUM} text-slate-400 break-all`}>{id}</span>
        </Row>
      </span>

      {enchants.length > 0 && (
        <span className="block border-t border-slate-800 px-2 py-1.5">
          <span className="mb-0.5 block text-[9px] uppercase tracking-wider text-slate-500">Enchantments</span>
          <span className="block leading-snug">
            {enchants.map(([ench, level]) => (
              <span key={ench} className="mr-2 inline-block text-[10px] text-stat-blue">
                {enchantName(ench)} {roman(level)}
              </span>
            ))}
          </span>
        </span>
      )}
    </span>
  );
};

export default ItemTooltip;
