import type { MutationGoal } from "../types/greenhouse";
// Extension included deliberately, matching the rest of `solver/`: this module
// is imported by tools/*.mjs through Node's type stripping, and Node resolves
// ESM specifiers literally.

/**
 * How a greenhouse question is phrased, in one place.
 *
 * Every caller that asks the solver something builds its request here. That is
 * not tidiness, it is the fix for a bug that shipped:
 *
 *   the Planner showed Soggybud 46 while the economies table showed 51, for the
 *   same mutation on the same full grid
 *
 * and for a second one that was live in our own tooling at the same time:
 *
 *   tools/solver-parity.mjs graded gloomgourd, choconut, dustgrain, scourroot,
 *   shadevine and veilshroom at 71 and called them FAILURES, while
 *   tools/fixtures/greenhouse-economies.json and the shipped precompute both
 *   recorded 72 for the identical question
 *
 * The second one had a single cause: the harness passed `seed: 20260802`, a
 * date-stamped constant, while every shipping path leaves the seed unset and so
 * gets `DEFAULTS.seed` (0x5eed_1234) from `solveLocal`. Measured directly, with
 * nothing else changed:
 *
 *   mutation      shipped seed   seed 20260802
 *   gloomgourd              72              71
 *   choconut                72              71
 *   dustgrain               72              71
 *   scourroot               72              71
 *   shadevine               72              71
 *   veilshroom              72              71
 *
 * So six of the eleven recorded failures were never a solver result at all,
 * they were a measurement of a configuration nobody runs. A harness that grades
 * something other than what ships is worse than no harness, because it spends
 * real effort chasing losses that do not exist.
 *
 * The rule this module exists to enforce is therefore narrow and absolute:
 *
 *   ONE question shape, and NO tuning on any path a player or a grader can
 *   reach. Seed, iteration count and time budget stay unset so that
 *   `solveLocal`'s DEFAULTS are the only tuning in the product, and changing
 *   them is a deliberate edit to one place rather than an accident in six.
 *
 * Tests may still tune, and should: pinning behaviour across seeds is how the
 * fragility above stays visible. `isShippedConfiguration` below is the line
 * between the two, and a test asserts every builder here stays on the shipped
 * side of it.
 */

/**
 * All 100 cells of a full greenhouse plot.
 *
 * Four separate copies of this literal existed before, one of which
 * (`generateFullGrid` in MutationRequirementGrid) was built by a different
 * function entirely. They agreed, but only by luck: nothing checked, and the
 * cache and precompute both key on the exact cell list, so a copy that drifted
 * would have silently stopped hitting rather than loudly broken.
 */
export const FULL_PLOT: [number, number][] = Array.from({ length: 100 }, (_, i) => [
  Math.floor(i / 10),
  i % 10,
]) as [number, number][];

/**
 * One target, phrased the one way.
 *
 * `spots` left undefined means MAXIMIZE, which is the question the planner's
 * economics, the solved-layout preview and the precompute all ask. Passing a
 * count switches to TARGET mode, which is a genuinely different question with a
 * genuinely different answer: a plan for two Soggybud used to quote the bill
 * for fifty one because the count was available and simply never used.
 *
 * `count: null` rather than omitted on the maximize side is load bearing. The
 * cache key canonicalises the goal object, so an omitted field and an explicit
 * null are different strings and would miss each other in the cache.
 */
export const solveGoal = (mutation: string, spots?: number): MutationGoal => ({
  mutation,
  maximize: spots === undefined,
  count: spots ?? null,
});

/** The same phrasing for a multi-target solve. */
export const solveGoals = (mutations: string[], spots?: number): MutationGoal[] =>
  mutations.map((mutation) => solveGoal(mutation, spots));

/**
 * What a requirement grid asks: "show me one".
 *
 * Deliberately its own name rather than a bare `solveGoal(id, 1)` at the call
 * site. The requirement grid is answering "what do I have to plant to get this
 * mutation at all", which is a minimum, not a plot to farm. Naming it stops the
 * next reader from filing it as a Planner call that forgot to maximize.
 */
export const requirementGoal = (mutation: string): MutationGoal => solveGoal(mutation, 1);

/**
 * The options every shipping caller passes, and nothing else.
 *
 * `removeUnusedCrops` is the only answer-bearing option that legitimately
 * varies, and it varies by INTENT rather than by tuning: a caller that costs a
 * plot wants surplus stripped, a caller that only counts spawns does not care.
 * It does not change the spawn count either way, because pruning only drops
 * crops that no placed spawn needs, so it can never move a yield number.
 *
 * Everything that WOULD move a yield number is absent by construction. There is
 * no parameter here to pass a seed through, which is the point: the divergence
 * this module was written for could not have happened if there had been no way
 * to spell it.
 */
export const shippedSolveOptions = (removeUnusedCrops = false): { removeUnusedCrops: boolean } => ({
  removeUnusedCrops,
});

/** Options that would move a yield number if set. */
const TUNING_KEYS = ["seed", "iterations", "timeBudgetMs"] as const;

/**
 * Is this the configuration we actually ship?
 *
 * True when no tuning key is set, so `solveLocal`'s DEFAULTS decide the search.
 * The parity harness asserts this of its own request before it grades anything,
 * so the harness cannot drift back into measuring a solver nobody runs without
 * failing loudly first.
 */
export const isShippedConfiguration = (options: Record<string, unknown> = {}): boolean =>
  TUNING_KEYS.every((key) => options[key] === undefined);

/**
 * The tuning keys that are set, for an error message worth reading.
 *
 * Returns an empty array for a shipped configuration.
 */
export const tuningKeysSet = (options: Record<string, unknown> = {}): string[] =>
  TUNING_KEYS.filter((key) => options[key] !== undefined);
