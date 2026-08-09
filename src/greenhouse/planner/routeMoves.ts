import type { PlotEconomy, SolverPlan, SolverPlanNode } from "./solverPlan.ts";
import type { PlanEstimates } from "./planEstimates.ts";

/**
 * The line's data model, kept apart from the component so it can be tested
 * without React (and so the component file exports only components, which is
 * what keeps fast refresh working).
 */

export interface RouteMove {
  node: SolverPlanNode;
  cycleIndex: number;
  /** 1-based move number across the whole line, covered moves included. */
  number: number;
  /** Spot count the board should be solved at; undefined means maximize. */
  spots: number | undefined;
  /** Expected seconds for this move, 0 for covered moves. */
  expectedSeconds: number;
  /** Running clock after this move completes, cycle times summed in order. */
  clockSeconds: number;
}

/**
 * Flattens the plan into ordered moves and runs the cumulative clock.
 */
export const routeMoves = (
  plan: SolverPlan,
  estimates: PlanEstimates,
  economies: Record<string, PlotEconomy | null>,
  fullYields: Record<string, number>
): RouteMove[] => {
  const moves: RouteMove[] = [];
  let clock = 0;
  let number = 0;
  for (const cycle of plan.cycles) {
    /*
     * The clock advances by the estimate model's OWN cycle figure, never by
     * arithmetic re-derived here. The first version summed "the slowest move
     * of the cycle" as though moves run in parallel - but a player with one
     * plot runs them in sequence, and how many plots there are is exactly the
     * kind of thing the model already accounts for and a display must not
     * second-guess. One clock on the page (the disagreement was visible in use).
     */
    const cycleRow = estimates.cycles.find((c) => c.index === cycle.index);
    /*
     * LEFT, not full: the line is the road ahead from where the player stands,
     * so plantings already ticked off must not be re-billed (the second clock
     * bug: with 10 of 73 plantings done, full-time summing overstated
     * the future). The header's TIME LEFT uses the same field, so the two
     * cannot drift.
     */
    clock += cycleRow?.expectedSecondsLeft ?? 0;
    for (const node of cycle.produce) {
      number++;
      const est = node.covered ? null : estimates.byId[node.id];
      const used = economies[node.id]?.yield;
      const full = fullYields[node.id];
      const spots = used !== undefined && full !== undefined && used < full ? used : undefined;
      moves.push({
        node,
        cycleIndex: cycle.index,
        number,
        spots: node.covered ? undefined : spots,
        expectedSeconds: node.covered ? 0 : (est?.expectedSecondsLeft ?? Number.NaN),
        clockSeconds: clock,
      });
    }
  }
  return moves;
};
