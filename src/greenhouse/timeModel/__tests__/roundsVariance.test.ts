import { describe, it, expect } from "vitest";
import { estimateTime, expectedRounds, plantingOutcome } from "../model";
import { binomialAtLeast } from "../probability";
import type { DemandSpec, PlantingSpec } from "../types";

/**
 * The variance of the round count, checked against a different construction.
 *
 * `expectedRounds` computes both moments from survival identities:
 * E[R] as the sum of P(R > r), E[R2] as the sum of (2r + 1) P(R > r). This
 * test builds the same two numbers the long way instead - the pmf as
 * consecutive CDF differences, then plain pmf-weighted sums - so an algebra
 * slip in either identity fails against arithmetic that never used it.
 */

const SPEC: PlantingSpec = {
  id: "test",
  spots: 3,
  spawnChance: 0.35,
  inputStages: 2,
  mutationStages: 1,
  stageSeconds: 60,
  attemptsPerPlanting: 1,
  attemptIntervalSeconds: 60,
};

const DEMAND: DemandSpec = { need: 2, plots: 1 };

/** P(done within r rounds), the model's own exact CDF. */
const cdf = (r: number): number => binomialAtLeast(r * SPEC.spots, SPEC.spawnChance, DEMAND.need);

describe("expectedRounds variance", () => {
  it("matches the pmf-weighted mean and variance", () => {
    let mean = 0;
    let meanSquare = 0;
    let mass = 0;
    for (let r = 1; r <= 400; r++) {
      const pmf = cdf(r) - cdf(r - 1);
      mean += r * pmf;
      meanSquare += r * r * pmf;
      mass += pmf;
    }
    // The tail must be spent, or the comparison would be against a truncation.
    expect(mass).toBeGreaterThan(1 - 1e-9);

    const { rounds, variance, truncated } = expectedRounds(SPEC, DEMAND);
    expect(truncated).toBe(false);
    expect(rounds).toBeCloseTo(mean, 6);
    expect(variance).toBeCloseTo(meanSquare - mean * mean, 5);
  });

  it("scales into seconds by the square of the planting span", () => {
    const { variance } = expectedRounds(SPEC, DEMAND);
    const { plantingSeconds } = plantingOutcome(SPEC);
    const est = estimateTime(SPEC, DEMAND);
    expect(est.varianceSeconds2).toBeCloseTo(variance * plantingSeconds * plantingSeconds, 3);
  });

  it("reports no spread where there is no chance left to spread over", () => {
    expect(expectedRounds(SPEC, { need: 0, plots: 1 }).variance).toBe(0);
    expect(expectedRounds({ ...SPEC, spawnChance: 0 }, DEMAND).variance).toBe(0);
    // A sure thing with spots >= need finishes in exactly one round.
    const sure = expectedRounds({ ...SPEC, spawnChance: 1 }, DEMAND);
    expect(sure.rounds).toBeCloseTo(1, 9);
    expect(sure.variance).toBeCloseTo(0, 9);
  });
});
