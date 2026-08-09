import type { MutationGoal, SolveResponse } from "../types/greenhouse";
import type { SolverDataset } from "./problem.ts";
import { mulberry32 } from "./rng.ts";

/**
 * The multi-cell family: targets whose SUPPORT crops are themselves mutations
 * with a footprint (snoozling 3x3, noctilume 2x2). The main engine plants
 * every support on one cell and so produced physically impossible layouts for
 * these four targets, disproved against the remote's real
 * plots. This module is the honest replacement: supports are
 * placed as true blocks, adjacency is counted PER CELL (the semantics settled
 * by replaying the remote's recorded layouts through the footprint-aware
 * validator: legal under per-cell, illegal under per-instance), and every
 * answer goes back out through that same validator.
 *
 * Search shape: greedy constructive (repeatedly add the block that most
 * improves the spawn count) then hill-climbing with add / remove / move
 * proposals under a deterministic rng and a wall-clock budget. No provable
 * bound exists here yet, so results are never labeled OPTIMAL - FEASIBLE is
 * the ceiling until a bound argument is built.
 */

interface SupportType {
  id: string;
  size: number;
  /** Cells of this crop required adjacent to each spawn, per-cell counting. */
  required: number;
  index: number;
}

interface Placement {
  type: number;
  row: number;
  col: number;
}


const CELLS = 100;

const fits = (mask: Uint8Array, cropAt: Int16Array, row: number, col: number, size: number): boolean => {
  if (row < 0 || col < 0 || row + size > 10 || col + size > 10) return false;
  for (let dr = 0; dr < size; dr++) {
    for (let dc = 0; dc < size; dc++) {
      const cell = (row + dr) * 10 + col + dc;
      if (!mask[cell] || cropAt[cell] >= 0) return false;
    }
  }
  return true;
};

const stamp = (cropAt: Int16Array, p: Placement, types: SupportType[], value: number): void => {
  const size = types[p.type].size;
  for (let dr = 0; dr < size; dr++) {
    for (let dc = 0; dc < size; dc++) cropAt[(p.row + dr) * 10 + p.col + dc] = value;
  }
};

const apply = (cropAt: Int16Array, p: Placement, types: SupportType[]): void =>
  stamp(cropAt, p, types, p.type);
const clear = (cropAt: Int16Array, p: Placement, types: SupportType[]): void =>
  stamp(cropAt, p, types, -1);

/**
 * Count legal, non-overlapping spawns on the current field. Spawn blocks may
 * not sit on crops; they may touch each other. Greedy scan order is
 * deterministic and, for 1x1 targets, exact (1x1 spawn blocks cannot
 * overlap); for larger targets it is a floor, which only ever understates.
 */
const countSpawns = (
  mask: Uint8Array,
  cropAt: Int16Array,
  types: SupportType[],
  targetSize: number,
  collect?: [number, number][],
  /**
   * Progress credit: sum over every candidate anchor of how much of each
   * requirement its ring already holds, capped at the requirement. Without
   * this the search cannot bootstrap - a single block completes nothing, so
   * "plant nothing" scored best and the first measurement returned zero
   * spawns everywhere. Partial coverage has to be worth climbing toward.
   */
  partial?: { value: number }
): number => {
  const taken = collect ? new Uint8Array(CELLS) : null;
  let count = 0;
  const counts = new Int16Array(types.length);
  for (let row = 0; row + targetSize <= 10; row++) {
    anchor: for (let col = 0; col + targetSize <= 10; col++) {
      for (let dr = 0; dr < targetSize; dr++) {
        for (let dc = 0; dc < targetSize; dc++) {
          const cell = (row + dr) * 10 + col + dc;
          if (!mask[cell] || cropAt[cell] >= 0) continue anchor;
          if (taken && taken[cell]) continue anchor;
        }
      }
      counts.fill(0);
      for (let dr = -1; dr <= targetSize; dr++) {
        for (let dc = -1; dc <= targetSize; dc++) {
          const inBlock = dr >= 0 && dr < targetSize && dc >= 0 && dc < targetSize;
          if (inBlock) continue;
          const r = row + dr;
          const c = col + dc;
          if (r < 0 || c < 0 || r > 9 || c > 9) continue;
          const crop = cropAt[r * 10 + c];
          if (crop >= 0) counts[crop]++;
        }
      }
      let complete = true;
      for (const t of types) {
        if (counts[t.index] < t.required) complete = false;
        if (partial) partial.value += Math.min(counts[t.index], t.required);
      }
      if (!complete) continue anchor;
      count++;
      if (collect && taken) {
        collect.push([row, col]);
        for (let dr = 0; dr < targetSize; dr++) {
          for (let dc = 0; dc < targetSize; dc++) taken[(row + dr) * 10 + col + dc] = 1;
        }
      }
    }
  }
  return count;
};

export const solveMultiCell = (
  cells: [number, number][],
  goal: MutationGoal,
  dataset: SolverDataset,
  options: { seed?: number; timeBudgetMs?: number } = {}
): SolveResponse => {
  const mutation = dataset.mutations[goal.mutation];
  const targetSize = mutation.size;
  const cap = goal.maximize ? Number.POSITIVE_INFINITY : Math.max(0, goal.count ?? 1);
  const types: SupportType[] = mutation.requirements.map((req, index) => ({
    id: req.crop,
    size: dataset.mutations[req.crop]?.size ?? 1,
    required: req.count,
    index,
  }));

  const mask = new Uint8Array(CELLS);
  for (const [row, col] of cells) if (row >= 0 && row < 10 && col >= 0 && col < 10) mask[row * 10 + col] = 1;

  const rng = mulberry32(options.seed ?? 0x5eed_1234);
  const deadline = Date.now() + (options.timeBudgetMs ?? 2500);

  const cropAt = new Int16Array(CELLS).fill(-1);
  let placements: Placement[] = [];
  const score = (): number => {
    const partial = { value: 0 };
    const spawns = countSpawns(mask, cropAt, types, targetSize, undefined, partial);
    const capped = Math.min(spawns, cap);
    let cropCells = 0;
    for (let i = 0; i < CELLS; i++) if (cropAt[i] >= 0) cropCells++;
    // Completed spawns dominate; partial coverage gives the climb a slope
    // (a 3x3 block near open ground raises the partials of a dozen anchors,
    // comfortably beating its cell cost); crop cells cost a little so ties
    // resolve toward smaller bills; raw spawns last so a capped search still
    // climbs past its cap region.
    return capped * 1_000_000 + partial.value * 10 - cropCells * 15 + Math.min(spawns, 999);
  };

  /**
   * The coordination problem: one spawn needs its whole ring satisfied, which
   * takes SEVERAL blocks of DIFFERENT types placed cooperatively around one
   * gap (stoplight: 4 snoozling cells + 4 noctilume cells = all 8 ring cells).
   * Single-block moves can never take the first profitable step, which is why
   * both the pure-greedy and the blind hill-climb versions of this file
   * returned zero spawns. So the atomic move is a KIT: a bounded backtracking
   * search that completes one anchor's ring using existing crops for free and
   * whole new blocks where needed. Returns the blocks it added (already
   * applied), or null (state untouched) if the anchor cannot be completed.
   */
  const ringOf = (row: number, col: number): [number, number][] => {
    const out: [number, number][] = [];
    for (let dr = -1; dr <= targetSize; dr++) {
      for (let dc = -1; dc <= targetSize; dc++) {
        const inBlock = dr >= 0 && dr < targetSize && dc >= 0 && dc < targetSize;
        if (inBlock) continue;
        const r = row + dr;
        const c = col + dc;
        if (r >= 0 && c >= 0 && r <= 9 && c <= 9) out.push([r, c]);
      }
    }
    return out;
  };

  const tryCompleteAnchor = (row: number, col: number): Placement[] | null => {
    // The spawn block itself must be free ground.
    for (let dr = 0; dr < targetSize; dr++) {
      for (let dc = 0; dc < targetSize; dc++) {
        const r = row + dr;
        const c = col + dc;
        if (r > 9 || c > 9) return null;
        const cell = r * 10 + c;
        if (!mask[cell] || cropAt[cell] >= 0) return null;
      }
    }
    const ring = ringOf(row, col);
    const forbidden = new Set<number>();
    for (let dr = 0; dr < targetSize; dr++) {
      for (let dc = 0; dc < targetSize; dc++) forbidden.add((row + dr) * 10 + col + dc);
    }
    const added: Placement[] = [];
    const overlapsForbidden = (r0: number, c0: number, size: number): boolean => {
      for (let dr = 0; dr < size; dr++) {
        for (let dc = 0; dc < size; dc++) if (forbidden.has((r0 + dr) * 10 + c0 + dc)) return true;
      }
      return false;
    };
    const ringCount = (typeIndex: number): number => {
      let n = 0;
      for (const [r, c] of ring) if (cropAt[r * 10 + c] === typeIndex) n++;
      return n;
    };
    // Node budget: an anchor that CANNOT complete would otherwise make the
    // dfs walk its entire failure tree, and 100 such anchors per greedy round
    // ate the whole time budget (measured: every target fell to 1 spawn).
    // Failing fast costs a few completable corner cases and buys the search
    // back its thousands of iterations.
    let nodes = 0;
    const dfs = (depth: number): boolean => {
      const ti = types.findIndex((t) => ringCount(t.index) < t.required);
      if (ti < 0) return true;
      if (depth >= 10 || ++nodes > 2000 || Date.now() > deadline) return false;
      const t = types[ti];
      // Same-type blocks are interchangeable, so only place them in ascending
      // position order. Without this the six 1x1 shrooms of a puffercloud kit
      // were tried in every permutation - factorial blowup that burned the
      // node budget at every anchor (measured: puffercloud fell to 0).
      let minKey = -1;
      for (const a of added) {
        if (a.type === ti) minKey = Math.max(minKey, a.row * 10 + a.col);
      }
      // Candidate blocks of this type: every position that covers at least
      // one ring cell, stays off the spawn block, and fits on free ground.
      const seen = new Set<number>();
      const cands: { p: Placement; gain: number }[] = [];
      for (const [r, c] of ring) {
        for (let dr = 0; dr < t.size; dr++) {
          for (let dc = 0; dc < t.size; dc++) {
            const r0 = r - dr;
            const c0 = c - dc;
            if (r0 < 0 || c0 < 0 || r0 + t.size > 10 || c0 + t.size > 10) continue;
            const key = r0 * 10 + c0;
            if (key <= minKey) continue;
            if (seen.has(key)) continue;
            seen.add(key);
            if (overlapsForbidden(r0, c0, t.size)) continue;
            if (!fits(mask, cropAt, r0, c0, t.size)) continue;
            let gain = 0;
            for (const [rr, cc] of ring) {
              if (rr >= r0 && rr < r0 + t.size && cc >= c0 && cc < c0 + t.size) gain++;
            }
            if (gain > 0) cands.push({ p: { type: ti, row: r0, col: c0 }, gain });
          }
        }
      }
      // Biggest ring contribution first: finds tight kits fast, backtracking
      // covers the corner-geometry cases where the greedy pick dead-ends.
      cands.sort((a, b) => b.gain - a.gain);
      for (const { p } of cands) {
        apply(cropAt, p, types);
        added.push(p);
        if (dfs(depth + 1)) return true;
        clear(cropAt, p, types);
        added.pop();
      }
      return false;
    };
    if (dfs(0)) return added;
    // dfs leaves state clean on failure.
    return null;
  };

  /**
   * Anchor scan in one of four corner orientations. Greedy packing is
   * tightest from a corner, but WHICH corner decides which lattice basin the
   * search falls into - the remote's densest layouts pack from different
   * directions than plain top-left.
   */
  const freeAnchors = (orient: number): [number, number][] => {
    const out: [number, number][] = [];
    const hi = 10 - targetSize;
    for (let a = 0; a <= hi; a++) {
      for (let b = 0; b <= hi; b++) {
        // Bits: 1 = mirror cols, 2 = mirror rows, 4 = transpose (column-major
        // packing; the remote's densest thunderling lattice is columnar and
        // row-major scans could not reach it).
        const u = orient & 4 ? b : a;
        const v = orient & 4 ? a : b;
        const row = orient & 2 ? hi - u : u;
        const col = orient & 1 ? hi - v : v;
        let ok = true;
        for (let dr = 0; ok && dr < targetSize; dr++) {
          for (let dc = 0; ok && dc < targetSize; dc++) {
            const cell = (row + dr) * 10 + col + dc;
            if (!mask[cell] || cropAt[cell] >= 0) ok = false;
          }
        }
        if (ok) out.push([row, col]);
      }
    }
    return out;
  };

  // Greedy constructive over kits: each round, complete the anchor whose kit
  // needs the fewest NEW crop cells (so later kits lean on earlier blocks and
  // the shared-support lattice emerges), until no anchor can be completed.
  // Ties break by rng so recreate passes explore different lattices.
  /**
   * epsilon: probability of taking a NEAR-best kit (cost within +3) instead
   * of the strict minimum. Strictly-minimal greedy always rebuilds the same
   * lattice, and 12-of-13 thunderling proved a hard attractor no amount of
   * window-ruin time escaped; controlled slop is what lets a different
   * pattern (the remote's shared double-column) form at all.
   */
  const greedyFill = (until: number, orient: number, epsilon: number): void => {
    let s0 = score();
    for (;;) {
      if (Date.now() > until) break;
      let bestCost = Number.POSITIVE_INFINITY;
      let bestKit: Placement[] | null = null;
      const nearBest: { kit: Placement[]; cost: number }[] = [];
      for (const [row, col] of freeAnchors(orient)) {
        if (Date.now() > until) break;
        const kit = tryCompleteAnchor(row, col);
        if (!kit) continue;
        // Empty kit = the ring is already satisfied by existing crops, so the
        // anchor is already a spawn and there is nothing to do. Choosing it
        // as "best" (cost 0) applied nothing, left the score flat, and the
        // no-progress guard killed the whole greedy loop after one kit - the
        // stall the debug trace showed as "bestCost=0 kit=0".
        if (kit.length === 0) continue;
        let cost = 0;
        for (const p of kit) cost += types[p.type].size ** 2;
        // Undo; the winner is re-applied below.
        for (let i = kit.length - 1; i >= 0; i--) clear(cropAt, kit[i], types);
        // Ties break by scan order (corner-first), NOT randomly: random
        // tie-breaking scatters kits across the grid and fragments the free
        // space (measured: stoplight fell 4 -> 1). Packing from a corner is
        // what makes the lattice tight; orientation + epsilon provide the
        // diversity instead.
        if (cost < bestCost) {
          bestCost = cost;
          bestKit = kit;
        }
        if (nearBest.length < 8) nearBest.push({ kit, cost });
      }
      if (epsilon > 0 && bestKit && rng.next() < epsilon) {
        const near = nearBest.filter((k) => k.cost <= bestCost + 3);
        if (near.length > 0) bestKit = near[rng.int(near.length)].kit;
      }
      if (!bestKit) break;
      for (const p of bestKit) {
        apply(cropAt, p, types);
        placements.push(p);
      }
      const s = score();
      // A kit that does not raise the score (should not happen, but geometry
      // is subtle) gets rolled back rather than trusted.
      if (s <= s0) {
        for (let n = 0; n < bestKit.length; n++) {
          const p = placements.pop();
          if (p) clear(cropAt, p, types);
        }
        break;
      }
      s0 = s;
    }
  };

  // Four corner starts, keep the best: which corner the greedy packs from
  // decides which lattice basin it falls into, and every seed was converging
  // to the same top-left basin one spawn short of the remote.
  let bestStartScore = Number.NEGATIVE_INFINITY;
  let bestStart: Placement[] = [];
  for (let orient = 0; orient < 8; orient++) {
    cropAt.fill(-1);
    placements = [];
    greedyFill(Math.min(deadline, Date.now() + 350), orient, 0);
    const s = score();
    if (s > bestStartScore) {
      bestStartScore = s;
      bestStart = placements.map((p) => ({ ...p }));
    }
  }
  cropAt.fill(-1);
  placements = bestStart;
  for (const p of placements) apply(cropAt, p, types);
  let current = score();

  // Ruin-and-recreate: single-block moves cannot repack a tight lattice (the
  // earlier move/add/remove climb never improved on greedy), so the escape
  // move is structural - clear every block touching a random window, then
  // greedy-refill with kits. Equal scores are accepted so the lattice can
  // drift sideways; worse states are rolled back.
  let bestScore = current;
  let bestPlacements = placements.map((p) => ({ ...p }));
  while (Date.now() < deadline) {
    const snapshot = placements.map((p) => ({ ...p }));
    const before = current;
    if (rng.next() < 0.2) {
      // Full randomized restart: window ruin cannot escape a whole-board
      // attractor because the surviving lattice re-constrains the refill.
      cropAt.fill(-1);
      placements = [];
      greedyFill(Math.min(deadline, Date.now() + 400), rng.int(8), 0.3);
    } else {
      const win = 3 + rng.int(4);
      const r0 = rng.int(11 - win);
      const c0 = rng.int(11 - win);
      for (let at = placements.length - 1; at >= 0; at--) {
        const p = placements[at];
        const s = types[p.type].size;
        const overlaps = p.row < r0 + win && p.row + s > r0 && p.col < c0 + win && p.col + s > c0;
        if (overlaps) {
          clear(cropAt, p, types);
          placements.splice(at, 1);
        }
      }
      greedyFill(Math.min(deadline, Date.now() + 400), rng.int(8), 0.1);
    }
    current = score();
    if (current > bestScore) {
      bestScore = current;
      bestPlacements = placements.map((p) => ({ ...p }));
    }
    if (current < before && rng.next() < 0.7) {
      // Usually roll back a worse state so window-ruin keeps polishing the
      // incumbent; sometimes keep it so restarts can explore from elsewhere.
      cropAt.fill(-1);
      placements = snapshot;
      for (const p of placements) apply(cropAt, p, types);
      current = before;
    }
  }

  // Rebuild the best state and emit.
  cropAt.fill(-1);
  placements = bestPlacements;
  for (const p of placements) apply(cropAt, p, types);
  const spawnList: [number, number][] = [];
  countSpawns(mask, cropAt, types, targetSize, spawnList);
  const spawns = spawnList.slice(0, Number.isFinite(cap) ? cap : undefined);

  if (spawns.length === 0) {
    return {
      status: "INFEASIBLE",
      total_cells_used: 0,
      placements: [],
      mutations: [],
      solver_approach: "multi-cell block search found no legal spawn",
    };
  }

  // Prune: drop any block no surviving spawn needs, one at a time.
  for (let at = placements.length - 1; at >= 0; at--) {
    const p = placements[at];
    clear(cropAt, p, types);
    const still: [number, number][] = [];
    countSpawns(mask, cropAt, types, targetSize, still);
    const stillSet = new Set(still.map(([r, c]) => r * 10 + c));
    if (spawns.every(([r, c]) => stillSet.has(r * 10 + c))) {
      placements.splice(at, 1);
    } else {
      apply(cropAt, p, types);
    }
  }

  let used = 0;
  for (const p of placements) used += types[p.type].size ** 2;
  used += spawns.length * targetSize ** 2;

  return {
    status: "FEASIBLE",
    total_cells_used: used,
    placements: placements.map((p) => ({
      crop: types[p.type].id,
      position: [p.row, p.col] as [number, number],
      size: types[p.type].size,
    })),
    mutations: spawns.map(([row, col]) => ({
      mutation: goal.mutation,
      position: [row, col] as [number, number],
      size: targetSize,
    })),
    solver_approach: "multi-cell block search / greedy construct + hill-climb / per-cell adjacency",
  };
};
