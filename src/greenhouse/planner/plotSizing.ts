import { atLeastOnce, binomialAtLeast, spawnChance, type ChanceOptions } from "../timeModel";
import type { MutationDefinition } from "../types/greenhouse";
import type { SolverPlan } from "./solverPlan";

/**
 * How big a plot the job actually needs.
 *
 * THE REPORT THIS COMES FROM. The recipe wanted 2 Soggybud. The plan said sow
 * Gloomgourd x23 and Melon x23 for a 51 spawn plot, and 23 of those Gloomgourd
 * are themselves a mutation with a plot of their own. That is not a plan for
 * getting two of something, it is a week of farming quoted at a player who
 * asked for a pair.
 *
 * The cause was that every plot was solved the same way, `maximize`, whatever
 * the demand was. Maximize is the right question for 2,624 Choconut and the
 * wrong one for 2 Soggybud, and nothing was asking which case it was in.
 *
 * ## This is not a new policy, it is the layout catching up
 *
 * The counts layer has always been honest about this. `planEstimates` caps a
 * row's contribution at `min(need, perPlot)` and `buildSolverPlan` takes
 * `ceil(need / perPlot)` plantings, so the arithmetic already knew that a need
 * of 2 does not consume a 51 spawn plot. Only the LAYOUT kept quoting the full
 * bill. This module is what makes the two agree.
 *
 * ## The margin, and where it comes from
 *
 * Nothing is invented here. A spot is a Bernoulli trial at the mutation's own
 * spawn chance, which is exactly what the time model already says, so sizing a
 * plot is asking the same question that model answers:
 *
 *   q = 1 - (1 - p)^W        a spot delivers at least once in W cycles
 *   S  = smallest spot count with P(Binomial(S, q) >= need) >= confidence
 *
 * Both functions are the time model's own (`atLeastOnce`, `binomialAtLeast`),
 * so a plot is sized by the same distribution its estimate is priced by. There
 * is no second probability model in this codebase and this does not introduce
 * one.
 *
 * ## Why a confidence rather than an expectation
 *
 * Sizing to the EXPECTED yield, `S = need / q`, is a coin flip by construction:
 * expectation is the middle of the distribution, so half the time the plot comes
 * up short and the whole planting is repeated. Sizing to a confidence says how
 * often that is allowed to happen, and 90% puts it at roughly one sowing in ten.
 *
 * ## What this does NOT do
 *
 * It does not touch the estimate. Once the plot is sized the time model prices
 * the plot that actually exists, spot count and all, so a smaller plot honestly
 * reports the longer expected wait it buys. Sizing is a policy about what to
 * sow; the estimate remains a measurement of what that costs. Keeping those
 * apart is what stops a cheaper bill from quietly reading as a faster grind.
 */

/**
 * Cycles the sizing assumes you leave a planting standing.
 *
 * A POLICY CONSTANT, not a derived one, and deliberately not the estimate's own
 * chosen harvest window. That window is computed FROM the spot count, so
 * feeding it back in to choose the spot count would be circular. Two cycles is
 * the modest end of what the model routinely picks and it keeps the plot small
 * without assuming the player babysits it.
 */
export const SIZING_WINDOW = 2;

/**
 * How often the sized plot must cover the need in one sowing.
 *
 * The trade this number IS: lower means a smaller bill and more re-sowing,
 * higher means a bigger bill and fewer surprises. At 0.9 roughly one planting
 * in ten comes up short, and the time model already prices that tail, so the
 * headline estimate stays honest either way.
 */
export const SIZING_CONFIDENCE = 0.9;

/**
 * Which tradeoff the player is making, because it IS a tradeoff and it is theirs.
 *
 * THE CORRECTION THIS ENCODES. The first cut sized every plot for 90% within
 * two cycles, and for two Soggybud that demanded eight spots. Eight spots for
 * a need of two is the wrong default, and the reason is a cited mechanic
 * rather than a preference. Input crops are NOT consumed when a mutation
 * spawns, so a spot that comes up empty rolls again next cycle off the same
 * sowing. A shortfall therefore costs WAITING and never replanting.
 *
 * Which means the 90% policy was never buying insurance against wasted crops.
 * It was buying wall clock, with the player's crops and placement effort, a
 * trade the player never asked for. So:
 *
 *   MINIMAL     one spot per unit wanted. The cheapest plot that can hold the
 *               job, and the default. Slower, and the breakdown says by how
 *               much rather than leaving it to be discovered.
 *
 *   CONFIDENT   the 90% sizing, kept intact and offered to anyone who would
 *               rather spend crops than days.
 *
 * Neither is more correct. The bug was the site picking one silently.
 */
export type SizingMode = "minimal" | "confident";

export const DEFAULT_SIZING_MODE: SizingMode = "minimal";

/**
 * The mode for a plan, or the mode for each row of it.
 *
 * PER ROW, because the choice is per row. A player who wants their two Soggybud
 * sooner is saying something about Soggybud, not about the eleven tiers under
 * it, and a control that sat beside one row while quietly resizing all of them
 * would be the same silent picking this whole change exists to undo.
 *
 * A plain mode is still accepted, and is what the CLI hands over: one flag, the
 * whole plan, which is the right shape for a reference run.
 */
export type SizingModeFor = SizingMode | ((id: string) => SizingMode);

const modeOf = (mode: SizingModeFor, id: string): SizingMode => (typeof mode === "function" ? mode(id) : mode);

export interface PlotSizing {
  /** Spawn spots to solve for. */
  spots: number;
  /** True when the answer is "solve the whole plot", the original behaviour. */
  maximize: boolean;
  /** Chance the sized plot covers the need in one sowing. 0 when maximizing. */
  confidence: number;
}

/**
 * The spot count to solve for, given what is actually needed.
 *
 * `fullYield` is what a maximized plot of this mutation delivers, which is the
 * answer the planner already has in hand from its first pass. It is both the
 * ceiling and the fallback: a need at or above it wants the whole plot, and so
 * does anything this cannot size honestly.
 *
 * Returns `maximize` rather than a spot count in those cases, so the caller
 * asks the solver the same question it always asked and nothing about large
 * plans changes.
 */
export const sizePlot = (
  need: number,
  spawnChance: number,
  fullYield: number,
  mode: SizingMode = DEFAULT_SIZING_MODE
): PlotSizing => {
  const full: PlotSizing = { spots: Math.max(0, fullYield), maximize: true, confidence: 0 };

  if (!Number.isFinite(need) || need <= 0) return full;
  if (!Number.isFinite(fullYield) || fullYield <= 0) return full;

  /*
   * A whole plot or more of demand. Sizing has nothing to offer and the answer
   * the planner already has is the right one, so this is where every large
   * plan leaves: same solve, same layout, same numbers as before.
   */
  if (need >= fullYield) return full;

  /*
   * Never fewer spots than units wanted. A spot holds one mutation until it is
   * harvested, so `need` spots is the floor whatever the chance says, and that
   * floor is also what keeps `ceil(need / spots)` at exactly one planting.
   *
   * Under MINIMAL it is not just the floor, it is the answer. The plot cannot
   * be smaller and still hold the job, and every spot past it is bought with
   * crops and placement effort to buy back wall clock.
   */
  const floor = Math.ceil(need);

  /*
   * No spawn roll to reason about. Mechanic-only mutations do not spawn by
   * chance at all, so there is no distribution to size against and guessing
   * one would be inventing the very maths this module refuses to invent.
   * MINIMAL still holds, because it needs no distribution: one spot per unit is
   * true whatever the chance is.
   */
  const rollable = Number.isFinite(spawnChance) && spawnChance > 0;

  if (mode === "minimal") {
    return { spots: floor, maximize: false, confidence: rollable ? binomialAtLeast(floor, atLeastOnce(spawnChance, SIZING_WINDOW), need) : 0 };
  }

  if (!rollable) return full;

  const q = atLeastOnce(spawnChance, SIZING_WINDOW);
  if (q <= 0) return full;

  for (let spots = floor; spots <= fullYield; spots++) {
    const confidence = binomialAtLeast(spots, q, need);
    if (confidence >= SIZING_CONFIDENCE) return { spots, maximize: false, confidence };
  }

  // Even the whole plot cannot reach the confidence, so the whole plot it is.
  return full;
};

/**
 * The spot count to solve every row of a plan for.
 *
 * Ids absent from the result want the maximized plot they already have, so an
 * empty map means "nothing to re-solve" and a plan of large demands produces
 * exactly that.
 *
 * `fullYields` is the MAXIMIZE answer per mutation and is the ceiling every
 * size is measured against. It is deliberately not read back out of the plan's
 * own economies, because once a row has been right-sized its economy IS the
 * small one, and sizing the next round against that would ratchet the plot
 * downwards on every pass until it vanished. Holding the ceiling fixed is what
 * makes the refinement converge instead of run away.
 */
export const sizingFor = (
  plan: SolverPlan,
  mutations: Record<string, MutationDefinition>,
  fullYields: Record<string, number>,
  /**
   * The same chance options the estimate runs on. A player holding a
   * Bioanalysis Artifact really does need fewer spots for the same confidence,
   * and sizing against a chance the estimate does not use would put the layout
   * and the clock back out of step, which is the whole defect being fixed.
   */
  chance: ChanceOptions = {},
  mode: SizingModeFor = DEFAULT_SIZING_MODE
): Record<string, number> => {
  const out: Record<string, number> = {};

  for (const cycle of plan.cycles) {
    for (const node of cycle.produce) {
      const mutation = mutations[node.id];
      const full = fullYields[node.id];
      if (!mutation || !Number.isFinite(full) || full <= 0) continue;

      // A covered row is never sown, so there is no plot to size.
      if (node.covered || node.need <= 0) continue;

      /*
       * The row's own mode. A tier left on MINIMAL under a tier switched to
       * CONFIDENT is sized minimally against the larger demand that tier now
       * makes, which is the cascade still doing its job: the choice changes
       * what a row owes, not how the row below it answers.
       */
      const sizing = sizePlot(node.need, spawnChance(node.id, mutation.requirements ?? [], chance), full, modeOf(mode, node.id));
      if (!sizing.maximize) out[node.id] = sizing.spots;
    }
  }

  return out;
};

/**
 * How many times sizing is allowed to feed back into itself.
 *
 * ONE ROUND IS NOT ENOUGH, and the reason is worth writing down. Right-sizing a
 * plot shrinks what it sows, which shrinks the demand on the tier below it, so
 * the tier below was sized against a need that no longer exists. Measured on
 * a real plan: one round sized Soggybud correctly at 5 spots but left
 * Gloomgourd at 54, because Gloomgourd had been sized against the 23 a FULL
 * Soggybud plot would have eaten rather than the 4 the real one does.
 *
 * Each round settles one more tier, so a plan of depth d is exact after d
 * rounds. Four covers every chain in the dataset bar the deepest, costs nothing
 * when the sizing stops moving (the loop exits on `sameSizing`), and is a hard
 * ceiling rather than a hope, so neither the page nor the terminal can spin.
 *
 * SHARED BY BOTH CALLERS on purpose. `useSolverEconomies` and
 * `tools/solver-plan.ts` import this same constant, because a terminal that
 * refined further than the page would print a plan the page never shows.
 */
export const SIZING_ROUNDS = 4;

/** Whether two sizing maps ask for the same solves. The refinement's stop test. */
export const sameSizing = (a: Record<string, number>, b: Record<string, number>): boolean => {
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((k) => a[k] === b[k]);
};
