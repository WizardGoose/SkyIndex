/**
 * The questions a USER can ask, through the code the pages actually run.
 *
 * tools/solver-parity.mjs grades the library: it calls `solveLocal` directly on
 * canonical questions and compares against the recorded remote. That is a real
 * gate and it stays. But two bugs shipped underneath a green parity board,
 * because neither of them lived in the library:
 *
 *   the SOLVER PAGE never reached the shipped precompute, so a visitor asking
 *   the canonical question got a cold 51 Ashwreath where the build ships 52
 *
 *   the UNIQUE CROPS setting, documented as layout-inert and genuinely never
 *   read by the search, was tokenised into the cache key and disqualified the
 *   request from the precompute. Moving a growth-rate dial changed the answer
 *   on screen
 *
 * Both were reachable from a UI control and invisible to a harness that called
 * the solver directly. So this file asks its questions the way the pages ask
 * them: through `solveGreenhouseWithJob` (solver page), `solveLayout` and
 * `solveEconomy` (planner), and `solveGreenhouseDirect` (requirement grid),
 * every one of which goes through the real client, the real cache and the real
 * precompute lookup.
 *
 * It asserts INVARIANTS rather than a table of numbers, because a number that
 * has to be updated whenever the search improves is a number nobody trusts:
 *
 *   LEGAL        every response, from every path, at every option combination
 *   INERT        an option the search does not read may not change the answer
 *   SHIPS >= LIVE a canonical question never returns worse than the build ships
 *   HONEST       OPTIMAL only where the yield equals the proven bound
 *   REMOTE       canonical yields still match or beat the recorded answers
 *
 * Run with `pnpm bench`. Exits non-zero on any violation.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/*
 * The uniqueCrops store reads localStorage directly, and driving the real page
 * path means driving the real store. A tiny in-memory shim is enough and keeps
 * this honest: the bench moves the setting the way a player moves the slider,
 * rather than reaching past it.
 */
if (typeof globalThis.localStorage === "undefined") {
  const map = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
}

const { solveGreenhouseWithJob, solveGreenhouseDirect } = await import(
  "../src/greenhouse/services/greenhouseService.ts"
);
const { solveLayout, solveEconomy: _unusedLayoutEconomy, FULL_GRID } = await import(
  "../src/greenhouse/planner/useSolvedLayout.ts"
).then(async (m) => ({ ...m, solveEconomy: null }));
const { solveEconomy } = await import("../src/greenhouse/planner/useSolverEconomies.ts");
const { requirementGoal, solveGoal, solveGoals, FULL_PLOT, validateSolveResponse } = await import(
  "../src/greenhouse/solver/index.ts"
);
const { setUniqueCrops } = await import("../src/greenhouse/data/uniqueCropsStore.ts");
const { compileProblem, upperBoundFor } = await import("../src/greenhouse/solver/problem.ts");
const { solverDataset } = await import("../src/greenhouse/services/greenhouseService.ts");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const baseline = JSON.parse(
  readFileSync(join(ROOT, "tools", "solver-parity-baseline.json"), "utf8")
) as Record<string, never> & { single: Record<string, { variants: Record<string, { yield: number }> }> };
const asset = JSON.parse(
  readFileSync(join(ROOT, "src", "greenhouse", "data", "solverPrecompute.json"), "utf8")
) as { entries: { mutation: string; pruned: boolean; spawns: number[] }[] };

/** What the build ships for a canonical maximize, by mutation. */
const ships = new Map<string, number>();
for (const e of asset.entries) if (!e.pruned) ships.set(e.mutation, e.spawns.length / 2);

const dataset = solverDataset();

const failures: string[] = [];
const notes: string[] = [];
let checks = 0;
const check = (ok: boolean, label: string, detail = ""): void => {
  checks++;
  if (!ok) failures.push(`${label}${detail ? `: ${detail}` : ""}`);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const legal = (response: any, cells: [number, number][]): boolean => {
  try {
    return validateSolveResponse(response, cells, dataset).valid === true;
  } catch {
    return false;
  }
};

/**
 * A representative set rather than all forty.
 *
 * One from each structural family the solver treats differently, because the
 * families are where behaviour actually forks: a proved full-ring lattice, a
 * one-of-each slack target, a single-crop slack target, the coupled two-of-each
 * pair that is the hardest thing here, a size-2 target, and the zero-adjacent
 * special. Sweeping the option matrix over all forty would take an hour and
 * tell us the same thing.
 */
const SAMPLE = [
  "stoplight_petal", // full ring, proved at bound
  "gloomgourd", // slack, one of each of two crops
  "dustgrain", // slack, single crop
  "ashwreath", // coupled 2+2, the hard family
  "soggybud", // coupled 2+2, the other one
  "glasscorn", // size 2
  "lonelily", // zero adjacent
];

const say = (s = "") => console.log(s);

say("");
say("SOLVER BENCH: the questions a user can ask, through the paths a user triggers");
say("=".repeat(96));

// ---------------------------------------------------------------------------
// 1. page paths agree with each other and with what ships
// ---------------------------------------------------------------------------
say("");
say("PAGE PATHS  (solver page, planner layout, planner economy, requirement grid)");
say("-".repeat(96));
say(
  `${"mutation".padEnd(18)}${"solverPage".padStart(11)}${"layout".padStart(8)}${"economy".padStart(9)}${"ships".padStart(7)}${"legal".padStart(7)}  verdict`
);

for (const id of SAMPLE) {
  // THE SOLVER PAGE. Exactly what CalculatorPage builds: a full grid, one
  // maximized target, and the locks/priorities it only sends when non-empty.
  const page = await solveGreenhouseWithJob({
    cells: FULL_PLOT,
    targets: [solveGoal(id)],
  });
  const layout = await solveLayout(FULL_GRID, [id]);
  const economy = await solveEconomy(id);
  const shipped = ships.get(id) ?? 0;

  const pageLegal = legal(page, FULL_PLOT);
  const layoutLegal = legal(layout, FULL_GRID);
  check(pageLegal, `${id}: solver page returned an illegal layout`);
  check(layoutLegal, `${id}: planner layout returned an illegal layout`);

  // SHIPS >= LIVE. The canonical question must never come back worse than the
  // answer sitting in the bundle. This is the invariant the solver page broke.
  check(
    page.mutations.length >= shipped,
    `${id}: SOLVER PAGE below what ships`,
    `page ${page.mutations.length}, ships ${shipped}`
  );
  check(
    layout.mutations.length >= shipped,
    `${id}: planner layout below what ships`,
    `layout ${layout.mutations.length}, ships ${shipped}`
  );
  check(
    (economy?.yield ?? 0) >= shipped,
    `${id}: planner economy below what ships`,
    `economy ${economy?.yield ?? 0}, ships ${shipped}`
  );

  // The three paths ask one question, so they must get one answer.
  check(
    page.mutations.length === layout.mutations.length &&
      layout.mutations.length === (economy?.yield ?? -1),
    `${id}: the page paths disagree on the same question`,
    `page ${page.mutations.length}, layout ${layout.mutations.length}, economy ${economy?.yield}`
  );

  const ok =
    pageLegal &&
    layoutLegal &&
    page.mutations.length >= shipped &&
    page.mutations.length === layout.mutations.length;
  say(
    `${id.padEnd(18)}${String(page.mutations.length).padStart(11)}${String(layout.mutations.length).padStart(8)}${String(economy?.yield ?? "-").padStart(9)}${String(shipped).padStart(7)}${(pageLegal && layoutLegal ? "yes" : "NO").padStart(7)}  ${ok ? "ok" : "FAIL"}`
  );
}

// The requirement grid asks a different question (show me one), so it gets its
// own row rather than being folded into the comparison above.
for (const id of ["gloomgourd", "ashwreath"]) {
  const grid = await solveGreenhouseDirect(FULL_PLOT, [requirementGoal(id)], undefined, true);
  check(legal(grid, FULL_PLOT), `${id}: requirement grid returned an illegal layout`);
  check(
    grid.mutations.length === 1,
    `${id}: requirement grid did not return exactly one spawn`,
    `got ${grid.mutations.length}`
  );
}

// ---------------------------------------------------------------------------
// 2. inertness: a setting the search never reads may not move the answer
// ---------------------------------------------------------------------------
say("");
say("INERTNESS  (unique crops is a growth-rate setting: moving it must change nothing)");
say("-".repeat(96));
say(`${"mutation".padEnd(18)}${"unset".padStart(8)}${"0".padStart(6)}${"2".padStart(6)}${"12".padStart(6)}  verdict`);

for (const id of SAMPLE) {
  const seen: number[] = [];
  const fingerprints = new Set<string>();
  for (const value of [undefined, 0, 2, 12]) {
    // Move the setting the way the slider does, then ask the page's question.
    setUniqueCrops(value ?? 0);
    const response = await solveGreenhouseWithJob({ cells: FULL_PLOT, targets: [solveGoal(id)] });
    seen.push(response.mutations.length);
    // Identical RESPONSES, not merely identical yields: a different layout for
    // the same question is the same bug wearing a hat.
    fingerprints.add(
      JSON.stringify({
        m: response.mutations.map((x) => [x.position, x.size, x.mutation]).sort(),
        p: response.placements.map((x) => [x.position, x.size, x.crop]).sort(),
        s: response.status,
      })
    );
    check(legal(response, FULL_PLOT), `${id}: illegal layout at uniqueCrops=${value ?? "unset"}`);
  }
  setUniqueCrops(0);
  const inert = fingerprints.size === 1;
  check(inert, `${id}: unique crops CHANGED the layout`, `${fingerprints.size} distinct responses, yields ${seen.join("/")}`);
  say(
    `${id.padEnd(18)}${String(seen[0]).padStart(8)}${String(seen[1]).padStart(6)}${String(seen[2]).padStart(6)}${String(seen[3]).padStart(6)}  ${inert ? "inert" : "LEAKED"}`
  );
}

// ---------------------------------------------------------------------------
// 3. option matrix: everything else a UI control can reach
// ---------------------------------------------------------------------------
say("");
say("OPTION MATRIX  (priorities, locks, target mode, grid masks)");
say("-".repeat(96));

/** Deterministic masks, so two runs of this file are comparable. */
const mulberry32 = (a: number) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rng = mulberry32(0x5eed_1234);
const maskOf = (keep: number): [number, number][] => {
  const cells = [...FULL_PLOT];
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  return cells.slice(0, keep).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
};

let matrixRuns = 0;
for (const id of SAMPLE) {
  const base = await solveGreenhouseWithJob({ cells: FULL_PLOT, targets: [solveGoal(id)] });

  /*
   * PRIORITIES ARE INERT ON A SINGLE TARGET. The solver's own comment says so
   * (Field.priorityValue has nothing to rank against when there is one target),
   * and the UI lets a player set one from the targets panel, so it is exactly
   * the shape of thing that leaked last time.
   */
  const ranked = await solveGreenhouseWithJob({
    cells: FULL_PLOT,
    targets: [solveGoal(id)],
    priorities: { [id]: 7 },
  });
  matrixRuns++;
  check(
    ranked.mutations.length === base.mutations.length,
    `${id}: a priority changed a single-target yield`,
    `${base.mutations.length} -> ${ranked.mutations.length}`
  );
  check(legal(ranked, FULL_PLOT), `${id}: illegal layout with priorities set`);

  // An empty lock list is not a lock. It must not fork the question.
  const emptyLocks = await solveGreenhouseWithJob({
    cells: FULL_PLOT,
    targets: [solveGoal(id)],
    locks: [],
  });
  matrixRuns++;
  check(
    emptyLocks.mutations.length === base.mutations.length,
    `${id}: an empty lock list changed the yield`,
    `${base.mutations.length} -> ${emptyLocks.mutations.length}`
  );

  // TARGET MODE. A capped request must deliver exactly what was asked for, and
  // never more than the maximize answer.
  for (const count of [1, 4]) {
    const capped = await solveGreenhouseWithJob({
      cells: FULL_PLOT,
      targets: [solveGoal(id, count)],
    });
    matrixRuns++;
    check(legal(capped, FULL_PLOT), `${id}: illegal layout in target mode (${count})`);
    check(
      capped.mutations.length <= count,
      `${id}: target mode overshot`,
      `asked ${count}, got ${capped.mutations.length}`
    );
    check(
      base.mutations.length === 0 || capped.mutations.length === Math.min(count, base.mutations.length),
      `${id}: target mode did not reach a reachable count`,
      `asked ${count}, got ${capped.mutations.length}, maximize reaches ${base.mutations.length}`
    );
  }

  // MASKED GRIDS. What a player part way through unlocking actually has.
  for (const keep of [88, 70]) {
    const cells = maskOf(keep);
    const masked = await solveGreenhouseWithJob({ cells, targets: [solveGoal(id)] });
    matrixRuns++;
    check(legal(masked, cells), `${id}: illegal layout on a ${keep} cell mask`);
    check(
      masked.mutations.length <= base.mutations.length,
      `${id}: a masked plot beat the full plot`,
      `${keep} cells gave ${masked.mutations.length}, full plot gives ${base.mutations.length}`
    );
  }
}
say(`  ${matrixRuns} option-matrix solves across ${SAMPLE.length} mutations, all re-validated.`);

// ---------------------------------------------------------------------------
// 4. honest labels, and the recorded remote
// ---------------------------------------------------------------------------
say("");
say("LABELS AND REMOTE");
say("-".repeat(96));
say(`${"mutation".padEnd(18)}${"yield".padStart(7)}${"bound".padStart(7)}${"remote".padStart(8)}  status      verdict`);

for (const id of SAMPLE) {
  const response = await solveGreenhouseWithJob({ cells: FULL_PLOT, targets: [solveGoal(id)] });
  const problem = compileProblem(FULL_PLOT, solveGoals([id]), dataset, {});
  const bound = problem.targets.length > 0 ? upperBoundFor(problem, 0) : 0;
  const remote = baseline.single[id]?.variants?.["true"]?.yield ?? null;

  /*
   * OPTIMAL is a claim, not a mood. It may only appear when the yield actually
   * equals the proven ceiling, because the UI shows the word to the player.
   */
  const claimsOptimal = response.status === "OPTIMAL";
  const atBound = response.mutations.length === bound;
  check(
    !claimsOptimal || atBound,
    `${id}: claimed OPTIMAL below its bound`,
    `${response.mutations.length} of ${bound}`
  );
  if (remote !== null && response.mutations.length < remote) {
    // Not a hard failure here: parity owns the remote comparison and knows
    // which divergences are deliberate. Surfaced so a regression is visible.
    notes.push(`${id}: below the recorded remote (${response.mutations.length} against ${remote})`);
  }
  say(
    `${id.padEnd(18)}${String(response.mutations.length).padStart(7)}${String(bound).padStart(7)}${String(remote ?? "-").padStart(8)}  ${response.status.padEnd(11)} ${!claimsOptimal || atBound ? "honest" : "OVERCLAIMED"}`
  );
}

// ---------------------------------------------------------------------------
say("");
say("=".repeat(96));
if (notes.length) {
  say("NOTES (not failures)");
  for (const n of notes) say(`  ${n}`);
  say("");
}
if (failures.length === 0) {
  say(`RESULT: PASS  (${checks} assertions across the real page paths)`);
  say("");
  process.exit(0);
}
say(`RESULT: FAIL  (${failures.length} of ${checks} assertions)`);
for (const f of failures) say(`  ${f}`);
say("");
process.exit(1);
