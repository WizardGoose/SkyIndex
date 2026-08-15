import { useEffect, useMemo, useState } from "react";
import { load as loadPlanner, type TargetKind } from "../greenhouse/planner/usePlannerState";
import { normalise } from "./normalise";
import type { SearchEntry } from "./types";

/**
 * The thing you are currently grinding towards, as a search row.
 *
 * The Planner already knows this and has known it for as long as the grind has
 * been going, so the search box asks it rather than inventing a second place to
 * say what you are working on. That is the whole design: this module READS the
 * planner's key through the planner's own `load()` and never writes a byte.
 * There is no `setItem`, no `removeItem` and no storage key literal anywhere in
 * this file, so no amount of searching can cost anybody their target.
 *
 * WHY IT RESOLVES AGAINST THE INDEX RATHER THAN BUILDING ITS OWN ROW
 * ------------------------------------------------------------------
 * The brief asks for the pinned suggestion to have the same row shape as a
 * result: icon, name in its rarity colour, destination badge. The cheapest way
 * to guarantee "the same" is for it to BE one. So the target id is looked up in
 * the search index and the row that comes back is the row the search would have
 * shown you anyway, with one field changed: the hint says whose it is.
 *
 * There is a fallback for the case where the index has not landed yet or the
 * target is not in the catalogue, because a pin that appears a second late is
 * worse than a plain one that is right immediately. It carries no rarity, on
 * purpose: a guessed tier is worse than no tier, which is the rule `rarity.ts`
 * already sets for the rest of the search.
 */

interface PinTarget {
  id: string;
  kind: TargetKind;
  /** The planner's own display name for it, when the last plan recorded one. */
  label: string | null;
}

const ASSET_BASE = import.meta.env.BASE_URL;

/**
 * The first target on the plan.
 *
 * First, not "all of them": this is one pinned row in an eight row dropdown,
 * and the Planner is one Enter away for the rest. The planner's target list is
 * ordered by when they were added, so the first is the one the grind is built
 * around.
 */
const readTarget = (): PinTarget | null => {
  try {
    const state = loadPlanner();
    const first = state.targets[0];
    if (!first || typeof first.id !== "string" || !first.id) return null;
    const label = state.snapshot?.names?.[first.id];
    return {
      id: first.id,
      kind: first.kind === "mutation" ? "mutation" : "item",
      label: typeof label === "string" && label ? label : null,
    };
  } catch {
    // A planner blob this build cannot read is not an error worth showing in a
    // search box. There is simply no pin.
    return null;
  }
};

/** `rose_dragon_pet` -> `Rose Dragon Pet`. Only ever a fallback name. */
const prettify = (id: string): string =>
  id
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

/**
 * The keys the index would have filed this target under.
 *
 * Mutations and plannable targets are both `greenhouse:` rows built by
 * `buildSearchIndex`, and an item target can also survive the merge as an
 * `items:` row when nothing more specific claimed the name. All three are
 * tried, most specific first.
 */
const candidateKeys = (target: PinTarget): string[] =>
  target.kind === "mutation"
    ? [`greenhouse:${target.id}`]
    : [`greenhouse:target:${target.id}`, `items:${target.id}`];

const fallbackEntry = (target: PinTarget, hint: string): SearchEntry => {
  const name = target.label ?? prettify(target.id);
  return {
    key: `pin:${target.kind}:${target.id}`,
    name,
    destination: "greenhouse",
    href: `/greenhouse#planner?target=${encodeURIComponent(target.id)}`,
    // No tier. We do not know it here and a wrong rarity is worse than none.
    rarity: null,
    iconName: name,
    ...(target.kind === "mutation"
      ? { iconSrc: `${ASSET_BASE}greenhouse/crops/${target.id}.png` }
      : { iconId: target.id }),
    hint,
    weight: 0,
    needle: normalise(name),
    aliases: "",
  };
};

/** The row for a target, from the index when it is there and built when it is not. */
export const resolvePin = (index: SearchEntry[], target: PinTarget | null, hint: string): SearchEntry | null => {
  if (!target) return null;

  const wanted = candidateKeys(target);
  for (const key of wanted) {
    const found = index.find((e) => e.key === key);
    if (found) return { ...found, hint };
  }

  return fallbackEntry(target, hint);
};

/**
 * The pinned row, re-read whenever the field is focused.
 *
 * `active` is the input's focus, and it is the read trigger on purpose. The pin
 * only has to be correct at the moment the dropdown opens, and tying the read
 * to that costs one `getItem` per focus instead of a subscription to a store
 * this module is not allowed to own. Changing the target on the Planner and
 * coming back to the search box therefore shows the new one, with no listener
 * and no write path.
 */
export const usePinnedTarget = (index: SearchEntry[], active: boolean, hint: string): SearchEntry | null => {
  const [target, setTarget] = useState<PinTarget | null>(readTarget);

  useEffect(() => {
    if (!active) return;
    setTarget((prev) => {
      const next = readTarget();
      // Identity is what `useMemo` below keys off, so an unchanged target must
      // keep the object it already had or every focus rebuilds the row.
      if (prev?.id === next?.id && prev?.kind === next?.kind && prev?.label === next?.label) return prev;
      return next;
    });
  }, [active]);

  return useMemo(() => resolvePin(index, target, hint), [index, target, hint]);
};
