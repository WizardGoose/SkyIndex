import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * One question, one bill.
 *
 * THE SPLIT THIS CLOSES. The Planner asks the solver for a plot from two
 * places: `useSolverEconomies` costs it, and `useSolvedLayout` draws it for the
 * PLANT THIS panel. They asked the same question and accepted different
 * answers, because only the economics passed `removeUnusedCrops`. The flag is
 * now one shared constant. This is the test that keeps it: the two bills are
 * compared as NUMBERS, crop by crop, for the same question.
 *
 * WHAT PRUNING IS ACTUALLY WORTH, measured rather than assumed. Swept across
 * every mutation at maximize and at two target sizes, 120 questions in all, the
 * flag changes the bill on 23 of them and every one is a MAXIMIZE question. A
 * maximized Thornshade plot is 41 Veilshroom and 24 Wild Rose pruned, and 41
 * and 34 unpruned, for the identical 16 spawns: ten Wild Rose the player would
 * have placed for nothing. On a target-mode solve the search only places what
 * the count needs, so there is no surplus to strip and the flag is a no-op.
 *
 * Which is worth writing down, because the pair that prompted the fix does not
 * come from here. Soggybud at 24 Melon and 21 Gloomgourd against 5 and 5 is a
 * MAXIMIZED plot beside a right-sized one, not a pruned plot beside an unpruned
 * one: maximized Soggybud is 23 and 23 for 51 spawns, and eight spots is 5 and
 * 6 for 8. That gap was closed by `focusSpots` handing the layout the size the
 * plot was costed at, and the last test here pins that as the larger of the two
 * ways these panels can come apart.
 *
 * The service is mocked onto the real local solver rather than stubbed. A stub
 * would only prove the two hooks pass the same argument; what matters is that
 * the same argument produces the same crop counts out of the real search.
 */

const calls = vi.hoisted(() => [] as { targets: unknown; removeUnusedCrops: boolean }[]);

vi.mock("../../services/greenhouseService", async () => {
  const { readFileSync: read } = await import("node:fs");
  const { dirname: dir, join: j } = await import("node:path");
  const { fileURLToPath: toPath } = await import("node:url");
  const { solveLocal } = await import("../../solver");

  const root = j(dir(toPath(import.meta.url)), "..", "..", "..", "..");
  const raw = JSON.parse(read(j(root, "public/greenhouse/data.json"), "utf8")) as {
    crops: Record<string, object>;
    mutations: Record<string, object>;
  };
  const withIds = (rec: Record<string, object>) => Object.fromEntries(Object.entries(rec).map(([id, v]) => [id, { ...v, id }]));
  const data = { crops: withIds(raw.crops), mutations: withIds(raw.mutations) };

  return {
    solveGreenhouseDirect: async (
      cells: [number, number][],
      targets: unknown[],
      _signal?: AbortSignal,
      removeUnusedCrops = false
    ) => {
      calls.push({ targets, removeUnusedCrops });
      /*
       * A budget large enough that the CLOCK never decides the answer.
       *
       * This mock deliberately bypasses the solver client, so each call here is
       * an independent search rather than two readers of one cached response.
       * That is the right thing to test, but it exposes the one way solveLocal
       * is not reproducible: its time budget is a safety valve, and when the
       * valve fires the search stops mid-walk at whatever iteration the clock
       * happened to reach. Two solves of a slack mutation on a loaded machine
       * then return different, equally legal layouts, and this test failed on
       * Soggybud for that reason and no other.
       *
       * The contract solveLocal actually offers is "same seed, same input, same
       * ITERATION budget, byte-identical response". Pinning the ceiling high
       * enough that iterations bind is what lets this test hold the solver to
       * that contract instead of to the wall clock. It does not make the search
       * work any less: the iteration count is unchanged, only the valve moves.
       *
       * In the app the two callers cannot disagree for a stronger reason - they
       * are served the same cache entry, keyed on the same canonical request.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return solveLocal(cells, targets as any, data as any, { removeUnusedCrops, timeBudgetMs: 120_000 });
    },
  };
});

const { cropBill, FULL_GRID, PRUNE_UNUSED_CROPS, solveLayout } = await import("../useSolvedLayout");
const { solveEconomy } = await import("../useSolverEconomies");
const { solveLocal } = await import("../../solver");
const { solveGoal } = await import("../../solver/request");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const rawData = JSON.parse(readFileSync(join(ROOT, "public/greenhouse/data.json"), "utf8")) as {
  crops: Record<string, object>;
  mutations: Record<string, object>;
};
const withIds = (rec: Record<string, object>) => Object.fromEntries(Object.entries(rec).map(([id, v]) => [id, { ...v, id }]));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data = { crops: withIds(rawData.crops), mutations: withIds(rawData.mutations) } as any;

const total = (bill: Record<string, number>) => Object.values(bill).reduce((s, n) => s + n, 0);

/**
 * The same question both hooks ask, at the sizes the planner asks it at.
 *
 * Thornshade maximized is in here deliberately: it is one of the 23 questions
 * where pruning genuinely moves the bill, so this list is not made up entirely
 * of cases the two sides would agree on no matter what they passed.
 */
const QUESTIONS: { id: string; spots?: number }[] = [
  { id: "thornshade" },
  { id: "soggybud", spots: 8 },
  { id: "soggybud", spots: 2 },
  { id: "gloomgourd", spots: 5 },
  { id: "soggybud" },
];

beforeEach(() => {
  calls.length = 0;
});

describe("the layout bill and the economy bill, for the same question", () => {
  for (const { id, spots } of QUESTIONS) {
    const label = spots === undefined ? `${id}, maximized` : `${id}, ${spots} spots`;

    it(`agree crop for crop: ${label}`, async () => {
      const layout = await solveLayout(FULL_GRID, [id], spots);
      const economy = await solveEconomy(id, spots);

      expect(economy).not.toBeNull();

      // NUMBERS, crop by crop. Not a rendered string, and not a total that
      // could hide two crops swapping counts.
      expect(cropBill(layout.placements)).toEqual(economy!.crops);
      expect(layout.mutations.length).toBe(economy!.yield);
      // Two real solves of a full plot. The slack family takes a couple of
      // seconds each, which is the cost of testing the search rather than a
      // stub of it.
    }, 60_000);
  }

  it("both call sites actually ask the solver to prune", async () => {
    await solveLayout(FULL_GRID, ["thornshade"]);
    await solveEconomy("thornshade");

    expect(calls).toHaveLength(2);
    for (const call of calls) expect(call.removeUnusedCrops).toBe(PRUNE_UNUSED_CROPS);
    expect(PRUNE_UNUSED_CROPS).toBe(true);
  });

  /**
   * The teeth.
   *
   * The agreement above only means something if the two answers COULD differ.
   * On a maximized Thornshade plot they do: the same 16 spawns, ten more Wild
   * Rose in the unpruned answer, every one of them a crop the player places for
   * nothing. If either call site stopped pruning, that is the bill it would
   * start showing.
   */
  it("would differ if either side stopped pruning", () => {
    const goal = [solveGoal("thornshade")];
    const pruned = solveLocal(FULL_GRID, goal, data, { removeUnusedCrops: true });
    const whole = solveLocal(FULL_GRID, goal, data, { removeUnusedCrops: false });

    const prunedBill = cropBill(pruned.placements);
    const wholeBill = cropBill(whole.placements);

    // Same yield out of both, which is exactly what made the disagreement so
    // bad: nothing on screen explained why one panel wanted more crops for it.
    expect(pruned.mutations.length).toBe(whole.mutations.length);
    expect(prunedBill).not.toEqual(wholeBill);
    expect(total(prunedBill)).toBeLessThan(total(wholeBill));
  });

  /**
   * The OTHER way these two panels come apart, and the bigger one.
   *
   * A maximized plot beside a right-sized plot is a far larger gap than pruning
   * ever opens, and it is the gap behind the numbers that prompted all this. It
   * is not a bug to be fixed by a flag: they are genuinely different questions.
   * It is only a bug when the layout is shown for a DIFFERENT question than the
   * one the bill beside it was costed at, which is what `focusSpots` exists to
   * prevent. Pinned here so the two failure modes stay distinguishable.
   */
  it("comes apart on the size, not the pruning, when the questions differ", async () => {
    const maximized = await solveLayout(FULL_GRID, ["soggybud"]);
    const sized = await solveEconomy("soggybud", 8);

    const maximizedBill = cropBill(maximized.placements);

    expect(maximized.mutations.length).toBeGreaterThan(sized!.yield);
    expect(total(maximizedBill)).toBeGreaterThan(total(sized!.crops) * 4);

    // And asked the same question, they agree again. The size is the whole
    // difference.
    const sizedLayout = await solveLayout(FULL_GRID, ["soggybud"], 8);
    expect(cropBill(sizedLayout.placements)).toEqual(sized!.crops);
  });
});

/**
 * The counter itself, since both bills now come out of it.
 *
 * One planting, however many cells a crop covers. A 3x3 crop is one thing the
 * player plants, and counting its nine cells would inflate every bill on the
 * page by exactly the crops that are hardest to place.
 */
describe("counting a planting", () => {
  it("counts placements, not the cells they cover", () => {
    expect(cropBill([{ crop: "melon" }, { crop: "melon" }, { crop: "gloomgourd" }])).toEqual({ melon: 2, gloomgourd: 1 });
  });

  it("is an empty bill for an empty plot, not a missing one", () => {
    expect(cropBill([])).toEqual({});
  });
});
