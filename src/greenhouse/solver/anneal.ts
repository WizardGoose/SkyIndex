import type { Field } from "./field.ts";
import type { Problem } from "./problem.ts";
import type { Rng } from "./rng.ts";

/**
 * Polishing. The seeds decide the shape of the layout; this recovers the last
 * few spawns that no periodic pattern can reach.
 *
 * The move set matters far more than the iteration count. A recolour-only
 * annealer wanders: it can see that a ring is one crop short but has no way to
 * act on that knowledge, so it has to stumble into the fix. REPAIR closes that
 * loop directly - find a ring that is one short, plant the missing crop in a
 * cell it is not using - and HARVEST frees the cells that repair needs by
 * clearing crops that feed nothing.
 */

/**
 * Partial credit moves in units of roughly 1024/reqSum per ring cell, so its
 * temperature has to be scaled up to match. Spawn deltas stay on a unit scale.
 */
const SOFT_TEMPERATURE = 300;

/**
 * Fraction of proposals given to the compound surplus-relocation move.
 *
 * Only coupled single targets offer this move at all now (see `compound` in
 * index.ts), so this share is a lever on soggybud and ashwreath and on nothing
 * else. It was re-swept on the shipped seed against the measure that matters
 * for that family, the rate at which they reach their known-good 52 over 20
 * seeds, with every other slack mutation watched for regressions:
 *
 *   0.10 -> 52 reached on 1 seed in 20     0.20 -> never     0.35 -> never
 *
 * Raising it does not buy more of the move, it buys fewer of everything else: a
 * compound proposal costs roughly ten times a recolour to build, so past about
 * 0.2 the iterations it displaces cost more than the compound moves it wins.
 * 0.10 also leaves the other seven slack mutations exactly at their best
 * numbers, which 0.20 and 0.35 do too, so this is chosen on the top end alone.
 */
const RELOCATE_SHARE = 0.1;

/**
 * How many windows a ruin looks at before choosing one to clear.
 *
 * 1 is the old uniform behaviour. Swept on the shipped seed against the rate at
 * which the two hardest mutations reach their known-good 52 over 40 seeds, which
 * is the honest measure: a setting that only flips the one seed we ship has
 * bought luck, not quality.
 */
const RUIN_CANDIDATES = 4;

interface Undo {
  cell: number;
  crop: number;
}

const record = (field: Field, cell: number, crop: number, undo: Undo[]): void => {
  undo.push({ cell, crop: field.cells[cell] });
  field.set(cell, crop);
};

const rollback = (field: Field, undo: Undo[]): void => {
  for (let i = undo.length - 1; i >= 0; i--) field.set(undo[i].cell, undo[i].crop);
};

/** Plants a crop some nearly-legal block is missing, into a cell it is wasting. */
const repairMove = (field: Field, problem: Problem, rng: Rng, undo: Undo[]): boolean => {
  const anchors = problem.anchors;
  let best = -1;
  let bestUnmet = Number.POSITIVE_INFINITY;
  // Sampling beats scanning: the whole point is to be cheap enough to run
  // millions of times, and any near-miss will do.
  for (let attempt = 0; attempt < 12; attempt++) {
    const ai = rng.int(anchors.length);
    if (field.blockPlantedOf(ai) !== 0) continue;
    const unmet = field.unmetOf(ai);
    if (unmet === 0 || unmet >= bestUnmet) continue;
    bestUnmet = unmet;
    best = ai;
  }
  if (best < 0) return false;

  const anchor = anchors[best];
  const target = problem.targets[anchor.targetIndex];
  if (target.zeroAdjacent) {
    // "Repairing" a lonelily means clearing its ring, not planting in it.
    const planted = anchor.ring.filter((cell) => field.cells[cell] >= 0 && problem.plantableMask[cell]);
    if (planted.length === 0) return false;
    record(field, planted[rng.int(planted.length)], -1, undo);
    return true;
  }

  const shortSlots: number[] = [];
  target.requirements.forEach((req, slot) => {
    if (field.haveOf(best, slot) < req.count) shortSlots.push(slot);
  });
  if (shortSlots.length === 0) return false;
  const slot = shortSlots[rng.int(shortSlots.length)];
  const wanted = target.requirements[slot].cropIndex;

  // Prefer an empty ring cell, then one holding something this block does not
  // need, then one holding a crop it already has in surplus.
  const empty: number[] = [];
  const useless: number[] = [];
  const surplus: number[] = [];
  for (const cell of anchor.ring) {
    if (!problem.plantableMask[cell]) continue;
    const crop = field.cells[cell];
    if (crop === wanted) continue;
    if (crop < 0) {
      empty.push(cell);
      continue;
    }
    const otherSlot = target.reqSlotOfCrop[crop];
    if (otherSlot < 0) useless.push(cell);
    else if (field.haveOf(best, otherSlot) > target.requirements[otherSlot].count) surplus.push(cell);
  }
  const pool = empty.length > 0 ? empty : useless.length > 0 ? useless : surplus;
  if (pool.length === 0) return false;
  record(field, pool[rng.int(pool.length)], wanted, undo);
  return true;
};

/** Clears a planted cell, freeing space for a spawn or for a repair. */
const harvestMove = (field: Field, problem: Problem, rng: Rng, undo: Undo[]): boolean => {
  for (let attempt = 0; attempt < 8; attempt++) {
    const cell = problem.plantable[rng.int(problem.plantable.length)];
    if (field.cells[cell] < 0) continue;
    record(field, cell, -1, undo);
    return true;
  }
  return false;
};

/** Empties a block that is otherwise ready, so it can actually spawn. */
const clearBlockMove = (field: Field, problem: Problem, rng: Rng, undo: Undo[]): boolean => {
  for (let attempt = 0; attempt < 8; attempt++) {
    const ai = rng.int(problem.anchors.length);
    if (field.blockPlantedOf(ai) === 0) continue;
    if (field.unmetOf(ai) > 1) continue;
    for (const cell of problem.anchors[ai].block) if (field.cells[cell] >= 0) record(field, cell, -1, undo);
    return undo.length > 0;
  }
  return false;
};

/**
 * True when clearing `cell` cannot cost a spawn.
 *
 * Only an anchor that is CURRENTLY satisfied has a spawn to lose, and it loses
 * one only where it holds exactly its requirement of this crop. Anything above
 * that is surplus: `have` stays at or above `need`, and partial credit is
 * min(have, need), so the removal is neutral on BOTH scales rather than merely
 * cheap. That is what makes it invisible to a single-cell annealer, which only
 * ever follows a gradient.
 */
const isSurplus = (field: Field, problem: Problem, cell: number): boolean => {
  const crop = field.cells[cell];
  if (crop < 0) return false;
  const ringAnchors = problem.anchorsOnRing[cell];
  for (let i = 0; i < ringAnchors.length; i++) {
    const ai = ringAnchors[i];
    if (!field.isSatisfied(ai)) continue;
    const target = problem.targets[problem.anchors[ai].targetIndex];
    const slot = target.reqSlotOfCrop[crop];
    if (slot < 0) continue;
    if (field.haveOf(ai, slot) <= target.requirements[slot].count) return false;
  }
  return true;
};

/**
 * SURPLUS RELOCATION. One atomic move: take a crop nothing satisfied is relying
 * on, and replant it where it completes a spawn that is otherwise one short.
 *
 * Why this cannot be reached one cell at a time. Clearing a surplus crop is
 * exactly score-neutral, by the argument in `isSurplus` above - no spawn moves,
 * no partial credit moves - so the annealer has no reason to prefer it and no
 * gradient pointing at it. Planting the missing crop is worth nothing on its own
 * while a crop still sits on the deficit anchor's own block, because an anchor
 * with anything planted inside it can never spawn however good its ring is. Each
 * half scores neutral-or-worse alone; only the pair is +1. Single-cell hill
 * climbing is therefore structurally blind to it, which is why `polish` - which
 * tries every label in every cell exhaustively - still leaves these on the
 * table.
 *
 * The two cells are not adjacent and are not related by geometry at all. They
 * are related by the surplus/deficit structure, so the proposal is built from
 * the counters rather than from a neighbourhood.
 *
 * SLACK FAMILY ONLY. A full-ring target has no surplus by definition: its
 * requirement counts sum to the ring size, so every ring cell is spoken for and
 * `isSurplus` can never be true. Offering the move there would only burn
 * proposals, so the caller gates it out and the full-ring schedule is left bit
 * for bit as it was.
 */
const surplusRelocateMove = (field: Field, problem: Problem, rng: Rng, undo: Undo[]): boolean => {
  const anchors = problem.anchors;

  // 1. A deficit anchor: exactly one unmet requirement, short by exactly one
  //    crop, and at most one crop sitting on its own block. Anything looser
  //    needs more than two cells to fix, so proposing it is just noise.
  let ai = -1;
  let slot = -1;
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = rng.int(anchors.length);
    if (field.unmetOf(candidate) !== 1) continue;
    if (field.blockPlantedOf(candidate) > 1) continue;
    const target = problem.targets[anchors[candidate].targetIndex];
    // The family split, enforced per anchor and not only per problem.
    //
    // Unreachable as things stand - `compound` is only set on a single-target
    // solve, and the problem-level gate already refuses a lone full-ring or
    // lonelily target - so this is here to keep the split true by construction
    // if the scope ever widens to joint solves, which can mix the families.
    // It is NOT what rescued the two mixed multi-target configs: adding it
    // alone left dustgrain+noctilume and dustgrain+glasscorn+snoozling at 71,
    // and only scoping the whole move away from joint solves restored them.
    if (target.fullRing || target.zeroAdjacent) continue;
    let short = -1;
    for (let s = 0; s < target.requirements.length; s++) {
      if (field.haveOf(candidate, s) < target.requirements[s].count) {
        short = s;
        break;
      }
    }
    if (short < 0) continue;
    // Short by two is not reachable by moving one crop.
    if (field.haveOf(candidate, short) + 1 !== target.requirements[short].count) continue;
    ai = candidate;
    slot = short;
    break;
  }
  if (ai < 0) return false;

  const anchor = anchors[ai];
  const target = problem.targets[anchor.targetIndex];
  const wanted = target.requirements[slot].cropIndex;
  if (wanted < 0) return false;

  // 2. The anchor's own block has to be bare before it can spawn. The one crop
  //    the filter allows there must go, so it has to be safe to clear - and if
  //    it happens to be the crop we are short of, it is the donor itself and
  //    the move is a literal relocation out of the block into the ring.
  let blocker = -1;
  if (field.blockPlantedOf(ai) === 1) {
    for (const cell of anchor.block) {
      if (field.cells[cell] >= 0) {
        blocker = cell;
        break;
      }
    }
    if (blocker < 0 || !problem.plantableMask[blocker]) return false;
    if (!isSurplus(field, problem, blocker)) return false;
  }

  // 3. Where the crop lands: a ring cell of this anchor not already holding it,
  //    ranked by what landing there actually costs.
  //
  //    EMPTY costs nothing to fill.
  //    SPARE planted with a crop that is surplus everywhere AND that THIS
  //          anchor is not counting on - trading one unmet slot for another
  //          gains nothing - so clearing it is neutral and the move is +1.
  //
  //    Empty is taken first because it is the cheaper of the two, not because
  //    it always pays: in a dense slack packing most empty cells are somebody
  //    else's spawn, so landing there buys this spawn by destroying that one
  //    and comes out flat. That is deliberate. Measured over five seeds,
  //    splitting the empty cells and demoting the ones already spawning cost
  //    more than it saved (2912 against 2914 across the nine slack mutations),
  //    because a flat move across a plateau is how this search crosses one -
  //    the annealer accepts equal-scoring moves, and starving it of them is
  //    what pinned choconut and dustgrain back below 72 on two seeds in five.
  const empty: number[] = [];
  const spare: number[] = [];
  for (const cell of anchor.ring) {
    if (!problem.plantableMask[cell]) continue;
    const crop = field.cells[cell];
    if (crop === wanted) continue;
    if (crop < 0) {
      empty.push(cell);
      continue;
    }
    const held = target.reqSlotOfCrop[crop];
    if (held >= 0 && field.haveOf(ai, held) <= target.requirements[held].count) continue;
    if (isSurplus(field, problem, cell)) spare.push(cell);
  }
  const pool = empty.length > 0 ? empty : spare;
  if (pool.length === 0) return false;
  const landing = pool[rng.int(pool.length)];

  // 4. Where the crop comes from. The blocker when it already holds the right
  //    crop, otherwise a surplus cell elsewhere. It must sit outside this
  //    anchor's ring: taking it from there would undo the very gain being
  //    bought.
  let donor = blocker >= 0 && field.cells[blocker] === wanted ? blocker : -1;
  if (donor < 0) {
    for (let attempt = 0; attempt < 8; attempt++) {
      const cell = problem.plantable[rng.int(problem.plantable.length)];
      if (cell === landing || cell === blocker) continue;
      if (field.cells[cell] !== wanted) continue;
      const ringAnchors = problem.anchorsOnRing[cell];
      let inRing = false;
      for (let i = 0; i < ringAnchors.length; i++) {
        if (ringAnchors[i] === ai) {
          inRing = true;
          break;
        }
      }
      if (inRing) continue;
      if (!isSurplus(field, problem, cell)) continue;
      donor = cell;
      break;
    }
  }
  if (donor < 0) return false;

  if (blocker >= 0 && blocker !== donor) record(field, blocker, -1, undo);
  record(field, donor, -1, undo);
  record(field, landing, wanted, undo);
  return true;
};

const swapMove = (field: Field, problem: Problem, rng: Rng, undo: Undo[]): boolean => {
  const cells = problem.plantable;
  const a = cells[rng.int(cells.length)];
  const b = cells[rng.int(cells.length)];
  if (a === b) return false;
  const cropA = field.cells[a];
  const cropB = field.cells[b];
  if (cropA === cropB) return false;
  record(field, a, cropB, undo);
  record(field, b, cropA, undo);
  return true;
};

const recolourMove = (field: Field, problem: Problem, rng: Rng, undo: Undo[]): boolean => {
  const cell = problem.plantable[rng.int(problem.plantable.length)];
  const palette = problem.palette.length;
  const current = field.cells[cell];
  // -1 is a legal destination: emptying a cell is how spawn space appears.
  let next = rng.int(palette + 1) - 1;
  if (next === current) next = current === -1 ? (palette > 0 ? 0 : -1) : -1;
  if (next === current) return false;
  record(field, cell, next, undo);
  return true;
};

/**
 * Deterministic finishing sweep: every cell against every label, take any
 * strict improvement, repeat until a whole pass changes nothing.
 *
 * A stuck annealer is very often one or two single-cell changes from the true
 * optimum, and this finds those exhaustively rather than hoping a random move
 * lands on them. Unlike `repaint` in seeds.ts it also tries EMPTY, so it can
 * open a spawn cell as well as recolour one. Costs 100*(palette+1) evaluations
 * per pass, which with incremental scoring is nothing.
 */
export const polish = (field: Field, problem: Problem, maxPasses: number): void => {
  const labels: number[] = [-1];
  for (let crop = 0; crop < problem.palette.length; crop++) labels.push(crop);

  for (let pass = 0; pass < maxPasses; pass++) {
    let improved = false;
    for (const cell of problem.plantable) {
      const start = field.cells[cell];
      let bestLabel = start;
      let bestScore = field.score();
      for (const label of labels) {
        if (label === start) continue;
        field.set(cell, label);
        const score = field.score();
        if (score > bestScore) {
          bestScore = score;
          bestLabel = label;
        }
      }
      field.set(cell, bestLabel);
      if (bestLabel !== start) improved = true;
    }
    if (!improved) break;
  }
};

export interface AnnealOptions {
  iterations: number;
  startTemperature: number;
  endTemperature: number;
  /** Stops early once this many spawns are placed; used with a proven bound. */
  targetHard: number;
  /** Checked every 4096 iterations so the loop stays tight. */
  deadline: number;
  /**
   * Iterations of no improvement before the search gives up on where it is,
   * returns to the best layout found and kicks it.
   *
   * Measured need: a single monotonic cool converges and then stops finding
   * anything, so 12 million iterations score exactly the same as 1 million.
   * Restarting from the best with a perturbation is what turns extra budget
   * back into extra yield.
   */
  reheatAfter: number;
  /** Cells disturbed by a scattered kick. */
  kickSize: number;
  /**
   * Whether the compound surplus-relocation proposal is offered at all.
   *
   * Scoped rather than universal because it was measured both ways. On a
   * SINGLE-target solve it pays: over five seeds across the nine slack
   * mutations it is worth +11 spawns, and it pins choconut and dustgrain to 72
   * and witherbloom to 52 on every seed rather than one in five. On a JOINT
   * solve it costs: the same nine-seed style sweep over the six multi-target
   * configs lost 15, and a ten-seed re-measure of the three worst rows
   * confirmed it as systematic rather than noise - dustgrain+noctilume reached
   * 72 on nine seeds in ten without it and only five in ten with it.
   *
   * A joint solve spends its budget in fractions: each target gets a forced
   * single-target pass worth iterations/(2n), then the joint search gets half.
   * A compound proposal costs roughly ten times a recolour to build and fires
   * rarely, and no stage of a joint solve runs long enough to earn that back -
   * so the displaced cheap proposals are a straight loss. This mirrors the
   * relaxed-geometry seed in index.ts, which is gated to single-target solves
   * for the same measured reason.
   */
  compound: boolean;
  /**
   * When set, a kick instead RUINS a square window of this side length and
   * lets the search recreate it.
   *
   * Scattered single-cell kicks barely move a dense packing: the annealer
   * repairs each one locally and returns to the same layout. Clearing a whole
   * region forces it to rebuild that neighbourhood from nothing, which is the
   * only perturbation large enough to reach a different packing.
   */
  kickWindow?: number;
}

export interface AnnealResult {
  bestScore: number;
  bestCells: Int16Array;
  iterations: number;
}

export const anneal = (
  field: Field,
  problem: Problem,
  rng: Rng,
  options: AnnealOptions
): AnnealResult => {
  let bestScore = field.score();
  let bestHard = field.hard();
  let bestCells = field.snapshot();
  if (problem.palette.length === 0 || problem.plantable.length === 0) {
    return { bestScore, bestCells, iterations: 0 };
  }

  const cooling =
    options.iterations > 0
      ? Math.pow(options.endTemperature / options.startTemperature, 1 / options.iterations)
      : 1;
  let temperature = options.startTemperature;
  let currentHard = field.hard();
  let currentSoft = field.softValue();
  const undo: Undo[] = [];
  let sinceImprovement = 0;
  let iteration = 0;

  /**
   * Share of proposals spent on surplus relocation. Zero unless the caller
   * asked for compound moves AND some target actually has ring slack.
   *
   * A full-ring target has `reqSum === ringSize`, so every ring cell is spoken
   * for and no crop is ever surplus - the move would always fail its own filter
   * and the proposal would be wasted.
   *
   * Zero is not just "skip the branch": it makes `scaled` equal `roll` exactly,
   * because dividing by one is exact in floating point. So every solve that
   * does not opt in - the 27 full-ring mutations, and every joint solve - draws
   * the same numbers from the same generator and takes the same branches it
   * always did, and its output is unchanged bit for bit rather than merely
   * unchanged in yield.
   */
  const relocateShare =
    options.compound && problem.targets.some((target) => !target.fullRing && !target.zeroAdjacent)
      ? RELOCATE_SHARE
      : 0;

  for (; iteration < options.iterations; iteration++) {
    if ((iteration & 0xfff) === 0 && Date.now() > options.deadline) break;
    if (bestHard >= options.targetHard) break;

    undo.length = 0;
    const roll = rng.next();
    const scaled = (roll - relocateShare) / (1 - relocateShare);
    const moved =
      roll < relocateShare
        ? surplusRelocateMove(field, problem, rng, undo)
        : scaled < 0.36
          ? recolourMove(field, problem, rng, undo)
          : scaled < 0.66
            ? repairMove(field, problem, rng, undo)
            : scaled < 0.82
              ? swapMove(field, problem, rng, undo)
              : scaled < 0.93
                ? harvestMove(field, problem, rng, undo)
                : clearBlockMove(field, problem, rng, undo);

    if (moved) {
      const hard = field.hard();
      const soft = field.softValue();
      const hardDelta = hard - currentHard;
      // Two scales, two tests. A spawn gained is always taken; a spawn lost is
      // annealed in spawn units; when the spawn count is unchanged the partial
      // credit decides, on its own much finer scale, which is what lets the
      // field drift into position without ever paying for it in yield.
      const accept =
        hardDelta > 0 ||
        (hardDelta === 0
          ? soft >= currentSoft || rng.next() < Math.exp((soft - currentSoft) / (temperature * SOFT_TEMPERATURE))
          : rng.next() < Math.exp(hardDelta / temperature));

      if (accept) {
        currentHard = hard;
        currentSoft = soft;
        const score = field.score();
        if (score > bestScore) {
          bestScore = score;
          bestHard = hard;
          bestCells = field.snapshot();
          sinceImprovement = 0;
        }
      } else {
        rollback(field, undo);
      }
    }

    temperature *= cooling;
    if (++sinceImprovement >= options.reheatAfter) {
      sinceImprovement = 0;
      field.load(bestCells);
      const window = options.kickWindow ?? 0;
      if (window > 0) {
        /**
         * RUIN THE WEAKEST OF A FEW WINDOWS, not a uniformly random one.
         *
         * A uniform window spends most of its ruins on regions that are already
         * packed well, where the walk simply rebuilds what it destroyed. The
         * headroom is wherever the plot is currently UNPRODUCTIVE, and that is
         * not evenly spread: soggybud and ashwreath both settle at 51 with
         * three cells left empty and all three in column 0, so the same corner
         * is being wasted every time while the ruins land elsewhere.
         *
         * A tournament rather than the argmin over all 64 windows, deliberately.
         * Always ruining the single worst region is a deterministic move that
         * cycles: it rebuilds the same corner the same way and the walk stops
         * exploring. Sampling a handful and taking the weakest keeps the
         * randomness that the slack family needs while spending most ruins
         * where there is something to gain.
         *
         * Productivity is counted as satisfied spawn spots whose anchor sits
         * inside the window, which is O(anchors) and only runs on a reheat.
         */
        let top = rng.int(Math.max(1, 11 - window));
        let left = rng.int(Math.max(1, 11 - window));
        let weakest = Infinity;
        for (let candidate = 0; candidate < RUIN_CANDIDATES; candidate++) {
          const r0 = rng.int(Math.max(1, 11 - window));
          const c0 = rng.int(Math.max(1, 11 - window));
          let produced = 0;
          for (let ai = 0; ai < problem.anchors.length; ai++) {
            if (!field.isSatisfied(ai)) continue;
            const anchor = problem.anchors[ai];
            if (
              anchor.row >= r0 &&
              anchor.row < r0 + window &&
              anchor.col >= c0 &&
              anchor.col < c0 + window
            ) {
              produced++;
            }
          }
          if (produced < weakest) {
            weakest = produced;
            top = r0;
            left = c0;
          }
        }
        for (let r = top; r < top + window && r < 10; r++) {
          for (let c = left; c < left + window && c < 10; c++) {
            if (problem.plantableMask[r * 10 + c]) field.set(r * 10 + c, -1);
          }
        }
      } else {
        for (let k = 0; k < options.kickSize; k++) {
          const cell = problem.plantable[rng.int(problem.plantable.length)];
          field.set(cell, rng.int(problem.palette.length + 1) - 1);
        }
      }
      // Deliberately NOT rebuilt greedily here. Recreating the ruined window
      // with a polish sweep converges faster but settles: measured, it took
      // ashwreath from 50 to 51 yet capped there even at 20M iterations, while
      // costing scourroot, veilshroom, gloomgourd and shadevine a spawn each
      // (72 down to 71) and witherbloom one (52 down to 51). Letting the walk
      // refill the hole is what preserves the diversity those five need.
      currentHard = field.hard();
      currentSoft = field.softValue();
      // Warm back up, but never above where the schedule started.
      temperature = Math.min(options.startTemperature, Math.max(temperature * 8, options.endTemperature * 4));
    }
  }

  return { bestScore, bestCells, iterations: iteration };
};
