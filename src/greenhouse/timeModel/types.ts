/**
 * The data contract between the planner and the time model.
 *
 * Deliberately plain numbers. Nothing here imports app code, fetches anything,
 * or knows what a React component is - the planner measures the world and
 * hands the model the measurements. That is what makes the model testable
 * against fixtures instead of against a running app.
 */

/** How a mutation behaves on one packed plot. */
export interface PlantingSpec {
  /** Mutation id, only used for reporting. */
  id: string;

  /**
   * Valid spawn spots on one packed plot.
   *
   * This is the solver's `economy.yield` - the number of empty cells whose
   * neighbours satisfy the mutation's spreading conditions. The old model
   * treated this as the harvest. Here it is the number of independent coin
   * flips a planting buys.
   */
  spots: number;

  /**
   * Per-spot, per-attempt spawn probability in [0, 1].
   *
   * See `spawnChance.ts` - derived from the mutation's weight and the fraction
   * of its spreading conditions that are actual crops.
   */
  spawnChance: number;

  /** Growth stages the slowest required input crop needs before it counts. */
  inputStages: number;

  /** Growth stages the mutation itself needs after it spawns. */
  mutationStages: number;

  /**
   * Seconds per growth stage on this plot.
   *
   * Comes from the existing, wiki-verified stage formula in
   * `planner/time.ts`. Passed in rather than recomputed so there is exactly
   * one implementation of it in the codebase.
   */
  stageSeconds: number;

  /**
   * How many spawn rolls one planting gives a single spot before the crops
   * are gone and the plot has to be sown again.
   *
   * ASSUMED. See `constants.ts` - the roll cadence is not stated by any
   * source we found. `1` reproduces the old deterministic model exactly.
   */
  attemptsPerPlanting: number;

  /**
   * Seconds between consecutive spawn rolls on a spot.
   *
   * ASSUMED, same caveat. Only affects how much dead time a failed planting
   * costs; with `attemptsPerPlanting = 1` it is never read.
   */
  attemptIntervalSeconds: number;
}

/** What the planner wants: this many of this mutation. */
export interface DemandSpec {
  /** Units of the mutation still needed. */
  need: number;
  /** Plots sown in parallel each round. 1 to 3. */
  plots: number;
}

/** One planting's economics, before demand is considered. */
export interface PlantingOutcome {
  /** Probability a given spot yields the mutation during one planting. */
  perSpotSuccess: number;
  /** Expected mutations harvested from one planting. */
  expectedYield: number;
  /** Wall-clock seconds one planting occupies a plot. */
  plantingSeconds: number;
  /**
   * Expected mutations per plot-hour. Useful for ranking layouts, and the
   * number that collapses hardest when the honest chance is applied.
   */
  yieldPerHour: number;
}

/** A full answer for one mutation and one demand. */
export interface TimeEstimate {
  id: string;
  /** Units demanded. */
  need: number;
  /** Expected mutations from a single planting. */
  expectedYieldPerPlanting: number;
  /** Probability one spot delivers during one planting. */
  perSpotSuccess: number;
  /** Seconds one planting occupies a plot. */
  plantingSeconds: number;

  /** Expected number of plantings, counting every plot sown. */
  expectedPlantings: number;
  /** Expected sequential rounds, where a round is `plots` plantings at once. */
  expectedRounds: number;
  /** Expected wall-clock seconds. */
  expectedSeconds: number;
  /**
   * Variance of the wall-clock seconds, in seconds squared.
   *
   * Carried so a SUM of rows can state a real joint quantile. Row times are
   * independent, independent variances add, and the plan's "90% within" is
   * built from the summed variance rather than from summed per-row p90s;
   * the latter prices every row running unlucky at once, which is not a 90%
   * figure for anything.
   */
  varianceSeconds2: number;

  /** Rounds by percentile of the yield distribution. */
  p50Rounds: number;
  p90Rounds: number;
  /** Wall-clock seconds at those percentiles. */
  p50Seconds: number;
  p90Seconds: number;

  /** What the old deterministic model would have said, for comparison. */
  deterministicPlantings: number;
  deterministicSeconds: number;

  /** True when the estimate hit its iteration ceiling and is a lower bound. */
  truncated: boolean;
}
