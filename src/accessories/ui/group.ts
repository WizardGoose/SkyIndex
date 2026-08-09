import { matchesQuery } from "./display";
import type { AccessoryView, SourceCategory } from "./types";
import type { AccessoryGroup, Attainability } from "..";
import { ATTAINABILITY_ORDER } from "..";

/**
 * What the page is currently showing, and why.
 *
 * Kept pure and out of the component so the honesty rules can be tested without
 * mounting anything. The rules are the whole point of this file; the rendering
 * is the easy part.
 */

export interface AccessoryFilter {
  /** Already trimmed and lowercased by the caller. */
  query: string;
  /** Empty means no source filter at all, not "no sources". */
  sources: readonly SourceCategory[];
  /** Empty means no activity filter at all, not "no activities". */
  groups: readonly AccessoryGroup[];
  /**
   * Whether entries a higher rung of the same chain has already replaced are
   * shown. DEFAULT FALSE: they are collapsed away unless asked for.
   *
   * This is the default because of what the alternative said. An accessory you
   * upgraded is not an accessory you are missing, so listing it alongside the
   * things you actually lack makes the count wrong and the page misleading, and
   * it did exactly that: owning the Seal of the Family still showed Crooked
   * Artifact as Missing. Hiding a rung you have already consumed is the honest
   * default, and the toggle is there for anyone who wants the full ladder.
   */
  showCovered: boolean;
}

export const NO_FILTER: AccessoryFilter = { query: "", sources: [], groups: [], showCovered: false };

/**
 * True when the filter is doing nothing, so the UI can hide its own reset
 * control. Note the polarity: hiding covered rungs is now the resting state, so
 * it is `showCovered` being TRUE that counts as an active filter.
 */
export function filterIsIdle(filter: AccessoryFilter): boolean {
  return (
    filter.query === "" && filter.sources.length === 0 && filter.groups.length === 0 && !filter.showCovered
  );
}

export function filterEntries(
  entries: readonly AccessoryView[],
  filter: AccessoryFilter
): AccessoryView[] {
  const sources = filter.sources;

  /*
   * For the folded carve-out below: a folded rung needs to ask whether its
   * next-step tile already answers the query, and it only knows that tile by
   * id. Built once per filter pass rather than searched per entry.
   */
  const byId = new Map(entries.map((e) => [e.id, e] as const));

  return entries.filter((entry) => {
    if (!filter.showCovered) {
      if (entry.coveredByFamily) return false;
      /*
       * A folded rung hides behind its line's next step for the same reason a
       * covered rung hides behind an owned one: it is not the thing to go and
       * do today. One carve-out, and it is deliberate: a search that singles
       * the rung out still finds it, because somebody typing "Seal of the
       * Family" is asking about that rung, and answering with nothing while
       * the toggle sits unchecked would make the page look like it lost the
       * item.
       *
       * "Singles out" is the operative phrase. The rung stays folded whenever
       * the query ALSO matches its next-step tile, because that tile is
       * already on screen answering for the line; without that condition a
       * family-wide query like "campfire" would unfold all twenty-nine
       * Campfire Badges at once, which is the exact wall of rungs the fold
       * exists to prevent.
       */
      if (entry.foldedBehind !== null) {
        if (filter.query === "") return false;
        if (!matchesQuery(entry, filter.query)) return false;
        const nextStep = byId.get(entry.foldedBehind);
        if (nextStep && matchesQuery(nextStep, filter.query)) return false;
      }
    }
    if (sources.length > 0 && !sources.includes(entry.source)) return false;
    if (filter.groups.length > 0 && !filter.groups.includes(entry.group)) return false;
    return matchesQuery(entry, filter.query);
  });
}

/**
 * How the page is laid out, which depends on whether we could read a bag.
 *
 * THIS IS THE HONESTY RULE, NOT A LAYOUT PREFERENCE.
 *
 * `status` on an entry is a claim about the player. When `ownedKnown` is false
 * we could not read the accessory bag, so every one of those claims is
 * unfounded, and sorting the catalogue into Missing / Owned would state a
 * result we did not compute. "We could not look" and "you have none" are
 * different answers, and rendering the first as the second is exactly the lie
 * this codebase refuses everywhere else.
 *
 * So the split simply does not happen. The page falls back to one ungrouped
 * catalogue, which still carries every source chip and every wiki link, and the
 * notice above it explains why there is no split. A visitor with no key gets a
 * complete, useful page; what they do not get is a fabricated verdict.
 */
export type Grouped =
  | { mode: "catalogue"; all: AccessoryView[]; rift: AccessoryView[] }
  | {
      mode: "reach";
      tiers: { tier: Attainability; entries: AccessoryView[] }[];
      owned: AccessoryView[];
      /**
       * The Rift band, rendered as two flat sections at the bottom ("Rift -
       * missing" and "Rift - owned") rather than one nested band with its own
       * split inside. Flat sections are what this shape already expresses:
       * everything in `Grouped` is a list the page hands to one
       * `AccessorySection` panel, and a band-with-a-split-inside would need a
       * new container component for exactly one use. Two more lists cost
       * nothing and read the same on screen.
       *
       * Not-owned covers missing AND locked here: a locked Rift accessory
       * still wears its lock glyph and blocking line on the tile, and giving
       * the Rift band its own locked section would slice 29 accessories three
       * ways.
       */
      riftMissing: AccessoryView[];
      riftOwned: AccessoryView[];
    };

/**
 * How the page is laid out once a bag has been read.
 *
 * ATTAINABILITY IS THE PRIMARY GROUPING, AND THAT IS THE POINT
 * ------------------------------------------------------------
 * The page used to split into Missing, Locked and Owned. That is a description
 * of state, and the page asks a different question: what can I get right
 * now, what can I grind towards to get soon, and what is long set out. So the
 * sections are the answer to that question, and Locked stops being a place
 * items go and becomes a property a tile carries (its blocking requirement is
 * still shown on it, wherever it sits).
 *
 * Owned still collapses to the bottom, unchanged: it is the one group nobody
 * opening this page is asking about.
 */
export function groupForDisplay(entries: readonly AccessoryView[], ownedKnown: boolean): Grouped {
  /*
   * The Rift split comes first in both shapes, because it is a property of the
   * ITEM rather than of the player: a Rift accessory works only inside the
   * Rift, grants no Magical Power out here, and mostly lives in the Rift's own
   * inventory rather than the bag, so listing it among the normal missing
   * accessories was pure clutter. Even the keyless catalogue
   * separates it, since "this one is a Rift accessory" needs no profile.
   */
  /*
   * RIFT-TRANSFERABLES APPEAR IN BOTH AREAS: a transferable accessory is
   * listed in the Rift area and outside it. The two flags ask
   * different questions and together give three honest cases:
   *
   *   rift, not transferable          the Rift area only, exactly as before
   *   rift AND transferable           both areas
   *   transferable, not rift-origin   its normal section, plus the Rift area
   *
   * This is DISPLAY duplication only: `entries` still carries each accessory
   * once, so every count, the Magical Power figure and the filters are
   * untouched. A section's own header states its own tally, which for the
   * Rift band now legitimately includes the transferables standing in both.
   */
  const inRiftArea = (e: AccessoryView) => e.rift || e.riftTransferable;
  const inNormalArea = (e: AccessoryView) => !e.rift || e.riftTransferable;

  if (!ownedKnown) {
    return {
      mode: "catalogue",
      all: entries.filter(inNormalArea),
      rift: entries.filter(inRiftArea),
    };
  }

  const owned: AccessoryView[] = [];
  const riftMissing: AccessoryView[] = [];
  const riftOwned: AccessoryView[] = [];
  const byTier = new Map<Attainability, AccessoryView[]>();
  for (const tier of ATTAINABILITY_ORDER) byTier.set(tier, []);

  for (const entry of entries) {
    if (inRiftArea(entry)) {
      (entry.status === "owned" ? riftOwned : riftMissing).push(entry);
    }
    if (inNormalArea(entry)) {
      if (entry.status === "owned") owned.push(entry);
      else byTier.get(entry.attainability)!.push(entry);
    }
  }

  // Empty tiers are dropped rather than rendered as empty headings.
  const tiers = ATTAINABILITY_ORDER.map((tier) => ({ tier, entries: byTier.get(tier)! })).filter(
    (t) => t.entries.length > 0
  );

  return { mode: "reach", tiers, owned, riftMissing, riftOwned };
}

/** Total across whichever shape came back, for "nothing matches" decisions. */
export function groupedTotal(grouped: Grouped): number {
  return grouped.mode === "catalogue"
    ? grouped.all.length + grouped.rift.length
    : grouped.tiers.reduce((n, t) => n + t.entries.length, 0) +
        grouped.owned.length +
        grouped.riftMissing.length +
        grouped.riftOwned.length;
}

/** Toggle one activity in the multi-select group filter. Same rule as sources. */
export function toggleGroup(
  current: readonly AccessoryGroup[],
  group: AccessoryGroup
): AccessoryGroup[] {
  return current.includes(group) ? current.filter((g) => g !== group) : [...current, group];
}

/**
 * Toggle one category in a multi-select source filter.
 *
 * Pure, because the alternative is a `setState` callback doing array surgery
 * inline, which is where off-by-one selection bugs live.
 */
export function toggleSource(
  selected: readonly SourceCategory[],
  source: SourceCategory
): SourceCategory[] {
  return selected.includes(source)
    ? selected.filter((s) => s !== source)
    : [...selected, source];
}
