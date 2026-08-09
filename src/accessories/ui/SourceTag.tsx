import React from "react";
import { FOCUS, LABEL, NUM, RADIUS } from "../../ui/kit";
import { SOURCE_CHIP, SOURCE_HINT, SOURCE_LABEL, SOURCE_ORDER } from "./sourceMeta";
import type { SourceCategory } from "./types";

/**
 * Where an accessory comes from, as a chip.
 *
 * Deliberately not the kit's `Tag`. `Tag` applies a complete colour triplet in
 * both of its branches, so a caller passing a hue would be relying on which of
 * two equally specific utilities Tailwind happens to emit last, which is not a
 * thing to rely on. This carries the same geometry as `Tag` (chip radius, mono,
 * 11px, the same padding: the site's one tag shape) and takes its colours as
 * one literal string.
 *
 * See sourceMeta.ts for why these are allowed to be coloured at all, and for
 * the measured hue and contrast figures behind each one.
 */
export const SourceTag: React.FC<{ source: SourceCategory; className?: string }> = ({
  source,
  className = "",
}) => (
  <span
    title={SOURCE_HINT[source]}
    className={
      `inline-flex max-w-full shrink-0 items-center border px-1.5 py-px font-mono text-[11px] leading-[1.5] tracking-tight ` +
      `${RADIUS.chip} ${SOURCE_CHIP[source]} ${className}`
    }
  >
    <span className="truncate">{SOURCE_LABEL[source]}</span>
  </span>
);

/**
 * The key, which is also the filter.
 *
 * A colour code nobody can decode is decoration, so this has to exist. Making
 * it the filter as well is not a trick to save space: the question a legend
 * provokes is "show me only those", and answering it in the same control is
 * fewer pixels and one less thing to learn.
 *
 * Selection is drawn in verdigris, never in the category's own hue. The chip
 * colour says what the thing is; the ring says you clicked it. Those are
 * different claims and the colour lock exists so they never get mixed up.
 *
 * A category with nothing in it stays listed and goes quiet: the key still has
 * to decode every colour on the page, but there is nothing to filter to.
 *
 * TWO JOBS NOW, AND THE WORDING HAS TO KEEP THEM APART. Since the actionable
 * border change, a tile's coloured border no longer restates its source
 * category; it means "you can act on this right now" (craft, buy from an NPC
 * shop, or an event that is currently running - see `ACTIONABLE_TILE`). The
 * chips here remain source-category FILTERS, and three of their hues double
 * as the border code, so the legend carries one line of plain words saying
 * which job is which. Without that line the green chip reads as "green border
 * = craftable category", which is only two-thirds true and the wrong third
 * misleads.
 */
export const SourceLegend: React.FC<{
  counts: Record<SourceCategory, number>;
  selected: readonly SourceCategory[];
  onToggle: (source: SourceCategory) => void;
}> = ({ counts, selected, onToggle }) => (
  <div className="px-2.5 py-2">
    <div className="flex flex-wrap items-center gap-1.5">
      <span className={`${LABEL} mr-0.5`}>Source</span>
      {SOURCE_ORDER.map((source) => {
      const count = counts[source] ?? 0;
      const active = selected.includes(source);
      return (
        <button
          key={source}
          type="button"
          disabled={count === 0}
          aria-pressed={active}
          title={SOURCE_HINT[source]}
          onClick={() => onToggle(source)}
          className={
            `inline-flex items-center gap-1.5 border px-1.5 py-1 transition-colors duration-150 ` +
            `${RADIUS.control} ${FOCUS} ` +
            (count === 0
              ? "cursor-not-allowed border-white/8 bg-transparent opacity-45"
              : active
                ? "cursor-pointer border-emerald-500/50 bg-emerald-500/10"
                : "cursor-pointer border-white/12 bg-white/5 hover:border-white/20 hover:bg-white/8")
          }
        >
          <SourceTag source={source} />
          <span className={`text-[10px] ${NUM} ${active ? "text-emerald-200" : "text-slate-400"}`}>{count}</span>
        </button>
      );
      })}
    </div>
    {/*
      The one line that keeps the legend's two jobs apart: chips filter by
      source, borders mean actionable. The three hue words are written out so
      the sentence decodes the border without the reader needing to map chip
      to path themselves.
    */}
    <p className="mt-1.5 text-[10px] leading-snug text-slate-500">
      These chips filter by where an accessory comes from. A coloured border on a tile means you can act
      on it right now: <span className="text-green-300">green</span> you can craft it,{" "}
      <span className="text-blue-300">blue</span> an NPC shop sells it,{" "}
      <span className="text-yellow-300">yellow</span> its event is running. A plain border means no route
      is open today.
    </p>
  </div>
);
