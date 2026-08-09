#!/usr/bin/env node
/**
 * Precompute the planner's opening burst.
 *
 *   node tools/build-solver-precompute.mjs
 *   node tools/build-solver-precompute.mjs --only gloomgourd
 *   node tools/build-solver-precompute.mjs --check
 *
 * WHAT THIS IS FOR
 * ----------------
 * The planner does not solve one plot, it solves forty: `useSolverEconomies`
 * asks the solver "what does one optimal plot of this mutation yield, and what
 * does it cost to sow?" once per mutation, and the answers only depend on the
 * mutation and a bare 10x10. On a cold load that is around seventeen seconds of
 * a spinner for a set of answers that are the same for every visitor. So they
 * are solved once, here, and shipped.
 *
 * WHY THIS IS ONLY SAFE WITH A FINGERPRINT
 * ----------------------------------------
 * At runtime the dataset is not this file. It is this file with a wiki overlay
 * applied on top (see src/greenhouse/data/wikiSync.ts), and the overlay really
 * does change requirements and sizes. A layout precomputed from data that has
 * since moved is not merely stale, it can be flatly ILLEGAL: the player builds
 * it and nothing spawns. A wrong answer that arrives instantly is worse than no
 * precompute at all.
 *
 * So every entry is stamped with `solverDatasetFingerprint` of the dataset it
 * was solved against, computed by the same function the browser calls on the
 * live store. The browser compares the two and falls back to a live solve on
 * any mismatch. Nothing here is trusted; it is checked.
 *
 * WHAT IS CHECKED BEFORE ANYTHING IS WRITTEN
 * ------------------------------------------
 *   legality     every layout goes through validateSolveResponse, the solver's
 *                independent second opinion. An illegal layout fails the build
 *   uniformity   the flat encoding assumes a single-target solve is uniform in
 *                spawn id, spawn size and 1x1 plants. Asserted, not assumed
 *   round trip   each entry is encoded and then decoded with the runtime's own
 *                decoder and deep-compared against the solver's response, so an
 *                encoding the browser could not read is a build failure
 *
 * `--check` runs the whole thing and compares against the committed file
 * without writing, so CI can tell whether the asset is stale. It exits non-zero
 * when it is.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, relative } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const DATA_PATH = join(ROOT, "public", "greenhouse", "data.json");
const OUT_PATH = join(ROOT, "src", "greenhouse", "data", "solverPrecompute.json");

const SOLVER_PATH = join(ROOT, "src", "greenhouse", "solver", "index.ts");
const DATASET_PATH = join(ROOT, "src", "greenhouse", "data", "solverDataset.ts");
const CACHE_KEY_PATH = join(ROOT, "src", "greenhouse", "solverClient", "cacheKey.ts");
const PROFILE_PATH = join(ROOT, "src", "greenhouse", "solverClient", "precomputeProfile.ts");

const argv = process.argv.slice(2);
const CHECK_ONLY = argv.includes("--check");

/**
 * Extra RNG streams tried per entry, beyond the app's own default request.
 *
 * 40 because that is where the measurement was taken: over 40 seeds the two
 * hardest mutations reach their best known layout once, so a sweep of this size
 * is what reliably catches it. Every restart is validated and only a strictly
 * better legal layout wins, so raising this can never make the shipped file
 * worse, only slower to build. `--restarts N` overrides for a quick build.
 */
const RESTARTS = (() => {
  const i = argv.indexOf("--restarts");
  if (i === -1) return 40;
  const v = Number(argv[i + 1]);
  return Number.isFinite(v) && v >= 0 ? v : 40;
})();
const ONLY = (() => {
  const i = argv.indexOf("--only");
  if (i === -1) return null;
  const next = argv[i + 1];
  return next && !next.startsWith("--") ? next : null;
})();

const fail = (message) => {
  console.error(`\nFATAL: ${message}\n`);
  process.exit(2);
};

// ---------------------------------------------------------------------------
// the real modules, not copies of them
// ---------------------------------------------------------------------------
//
// Imported through Node's native type stripping, the same way
// tools/solver-parity.mjs reaches the solver. A second implementation of the
// fingerprint or the encoding in this file would be a second thing to keep in
// step, and the entire point of the fingerprint is that there is exactly one.

const load = async (path, ...names) => {
  if (!existsSync(path)) fail(`${relative(ROOT, path)} does not exist`);
  let mod;
  try {
    mod = await import(pathToFileURL(path).href);
  } catch (err) {
    fail(`could not import ${relative(ROOT, path)}: ${err?.message ?? err}`);
  }
  const missing = names.filter((name) => mod[name] === undefined);
  if (missing.length) {
    fail(`${relative(ROOT, path)} does not export: ${missing.join(", ")}`);
  }
  return mod;
};

const { solveLocal, validateSolveResponse } = await load(
  SOLVER_PATH,
  "solveLocal",
  "validateSolveResponse"
);
const { toSolverDataset } = await load(DATASET_PATH, "toSolverDataset");
const { solverDatasetFingerprint } = await load(CACHE_KEY_PATH, "solverDatasetFingerprint");
const {
  FULL_PLOT,
  PRECOMPUTE_VARIANTS,
  PRECOMPUTE_VERSION,
  decodeEntry,
  precomputeGoal,
  precomputeOptions,
} = await load(
  PROFILE_PATH,
  "FULL_PLOT",
  "PRECOMPUTE_VARIANTS",
  "PRECOMPUTE_VERSION",
  "decodeEntry",
  "precomputeGoal",
  "precomputeOptions"
);

// ---------------------------------------------------------------------------
// the dataset
// ---------------------------------------------------------------------------

if (!existsSync(DATA_PATH)) fail(`${relative(ROOT, DATA_PATH)} does not exist`);
const raw = JSON.parse(readFileSync(DATA_PATH, "utf8"));
const dataset = toSolverDataset(raw);
const fingerprint = solverDatasetFingerprint(dataset);

/**
 * The crop id table, taken from the dataset rather than from the layouts.
 *
 * Sorted and complete, so the table is a property of the dataset and not of
 * whichever crops these particular layouts happened to plant. That keeps the
 * indices stable between runs, which keeps the diff of the committed file
 * readable when one mutation's layout changes.
 */
// Base crops AND mutations: mutations (snoozling 3x3, noctilume 2x2,
// plantboy_advance 2x2) are planted as supports by other mutations' layouts,
// so they need ids in this table too. `sizes` rides parallel so the decoder
// can rebuild every placement at its true footprint.
const crops = [...new Set([...Object.keys(dataset.crops), ...Object.keys(dataset.mutations)])].sort();
const cropIndex = new Map(crops.map((id, i) => [id, i]));
const sizes = crops.map((id) => dataset.mutations[id]?.size ?? 1);

const mutationIds = Object.keys(raw.mutations)
  .sort()
  .filter((id) => !ONLY || id === ONLY);

if (!mutationIds.length) fail(`--only "${ONLY}" matched no mutation in the dataset`);

// ---------------------------------------------------------------------------
// solving
// ---------------------------------------------------------------------------

const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const encode = (mutation, pruned, response) => {
  const declaredSize = raw.mutations[mutation].size;

  const spawns = [];
  for (const spawn of response.mutations) {
    // The decoder rebuilds every spawn as `mutation` at `size`, so anything
    // else in here would be silently rewritten on the way back out.
    if (spawn.mutation !== mutation) {
      fail(`${mutation}: single-target solve returned a spawn of ${spawn.mutation}`);
    }
    if (spawn.size !== declaredSize) {
      fail(`${mutation}: spawn size ${spawn.size} but the dataset says ${declaredSize}`);
    }
    spawns.push(spawn.position[0], spawn.position[1]);
  }

  const plants = [];
  for (const placement of response.placements) {
    const expectedSize = raw.mutations[placement.crop]?.size ?? 1;
    if (placement.size !== expectedSize) {
      fail(
        `${mutation}: placement of ${placement.crop} has size ${placement.size}, ` +
          `but the dataset says ${expectedSize}`
      );
    }
    if (placement.locked) {
      fail(`${mutation}: placement of ${placement.crop} is locked, but this profile has no locks`);
    }
    const index = cropIndex.get(placement.crop);
    if (index === undefined) fail(`${mutation}: planted ${placement.crop}, which is not in the dataset`);
    plants.push(index, placement.position[0], placement.position[1]);
  }

  return {
    mutation,
    pruned,
    status: response.status,
    approach: response.solver_approach,
    cellsUsed: response.total_cells_used,
    size: declaredSize,
    spawns,
    plants,
  };
};

const entries = [];
/** mutation -> the RNG stream that beat the default, shared across variants. */
const winningSeed = new Map();
const timings = [];
let totalMs = 0;

console.log(`Solving ${mutationIds.length} mutations x ${PRECOMPUTE_VARIANTS.length} variants`);
console.log(`  dataset fingerprint: ${fingerprint}`);
console.log("");

for (const mutation of mutationIds) {
  const row = { mutation, ms: {}, yield: {} };

  for (const pruned of PRECOMPUTE_VARIANTS) {
    const started = process.hrtime.bigint();
    let response;
    let bestSeed = "default";
    try {
      /*
       * BEST OF N SEEDS. A build machine has time a browser does not, and this
       * is the one place that difference can be spent on the player's behalf.
       *
       * The first solve is the exact request the app sends: no seed, no
       * iteration count, no time budget, so the core applies the same DEFAULTS
       * it applies live. That answer is the floor, and it is what a custom grid
       * still gets. The restarts that follow differ ONLY in the RNG stream.
       *
       * Why it is worth doing. The search reaches a known-good layout for the
       * hardest two mutations on roughly one seed in twenty: measured over 40
       * seeds, soggybud and ashwreath return 50 nine times, 51 thirty times and
       * 52 once. Live, at 2.5 seconds a solve, there is no way to buy that; the
       * restarts would cost a minute. At build time it costs seconds and every
       * visitor gets the better plot.
       *
       * This is our own solver run harder, not an answer copied from anywhere.
       * Each restart is validated by validateSolveResponse exactly like the
       * first, and only a strictly better LEGAL layout is allowed to win, so N
       * can only raise the shipped number and can never lower it.
       */
      response = solveLocal(FULL_PLOT, [precomputeGoal(mutation)], dataset, precomputeOptions(pruned));
      let best = validateSolveResponse(response, FULL_PLOT, dataset).valid
        ? response.mutations.length
        : -1;

      /*
       * Two cuts, so the sweep costs minutes instead of half an hour.
       *
       * A response marked OPTIMAL was proved at its upper bound by the
       * constructive path. No seed can beat a proved maximum, so restarting it
       * is guaranteed waste. That is most of the 40.
       *
       * And the two variants differ only in whether unused crops are pruned
       * AFTER the search, so the search itself is identical and the seed that
       * wins one wins the other. The first variant does the sweep and the
       * second is simply told the answer.
       */
      const worthSweeping = response.status !== "OPTIMAL";
      const seedsToTry =
        !worthSweeping
          ? []
          : winningSeed.has(mutation)
            ? [winningSeed.get(mutation)]
            : Array.from({ length: RESTARTS }, (_, i) => ((i + 1) * 2654435761) >>> 0);

      for (const seed of seedsToTry) {
        const candidate = solveLocal(FULL_PLOT, [precomputeGoal(mutation)], dataset, {
          ...precomputeOptions(pruned),
          seed,
        });
        // The standing objective, applied to the sweep: most mutations grown
        // first, fewest cells planted second (the remote solver tied
        // our choconut at 72 but did it one bean cheaper, and the sweep is
        // where the shipped layout gets to be the thriftiest one any seed
        // finds). A candidate that only matches the yield must cut the bill.
        const better =
          candidate.mutations.length > best ||
          (candidate.mutations.length === best &&
            candidate.placements.length < response.placements.length);
        if (!better) continue;
        // Only a layout that passes the same legality check may replace the
        // default one. A better number that cannot be validated is not better.
        if (!validateSolveResponse(candidate, FULL_PLOT, dataset).valid) continue;
        response = candidate;
        best = candidate.mutations.length;
        bestSeed = `0x${seed.toString(16)}`;
        winningSeed.set(mutation, seed);
      }
    } catch (err) {
      fail(`${mutation} (pruned=${pruned}) threw: ${err?.message ?? err}`);
    }
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    totalMs += ms;

    const legality = validateSolveResponse(response, FULL_PLOT, dataset);
    if (!legality.valid) {
      fail(
        `${mutation} (pruned=${pruned}) produced an ILLEGAL layout:\n  ` +
          legality.problems.join("\n  ")
      );
    }

    const entry = encode(mutation, pruned, response);

    // The encoding has to be lossless against the runtime's own decoder, or a
    // browser would serve a layout that is not the one that was validated here.
    const decoded = decodeEntry(entry, crops, sizes);
    if (!deepEqual(decoded, response)) {
      fail(
        `${mutation} (pruned=${pruned}) does not survive the encode/decode round trip.\n` +
          `  solved:  ${JSON.stringify(response).slice(0, 300)}\n` +
          `  decoded: ${JSON.stringify(decoded).slice(0, 300)}`
      );
    }

    entries.push(entry);
    row.ms[String(pruned)] = ms;
    row.yield[String(pruned)] = response.mutations.length;
    row.seed = row.seed ?? {};
    row.seed[String(pruned)] = bestSeed;
  }

  timings.push(row);
  const worst = Math.max(...Object.values(row.ms));
  console.log(
    `  ${mutation.padEnd(18)} ` +
      `yield ${String(row.yield.true).padStart(3)}/${String(row.yield.false).padStart(3)}  ` +
      `${worst.toFixed(0).padStart(5)}ms worst`
  );
}

// ---------------------------------------------------------------------------
// the file
// ---------------------------------------------------------------------------

const asset = {
  version: PRECOMPUTE_VERSION,
  generatedAt: new Date().toISOString(),
  fingerprint,
  crops,
  sizes,
  entries,
};

/**
 * One entry per line.
 *
 * `JSON.stringify(asset, null, 2)` would put every coordinate on its own line
 * and turn a layout change into a thousand-line diff. This keeps the file
 * reviewable: one line per solved plot, so a diff shows exactly which layouts
 * moved.
 */
const serialise = (value) =>
  [
    "{",
    `  "version": ${JSON.stringify(value.version)},`,
    `  "generatedAt": ${JSON.stringify(value.generatedAt)},`,
    `  "fingerprint": ${JSON.stringify(value.fingerprint)},`,
    `  "crops": ${JSON.stringify(value.crops)},`,
    `  "sizes": ${JSON.stringify(value.sizes)},`,
    `  "entries": [`,
    value.entries.map((entry) => `    ${JSON.stringify(entry)}`).join(",\n"),
    "  ]",
    "}",
    "",
  ].join("\n");

const text = serialise(asset);
const kb = (text.length / 1024).toFixed(1);

console.log("");
console.log(`Solved ${entries.length} layouts in ${(totalMs / 1000).toFixed(2)}s of solver time`);
const sorted = [...timings].sort(
  (a, b) => Math.max(...Object.values(b.ms)) - Math.max(...Object.values(a.ms))
);
console.log("Slowest:");
for (const row of sorted.slice(0, 5)) {
  console.log(`  ${row.mutation.padEnd(18)} ${Math.max(...Object.values(row.ms)).toFixed(0)}ms`);
}
console.log("");

if (CHECK_ONLY) {
  if (!existsSync(OUT_PATH)) {
    console.error(`STALE: ${relative(ROOT, OUT_PATH)} does not exist. Run without --check.`);
    process.exit(1);
  }
  const committed = JSON.parse(readFileSync(OUT_PATH, "utf8"));
  const problems = [];
  if (committed.version !== asset.version) problems.push(`version ${committed.version} != ${asset.version}`);
  if (committed.fingerprint !== asset.fingerprint) {
    problems.push(`fingerprint ${committed.fingerprint} != ${asset.fingerprint}`);
  }
  if (!deepEqual(committed.crops, asset.crops)) problems.push("crop table differs");
  if (!deepEqual(committed.sizes, asset.sizes)) problems.push("size table differs");
  if (committed.entries?.length !== asset.entries.length) {
    problems.push(`entry count ${committed.entries?.length} != ${asset.entries.length}`);
  }

  /*
   * Yields are compared, layouts are not.
   *
   * The core's time budget is a wall clock deadline, so a slower machine can
   * legitimately return a different arrangement of the same quality. Failing
   * the build on that would make this check machine-specific noise. What must
   * not drift is the fingerprint, the entry set, and how good each answer is.
   */
  const yieldOf = (entry) => entry.spawns.length / 2;
  const committedYields = new Map(
    (committed.entries ?? []).map((entry) => [`${entry.mutation}|${entry.pruned}`, yieldOf(entry)])
  );
  for (const entry of asset.entries) {
    const key = `${entry.mutation}|${entry.pruned}`;
    const was = committedYields.get(key);
    if (was === undefined) problems.push(`${key} is missing from the committed file`);
    else if (was !== yieldOf(entry)) problems.push(`${key} yields ${yieldOf(entry)}, committed says ${was}`);
  }

  if (problems.length) {
    console.error(`STALE: ${relative(ROOT, OUT_PATH)} no longer matches the dataset:`);
    for (const problem of problems) console.error(`  ${problem}`);
    console.error("\nRegenerate it:  node tools/build-solver-precompute.mjs");
    process.exit(1);
  }
  console.log(`OK: ${relative(ROOT, OUT_PATH)} is current (${kb} KB).`);
  process.exit(0);
}

if (ONLY) {
  console.log(`--only was given, so nothing was written. Run without it to rebuild the asset.`);
  process.exit(0);
}

writeFileSync(OUT_PATH, text, "utf8");
console.log(`Wrote ${relative(ROOT, OUT_PATH)} (${kb} KB)`);
