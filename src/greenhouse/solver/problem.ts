import type {
  CropDefinition,
  LockDefinition,
  MutationDefinition,
  MutationGoal,
} from "../types/greenhouse";
import { CELL_COUNT, blockCells, buildCellMask, ringCells, ringSizeFor } from "./grid.ts";

/**
 * The dataset slice the solver needs. Passed in as a parameter so the module
 * stays pure: no store import, no fetch, no React. It has to run unchanged in a
 * Web Worker and in bare Node.
 */
export interface SolverDataset {
  mutations: Record<string, MutationDefinition>;
  crops: Record<string, CropDefinition>;
}

/** A single requirement, resolved to a palette index. */
export interface CompiledRequirement {
  cropIndex: number;
  cropId: string;
  count: number;
}

export interface CompiledTarget {
  id: string;
  size: number;
  requirements: CompiledRequirement[];
  /** Sum of requirement counts: the number of distinct planted ring cells needed. */
  reqSum: number;
  /** (S+2)^2 - S^2, the ring size clear of any edge. */
  ringSize: number;
  /**
   * True when reqSum === ringSize, so EVERY ring cell must be planted with an
   * exact composition. 27 of the 40 mutations are like this and they are the
   * whole difficulty: the lattice is forced, which is what makes a provable
   * bound possible and what a random cell-flip annealer can never stumble onto.
   */
  fullRing: boolean;
  /** lonelily: legal only when its ring holds zero planted crops. */
  zeroAdjacent: boolean;
  /** Cap on useful spawns. Infinity when maximizing. */
  cap: number;
  /** How many the caller explicitly demanded (0 when maximizing). */
  required: number;
  /** Maps a palette index to its requirement slot, or -1. */
  reqSlotOfCrop: Int8Array;
  /**
   * Trade-off weight from the caller's priority map, 1 when unset.
   *
   * Used ONLY to break ties between layouts with the same total spawn count,
   * never to trade one mutation against another by raw count. The map is a rank
   * from 1 to 34, so treating it as a linear value would say one lonelily is
   * worth thirty-four choconut, which is not what a rank means. With a single
   * target the bonus is a fixed multiple of the count and so cannot change the
   * ordering at all, which is the documented no-op case.
   */
  priority: number;
}

/** One legal position for one target. */
export interface Anchor {
  targetIndex: number;
  row: number;
  col: number;
  size: number;
  block: number[];
  ring: number[];
  /** Ring cells that are unlocked, so capable of holding a crop. */
  ringAvailable: number;
  /** ringAvailable - reqSum. Zero means no ring cell is free for anything else. */
  slack: number;
}

export interface Problem {
  cellMask: Uint8Array;
  /**
   * Cells the player pinned to a mutation. Neither plantable nor spawnable, and
   * per the Designer's rule a reserved spawn does NOT count as an adjacent crop.
   */
  reserved: Uint8Array;
  /**
   * Starting crop field: locked crops already planted, everything else empty.
   * Every reset goes back to this rather than to a bare plot, which is what
   * makes a locked crop impossible to lose by construction instead of by a
   * check somewhere.
   */
  baseline: Int16Array;
  /** Locked crop placements, echoed back in the response with locked: true. */
  lockedCrops: { crop: string; row: number; col: number; size: number }[];
  /** Locked mutation blocks, echoed back untouched. */
  lockedMutations: { mutation: string; row: number; col: number; size: number }[];
  cellCount: number;
  /** Crop ids that appear in some target's requirements. Nothing else is worth planting. */
  palette: string[];
  paletteIndex: Map<string, number>;
  targets: CompiledTarget[];
  anchors: Anchor[];
  /** anchorsOnRing[cell] = anchors whose ring contains this cell. */
  anchorsOnRing: Int32Array[];
  /** anchorsOnBlock[cell] = anchors whose block contains this cell. */
  anchorsOnBlock: Int32Array[];
  /** Anchors grouped by target, in anchor order. */
  anchorsByTarget: number[][];
  /** Cells that may hold a planted crop: unlocked, and inside some anchor's ring. */
  plantable: number[];
  /**
   * The same set as a lookup. Any code that reaches a cell by coordinate rather
   * than by walking `plantable` MUST consult this: the ruin move and the repair
   * move both address cells directly, and without the mask they happily erased
   * a locked crop or planted on a reserved spawn.
   */
  plantableMask: Uint8Array;
}

/**
 * Mutations that cannot be produced by arranging a plot at all.
 *
 * READ FROM THE DATASET, not from a list of names. This used to consult
 * specials.ts, which is a record keyed by mutation id, so the solver only knew
 * that Shellfruit was unplannable because someone had typed "shellfruit" into
 * a map. A new mutation with the same shape would have been compiled as though
 * it had no requirements, which does not mean "free": it means the adjacency
 * model cannot express what it needs, and treating it as free is how an epic
 * ends up costed like a common.
 *
 * The rule is now structural, and the dataset already carries everything it
 * needs. A mutation is impossible to lay out when it states NO adjacency
 * requirements and its `special` marker is anything other than the one marker
 * that IS an adjacency constraint:
 *
 *   requirements: []  +  special: "requires_zero_adjacent"   solvable (Lonelily)
 *   requirements: []  +  special: anything else              impossible
 *   requirements: []  +  no marker at all                    impossible
 *   requirements: [.] anything                               solvable
 *
 * The third line is the conservative one and it is deliberate. An empty
 * requirement list with nothing explaining it is missing information, not a
 * promise that the mutation spawns on bare soil, so the solver refuses with a
 * reason instead of inventing a hundred free spawns.
 *
 * Checked against the shipped dataset: this reproduces the old classification
 * for all 40 mutations exactly, and it keeps doing so for a 41st nobody has
 * written code for yet.
 *
 * The definition is REQUIRED. It used to be optional with a fallback that
 * looked the id up in the name-keyed SPECIALS map, and an optional fallback is
 * just a name-keyed branch waiting for a caller who forgets. Requiring the
 * definition makes it impossible to ask this question without the data that
 * answers it.
 */
export const isLayoutImpossible = (mutation: MutationDefinition): boolean => {
  if ((mutation.requirements?.length ?? 0) > 0) return false;
  return mutation.special !== "requires_zero_adjacent";
};

/**
 * `id` is passed separately because data.json keys mutations by id and stores
 * no `id` field inside them. Every app consumer rehydrates it, but a caller who
 * forgets would otherwise get a response full of `undefined` mutation names,
 * so the key we looked the definition up by is the authority here.
 */
export const isZeroAdjacent = (mutation: MutationDefinition): boolean =>
  mutation.special === "requires_zero_adjacent";

const capFor = (goal: MutationGoal): { cap: number; required: number } => {
  if (goal.maximize) return { cap: Number.POSITIVE_INFINITY, required: 0 };
  const wanted = goal.count === null || goal.count === undefined ? 1 : Math.max(0, goal.count);
  return { cap: wanted, required: wanted };
};

/**
 * Compiles goals + dataset into flat, index-addressed tables.
 *
 * Everything the hot loop touches is a typed array of integers by the time this
 * returns. No string comparison, no Map lookup, no object allocation per move.
 */
export interface CompileOptions {
  locks?: LockDefinition[];
  priorities?: Record<string, number>;
}

/** Thrown for input the caller could not have meant, rather than solved around. */
export class BadRequestError extends Error {}

export const compileProblem = (
  cells: [number, number][],
  goals: MutationGoal[],
  dataset: SolverDataset,
  compileOptions: CompileOptions = {}
): Problem => {
  const cellMask = buildCellMask(cells);
  let cellCount = 0;
  for (let i = 0; i < CELL_COUNT; i++) cellCount += cellMask[i];

  // Rule 8: only crops named by some target's requirements are ever worth
  // planting. Collected in dataset order so the palette is deterministic.
  const palette: string[] = [];
  const paletteIndex = new Map<string, number>();
  for (const goal of goals) {
    const mutation = dataset.mutations[goal.mutation];
    if (!mutation) continue;
    for (const req of mutation.requirements) {
      if (paletteIndex.has(req.crop)) continue;
      paletteIndex.set(req.crop, palette.length);
      palette.push(req.crop);
    }
  }

  // Locks. The player pinned these, so the search works around them rather than
  // over them. A locked CROP counts toward adjacency like any other planted
  // crop; a locked MUTATION is a reserved spawn that counts as nothing.
  const reserved = new Uint8Array(CELL_COUNT);
  const baseline = new Int16Array(CELL_COUNT).fill(-1);
  const lockedCrops: { crop: string; row: number; col: number; size: number }[] = [];
  const lockedMutations: { mutation: string; row: number; col: number; size: number }[] = [];
  const claimed = new Uint8Array(CELL_COUNT);

  for (const lock of compileOptions.locks ?? []) {
    const size = Math.max(1, Math.floor(lock.size || 1));
    const [row, col] = lock.position;
    const block = blockCells(row, col, size);
    if (!block) throw new BadRequestError(`lock ${lock.name} at [${row},${col}] falls outside the grid`);
    for (const cell of block) {
      if (!cellMask[cell]) {
        throw new BadRequestError(`lock ${lock.name} at [${row},${col}] sits on a locked cell`);
      }
      if (claimed[cell]) {
        throw new BadRequestError(`lock ${lock.name} at [${row},${col}] overlaps another lock`);
      }
      claimed[cell] = 1;
    }

    const isMutation = dataset.mutations[lock.name] !== undefined && dataset.crops[lock.name] === undefined;
    if (isMutation) {
      for (const cell of block) reserved[cell] = 1;
      lockedMutations.push({ mutation: lock.name, row, col, size });
    } else {
      let index = paletteIndex.get(lock.name);
      if (index === undefined) {
        // A locked crop nothing asked for still occupies its cells, so it has
        // to exist in the palette or the field cannot represent it.
        index = palette.length;
        paletteIndex.set(lock.name, index);
        palette.push(lock.name);
      }
      for (const cell of block) baseline[cell] = index;
      lockedCrops.push({ crop: lock.name, row, col, size });
    }
  }

  const targets: CompiledTarget[] = [];
  for (const goal of goals) {
    const mutation = dataset.mutations[goal.mutation];
    if (!mutation) continue;
    if (isLayoutImpossible(mutation)) continue;

    const zeroAdjacent = isZeroAdjacent(mutation);
    const requirements: CompiledRequirement[] = mutation.requirements.map((req) => ({
      cropIndex: paletteIndex.get(req.crop) ?? -1,
      cropId: req.crop,
      count: req.count,
    }));
    const reqSum = requirements.reduce((sum, req) => sum + req.count, 0);
    const ringSize = ringSizeFor(mutation.size);
    const reqSlotOfCrop = new Int8Array(palette.length).fill(-1);
    requirements.forEach((req, slot) => {
      if (req.cropIndex >= 0) reqSlotOfCrop[req.cropIndex] = slot;
    });
    const { cap, required } = capFor(goal);

    targets.push({
      id: goal.mutation,
      size: mutation.size,
      requirements,
      reqSum,
      ringSize,
      fullRing: !zeroAdjacent && reqSum === ringSize,
      zeroAdjacent,
      cap,
      required,
      reqSlotOfCrop,
      priority: Math.max(1, Math.floor(compileOptions.priorities?.[goal.mutation] ?? 1)),
    });
  }

  // Anchors. A position is legal only if the whole block sits on unlocked
  // cells AND the ring can physically hold the crops the target demands.
  const anchors: Anchor[] = [];
  const anchorsByTarget: number[][] = targets.map(() => []);
  targets.forEach((target, targetIndex) => {
    for (let row = 0; row + target.size <= 10; row++) {
      for (let col = 0; col + target.size <= 10; col++) {
        const block = blockCells(row, col, target.size);
        if (!block) continue;
        let blockOk = true;
        for (const cell of block) {
          // A block cell must be free: unlocked, not reserved by a pinned
          // mutation, and not already holding a pinned crop.
          if (!cellMask[cell] || reserved[cell] || baseline[cell] >= 0) {
            blockOk = false;
            break;
          }
        }
        if (!blockOk) continue;

        const ring = ringCells(row, col, target.size);
        let ringAvailable = 0;
        for (const cell of ring) if (cellMask[cell] && !reserved[cell]) ringAvailable++;
        const slack = ringAvailable - target.reqSum;
        if (!target.zeroAdjacent && slack < 0) continue;

        anchorsByTarget[targetIndex].push(anchors.length);
        anchors.push({
          targetIndex,
          row,
          col,
          size: target.size,
          block,
          ring,
          ringAvailable,
          slack,
        });
      }
    }
  });

  // Reverse indexes, so a single cell change touches only the anchors it can
  // possibly affect (at most (2S+1)^2 of them) instead of all 100.
  const ringLists: number[][] = Array.from({ length: CELL_COUNT }, () => []);
  const blockLists: number[][] = Array.from({ length: CELL_COUNT }, () => []);
  anchors.forEach((anchor, index) => {
    for (const cell of anchor.ring) ringLists[cell].push(index);
    for (const cell of anchor.block) blockLists[cell].push(index);
  });

  // Plantable means "the search may change this cell". Reserved cells and
  // locked crops are excluded, which is what makes them immovable without a
  // single guard anywhere in the hot loop.
  const plantable: number[] = [];
  const plantableMask = new Uint8Array(CELL_COUNT);
  for (let cell = 0; cell < CELL_COUNT; cell++) {
    if (!cellMask[cell] || reserved[cell] || baseline[cell] >= 0) continue;
    if (ringLists[cell].length === 0) continue;
    plantable.push(cell);
    plantableMask[cell] = 1;
  }

  return {
    cellMask,
    reserved,
    baseline,
    lockedCrops,
    lockedMutations,
    cellCount,
    palette,
    paletteIndex,
    targets,
    anchors,
    anchorsOnRing: ringLists.map((list) => Int32Array.from(list)),
    anchorsOnBlock: blockLists.map((list) => Int32Array.from(list)),
    anchorsByTarget,
    plantable,
    plantableMask,
  };
};

/**
 * A provable ceiling on how many spawns of one target can coexist.
 *
 * Two independent arguments, whichever is tighter:
 *
 * 1. CLIQUE COVER. Partition the legal anchors into groups that pairwise
 *    conflict; a solution can use at most one anchor per group, so the number
 *    of groups is a ceiling. Two anchors conflict if their blocks overlap, and
 *    additionally - when the target has zero ring slack - if one block would
 *    land inside the other's ring, because every ring cell has to be planted
 *    and a block cell never is. That makes any (S+1)x(S+1) box of anchors a
 *    clique for a full-ring target. On a bare 10x10 this yields exactly
 *    16 / 9 / 4 for S = 1 / 2 / 3, which is what the remote reports on all 23
 *    full-ring mutations it solves to completion.
 *
 * 2. DEGREE COUNTING. Each 1x1 spawn consumes reqSum distinct planted
 *    neighbours; each planted cell has at most 8 neighbours, so
 *    E * reqSum <= 8 * P with E + P <= cellCount.
 *
 * Returns Infinity when neither argument bites, in which case we never claim
 * optimality.
 */
export const upperBoundFor = (problem: Problem, targetIndex: number): number => {
  const target = problem.targets[targetIndex];
  const anchorIds = problem.anchorsByTarget[targetIndex];
  if (anchorIds.length === 0) return 0;

  // A full-ring target always has exactly zero slack: its ring must be fully
  // available (or the anchor was dropped at compile time) and fully planted, so
  // no other block may sit inside it. That widens the clique box from SxS to
  // (S+1)x(S+1), which is what turns a useless bound into an exact one. A
  // zero-adjacent target gets the same widening for the mirrored reason: a
  // spawned lonelily occupies its cell and forbids ANY neighbour, so two
  // spawns can never share a 2x2 box. (It used to return cellCount here, which
  // blessed the impossible 100-lonelily plot as OPTIMAL; the true full-plot
  // ceiling is 25, and the phase scan below proves exactly that.)
  const step = target.fullRing || target.zeroAdjacent ? target.size + 1 : target.size;
  let best = anchorIds.length;
  for (let phaseRow = 0; phaseRow < step; phaseRow++) {
    for (let phaseCol = 0; phaseCol < step; phaseCol++) {
      const boxes = new Set<number>();
      for (const id of anchorIds) {
        const anchor = problem.anchors[id];
        const boxRow = Math.floor((anchor.row - phaseRow) / step);
        const boxCol = Math.floor((anchor.col - phaseCol) / step);
        boxes.add(boxRow * 64 + boxCol);
      }
      if (boxes.size < best) best = boxes.size;
    }
  }

  if (target.size === 1 && target.reqSum > 0) {
    const counting = Math.floor((8 * problem.cellCount) / (target.reqSum + 8));
    if (counting < best) best = counting;
  }
  return best;
};
