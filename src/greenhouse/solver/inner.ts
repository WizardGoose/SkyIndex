import type { Field } from "./field.ts";
import type { Problem } from "./problem.ts";

/**
 * The inner layer: given a fixed crop field, choose the best set of spawn
 * blocks that do not overlap each other.
 *
 * Why anything is needed at all: candidate blocks can want the same cell, and a
 * cell holds exactly one thing. An empty cell may satisfy several mutations at
 * once but it spawns only ONE of them, so the choice is a maximum independent
 * set over the overlap graph rather than a count of everything legal.
 *
 * Worth knowing, and why this is rarely the bottleneck: two blocks that BOTH
 * demand a full ring can never be legal at the same time while overlapping,
 * because one block's cells are empty and would sit inside the other's ring,
 * which has to be entirely planted. Every multi-cell plannable mutation in the
 * dataset is full-ring, so in practice the graph handed to this file has no
 * edges at all. The search below exists so that stays true by construction
 * rather than by luck.
 *
 * Only block overlap creates a conflict. A chosen block's cells are empty in
 * the field, so they were already counted as "not a crop" when the other
 * block's ring was checked - Rule 6 falls out of the representation instead of
 * needing a rule.
 *
 * The overlap test is over EVERY target at once, deliberately. With a single
 * target there is one candidate per cell and 1x1 blocks genuinely cannot
 * collide, which makes "skip the 1x1 case" look safe. With two targets there
 * are two candidates on the same cell, and skipping it lets one empty cell be
 * reported as spawning both mutations. That inflates the yield while describing
 * a plot nobody can build, which is the worst way to be wrong.
 */

interface Selection {
  anchors: number[];
  /** Spawns per target after caps. */
  perTarget: number[];
  /** Sum of min(count, cap). */
  value: number;
}

const valueOf = (problem: Problem, anchors: number[]): Selection => {
  const perTarget = new Array<number>(problem.targets.length).fill(0);
  const kept: number[] = [];
  for (const ai of anchors) {
    const ti = problem.anchors[ai].targetIndex;
    if (perTarget[ti] >= problem.targets[ti].cap) continue;
    perTarget[ti]++;
    kept.push(ai);
  }
  return { anchors: kept, perTarget, value: kept.length };
};

/**
 * Exact maximum independent set by branch and bound.
 *
 * Bounded by node budget: these graphs are tiny and highly structured, but the
 * problem is NP-hard in general, so an exhausted budget falls back to the
 * greedy answer rather than hanging the UI.
 */
const exactMis = (nodes: number[], adjacency: Uint8Array[], budget: number): number[] => {
  let best: number[] = [];
  let spent = 0;

  const recurse = (candidates: number[], chosen: number[]): void => {
    if (spent++ > budget) return;
    if (chosen.length + candidates.length <= best.length) return;
    if (candidates.length === 0) {
      if (chosen.length > best.length) best = chosen.slice();
      return;
    }
    // Branch on the most constrained candidate: highest degree within the
    // remaining set, which collapses the tree fastest.
    let pivot = candidates[0];
    let pivotDegree = -1;
    for (const node of candidates) {
      let degree = 0;
      for (const other of candidates) if (adjacency[node][other]) degree++;
      if (degree > pivotDegree) {
        pivotDegree = degree;
        pivot = node;
      }
    }
    if (pivotDegree === 0) {
      // No edges left: take everything.
      const all = chosen.concat(candidates);
      if (all.length > best.length) best = all;
      return;
    }

    // Include the pivot.
    chosen.push(pivot);
    recurse(
      candidates.filter((node) => node !== pivot && !adjacency[pivot][node]),
      chosen
    );
    chosen.pop();

    // Exclude it.
    recurse(
      candidates.filter((node) => node !== pivot),
      chosen
    );
  };

  recurse(nodes.slice(), []);
  return best;
};

/**
 * Picks the spawn blocks to report for the current field.
 *
 * Fast path first: if no two legal anchors overlap, every one of them can be
 * taken and there is nothing to search.
 */
export const selectBlocks = (field: Field, problem: Problem): Selection => {
  const legal = field.satisfiedAnchors();
  if (legal.length === 0) return { anchors: [], perTarget: new Array(problem.targets.length).fill(0), value: 0 };

  // Build the overlap graph from cell ownership: any two candidates that want
  // the same cell are mutually exclusive, whatever their size or target.
  const adjacency: Uint8Array[] = legal.map(() => new Uint8Array(legal.length));
  const owners = new Map<number, number[]>();
  legal.forEach((ai, i) => {
    for (const cell of problem.anchors[ai].block) {
      const list = owners.get(cell);
      if (list) list.push(i);
      else owners.set(cell, [i]);
    }
  });

  let edges = 0;
  for (const list of owners.values()) {
    if (list.length < 2) continue;
    for (let x = 0; x < list.length; x++) {
      for (let y = x + 1; y < list.length; y++) {
        if (adjacency[list[x]][list[y]]) continue;
        adjacency[list[x]][list[y]] = 1;
        adjacency[list[y]][list[x]] = 1;
        edges++;
      }
    }
  }

  /*
   * Zero-adjacent targets add a second kind of exclusivity. A spawned
   * lonelily OCCUPIES its cell, so any other spawn touching its ring breaks
   * its empty-ring condition - spawn versus spawn, where the satisfaction
   * counters only ever saw planted crops. Without these edges the selection
   * happily reported 100 lonelilies packed shoulder to shoulder, a plot the
   * game can never grow (the real spawn pattern is spaced); the
   * true ceiling on a full plot is the spaced 25.
   */
  legal.forEach((ai, i) => {
    const anchor = problem.anchors[ai];
    if (!problem.targets[anchor.targetIndex].zeroAdjacent) return;
    for (const cell of anchor.ring) {
      const list = owners.get(cell);
      if (!list) continue;
      for (const j of list) {
        if (j === i || adjacency[i][j]) continue;
        adjacency[i][j] = 1;
        adjacency[j][i] = 1;
        edges++;
      }
    }
  });

  if (edges === 0) return valueOf(problem, legal);

  // Greedy: fewest conflicts first, ties by anchor index so it stays
  // deterministic. EXCEPT when every target is zero-adjacent: there the
  // degree heuristic grabs corners and edges first and emits ragged gaps
  // (a column at 6 then 9), while plain row-major scan produces the tidy
  // every-other-cell lattice a player would actually plant - same count,
  // orderly shape (the exact gap width matters less than the pattern
  // staying regular). Scan order reaches the 2x2-tile bound on any
  // rectangular mask, so nothing is traded for the tidiness.
  const degree = adjacency.map((row) => row.reduce((sum, bit) => sum + bit, 0));
  const allZeroAdjacent = problem.targets.every((t) => t.zeroAdjacent);
  const order = legal
    .map((_, i) => i)
    .sort((a, b) =>
      allZeroAdjacent ? legal[a] - legal[b] : degree[a] - degree[b] || legal[a] - legal[b]
    );
  const blocked = new Uint8Array(legal.length);
  const greedy: number[] = [];
  for (const i of order) {
    if (blocked[i]) continue;
    greedy.push(i);
    for (let j = 0; j < legal.length; j++) if (adjacency[i][j]) blocked[j] = 1;
  }

  let chosen = greedy;
  const uncapped = problem.targets.every((t) => t.cap === Number.POSITIVE_INFINITY);
  if (uncapped && legal.length <= 160) {
    const exact = exactMis(
      legal.map((_, i) => i),
      adjacency,
      200000
    );
    if (exact.length > chosen.length) chosen = exact;
  }

  return valueOf(
    problem,
    chosen.map((i) => legal[i]).sort((a, b) => a - b)
  );
};
