import { afterEach, describe, expect, it } from "vitest";
import { precomputedSolve, resetPrecompute } from "../precompute";
import { createSolverClient } from "../solverClient";
import { createSolverCache } from "../cache";
import {
  FULL_PLOT,
  PRECOMPUTE_VARIANTS,
  PRECOMPUTE_VERSION,
  decodeEntry,
  isPrecomputableRequest,
  precomputeCanonical,
  precomputeGoal,
  precomputeOptions,
  precomputeUnsetCanonical,
} from "../precomputeProfile";
import type { PrecomputeAsset } from "../precomputeProfile";
import { canonicalRequest, solverDatasetFingerprint } from "../cacheKey";
import type { CacheableSolveOptions } from "../cacheKey";
import { toSolverDataset } from "../../data/solverDataset";
import { solveLocal, validateSolveResponse } from "../../solver";
import type { SolverDataset } from "../../solver";
import type { GreenhouseDataJSON } from "../../data/datasetStore";
import type { LockDefinition, MutationGoal } from "../../types/greenhouse";
import bundled from "../../../../public/greenhouse/data.json";
import shipped from "../../data/solverPrecompute.json";

/**
 * The layouts that ship with the build.
 *
 * Two separate jobs here, and they fail for different reasons:
 *
 *   the ASSET   is what was committed still true? It was generated from
 *               `data.json` on somebody's machine at some point, and nothing
 *               stops that file moving afterwards. These tests re-derive the
 *               fingerprint and re-check the LEGALITY of all eighty layouts
 *               against the current bundled dataset, so a dataset edit without
 *               a regenerate is a red test rather than a slower page
 *
 *   the GUARD   is the lookup refusing everything it should refuse? A
 *               precompute that answers a question it was not computed for is
 *               the failure mode this whole feature was nearly not shipped
 *               over, so most of what is below is near misses
 */

const asset = shipped as unknown as PrecomputeAsset;
const dataset: SolverDataset = toSolverDataset(bundled as unknown as GreenhouseDataJSON);
const mutationIds = Object.keys(dataset.mutations);

afterEach(() => {
  resetPrecompute();
});

describe("the committed asset", () => {
  it("is the version this build knows how to read", () => {
    expect(asset.version).toBe(PRECOMPUTE_VERSION);
  });

  it("carries the fingerprint of the dataset that ships beside it", () => {
    /*
     * The test that catches "somebody edited data.json and forgot".
     *
     * A mismatch does not break the app - the runtime guard falls back to a
     * live solve - but it silently costs every visitor the twenty-three seconds
     * the precompute exists to remove, with no symptom to notice.
     */
    expect(asset.fingerprint).toBe(solverDatasetFingerprint(dataset));
  });

  it("covers every mutation in the dataset, in both variants", () => {
    const seen = new Set(asset.entries.map((entry) => `${entry.mutation}|${entry.pruned}`));
    const wanted: string[] = [];
    for (const id of mutationIds) {
      for (const pruned of PRECOMPUTE_VARIANTS) wanted.push(`${id}|${pruned}`);
    }
    expect([...seen].sort()).toEqual([...wanted].sort());
  });

  it("plants only ids the dataset knows about, at the dataset's sizes", () => {
    // The table covers base crops and mutations: mutations (snoozling 3x3,
    // noctilume 2x2, plantboy_advance 2x2) are planted as supports by other
    // mutations' layouts. `sizes` must agree with the dataset id for id.
    expect(asset.sizes.length).toBe(asset.crops.length);
    asset.crops.forEach((id, i) => {
      const known = dataset.crops[id] ?? dataset.mutations[id];
      expect(known, id).toBeDefined();
      expect(asset.sizes[i], id).toBe(dataset.mutations[id]?.size ?? 1);
    });
  });

  it("decodes to a LEGAL layout for every entry", () => {
    /*
     * The heart of it. `validateSolveResponse` shares no code with the solver's
     * scoring: it re-derives every ring from the literal adjacency rule and
     * re-counts every requirement. So this is an independent second opinion on
     * eighty layouts that a player could be handed instantly, checked against
     * the dataset as it stands today rather than as it stood when they were
     * generated.
     */
    const illegal: string[] = [];
    for (const entry of asset.entries) {
      const response = decodeEntry(entry, asset.crops, asset.sizes);
      const report = validateSolveResponse(response, FULL_PLOT, dataset);
      if (!report.valid) {
        illegal.push(`${entry.mutation} (pruned=${entry.pruned}): ${report.problems.join("; ")}`);
      }
    }
    expect(illegal).toEqual([]);
  });

  it("only claims OPTIMAL where the solver proved a bound", () => {
    // Honest labels. The status is carried verbatim from the solver, which only
    // says OPTIMAL when every target reached its provable ceiling, so this is
    // asserting the field was not invented on the way through the encoder.
    for (const entry of asset.entries) {
      expect(["OPTIMAL", "FEASIBLE", "INFEASIBLE"]).toContain(entry.status);
    }
  });

  it("reports the same yield for the pruned and unpruned variant of a mutation", () => {
    /*
     * Pruning removes crops that no placed spawn needs, so it must never cost a
     * spawn. If these ever disagree, either the pruner is removing something
     * load bearing or the two solves diverged, and both are worth a red test.
     */
    const byKey = new Map(asset.entries.map((entry) => [`${entry.mutation}|${entry.pruned}`, entry]));
    for (const id of mutationIds) {
      const pruned = byKey.get(`${id}|true`)!;
      const full = byKey.get(`${id}|false`)!;
      expect(pruned.spawns.length).toBe(full.spawns.length);
      expect(pruned.plants.length).toBeLessThanOrEqual(full.plants.length);
    }
  });
});

describe("isPrecomputableRequest", () => {
  const targets: MutationGoal[] = [precomputeGoal("gloomgourd")];

  it("accepts exactly the planner's economics request", () => {
    expect(isPrecomputableRequest(FULL_PLOT, targets, precomputeOptions(true))).toBe(true);
    expect(isPrecomputableRequest(FULL_PLOT, targets, precomputeOptions(false))).toBe(true);
    // And the calculator's, which leaves the flag unset.
    expect(isPrecomputableRequest(FULL_PLOT, targets, {})).toBe(true);
  });

  it("refuses anything that is not the whole plot", () => {
    expect(isPrecomputableRequest(FULL_PLOT.slice(0, 99), targets, {})).toBe(false);
  });

  it("refuses a multi-target solve, which is a joint optimisation", () => {
    expect(
      isPrecomputableRequest(FULL_PLOT, [precomputeGoal("gloomgourd"), precomputeGoal("choconut")], {})
    ).toBe(false);
  });

  it("refuses a counted target, which is a different question from maximize", () => {
    expect(
      isPrecomputableRequest(FULL_PLOT, [{ mutation: "gloomgourd", maximize: false, count: 1 }], {})
    ).toBe(false);
    expect(
      isPrecomputableRequest(FULL_PLOT, [{ mutation: "gloomgourd", maximize: true, count: 4 }], {})
    ).toBe(false);
  });

  it("refuses locks, which really do reshape the search", () => {
    const locks: LockDefinition[] = [{ name: "carrot", position: [0, 0], size: 1 }];
    expect(isPrecomputableRequest(FULL_PLOT, targets, { locks })).toBe(false);

    // An empty lock list is not a lock, and the canonical form already agrees,
    // so it must not be treated as one here.
    expect(isPrecomputableRequest(FULL_PLOT, targets, { locks: [] })).toBe(true);
  });

  /**
   * A priority does NOT disqualify a request, and used to.
   *
   * This profile is single-target only, and a priority provably cannot change a
   * single-target answer, so `canonicalRequest` normalises it away and a
   * request carrying one still matches the shipped entry. The old rejection
   * meant a player who ranked a mutation silently lost the precompute and got a
   * cold search instead: 51 Ashwreath against the 52 in the bundle.
   */
  it("accepts a priority, which cannot change a single-target answer", () => {
    expect(isPrecomputableRequest(FULL_PLOT, targets, { priorities: { gloomgourd: 4 } })).toBe(true);
    expect(isPrecomputableRequest(FULL_PLOT, targets, { priorities: {} })).toBe(true);
  });

  it("refuses any tuning option, because the asset was built with the defaults", () => {
    expect(isPrecomputableRequest(FULL_PLOT, targets, { seed: 1 })).toBe(false);
    expect(isPrecomputableRequest(FULL_PLOT, targets, { iterations: 1000 })).toBe(false);
    expect(isPrecomputableRequest(FULL_PLOT, targets, { timeBudgetMs: 500 })).toBe(false);
  });

  /**
   * The bug this replaced a rejection with.
   *
   * `uniqueCrops` used to disqualify a request here. It is a growth-rate
   * setting the search never reads, and the solver page sends its settings on
   * every solve, so in practice that rejection meant the page NEVER reached the
   * shipped precompute and always paid for a cold search. Ashwreath came back
   * 51 where the precompute holds 52.
   *
   * The option is gone from the type entirely now, so the canonical question
   * from the solver page is precomputable, which is what this pins.
   */
  it("accepts the canonical question exactly as the solver page asks it", () => {
    expect(isPrecomputableRequest(FULL_PLOT, targets, {})).toBe(true);
    expect(isPrecomputableRequest(FULL_PLOT, targets, { removeUnusedCrops: true })).toBe(true);
    expect(isPrecomputableRequest(FULL_PLOT, targets, { locks: [] })).toBe(true);
    expect(isPrecomputableRequest(FULL_PLOT, targets, { priorities: {} })).toBe(true);
  });
});

describe("precomputeCanonical", () => {
  it("is the same string the request would produce on its own", () => {
    /*
     * The load bearing equality. The runtime files entries under
     * `precomputeCanonical` and looks them up by the string `runSolve` computed
     * from the caller's own arguments, so if these two ever produced different
     * strings the precompute would never hit - or, far worse, would hit for the
     * wrong request.
     */
    for (const pruned of PRECOMPUTE_VARIANTS) {
      expect(precomputeCanonical("gloomgourd", pruned)).toBe(
        canonicalRequest(FULL_PLOT, [precomputeGoal("gloomgourd")], precomputeOptions(pruned))
      );
    }
    expect(precomputeUnsetCanonical("gloomgourd")).toBe(
      canonicalRequest(FULL_PLOT, [precomputeGoal("gloomgourd")])
    );
  });

  it("keeps an unset flag apart from an explicit false", () => {
    expect(precomputeUnsetCanonical("gloomgourd")).not.toBe(precomputeCanonical("gloomgourd", false));
  });

  it("does not care what order the cells arrived in", () => {
    const shuffled = [...FULL_PLOT].reverse();
    expect(canonicalRequest(shuffled, [precomputeGoal("gloomgourd")], precomputeOptions(true))).toBe(
      precomputeCanonical("gloomgourd", true)
    );
  });
});

describe("precomputedSolve", () => {
  const ask = (
    mutation: string,
    options: CacheableSolveOptions,
    live: SolverDataset = dataset
  ) =>
    precomputedSolve(
      FULL_PLOT,
      [precomputeGoal(mutation)],
      canonicalRequest(FULL_PLOT, [precomputeGoal(mutation)], options),
      live,
      options
    );

  it("answers the planner's pruned request for every mutation", async () => {
    for (const id of mutationIds) {
      const hit = await ask(id, precomputeOptions(true));
      expect(hit, `no precompute for ${id}`).not.toBeNull();
      expect(hit!.mutations.every((m) => m.mutation === id)).toBe(true);
    }
  });

  it("answers the unpruned request and the unset-flag request with the same layout", async () => {
    const explicit = await ask("gloomgourd", precomputeOptions(false));
    const unset = await ask("gloomgourd", {});
    expect(explicit).not.toBeNull();
    expect(unset).toEqual(explicit);
  });

  it("returns a layout the validator accepts", async () => {
    const hit = await ask("choconut", precomputeOptions(true));
    expect(validateSolveResponse(hit!, FULL_PLOT, dataset)).toEqual({ valid: true, problems: [] });
  });

  it("refuses when the dataset has moved in a way the solver would notice", async () => {
    /*
     * The requirement that nearly kept this feature unshipped. A wiki overlay
     * that changes a requirement makes every layout built from the old one
     * illegal, and handing one over anyway would be a confident wrong answer.
     */
    const moved: SolverDataset = {
      crops: dataset.crops,
      mutations: {
        ...dataset.mutations,
        choconut: {
          ...dataset.mutations.choconut,
          requirements: [{ crop: "carrot", count: 8 }],
        },
      },
    };
    expect(await ask("choconut", precomputeOptions(true), moved)).toBeNull();
  });

  it("still answers when the dataset moved only in a way the solver ignores", async () => {
    // A wiki restating a rarity must not throw away the whole burst. This is
    // the entire reason the fingerprint is solver-scoped rather than broad.
    const cosmetic: SolverDataset = {
      crops: dataset.crops,
      mutations: {
        ...dataset.mutations,
        choconut: { ...dataset.mutations.choconut, rarity: "legendary", name: "Choco Nut" },
      },
    };
    expect(
      await ask("choconut", precomputeOptions(true), cosmetic)
    ).not.toBeNull();
  });

  it("refuses a request outside the profile even when the mutation is in the asset", async () => {
    const goals: MutationGoal[] = [{ mutation: "choconut", maximize: false, count: 1 }];
    expect(
      await precomputedSolve(FULL_PLOT, goals, canonicalRequest(FULL_PLOT, goals), dataset, {})
    ).toBeNull();

    const partial = FULL_PLOT.slice(0, 50);
    expect(
      await precomputedSolve(
        partial,
        [precomputeGoal("choconut")],
        canonicalRequest(partial, [precomputeGoal("choconut")]),
        dataset,
        {}
      )
    ).toBeNull();
  });

  it("refuses a mutation it has never heard of", async () => {
    expect(await ask("not_a_mutation", precomputeOptions(true))).toBeNull();
  });

  it("is what a real solver client reaches for, before it starts any solve", async () => {
    /*
     * The wiring, end to end, through the actual client.
     *
     * Both escape hatches are booby trapped: `createWorker` returning null
     * forces the main thread path, and `loadSolver` throws. So this resolving
     * at all proves the answer came from the asset and that no solve was
     * started - which is the entire claim being made about cold load time.
     */
    const client = createSolverClient({
      cache: createSolverCache({ storage: () => null }),
      createWorker: () => null,
      loadSolver: () => {
        throw new Error("the precompute should have answered before this was reached");
      },
    });

    const response = await client.runSolve({
      cells: FULL_PLOT,
      targets: [precomputeGoal("choconut")],
      dataset,
      options: precomputeOptions(true),
    });

    expect(response.mutations.length).toBeGreaterThan(0);
    expect(client.isWorkerRunning()).toBe(false);
    expect(validateSolveResponse(response, FULL_PLOT, dataset)).toEqual({ valid: true, problems: [] });
  });

  it("does not spend the player's storage quota on layouts already in the bundle", async () => {
    const written: string[] = [];
    const client = createSolverClient({
      cache: createSolverCache({
        storage: () => ({
          getItem: () => null,
          setItem: (key: string) => written.push(key),
          removeItem: () => {},
        }),
      }),
      createWorker: () => null,
      loadSolver: () => {
        throw new Error("no solve should be needed");
      },
    });

    await client.runSolve({
      cells: FULL_PLOT,
      targets: [precomputeGoal("choconut")],
      dataset,
      options: precomputeOptions(true),
    });

    expect(written).toEqual([]);
  });

  it("hands the solve back to the worker path when the dataset has moved", async () => {
    // The fallback, proved rather than asserted: a moved requirement makes the
    // shipped layout illegal, so the client must go and solve.
    const moved: SolverDataset = {
      crops: dataset.crops,
      mutations: {
        ...dataset.mutations,
        choconut: { ...dataset.mutations.choconut, requirements: [{ crop: "carrot", count: 8 }] },
      },
    };

    let solves = 0;
    const client = createSolverClient({
      cache: createSolverCache({ storage: () => null }),
      createWorker: () => null,
      loadSolver: () =>
        Promise.resolve((cells, targets, live, options) => {
          solves++;
          return solveLocal(cells, targets, live, options);
        }),
    });

    const response = await client.runSolve({
      cells: FULL_PLOT,
      targets: [precomputeGoal("choconut")],
      dataset: moved,
      options: precomputeOptions(true),
    });

    expect(solves).toBe(1);
    expect(validateSolveResponse(response, FULL_PLOT, moved)).toEqual({ valid: true, problems: [] });
  });

  it("refuses when the canonical string does not match the request, even if it is in the table", async () => {
    /*
     * Belt and braces against a future caller that computes the canonical form
     * differently from the arguments it passes. The lookup is by string, so a
     * string that says "pruned" while the options say otherwise must not hit
     * the pruned entry by accident - the guard passes, but the key is the key.
     */
    const hit = await precomputedSolve(
      FULL_PLOT,
      [precomputeGoal("choconut")],
      "not a canonical request",
      dataset,
      precomputeOptions(true)
    );
    expect(hit).toBeNull();
  });
});
