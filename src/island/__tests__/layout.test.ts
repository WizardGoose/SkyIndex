import { describe, expect, it } from "vitest";
import { buildLayoutPush, layoutLabel } from "../layout";
import type { LayoutItem } from "../layout";

/**
 * The wire format for Transport 3, tested without a network or a page.
 *
 * A Fabric mod is being written against the same spec, so the thing under test
 * is not "does the button work" but "is the body the mod is promised the body it
 * gets". Every case below is one sentence from the spec: only occupied cells,
 * crop XOR mutation, 0-based coordinates, ground only where known.
 */

const crop = (row: number, col: number, over: Partial<LayoutItem> = {}): LayoutItem => ({
  position: [row, col],
  size: 1,
  name: "Cocoa Beans",
  isMutation: false,
  ground: "farmland",
  ...over,
});

const mutation = (row: number, col: number, over: Partial<LayoutItem> = {}): LayoutItem => ({
  position: [row, col],
  size: 1,
  name: "Choconut",
  isMutation: true,
  ...over,
});

/** Every build in this file is expected to succeed; this unwraps or fails loudly. */
const build = (items: LayoutItem[], options?: Parameters<typeof buildLayoutPush>[1]) => {
  const result = buildLayoutPush(items, options);
  if (!result.ok) throw new Error(`expected a body, got refusal: ${result.reason}`);
  return result.body;
};

describe("buildLayoutPush, the envelope", () => {
  it("pins schema 1 and the grid size", () => {
    const body = build([crop(0, 0)]);

    expect(body.schema).toBe(1);
    expect(body.size).toStrictEqual([10, 10]);
  });

  it("honours a non-default grid size", () => {
    const body = build([crop(0, 0)], { gridSize: 4 });

    expect(body.size).toStrictEqual([4, 4]);
  });

  it("refuses a grid size that is not a whole number of cells", () => {
    for (const gridSize of [0, -1, 2.5, Number.NaN]) {
      const result = buildLayoutPush([crop(0, 0)], { gridSize });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toMatch(/whole number/i);
    }
  });
});

describe("buildLayoutPush, occupied cells only", () => {
  it("lists nothing for the empty majority of a sparse plot", () => {
    const body = build([crop(3, 0), mutation(3, 1)]);

    // Two placements on a 10x10 plot: two cells, not a hundred.
    expect(body.cells).toHaveLength(2);
  });

  it("expands a 2x2 placement into its four cells", () => {
    const body = build([mutation(0, 0, { size: 2 })]);

    expect(body.cells).toStrictEqual([
      { x: 0, y: 0, mutation: "Choconut" },
      { x: 1, y: 0, mutation: "Choconut" },
      { x: 0, y: 1, mutation: "Choconut" },
      { x: 1, y: 1, mutation: "Choconut" },
    ]);
  });

  it("drops placements that carry no name, rather than emitting a nameless cell", () => {
    const body = build([crop(0, 0), crop(0, 1, { name: "" }), crop(0, 2, { name: "   " })]);

    expect(body.cells).toHaveLength(1);
    expect(body.cells[0]).toStrictEqual({ x: 0, y: 0, crop: "Cocoa Beans", ground: "farmland" });
  });

  it("drops the cells of a placement that hangs off the edge, keeping the ones inside", () => {
    const body = build([crop(9, 9, { size: 2 })]);

    // Only the corner is on the plot; the other three cells describe ground
    // that does not exist and are not sent.
    expect(body.cells).toStrictEqual([{ x: 9, y: 9, crop: "Cocoa Beans", ground: "farmland" }]);
  });

  it("ignores placements with a nonsense position or size", () => {
    const junk: LayoutItem[] = [
      crop(-1, 0),
      crop(0, -3),
      crop(1.5 as number, 2),
      crop(2, 2, { size: 0 }),
      crop(3, 3, { size: -2 }),
      crop(4, 4, { size: 1.5 }),
      { ...crop(5, 5), position: [5] as unknown as [number, number] },
    ];

    const result = buildLayoutPush(junk);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/empty/i);
  });
});

describe("buildLayoutPush, crop XOR mutation", () => {
  it("never sets both fields on one cell", () => {
    const body = build([crop(0, 0), mutation(1, 1), crop(2, 2, { name: "Pumpkin", ground: "sand" })]);

    for (const cell of body.cells) {
      const hasCrop = cell.crop !== undefined;
      const hasMutation = cell.mutation !== undefined;
      expect(hasCrop !== hasMutation).toBe(true);
    }
  });

  it("resolves an overlap to the mutation, whatever order the items arrive in", () => {
    const cropFirst = build([crop(4, 4), mutation(4, 4)]);
    const mutationFirst = build([mutation(4, 4), crop(4, 4)]);

    expect(cropFirst.cells).toStrictEqual([{ x: 4, y: 4, mutation: "Choconut" }]);
    expect(mutationFirst.cells).toStrictEqual(cropFirst.cells);
  });

  it("does not leave a crop's ground behind on a cell a mutation took over", () => {
    const body = build([crop(2, 2, { ground: "farmland" }), mutation(2, 2)]);

    expect(body.cells[0]).toStrictEqual({ x: 2, y: 2, mutation: "Choconut" });
    expect(body.cells[0].ground).toBeUndefined();
  });
});

describe("buildLayoutPush, coordinates", () => {
  it("is 0-based, and maps row to y and column to x", () => {
    const body = build([crop(3, 0), mutation(3, 1)]);

    // The spec's own example: two neighbours on row 3, x stepping across.
    expect(body.cells).toStrictEqual([
      { x: 0, y: 3, crop: "Cocoa Beans", ground: "farmland" },
      { x: 1, y: 3, mutation: "Choconut" },
    ]);
  });

  it("places the origin placement at 0,0 rather than 1,1", () => {
    const body = build([crop(0, 0)]);

    expect(body.cells[0].x).toBe(0);
    expect(body.cells[0].y).toBe(0);
  });

  it("emits cells in reading order so the same layout always serialises the same way", () => {
    const body = build([crop(5, 1), crop(0, 9), crop(0, 2), crop(5, 0)]);

    expect(body.cells.map((c) => [c.y, c.x])).toStrictEqual([
      [0, 2],
      [0, 9],
      [5, 0],
      [5, 1],
    ]);
  });
});

describe("buildLayoutPush, ground", () => {
  it("includes ground only where one is known", () => {
    const body = build([
      crop(0, 0, { ground: "farmland" }),
      crop(0, 1, { name: "Nether Wart", ground: "soul_sand" }),
      crop(0, 2, { name: "Mystery", ground: undefined }),
      crop(0, 3, { name: "Also Mystery", ground: null }),
      crop(0, 4, { name: "Blank", ground: "   " }),
    ]);

    expect(body.cells.map((c) => c.ground)).toStrictEqual([
      "farmland",
      "soul_sand",
      undefined,
      undefined,
      undefined,
    ]);
    // Absent, not present-and-empty: the mod distinguishes "no data" from a value.
    expect(Object.prototype.hasOwnProperty.call(body.cells[2], "ground")).toBe(false);
  });

  it("carries ground on a mutation cell when the dataset has one", () => {
    const body = build([mutation(1, 1, { ground: "mycelium" })]);

    expect(body.cells[0]).toStrictEqual({ x: 1, y: 1, mutation: "Choconut", ground: "mycelium" });
  });
});

/**
 * The estimate the mod displays instead of computing.
 *
 * The mod has no clock it can trust - it can see the plot but not how fast the
 * plot grows - so the number is priced here and shipped. Which makes absence
 * load bearing rather than cosmetic: the mod is required to draw no timer for a
 * cell with no `seconds`, so anything this builder is unsure of has to arrive as
 * nothing at all rather than as a zero the player would read as "ready".
 */
describe("buildLayoutPush, the growth estimate", () => {
  it("carries an estimate the model answered for", () => {
    const body = build([crop(0, 0, { seconds: 8100 })]);

    expect(body.cells[0]).toStrictEqual({ x: 0, y: 0, crop: "Cocoa Beans", ground: "farmland", seconds: 8100 });
  });

  it("leaves the field off entirely when the model declined", () => {
    // null is the model saying so, undefined is a caller that never asked.
    // Neither is a duration, and the mod reads both the same way: no timer.
    const body = build([crop(0, 0, { seconds: null }), crop(0, 1, { seconds: undefined })]);

    for (const cell of body.cells) {
      expect(Object.prototype.hasOwnProperty.call(cell, "seconds")).toBe(false);
    }
  });

  it("sends nothing anywhere when no estimate was resolved at all", () => {
    // The stats-less path. A player with no dataset loaded and no stats still
    // gets their layout in game; the only thing missing is the countdown.
    const body = build([crop(0, 0), mutation(1, 1), crop(2, 2, { name: "Pumpkin" })]);

    expect(body.cells).toHaveLength(3);
    expect(body.cells.some((cell) => "seconds" in cell)).toBe(false);
  });

  it("never emits a zero, however the zero arrived", () => {
    // A genuinely instant mutation, a rounding artefact, and arithmetic that
    // went wrong. None of them is a wait, and a zero on the wire would collapse
    // "not known" and "already done" into one reading.
    const body = build([
      crop(0, 0, { seconds: 0 }),
      crop(0, 1, { seconds: 0.4 }),
      crop(0, 2, { seconds: -60 }),
      crop(0, 3, { seconds: Number.NaN }),
      crop(0, 4, { seconds: Number.POSITIVE_INFINITY }),
      crop(0, 5, { seconds: "3600" as unknown as number }),
    ]);

    expect(body.cells).toHaveLength(6);
    expect(body.cells.some((cell) => "seconds" in cell)).toBe(false);
  });

  it("rounds to whole seconds, because the model never had the fraction", () => {
    const body = build([crop(0, 0, { seconds: 6260.869565 }), crop(0, 1, { seconds: 0.5 })]);

    expect(body.cells[0].seconds).toBe(6261);
    // Half a second rounds up to the smallest wait that is still a wait.
    expect(body.cells[1].seconds).toBe(1);
  });

  it("gives every cell of a 2x2 the same estimate", () => {
    const body = build([mutation(0, 0, { size: 2, seconds: 37565 })]);

    expect(body.cells).toStrictEqual([
      { x: 0, y: 0, mutation: "Choconut", seconds: 37565 },
      { x: 1, y: 0, mutation: "Choconut", seconds: 37565 },
      { x: 0, y: 1, mutation: "Choconut", seconds: 37565 },
      { x: 1, y: 1, mutation: "Choconut", seconds: 37565 },
    ]);
  });

  it("takes the mutation's estimate on a cell the mutation took over", () => {
    const body = build([crop(4, 4, { seconds: 8100 }), mutation(4, 4, { seconds: 37565 })]);

    expect(body.cells).toStrictEqual([{ x: 4, y: 4, mutation: "Choconut", seconds: 37565 }]);
  });

  it("keeps a mutation cell clean when only the crop underneath had an estimate", () => {
    const body = build([crop(4, 4, { seconds: 8100 }), mutation(4, 4)]);

    expect(body.cells[0]).toStrictEqual({ x: 4, y: 4, mutation: "Choconut" });
  });

  it("leaves the body byte for byte as it was when nothing is estimated", () => {
    // The wire format has a second reader being written against it, so a body
    // that gained no estimates has to serialise exactly as it did before there
    // was such a thing as an estimate: same cell order, same key order.
    const plain = build([crop(3, 0), mutation(3, 1)]);

    expect(JSON.stringify(plain.cells)).toBe(
      '[{"x":0,"y":3,"crop":"Cocoa Beans","ground":"farmland"},{"x":1,"y":3,"mutation":"Choconut"}]',
    );
  });

  it("appends the estimate after ground, so a diff of two bodies stays readable", () => {
    const body = build([crop(3, 0, { seconds: 8100 })]);

    expect(JSON.stringify(body.cells[0])).toBe('{"x":0,"y":3,"crop":"Cocoa Beans","ground":"farmland","seconds":8100}');
  });

  it("does not disturb reading order", () => {
    const body = build([
      crop(5, 1, { seconds: 100 }),
      crop(0, 9),
      crop(0, 2, { seconds: 200 }),
      crop(5, 0, { seconds: null }),
    ]);

    expect(body.cells.map((c) => [c.y, c.x])).toStrictEqual([
      [0, 2],
      [0, 9],
      [5, 0],
      [5, 1],
    ]);
  });
});

describe("layoutLabel", () => {
  it("names the layout after the target and its count", () => {
    const items = Array.from({ length: 72 }, (_, i) => mutation(Math.floor(i / 10), i % 10));

    expect(layoutLabel(items)).toBe("Choconut x72");
  });

  it("counts placements rather than cells, so a 2x2 counts once", () => {
    const items = [mutation(0, 0, { size: 2 }), mutation(0, 4, { size: 2 })];

    expect(layoutLabel(items)).toBe("Choconut x2");
  });

  it("prefers the mutation over the crops that feed it", () => {
    const items = [crop(0, 0), crop(0, 1), crop(0, 2), mutation(1, 1)];

    expect(layoutLabel(items)).toBe("Choconut x1");
  });

  it("falls back to the crops when there is no target at all", () => {
    expect(layoutLabel([crop(0, 0), crop(0, 1)])).toBe("Cocoa Beans x2");
    // A second crop is counted the same way a second target would be.
    expect(layoutLabel([crop(0, 0), crop(0, 1), crop(0, 2, { name: "Pumpkin" })])).toBe("Cocoa Beans x2 +1 more");
  });

  it("leads with the most numerous target and counts the rest", () => {
    const items = [
      mutation(0, 0),
      mutation(0, 1),
      mutation(1, 0, { name: "Ashvine" }),
      mutation(2, 0, { name: "Noctilume" }),
    ];

    expect(layoutLabel(items)).toBe("Choconut x2 +2 more");
  });

  it("breaks a tie on name so the label is stable across rebuilds", () => {
    const items = [mutation(0, 0, { name: "Zephyr" }), mutation(1, 0, { name: "Ashvine" })];

    expect(layoutLabel(items)).toBe("Ashvine x1 +1 more");
  });

  it("has something to say about an empty layout", () => {
    expect(layoutLabel([])).toBe("Greenhouse layout");
  });

  it("rides along on the built body, and yields to an explicit label", () => {
    expect(build([mutation(0, 0), mutation(0, 1)]).label).toBe("Choconut x2");
    expect(build([mutation(0, 0)], { label: "  Hand written  " }).label).toBe("Hand written");
    // A blank override is not a label; the derived one stands.
    expect(build([mutation(0, 0)], { label: "   " }).label).toBe("Choconut x1");
  });
});

describe("buildLayoutPush, the empty case", () => {
  it("refuses an empty grid instead of building a body with no cells", () => {
    const result = buildLayoutPush([]);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/empty/i);
    // The refusal is the whole point: `cells: []` would be accepted by the mod
    // and render nothing, which is indistinguishable from a broken connection.
    expect("body" in result).toBe(false);
  });

  it("refuses a grid whose only placements were all unusable", () => {
    const result = buildLayoutPush([crop(0, 0, { name: "" }), crop(20, 20)]);

    expect(result.ok).toBe(false);
  });
});
