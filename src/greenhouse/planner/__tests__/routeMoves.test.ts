import { describe, expect, it } from "vitest";
import { routeMoves } from "../routeMoves.ts";
import type { PlanEstimates } from "../planEstimates.ts";
import type { SolverPlan, SolverPlanNode } from "../solverPlan.ts";

/**
 * The clock on THE LINE was wrong twice before it was right, and both times
 * the mismatch was visible against the header: first it re-derived
 * parallel-per-cycle math the estimate model already owns (wrong for a
 * one-plot player), then it summed FULL cycle times and re-billed plantings
 * already ticked off. The rule both bugs converge on: the line's clock is the
 * estimate model's own expectedSecondsLeft figures, accumulated in cycle
 * order, and nothing else. These fixtures pin that rule.
 */

const node = (id: string, extra: Partial<SolverPlanNode> = {}): SolverPlanNode =>
  ({
    id,
    name: id,
    kind: "mutation",
    need: 1,
    have: 0,
    ...extra,
  }) as SolverPlanNode;

const plan = {
  cycles: [
    { index: 1, produce: [node("choconut"), node("dustgrain", { covered: true })] },
    { index: 2, produce: [node("gloomgourd")] },
  ],
  baseCrops: [],
  placed: [],
  manual: [],
  unknown: [],
  pending: [],
  totalPlantings: 3,
  depth: 2,
} as unknown as SolverPlan;

const estimates = {
  byId: {
    choconut: { expectedSeconds: 1000, expectedSecondsLeft: 600 },
    gloomgourd: { expectedSeconds: 500, expectedSecondsLeft: 500 },
  },
  cycles: [
    { index: 1, expectedSeconds: 1000, p90Seconds: 0, expectedSecondsLeft: 600, p90SecondsLeft: 0 },
    { index: 2, expectedSeconds: 500, p90Seconds: 0, expectedSecondsLeft: 500, p90SecondsLeft: 0 },
  ],
  total: {
    expectedSeconds: 1500,
    p90Seconds: 0,
    expectedSecondsLeft: 1100,
    p90SecondsLeft: 0,
    deterministicSeconds: 0,
  },
} as unknown as PlanEstimates;

describe("routeMoves", () => {
  const moves = routeMoves(plan, estimates, {}, {});

  it("keeps covered moves in the line, numbered, at zero time", () => {
    // Hiding a covered move would break the "what do I physically do next"
    // reading; billing it would re-count spent stock as future work.
    expect(moves.map((m) => m.node.id)).toEqual(["choconut", "dustgrain", "gloomgourd"]);
    expect(moves.map((m) => m.number)).toEqual([1, 2, 3]);
    expect(moves[1].expectedSeconds).toBe(0);
  });

  it("advances the clock by the cycle's OWN expectedSecondsLeft, not full time", () => {
    // 600 (cycle 1 LEFT, not its 1000 full), then +500 for cycle 2. Both
    // moves inside cycle 1 carry the same clock: the cycle is one wait.
    expect(moves[0].clockSeconds).toBe(600);
    expect(moves[1].clockSeconds).toBe(600);
    expect(moves[2].clockSeconds).toBe(1100);
  });

  it("agrees with the header total by construction", () => {
    // Same field, same accumulation: the last move's clock IS the header's
    // TIME LEFT. Two clocks on one page must not be able to disagree.
    expect(moves[moves.length - 1].clockSeconds).toBe(estimates.total.expectedSecondsLeft);
  });

  it("reports NaN, never a number, for a move the model has no estimate for", () => {
    const missing = {
      ...plan,
      cycles: [{ index: 1, produce: [node("mystery")] }],
    } as unknown as SolverPlan;
    const out = routeMoves(missing, { ...estimates, cycles: [] }, {}, {});
    // NaN renders as "time unknown"; inventing 0 rendered as "instant", which
    // was one of the two lies on the original refused-target cards.
    expect(Number.isNaN(out[0].expectedSeconds)).toBe(true);
  });
});
