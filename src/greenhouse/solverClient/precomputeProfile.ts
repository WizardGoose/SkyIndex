import type { CropPlacement, MutationGoal, MutationResult, SolveResponse } from "../types/greenhouse";
import type { CacheableSolveOptions } from "./cacheKey.ts";
// Extension included deliberately, matching `solver/`: this module is imported
// by tools/build-solver-precompute.mjs through Node's type stripping, and Node
// resolves ESM specifiers literally. `allowImportingTsExtensions` is on and
// Vite is happy either way, so the extension costs nothing and is what lets one
// copy of the canonical form serve both the build and the browser.
import { canonicalRequest } from "./cacheKey.ts";

/**
 * The contract between the build script and the browser.
 *
 * Two halves live here: WHICH requests a shipped precompute may answer, and
 * WHAT the shipped file looks like. Both halves are shared code rather than a
 * written-down agreement, because `tools/build-solver-precompute.mjs` runs in
 * Node months before the browser reads what it wrote, and a documented format
 * is a format that drifts. The build script imports this module and round-trips
 * every entry through `decodeEntry` before writing, so an encoding the runtime
 * could not read is a build failure rather than a silent miss.
 *
 * The one question a shipped precompute is allowed to answer.
 *
 * A precomputed layout is a cache entry that was written by a build machine
 * instead of by this browser, so it is bound by the same rule every other cache
 * entry is bound by: it may only be served to a request that is IDENTICAL to
 * the one it was computed for. This module is where "identical" is defined, and
 * it is defined once so that `tools/build-solver-precompute.mjs` and the runtime
 * lookup cannot possibly disagree about it - they call the same functions.
 *
 * The profile is narrow on purpose:
 *
 *   the whole plot      all 100 cells. A player who has locked cells is asking a
 *                       different question with a different answer
 *   exactly one target  a multi-target solve is a joint optimisation, not the
 *                       union of two single ones
 *   maximize            "as many as possible", never "exactly n of these"
 *   no locks            a pinned crop or a reserved spawn reshapes the search
 *   no priorities       inert on a single target, but keyed anyway, because
 *                       "inert" is an argument and a key is a fact
 *   no tuning           seed, iterations and time budget all unset
 *
 * Nothing here is load bearing for CORRECTNESS on its own. The authoritative
 * check is that the caller's canonical request string equals the canonical
 * string this module generated for the entry, exactly as `cache.get` re-checks
 * its own stored request. `isPrecomputableRequest` exists so that a request
 * which obviously cannot hit never pays for loading the asset at all.
 */

/**
 * All 100 cells. `canonicalRequest` sorts, so the order here is presentational.
 *
 * Re-exported from the solver's request builder rather than rebuilt. A
 * precompute entry is filed under the canonical string of the exact cell list
 * it was solved for, so this constant and the one the browser sends have to be
 * the same object's worth of cells or every lookup quietly misses.
 */
export { FULL_PLOT } from "../solver/request.ts";
import { FULL_PLOT, solveGoal } from "../solver/request.ts";

/**
 * The two option sets that get their own solve.
 *
 * `removeUnusedCrops` is the only answer-bearing option that varies across the
 * app's full-plot single-target calls: the planner's economics pass asks for a
 * pruned layout so it can cost a plot by what it really plants, and the solved
 * layout preview does not.
 *
 * A third canonical key - the option left UNSET, which is what the calculator
 * page sends - is served from the `false` entry rather than solved again. That
 * is sound rather than convenient: `solveLocal` reads the flag exactly once, as
 * `if (options.removeUnusedCrops) pruneUnusedCrops(...)`, so unset and false
 * take the identical branch. They are keyed apart because the cache key
 * deliberately refuses to assume a core default, not because the answers differ.
 */
export const PRECOMPUTE_VARIANTS = [true, false] as const;

/**
 * The precompute answers exactly the maximize question, phrased the one way.
 *
 * Delegates rather than restating the object literal: the goal is part of the
 * cache key, so "maximize with a null count" has to mean the same characters
 * here as it does at every call site.
 */
export const precomputeGoal = (mutation: string): MutationGoal => solveGoal(mutation);

export const precomputeOptions = (removeUnusedCrops: boolean): CacheableSolveOptions => ({
  removeUnusedCrops,
});

/** The canonical request string an entry is filed under. */
export const precomputeCanonical = (mutation: string, removeUnusedCrops: boolean): string =>
  canonicalRequest(FULL_PLOT, [precomputeGoal(mutation)], precomputeOptions(removeUnusedCrops));

/**
 * The extra key that shares the unpruned entry. See `PRECOMPUTE_VARIANTS`.
 *
 * Built by calling `canonicalRequest` with no options at all, so it tracks
 * whatever `UNSET` happens to be rather than restating it.
 */
export const precomputeUnsetCanonical = (mutation: string): string =>
  canonicalRequest(FULL_PLOT, [precomputeGoal(mutation)]);

/**
 * Could this request possibly be in the shipped set?
 *
 * A fast, conservative "no". Every branch below is a reason the precompute
 * definitely does not apply; passing them all only earns the request a lookup,
 * never an answer.
 */
export const isPrecomputableRequest = (
  cells: [number, number][],
  targets: MutationGoal[],
  options: CacheableSolveOptions = {}
): boolean => {
  if (cells.length !== 100) return false;
  if (targets.length !== 1) return false;

  const [target] = targets;
  if (!target.maximize) return false;
  if (target.count !== null && target.count !== undefined) return false;

  if (options.seed !== undefined) return false;
  if (options.iterations !== undefined) return false;
  if (options.timeBudgetMs !== undefined) return false;
  if (options.locks !== undefined && options.locks.length > 0) return false;
  /*
   * Priorities are NOT rejected. This profile is single-target only, and a
   * priority provably cannot change a single-target answer, so `canonicalRequest`
   * normalises it away and a request carrying one still matches the shipped
   * entry. Rejecting it here is what kept the solver page off the precompute.
   */

  return true;
};

// ---------------------------------------------------------------------------
// The shipped file
// ---------------------------------------------------------------------------

/**
 * Bumped whenever the encoding below changes shape.
 *
 * A browser holding a cached copy of an older chunk simply refuses it and
 * solves live, which is why this is a number the reader checks rather than a
 * migration the reader performs.
 */
export const PRECOMPUTE_VERSION = 2;

/**
 * One solved plot, flattened.
 *
 * Coordinates are packed into flat number arrays rather than `{position: [r,c]}`
 * objects for two reasons that both matter at this size. It roughly halves the
 * file - 40 mutations times 2 variants times up to 100 spawns and 70 plants is a
 * lot of repeated key names - and it keeps `tsc` cheap, because TypeScript
 * infers a JSON array of numbers as `number[]` while it infers an array of
 * objects key by key.
 *
 * A single-target maximize solve is uniform in exactly the two ways this relies
 * on, and the build script asserts both rather than trusting them: every spawn
 * is the requested mutation at the dataset's size for it, and every placement's
 * size is the dataset's size for that crop. (Version 1 assumed all placements
 * were 1x1; that stopped being true when support crops like snoozling started
 * being planted as real 3x3 blocks, so placement size now rides in the id
 * table's parallel `sizes` array.)
 */
export interface PrecomputeEntry {
  mutation: string;
  /** Whether this entry was solved with `removeUnusedCrops`. */
  pruned: boolean;
  status: string;
  approach: string;
  /** `total_cells_used`, carried rather than recomputed so the response is verbatim. */
  cellsUsed: number;
  /** Block size of the spawned mutation. */
  size: number;
  /** Flat row, col pairs. */
  spawns: number[];
  /** Flat cropIndex, row, col triples, indexing into `crops`. */
  plants: number[];
}

export interface PrecomputeAsset {
  version: number;
  generatedAt: string;
  /** `solverDatasetFingerprint` of the dataset every entry was solved against. */
  fingerprint: string;
  /**
   * Plantable id table, indexed by `PrecomputeEntry.plants`. Covers every
   * base crop AND every mutation, because mutations (snoozling, noctilume,
   * plantboy_advance) are planted as supports by other mutations' layouts.
   */
  crops: string[];
  /** Block size per id, parallel to `crops` (1 for every base crop). */
  sizes: number[];
  entries: PrecomputeEntry[];
}

/** Rebuild the exact `SolveResponse` the solver returned at build time. */
export const decodeEntry = (entry: PrecomputeEntry, crops: string[], sizes: number[]): SolveResponse => {
  const placements: CropPlacement[] = [];
  for (let i = 0; i + 2 < entry.plants.length; i += 3) {
    placements.push({
      crop: crops[entry.plants[i]],
      position: [entry.plants[i + 1], entry.plants[i + 2]],
      size: sizes[entry.plants[i]] ?? 1,
    });
  }

  const mutations: MutationResult[] = [];
  for (let i = 0; i + 1 < entry.spawns.length; i += 2) {
    mutations.push({
      mutation: entry.mutation,
      position: [entry.spawns[i], entry.spawns[i + 1]],
      size: entry.size,
    });
  }

  return {
    status: entry.status,
    total_cells_used: entry.cellsUsed,
    placements,
    mutations,
    solver_approach: entry.approach,
  };
};
