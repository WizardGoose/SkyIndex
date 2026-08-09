import { beforeAll, describe, expect, it } from "vitest";
import {
  CROP_A,
  CROP_B,
  EMPTY,
  bound,
  countCoverage,
  gloomgourdPotential,
} from "../potential.ts";
import { planExpansion } from "../planExpansion.ts";
import { runExpansion } from "../expansionClient.ts";

const maskOf = (cells: [number, number][]): Uint8Array => {
  const mask = new Uint8Array(100);
  for (const [r, c] of cells) mask[r * 10 + c] = 1;
  return mask;
};

const rect = (rows: number, cols: number, r0 = 0, c0 = 0): [number, number][] => {
  const out: [number, number][] = [];
  for (let r = r0; r < r0 + rows; r++) for (let c = c0; c < c0 + cols; c++) out.push([r, c]);
  return out;
};

const ALL: [number, number][] = rect(10, 10);

/**
 * Exhaustive maximum coverage, by enumerating every assignment.
 *
 * Deliberately shares NO code with the search: its own neighbour lookup, its
 * own counting, no imports from the module under test. That is the whole point
 * of it. 3^n means it is only usable up to about a dozen cells, which is
 * exactly where a search is least likely to be tested by anything else.
 */
const bruteForceMax = (cells: [number, number][]): number => {
  const n = cells.length;
  const at = new Map(cells.map(([r, c], i) => [r * 10 + c, i]));
  const neighbours = cells.map(([r, c]) => {
    const out: number[] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const j = at.get((r + dr) * 10 + (c + dc));
        if (j !== undefined) out.push(j);
      }
    }
    return out;
  });
  const state = new Uint8Array(n);
  let best = 0;
  for (let code = 0; code < 3 ** n; code++) {
    let rest = code;
    for (let i = 0; i < n; i++) {
      state[i] = rest % 3;
      rest = (rest - state[i]) / 3;
    }
    let covered = 0;
    for (let i = 0; i < n; i++) {
      if (state[i] !== 0) continue;
      let a = false;
      let b = false;
      for (const j of neighbours[i]) {
        if (state[j] === 1) a = true;
        else if (state[j] === 2) b = true;
      }
      if (a && b) covered++;
    }
    if (covered > best) best = covered;
  }
  return best;
};

const DIAMOND: [number, number][] = [];
for (let r = 3; r <= 6; r++) {
  for (let c = 3; c <= 6; c++) {
    if (!((r === 3 || r === 6) && (c === 3 || c === 6))) DIAMOND.push([r, c]);
  }
}

describe("gloomgourd potential", () => {
  // Every shape small enough to enumerate. If the search is ever wrong on a
  // case a human could check by hand, these catch it.
  const exactCases: [string, [number, number][]][] = [
    ["a single row of six", rect(1, 6)],
    ["a 2x3 block", rect(2, 3)],
    ["a 2x4 block", rect(2, 4)],
    ["a 3x3 block", rect(3, 3)],
    ["a 2x5 block", rect(2, 5)],
    ["a 3x4 block", rect(3, 4)],
    ["the default 12 cell diamond", DIAMOND],
  ];

  for (const [name, cells] of exactCases) {
    it(`matches an exhaustive search on ${name}`, () => {
      const mask = maskOf(cells);
      const found = gloomgourdPotential(mask, { rounds: 200, timeBudgetMs: 1500 });
      expect(found.value).toBe(bruteForceMax(cells));
    });
  }

  it("returns a layout that really produces the yield it claims", () => {
    // The reported number is what the search believes about itself. This walks
    // the returned layout and applies the pumpkin-and-melon rule directly.
    for (const cells of [rect(3, 3), rect(4, 4), DIAMOND, rect(6, 6)]) {
      const mask = maskOf(cells);
      const found = gloomgourdPotential(mask, { rounds: 200, timeBudgetMs: 1000 });
      expect(countCoverage(mask, found.assignment)).toBe(found.value);
    }
  });

  it("never plants on a locked cell", () => {
    const mask = maskOf(DIAMOND);
    const found = gloomgourdPotential(mask, { rounds: 100, timeBudgetMs: 500 });
    for (let i = 0; i < 100; i++) {
      if (mask[i] !== 1) expect(found.assignment[i]).toBe(EMPTY);
    }
  });

  it("only ever uses the two crops gloomgourd needs", () => {
    const mask = maskOf(rect(5, 5));
    const found = gloomgourdPotential(mask, { rounds: 100, timeBudgetMs: 500 });
    for (let i = 0; i < 100; i++) {
      expect([EMPTY, CROP_A, CROP_B]).toContain(found.assignment[i]);
    }
  });

  it("stays at or below its own upper bound", () => {
    for (const cells of [rect(3, 3), rect(4, 4), rect(5, 5), DIAMOND, ALL]) {
      const mask = maskOf(cells);
      const found = gloomgourdPotential(mask, { rounds: 100, timeBudgetMs: 500 });
      expect(found.value).toBeLessThanOrEqual(found.bound);
      expect(found.bound).toBe(bound(mask));
    }
  });

  it("claims OPTIMAL only when it has reached the bound", () => {
    for (const cells of [rect(3, 3), rect(2, 3), rect(5, 5), DIAMOND]) {
      const mask = maskOf(cells);
      const found = gloomgourdPotential(mask, { rounds: 200, timeBudgetMs: 1000 });
      expect(found.proved).toBe(found.value >= found.bound);
    }
  });

  it("is deterministic for a given unlocked set", () => {
    const mask = maskOf(rect(5, 5));
    const a = gloomgourdPotential(mask, { rounds: 300, timeBudgetMs: 2000 });
    const b = gloomgourdPotential(mask, { rounds: 300, timeBudgetMs: 2000 });
    expect(b.value).toBe(a.value);
    expect(Array.from(b.assignment)).toEqual(Array.from(a.assignment));
  });

  it("scores nothing on a plot with no unlocked cells", () => {
    const found = gloomgourdPotential(new Uint8Array(100), { rounds: 10, timeBudgetMs: 50 });
    expect(found.value).toBe(0);
    expect(found.bound).toBe(0);
  });

  it("cannot cover anything when only one crop is available to it", () => {
    // A cell needs BOTH crops. A layout using one colour covers nothing, which
    // is the property that makes the paired move necessary in the first place.
    const mask = maskOf(rect(4, 4));
    const oneColour = new Uint8Array(100);
    for (let i = 0; i < 100; i++) if (mask[i] === 1 && i % 2 === 0) oneColour[i] = CROP_A;
    expect(countCoverage(mask, oneColour)).toBe(0);
  });
});

describe("expansion planning", () => {
  /**
   * Planned ONCE and shared, rather than re-planned per assertion.
   *
   * Six tests each called this, so the same plan was computed six times, and
   * each computation runs real solves under a wall-clock budget. That put the
   * file within noise of the 5000ms per-test timeout: it passed alone and timed
   * out under a loaded parallel run, which is the worst kind of gate because it
   * fails for reasons that have nothing to do with the code under test.
   *
   * Sharing loses no coverage. The assertions are all read-only views of one
   * plan, and it is in fact STRICTER this way: `planExpansion` shrinks its trial
   * radius as its own clock runs on, so six separate calls could legitimately
   * return six slightly different plans, and asserting across them was asserting
   * across different objects that only looked like one.
   */
  let cached: ReturnType<typeof planExpansion> | null = null;
  const smallPlan = () => {
    // A 4x4 corner plot with only 4 locked cells beside it keeps the plan short
    // enough to assert on without a long search.
    if (cached) return cached;
    const unlocked = rect(4, 4);
    const locked: [number, number][] = [
      [0, 4],
      [1, 4],
      [2, 4],
      [3, 4],
    ];
    cached = planExpansion(unlocked, locked);
    return cached;
  };

  // The first caller pays the whole cached build, and under full-suite CPU
  // contention that once crossed vitest's 5s default and read as a test
  // failure. Build it here with an honest window so the tests below assert
  // on the plan instead of racing its construction.
  beforeAll(() => {
    smallPlan();
  }, 60_000);

  it("unlocks every locked cell exactly once, in order", () => {
    const plan = smallPlan();
    expect(plan.total_steps).toBe(4);
    expect(plan.steps.map((s) => s.order)).toEqual([1, 2, 3, 4]);
    const seen = new Set(plan.steps.map((s) => `${s.cell[0]},${s.cell[1]}`));
    expect(seen.size).toBe(4);
    for (const cell of seen) expect(["0,4", "1,4", "2,4", "3,4"]).toContain(cell);
  });

  it("never reports a step that loses yield", () => {
    // Unlocking is monotone: any layout legal before a cell is added is still
    // legal after it, with the new cell left empty. So no step can go backwards.
    const plan = smallPlan();
    for (const step of plan.steps) expect(step.gloomgourd_gain).toBeGreaterThanOrEqual(0);
    const potentials = plan.steps.map((s) => s.gloomgourd_potential);
    for (let i = 1; i < potentials.length; i++) {
      expect(potentials[i]).toBeGreaterThanOrEqual(potentials[i - 1]);
    }
  });

  it("ends on the potential its last step reports", () => {
    const plan = smallPlan();
    expect(plan.final_gloomgourd_count).toBe(
      plan.steps[plan.steps.length - 1].gloomgourd_potential
    );
  });

  it("labels the final number honestly against its bound", () => {
    const plan = smallPlan();
    expect(plan.final_gap).toBe(Math.max(0, plan.final_bound - plan.final_gloomgourd_count));
    expect(plan.final_label).toBe(
      plan.final_gloomgourd_count >= plan.final_bound ? "OPTIMAL" : "BEST-KNOWN"
    );
  });

  it("returns nothing to do when there is nothing locked", () => {
    const plan = planExpansion(ALL, []);
    expect(plan.total_steps).toBe(0);
    expect(plan.steps).toEqual([]);
  });

  it("handles a plot whose unlocked cells are not connected", () => {
    // The remote endpoint times out on these. Ours must not.
    const unlocked: [number, number][] = [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
      [8, 8],
      [8, 9],
      [9, 8],
      [9, 9],
    ];
    const locked: [number, number][] = [
      [0, 2],
      [2, 0],
    ];
    const plan = planExpansion(unlocked, locked);
    expect(plan.total_steps).toBe(2);
    expect(plan.final_gloomgourd_count).toBeGreaterThanOrEqual(0);
  });
});

describe("expansion client", () => {
  it("plans on the calling thread when no worker can be made", async () => {
    const plan = await runExpansion(
      rect(3, 3),
      [
        [0, 3],
        [1, 3],
      ],
      { createWorker: () => null }
    );
    expect(plan.total_steps).toBe(2);
    expect(plan.steps.map((s) => s.order)).toEqual([1, 2]);
  });

  it("rejects rather than hanging when the worker fails", async () => {
    const fake = {
      onmessage: null as ((event: MessageEvent) => void) | null,
      onerror: null as (() => void) | null,
      postMessage() {
        queueMicrotask(() => this.onerror?.());
      },
      terminate() {},
    };
    await expect(
      runExpansion(rect(2, 2), [[0, 2]], { createWorker: () => fake as unknown as Worker })
    ).rejects.toThrow("Expansion planning failed");
  });
});
