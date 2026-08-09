#!/usr/bin/env node
/**
 * Capture a permanent baseline of the REMOTE greenhouse solver's answers.
 *
 *   node tools/fetch-parity-baseline.mjs                # capture everything missing
 *   node tools/fetch-parity-baseline.mjs --only snoozling
 *   node tools/fetch-parity-baseline.mjs --refresh      # re-hit everything
 *   node tools/fetch-parity-baseline.mjs --determinism snoozling
 *
 * WHY THIS EXISTS
 * ---------------
 * The app used to POST every greenhouse solve to api.skyshards.com - Campion's
 * server, someone else's bandwidth. We are replacing that with an in-browser
 * solver. To claim the local solver "matches or beats the remote" we need the
 * remote's answers written down once, offline, so the comparison can be re-run
 * forever without touching their machine again.
 *
 * This script is the ONLY thing in the repo allowed to call that endpoint, and
 * it is a developer tool - it never runs in the shipped app.
 *
 * BEING A GOOD CITIZEN
 * --------------------
 * Strictly sequential. A deliberate pause between every request. A User-Agent
 * that says who we are and why. Generous timeouts so we never hammer a slow
 * solve with a retry. Retries only on things a retry can actually fix (network
 * failure, timeout, 5xx, 429) - a 4xx is the server telling us "no", so we
 * record that verbatim and move on instead of asking twice more.
 *
 * The output (tools/solver-parity-baseline.json) is key-sorted so re-captures
 * diff cleanly, and is merged rather than overwritten so a partial run resumes.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const DATA_PATH = join(ROOT, "public", "greenhouse", "data.json");
const OUT_PATH = join(HERE, "solver-parity-baseline.json");

const ENDPOINT = "https://api.skyshards.com/greenhouse/solver";
const USER_AGENT =
  "wizard-skyblock-parity-baseline/1.0 (one-off offline capture; verifying a local solver replacement so this site stops calling api.skyshards.com)";

const GRID = 10;
/** Every cell of a full, fully-unlocked 10x10 plot. */
const FULL_PLOT = Array.from({ length: GRID * GRID }, (_, i) => [Math.floor(i / GRID), i % GRID]);

const REQUEST_TIMEOUT_MS = 120_000; // solves can be slow; never time out early and retry on top of a live solve
const PAUSE_MS = 600; // deliberate spacing between requests
const MAX_TRIES = 3;
const BACKOFF_MS = [1_000, 2_000, 4_000];

/**
 * Multi-target configurations worth pinning down.
 *
 * Single targets tell us peak density for one mutation; these tell us how the
 * remote trades cells between goals, which is the part a naive local solver is
 * most likely to get wrong. Deliberately spread across sizes: two 1x1s that
 * share nothing, two 1x1s that share a crop, a 1x1 next to a 2x2 and a 3x3,
 * and two three-way mixes.
 */
const MULTI_TARGETS = [
  ["choconut", "dustgrain"], // two 1x1 commons, one requirement each
  ["ashwreath", "veilshroom"], // two 1x1 commons, two requirements each
  ["dustgrain", "noctilume"], // 1x1 alongside a 2x2
  ["witherbloom", "snoozling"], // 1x1 alongside a 3x3 with five requirements
  ["choconut", "duskbloom", "noctilume"], // three-way: common, dense 1x1, 2x2
  ["dustgrain", "glasscorn", "snoozling"], // three-way across all three sizes
];

const VARIANTS = [true, false]; // remove_unused_crops - planner uses true, solver page uses false

// ---------------------------------------------------------------------------
// arguments
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const value = (name) => {
  const i = argv.indexOf(name);
  if (i === -1) return null;
  const next = argv[i + 1];
  return next && !next.startsWith("--") ? next : null;
};

const ONLY = value("--only");
const REFRESH = flag("--refresh");
const DETERMINISM = flag("--determinism") ? (value("--determinism") ?? "snoozling") : null;

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Stable signature for a target set: sorted ids joined, so lookup never depends on call order. */
const signature = (ids) => [...ids].sort().join("+");

/** Recursively sort object keys so the JSON diffs cleanly. Array order is meaningful and preserved. */
const sortDeep = (v) => {
  if (Array.isArray(v)) return v.map(sortDeep);
  if (v && typeof v === "object") {
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = sortDeep(v[k]);
    return out;
  }
  return v;
};

/** How many of each crop the layout plants, and how many distinct kinds. */
const cropSummary = (placements) => {
  const counts = {};
  for (const p of placements ?? []) counts[p.crop] = (counts[p.crop] ?? 0) + 1;
  return { crop_counts: counts, distinct_crops: Object.keys(counts).length };
};

/** A layout fingerprint: crop + cell, order-independent. Used for the determinism check. */
const layoutFingerprint = (response) => {
  const plant = (response?.placements ?? []).map((p) => `${p.crop}@${p.position[0]},${p.position[1]}#${p.size}`).sort();
  const mut = (response?.mutations ?? []).map((m) => `${m.mutation}@${m.position[0]},${m.position[1]}#${m.size}`).sort();
  return JSON.stringify({ plant, mut });
};

// ---------------------------------------------------------------------------
// the one network call
// ---------------------------------------------------------------------------

/**
 * POST one solve. Returns { ok, response, ms, attempts } or { ok: false, error, ... }.
 * Never throws - a dead mutation must not abort a 90-request capture.
 */
async function solve(targetIds, removeUnusedCrops) {
  const body = JSON.stringify({
    req: {
      cells: FULL_PLOT,
      targets: targetIds.map((mutation) => ({ mutation, maximize: true, count: null })),
      remove_unused_crops: removeUnusedCrops,
    },
  });

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
    const started = Date.now();
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": USER_AGENT, Accept: "application/json" },
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      const ms = Date.now() - started;
      const text = await res.text();

      if (!res.ok) {
        // 4xx is the server saying "no" - asking twice more is rude and pointless.
        const retryable = res.status >= 500 || res.status === 429;
        lastError = { error: `HTTP ${res.status} ${res.statusText}`, http_status: res.status, body: text.slice(0, 4000), ms };
        if (!retryable) return { ok: false, attempts: attempt, ...lastError };
        if (attempt < MAX_TRIES) {
          console.log(`      retryable ${res.status}, backing off ${BACKOFF_MS[attempt - 1]}ms`);
          await sleep(BACKOFF_MS[attempt - 1]);
          continue;
        }
        return { ok: false, attempts: attempt, ...lastError };
      }

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        lastError = { error: "response was not JSON", body: text.slice(0, 4000), ms };
        if (attempt < MAX_TRIES) {
          await sleep(BACKOFF_MS[attempt - 1]);
          continue;
        }
        return { ok: false, attempts: attempt, ...lastError };
      }

      return { ok: true, response: parsed, ms, attempts: attempt };
    } catch (err) {
      const ms = Date.now() - started;
      lastError = { error: `${err?.name ?? "Error"}: ${err?.message ?? String(err)}`, ms };
      if (attempt < MAX_TRIES) {
        console.log(`      ${lastError.error} - backing off ${BACKOFF_MS[attempt - 1]}ms`);
        await sleep(BACKOFF_MS[attempt - 1]);
        continue;
      }
      return { ok: false, attempts: attempt, ...lastError };
    }
  }

  return { ok: false, attempts: MAX_TRIES, ...(lastError ?? { error: "unknown failure" }) };
}

/** Turn a raw solve result into the shape we persist. */
function toEntry(targetIds, removeUnusedCrops, result) {
  const base = {
    targets: targetIds.map((mutation) => ({ mutation, maximize: true, count: null })),
    remove_unused_crops: removeUnusedCrops,
    ms: result.ms ?? null,
    attempts: result.attempts,
    captured_at: new Date().toISOString(),
  };

  if (!result.ok) {
    return { ...base, error: result.error, http_status: result.http_status ?? null, error_body: result.body ?? null };
  }

  const r = result.response;
  const placements = r.placements ?? [];
  return {
    ...base,
    status: r.status ?? null,
    yield: (r.mutations ?? []).length,
    total_cells_used: r.total_cells_used ?? null,
    placement_count: placements.length,
    ...cropSummary(placements),
    cache_hit: r.cache_hit ?? null,
    response: r,
  };
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

const data = JSON.parse(readFileSync(DATA_PATH, "utf8"));
const mutationIds = Object.keys(data.mutations).sort();

const baseline = existsSync(OUT_PATH) ? JSON.parse(readFileSync(OUT_PATH, "utf8")) : {};
baseline.single ??= {};
baseline.multi ??= {};

/**
 * True once this run has actually captured something. A resume that finds
 * everything already cached must not bump the timestamp - otherwise a no-op
 * re-run shows up as a diff, which defeats the point of a stable file.
 */
let capturedAnything = false;

const write = () => {
  baseline.metadata = {
    captured_at: capturedAnything || !baseline.metadata?.captured_at ? new Date().toISOString() : baseline.metadata.captured_at,
    endpoint: ENDPOINT,
    grid: { rows: GRID, cols: GRID, cells: GRID * GRID },
    request_shape: 'POST {"req":{cells,targets,remove_unused_crops}} - targets are {mutation,maximize:true,count:null}',
    variants:
      'entries live under variants["true"] / variants["false"], keyed by the remove_unused_crops flag - the planner solves with true, the solver page with false',
    lookup: "single[mutationId].variants[flag] and multi[sortedIdsJoinedByPlus].variants[flag]",
    source_dataset: "public/greenhouse/data.json",
    tool: "tools/fetch-parity-baseline.mjs",
    note: "Captured baseline of the remote SkyShards solver, kept ONLY for offline verification of our local solver. The app itself no longer calls this service; nothing at runtime reads this file.",
  };
  writeFileSync(OUT_PATH, JSON.stringify(sortDeep(baseline), null, 2) + "\n", "utf8");
};

/** Work item list: every single-target mutation, then every multi-target config. */
const jobs = [];
for (const id of mutationIds) {
  if (ONLY && ONLY !== id) continue;
  for (const variant of VARIANTS) jobs.push({ kind: "single", key: id, ids: [id], variant });
}
for (const ids of MULTI_TARGETS) {
  const sig = signature(ids);
  // --only takes a mutation id for a single-target spot check, or a full
  // signature ("choconut+dustgrain") to re-do one multi config.
  if (ONLY && ONLY !== sig) continue;
  for (const variant of VARIANTS) jobs.push({ kind: "multi", key: sig, ids, variant });
}

const bucket = (job) => (job.kind === "single" ? baseline.single : baseline.multi);

const pending = jobs.filter((j) => REFRESH || !bucket(j)[j.key]?.variants?.[String(j.variant)]);

console.log(`endpoint     ${ENDPOINT}`);
console.log(`mutations    ${mutationIds.length} in dataset`);
console.log(`multi-target ${MULTI_TARGETS.length} configs`);
console.log(`work         ${pending.length} request(s) to make (${jobs.length - pending.length} already cached)`);
if (DETERMINISM) console.log(`determinism  repeat check on "${DETERMINISM}"`);
console.log(`pacing       ${PAUSE_MS}ms between requests, ${MAX_TRIES} tries max, ${REQUEST_TIMEOUT_MS / 1000}s timeout`);
console.log("");

const runStarted = Date.now();
const latencies = [];
let done = 0;
let failures = 0;

for (const job of pending) {
  done++;
  const label = `${job.ids.join("+")} [remove_unused_crops=${job.variant}]`;
  process.stdout.write(`[${String(done).padStart(3)}/${pending.length}] ${label.padEnd(52)}`);

  const result = await solve(job.ids, job.variant);
  const entry = toEntry(job.ids, job.variant, result);
  capturedAnything = true;

  const target = bucket(job);
  target[job.key] ??= {
    ...(job.kind === "single"
      ? { mutation: job.key, size: data.mutations[job.key]?.size ?? null, rarity: data.mutations[job.key]?.rarity ?? null }
      : { signature: job.key, mutations: job.ids }),
    variants: {},
  };
  target[job.key].variants[String(job.variant)] = entry;

  if (entry.error) {
    failures++;
    console.log(`ERROR ${entry.error}`);
  } else {
    latencies.push(entry.ms);
    console.log(`${String(entry.status).padEnd(10)} yield=${String(entry.yield).padStart(3)}  crops=${String(entry.distinct_crops).padStart(2)}  placed=${String(entry.placement_count).padStart(3)}  ${entry.ms}ms`);
  }

  write(); // save after every request so an interrupted run loses nothing
  if (done < pending.length || DETERMINISM) await sleep(PAUSE_MS);
}

// --- determinism: solve the same thing twice and compare the layouts ---------
if (DETERMINISM) {
  console.log(`\ndeterminism check: solving "${DETERMINISM}" twice more, remove_unused_crops=false`);
  capturedAnything = true;
  const runs = [];
  for (let i = 0; i < 2; i++) {
    const r = await solve([DETERMINISM], false);
    if (!r.ok) {
      console.log(`  run ${i + 1}: ERROR ${r.error}`);
      runs.push({ error: r.error, ms: r.ms ?? null });
    } else {
      console.log(`  run ${i + 1}: ${r.response.status} yield=${(r.response.mutations ?? []).length} cache_hit=${JSON.stringify(r.response.cache_hit ?? null)} ${r.ms}ms`);
      runs.push({
        status: r.response.status,
        yield: (r.response.mutations ?? []).length,
        cache_hit: r.response.cache_hit ?? null,
        ms: r.ms,
        fingerprint: layoutFingerprint(r.response),
      });
    }
    if (i === 0) await sleep(PAUSE_MS);
  }

  const cached = baseline.single[DETERMINISM]?.variants?.["false"];
  const all = [
    cached && !cached.error ? { label: "baseline", fingerprint: layoutFingerprint(cached.response), yield: cached.yield, ms: cached.ms, cache_hit: cached.cache_hit } : null,
    ...runs.map((r, i) => ({ label: `repeat_${i + 1}`, ...r })),
  ].filter(Boolean);

  const fps = all.map((r) => r.fingerprint).filter(Boolean);
  const identicalLayouts = fps.length > 1 && fps.every((f) => f === fps[0]);
  const yields = all.map((r) => r.yield).filter((y) => y != null);
  const identicalYields = yields.length > 1 && yields.every((y) => y === yields[0]);

  baseline.determinism = {
    mutation: DETERMINISM,
    remove_unused_crops: false,
    checked_at: new Date().toISOString(),
    identical_layouts: identicalLayouts,
    identical_yields: identicalYields,
    runs: all.map(({ fingerprint, ...rest }) => ({ ...rest, layout_hash: fingerprint ? hash(fingerprint) : null })),
  };

  console.log(`  identical layouts: ${identicalLayouts}   identical yields: ${identicalYields}`);
  write();
}

/** Tiny non-cryptographic digest, just so the JSON records "same/different" without storing the whole layout twice. */
function hash(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

write();

// --- summary ----------------------------------------------------------------
const totalMs = Date.now() - runStarted;
const sorted = [...latencies].sort((a, b) => a - b);
const mean = sorted.length ? Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length) : 0;
const median = sorted.length ? (sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)) : 0;

console.log("");
console.log(`wrote        ${OUT_PATH}`);
console.log(`requests     ${latencies.length} ok, ${failures} failed`);
console.log(`wall clock   ${(totalMs / 1000).toFixed(1)}s total (includes ${PAUSE_MS}ms pacing between calls)`);
if (sorted.length) {
  console.log(`latency      mean ${mean}ms   median ${median}ms   min ${sorted[0]}ms   max ${sorted[sorted.length - 1]}ms`);
}
