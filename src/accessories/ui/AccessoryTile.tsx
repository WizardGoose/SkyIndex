import React from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { FOCUS, NUM, RARITY_EDGE, RARITY_FILL, Tag, recombDisplayTier } from "../../ui/kit";
import { ItemIcon } from "../../ui/ItemIcon";
import { wikiArticleUrl } from "../../ui/WikiLink";
import { useHeadSrc } from "../headHashes";
import { blockingLine, openRequirementLines, rarityClass, rarityTileClass } from "./display";
import { SourceTag } from "./SourceTag";
import { ACTIONABLE_EDGE, type ActionablePath } from "./sourceMeta";
import type { AccessoryView } from "./types";

/**
 * One accessory, as a game slot rather than a card.
 *
 * The old card grid did not survive contact with 400 accessories; the
 * reference here is SkyCrypt's profile view: a tight field of
 * square tinted item tiles where the density IS the readability, because a
 * page of 400 accessories is something you scan, not something you read. So
 * this is the site's own chest-grid language (`SlotWrap` in
 * src/ui/slotGrid.tsx is the sibling): a square cell on the plot-cell radius,
 * the icon centred, and a low-alpha tint carrying the one fact worth reading
 * at field scale. Tile tinting is the SkyCrypt technique in our materials and
 * not a line of their AGPL CSS.
 *
 * WHAT THE TINT MEANS: OBTAINABLE RIGHT NOW. An accessory the user can get
 * earns its border: craftable, buyable from an NPC shop, or linked to an
 * event currently running. That replaces the earlier source-category borders: a
 * coloured border is now an instruction rather than a taxonomy, and a tile
 * with no live path wears the neutral cell whatever its source. The three
 * path colours borrow their hue from the matching legend chip (craft green,
 * shop blue, event yellow; `ACTIONABLE_TILE`, defined beside the legend's own
 * colours), so the legend still decodes the field. The source category kept
 * its words: the hover card names it on every tile. Rarity stays where it
 * was, in the hover card's name and band.
 *
 * Everything the old card said out loud moved, not vanished:
 *
 *   hover    the full story: name, rarity, source, every requirement with
 *            where you stand, the upgrade line and its folded rungs. Same
 *            pattern as the slot grid's ItemTooltip: pointer-events-none,
 *            above the tile.
 *   click    the one action the card offered. A craftable accessory opens its
 *            crafting tree on Items; anything else opens its wiki article,
 *            through the same URL rule `WikiLink` uses. One destination per
 *            tile, so the whole square is honestly clickable, which the old
 *            card could never be with two links inside it.
 *   corner   only what scanning needs: "+N" when higher rungs of the line
 *            folded behind this tile, and the lock glyph when a measured
 *            requirement blocks it. Nothing else earns a chip.
 */

/** Hairline row inside the hover card. Label quiet, value readable. */
const CardRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <span className="flex items-baseline justify-between gap-3">
    <span className="shrink-0 text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
    <span className="text-right text-[11px] text-slate-200">{children}</span>
  </span>
);

/**
 * The hover card. Follows `ItemTooltip`'s construction (rarity-tinted header
 * band, tight fact stack, hairlines) but is its own component because the
 * facts are different: an accessory tooltip answers "what stands in the way
 * and where do I go", not "what is this stack worth".
 */
const AccessoryHoverCard: React.FC<{ entry: AccessoryView; recombed?: boolean }> = ({ entry, recombed = false }) => {
  const blocked = blockingLine(entry);
  const open = openRequirementLines(entry);
  // The band wears the tier the player's copy actually holds: bumped when
  // their stack is recombed, base otherwise. The words below say why.
  const displayTier = recombDisplayTier(entry.tier, recombed);
  // `rarityTileClass` answers a null tier with the kit's neutral cell, so an
  // unknown tier keeps its own quiet band rather than a guessed tint.
  const tint = rarityTileClass(displayTier);

  return (
    <span className="block w-60 overflow-hidden rounded-md border border-white/10 bg-slate-950 text-left shadow-lg">
      <span className={`block border-b px-2 py-1.5 ${tint}`}>
        <span className={`block text-[12px] font-medium leading-snug ${rarityClass(displayTier)}`}>
          {entry.name}
        </span>
        {(displayTier || recombed) && (
          <span className="mt-0.5 flex items-center gap-1.5">
            {displayTier && (
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${rarityClass(displayTier)}`}>
                {displayTier}
              </span>
            )}
            {recombed && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-rarity-epic">recombobulated</span>
            )}
          </span>
        )}
      </span>

      <span className="block space-y-1 px-2 py-1.5">
        <CardRow label="Source">
          <SourceTag source={entry.source} />
        </CardRow>

        {/*
         * WHY, then where you stand. The blocking requirement leads because it
         * is the thing to go and clear; the player's own number follows only
         * when somebody actually measured it. Unknown requirements render as
         * flat statements about the item, which is most of the value for a
         * visitor with no key.
         */}
        {blocked && (
          <span className="block text-[11px] leading-snug text-slate-300">
            <Lock className="mr-1 inline h-2.5 w-2.5 shrink-0 align-[-1px] text-slate-500" aria-hidden />
            {blocked.label}
            {blocked.have !== null && (
              <span className="text-slate-400">
                , you have <span className={NUM}>{blocked.have}</span>
              </span>
            )}
            <span className="block pl-3.5 text-[10px] text-slate-500">{blocked.how}</span>
          </span>
        )}

        {!blocked &&
          open.map((line) => (
            <span key={line.label} className="block text-[11px] leading-snug text-slate-400">
              Requires <span className="text-slate-300">{line.label}</span>
              <span className="block text-[10px] text-slate-500">{line.how}</span>
            </span>
          ))}

        {/* The mechanic in one sentence, wherever a transferable is hovered:
            the same accessory stands in both areas, and the reader should not
            have to work out why they saw it twice. */}
        {entry.riftTransferable && (
          <span className="block text-[11px] leading-snug text-slate-400">
            <Tag className="mr-1">transferable</Tag>
            Works both inside and outside the Rift, so it is listed in both areas.
          </span>
        )}

        {entry.coveredByFamily && (
          <span className="block text-[11px] leading-snug text-slate-400">
            A higher tier of this line already covers it.
          </span>
        )}

        {entry.foldedBehind !== null && (
          <span className="block text-[11px] leading-snug text-slate-400">
            Not the next step: a lower rung of this line comes first.
          </span>
        )}

        {/*
         * The folded rungs, in full and in their rarity colours. The "+N" chip
         * on the tile is the summary; this is the list it stands for, so a
         * player can see the whole ascent without unfolding anything.
         */}
        {entry.foldedHigher.length > 0 && (
          <span className="block border-t border-white/8 pt-1 text-[10px] leading-snug text-slate-500">
            Ahead in this line, folded into this tile:
            <span className="block">
              {entry.foldedHigher.map((rung, i) => (
                <span key={rung.id} className={`text-[10px] ${rarityClass(rung.tier)}`}>
                  {rung.name}
                  {i < entry.foldedHigher.length - 1 ? <span className="text-slate-600">, </span> : null}
                </span>
              ))}
            </span>
          </span>
        )}
      </span>

      {/* The click is one destination, so the card says which before it happens. */}
      <span className="block border-t border-white/8 px-2 py-1 text-[10px] text-slate-500">
        {entry.craftable ? "Click for the crafting tree on Items." : "Click for the wiki article."}
      </span>
    </span>
  );
};

export const AccessoryTile: React.FC<{
  entry: AccessoryView;
  /**
   * Which door is open on this tile right now, or null for none. Computed by
   * the page (it owns the clock and the shop index; see `actionable.ts`) and
   * passed down, so this component stays a pure function of its props.
   */
  actionable?: ActionablePath | null;
  /** True when the player's own copy carries `rarity_upgrades`; the tile then wears the bumped tier. */
  recombed?: boolean;
  /**
   * True only on the RIFT sections' tiles: a rift-transferable there wears a
   * small corner mark so a reader understands why the same accessory also
   * stands in its normal section. The mark says "both" because that is the
   * fact a scanner needs and the full word "transferable" does not fit a
   * 3.25rem cell at any honest size; the hover card carries the word and the
   * sentence. Normal-section tiles skip the mark - there is nothing odd to
   * explain about an accessory sitting in its own section.
   */
  markTransferable?: boolean;
}> = ({ entry, actionable = null, recombed = false, markTransferable = false }) => {
  /*
   * The last rung, for the accessories that are player heads.
   *
   * Keyed on `entry.id`, the Hypixel id, because that is what the item resource
   * the hash came from is keyed by. `entry.itemId` is our wiki slug and is a
   * different thing; it is what `ItemIcon` gets as `id`, for name prettifying.
   * Measured on the 407 entry catalogue: 348 resolve through the wiki and all
   * 59 that do not have a texture hash here. See `headHashes.ts`.
   */
  const headSrc = useHeadSrc(entry.id);

  /*
   * Dimmed, not hidden, for the rungs the toggle revealed: a covered rung the
   * player upgraded away and a folded rung that is not their next step are
   * both context rather than errands, and the hover card says which in words.
   */
  const dimmed = entry.coveredByFamily || entry.foldedBehind !== null;

  /*
   * TWO FACTS, ONE CELL: the FILL is the rarity -
   * the bumped rarity when the player's copy is recombed, because that is the
   * rarity the item holds in game - and the BORDER stays the
   * "obtainable right now" instruction when a door is open, falling back to
   * the rarity's own edge when none is. The two never fight because they
   * never claim the same stroke; the legend still decodes the borders and the
   * tint now reads as SkyCrypt's field does. `rounded-md` sits on the
   * kit's one radius scale.
   */
  const displayTier = recombDisplayTier(entry.tier, recombed);
  // The fallbacks are the kit's neutral cell (RARITY_TILE_UNKNOWN) split into
  // its halves, because here the border may belong to a different fact.
  const fill = (displayTier && RARITY_FILL[displayTier]) || "bg-white/5";
  const edge = actionable
    ? ACTIONABLE_EDGE[actionable]
    : (displayTier && RARITY_EDGE[displayTier]) || "border-white/10";

  const className =
    `group relative flex aspect-square items-center justify-center rounded-md border ` +
    `${edge} ${fill} hover:ring-1 hover:ring-white/25 ${FOCUS}`;

  const body = (
    <>
      <ItemIcon
        name={entry.name}
        id={entry.itemId ?? undefined}
        // The wiki slug above prettifies the name; the pack lookup needs the
        // game's own id, which is what catharsis packs key their textures by.
        hypixelId={entry.id}
        lateSrc={headSrc}
        size={32}
        className={dimmed ? "opacity-50" : ""}
      />

      {entry.foldedHigher.length > 0 && (
        <span
          className={`absolute right-0 top-0 rounded-[2px] bg-slate-950/85 px-0.5 text-[9px] leading-[1.3] ${NUM} text-slate-300`}
        >
          +{entry.foldedHigher.length}
        </span>
      )}

      {entry.blockedBy && (
        <Lock className="absolute bottom-0.5 left-0.5 h-2.5 w-2.5 text-slate-400" aria-hidden />
      )}

      {markTransferable && entry.riftTransferable && (
        <span
          className={`absolute bottom-0 right-0 rounded-[2px] border border-white/12 bg-slate-950/85 px-0.5 text-[9px] leading-[1.3] ${NUM} text-slate-300`}
        >
          both
        </span>
      )}

      {/* Hover card rather than a `title`: instant, and it carries the rarity
          band, the requirement stack and the folded line list that a native
          tooltip cannot. Same geometry as the slot grid's. */}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 hidden -translate-x-1/2 group-hover:block group-focus-visible:block">
        <AccessoryHoverCard entry={entry} recombed={recombed} />
      </span>
    </>
  );

  /*
   * Craftable entries hand off to the Items page, which owns the full cost
   * tree; the query is the display name because that index matches on name.
   * Everything else goes to its wiki article through the same URL rule
   * `WikiLink` uses, in a new tab, exactly as every wiki link on the site.
   */
  return entry.craftable ? (
    <Link
      to={`/items?q=${encodeURIComponent(entry.name)}`}
      aria-label={`${entry.name}: open the crafting tree`}
      className={className}
    >
      {body}
    </Link>
  ) : (
    <a
      href={wikiArticleUrl(entry.name)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${entry.name}: open the wiki article`}
      className={className}
    >
      {body}
    </a>
  );
};
