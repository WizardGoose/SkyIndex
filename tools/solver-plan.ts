/**
 * Solver-derived plan with honest times, run from the terminal.
 *
 *   pnpm check
 *   npx tsx tools/solver-plan.ts timestalk godseed
 *   npx tsx tools/solver-plan.ts --plots 3 --growth 200 --tier 9
 *   npx tsx tools/solver-plan.ts --bio artifact --support quarter
 *   npx tsx tools/solver-plan.ts --fresh
 *
 * Uses the exact same `buildSolverPlan` and `buildPlanEstimates` the app does,
 * so the terminal and the page can never drift apart. Demand is measured
 * against the greenhouse solver rather than assumed, and time is the
 * probabilistic expected value rather than the old best case.
 *
 * The solve itself is local: `solveLocal` from src/greenhouse/solver, the same
 * core the browser runs in its worker. This file makes no network call, so
 * `pnpm check` passes or fails on our own code and works with the cable out.
 *
 * Solver answers come from the CHECKED-IN fixture tools/fixtures/greenhouse-
 * economies.json, so repeat runs skip the search entirely and the reference
 * plan this prints only moves when someone deliberately moves it. Regenerate
 * with `pnpm data:economies`, which re-solves and prints every row that
 * changed; commit the fixture as a reviewed change.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildPlanEstimates, type EstimateSettings } from "../src/greenhouse/planner/planEstimates";
import { buildSolverPlan, collectMutations, type PlotEconomy } from "../src/greenhouse/planner/solverPlan";
import { DEFAULT_SIZING_MODE, SIZING_ROUNDS, sameSizing, sizingFor, type SizingMode } from "../src/greenhouse/planner/plotSizing";
import { formatDuration, stageSeconds } from "../src/greenhouse/planner/time";
import { solveGoal, solveLocal, shippedSolveOptions } from "../src/greenhouse/solver";
import type { SolverDataset } from "../src/greenhouse/solver";
/*
 * The pruning decision and the crop count come from the same place the page
 * reads them, so the terminal and the browser cannot cost a plot differently.
 */
import { cropBill, PRUNE_UNUSED_CROPS } from "../src/greenhouse/planner/useSolvedLayout";
import type { BioanalysisTier } from "../src/greenhouse/timeModel";
import type { CropDefinition, MutationDefinition } from "../src/greenhouse/types/greenhouse";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
/**
 * Checked-in reference economies.
 *
 * Deliberately NOT node_modules/.cache any more. The plan this tool prints is
 * used as a reference to diff against, and while the economies lived in an
 * incidental cache that reference rebased itself silently whenever the cache
 * was rebuilt. Regenerate with `pnpm data:economies`, read the diff it prints,
 * and commit the fixture as a reviewed change.
 *
 * The answers the REMOTE solver used to give are kept beside it in
 * greenhouse-economies.remote-provenance.json, so any move can be traced back
 * to where this project started rather than only to the previous commit.
 */
const CACHE = join(ROOT, "tools", "fixtures", "greenhouse-economies.json");

// ---------------------------------------------------------------------------
// arguments
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);

const flag = (name: string, fallback: string): string => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const value = argv[i + 1] ?? fallback;
  argv.splice(i, 2);
  return value;
};

const has = (name: string): boolean => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return false;
  argv.splice(i, 1);
  return true;
};

const fresh = has("fresh");
// Matches the page default. --confident asks for the 90%-in-one-sowing sizing.
const sizingMode: SizingMode = has("confident") ? "confident" : DEFAULT_SIZING_MODE;
const settings: EstimateSettings = {
  plots: Number(flag("plots", "1")),
  cropGrowth: Number(flag("growth", "0")),
  speedTier: Number(flag("tier", "0")),
  uniqueCrops: 0,
  bioanalysis: flag("bio", "none") as BioanalysisTier,
  supportRule: flag("support", "share") as "share" | "quarter",
};

// ---------------------------------------------------------------------------
// dataset
// ---------------------------------------------------------------------------

const raw = JSON.parse(readFileSync(join(ROOT, "public/greenhouse/data.json"), "utf8")) as {
  crops: Record<string, Omit<CropDefinition, "id">>;
  mutations: Record<string, Omit<MutationDefinition, "id">>;
};
const withIds = <T,>(rec: Record<string, T>): Record<string, T & { id: string }> =>
  Object.fromEntries(Object.entries(rec).map(([id, v]) => [id, { ...v, id }]));
const data = { crops: withIds(raw.crops), mutations: withIds(raw.mutations) } as {
  crops: Record<string, CropDefinition>;
  mutations: Record<string, MutationDefinition>;
};
// Same object, named for what the solver core wants. The two shapes are the
// same by construction: SolverDataset is exactly { crops, mutations } keyed by
// id, which is why the solver reads `.id` off each value and why withIds above
// has to put it back after JSON.parse.
const dataset: SolverDataset = data;

// ---------------------------------------------------------------------------
// solver economies (spots per plot), cached
// ---------------------------------------------------------------------------

const CELLS: [number, number][] = [];
for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) CELLS.push([r, c]);

/**
 * One optimal plot for one mutation, solved on this machine.
 *
 * This is the same `solveLocal` the browser runs in its worker, called the same
 * way the Planner page calls it (see planner/useSolverEconomies.ts): a full
 * 10x10 grid, one maximised target, removeUnusedCrops on so the plot is costed
 * by what it actually needs rather than by whatever the search happened to
 * leave standing. Options are otherwise defaulted, so the terminal and the page
 * solve the identical problem with the identical seed and budget.
 *
 * Synchronous, because the solver is. There is no network here.
 */
const solveEconomy = (id: string, spots?: number): PlotEconomy | null => {
  try {
    // Target mode when the plan has right-sized this row, maximize otherwise.
    // The same question `useSolverEconomies` asks, so the terminal and the page
    // cannot answer differently.
    const res = solveLocal(CELLS, [solveGoal(id, spots)], dataset, shippedSolveOptions(PRUNE_UNUSED_CROPS));
    const crops = cropBill(res.placements);
    const yields = res.mutations.length;
    return yields > 0 ? { yield: yields, crops } : null;
  } catch {
    return null;
  }
};

const ids = argv;
const targets = (ids.length ? ids : ["glasscorn", "devourer", "all_in_aloe", "phantomleaf", "timestalk"]).map((id) => ({ id, qty: 1 }));

const involved = collectMutations(targets, data);
console.log(`TARGET: ${targets.map((t) => data.mutations[t.id]?.name ?? t.id).join(", ")}`);
console.log(
  `Settings: ${settings.plots} plot${settings.plots === 1 ? "" : "s"}, Crop Growth ${settings.cropGrowth}, ` +
    `Growth Speed tier ${settings.speedTier}, bioanalysis "${settings.bioanalysis}", crop-support rule "${settings.supportRule}"`
);
console.log(`One stage at 12 unique crops: ${formatDuration(stageSeconds({ ...settings, uniqueCrops: 12 }))}`);

/**
 * Reports what a regeneration would change, before it changes it.
 *
 * The economies used to live in node_modules/.cache, which meant the reference
 * plan this tool prints silently rebased itself whenever that incidental file
 * was rebuilt. "Byte identical to last time" is only a meaningful bar while the
 * thing it is measured against holds still, so the fixture is checked in and
 * every move through it is printed and reviewed.
 */
const reportEconomyDiff = (
  before: Record<string, PlotEconomy | null>,
  after: Record<string, PlotEconomy | null>
): void => {
  const cells = (e: PlotEconomy | null | undefined): number | null =>
    e ? Object.values(e.crops).reduce((a, b) => a + b, 0) : null;
  const ids = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort();
  const moved = ids.filter((id) => JSON.stringify(before[id]) !== JSON.stringify(after[id]));
  if (moved.length === 0) {
    console.log(`\nEconomies fixture unchanged (${ids.length} rows).`);
    return;
  }
  console.log(`\nEconomies fixture: ${moved.length} of ${ids.length} rows moved.`);
  console.log("  mutation              before                after");
  console.log("  " + "-".repeat(60));
  for (const id of moved) {
    const b = before[id];
    const a = after[id];
    const show = (e: PlotEconomy | null | undefined): string =>
      e === undefined ? "absent" : e === null ? "INFEASIBLE" : `yield ${e.yield} / ${cells(e)} cells`;
    console.log(`  ${id.padEnd(21)} ${show(b).padEnd(21)} ${show(a)}`);
  }
  console.log("  Review these before committing the fixture.");
};

const previous: Record<string, PlotEconomy | null> = existsSync(CACHE)
  ? JSON.parse(readFileSync(CACHE, "utf8"))
  : {};
const cache: Record<string, PlotEconomy | null> = fresh ? {} : { ...previous };
const missing = involved.filter((id) => !(id in cache));

if (missing.length) {
  console.log(`Solving ${missing.length} mutations against the greenhouse solver...\n`);
  // One at a time. The old batches of five existed to keep several HTTP
  // requests in flight at once; the local solver is CPU-bound and synchronous,
  // so batching it would only add ceremony.
  for (const id of missing) cache[id] = solveEconomy(id);
  mkdirSync(dirname(CACHE), { recursive: true });
  writeFileSync(CACHE, JSON.stringify(cache, null, 1));
  reportEconomyDiff(previous, cache);
} else {
  console.log(`Plot yields read from cache (--fresh to re-solve).\n`);
}

const fullEconomies: Record<string, PlotEconomy | null> = Object.fromEntries(involved.map((id) => [id, cache[id] ?? null]));
const fullYields: Record<string, number> = {};
for (const [id, e] of Object.entries(fullEconomies)) if (e) fullYields[id] = e.yield;

/*
 * Two stages, exactly as PlannerPage runs them.
 *
 * The provisional plan is solved on maximized plots, `sizingFor` reads the
 * demand off it, and any row wanting less than a full plot is re-solved in
 * target mode. A plan of large demands produces an empty sizing map and this
 * whole block is a no-op, which is what keeps the reference plan comparable.
 *
 * The sized answers are NOT written to the checked-in fixture: that file is the
 * maximize reference, one row per mutation, and target-mode solves are cheap
 * (roughly 300ms against 2s) and depend on the demand rather than on the
 * mutation alone.
 */
const economies: Record<string, PlotEconomy | null> = { ...fullEconomies };
let sizing: Record<string, number> = {};

for (let round = 0; round < SIZING_ROUNDS; round++) {
  const so_far = buildSolverPlan(targets, data, economies);
  const next = sizingFor(so_far, data.mutations, fullYields, { bioanalysis: settings.bioanalysis }, sizingMode);
  if (sameSizing(next, sizing)) break;

  sizing = next;
  // Re-solve from the MAXIMIZED economy every round rather than from last
  // round's sized one, so a size can grow back if a tier above it grew. The
  // ceiling in `fullYields` is fixed for the same reason.
  for (const [id, spots] of Object.entries(sizing)) {
    economies[id] = solveEconomy(id, spots) ?? fullEconomies[id];
  }
}

const sizedIds = Object.keys(sizing).sort();
if (sizedIds.length) {
  console.log(`Right-sized ${sizedIds.length} plot${sizedIds.length === 1 ? "" : "s"} to the demand:`);
  for (const id of sizedIds) {
    console.log(
      `  ${(data.mutations[id]?.name ?? id).padEnd(22)} ${String(fullEconomies[id]?.yield ?? 0).padStart(3)} -> ${String(economies[id]?.yield ?? 0).padStart(3)} spots`
    );
  }
  console.log();
}

const plan = buildSolverPlan(targets, data, economies);

// The one function the Planner page also calls. Same numbers by construction.
const estimates = buildPlanEstimates(plan, data, economies, settings);

// ---------------------------------------------------------------------------
// report
// ---------------------------------------------------------------------------

const pad = (s: unknown, n: number) => String(s).padEnd(n);
const padStart = (s: unknown, n: number) => String(s).padStart(n);

console.log(
  pad("", 24) + padStart("need", 6) + padStart("spots", 6) + padStart("p", 6) + padStart("window", 8) + padStart("expected", 11) + padStart("p90", 11)
);
console.log("-".repeat(72));

for (const cycle of plan.cycles) {
  console.log(`--- Cycle ${cycle.index + 1} ---`);
  for (const n of cycle.produce) {
    const est = estimates.byId[n.id];
    const flag = n.special ? " *" : "";
    const head = "  " + pad(n.name + flag, 22) + padStart(n.need, 6);

    if (!est) {
      console.log(head + padStart("?", 6) + padStart("?", 6) + padStart("?", 8) + padStart("?", 11) + padStart("?", 11));
      continue;
    }

    console.log(
      head +
        padStart(est.spots, 6) +
        padStart(est.mechanicOnly ? "mech" : `${Math.round(est.spawnChance * 100)}%`, 6) +
        padStart(est.mechanicOnly ? "" : `${est.harvestWindow}c`, 8) +
        padStart(formatDuration(est.expectedSeconds), 11) +
        padStart(formatDuration(est.p90Seconds), 11)
    );
  }

  const c = estimates.cycles.find((x) => x.index === cycle.index);
  console.log(
    "  " +
      pad("cycle subtotal", 22) +
      padStart("", 6) +
      padStart("", 6) +
      padStart("", 8) +
      padStart(formatDuration(c?.expectedSeconds ?? 0), 11) +
      padStart(formatDuration(c?.p90Seconds ?? 0), 11)
  );
}

if (plan.manual.length) {
  console.log(`\n--- Get these yourself ---`);
  for (const n of plan.manual) console.log(`  ${n.name.padEnd(22)} x${n.need}  ${n.special?.label ?? ""}`);
}

console.log(`\n--- Base crops to sow (total across all plantings) ---`);
for (const c of plan.baseCrops) console.log(`  ${c.name.padEnd(22)} ${c.need.toLocaleString().padStart(9)}  [${c.ground}]`);

const unsolved = plan.cycles.flatMap((c) => c.produce).filter((n) => n.plots === undefined);

console.log("-".repeat(72));
console.log(`TOTAL PLANTINGS: ${plan.totalPlantings.toLocaleString()}`);
console.log(`Cycles: ${plan.depth}   Unsolved mutations: ${unsolved.length}${unsolved.length ? ` (${unsolved.map((n) => n.name).join(", ")})` : ""}`);
console.log(`\nExpected wall clock: ${formatDuration(estimates.total.expectedSeconds)}`);
console.log(`90% bound:           ${formatDuration(estimates.total.p90Seconds)}`);
console.log(`Old deterministic:   ${formatDuration(estimates.total.deterministicSeconds)}`);
console.log(
  `\nThe p90 column sums each mutation's own p90, which assumes every one of them runs unlucky at once.\n` +
    `That is a conservative upper bound, not a true p90 of the whole grind.\n` +
    `Spawn chance assumes each required crop carries an equal share of the support; that rule is still assumed.`
);

if (unsolved.length) process.exit(1);
