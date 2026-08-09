import type { Problem } from "./problem.ts";

/**
 * The crop field plus every counter derived from it, maintained incrementally.
 *
 * Recomputing the whole plot after each move costs about 100 anchors x 16 ring
 * cells x 5 requirements. Doing that inside an annealing loop is what limits a
 * naive solver to a few thousand iterations a second. Instead: changing one
 * cell can only affect anchors whose ring or block contains that cell, at most
 * (2S+1)^2 of them, so every move is O(20) regardless of plot size.
 *
 * The two lists are disjoint by construction - a ring never includes its own
 * block - which is what lets the update walk them independently.
 */

/**
 * Three tiers in one integer, widest first, with no overlap possible.
 *
 *   spawns    x 2^30   the thing actually being maximised
 *   priority  x 2^17   caller's rank, breaks ties between equal spawn counts
 *   partial            smooths the landscape so local search can climb
 *
 * The ranges are chosen so no tier can ever outvote the one above it: partial
 * peaks near 100 anchors x 1024 = 102400, below 2^17; the priority bonus peaks
 * at 100 spawns x rank 34 = 3400, and 3400 x 2^17 is below 2^30. A hundred
 * spawns is about 1.07e11, still exact in a double.
 */
const HARD_WEIGHT = 1 << 30;

const PRIORITY_WEIGHT = 1 << 17;

/** Partial credit is scaled so a full ring is worth the same for every target. */
const SOFT_SCALE = 1024;

export class Field {
  readonly problem: Problem;
  /** -1 for empty (or locked), otherwise a palette index. */
  readonly cells: Int16Array;

  private readonly maxReq: number;
  private readonly have: Int16Array;
  private readonly need: Int16Array;
  private readonly unmet: Int16Array;
  private readonly partial: Int32Array;
  private readonly blockPlanted: Int16Array;
  private readonly ringPlanted: Int16Array;
  private readonly satisfied: Uint8Array;
  private readonly targetOf: Int32Array;
  private readonly softWeight: Int32Array;
  private readonly satisfiedCount: Int32Array;
  private readonly priority: Int32Array;
  private soft = 0;

  constructor(problem: Problem) {
    this.problem = problem;
    // Starts from the locked baseline, not from bare soil.
    this.cells = Int16Array.from(problem.baseline);
    this.maxReq = Math.max(1, ...problem.targets.map((t) => t.requirements.length));

    const anchorCount = problem.anchors.length;
    this.have = new Int16Array(anchorCount * this.maxReq);
    this.need = new Int16Array(problem.targets.length * this.maxReq);
    this.unmet = new Int16Array(anchorCount);
    this.partial = new Int32Array(anchorCount);
    this.blockPlanted = new Int16Array(anchorCount);
    this.ringPlanted = new Int16Array(anchorCount);
    this.satisfied = new Uint8Array(anchorCount);
    this.targetOf = new Int32Array(anchorCount);
    this.softWeight = new Int32Array(problem.targets.length);
    this.satisfiedCount = new Int32Array(problem.targets.length);
    this.priority = Int32Array.from(problem.targets.map((target) => target.priority));

    problem.targets.forEach((target, ti) => {
      target.requirements.forEach((req, slot) => {
        this.need[ti * this.maxReq + slot] = req.count;
      });
      // zeroAdjacent has no requirement slots; its whole "requirement" is the
      // single condition "ring holds nothing", worth one unit of partial credit.
      const total = target.zeroAdjacent ? 1 : Math.max(1, target.reqSum);
      this.softWeight[ti] = Math.max(1, Math.round(SOFT_SCALE / total));
    });
    problem.anchors.forEach((anchor, ai) => {
      this.targetOf[ai] = anchor.targetIndex;
    });

    this.rebuild();
  }

  /** Recomputes every counter from `cells`. Used on load and after a restore. */
  rebuild(): void {
    const { problem } = this;
    this.have.fill(0);
    this.unmet.fill(0);
    this.partial.fill(0);
    this.blockPlanted.fill(0);
    this.ringPlanted.fill(0);
    this.satisfied.fill(0);
    this.satisfiedCount.fill(0);
    this.soft = 0;

    problem.anchors.forEach((anchor, ai) => {
      const target = problem.targets[anchor.targetIndex];
      const base = ai * this.maxReq;
      for (const cell of anchor.block) if (this.cells[cell] >= 0) this.blockPlanted[ai]++;
      for (const cell of anchor.ring) {
        const crop = this.cells[cell];
        if (crop < 0) continue;
        this.ringPlanted[ai]++;
        const slot = target.reqSlotOfCrop[crop];
        if (slot >= 0) this.have[base + slot]++;
      }

      if (target.zeroAdjacent) {
        this.unmet[ai] = this.ringPlanted[ai] > 0 ? 1 : 0;
        this.partial[ai] = this.ringPlanted[ai] > 0 ? 0 : 1;
      } else {
        for (let slot = 0; slot < target.requirements.length; slot++) {
          const needed = this.need[anchor.targetIndex * this.maxReq + slot];
          const got = this.have[base + slot];
          if (got < needed) this.unmet[ai]++;
          this.partial[ai] += got < needed ? got : needed;
        }
      }

      this.satisfied[ai] = this.blockPlanted[ai] === 0 && this.unmet[ai] === 0 ? 1 : 0;
      if (this.satisfied[ai]) this.satisfiedCount[anchor.targetIndex]++;
      if (this.blockPlanted[ai] === 0) {
        this.soft += this.partial[ai] * this.softWeight[anchor.targetIndex];
      }
    });
  }

  private drop(ai: number): void {
    const ti = this.targetOf[ai];
    if (this.satisfied[ai]) this.satisfiedCount[ti]--;
    if (this.blockPlanted[ai] === 0) this.soft -= this.partial[ai] * this.softWeight[ti];
  }

  private add(ai: number): void {
    const ti = this.targetOf[ai];
    this.satisfied[ai] = this.blockPlanted[ai] === 0 && this.unmet[ai] === 0 ? 1 : 0;
    if (this.satisfied[ai]) this.satisfiedCount[ti]++;
    if (this.blockPlanted[ai] === 0) this.soft += this.partial[ai] * this.softWeight[ti];
  }

  /** Plants `crop` (or -1 to clear) at `cell`, updating every derived counter. */
  set(cell: number, crop: number): void {
    const previous = this.cells[cell];
    if (previous === crop) return;
    this.cells[cell] = crop;

    const wasPlanted = previous >= 0 ? 1 : 0;
    const isPlanted = crop >= 0 ? 1 : 0;
    const plantedDelta = isPlanted - wasPlanted;

    const ringAnchors = this.problem.anchorsOnRing[cell];
    for (let i = 0; i < ringAnchors.length; i++) {
      const ai = ringAnchors[i];
      const ti = this.targetOf[ai];
      const target = this.problem.targets[ti];
      this.drop(ai);

      if (plantedDelta !== 0) this.ringPlanted[ai] += plantedDelta;

      if (target.zeroAdjacent) {
        this.unmet[ai] = this.ringPlanted[ai] > 0 ? 1 : 0;
        this.partial[ai] = this.ringPlanted[ai] > 0 ? 0 : 1;
      } else {
        const base = ai * this.maxReq;
        const needBase = ti * this.maxReq;
        if (previous >= 0) {
          const slot = target.reqSlotOfCrop[previous];
          if (slot >= 0) {
            const before = this.have[base + slot]--;
            const needed = this.need[needBase + slot];
            if (before <= needed) this.partial[ai]--;
            if (before === needed) this.unmet[ai]++;
          }
        }
        if (crop >= 0) {
          const slot = target.reqSlotOfCrop[crop];
          if (slot >= 0) {
            const before = this.have[base + slot]++;
            const needed = this.need[needBase + slot];
            if (before < needed) this.partial[ai]++;
            if (before + 1 === needed) this.unmet[ai]--;
          }
        }
      }
      this.add(ai);
    }

    if (plantedDelta !== 0) {
      const blockAnchors = this.problem.anchorsOnBlock[cell];
      for (let i = 0; i < blockAnchors.length; i++) {
        const ai = blockAnchors[i];
        this.drop(ai);
        this.blockPlanted[ai] += plantedDelta;
        this.add(ai);
      }
    }
  }

  /** Back to the locked baseline. Locked crops survive; nothing else does. */
  clear(): void {
    this.cells.set(this.problem.baseline);
    this.rebuild();
  }

  load(cells: Int16Array): void {
    this.cells.set(cells);
    this.rebuild();
  }

  snapshot(): Int16Array {
    return Int16Array.from(this.cells);
  }

  isSatisfied(anchorIndex: number): boolean {
    return this.satisfied[anchorIndex] === 1;
  }

  /** How close anchor `ai` is to legal, as satisfied requirement units. */
  partialOf(anchorIndex: number): number {
    return this.partial[anchorIndex];
  }

  unmetOf(anchorIndex: number): number {
    return this.unmet[anchorIndex];
  }

  blockPlantedOf(anchorIndex: number): number {
    return this.blockPlanted[anchorIndex];
  }

  ringPlantedOf(anchorIndex: number): number {
    return this.ringPlanted[anchorIndex];
  }

  /** Ring cells of `ai` currently holding `crop`, straight from the counters. */
  haveOf(anchorIndex: number, slot: number): number {
    return this.have[anchorIndex * this.maxReq + slot];
  }

  satisfiedFor(targetIndex: number): number {
    return this.satisfiedCount[targetIndex];
  }

  /** Every anchor currently legal, in anchor order so the result is stable. */
  satisfiedAnchors(): number[] {
    const out: number[] = [];
    for (let ai = 0; ai < this.satisfied.length; ai++) if (this.satisfied[ai]) out.push(ai);
    return out;
  }

  /**
   * Search score. Spawns dominate; partial credit smooths the landscape so a
   * move that brings a ring from 5/8 to 6/8 is visibly better than one that
   * does nothing, which is what lets local search find full rings at all.
   */
  score(): number {
    return this.hard() * HARD_WEIGHT + this.priorityValue() * PRIORITY_WEIGHT + this.soft;
  }

  /**
   * Caller's priority rank times capped spawns.
   *
   * With one target this is a fixed multiple of the spawn count, so it cannot
   * reorder anything - priorities are documented as having no effect on a
   * single-target solve, and this is why that is true rather than asserted.
   */
  priorityValue(): number {
    let total = 0;
    for (let ti = 0; ti < this.satisfiedCount.length; ti++) {
      const cap = this.problem.targets[ti].cap;
      const got = this.satisfiedCount[ti];
      total += (got < cap ? got : cap) * this.priority[ti];
    }
    return total;
  }

  /**
   * Spawns, after per-target caps. The quantity the caller actually wants.
   *
   * Kept separate from `score` because the two live on incompatible scales: one
   * spawn is worth 2^20 score points, so an acceptance test written against the
   * combined number can never accept losing a spawn at any temperature that
   * still lets the partial-credit term move. Annealing them on their own scales
   * is what makes this a real annealer rather than a hill climber.
   */
  hard(): number {
    let total = 0;
    for (let ti = 0; ti < this.satisfiedCount.length; ti++) {
      const cap = this.problem.targets[ti].cap;
      const got = this.satisfiedCount[ti];
      total += got < cap ? got : cap;
    }
    return total;
  }

  /**
   * Everything below the spawn count, as one number: priority tie-break plus
   * partial credit. This is what the annealer compares when a move leaves the
   * spawn count unchanged.
   */
  softValue(): number {
    return this.priorityValue() * PRIORITY_WEIGHT + this.soft;
  }

  /** Spawn count ignoring caps, used for reporting. */
  rawSatisfied(): number {
    let total = 0;
    for (let ti = 0; ti < this.satisfiedCount.length; ti++) total += this.satisfiedCount[ti];
    return total;
  }
}
