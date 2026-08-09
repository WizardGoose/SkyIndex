/**
 * The greenhouse solver, as the rest of the app should see it.
 *
 * One import for the whole layer: `runSolve` takes a grid, some targets and a
 * dataset, and hands back a layout. Whether that came from memory, from
 * localStorage, from a worker or from this very thread is not the caller's
 * problem, and the answer is the same in all four cases.
 *
 * The pieces are exported individually as well, because the cache and the key
 * canonicalisation are worth testing and worth reusing on their own.
 */

export { runSolve, terminateSolverWorker, solverClient, createSolverClient } from "./solverClient";
export type {
  RunSolveRequest,
  SolverClient,
  SolverClientOptions,
  LocalSolveFn,
  PrecomputeLookup,
} from "./solverClient";

export { solverCache, createSolverCache, CACHE_KEY, STALE_KEYS } from "./cache";
export type { SolverCache, SolverCacheOptions, CacheEntry, NarrowStorage } from "./cache";

export {
  canonicalRequest,
  requestKey,
  hashString,
  datasetFingerprint,
  solverRelevantDataset,
  solverDatasetFingerprint,
} from "./cacheKey";
export type {
  CacheableSolveOptions,
  SolverRelevantDataset,
  SolverRelevantMutation,
} from "./cacheKey";

export { precomputedSolve, resetPrecompute } from "./precompute";
export {
  FULL_PLOT,
  PRECOMPUTE_VARIANTS,
  PRECOMPUTE_VERSION,
  decodeEntry,
  isPrecomputableRequest,
  precomputeCanonical,
  precomputeUnsetCanonical,
} from "./precomputeProfile";
export type { PrecomputeAsset, PrecomputeEntry } from "./precomputeProfile";

export type { SolveRequestMessage, WorkerOutboundMessage } from "./protocol";
