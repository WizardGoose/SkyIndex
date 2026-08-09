#!/usr/bin/env node
/**
 * Feasibility spike: can we solve greenhouse layouts locally?
 *
 *   node tools/local-solver-spike.mjs
 *
 * Right now the Solver and the Planner both call api.skyshards.com. That is
 * someone else's server, so publishing the site would put every visitor on
 * their bandwidth. This measures whether a local search can match the remote
 * solver's output well enough to replace it.
 *
 * The problem: on a 10x10 plot, choose which cells hold which crop so that the
 * most possible EMPTY cells each have enough of the right neighbours to spawn
 * the mutation. Crops are shared between spawn spots, which is what makes the
 * remote solver's density hard to beat by hand.
 *
 * Approach: simulated annealing over cell assignments. No dependencies.
 */
import { readFileSync } from "node:fs";

const GRID = 10;
const N = GRID * GRID;
const data = JSON.parse(readFileSync("public/greenhouse/data.json", "utf8"));

/** Neighbour index list for every cell, 8-way. */
const NEIGHBOURS = Array.from({ length: N }, (_, i) => {
  const r = Math.floor(i / GRID);
  const c = i % GRID;
  const out = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr;
      const cc = c + dc;
      if (rr < 0 || cc < 0 || rr >= GRID || cc >= GRID) continue;
      out.push(rr * GRID + cc);
    }
  return out;
});

/**
 * Score an assignment.
 * `cells[i]` is -1 for empty, or an index into the requirement list.
 * A cell counts only if it is empty and every requirement is met around it.
 */
const score = (cells, reqs) => {
  let total = 0;
  for (let i = 0; i < N; i++) {
    if (cells[i] !== -1) continue;
    let ok = true;
    for (let k = 0; k < reqs.length && ok; k++) {
      let found = 0;
      for (const n of NEIGHBOURS[i]) if (cells[n] === k) found++;
      if (found < reqs[k].count) ok = false;
    }
    if (ok) total++;
  }
  return total;
};

const solve = (reqs, { iterations = 260_000, restarts = 6 } = {}) => {
  if (!reqs.length) return N; // needs nothing, every cell spawns it

  let best = 0;
  let bestCells = null;

  for (let r = 0; r < restarts; r++) {
    // Seed: sparse random planting, biased toward mostly-empty grids.
    const cells = new Int8Array(N).fill(-1);
    for (let i = 0; i < N; i++) if (Math.random() < 0.3) cells[i] = Math.floor(Math.random() * reqs.length);

    let cur = score(cells, reqs);
    let temp = 2.2;

    for (let it = 0; it < iterations; it++) {
      const i = (Math.random() * N) | 0;
      const prev = cells[i];
      // Flip to empty or to one of the crop types.
      let next = Math.floor(Math.random() * (reqs.length + 1)) - 1;
      if (next === prev) next = prev === -1 ? 0 : -1;

      cells[i] = next;
      const s = score(cells, reqs);
      const delta = s - cur;

      if (delta >= 0 || Math.random() < Math.exp(delta / temp)) cur = s;
      else cells[i] = prev;

      temp *= 0.99997;
      if (temp < 0.02) temp = 0.02;
    }

    if (cur > best) {
      best = cur;
      bestCells = Int8Array.from(cells);
    }
  }

  return { best, cells: bestCells };
};

// Remote solver results measured earlier, for comparison.
const REMOTE = { choconut: 72, ashwreath: 52, dustgrain: 72, scourroot: 72, veilshroom: 72, duskbloom: 16, snoozling: 4, noctilume: 9 };

console.log("mutation        reqs                         local  remote  gap");
console.log("-".repeat(70));

let wins = 0;
let matched = 0;
const targets = Object.keys(REMOTE);

for (const id of targets) {
  const m = data.mutations[id];
  if (!m) continue;
  const t0 = Date.now();
  const { best } = solve(m.requirements);
  const ms = Date.now() - t0;
  const remote = REMOTE[id];
  const gap = best - remote;
  if (gap >= 0) wins++;
  if (gap === 0) matched++;

  const reqStr = m.requirements.map((r) => `${r.count}x ${r.crop}`).join(" + ") || "(none)";
  console.log(
    `${m.name.padEnd(15)} ${reqStr.padEnd(28)} ${String(best).padStart(5)} ${String(remote).padStart(7)} ${String(gap >= 0 ? "+" + gap : gap).padStart(4)}  ${ms}ms`
  );
}

console.log(`\nmatched or beat the remote solver on ${wins}/${targets.length} (exact match on ${matched})`);
