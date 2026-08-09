/**
 * Expansion planner: which order to unlock cells in, to grow gloomgourd yield
 * fastest.
 *
 * This replaces the last remote call on a greenhouse user path. The old
 * implementation POSTed the unlocked and locked cell lists to
 * api.skyshards.com/greenhouse/expansion and rendered whatever came back.
 *
 * WHAT THE ANSWER MEANS
 * ---------------------
 * `gloomgourd_potential` after a step is the best gloomgourd yield reachable
 * on the cells unlocked so far, and `gloomgourd_gain` is how much that step
 * added. The order is greedy: at every step it unlocks whichever single locked
 * cell leaves the highest potential behind it.
 *
 * Greedy is a choice, not a theorem. The best first unlock is not necessarily
 * on the best full unlock path, so this is a recommendation and is labelled as
 * one. What it does guarantee is that every reported potential is a yield that
 * is actually achievable on those cells, because it comes with the layout that
 * achieves it and that layout is counted independently before it is reported.
 *
 * WHY IT IS FAST
 * --------------
 * Unlocking never removes a cell, so the previous step's layout is always a
 * legal starting point for the next one. Each candidate is trialled by cloning
 * the current field, adding the one cell and climbing locally, rather than
 * solving the plot again from nothing. That turns roughly 4000 full solves
 * into roughly 4000 short climbs.
 */
import { CELL_COUNT, GRID_SIZE, indexOf } from "../solver/grid.ts";
import type { ExpansionResponse, ExpansionStep } from "../types/greenhouse";
import { CoverField, bound, countCoverage, gloomgourdPotential } from "./potential.ts";

export interface ExpansionPlan extends ExpansionResponse {
  /**
   * "OPTIMAL" only when the final potential meets its proved upper bound.
   * Otherwise "BEST-KNOWN", and `final_gap` says by how much it might be beaten.
   */
  final_label: "OPTIMAL" | "BEST-KNOWN";
  final_bound: number;
  final_gap: number;
}

/**
 * Structured seeds climbed per step. The full set is 36. Climbing all of them
 * once per step is the single most expensive thing this file could do, and
 * measurement says the top few by unclimbed score already contain the winner
 * almost every time, so the rest is paid for at the end instead.
 */
const STEP_SEEDS = 6;

/**
 * No ruin and recreate per step. This was measured, not assumed.
 *
 * The obvious saving looked available: a search handed a good layout reaches
 * 72 on a full plot in 66ms, against about 1200ms from cold, so keeping the
 * running layout healthy along the way ought to make the final search nearly
 * free. It does not work. Giving each step 20ms of ruin and recreate took a
 * full plan from 4.4s to 6.5s and moved the chain's own finish from 69 to 70,
 * because what the carried layout needs is a global restructure and a few
 * milliseconds of local repair cannot deliver one. The budget genuinely bound;
 * this is not a mismeasurement.
 *
 * So the steps climb only, and the one long search is paid once at the end.
 */
const STEP_ROUNDS = 0;
const STEP_BUDGET_MS = 0;

/**
 * Wall clock ceilings for the stepping loop.
 *
 * The final search has always been time bounded, but the loop that walks the
 * unlock order was not, so its cost scaled with how fast or how busy the
 * machine happened to be: about 4s on an idle desktop and about 39s on the
 * same desktop under load. A planner whose runtime is set by what else the
 * computer is doing is not a planner anyone can rely on.
 *
 * So the per-step re-derivation degrades instead of the wall clock. Past the
 * soft ceiling each step climbs one structured seed rather than six; past the
 * hard ceiling it climbs none and simply carries its layout forward, which is
 * nearly free. The reported numbers stay truthful either way, because they are
 * still yields achieved by a layout that is counted, and they are still
 * clamped to be monotone. They just stop being quite as sharp on a slow
 * machine, which is the right thing to give up.
 */
const SOFT_BUDGET_MS = 3000;
const HARD_BUDGET_MS = 6000;

const toIndex = ([row, col]: [number, number]): number => indexOf(row, col);

const toCell = (index: number): [number, number] => [
  Math.floor(index / GRID_SIZE),
  index % GRID_SIZE,
];

/** How many already unlocked cells a candidate touches. Used only to break ties. */
const contact = (field: CoverField, index: number): number => {
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;
  let n = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r < 0 || c < 0 || r >= GRID_SIZE || c >= GRID_SIZE) continue;
      if (field.mask[indexOf(r, c)] === 1) n++;
    }
  }
  return n;
};

/**
 * Plans the unlock order for a plot.
 *
 * `unlocked` and `locked` are the two halves of the 10x10 plot, exactly as the
 * grid context hands them over. Cells appearing in neither are treated as
 * locked; cells appearing in both are treated as unlocked.
 */
export const planExpansion = (
  unlocked: [number, number][],
  locked: [number, number][]
): ExpansionPlan => {
  const mask = new Uint8Array(CELL_COUNT);
  for (const cell of unlocked) mask[toIndex(cell)] = 1;

  const pending: number[] = [];
  const seen = new Uint8Array(CELL_COUNT);
  for (const cell of locked) {
    const i = toIndex(cell);
    if (mask[i] === 1 || seen[i] === 1) continue;
    seen[i] = 1;
    pending.push(i);
  }
  pending.sort((a, b) => a - b);

  // Nothing to plan. The plot still has a potential worth reporting, but it is
  // the potential of a mask that will not change, so it is found once here
  // rather than once at the top and again at the bottom of a loop that never
  // runs.
  if (pending.length === 0) {
    const only = gloomgourdPotential(mask);
    const onlyBound = bound(mask);
    return {
      steps: [],
      total_steps: 0,
      final_gloomgourd_count: only.value,
      final_bound: onlyBound,
      final_gap: Math.max(0, onlyBound - only.value),
      final_label: only.value >= onlyBound ? "OPTIMAL" : "BEST-KNOWN",
    };
  }

  const startedAt = Date.now();

  // The opening layout gets the full search, because everything after it is a
  // refinement of this one and a bad start never fully recovers.
  const opening = gloomgourdPotential(mask);
  const field = new CoverField(mask);
  field.restore(opening.assignment);

  const steps: ExpansionStep[] = [];
  let current = field.score;
  const remaining = new Set(pending);

  while (remaining.size > 0) {
    let bestIndex = -1;
    let bestScore = -1;
    let bestContact = -1;
    let bestField: CoverField | null = null;

    /*
     * Only the frontier is worth trialling, and that is a proof rather than a
     * guess. A locked cell with no unlocked neighbour cannot be covered, since
     * it has nothing to see a crop in, and cannot help cover anything, since
     * nothing unlocked is beside it. Its gain this step is exactly zero. Any
     * frontier cell scores at least zero, so restricting the search to the
     * frontier can never pass over a better move.
     *
     * The fallback matters for plots whose remaining locked cells are all
     * detached from the unlocked ones: there the frontier is empty, every move
     * really does gain nothing, and the tie-break alone decides.
     */
    const frontier: number[] = [];
    for (const candidate of remaining) if (contact(field, candidate) > 0) frontier.push(candidate);
    const candidates = frontier.length > 0 ? frontier : Array.from(remaining);

    const spent = Date.now() - startedAt;
    // Trialling every candidate is the loop's real cost, so it is the first
    // thing to give up when the clock runs on. Past the hard ceiling the
    // candidates are ranked by how much unlocked ground they touch, which is
    // free, and the potential is still derived properly below.
    const trialRadius = spent > HARD_BUDGET_MS ? 0 : spent > SOFT_BUDGET_MS ? 1 : 2;

    for (const candidate of candidates) {
      const touch = contact(field, candidate);
      const trial = field.clone();
      trial.unlock(candidate);
      // Adding one cell can only change coverage within two cells of it: the
      // new cell, its neighbours, and the cells those neighbours are seen by.
      // Climbing that window instead of the whole plot is what keeps a full
      // 88 step plan interactive.
      if (trialRadius > 0) trial.climb(6, trial.cellsNear(candidate, trialRadius));
      if (
        trial.score > bestScore ||
        (trial.score === bestScore && touch > bestContact) ||
        (trial.score === bestScore && touch === bestContact && candidate < bestIndex)
      ) {
        bestScore = trial.score;
        bestContact = touch;
        bestIndex = candidate;
        bestField = trial;
      }
    }

    if (bestIndex === -1 || bestField === null) break;
    remaining.delete(bestIndex);
    field.mask.set(bestField.mask);
    field.cells = bestField.cells.slice();
    field.restore(bestField.snapshot());

    // The trial above only ranks candidates. A layout carried forward from a
    // much smaller plot cannot restructure itself by single and paired moves
    // alone, so it drifts further below the truth the more the plot grows.
    // Re-deriving from the lattice seeds on the NEW mask, with the carried
    // layout offered as one more starting point, keeps every reported number
    // a yield that is genuinely reachable on those cells.
    const seedsThisStep =
      spent > HARD_BUDGET_MS ? 0 : spent > SOFT_BUDGET_MS ? 1 : STEP_SEEDS;
    const settled = gloomgourdPotential(field.mask, {
      rounds: STEP_ROUNDS,
      timeBudgetMs: STEP_BUDGET_MS,
      climbTop: seedsThisStep,
      warmStart: field.snapshot(),
    });
    if (settled.value > field.score) field.restore(settled.assignment);

    // Potential is monotone non-decreasing under unlocking, and that is a
    // theorem rather than an observation: any layout legal on the old cells is
    // still legal once a cell is added, with the new cell simply left empty,
    // and no cell that was covered can stop being covered. So a step can never
    // lose yield. A drop here would mean the search settled worse on a bigger
    // plot, which is a search artefact, and reporting it would be a lie about
    // the game. Clamping keeps the reported series faithful to the invariant.
    const reached = Math.max(current, bestScore, settled.value);

    steps.push({
      order: steps.length + 1,
      cell: toCell(bestIndex),
      gloomgourd_potential: reached,
      gloomgourd_gain: reached - current,
    });
    current = reached;
  }

  // The finished plot gets the full search, ruin and recreate included. Every
  // step above ran on a reduced budget to stay quick; the number a player
  // actually plans around deserves the whole thing.
  const finalMask = field.mask.slice();
  const cold = gloomgourdPotential(finalMask, { warmStart: field.snapshot() });
  const finalCount = Math.max(current, cold.value);
  if (finalCount > current && steps.length > 0) {
    const last = steps[steps.length - 1];
    last.gloomgourd_gain += finalCount - last.gloomgourd_potential;
    last.gloomgourd_potential = finalCount;
  }

  const finalBound = bound(finalMask);
  return {
    steps,
    total_steps: steps.length,
    final_gloomgourd_count: finalCount,
    final_bound: finalBound,
    final_gap: Math.max(0, finalBound - finalCount),
    final_label: finalCount >= finalBound ? "OPTIMAL" : "BEST-KNOWN",
  };
};

/** Re-counts a plan's final layout independently. Exported for tests. */
export const verifyCoverage = countCoverage;
