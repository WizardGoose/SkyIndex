import type { JobProgress, MutationGoal, SolveResponse } from "../types/greenhouse";
import type { SolverDataset } from "../solver";
import type { SolveRequestMessage, WorkerOutboundMessage } from "./protocol";
import type { CacheableSolveOptions } from "./cacheKey";
import { canonicalRequest, datasetFingerprint, hashString } from "./cacheKey";
import type { SolverCache } from "./cache";
import { solverCache } from "./cache";
import { isPrecomputableRequest } from "./precomputeProfile";
import { precomputedSolve } from "./precompute";

/**
 * Running the greenhouse solver in the browser.
 *
 * This replaces a round trip to a third party server. That server did three
 * things worth keeping: it kept the work off the UI thread, it reported
 * progress while it ran, and it could be cancelled. A plain function call would
 * give up all three, so this layer gives them back locally.
 *
 *   off thread     a module worker, created on first use and reused after
 *   progress       the core's `onProgress` reshaped into the `JobProgress` the
 *                  existing `SolverProgress` component already renders
 *   cancellation   the same `AbortSignal` callers already pass to the remote path
 *   instant repeat a memory and localStorage cache in front of all of it
 *
 * The fallback is not an afterthought. Anywhere without `Worker` - server side
 * rendering, the node test environment, an old browser - runs the identical
 * solve synchronously on the calling thread and returns the identical result.
 * The only difference a caller can observe is that an abort cannot interrupt a
 * synchronous solve already underway, so it is honoured the moment it finishes.
 */

/** The core's own signature, mirrored so this module can hold one without importing it. */
export type LocalSolveFn = (
  cells: [number, number][],
  targets: MutationGoal[],
  dataset: SolverDataset,
  options?: CacheableSolveOptions & { onProgress?: (best: number, elapsedMs: number) => void }
) => SolveResponse;

export interface RunSolveRequest {
  cells: [number, number][];
  targets: MutationGoal[];
  dataset: SolverDataset;
  options?: CacheableSolveOptions;
  signal?: AbortSignal;
  onProgress?: (progress: JobProgress) => void;
  /** Solve fresh and do not record the answer. For a deliberate "solve it again". */
  bypassCache?: boolean;
}

/**
 * The shape `SolverProgress` already renders.
 *
 * Reusing `JobProgress` rather than inventing a local type is what lets the
 * existing component carry straight over from the remote path. The core reports
 * only a best objective and an elapsed time, so the fields it cannot speak to
 * are honestly null rather than filled with a plausible looking number. The
 * component already treats a null percentage as "no bar", and a live preview of
 * the layout is something the remote solver could produce and this one cannot.
 */
const toJobProgress = (
  best: number,
  elapsedMs: number,
  solutionsFound: number,
  timeBudgetMs: number | undefined
): JobProgress => ({
  phase: "Solving",
  // Only claim a percentage when there is a budget to measure against.
  // Elapsed time alone says nothing about how close the search is to done.
  percentage:
    timeBudgetMs !== undefined && timeBudgetMs > 0
      ? Math.min(100, (elapsedMs / timeBudgetMs) * 100)
      : null,
  solutions_found: solutionsFound,
  best_objective: best,
  best_bound: null,
  current_activity: `Best so far: ${best}`,
  elapsed_seconds: elapsedMs / 1000,
  preview_placements: null,
  preview_mutations: null,
  preview_cells_used: null,
});

/**
 * The rejection an aborted solve produces.
 *
 * `signal.reason` first, because that is what `fetch` rejects with and callers
 * of the remote path are already written against it: a `DOMException` named
 * "AbortError". The fallback is for signals from environments that do not
 * populate `reason`, and keeps the name identical so nobody has to branch.
 */
const abortReason = (signal: AbortSignal): unknown => {
  const reason: unknown = (signal as { reason?: unknown }).reason;
  if (reason !== undefined) return reason;
  const err = new Error("Greenhouse solve aborted");
  err.name = "AbortError";
  return err;
};

interface PendingRequest {
  resolve: (response: SolveResponse) => void;
  reject: (reason: unknown) => void;
  onProgress?: (progress: JobProgress) => void;
  timeBudgetMs: number | undefined;
  solutionsFound: number;
  /** Detaches the abort listener. Always called exactly once, however the request ends. */
  dispose: () => void;
}

/**
 * The shipped-layout lookup, in the shape the client consumes it.
 *
 * Mirrored here rather than imported as a type so a test can hand over its own
 * table without reaching for the real asset - the same reason `loadSolver` and
 * `createWorker` are injectable.
 */
export type PrecomputeLookup = (
  cells: [number, number][],
  targets: MutationGoal[],
  canonical: string,
  dataset: SolverDataset,
  options?: CacheableSolveOptions
) => Promise<SolveResponse | null>;

export interface SolverClientOptions {
  cache?: SolverCache;
  /** Injected by tests. Production lazily imports the real core. */
  loadSolver?: () => Promise<LocalSolveFn>;
  /** Injected by tests, and the switch that forces the main thread path. */
  createWorker?: () => Worker | null;
  /** Injected by tests. Production consults the layouts that shipped with the build. */
  precompute?: PrecomputeLookup;
}

export interface SolverClient {
  runSolve(request: RunSolveRequest): Promise<SolveResponse>;
  /** Shut the worker down. Safe at any time; the next solve makes a new one. */
  terminate(): void;
  /** True when a worker is currently alive. Test and diagnostic seam. */
  isWorkerRunning(): boolean;
}

const defaultCreateWorker = (): Worker | null => {
  if (typeof Worker === "undefined") return null;
  try {
    // The house pattern, matching `services/workerCalculationService.ts`. The
    // URL form is what lets Vite find, bundle and fingerprint the worker.
    return new Worker(new URL("./solver.worker.ts", import.meta.url), { type: "module" });
  } catch {
    /*
     * Some environments expose `Worker` but refuse to build a module one, and a
     * few block workers outright. There is a perfectly good synchronous path
     * available, so this is a reason to take it rather than to fail.
     */
    return null;
  }
};

export const createSolverClient = (options: SolverClientOptions = {}): SolverClient => {
  const cache = options.cache ?? solverCache;
  const createWorker = options.createWorker ?? defaultCreateWorker;
  const precompute = options.precompute ?? precomputedSolve;
  const loadSolver =
    options.loadSolver ?? (() => import("./solverCore").then((m) => m.loadSolverCore()));

  let worker: Worker | null = null;
  /** Latched once a worker has proved unavailable, so we stop retrying every solve. */
  let workerUnavailable = false;
  let nextId = 0;
  const pending = new Map<number, PendingRequest>();

  let fallbackSolve: Promise<LocalSolveFn> | null = null;
  const solverFn = (): Promise<LocalSolveFn> => {
    // Memoised, so a page that falls back does not re-import per solve.
    fallbackSolve ??= loadSolver();
    return fallbackSolve;
  };

  const destroyWorker = () => {
    if (!worker) return;
    worker.terminate();
    worker = null;
  };

  /**
   * The worker died, or handed back something unreadable.
   *
   * Every request in flight was being served by it, so every one of them is
   * lost. Rejecting them all is the only honest answer; leaving them pending
   * would spin the UI forever. The next call builds a fresh worker.
   */
  const failAll = (message: string) => {
    const inFlight = [...pending.values()];
    pending.clear();
    destroyWorker();
    for (const request of inFlight) {
      request.dispose();
      request.reject(new Error(message));
    }
  };

  const ensureWorker = (): Worker | null => {
    if (worker) return worker;
    if (workerUnavailable) return null;

    const created = createWorker();
    if (!created) {
      workerUnavailable = true;
      return null;
    }

    created.onmessage = (event: MessageEvent<WorkerOutboundMessage>) => {
      const msg = event.data;
      if (!msg || !("type" in msg)) return;

      const request = pending.get(msg.id);
      /*
       * No entry means this request was aborted while the worker was still
       * busy with it. Its result is now nobody's business. This is the check
       * that keeps an abandoned solve from resolving a promise that already
       * rejected, and from driving progress into a spinner that has moved on.
       */
      if (!request) return;

      if (msg.type === "progress") {
        request.solutionsFound += 1;
        request.onProgress?.(
          toJobProgress(msg.best, msg.elapsedMs, request.solutionsFound, request.timeBudgetMs)
        );
        return;
      }

      pending.delete(msg.id);
      request.dispose();
      if (msg.type === "result") request.resolve(msg.response);
      else request.reject(new Error(msg.message || "Greenhouse solve failed"));
    };

    created.onerror = () => failAll("Greenhouse solver worker failed");
    created.onmessageerror = () => failAll("Greenhouse solver worker sent an unreadable message");

    worker = created;
    return worker;
  };

  const solveInWorker = (
    activeWorker: Worker,
    request: RunSolveRequest
  ): Promise<SolveResponse> => {
    const id = ++nextId;
    const { signal } = request;

    return new Promise<SolveResponse>((resolve, reject) => {
      let onAbort: (() => void) | undefined;

      const dispose = () => {
        if (onAbort && signal) signal.removeEventListener("abort", onAbort);
        onAbort = undefined;
      };

      pending.set(id, {
        resolve,
        reject,
        onProgress: request.onProgress,
        timeBudgetMs: request.options?.timeBudgetMs,
        solutionsFound: 0,
        dispose,
      });

      if (signal) {
        onAbort = () => {
          // Forget it first: any message this solve still produces is now
          // unroutable and will be dropped by the handler above.
          pending.delete(id);
          dispose();

          /*
           * Actually stop the work when it is safe to.
           *
           * The core is synchronous, so a worker part way through a solve
           * cannot read a cancel message - terminating is the only thing that
           * frees the core. It is also the only thing that unblocks the queue,
           * since a single worker serves requests one at a time and an
           * abandoned solve would otherwise delay the next one.
           *
           * Only when nothing else is in flight. Other callers are still
           * waiting on this worker and killing it would reject work nobody
           * asked to cancel.
           */
          if (pending.size === 0) destroyWorker();

          reject(abortReason(signal));
        };
        signal.addEventListener("abort", onAbort);
      }

      const message: SolveRequestMessage = {
        type: "solve",
        id,
        cells: request.cells,
        targets: request.targets,
        dataset: request.dataset,
        options: request.options ?? {},
      };

      try {
        activeWorker.postMessage(message);
      } catch (err: unknown) {
        // A dataset that will not clone, or a worker already torn down.
        pending.delete(id);
        dispose();
        reject(err instanceof Error ? err : new Error("Could not start the greenhouse solve"));
      }
    });
  };

  /**
   * The same solve, on this thread.
   *
   * Resolves even when the signal has already fired, and leaves the abort
   * decision to `runSolve`. That is deliberate: the answer is finished and
   * correct, so it is worth recording in the cache before the promise rejects.
   * An abort that happens to land during a solve should not cost the next
   * caller a second of work for a result we are holding.
   */
  const solveOnMainThread = async (request: RunSolveRequest): Promise<SolveResponse> => {
    const solve = await solverFn();
    let solutionsFound = 0;
    const timeBudgetMs = request.options?.timeBudgetMs;

    return solve(request.cells, request.targets, request.dataset, {
      ...(request.options ?? {}),
      onProgress: (best, elapsedMs) => {
        // A signal that has already fired means nobody is watching the spinner.
        if (request.signal?.aborted) return;
        solutionsFound += 1;
        request.onProgress?.(toJobProgress(best, elapsedMs, solutionsFound, timeBudgetMs));
      },
    });
  };

  return {
    async runSolve(request: RunSolveRequest): Promise<SolveResponse> {
      const { signal, options = {}, bypassCache = false } = request;

      if (signal?.aborted) throw abortReason(signal);

      const canonical = canonicalRequest(request.cells, request.targets, options);
      const key = hashString(canonical);
      const fingerprint = datasetFingerprint(request.dataset);

      if (!bypassCache) {
        // No await between the abort check above and here, so a hit cannot be
        // returned to a caller who has already given up.
        const hit = cache.get(key, canonical, fingerprint);
        if (hit) return hit;
      }

      /*
       * The layouts that shipped with the build, before any worker is started.
       *
       * Forty of these - one maximizing plot per mutation on a bare 10x10 - are
       * what the planner asks for the moment it mounts, and they are the same
       * for every visitor, so they are solved at build time instead. The guard
       * is checked here rather than inside the lookup so that a request which
       * cannot possibly hit never downloads the asset chunk.
       *
       * A hit is deliberately NOT written into `cache`. That cache mirrors
       * itself into localStorage, and spending a player's storage quota on
       * layouts already sitting in the bundle would be paying twice for the
       * same bytes. The lookup itself is a Map read behind a memoised import.
       */
      if (!bypassCache && isPrecomputableRequest(request.cells, request.targets, options)) {
        const shipped = await precompute(
          request.cells,
          request.targets,
          canonical,
          request.dataset,
          options
        );
        // The await above is a real suspension point, so a caller may have
        // given up during it. Same contract as the end of this function.
        if (signal?.aborted) throw abortReason(signal);
        if (shipped) return shipped;
      }

      const activeWorker = ensureWorker();
      const response = activeWorker
        ? await solveInWorker(activeWorker, request)
        : await solveOnMainThread(request);

      if (!bypassCache) cache.set(key, canonical, fingerprint, response);

      /*
       * The one place both paths are made to agree.
       *
       * The worker path has already rejected by now if it was aborted. The main
       * thread path cannot be interrupted, so its abort is honoured here. Either
       * way the promise an aborted caller holds rejects and never resolves,
       * which is the contract that matters at the call site.
       */
      if (signal?.aborted) throw abortReason(signal);

      return response;
    },

    terminate() {
      failAll("Greenhouse solver worker was terminated");
    },

    isWorkerRunning() {
      return worker !== null;
    },
  };
};

/** The client the app uses. Nothing is created until the first solve. */
export const solverClient = createSolverClient();

/** Solve a greenhouse layout, off the main thread where that is possible. */
export const runSolve = (request: RunSolveRequest): Promise<SolveResponse> =>
  solverClient.runSolve(request);

/** Tear the shared worker down, for example when the greenhouse unmounts. */
export const terminateSolverWorker = (): void => solverClient.terminate();
