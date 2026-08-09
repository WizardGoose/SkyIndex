import type { SolverPlanNode } from "./solverPlan";

/**
 * Showing the discount instead of silently applying it.
 *
 * The planner already takes what you own off the plan, in one place, where
 * demand becomes plantings:
 *
 *   need = wanted - min(owned, wanted)
 *
 * The trouble was never the arithmetic, it was the presentation. A row that
 * used to read "2,624 needed" and now reads "2,379 needed" has quietly changed
 * what the word "needed" means, and the only person who can spot that is
 * someone who memorised the old number. A reader who did exactly that
 * reasonably concluded the discount was broken, because
 * nothing on screen said a discount had happened at all.
 *
 * So the row shows its working: what the plan asked for, what you had, and what
 * is left. A number that changed meaning is worse than no discount, and a
 * number that shows its working cannot change meaning behind your back.
 *
 * Recovering the raw figure is exact rather than approximate. For any row still
 * in the plan, `need > 0`, which means `owned < wanted`, which means
 * `min(owned, wanted)` was `owned` - so `wanted` is precisely `need + owned`. A
 * row where you owned enough is dropped from the plan entirely and never
 * reaches here.
 */
export interface NeedSplit {
  /** What the plan asked for before your stock was applied. */
  raw: number;
  /**
   * How much of your stock this bill consumed.
   *
   * The same as what you own in every ordinary case. It differs only when you
   * own more than the bill, where quoting your whole holding would print
   * arithmetic that does not add up ("962 needed - 2,000 owned = 0 left").
   */
  owned: number;
  /** What you still have to obtain. This is the number you act on. */
  remaining: number;
  /** Whether a discount was actually applied, and so whether to show the split. */
  discounted: boolean;
  /** Your stock covers the whole bill and there is nothing left to get. */
  covered: boolean;
}

const finite = (n: number | undefined): number => (typeof n === "number" && Number.isFinite(n) ? Math.max(0, n) : 0);

export const needSplit = (node: Pick<SolverPlanNode, "need" | "have"> & { rawNeed?: number }): NeedSplit => {
  const remaining = finite(node.need);
  const stock = finite(node.have);

  /*
   * Prefer the figure recorded at the point of subtraction. Falling back to
   * `remaining + stock` keeps any node built before `rawNeed` existed working,
   * but that reconstruction is only valid while some demand is outstanding: a
   * row your stock fully covers has `remaining` 0 and a `stock` that may
   * overshoot, so there is nothing honest to reconstruct and the split stays
   * off rather than inventing a total.
   */
  const recorded = finite(node.rawNeed);
  const raw = recorded >= remaining && node.rawNeed !== undefined ? recorded : stock > 0 && remaining > 0 ? remaining + stock : remaining;

  const owned = raw - remaining;

  return { raw, owned, remaining, discounted: owned > 0, covered: owned > 0 && remaining === 0 };
};
