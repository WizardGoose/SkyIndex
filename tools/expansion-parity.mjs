#!/usr/bin/env node
/**
 * Parity harness for the greenhouse expansion optimizer.
 *
 *   node tools/expansion-parity.mjs            compare against the baseline
 *   node tools/expansion-parity.mjs --capture  re-record the baseline (network)
 *   node tools/expansion-parity.mjs --json
 *
 * The quantity under test is the gloomgourd POTENTIAL of an unlocked set: the
 * most gloomgourd spawns any layout can produce on those cells. That is the
 * whole semantic content of the remote endpoint. Its step ORDER is a greedy
 * recommendation on top, and greedy tie-breaks are not a specification, so
 * they are reported but not gated.
 *
 * The remote answers were recorded once by --capture and committed. Normal
 * runs read the baseline and never touch the network, exactly like
 * tools/solver-parity.mjs.
 *
 * WHAT IT IS ACTUALLY GUARDING
 * ----------------------------
 * A potential is a promise that a layout exists. So every local answer is
 * re-counted here by countCoverage, which walks the returned layout cell by
 * cell and checks the pumpkin-and-melon rule directly, rather than trusting
 * the number the search reported about itself. A layout whose recount
 * disagrees with its claimed score is a hard failure regardless of parity.
 *
 * Exits non-zero when a local answer is below the remote's, or when any
 * recount disagrees, so it can gate a release.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const BASELINE_PATH = join(HERE, "expansion-parity-baseline.json");
const POTENTIAL_PATH = join(ROOT, "src", "greenhouse", "expansion", "potential.ts");
const REMOTE = "https://api.skyshards.com/greenhouse/expansion";

const argv = process.argv.slice(2);
const CAPTURE = argv.includes("--capture");
const AS_JSON = argv.includes("--json");
const say = (...a) => (AS_JSON ? console.error(...a) : console.log(...a));

const ALL = [];
for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) ALL.push([r, c]);
const key = ([r, c]) => `${r},${c}`;

const rect = (rows, cols, r0 = 0, c0 = 0) => {
  const out = [];
  for (let r = r0; r < r0 + rows; r++) for (let c = c0; c < c0 + cols; c++) out.push([r, c]);
  return out;
};

/** Deterministic PRNG so the sampled shapes are identical on every machine. */
const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const scatter = (count, seed) => {
  const next = rng(seed);
  const pool = ALL.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
};

const DIAMOND = [];
for (let r = 3; r <= 6; r++) {
  for (let c = 3; c <= 6; c++) {
    if (!((r === 3 || r === 6) && (c === 3 || c === 6))) DIAMOND.push([r, c]);
  }
}

/** A ring of cells with a hollow middle, to exercise disconnected coverage. */
const RING = ALL.filter(([r, c]) => r === 0 || c === 0 || r === 9 || c === 9);
/** An L, to exercise a boundary that bends. */
const ELL = ALL.filter(([r, c]) => r >= 6 || c <= 3);

const SAMPLE = [
  ["default-diamond-12", DIAMOND],
  ["corner-3x3", rect(3, 3)],
  ["rect-4x4", rect(4, 4)],
  ["rect-5x5", rect(5, 5)],
  ["rect-6x6", rect(6, 6)],
  ["rect-7x7", rect(7, 7)],
  ["rect-8x8", rect(8, 8)],
  ["rect-9x9", rect(9, 9)],
  ["rect-2x10", rect(2, 10)],
  ["rect-10x2", rect(10, 2)],
  ["rect-5x10", rect(5, 10)],
  ["band-3x10", rect(3, 10)],
  ["ring-outer", RING],
  ["ell-shape", ELL],
  ["full-minus-corner", ALL.filter((p) => key(p) !== "9,9")],
  ["full-minus-centre", ALL.filter((p) => key(p) !== "4,4")],
  ["diamond-plus-8", DIAMOND.concat(rect(2, 4, 7, 3))],
  ["scatter-20", scatter(20, 1)],
  ["scatter-35", scatter(35, 2)],
  ["scatter-50", scatter(50, 3)],
  ["scatter-65", scatter(65, 4)],
  ["scatter-80", scatter(80, 5)],
  ["centre-block-6x6", rect(6, 6, 2, 2)],
  ["two-bands", rect(3, 10, 0, 0).concat(rect(3, 10, 6, 0))],
];

const lockedFor = (unlocked) => {
  const set = new Set(unlocked.map(key));
  return ALL.filter((p) => !set.has(key(p)));
};

const maskOf = (unlocked) => {
  const mask = new Uint8Array(100);
  for (const [r, c] of unlocked) mask[r * 10 + c] = 1;
  return mask;
};

// ---------------------------------------------------------------------------
// capture
// ---------------------------------------------------------------------------

const capture = async () => {
  const out = {
    captured_at: new Date().toISOString(),
    source: REMOTE,
    note:
      "gloomgourd potential of the unlocked set, read back as steps[0].gloomgourd_potential " +
      "minus steps[0].gloomgourd_gain. Recorded once; the comparison run is offline.",
    cases: {},
  };
  for (const [name, unlocked] of SAMPLE) {
    const locked = lockedFor(unlocked);
    if (locked.length === 0) continue;
    let body;
    try {
      // The endpoint is someone else's server and this is the only place that
      // touches it. A capture that hangs is worse than one that skips a case.
      const res = await fetch(REMOTE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unlocked_cells: unlocked, locked_cells: locked }),
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) {
        say(`  ${name}: HTTP ${res.status}, skipped`);
        continue;
      }
      body = await res.json();
    } catch (err) {
      say(`  ${name}: ${err instanceof Error ? err.name : "failed"}, skipped`);
      continue;
    }
    const first = body.steps[0];
    out.cases[name] = {
      unlocked_count: unlocked.length,
      potential: first.gloomgourd_potential - first.gloomgourd_gain,
      final: body.final_gloomgourd_count,
      total_steps: body.total_steps,
      first_cell: first.cell,
    };
    say(`  ${name}: potential ${out.cases[name].potential}, final ${out.cases[name].final}`);
  }
  writeFileSync(BASELINE_PATH, JSON.stringify(out, null, 1));
  say(`\nwrote ${BASELINE_PATH} with ${Object.keys(out.cases).length} cases`);
};

// ---------------------------------------------------------------------------
// compare
// ---------------------------------------------------------------------------

const compare = async () => {
  if (!existsSync(BASELINE_PATH)) {
    console.error(`no baseline at ${BASELINE_PATH}; run with --capture first`);
    process.exit(2);
  }
  const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
  const mod = await import(pathToFileURL(POTENTIAL_PATH).href);
  const { gloomgourdPotential, countCoverage } = mod;

  const rows = [];
  let beat = 0;
  let match = 0;
  let below = 0;
  let illegal = 0;

  for (const [name, unlocked] of SAMPLE) {
    const recorded = baseline.cases[name];
    if (!recorded) continue;
    const mask = maskOf(unlocked);
    const startedAt = Date.now();
    const local = gloomgourdPotential(mask);
    const ms = Date.now() - startedAt;

    // Never trust the search's own arithmetic: walk the layout and recount.
    const recount = countCoverage(mask, local.assignment);
    const legal = recount === local.value;
    if (!legal) illegal++;

    let verdict;
    if (local.value > recorded.potential) {
      verdict = "BEAT";
      beat++;
    } else if (local.value === recorded.potential) {
      verdict = "MATCH";
      match++;
    } else {
      verdict = "BELOW";
      below++;
    }
    rows.push({
      name,
      cells: unlocked.length,
      remote: recorded.potential,
      local: local.value,
      recount,
      bound: local.bound,
      proved: local.proved,
      legal,
      verdict,
      ms,
    });
  }

  if (AS_JSON) {
    console.log(JSON.stringify({ rows, beat, match, below, illegal }, null, 1));
  } else {
    say("");
    say("case                  cells  remote  local  recount  bound  label        verdict    ms");
    say("---------------------------------------------------------------------------------------");
    for (const r of rows) {
      const label = r.proved ? "OPTIMAL" : "BEST-KNOWN";
      say(
        `${r.name.padEnd(21)} ${String(r.cells).padStart(5)}  ${String(r.remote).padStart(6)}  ` +
          `${String(r.local).padStart(5)}  ${String(r.recount).padStart(7)}  ` +
          `${String(r.bound).padStart(5)}  ${label.padEnd(11)}  ` +
          `${(r.legal ? r.verdict : "ILLEGAL").padEnd(9)} ${String(r.ms).padStart(5)}`
      );
    }
    say("---------------------------------------------------------------------------------------");
    say(`BEAT ${beat}   MATCH ${match}   BELOW ${below}   ILLEGAL ${illegal}`);
  }

  if (illegal > 0 || below > 0) process.exit(1);
};

if (CAPTURE) await capture();
else await compare();
