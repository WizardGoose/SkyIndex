/**
 * Old model vs new model, side by side, on the Rose Dragon plan.
 *
 *   npx tsx tools/time-model-compare.mjs
 *   npx tsx tools/time-model-compare.mjs --plots 3
 *   npx tsx tools/time-model-compare.mjs --growth 200 --tier 9 --plots 3
 *   npx tsx tools/time-model-compare.mjs --support quarter
 *   npx tsx tools/time-model-compare.mjs timestalk godseed
 *
 * Run through tsx, not plain node: this imports the TypeScript model directly
 * so the numbers printed here are the ones the module actually produces, with
 * no second implementation to drift out of sync.
 *
 * The old model is not re-implemented either. It is imported from
 * `planner/time.ts` and aggregated exactly the way `PlannerPage` aggregates
 * it, summing every mutation's plantings rather than overlapping them. That
 * makes the delta attributable to the model change and nothing else.
 *
 * Solver answers are cached in the scratchpad, so the second run is instant
 * and works offline.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildPlanEstimates } from "../src/greenhouse/planner/planEstimates.ts";
import { buildSolverPlan, collectMutations } from "../src/greenhouse/planner/solverPlan.ts";
import { formatDuration, plantingSeconds, stageSeconds, totalSeconds } from "../src/greenhouse/planner/time.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
/**
 * The same checked-in economies tools/solver-plan.ts reads. Both used to share
 * an incidental copy under node_modules/.cache, which meant this comparison
 * could quietly change meaning when something else rebuilt that file.
 * Regenerate with `pnpm data:economies`.
 */
const CACHE = join(ROOT, "tools", "fixtures", "greenhouse-economies.json");

// ---------------------------------------------------------------------------
// arguments
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const value = argv[i + 1];
  argv.splice(i, 2);
  return value;
};

const plots = Number(flag("plots", 1));
const cropGrowth = Number(flag("growth", 0));
const speedTier = Number(flag("tier", 0));
const supportRule = flag("support", "share");
const bioanalysis = flag("bio", "none");

/** Rose Dragon Egg: one of each of the five legendary mutations. */
const ROSE_DRAGON = ["glasscorn", "devourer", "all_in_aloe", "phantomleaf", "timestalk"];
const targets = (argv.length ? argv : ROSE_DRAGON).map((id) => ({ id, qty: 1 }));

// ---------------------------------------------------------------------------
// dataset
// ---------------------------------------------------------------------------

const raw = JSON.parse(readFileSync(join(ROOT, "public/greenhouse/data.json"), "utf8"));
const withIds = (record) => Object.fromEntries(Object.entries(record).map(([id, value]) => [id, { ...value, id }]));
const data = { crops: withIds(raw.crops), mutations: withIds(raw.mutations) };

// ---------------------------------------------------------------------------
// solver economies (spots per plot), cached
// ---------------------------------------------------------------------------

const CELLS = [];
for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) CELLS.push([r, c]);

const solveEconomy = async (id) => {
  try {
    const res = await fetch("https://api.skyshards.com/greenhouse/solver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ req: { cells: CELLS, targets: [{ mutation: id, maximize: true, count: null }], remove_unused_crops: true } }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const crops = {};
    for (const p of json.placements ?? []) crops[p.crop] = (crops[p.crop] ?? 0) + 1;
    const yields = (json.mutations ?? []).length;
    return yields > 0 ? { yield: yields, crops } : null;
  } catch {
    return null;
  }
};

const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};
const involved = collectMutations(targets, data);
const missing = involved.filter((id) => !(id in cache));

if (missing.length) {
  process.stderr.write(`Solving ${missing.length} mutations against the greenhouse solver...\n`);
  for (let i = 0; i < missing.length; i += 5) {
    const slice = missing.slice(i, i + 5);
    const results = await Promise.all(slice.map(solveEconomy));
    slice.forEach((id, n) => (cache[id] = results[n]));
  }
  mkdirSync(dirname(CACHE), { recursive: true });
  writeFileSync(CACHE, JSON.stringify(cache, null, 1));
}

const economies = Object.fromEntries(involved.map((id) => [id, cache[id] ?? null]));
const plan = buildSolverPlan(targets, data, economies);

// ---------------------------------------------------------------------------
// the two models
// ---------------------------------------------------------------------------

const growth = { cropGrowth, speedTier, plots, uniqueCrops: 0, supportRule, bioanalysis };

/*
 * The NEW column comes from `buildPlanEstimates`, which is the same function
 * the Planner page and `pnpm check` call. There is one estimate path in the
 * codebase and this tool is on it, so a number printed here is a number the UI
 * would show under the same settings.
 *
 * The OLD column is still computed here from `planner/time.ts` directly rather
 * than read off the model. That keeps the comparison honest: the baseline is
 * the shipped deterministic code, not the new model's own idea of what the old
 * one said.
 */
const estimates = buildPlanEstimates(plan, data, economies, growth);

const rows = [];
for (const cycle of plan.cycles) {
  for (const node of cycle.produce) {
    if (node.plots === undefined) continue;
    const next = estimates.byId[node.id];
    if (!next) continue;

    const economy = economies[node.id];
    const unique = economy ? Object.keys(economy.crops).length : undefined;

    // --- old model, exactly as PlannerPage used to compute it ---
    const per = plantingSeconds(node.id, data, growth, unique);
    const oldSeconds = per === null ? 0 : totalSeconds(node.plots, per, plots);

    rows.push({ cycle: cycle.index, node, oldSeconds, next, spots: next.spots });
  }
}

// ---------------------------------------------------------------------------
// report
// ---------------------------------------------------------------------------

const pad = (s, n) => String(s).padEnd(n);
const padStart = (s, n) => String(s).padStart(n);

console.log(`TARGET: ${targets.map((t) => data.mutations[t.id]?.name ?? t.id).join(", ")}`);
console.log(
  `Settings: ${plots} plot${plots === 1 ? "" : "s"}, Crop Growth ${cropGrowth}, Growth Speed tier ${speedTier}, ` +
    `crop-support rule "${supportRule}", bioanalysis "${bioanalysis}"`
);
console.log(`One stage at 12 unique crops: ${formatDuration(stageSeconds({ cropGrowth, speedTier, uniqueCrops: 12 }))}\n`);

console.log(pad("", 22) + padStart("need", 6) + padStart("spots", 6) + padStart("p", 7) + padStart("win", 5) + padStart("OLD", 10) + padStart("NEW exp", 10) + padStart("NEW p90", 10) + padStart("x", 6));
console.log("-".repeat(82));

let oldTotal = 0;
let newTotal = 0;
let p90Total = 0;

for (const cycle of plan.cycles) {
  const inCycle = rows.filter((r) => r.cycle === cycle.index);
  if (!inCycle.length) continue;

  console.log(`--- Cycle ${cycle.index + 1} ---`);
  let oldCycle = 0;
  let newCycle = 0;
  let p90Cycle = 0;

  for (const { node, oldSeconds, next, spots } of inCycle) {
    oldCycle += oldSeconds;
    newCycle += next.expectedSeconds;
    p90Cycle += next.p90Seconds;

    const ratio = oldSeconds > 0 ? (next.expectedSeconds / oldSeconds).toFixed(2) : "-";
    const chance = next.mechanicOnly ? "mech" : `${(next.spawnChance * 100).toFixed(0)}%`;
    const window = next.mechanicOnly ? "-" : String(next.harvestWindow);

    console.log(
      "  " +
        pad(node.name, 20) +
        padStart(node.need, 6) +
        padStart(spots, 6) +
        padStart(chance, 7) +
        padStart(window, 5) +
        padStart(formatDuration(oldSeconds), 10) +
        padStart(formatDuration(next.expectedSeconds), 10) +
        padStart(formatDuration(next.p90Seconds), 10) +
        padStart(ratio, 6)
    );
  }

  console.log(
    "  " +
      pad("cycle subtotal", 20) +
      padStart("", 6) +
      padStart("", 6) +
      padStart("", 7) +
      padStart("", 5) +
      padStart(formatDuration(oldCycle), 10) +
      padStart(formatDuration(newCycle), 10) +
      padStart(formatDuration(p90Cycle), 10) +
      padStart(oldCycle > 0 ? (newCycle / oldCycle).toFixed(2) : "-", 6)
  );

  oldTotal += oldCycle;
  newTotal += newCycle;
  p90Total += p90Cycle;
}

console.log("-".repeat(82));
console.log(
  "  " +
    pad("TOTAL", 20) +
    padStart("", 6) +
    padStart("", 6) +
    padStart("", 7) +
    padStart("", 5) +
    padStart(formatDuration(oldTotal), 10) +
    padStart(formatDuration(newTotal), 10) +
    padStart(formatDuration(p90Total), 10) +
    padStart(oldTotal > 0 ? (newTotal / oldTotal).toFixed(2) : "-", 6)
);

console.log(`\nOld model:  ${formatDuration(oldTotal)}`);
console.log(`New model:  ${formatDuration(newTotal)} expected, 90% done within ~${formatDuration(p90Total)}`);
console.log(`The honest model is ${(newTotal / oldTotal).toFixed(2)}x the old estimate.`);
console.log(
  `\nNote: the p90 column sums each mutation's own p90, which assumes every one of them runs unlucky at once.\n` +
    `That is a conservative upper bound, not a true p90 of the whole grind.`
);

const mech = rows.filter((r) => r.next.mechanicOnly).map((r) => r.node.name);
if (mech.length) console.log(`\nMechanic-only (no spawn roll, excluded from the chance model): ${mech.join(", ")}`);
