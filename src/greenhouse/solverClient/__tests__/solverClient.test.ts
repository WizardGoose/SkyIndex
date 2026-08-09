import { afterEach, describe, expect, it, vi } from "vitest";
import { createSolverClient } from "../solverClient";
import type { LocalSolveFn, RunSolveRequest } from "../solverClient";
import { createSolverCache } from "../cache";
import type { NarrowStorage } from "../cache";
import type {
  CropDefinition,
  JobProgress,
  MutationDefinition,
  MutationGoal,
  SolveResponse,
} from "../../types/greenhouse";
import type { SolveRequestMessage, WorkerOutboundMessage } from "../protocol";

/**
 * The client layer: routing, cancellation, progress and the fallback.
 *
 * There is no `Worker` in the node test environment, which is the same
 * situation as server side rendering and as an old browser. That is not a gap
 * in the tests, it is one of the two paths under test: the fallback has to
 * produce the identical answer through the identical function, and most of
 * these cases run through it. The worker path is driven by a stubbed `Worker`
 * so that message routing, cross-talk and cancellation can be exercised
 * deliberately rather than by timing.
 */

interface Dataset {
  mutations: Record<string, MutationDefinition>;
  crops: Record<string, CropDefinition>;
}

const dataset: Dataset = {
  mutations: {
    gloomgourd: {
      id: "gloomgourd",
      name: "Gloomgourd",
      size: 2,
      ground: "farmland",
      requirements: [{ crop: "pumpkin", count: 4 }],
      rarity: "rare",
      growth_stages: 3,
      positive_buffs: [],
      negative_buffs: [],
      drops: { gloomgourd: 1 },
    },
  },
  crops: {
    pumpkin: {
      id: "pumpkin",
      name: "Pumpkin",
      size: 1,
      priority: 0,
      ground: "farmland",
      growth_stages: 4,
      positive_buffs: [],
      negative_buffs: [],
    },
  },
};

const CELLS: [number, number][] = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
];

const TARGETS: MutationGoal[] = [{ mutation: "gloomgourd", maximize: true, count: null }];

const answer = (tag = "gloomgourd"): SolveResponse => ({
  status: "OPTIMAL",
  total_cells_used: 4,
  placements: [{ crop: tag, position: [0, 0], size: 2 }],
  mutations: [{ mutation: tag, position: [0, 0], size: 2 }],
});

/** An isolated cache per test, so nothing leaks between them. */
const freshCache = () => {
  const map = new Map<string, string>();
  const storage: NarrowStorage = {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
  return createSolverCache({ cacheKey: "test.solver.v1", staleKeys: [], storage: () => storage });
};

const request = (over: Partial<RunSolveRequest> = {}): RunSolveRequest => ({
  cells: CELLS,
  targets: TARGETS,
  dataset,
  ...over,
});

/** A client that cannot make a worker, so it always takes the main thread path. */
const fallbackClient = (solve: LocalSolveFn) =>
  createSolverClient({
    cache: freshCache(),
    createWorker: () => null,
    loadSolver: () => Promise.resolve(solve),
  });

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// The fallback path
// ---------------------------------------------------------------------------

describe("main thread fallback", () => {
  it("solves and returns the core's answer unchanged", async () => {
    const client = fallbackClient(() => answer());
    await expect(client.runSolve(request())).resolves.toEqual(answer());
  });

  it("passes the cells, targets, dataset and options straight through", async () => {
    const solve = vi.fn<LocalSolveFn>(() => answer());
    const client = fallbackClient(solve);

    await client.runSolve(request({ options: { seed: 7, iterations: 5, removeUnusedCrops: true } }));

    const [cells, targets, data, options] = solve.mock.calls[0];
    expect(cells).toEqual(CELLS);
    expect(targets).toEqual(TARGETS);
    expect(data).toBe(dataset);
    expect(options).toMatchObject({ seed: 7, iterations: 5, removeUnusedCrops: true });
  });

  it("never starts a worker", async () => {
    const client = fallbackClient(() => answer());
    await client.runSolve(request());
    expect(client.isWorkerRunning()).toBe(false);
  });

  it("loads the core once no matter how many solves run", async () => {
    const loadSolver = vi.fn(() => Promise.resolve<LocalSolveFn>(() => answer()));
    const client = createSolverClient({
      cache: freshCache(),
      createWorker: () => null,
      loadSolver,
    });

    await client.runSolve(request());
    await client.runSolve(request({ options: { seed: 1 } }));
    await client.runSolve(request({ options: { seed: 2 } }));

    expect(loadSolver).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

describe("progress reporting", () => {
  it("reshapes the core's (best, elapsed) into the JobProgress the UI already renders", async () => {
    const client = fallbackClient((_cells, _targets, _data, options) => {
      options?.onProgress?.(12, 250);
      options?.onProgress?.(15, 800);
      return answer();
    });

    const seen: JobProgress[] = [];
    await client.runSolve(request({ onProgress: (p) => seen.push(p) }));

    expect(seen).toHaveLength(2);
    expect(seen[0]).toMatchObject({
      phase: "Solving",
      best_objective: 12,
      elapsed_seconds: 0.25,
      solutions_found: 1,
      percentage: null,
    });
    expect(seen[1]).toMatchObject({ best_objective: 15, elapsed_seconds: 0.8, solutions_found: 2 });
  });

  it("leaves the fields the core cannot speak to null rather than inventing them", async () => {
    const client = fallbackClient((_cells, _targets, _data, options) => {
      options?.onProgress?.(3, 100);
      return answer();
    });

    const seen: JobProgress[] = [];
    await client.runSolve(request({ onProgress: (p) => seen.push(p) }));

    // SolverProgress treats a null percentage as "no bar" and skips the preview.
    expect(seen[0].best_bound).toBeNull();
    expect(seen[0].preview_placements).toBeNull();
    expect(seen[0].preview_mutations).toBeNull();
    expect(seen[0].preview_cells_used).toBeNull();
  });

  it("reports a percentage only when there is a time budget to measure against", async () => {
    const client = fallbackClient((_cells, _targets, _data, options) => {
      options?.onProgress?.(1, 500);
      options?.onProgress?.(2, 3000);
      return answer();
    });

    const seen: JobProgress[] = [];
    await client.runSolve(
      request({ options: { timeBudgetMs: 2000 }, onProgress: (p) => seen.push(p) })
    );

    expect(seen[0].percentage).toBe(25);
    // Overrunning the budget must not produce a bar past its own end.
    expect(seen[1].percentage).toBe(100);
  });

  it("uses plain text with no dashes, since this reaches the screen", async () => {
    const client = fallbackClient((_cells, _targets, _data, options) => {
      options?.onProgress?.(9, 100);
      return answer();
    });

    const seen: JobProgress[] = [];
    await client.runSolve(request({ onProgress: (p) => seen.push(p) }));

    expect(seen[0].current_activity).toBe("Best so far: 9");
    /* En dash and em dash, written as escapes. The rule this asserts is that
       neither character reaches the screen, and a test file is not exempt from
       it: spelled literally, the guard would be the last place in the project
       either character survives, and a grep for them would report a violation
       that is really the check. */
    expect(seen[0].phase + seen[0].current_activity).not.toMatch(/[\u2013\u2014]/);
  });

  it("solving without a progress callback is fine", async () => {
    const client = fallbackClient((_cells, _targets, _data, options) => {
      options?.onProgress?.(1, 10);
      return answer();
    });
    await expect(client.runSolve(request())).resolves.toEqual(answer());
  });
});

// ---------------------------------------------------------------------------
// Caching
// ---------------------------------------------------------------------------

describe("cache integration", () => {
  it("does not solve twice for the same question", async () => {
    const solve = vi.fn<LocalSolveFn>(() => answer());
    const client = fallbackClient(solve);

    await client.runSolve(request());
    await expect(client.runSolve(request())).resolves.toEqual(answer());
    expect(solve).toHaveBeenCalledTimes(1);
  });

  it("hits the same entry for a differently ordered but identical request", async () => {
    const solve = vi.fn<LocalSolveFn>(() => answer());
    const client = fallbackClient(solve);

    await client.runSolve(request());
    await client.runSolve(
      request({
        cells: [
          [1, 1],
          [0, 1],
          [1, 0],
          [0, 0],
        ],
      })
    );

    expect(solve).toHaveBeenCalledTimes(1);
  });

  it("misses when an option that changes the answer changes", async () => {
    const solve = vi.fn<LocalSolveFn>(() => answer());
    const client = fallbackClient(solve);

    await client.runSolve(request({ options: { seed: 1 } }));
    await client.runSolve(request({ options: { seed: 2 } }));
    await client.runSolve(request({ options: { seed: 1, removeUnusedCrops: true } }));

    expect(solve).toHaveBeenCalledTimes(3);
  });

  it("misses when the dataset has changed under it", async () => {
    const solve = vi.fn<LocalSolveFn>(() => answer());
    const client = fallbackClient(solve);

    await client.runSolve(request());

    // What a background wiki refresh looks like: a new dataset object saying
    // something different. Yesterday's layout may be flatly invalid now.
    const updated: Dataset = {
      ...dataset,
      mutations: {
        gloomgourd: { ...dataset.mutations.gloomgourd, requirements: [{ crop: "pumpkin", count: 6 }] },
      },
    };
    await client.runSolve(request({ dataset: updated }));

    expect(solve).toHaveBeenCalledTimes(2);
  });

  it("bypassCache solves fresh and does not record the answer", async () => {
    const solve = vi.fn<LocalSolveFn>(() => answer());
    const client = fallbackClient(solve);

    await client.runSolve(request({ bypassCache: true }));
    await client.runSolve(request({ bypassCache: true }));
    expect(solve).toHaveBeenCalledTimes(2);

    // Nothing was recorded, so a normal solve still has to do the work.
    await client.runSolve(request());
    expect(solve).toHaveBeenCalledTimes(3);
  });

  it("a cache hit still reports no progress, because there was none", async () => {
    const solve = vi.fn<LocalSolveFn>((_cells, _targets, _data, options) => {
      options?.onProgress?.(1, 10);
      return answer();
    });
    const client = fallbackClient(solve);

    await client.runSolve(request({ onProgress: () => {} }));

    const seen: JobProgress[] = [];
    await client.runSolve(request({ onProgress: (p) => seen.push(p) }));
    expect(seen).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Cancellation
// ---------------------------------------------------------------------------

describe("cancellation", () => {
  it("rejects immediately when the signal has already fired, without solving", async () => {
    const solve = vi.fn<LocalSolveFn>(() => answer());
    const client = fallbackClient(solve);

    const controller = new AbortController();
    controller.abort();

    await expect(client.runSolve(request({ signal: controller.signal }))).rejects.toMatchObject({
      name: "AbortError",
    });
    expect(solve).not.toHaveBeenCalled();
  });

  it("rejects rather than resolving when the abort lands during a synchronous solve", async () => {
    const controller = new AbortController();
    const client = fallbackClient((_cells, _targets, _data, options) => {
      // The player edits the grid while this is running. A synchronous solve
      // cannot be interrupted, so the abort is honoured the moment it finishes.
      options?.onProgress?.(4, 50);
      controller.abort();
      return answer();
    });

    const settled: string[] = [];
    await client
      .runSolve(request({ signal: controller.signal }))
      .then(() => settled.push("resolved"))
      .catch(() => settled.push("rejected"));

    expect(settled).toEqual(["rejected"]);
  });

  it("still records the finished answer, so the next identical ask is instant", async () => {
    const controller = new AbortController();
    const solve = vi.fn<LocalSolveFn>(() => {
      controller.abort();
      return answer();
    });
    const client = fallbackClient(solve);

    await client.runSolve(request({ signal: controller.signal })).catch(() => {});

    // The abort said "I stopped waiting", not "that answer was wrong".
    await expect(client.runSolve(request())).resolves.toEqual(answer());
    expect(solve).toHaveBeenCalledTimes(1);
  });

  it("stops reporting progress once aborted", async () => {
    const controller = new AbortController();
    const client = fallbackClient((_cells, _targets, _data, options) => {
      options?.onProgress?.(1, 10);
      controller.abort();
      options?.onProgress?.(2, 20);
      return answer();
    });

    const seen: JobProgress[] = [];
    await client
      .runSolve(request({ signal: controller.signal, onProgress: (p) => seen.push(p) }))
      .catch(() => {});

    expect(seen.map((p) => p.best_objective)).toEqual([1]);
  });
});

// ---------------------------------------------------------------------------
// The worker path, against a stubbed Worker
// ---------------------------------------------------------------------------

/**
 * A `Worker` that does nothing until the test tells it to.
 *
 * Real timing would make these tests flaky and would not let us reproduce the
 * case that matters most: a reply arriving for a request that was abandoned
 * while the worker was still busy with it.
 */
class FakeWorker {
  static instances: FakeWorker[] = [];
  readonly posted: SolveRequestMessage[] = [];
  terminated = false;
  onmessage: ((event: MessageEvent<WorkerOutboundMessage>) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onmessageerror: ((event: unknown) => void) | null = null;

  constructor() {
    FakeWorker.instances.push(this);
  }

  postMessage(msg: SolveRequestMessage): void {
    this.posted.push(msg);
  }

  terminate(): void {
    this.terminated = true;
  }

  /** Drive a reply back to the client, as the real worker would. */
  reply(msg: WorkerOutboundMessage): void {
    this.onmessage?.({ data: msg } as MessageEvent<WorkerOutboundMessage>);
  }
}

const workerClient = () => {
  FakeWorker.instances = [];
  const client = createSolverClient({
    cache: freshCache(),
    createWorker: () => new FakeWorker() as unknown as Worker,
    loadSolver: () => Promise.reject(new Error("the fallback must not be used on the worker path")),
  });
  return client;
};

/** Let the client's promise plumbing run so a postMessage has definitely happened. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("worker path", () => {
  it("creates no worker until the first solve, then reuses it", async () => {
    const client = workerClient();
    expect(client.isWorkerRunning()).toBe(false);
    expect(FakeWorker.instances).toHaveLength(0);

    const first = client.runSolve(request());
    await flush();
    expect(FakeWorker.instances).toHaveLength(1);
    expect(client.isWorkerRunning()).toBe(true);

    const worker = FakeWorker.instances[0];
    worker.reply({ type: "result", id: worker.posted[0].id, response: answer() });
    await expect(first).resolves.toEqual(answer());

    // A completed solve leaves the worker warm rather than tearing it down.
    expect(worker.terminated).toBe(false);

    const second = client.runSolve(request({ options: { seed: 9 } }));
    await flush();
    expect(FakeWorker.instances).toHaveLength(1);
    worker.reply({ type: "result", id: worker.posted[1].id, response: answer("second") });
    await expect(second).resolves.toEqual(answer("second"));
  });

  it("routes concurrent solves by id, even when replies come back out of order", async () => {
    const client = workerClient();

    const a = client.runSolve(request({ options: { seed: 1 } }));
    const b = client.runSolve(request({ options: { seed: 2 } }));
    await flush();

    const worker = FakeWorker.instances[0];
    expect(worker.posted).toHaveLength(2);
    const [idA, idB] = worker.posted.map((m) => m.id);
    expect(idA).not.toBe(idB);

    // Second request answered first.
    worker.reply({ type: "result", id: idB, response: answer("b") });
    worker.reply({ type: "result", id: idA, response: answer("a") });

    await expect(a).resolves.toEqual(answer("a"));
    await expect(b).resolves.toEqual(answer("b"));
  });

  it("delivers progress only to the request it belongs to", async () => {
    const client = workerClient();

    const seenA: number[] = [];
    const seenB: number[] = [];
    const a = client.runSolve(request({ options: { seed: 1 }, onProgress: (p) => seenA.push(p.best_objective!) }));
    const b = client.runSolve(request({ options: { seed: 2 }, onProgress: (p) => seenB.push(p.best_objective!) }));
    await flush();

    const worker = FakeWorker.instances[0];
    const [idA, idB] = worker.posted.map((m) => m.id);

    worker.reply({ type: "progress", id: idA, best: 10, elapsedMs: 100 });
    worker.reply({ type: "progress", id: idB, best: 20, elapsedMs: 100 });
    worker.reply({ type: "progress", id: idA, best: 11, elapsedMs: 200 });

    expect(seenA).toEqual([10, 11]);
    expect(seenB).toEqual([20]);

    worker.reply({ type: "result", id: idA, response: answer("a") });
    worker.reply({ type: "result", id: idB, response: answer("b") });
    await Promise.all([a, b]);
  });

  it("rejects the aborted request and never resolves it, even when its result turns up later", async () => {
    const client = workerClient();
    const controller = new AbortController();

    const settled: string[] = [];
    const promise = client
      .runSolve(request({ signal: controller.signal }))
      .then(() => settled.push("resolved"))
      .catch((e: Error) => settled.push(`rejected:${e.name}`));
    await flush();

    const worker = FakeWorker.instances[0];
    const id = worker.posted[0].id;

    controller.abort();
    await promise;
    expect(settled).toEqual(["rejected:AbortError"]);

    // The worker was mid-solve and its answer arrives anyway. It must go nowhere.
    worker.reply({ type: "progress", id, best: 5, elapsedMs: 10 });
    worker.reply({ type: "result", id, response: answer() });
    await flush();

    expect(settled).toEqual(["rejected:AbortError"]);
  });

  it("terminates the worker when the aborted solve was the only one in flight", async () => {
    /*
     * Not just to save a core. One worker serves requests one at a time, and the
     * core is synchronous, so an abandoned solve cannot be interrupted by a
     * message and would block the next solve behind it. Terminating is the only
     * thing that actually frees the queue.
     */
    const client = workerClient();
    const controller = new AbortController();

    const promise = client.runSolve(request({ signal: controller.signal })).catch(() => {});
    await flush();

    const worker = FakeWorker.instances[0];
    controller.abort();
    await promise;

    expect(worker.terminated).toBe(true);
    expect(client.isWorkerRunning()).toBe(false);
  });

  it("keeps the worker alive when other solves are still waiting on it", async () => {
    const client = workerClient();
    const controller = new AbortController();

    const aborted = client
      .runSolve(request({ options: { seed: 1 }, signal: controller.signal }))
      .catch(() => "aborted");
    const survivor = client.runSolve(request({ options: { seed: 2 } }));
    await flush();

    const worker = FakeWorker.instances[0];
    const idSurvivor = worker.posted[1].id;

    controller.abort();
    await aborted;

    // Killing the worker here would reject work nobody asked to cancel.
    expect(worker.terminated).toBe(false);

    worker.reply({ type: "result", id: idSurvivor, response: answer("survivor") });
    await expect(survivor).resolves.toEqual(answer("survivor"));
  });

  it("detaches the abort listener however the request ends", async () => {
    const client = workerClient();
    const controller = new AbortController();
    const remove = vi.spyOn(controller.signal, "removeEventListener");

    const promise = client.runSolve(request({ signal: controller.signal }));
    await flush();

    const worker = FakeWorker.instances[0];
    worker.reply({ type: "result", id: worker.posted[0].id, response: answer() });
    await promise;

    // A listener left attached to a long lived signal is a leak, and would also
    // fire into a settled promise.
    expect(remove).toHaveBeenCalledWith("abort", expect.any(Function));
  });

  it("rejects the matching request when the worker reports a failed solve", async () => {
    const client = workerClient();

    const a = client.runSolve(request({ options: { seed: 1 } }));
    const b = client.runSolve(request({ options: { seed: 2 } }));
    await flush();

    const worker = FakeWorker.instances[0];
    const [idA, idB] = worker.posted.map((m) => m.id);

    worker.reply({ type: "error", id: idA, message: "no feasible layout" });
    await expect(a).rejects.toThrow("no feasible layout");

    // The other request is untouched.
    worker.reply({ type: "result", id: idB, response: answer("b") });
    await expect(b).resolves.toEqual(answer("b"));
  });

  it("rejects everything in flight when the worker itself dies", async () => {
    const client = workerClient();

    const a = client.runSolve(request({ options: { seed: 1 } }));
    const b = client.runSolve(request({ options: { seed: 2 } }));
    await flush();

    const worker = FakeWorker.instances[0];
    worker.onerror?.(new Error("worker exploded"));

    await expect(a).rejects.toThrow(/worker failed/i);
    await expect(b).rejects.toThrow(/worker failed/i);
    expect(worker.terminated).toBe(true);
    expect(client.isWorkerRunning()).toBe(false);

    // And the next solve builds a fresh one rather than staying broken.
    const c = client.runSolve(request({ options: { seed: 3 } }));
    await flush();
    expect(FakeWorker.instances).toHaveLength(2);
    FakeWorker.instances[1].reply({
      type: "result",
      id: FakeWorker.instances[1].posted[0].id,
      response: answer("c"),
    });
    await expect(c).resolves.toEqual(answer("c"));
  });

  it("does not go back to the worker for a cached answer", async () => {
    const client = workerClient();

    const first = client.runSolve(request());
    await flush();
    const worker = FakeWorker.instances[0];
    worker.reply({ type: "result", id: worker.posted[0].id, response: answer() });
    await first;

    await expect(client.runSolve(request())).resolves.toEqual(answer());
    expect(worker.posted).toHaveLength(1);
  });

  it("terminate() shuts the worker down and rejects what was in flight", async () => {
    const client = workerClient();

    const pending = client.runSolve(request());
    await flush();
    const worker = FakeWorker.instances[0];

    client.terminate();

    await expect(pending).rejects.toThrow(/terminated/i);
    expect(worker.terminated).toBe(true);
    expect(client.isWorkerRunning()).toBe(false);
  });

  it("falls back to the main thread when a worker cannot be constructed", async () => {
    const solve = vi.fn<LocalSolveFn>(() => answer("fallen back"));
    const client = createSolverClient({
      cache: freshCache(),
      // What a locked down browser or a blocked blob URL looks like.
      createWorker: () => null,
      loadSolver: () => Promise.resolve(solve),
    });

    await expect(client.runSolve(request())).resolves.toEqual(answer("fallen back"));
    expect(solve).toHaveBeenCalledTimes(1);
  });

  it("picks up a Worker installed on the global, and only when one exists", async () => {
    // Proves the default construction path is wired to the real global rather
    // than only ever working through the injected seam above.
    FakeWorker.instances = [];
    vi.stubGlobal("Worker", FakeWorker);

    const client = createSolverClient({
      cache: freshCache(),
      loadSolver: () => Promise.reject(new Error("should not fall back")),
    });

    const promise = client.runSolve(request());
    await flush();

    expect(FakeWorker.instances).toHaveLength(1);
    const worker = FakeWorker.instances[0];
    worker.reply({ type: "result", id: worker.posted[0].id, response: answer() });
    await expect(promise).resolves.toEqual(answer());
  });
});
