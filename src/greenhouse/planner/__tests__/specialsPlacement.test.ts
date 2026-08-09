import { describe, expect, it } from "vitest";
import type { CropDefinition, MutationDefinition } from "../../types/greenhouse";
import { buildSolverPlan, type PlotEconomy } from "../solverPlan";

/**
 * THE LIVE PLAN THIS PINS. A real saved plan towards Rose Dragon Pet showed
 * "Blastberry: 27 needed" in the cycle list and "Blastberry: 15" in "Mutations
 * to place, across every planting" - two numbers for the same mutation on the
 * same page, disagreeing by exactly 12. Turtlellini, needed 6, did not appear
 * in "Mutations to place" at all.
 *
 * The cause: `buildSolverPlan` has two branches that walk a mutation's inputs
 * downward. The ordinary branch (an economy-priced plot) records every input
 * twice, once into `demand` ("how many must exist") and once into
 * `placedTotals` ("how many I carry out and put in the ground") - the comment
 * beside it says so in as many words. The SPECIAL branch, used for a mechanic
 * requirement `specials.ts` states outside the adjacency data (Shellfruit's
 * "explode Turtlellini twice with Blastberry"), only ever recorded the first
 * half. A mechanic requirement is still something walked to the plot and
 * spent - Shellfruit's 2x Blastberry as much as Startlevine's 4x - so it owed
 * `placedTotals` the same entry.
 *
 * This is a minimal reproduction: a single Shellfruit target, with no other
 * consumer of Blastberry or Turtlellini in the tree, so every unit of demand
 * for either one has to come through the special branch alone. Before the
 * fix, `plan.placed` held neither of them.
 */

const shellfruit: MutationDefinition = {
  id: "shellfruit",
  name: "Shellfruit",
  size: 1,
  ground: "farmland",
  requirements: [],
  special: "explode_turtlellini_with_blastberry",
  rarity: "epic",
  growth_stages: 0,
  decay: 3,
  positive_buffs: [],
  negative_buffs: [],
  drops: {},
};

const turtlellini: MutationDefinition = {
  id: "turtlellini",
  name: "Turtlellini",
  size: 1,
  ground: "farmland",
  requirements: [{ crop: "soggybud", count: 4 }, { crop: "choconut", count: 4 }],
  rarity: "epic",
  growth_stages: 0,
  decay: 3,
  positive_buffs: [],
  negative_buffs: [],
  drops: {},
};

const blastberry: MutationDefinition = {
  id: "blastberry",
  name: "Blastberry",
  size: 1,
  ground: "farmland",
  requirements: [{ crop: "chocoberry", count: 5 }, { crop: "ashwreath", count: 3 }],
  rarity: "rare",
  growth_stages: 6,
  decay: 3,
  positive_buffs: [],
  negative_buffs: [],
  drops: {},
};

const data = {
  crops: {} as Record<string, CropDefinition>,
  mutations: { shellfruit, turtlellini, blastberry },
};

/** One plot of each, sized so the plantings math in this test stays exact. */
const ECONOMIES: Record<string, PlotEconomy | null> = {
  turtlellini: { yield: 6, crops: {} },
  blastberry: { yield: 12, crops: {} },
};

describe("a mechanic requirement (Shellfruit's Blastberry and Turtlellini)", () => {
  it("carries its inputs into the placement list, not only the demand list", () => {
    const plan = buildSolverPlan([{ id: "shellfruit", qty: 6 }], data, ECONOMIES);

    const placedTurtlellini = plan.placed.find((p) => p.id === "turtlellini");
    const placedBlastberry = plan.placed.find((p) => p.id === "blastberry");

    // 6 Shellfruit x 1 Turtlellini each, and x 2 Blastberry each.
    expect(placedTurtlellini?.count).toBe(6);
    expect(placedBlastberry?.count).toBe(12);
  });

  it("agrees with the row it schedules those plantings from", () => {
    const plan = buildSolverPlan([{ id: "shellfruit", qty: 6 }], data, ECONOMIES);
    const nodes = plan.cycles.flatMap((c) => c.produce);

    const turtlelliniRow = nodes.find((n) => n.id === "turtlellini");
    const blastberryRow = nodes.find((n) => n.id === "blastberry");
    const placedTurtlellini = plan.placed.find((p) => p.id === "turtlellini");
    const placedBlastberry = plan.placed.find((p) => p.id === "blastberry");

    // The number a player is told to grow and the number they are told to
    // place have to be the same number when nothing else consumes either one.
    expect(placedTurtlellini?.count).toBe(turtlelliniRow?.need);
    expect(placedBlastberry?.count).toBe(blastberryRow?.need);
  });
});
