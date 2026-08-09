/**
 * Maximum gloomgourd yield on an arbitrary set of unlocked cells.
 *
 * WHAT THIS SOLVES, PRECISELY
 * ---------------------------
 * Gloomgourd is a size-1 mutation needing 1 pumpkin and 1 melon in its ring,
 * and the ring of a size-1 block is just its 8 clipped neighbours. So on an
 * unlocked set U we are choosing an assignment of every cell to one of
 * {empty, pumpkin, melon} and counting the empty cells that see at least one
 * pumpkin AND at least one melon among their 8 neighbours inside U:
 *
 *   maximise  |{ c in U : a(c) = empty, N8(c) has a pumpkin, N8(c) has a melon }|
 *
 * That is a two-colour covering problem, not a matching, and it does NOT have
 * a closed form. Measured optima climb with area rather than tracking any
 * fixed ratio of |U|: 6 cells give 2, 8 give 4, 9 give 6, 10 give 6, every
 * 12-cell shape tested gives 8, and the full 100-cell plot gives 72. A single
 * formula in |U| cannot produce that sequence, so this file searches.
 *
 * WHY SINGLE-CELL LOCAL SEARCH IS NOT ENOUGH
 * ------------------------------------------
 * A cell only becomes covered once it can see BOTH crops. Planting the first
 * pumpkin next to an empty cell scores nothing, and planting the first melon
 * next to it scores nothing; the pair scores together or not at all. Every
 * single-cell move across that gap is neutral or worse, so hill climbing on
 * one cell at a time stalls with the plot half empty. `pairPass` exists for
 * that reason and is the difference between roughly 55 and 72 on a full plot.
 *
 * HONESTY
 * -------
 * `bound` is a real upper bound, proved in its own comment. When the search
 * reaches it the answer is OPTIMAL and says so. When it does not, the answer
 * is BEST-KNOWN and carries the remaining gap. Nothing here reports a maximum
 * it has not either achieved or bounded.
 */
import { CELL_COUNT, neighbours } from "../solver/grid.ts";
import { mulberry32 } from "../solver/rng.ts";

/** Cell states. Two crops is all gloomgourd needs, so they get fixed slots. */
export const EMPTY = 0;
export const CROP_A = 1;
export const CROP_B = 2;

/** 8-way neighbours of every cell, precomputed once for the fixed 10x10 plot. */
const NEIGHBOURS: readonly (readonly number[])[] = (() => {
  const out: number[][] = [];
  for (let i = 0; i < CELL_COUNT; i++) out.push(neighbours(i));
  return out;
})();

export interface PotentialResult {
  /** Best coverage found. */
  value: number;
  /** Proved upper bound on coverage for this unlocked set. */
  bound: number;
  /** True only when value === bound, i.e. the answer is provably maximal. */
  proved: boolean;
  /** The layout achieving `value`, as a per-cell state array of length 100. */
  assignment: Uint8Array;
}

/**
 * Incremental coverage field.
 *
 * Keeps per-cell counts of how many pumpkins and melons each cell can see, so
 * changing one cell costs O(8) instead of a full rescan. Every mutator is
 * exactly reversible, which is what lets the search try a move and undo it
 * without copying the whole field.
 */
export class CoverField {
  readonly mask: Uint8Array;
  readonly state: Uint8Array;
  private readonly seesA: Int16Array;
  private readonly seesB: Int16Array;
  private readonly covered: Uint8Array;
  /** Unlocked cell indices, in ascending order. */
  cells: number[];
  score = 0;

  constructor(mask: Uint8Array) {
    this.mask = mask;
    this.state = new Uint8Array(CELL_COUNT);
    this.seesA = new Int16Array(CELL_COUNT);
    this.seesB = new Int16Array(CELL_COUNT);
    this.covered = new Uint8Array(CELL_COUNT);
    this.cells = [];
    for (let i = 0; i < CELL_COUNT; i++) if (mask[i] === 1) this.cells.push(i);
  }

  /** Empties the plot and rebuilds every derived count from scratch. */
  clear(): void {
    this.state.fill(EMPTY);
    this.seesA.fill(0);
    this.seesB.fill(0);
    this.covered.fill(0);
    this.score = 0;
  }

  /** Re-derives whether a single cell is covered, keeping `score` in step. */
  private refresh(i: number): void {
    const want =
      this.mask[i] === 1 && this.state[i] === EMPTY && this.seesA[i] > 0 && this.seesB[i] > 0 ? 1 : 0;
    if (want !== this.covered[i]) {
      this.score += want - this.covered[i];
      this.covered[i] = want;
    }
  }

  /** Sets one cell's crop. O(8) and exactly reversible by setting it back. */
  set(i: number, value: number): void {
    const old = this.state[i];
    if (old === value) return;
    this.state[i] = value;
    const ns = NEIGHBOURS[i];
    for (let k = 0; k < ns.length; k++) {
      const n = ns[k];
      if (this.mask[n] !== 1) continue;
      if (old === CROP_A) this.seesA[n]--;
      else if (old === CROP_B) this.seesB[n]--;
      if (value === CROP_A) this.seesA[n]++;
      else if (value === CROP_B) this.seesB[n]++;
      this.refresh(n);
    }
    this.refresh(i);
  }

  /**
   * Brings a newly unlocked cell into the field.
   *
   * The cell arrives empty, so no neighbour's counts change; only the new
   * cell's own view of its neighbours has to be built.
   */
  unlock(i: number): void {
    if (this.mask[i] === 1) return;
    this.mask[i] = 1;
    this.state[i] = EMPTY;
    let a = 0;
    let b = 0;
    const ns = NEIGHBOURS[i];
    for (let k = 0; k < ns.length; k++) {
      const n = ns[k];
      if (this.mask[n] !== 1) continue;
      if (this.state[n] === CROP_A) a++;
      else if (this.state[n] === CROP_B) b++;
    }
    this.seesA[i] = a;
    this.seesB[i] = b;
    this.covered[i] = 0;
    this.refresh(i);
    // Insert keeping `cells` ascending, so search order stays deterministic.
    let at = this.cells.length;
    while (at > 0 && this.cells[at - 1] > i) at--;
    this.cells.splice(at, 0, i);
  }

  snapshot(): Uint8Array {
    return this.state.slice();
  }

  /**
   * Independent copy, including the unlocked mask.
   *
   * The expansion planner trials every locked cell before committing to one,
   * and a trial must not leak into the next. Copying five 100-byte arrays is
   * cheaper than rebuilding the field, which is what makes trialling every
   * candidate affordable.
   */
  clone(): CoverField {
    const copy = new CoverField(this.mask.slice());
    copy.state.set(this.state);
    copy.seesA.set(this.seesA);
    copy.seesB.set(this.seesB);
    copy.covered.set(this.covered);
    copy.cells = this.cells.slice();
    copy.score = this.score;
    return copy;
  }

  restore(from: Uint8Array): void {
    for (let k = 0; k < this.cells.length; k++) {
      const i = this.cells[k];
      this.set(i, from[i]);
    }
  }

  /**
   * Best-improvement over single cells.
   *
   * Necessary but never sufficient: see the file header on why one cell at a
   * time cannot open a fresh pumpkin/melon pair.
   */
  /** Unlocked cells within a Chebyshev radius of `index`. */
  cellsNear(index: number, radius: number): number[] {
    const cr = Math.floor(index / 10);
    const cc = index % 10;
    const out: number[] = [];
    for (let r = cr - radius; r <= cr + radius; r++) {
      for (let c = cc - radius; c <= cc + radius; c++) {
        if (r < 0 || c < 0 || r > 9 || c > 9) continue;
        const i = r * 10 + c;
        if (this.mask[i] === 1) out.push(i);
      }
    }
    return out;
  }

  singlePass(over: readonly number[] = this.cells): boolean {
    let improved = false;
    for (let k = 0; k < over.length; k++) {
      const i = over[k];
      const old = this.state[i];
      let bestValue = old;
      let bestScore = this.score;
      for (let v = 0; v < 3; v++) {
        if (v === old) continue;
        this.set(i, v);
        if (this.score > bestScore) {
          bestScore = this.score;
          bestValue = v;
        }
        this.set(i, old);
      }
      if (bestValue !== old) {
        this.set(i, bestValue);
        improved = true;
      }
    }
    return improved;
  }

  /**
   * Best-improvement over adjacent cell PAIRS, all 9 joint states.
   *
   * This is the move that actually builds the layout. Introducing the first
   * pumpkin and the first melon near an empty region scores zero for either
   * half alone, so only a joint move can see the gain.
   */
  pairPass(over: readonly number[] = this.cells): boolean {
    let improved = false;
    for (let k = 0; k < over.length; k++) {
      const i = over[k];
      const ns = NEIGHBOURS[i];
      for (let m = 0; m < ns.length; m++) {
        const j = ns[m];
        if (this.mask[j] !== 1) continue;
        // Each unordered pair only needs visiting once on a full sweep. On a
        // restricted sweep both directions must run, because the partner may
        // sit outside `over` and would otherwise never be paired with.
        if (over === this.cells && j < i) continue;
        const oldI = this.state[i];
        const oldJ = this.state[j];
        let bestI = oldI;
        let bestJ = oldJ;
        let bestScore = this.score;
        for (let vi = 0; vi < 3; vi++) {
          for (let vj = 0; vj < 3; vj++) {
            if (vi === oldI && vj === oldJ) continue;
            this.set(i, vi);
            this.set(j, vj);
            if (this.score > bestScore) {
              bestScore = this.score;
              bestI = vi;
              bestJ = vj;
            }
            this.set(i, oldI);
            this.set(j, oldJ);
          }
        }
        if (bestI !== oldI || bestJ !== oldJ) {
          this.set(i, bestI);
          this.set(j, bestJ);
          improved = true;
        }
      }
    }
    return improved;
  }

  /** Runs both move classes to a joint local optimum, optionally over a subset. */
  climb(maxRounds = 40, over: readonly number[] = this.cells): void {
    for (let round = 0; round < maxRounds; round++) {
      const a = this.singlePass(over);
      const b = this.pairPass(over);
      if (!a && !b) return;
    }
  }
}

/**
 * Upper bound on coverage for an unlocked set.
 *
 * PROOF. Let k cells be planted. Every covered cell is empty, so
 * coverage <= |U| - k. Every covered cell needs at least one pumpkin and at
 * least one melon among its neighbours, so it contributes at least 2 to the
 * count of (planted, covered) adjacent pairs. That same count is at most the
 * sum of the planted cells' degrees, and the largest such sum for k cells is
 * the k largest degrees in U. Hence
 *
 *   2 * coverage <= sum of the k largest degrees      =>  coverage <= floor(that / 2)
 *   coverage <= |U| - k
 *
 * Both hold for the true optimum's own k, which we do not know, so the bound
 * is the maximum over every k of the smaller of the two. Degrees are counted
 * inside U only, so locked cells never inflate it.
 *
 * The bound is tight on small shapes (it returns exactly 6 for a 3x3, which is
 * the true optimum) and loose on the full plot, where it gives 80 against an
 * achievable 72. It is used to label answers, never to produce them.
 */
export const bound = (mask: Uint8Array): number => {
  const degrees: number[] = [];
  let n = 0;
  for (let i = 0; i < CELL_COUNT; i++) {
    if (mask[i] !== 1) continue;
    n++;
    let d = 0;
    const ns = NEIGHBOURS[i];
    for (let k = 0; k < ns.length; k++) if (mask[ns[k]] === 1) d++;
    degrees.push(d);
  }
  if (n === 0) return 0;
  degrees.sort((x, y) => y - x);
  let best = 0;
  let sum = 0;
  for (let k = 0; k <= n; k++) {
    if (k > 0) sum += degrees[k - 1];
    const byDegree = Math.floor(sum / 2);
    const byRoom = n - k;
    const here = Math.min(byDegree, byRoom);
    if (here > best) best = here;
  }
  return best;
};

/**
 * Structured starting layouts.
 *
 * Left to itself the pair search finds good layouts but not reliably the best
 * ones, because the good layouts are periodic and it has to discover the
 * period by accident. These seeds hand it the period directly: parallel
 * planted lines every third row or column, with the crops alternating along
 * each line so that any cell beside the line sees three consecutive planted
 * cells and therefore both crops.
 *
 * Two styles per line, because they win in different places. The gapped style
 * leaves every third cell of the line empty, and those gaps are themselves
 * covered by their two neighbours along the line, which is what reaches 72 on
 * a full plot. The dense style plants the whole line, which loses cells in the
 * middle but survives better against a ragged unlocked boundary.
 */
const seedInto = (
  field: CoverField,
  axis: 0 | 1,
  lineOffset: number,
  phase: number,
  gapped: boolean
): void => {
  field.clear();
  for (let k = 0; k < field.cells.length; k++) {
    const i = field.cells[k];
    const row = Math.floor(i / 10);
    const col = i % 10;
    const line = axis === 0 ? row : col;
    const along = axis === 0 ? col : row;
    if (((line % 3) + 3) % 3 !== lineOffset) continue;
    const t = ((along + phase) % 3 + 3) % 3;
    if (gapped) {
      if (t === 0) field.set(i, CROP_A);
      else if (t === 1) field.set(i, CROP_B);
    } else {
      field.set(i, ((along + phase) % 2 + 2) % 2 === 0 ? CROP_A : CROP_B);
    }
  }
};

/**
 * Ruin and recreate.
 *
 * The seeded layouts are periodic and periodic layouts have a ceiling: on a
 * full plot every lattice this file can build tops out at 70 against a
 * reachable 72, which is the same ceiling `solver/seeds.ts` records for this
 * family of mutations. The last two spawns come from breaking the period near
 * the plot edge, where a non-repeating arrangement beats any tiling.
 *
 * So: clear a random square patch, climb back out, keep the result only when
 * it is at least as good. Accepting equal scores matters, because it lets the
 * layout drift sideways through plateaus that a strict improvement rule would
 * refuse to cross. The RNG is seeded from the unlocked set, so the same plot
 * always produces the same answer.
 */
const refine = (
  field: CoverField,
  rounds: number,
  seed: number,
  limit: number,
  budgetMs: number
): void => {
  if (field.cells.length === 0) return;
  const rng = mulberry32(seed);
  const startedAt = Date.now();
  let best = field.score;
  let bestState = field.snapshot();
  for (let round = 0; round < rounds && best < limit; round++) {
    // Checked in blocks so the clock read does not dominate a cheap round, but
    // in SMALL blocks: the planner hands out budgets of a few milliseconds per
    // step, and a coarser check would sail past them and never bind.
    if ((round & 7) === 0 && round > 0 && Date.now() - startedAt > budgetMs) break;
    const centre = field.cells[rng.int(field.cells.length)] ?? field.cells[0];
    const radius = 1 + rng.int(3);
    const cr = Math.floor(centre / 10);
    const cc = centre % 10;
    for (let r = cr - radius; r <= cr + radius; r++) {
      for (let c = cc - radius; c <= cc + radius; c++) {
        if (r < 0 || c < 0 || r > 9 || c > 9) continue;
        const i = r * 10 + c;
        if (field.mask[i] !== 1) continue;
        field.set(i, rng.int(3));
      }
    }
    // Only the ruined patch changed, so only cells within one more ring of it
    // can have changed coverage, and only moves touching those can repair it.
    // A full sweep every so often catches anything the local view cannot see.
    if ((round & 127) === 127) field.climb(12);
    else field.climb(12, field.cellsNear(centre, radius + 2));
    if (field.score >= best) {
      best = field.score;
      bestState = field.snapshot();
    } else {
      field.restore(bestState);
    }
  }
  field.restore(bestState);
};

/** Stable seed for the RNG, derived from which cells are unlocked. */
const maskSeed = (mask: Uint8Array): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < CELL_COUNT; i++) {
    h ^= mask[i] === 1 ? i + 1 : 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
};

export interface PotentialOptions {
  /**
   * Ruin and recreate rounds. 0 skips that stage entirely.
   *
   * Measured on a full 10x10: 600 rounds reach 71 and 2000 reach 72, which is
   * the best yield the project's main solver finds for gloomgourd. Above 2000
   * nothing further was found in runs up to 20000, so the default sits just
   * past where the curve flattens and the wall clock stops it earlier anyway.
   */
  rounds?: number;
  /** Wall clock ceiling for the ruin and recreate stage. */
  timeBudgetMs?: number;
  /**
   * How many structured seeds to climb, best-first by their unclimbed score.
   * All of them is best and slowest; the planner spends less per step because
   * it runs this once per unlocked cell rather than once per plot.
   */
  climbTop?: number;
  /**
   * An extra starting layout, normally the previous step's answer. Growing a
   * plot never invalidates a layout, so the previous answer is always legal
   * here and is often already close.
   */
  warmStart?: Uint8Array;
}

const SEED_SHAPES: { axis: 0 | 1; lineOffset: number; phase: number; gapped: boolean }[] = (() => {
  const out: { axis: 0 | 1; lineOffset: number; phase: number; gapped: boolean }[] = [];
  for (const axis of [0, 1] as const) {
    for (let lineOffset = 0; lineOffset < 3; lineOffset++) {
      for (let phase = 0; phase < 3; phase++) {
        for (const gapped of [true, false]) out.push({ axis, lineOffset, phase, gapped });
      }
    }
  }
  return out;
})();

/**
 * Maximum gloomgourd coverage on `mask`, with the layout that achieves it.
 *
 * Scores every structured seed cheaply, climbs the most promising ones, then
 * spends whatever budget is left on ruin and recreate. Deterministic: the RNG
 * is seeded from the unlocked set, so the same plot always returns the same
 * number and the same layout.
 */
export const gloomgourdPotential = (
  mask: Uint8Array,
  options: PotentialOptions = {}
): PotentialResult => {
  const {
    rounds = 4000,
    timeBudgetMs = 2500,
    climbTop = SEED_SHAPES.length,
    warmStart,
  } = options;
  const field = new CoverField(mask);
  const limit = bound(mask);
  let best = -1;
  let bestAssignment = new Uint8Array(CELL_COUNT);

  const consider = (): boolean => {
    if (field.score > best) {
      best = field.score;
      bestAssignment = field.snapshot();
    }
    return best >= limit;
  };

  const done = (): PotentialResult => ({
    value: best,
    bound: limit,
    proved: best >= limit,
    assignment: bestAssignment,
  });

  if (warmStart) {
    field.clear();
    field.restore(warmStart);
    field.climb();
    if (consider()) return done();
  }

  field.clear();
  field.climb();
  if (consider()) return done();

  // Rank the seeds before paying to climb any of them. The unclimbed score is
  // a rough guide, but it is free and it reliably separates a lattice that
  // lands on the unlocked cells from one that mostly falls on locked ones.
  const ranked = SEED_SHAPES.map((shape) => {
    seedInto(field, shape.axis, shape.lineOffset, shape.phase, shape.gapped);
    return { shape, raw: field.score };
  }).sort((a, b) => b.raw - a.raw);

  for (let k = 0; k < Math.min(climbTop, ranked.length); k++) {
    const { shape } = ranked[k];
    seedInto(field, shape.axis, shape.lineOffset, shape.phase, shape.gapped);
    field.climb();
    if (consider()) return done();
  }

  if (rounds > 0) {
    field.clear();
    field.restore(bestAssignment);
    refine(field, rounds, maskSeed(mask), limit, timeBudgetMs);
    consider();
  }

  return done();
};

/** Counts coverage of an assignment from scratch. Used to verify, never to search. */
export const countCoverage = (mask: Uint8Array, state: Uint8Array): number => {
  let total = 0;
  for (let i = 0; i < CELL_COUNT; i++) {
    if (mask[i] !== 1 || state[i] !== EMPTY) continue;
    let a = false;
    let b = false;
    const ns = NEIGHBOURS[i];
    for (let k = 0; k < ns.length; k++) {
      const n = ns[k];
      if (mask[n] !== 1) continue;
      if (state[n] === CROP_A) a = true;
      else if (state[n] === CROP_B) b = true;
    }
    if (a && b) total++;
  }
  return total;
};
