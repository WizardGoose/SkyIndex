import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { CropDefinition, MutationDefinition } from "../../types/greenhouse";
import { DEFAULT_SIZING_MODE, SIZING_CONFIDENCE, SIZING_ROUNDS, SIZING_WINDOW, sameSizing, sizePlot, sizingFor } from "../plotSizing";
import { buildSolverPlan, type PlotEconomy } from "../solverPlan";
import { atLeastOnce, binomialAtLeast, spawnChance } from "../../timeModel";

/**
 * The plot is sized to the job, not to the plot.
 *
 * THE REPORT THIS COMES FROM. The recipe asked for 2 Soggybud. The plan said
 * sow Gloomgourd x23 and Melon x23, for a plot that spawns 51, and 23 of those
 * Gloomgourd are themselves a mutation needing a plot of their own. Every plot
 * was solved `maximize` no matter how small the demand was, so a player who
 * wanted a pair was quoted a week of farming.
 *
 * Two halves have to hold at once and they pull opposite ways:
 *
 *   SMALL NEED, SMALL PLANTING. Sized from the spawn chance the estimate
 *   already uses, so the layout stops contradicting the arithmetic.
 *
 *   LARGE NEED, UNCHANGED. A demand at or past a full plot still maximizes,
 *   byte for byte the same solve, so no large plan moves.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const raw = JSON.parse(readFileSync(join(ROOT, "public/greenhouse/data.json"), "utf8")) as {
  crops: Record<string, Omit<CropDefinition, "id">>;
  mutations: Record<string, Omit<MutationDefinition, "id">>;
};
const withIds = <T,>(rec: Record<string, T>): Record<string, T & { id: string }> =>
  Object.fromEntries(Object.entries(rec).map(([id, v]) => [id, { ...v, id }]));
const data = { crops: withIds(raw.crops), mutations: withIds(raw.mutations) } as {
  crops: Record<string, CropDefinition>;
  mutations: Record<string, MutationDefinition>;
};

const chanceOf = (id: string) => spawnChance(id, data.mutations[id].requirements ?? []);

/** Both sides of the choice, so no rule below is only checked on the default. */
const MODES = ["minimal", "confident"] as const;

describe("sizing one plot", () => {
  it("leaves a demand of a whole plot or more exactly as it was", () => {
    for (const need of [51, 52, 500, 2624]) {
      expect(sizePlot(need, chanceOf("soggybud"), 51).maximize).toBe(true);
    }
  });

  it("shrinks a demand that fits inside one plot", () => {
    const s = sizePlot(2, chanceOf("soggybud"), 51);
    expect(s.maximize).toBe(false);
    expect(s.spots).toBeLessThan(51);
    expect(s.spots).toBeGreaterThanOrEqual(2);
  });

  it("reaches the confidence it claims, using the model's own distribution", () => {
    const p = chanceOf("soggybud");
    const s = sizePlot(2, p, 51, "confident");

    // Recomputed here from the timeModel primitives rather than trusted: the
    // whole point of the rule is that it is the model's arithmetic, not a
    // second one invented for layouts.
    const q = atLeastOnce(p, SIZING_WINDOW);
    expect(binomialAtLeast(s.spots, q, 2)).toBeGreaterThanOrEqual(SIZING_CONFIDENCE);
    expect(s.confidence).toBeCloseTo(binomialAtLeast(s.spots, q, 2), 12);

    // And it is the SMALLEST such plot, so the margin is a margin and not slack.
    expect(binomialAtLeast(s.spots - 1, q, 2)).toBeLessThan(SIZING_CONFIDENCE);
  });

  it("never sizes below the units wanted, so one planting still covers it", () => {
    for (const mode of MODES) {
      for (const need of [1, 2, 5, 12, 30]) {
        const s = sizePlot(need, chanceOf("soggybud"), 51, mode);
        expect(s.spots).toBeGreaterThanOrEqual(need);
        // `plots = ceil(need / yield)`, so this is what keeps it at one planting.
        expect(Math.ceil(need / s.spots)).toBe(1);
      }
    }
  });

  it("refuses to size what it cannot reason about", () => {
    // No spawn roll means no distribution, and CONFIDENT is a claim about a
    // distribution. Guessing one would be inventing the maths this module
    // exists not to invent, so it hands back the plot it was given.
    expect(sizePlot(2, 0, 51, "confident").maximize).toBe(true);

    for (const mode of MODES) {
      expect(sizePlot(0, 0.25, 51, mode).maximize).toBe(true);
      expect(sizePlot(2, 0.25, 0, mode).maximize).toBe(true);
    }
  });

  it("still sizes a mechanic-only mutation under MINIMAL, which needs no distribution", () => {
    /*
     * One spot per unit wanted is true whatever the spawn chance is, including
     * none at all. A mutation that arrives by mechanic rather than by roll
     * still only needs as many spots as you want of it, and quoting a full plot
     * for two of them would be the original defect wearing a different hat.
     */
    const s = sizePlot(2, 0, 51, "minimal");
    expect(s.maximize).toBe(false);
    expect(s.spots).toBe(2);
    // No distribution behind it, so it claims no confidence rather than one it
    // cannot support.
    expect(s.confidence).toBe(0);
  });

  it("is monotone in demand", () => {
    for (const mode of MODES) {
      let previous = 0;
      for (const need of [1, 2, 3, 5, 8, 13, 21]) {
        const s = sizePlot(need, chanceOf("soggybud"), 51, mode);
        const spots = s.maximize ? 51 : s.spots;
        expect(spots).toBeGreaterThanOrEqual(previous);
        previous = spots;
      }
    }
  });
});


/**
 * A stand-in solver: a plot of N spots costs half that of each crop it needs.
 *
 * Deterministic and instant, which is what lets the convergence below be tested
 * as logic rather than as a solver benchmark. The real solver is exercised by
 * the acceptance fixture at the bottom of this file.
 */
const fakeSolve = (id: string, spots: number): PlotEconomy => {
  const crops: Record<string, number> = {};
  for (const req of data.mutations[id].requirements ?? []) crops[req.crop] = Math.max(1, Math.ceil(spots / 2));
  return { yield: spots, crops };
};

const FULL: Record<string, number> = { soggybud: 51, gloomgourd: 71 };

/** The refinement loop, exactly as the hook and the CLI run it. */
const converge = (qty: number) => {
  const targets = [{ id: "soggybud", qty }];
  const economies: Record<string, PlotEconomy | null> = {
    soggybud: fakeSolve("soggybud", FULL.soggybud),
    gloomgourd: fakeSolve("gloomgourd", FULL.gloomgourd),
  };

  let sizing: Record<string, number> = {};
  let rounds = 0;
  for (let round = 0; round < SIZING_ROUNDS; round++) {
    const plan = buildSolverPlan(targets, data, economies);
    const next = sizingFor(plan, data.mutations, FULL);
    if (sameSizing(next, sizing)) break;
    rounds++;
    sizing = next;
    for (const [id, spots] of Object.entries(sizing)) economies[id] = fakeSolve(id, spots);
  }

  return { sizing, rounds, plan: buildSolverPlan(targets, data, economies), economies };
};

/**
 * The choice, and which way it defaults.
 *
 * THE OBJECTION, AND WHY IT IS PRINCIPLED. Eight spots for a need of two
 * reads as waste, and the reading is right. Input crops are not consumed when a
 * mutation spawns, so a spot that comes up empty rolls again next cycle off the
 * same sowing: a shortfall costs WAITING and never replanting. The 90% policy
 * was therefore never insurance against wasted crops, it was buying wall clock
 * with the player's crops and placement effort, a trade nobody asked for.
 *
 * So MINIMAL is the default and CONFIDENT is offered. Neither is more correct;
 * the defect was the site picking one silently.
 */
describe("minimal by default, confident on request", () => {
  it("defaults to one spot per unit wanted", () => {
    expect(DEFAULT_SIZING_MODE).toBe("minimal");

    const p = chanceOf("soggybud");
    // Passing no mode and passing the default must be the same answer, or the
    // page and the CLI would be describing different products.
    expect(sizePlot(2, p, 51)).toEqual(sizePlot(2, p, 51, DEFAULT_SIZING_MODE));
    expect(sizePlot(2, p, 51).spots).toBe(2);
  });

  it("gives the reported case 2 spots by default and 8 when asked to hurry", () => {
    const p = chanceOf("soggybud");

    const minimal = sizePlot(2, p, 51, "minimal");
    const confident = sizePlot(2, p, 51, "confident");

    expect(minimal.spots).toBe(2);
    expect(confident.spots).toBe(8);

    // The trade, stated in both directions: more spots buy a real jump in the
    // odds of one sowing covering it, and cost exactly the extra spots.
    expect(confident.confidence).toBeGreaterThanOrEqual(SIZING_CONFIDENCE);
    expect(minimal.confidence).toBeLessThan(SIZING_CONFIDENCE);
    expect(confident.spots).toBeGreaterThan(minimal.spots);
  });

  it("never asks for more spots under minimal than under confident", () => {
    for (const id of ["soggybud", "gloomgourd"]) {
      for (const need of [1, 2, 3, 6, 10]) {
        const full = id === "soggybud" ? 51 : 71;
        const minimal = sizePlot(need, chanceOf(id), full, "minimal");
        const confident = sizePlot(need, chanceOf(id), full, "confident");
        const spotsOf = (s: { spots: number; maximize: boolean }) => (s.maximize ? full : s.spots);
        expect(spotsOf(minimal)).toBeLessThanOrEqual(spotsOf(confident));
      }
    }
  });

  it("takes the mode per row, so one row's choice does not resize the rest", () => {
    /*
     * The control sits beside one mutation's breakdown. Wanting THAT one sooner
     * says nothing about the tiers underneath it, and a button that quietly
     * resized eleven other plots would be the same silent picking again.
     */
    const targets = [{ id: "soggybud", qty: 2 }];
    const economies: Record<string, PlotEconomy | null> = {
      soggybud: fakeSolve("soggybud", FULL.soggybud),
      gloomgourd: fakeSolve("gloomgourd", FULL.gloomgourd),
    };
    const plan = buildSolverPlan(targets, data, economies);

    const allMinimal = sizingFor(plan, data.mutations, FULL, {}, "minimal");
    const soggybudOnly = sizingFor(plan, data.mutations, FULL, {}, (id) => (id === "soggybud" ? "confident" : "minimal"));

    expect(soggybudOnly.soggybud).toBeGreaterThan(allMinimal.soggybud);
    // Gloomgourd was left alone, so it is still answering minimally. Its need
    // is set by the tier above, which is the cascade working rather than the
    // choice leaking.
    expect(soggybudOnly.gloomgourd).toBe(
      sizePlot(
        plan.cycles.flatMap((c) => c.produce).find((n) => n.id === "gloomgourd")!.need,
        chanceOf("gloomgourd"),
        FULL.gloomgourd,
        "minimal"
      ).spots
    );
  });
});

describe("refining down the tiers", () => {
  it("settles, and well inside the round cap", () => {
    const { rounds } = converge(2);
    expect(rounds).toBeGreaterThan(0);
    expect(rounds).toBeLessThan(SIZING_ROUNDS);
  });

  it("sizes the tier below against the real demand, not the provisional one", () => {
    /*
     * THE BUG A SINGLE PASS LEAVES BEHIND. Right-sizing Soggybud shrinks what
     * it sows, which shrinks what Gloomgourd owes. Sizing Gloomgourd once, from
     * the plan built on a FULL Soggybud plot, sizes it against a demand that no
     * longer exists. Measured on a real case that left Gloomgourd at
     * 54 spots for a need of 4.
     */
    const oneRound = (() => {
      const targets = [{ id: "soggybud", qty: 2 }];
      const economies: Record<string, PlotEconomy | null> = {
        soggybud: fakeSolve("soggybud", FULL.soggybud),
        gloomgourd: fakeSolve("gloomgourd", FULL.gloomgourd),
      };
      const sizing = sizingFor(buildSolverPlan(targets, data, economies), data.mutations, FULL);
      for (const [id, spots] of Object.entries(sizing)) economies[id] = fakeSolve(id, spots);
      return sizing;
    })();

    const settled = converge(2).sizing;

    expect(settled.gloomgourd).toBeLessThan(oneRound.gloomgourd);
    // Soggybud is the top tier, so one pass already had it right and refining
    // must not have moved it.
    expect(settled.soggybud).toBe(oneRound.soggybud);
  });

  it("is a no-op for a demand no plot can cover", () => {
    // Nothing is sized, so `sameSizing` stops it on the very first comparison
    // and a large plan never reaches the solver a second time.
    const { sizing, rounds } = converge(100_000);
    expect(sizing).toEqual({});
    expect(rounds).toBe(0);
  });

  it("never sizes a step your stock already covers", () => {
    const targets = [{ id: "soggybud", qty: 2 }];
    const economies: Record<string, PlotEconomy | null> = {
      soggybud: fakeSolve("soggybud", FULL.soggybud),
      gloomgourd: fakeSolve("gloomgourd", FULL.gloomgourd),
    };
    const plan = buildSolverPlan(targets, data, economies, { gloomgourd: 10_000 });
    const covered = plan.cycles.flatMap((c) => c.produce).find((n) => n.id === "gloomgourd");

    expect(covered?.covered).toBe(true);
    // There is no plot to size, so it must not appear in the sizing map at all.
    expect(sizingFor(plan, data.mutations, FULL).gloomgourd).toBeUndefined();
  });
});

describe("sameSizing, the stop test", () => {
  it("tells the same request from a different one", () => {
    expect(sameSizing({}, {})).toBe(true);
    expect(sameSizing({ a: 5 }, { a: 5 })).toBe(true);
    expect(sameSizing({ a: 5 }, { a: 6 })).toBe(false);
    expect(sameSizing({ a: 5 }, {})).toBe(false);
    expect(sameSizing({ a: 5 }, { a: 5, b: 1 })).toBe(false);
  });
});

/**
 * The reported case, against the REAL solver.
 *
 * Slower than the rest of the file on purpose. Everything above tests the rule;
 * this tests that the rule and the solver together produce the small planting
 * the player should have been shown.
 */
describe("acceptance: Melon Juice Mixin, 2 Soggybud", () => {
  /** The refinement, run against the real solver at one mode. */
  const settle = async (mode: "minimal" | "confident") => {
    const { solveLocal } = await import("../../solver");
    const cells: [number, number][] = [];
    for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) cells.push([r, c]);

    const solve = (id: string, spots?: number): PlotEconomy | null => {
      const res = solveLocal(cells, [{ mutation: id, maximize: spots === undefined, count: spots ?? null }], data, {
        removeUnusedCrops: true,
      });
      const crops: Record<string, number> = {};
      for (const p of res.placements) crops[p.crop] = (crops[p.crop] ?? 0) + 1;
      return res.mutations.length > 0 ? { yield: res.mutations.length, crops } : null;
    };

    const targets = [{ id: "soggybud", qty: 2 }];
    const economies: Record<string, PlotEconomy | null> = {
      soggybud: solve("soggybud"),
      gloomgourd: solve("gloomgourd"),
    };
    const fullYields: Record<string, number> = {};
    for (const [id, e] of Object.entries(economies)) if (e) fullYields[id] = e.yield;

    const before = buildSolverPlan(targets, data, economies);

    let sizing: Record<string, number> = {};
    for (let round = 0; round < SIZING_ROUNDS; round++) {
      const next = sizingFor(buildSolverPlan(targets, data, economies), data.mutations, fullYields, {}, mode);
      if (sameSizing(next, sizing)) break;
      sizing = next;
      for (const [id, spots] of Object.entries(sizing)) economies[id] = solve(id, spots) ?? economies[id];
    }

    const after = buildSolverPlan(targets, data, economies);
    const rowOf = (plan: typeof after, id: string) => plan.cycles.flatMap((c) => c.produce).find((n) => n.id === id)!;
    const cropOf = (plan: typeof after, id: string) => plan.baseCrops.find((c) => c.id === id)?.need ?? 0;

    return { before, after, fullYields, rowOf, cropOf, soggybud: rowOf(after, "soggybud"), gloomgourd: rowOf(after, "gloomgourd") };
  };

  it("produces a handful of spots instead of a full plot", async () => {
    const { before, after, fullYields, cropOf, soggybud, gloomgourd } = await settle("minimal");

    // The plot the page actually showed: a full plot, tens of each crop.
    const beforeMelon = cropOf(before, "melon");
    expect(fullYields.soggybud).toBeGreaterThan(40);
    expect(beforeMelon).toBeGreaterThan(30);

    // A handful of spots, both tiers, and still one planting each.
    expect(soggybud.perPlot).toBeLessThanOrEqual(12);
    expect(soggybud.plots).toBe(1);
    expect(gloomgourd.perPlot).toBeLessThanOrEqual(20);
    expect(gloomgourd.plots).toBe(1);

    // And the bill collapses with it, which is the number being read.
    expect(cropOf(after, "melon")).toBeLessThan(beforeMelon / 2);
  }, 60_000);

  /**
   * THE ACCEPTANCE, both halves of it.
   *
   * Two at a time is the default now, and the 90% sizing is
   * still there for anyone who would rather spend crops than days. The point of
   * checking both in one test is that the cheaper plot really is cheaper and the
   * faster plot really is bigger; a default that quietly cost the same as the
   * option would be no choice at all.
   */
  it("defaults to two spots and offers eight, and the cheaper plot is genuinely cheaper", async () => {
    const minimal = await settle("minimal");
    const confident = await settle("confident");

    expect(minimal.soggybud.perPlot).toBe(2);
    expect(confident.soggybud.perPlot).toBe(8);

    // One planting either way: the choice is how fast it fills, never how many
    // times it has to be sown.
    expect(minimal.soggybud.plots).toBe(1);
    expect(confident.soggybud.plots).toBe(1);

    // The crops the player places, which is the objectionable cost. Both
    // tiers get cheaper, because a smaller Soggybud plot owes less Gloomgourd.
    expect(minimal.cropOf(minimal.after, "melon")).toBeLessThan(confident.cropOf(confident.after, "melon"));
    expect(minimal.gloomgourd.need).toBeLessThan(confident.gloomgourd.need);
  }, 120_000);
});
