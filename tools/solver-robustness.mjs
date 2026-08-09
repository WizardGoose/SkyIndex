#!/usr/bin/env node
/**
 * How much of the solver's quality is earned, and how much is seed luck.
 *
 * tools/solver-parity.mjs answers "is the shipped answer as good as the remote's".
 * This answers a different and harder question: "would the shipped answer still
 * be that good if anything moved". The two are separate on purpose. Parity
 * grades ONE configuration, the one that ships, because grading anything else
 * is how six phantom failures got onto the board (see the SEED note in
 * solver-parity.mjs). This file is where the other seeds are allowed to speak.
 *
 * Two sweeps:
 *
 *   SEED SPREAD   every mutation, several seeds. A mutation whose shipped
 *                 answer sits ABOVE its own cross-seed median is flagged
 *                 FRAGILE: we are not beating the alternatives, we are winning
 *                 a coin toss that happened to land our way, and a dataset
 *                 change can re-toss it.
 *
 *   GRID MASKS    the full 10x10 plot is what the harness measures and what
 *                 the precompute ships, but it is NOT what most players have.
 *                 A player part way through unlocking has an irregular plot.
 *                 This sweeps random masks to prove quality degrades smoothly
 *                 with the cells available rather than collapsing off the
 *                 canonical grid.
 *
 * Every answer is re-validated with validateSolveResponse. A number this tool
 * prints without `legal` beside it is worth nothing.
 *
 * Usage:
 *   node tools/solver-robustness.mjs              both sweeps
 *   node tools/solver-robustness.mjs --seeds-only
 *   node tools/solver-robustness.mjs --masks-only
 *   node tools/solver-robustness.mjs --seed-count 8
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const DATA_PATH = join(ROOT, "public", "greenhouse", "data.json");
const SOLVER_PATH = join(ROOT, "src", "greenhouse", "solver", "index.ts");

const argv = process.argv.slice(2);
const has = (flag) => argv.includes(flag);
const numArg = (flag, fallback) => {
  const i = argv.indexOf(flag);
  if (i === -1) return fallback;
  const v = Number(argv[i + 1]);
  return Number.isFinite(v) ? v : fallback;
};

const data = JSON.parse(readFileSync(DATA_PATH, "utf8"));
const withIds = (record) =>
  Object.fromEntries(Object.entries(record).map(([id, value]) => [id, { ...value, id }]));
const dataset = { mutations: withIds(data.mutations), crops: withIds(data.crops) };

if (!existsSync(SOLVER_PATH)) {
  console.error(`FATAL: ${SOLVER_PATH} does not exist`);
  process.exit(2);
}
const mod = await import(pathToFileURL(SOLVER_PATH).href);
const { solveLocal, validateSolveResponse, solveGoals, FULL_PLOT } = mod;
for (const [name, fn] of Object.entries({ solveLocal, validateSolveResponse, solveGoals })) {
  if (typeof fn !== "function") {
    console.error(`FATAL: solver does not export ${name}`);
    process.exit(2);
  }
}

/** The seed the product actually ships, from solveLocal's DEFAULTS. */
const SHIPPED_SEED = 0x5eed_1234;

/**
 * Alternative seeds, spread by a Knuth multiplicative step.
 *
 * Deterministic so two runs of this tool are comparable, and deliberately NOT
 * round numbers: a seed like 1 or 42 can land on a degenerate RNG path and
 * would make the spread look like a property of the solver rather than of the
 * seed.
 */
const altSeeds = (count) =>
  Array.from({ length: count }, (_, i) => ((i + 1) * 2654435761) >>> 0);

const median = (values) => {
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

const pad = (s, n) => String(s ?? "").padEnd(n);
const rp = (s, n) => String(s ?? "").padStart(n);

/** One solve, always re-validated. Returns null yield when the solver refuses. */
const solve = (cells, ids, options) => {
  const started = Date.now();
  let response;
  try {
    response = solveLocal(cells, solveGoals(ids), dataset, options);
  } catch (err) {
    return { error: `${err?.name}: ${err?.message}`, ms: Date.now() - started };
  }
  let legal = false;
  let problems = [];
  try {
    const report = validateSolveResponse(response, cells, dataset);
    legal = report.valid === true;
    problems = report.problems ?? [];
  } catch (err) {
    problems = [`validator threw: ${err?.message}`];
  }
  return { yield: response.mutations.length, status: response.status, legal, problems, ms: Date.now() - started };
};

const mutationIds = Object.keys(dataset.mutations).sort();
const lines = [];
const say = (s = "") => {
  lines.push(s);
  console.log(s);
};

let anyIllegal = false;

// ---------------------------------------------------------------------------
// seed spread
// ---------------------------------------------------------------------------
const fragile = [];
if (!has("--masks-only")) {
  const count = numArg("--seed-count", 5);
  const seeds = altSeeds(count);
  say("");
  say(`SEED SPREAD  (${mutationIds.length} mutations x ${seeds.length + 1} seeds: shipped + ${seeds.length} alternates)`);
  say("-".repeat(104));
  say(
    `${pad("mutation", 20)}${rp("shipped", 8)}${rp("min", 6)}${rp("med", 7)}${rp("max", 6)}${rp("spread", 8)}  ${pad("legal", 7)}verdict`
  );
  say("-".repeat(104));

  for (const id of mutationIds) {
    const shipped = solve(FULL_PLOT, [id], { seed: SHIPPED_SEED });
    if (shipped.error) {
      say(`${pad(id, 20)}${rp("ERR", 8)}  ${shipped.error}`);
      continue;
    }
    const others = seeds.map((seed) => solve(FULL_PLOT, [id], { seed }));
    const ys = others.map((o) => o.yield ?? 0);
    const allLegal = shipped.legal && others.every((o) => o.legal);
    if (!allLegal) anyIllegal = true;

    const med = median(ys);
    const min = Math.min(...ys);
    const max = Math.max(...ys);
    const spread = max - min;

    /*
     * A zero-yield mutation is one the dataset says no layout can produce
     * (godseed, jerryflower, shellfruit). Steady at zero is correct, not
     * fragile, so it is reported as INERT rather than scored.
     */
    let verdict;
    if (shipped.yield === 0 && max === 0) verdict = "INERT";
    else if (spread === 0) verdict = "STABLE";
    else if (shipped.yield > med) verdict = "FRAGILE";
    else if (shipped.yield < med) verdict = "UNLUCKY";
    else verdict = "VARIES";

    if (verdict === "FRAGILE" || verdict === "UNLUCKY") {
      fragile.push({ id, shipped: shipped.yield, med, min, max, spread, verdict });
    }

    say(
      `${pad(id, 20)}${rp(shipped.yield, 8)}${rp(min, 6)}${rp(med, 7)}${rp(max, 6)}${rp(spread, 8)}  ${pad(allLegal ? "yes" : "NO", 7)}${verdict}`
    );
  }

  say("");
  if (fragile.length === 0) {
    say("  No mutation depends on seed luck: every shipped answer is at or below its own");
    say("  cross-seed median, so none of the headline numbers are a coin toss we won.");
  } else {
    say(`  ${fragile.length} mutation(s) where the shipped seed is not simply typical:`);
    for (const f of fragile) {
      say(
        `    ${pad(f.id, 20)} shipped ${f.shipped} against a median of ${f.med} (range ${f.min}-${f.max})  ${f.verdict}`
      );
    }
    say("");
    say("  FRAGILE means the shipped seed beats the median: the number is luck we are");
    say("  keeping, and a dataset change re-rolls it. UNLUCKY means the opposite, and is");
    say("  a straightforward loss: another seed does better than the one we ship.");
  }
}

// ---------------------------------------------------------------------------
// grid masks
// ---------------------------------------------------------------------------
if (!has("--seeds-only")) {
  /** Deterministic PRNG so the masks are the same set every run. */
  const mulberry32 = (a) => () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  /**
   * A player's plot, not the harness's.
   *
   * Contiguity is not enforced: the expansion planner already answers
   * disconnected plots that the remote timed out on, and an unlockable
   * greenhouse genuinely can be ragged. What matters here is that quality falls
   * off smoothly with the cells available rather than collapsing the moment the
   * grid stops being the canonical 100.
   */
  const maskOf = (rng, keep) => {
    const cells = FULL_PLOT.map((c) => c);
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    return cells.slice(0, keep).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  };

  const maskCount = numArg("--masks", 8);
  const sample = ["gloomgourd", "veilshroom", "soggybud", "ashwreath", "witherbloom", "glasscorn"].filter(
    (id) => dataset.mutations[id]
  );

  say("");
  say(`GRID MASKS  (${maskCount} deterministic masks x ${sample.length} mutations, shipped seed)`);
  say("-".repeat(104));
  say("  The full plot is what parity measures and what the precompute ships. It is not");
  say("  what a player part way through unlocking has. Quality should fall with the cells");
  say("  available, never fall off a cliff because the grid stopped being canonical.");
  say("");
  say(`${pad("mask", 16)}${rp("cells", 6)}  ${sample.map((s) => rp(s.slice(0, 11), 12)).join("")}`);
  say("-".repeat(104));

  const rng = mulberry32(0x9e3779b9);
  let maskIllegal = 0;
  let maskRuns = 0;
  const perMutationFull = {};
  for (const id of sample) perMutationFull[id] = solve(FULL_PLOT, [id], { seed: SHIPPED_SEED }).yield ?? 0;

  say(`${pad("full plot", 16)}${rp(100, 6)}  ${sample.map((s) => rp(perMutationFull[s], 12)).join("")}`);

  for (let m = 0; m < maskCount; m++) {
    // 60 to 95 cells: the range an unlocking player actually sits in.
    const keep = 60 + Math.floor(rng() * 36);
    const cells = maskOf(rng, keep);
    const cols = [];
    for (const id of sample) {
      const r = solve(cells, [id], { seed: SHIPPED_SEED });
      maskRuns++;
      if (r.error) {
        cols.push(rp("ERR", 12));
        continue;
      }
      if (!r.legal) {
        maskIllegal++;
        anyIllegal = true;
        cols.push(rp(`${r.yield}!ILLEGAL`, 12));
      } else {
        cols.push(rp(r.yield, 12));
      }
    }
    say(`${pad(`mask ${m + 1}`, 16)}${rp(keep, 6)}  ${cols.join("")}`);
  }

  say("");
  say(
    maskIllegal === 0
      ? `  ${maskRuns} masked solves, every one legal against the cells it was given.`
      : `  ${maskIllegal} of ${maskRuns} masked solves returned an ILLEGAL layout. That is a correctness bug, not a quality one.`
  );
}

say("");
say(anyIllegal ? "RESULT: FAIL (an illegal layout was returned)" : "RESULT: PASS (no illegal layout in any sweep)");
say("");

/*
 * Exit code tracks LEGALITY only, deliberately. Fragility is information the
 * reader needs, not a gate: a mutation can be seed-sensitive and still be the
 * best answer anyone has. An illegal layout is never acceptable, so that is the
 * one thing this tool refuses to pass.
 */
process.exit(anyIllegal ? 1 : 0);
