import type { MutationGoal, SolveResponse } from "../types/greenhouse";
import type { SolverDataset } from "../solver";
import type { CacheableSolveOptions } from "./cacheKey";
import { solverDatasetFingerprint } from "./cacheKey";
import type { PrecomputeAsset } from "./precomputeProfile";
import {
  PRECOMPUTE_VERSION,
  decodeEntry,
  isPrecomputableRequest,
  precomputeCanonical,
  precomputeUnsetCanonical,
} from "./precomputeProfile";

/**
 * The layouts that shipped with the app.
 *
 * The planner's opening move is a burst of forty single-mutation solves, one
 * per mutation, each on a bare 10x10. Those answers depend on nothing but the
 * dataset, so they are the same for every visitor and they cost around
 * twenty-three seconds of solver time to work out. `tools/build-solver-precompute.mjs`
 * works them out once and commits the result; this file is the half that decides
 * whether that result may be used.
 *
 * ---------------------------------------------------------------------------
 * The whole difficulty
 * ---------------------------------------------------------------------------
 *
 * The dataset the app solves against is NOT the file the precompute was built
 * from. It is that file with a wiki overlay on top, refreshed in the background
 * and shared across tabs (see `data/wikiSync.ts`). The overlay can change a
 * mutation's size and its requirements, and a layout built for the old
 * requirements is not merely out of date against the new ones - it is illegal.
 * The player builds it and nothing spawns.
 *
 * A precompute is therefore only ever served when BOTH of these hold:
 *
 *   1. the caller's canonical request string is byte-identical to the one the
 *      build script filed the entry under. Not "looks like the same shape" -
 *      the same string, produced by the same `canonicalRequest` function, which
 *      is why `precomputeProfile.ts` is shared code rather than a convention
 *
 *   2. `solverDatasetFingerprint` of the live dataset equals the fingerprint
 *      stamped into the file. That fingerprint covers exactly the fields the
 *      solver reads, so a wiki edit to a rarity does not throw the precompute
 *      away and a wiki edit to a requirement certainly does
 *
 * Anything else - a missing file, a version bump, a malformed entry, a
 * fingerprint that has moved - reads as "no precompute" and the solver earns
 * the answer live. There is no path here that degrades into a guess.
 */

/** What a successful load leaves behind. */
interface PrecomputeTable {
  fingerprint: string;
  /** Canonical request string to the layout that answers it. */
  byRequest: Map<string, SolveResponse>;
}

/**
 * Warn about a given problem once per page life, and only where a developer
 * will see it.
 *
 * A visitor gains nothing from being told the precompute did not apply: they
 * get the right answer either way, a second or two later. A developer who has
 * just edited the dataset and forgotten to regenerate the asset needs to be
 * told immediately, because the symptom otherwise is "the app got slower" with
 * no explanation attached.
 */
const warned = new Set<string>();
const warnOnce = (key: string, message: string): void => {
  if (!import.meta.env.DEV) return;
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[greenhouse precompute] ${message}`);
};

/**
 * Turn the shipped file into a lookup, or refuse it.
 *
 * Every field is checked rather than cast. This is a build artefact and should
 * always be well formed, but "should always be" is how a cast becomes a crash
 * in a browser three releases later, and the fallback costs a solve.
 */
const buildTable = (asset: PrecomputeAsset): PrecomputeTable | null => {
  if (asset.version !== PRECOMPUTE_VERSION) {
    warnOnce(
      "version",
      `asset is version ${asset.version}, this build reads version ${PRECOMPUTE_VERSION}. Solving live.`
    );
    return null;
  }
  if (
    typeof asset.fingerprint !== "string" ||
    !Array.isArray(asset.crops) ||
    !Array.isArray(asset.sizes) ||
    !Array.isArray(asset.entries)
  ) {
    warnOnce("shape", "asset is malformed. Solving live.");
    return null;
  }

  const byRequest = new Map<string, SolveResponse>();
  for (const entry of asset.entries) {
    if (!entry || typeof entry.mutation !== "string" || typeof entry.pruned !== "boolean") continue;
    if (!Array.isArray(entry.spawns) || !Array.isArray(entry.plants)) continue;

    const response = decodeEntry(entry, asset.crops, asset.sizes);
    byRequest.set(precomputeCanonical(entry.mutation, entry.pruned), response);

    /*
     * The unpruned entry answers two keys.
     *
     * `solveLocal` reads the flag once, as `if (options.removeUnusedCrops)`, so
     * an unset flag and an explicit `false` take the identical branch and have
     * the identical answer. The cache key keeps them apart because it refuses
     * to assume the core's defaults, which is the right call for a key and no
     * reason to solve the same plot twice. The calculator page is the caller
     * that leaves it unset.
     */
    if (!entry.pruned) byRequest.set(precomputeUnsetCanonical(entry.mutation), response);
  }

  if (byRequest.size === 0) {
    warnOnce("empty", "asset decoded to no usable entries. Solving live.");
    return null;
  }

  return { fingerprint: asset.fingerprint, byRequest };
};

/**
 * Memoised, including the failure.
 *
 * A browser that could not fetch the chunk will not fetch it again on the next
 * solve: the promise is kept either way, so the cost of a missing asset is one
 * failed request per page life rather than one per solve.
 */
let table: Promise<PrecomputeTable | null> | null = null;

const loadTable = (): Promise<PrecomputeTable | null> => {
  table ??= import("../data/solverPrecompute.json")
    .then((module) => buildTable((module.default ?? module) as unknown as PrecomputeAsset))
    .catch((error: unknown) => {
      warnOnce("load", `could not load the asset (${String(error)}). Solving live.`);
      return null;
    });
  return table;
};

/**
 * A precomputed answer to this exact request, or null.
 *
 * `isPrecomputableRequest` is checked by the CALLER before this is awaited, so
 * that a request which obviously cannot hit - a partial plot, a multi-target
 * solve, anything with locks - never pays for downloading the chunk at all. It
 * is re-checked here anyway, because this function has to be safe to call on
 * its own and the check is three comparisons.
 */
export const precomputedSolve = async (
  cells: [number, number][],
  targets: MutationGoal[],
  canonical: string,
  dataset: SolverDataset,
  options: CacheableSolveOptions = {}
): Promise<SolveResponse | null> => {
  if (!isPrecomputableRequest(cells, targets, options)) return null;

  const loaded = await loadTable();
  if (!loaded) return null;

  const response = loaded.byRequest.get(canonical);
  if (!response) return null;

  /*
   * The dataset moved, so this layout is not an answer to anything.
   *
   * Checked AFTER the lookup rather than before, so the warning can name the
   * case that was lost. It is one string comparison either way.
   */
  const live = solverDatasetFingerprint(dataset);
  if (live !== loaded.fingerprint) {
    warnOnce(
      "fingerprint",
      `dataset fingerprint is ${live} but the asset was built from ${loaded.fingerprint}. ` +
        `Solving live. Regenerate with: node tools/build-solver-precompute.mjs`
    );
    return null;
  }

  return response;
};

/** Drop the memoised load. Test seam; never called by the app. */
export const resetPrecompute = (): void => {
  table = null;
  warned.clear();
};
