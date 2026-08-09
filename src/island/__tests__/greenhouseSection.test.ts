import { describe, expect, it } from "vitest";
import { validateSnapshot } from "../validate";
import { applyLivePayload } from "../live";
import reference from "./fixtures/greenhouse-ref.json";

/**
 * The greenhouse section, pinned to the contract.
 *
 * Three promises are made about this section and each one is a different kind
 * of honesty, so each gets its own block below:
 *
 *   absence      a snapshot without a greenhouse is ordinary. Most snapshots
 *                are, because the board is only captured while the player is
 *                standing near it on the Garden.
 *   refusal      a board that contradicts itself is refused rather than
 *                partially drawn. A cell outside the size it just declared, or
 *                one that is both a crop and a mutation, means the coordinate
 *                frame cannot be trusted, and half a board is a confidently
 *                wrong picture of somebody's greenhouse.
 *   replacement  a new snapshot's greenhouse replaces the old one WHOLESALE.
 *                There is no keep-last, so a session that never walks past the
 *                greenhouse shows no board rather than last night's board under
 *                tonight's timestamp.
 *
 * `island-ref.json` predates the section, so the fixture here is a small
 * purpose-built board: a row of pumpkins, a 2x2 Choconut listed as its four
 * cells the way the spec requires, two diagnosed next-stage times, and unknown
 * fields on both a cell and the board itself.
 */

const minimal = {
  schema: 1,
  exportedAt: 1754092800000,
  player: { uuid: "u", name: "Steve" },
  profile: { name: "Papaya", gameMode: "ironman" },
  sacks: { OAK_LOG: 12 },
  chests: [{ pos: [1, 2, 3], name: "Chest", lastSeen: 10, items: [{ id: "OAK_LOG", count: 4 }] }],
};

/** A board with whatever cells the case needs, on the real 10x10. */
const boardWith = (cells: unknown[], extra: Record<string, unknown> = {}) => ({
  ...minimal,
  greenhouse: { observedAt: 1754092700000, size: [10, 10], cells, ...extra },
});

describe("an absent greenhouse is ordinary", () => {
  it("validates a snapshot that has no greenhouse at all", () => {
    const out = validateSnapshot(minimal);
    expect(out.greenhouse).toBeUndefined();
    // Absent rather than an explicit undefined key, so nothing downstream can
    // read "the mod sent a greenhouse" off a key that only exists because we
    // wrote it.
    expect("greenhouse" in out).toBe(false);
  });

  it("costs the rest of the island nothing", () => {
    const out = validateSnapshot(minimal);
    expect(out.chests).toHaveLength(1);
    expect(out.chests[0].items).toStrictEqual([{ id: "OAK_LOG", name: "Oak Log", count: 4 }]);
    expect(out.sacks).toStrictEqual({ OAK_LOG: 12 });
    expect(out.player.name).toBe("Steve");
  });
});

describe("a real board reads as itself", () => {
  it("parses the reference fixture", () => {
    const board = validateSnapshot(reference).greenhouse;
    expect(board).toBeDefined();
    expect(board?.observedAt).toBe(1785638070000);
    expect(board?.size).toStrictEqual([10, 10]);
    expect(board?.cells).toHaveLength(10);
  });

  it("keeps crops and mutations apart", () => {
    const cells = validateSnapshot(reference).greenhouse?.cells ?? [];
    expect(cells.filter((c) => c.crop !== undefined)).toHaveLength(6);
    expect(cells.filter((c) => c.mutation !== undefined)).toHaveLength(4);
    // The 2x2 Choconut is four cells, not one cell with a size. That is the
    // spec's rule and it is what lets the board be drawn cell by cell.
    expect(cells.filter((c) => c.mutation === "CHOCONUT")).toHaveLength(4);
  });

  it("keeps the diagnosed next-stage times and invents none", () => {
    const cells = validateSnapshot(reference).greenhouse?.cells ?? [];
    expect(cells.filter((c) => c.nextStageAt !== undefined)).toHaveLength(2);
    expect(cells.find((c) => c.x === 2 && c.y === 3)?.nextStageAt).toBe(1785644070000);
    // Diagnostics are player-triggered and per-crop, so most cells have none.
    // Nothing may fill those in, by estimate or by any other means.
    expect(cells.find((c) => c.x === 0 && c.y === 3)?.nextStageAt).toBeUndefined();
  });

  it("leaves the rest of that snapshot untouched", () => {
    const out = validateSnapshot(reference);
    expect(out.chests).toHaveLength(1);
    expect(out.sacks).toStrictEqual({ PUMPKIN: 4096 });
  });
});

describe("unknown fields are tolerated and dropped", () => {
  it("ignores an unknown key on a cell without dropping the cell", () => {
    // `ground` is a real field on the layout push, so the mod adding it to an
    // observation is exactly the forward-compatible case this promises to
    // survive.
    const cells = validateSnapshot(boardWith([{ x: 1, y: 1, crop: "PUMPKIN", ground: "farmland", tier: 3 }]))
      .greenhouse?.cells;
    expect(cells).toStrictEqual([{ x: 1, y: 1, crop: "PUMPKIN" }]);
    expect(Object.keys(cells?.[0] ?? {}).sort()).toStrictEqual(["crop", "x", "y"]);
  });

  it("ignores an unknown key on the board itself", () => {
    const board = validateSnapshot(boardWith([{ x: 0, y: 0, crop: "MELON" }], { skin: "GLASS", tier: 4 })).greenhouse;
    expect(Object.keys(board ?? {}).sort()).toStrictEqual(["cells", "observedAt", "size"]);
  });

  it("drops the unknown keys carried by the reference fixture", () => {
    const board = validateSnapshot(reference).greenhouse;
    expect("skin" in (board ?? {})).toBe(false);
    expect(board?.cells.every((c) => !("ground" in c))).toBe(true);
  });
});

describe("a board that contradicts itself is refused", () => {
  it("rejects a cell outside the size it declares", () => {
    expect(() => validateSnapshot(boardWith([{ x: 10, y: 0, crop: "PUMPKIN" }]))).toThrow(
      /greenhouse cell at 10,0, outside the 10x10 board/i
    );
    expect(() => validateSnapshot(boardWith([{ x: 0, y: 10, crop: "PUMPKIN" }]))).toThrow(/outside the 10x10 board/i);
  });

  it("rejects a negative coordinate, which is outside at the other end", () => {
    expect(() => validateSnapshot(boardWith([{ x: -1, y: 0, crop: "PUMPKIN" }]))).toThrow(/outside the 10x10 board/i);
  });

  it("bounds against the declared size, not against ten", () => {
    // `size` is future-proofing, so the check has to follow it. A board that
    // says it is 4x4 must reject a cell at 5,0 and accept one at 3,3.
    const small = (cells: unknown[]) => ({
      ...minimal,
      greenhouse: { observedAt: 1, size: [4, 4], cells },
    });
    expect(() => validateSnapshot(small([{ x: 5, y: 0, crop: "PUMPKIN" }]))).toThrow(/outside the 4x4 board/i);
    expect(validateSnapshot(small([{ x: 3, y: 3, crop: "PUMPKIN" }])).greenhouse?.cells).toHaveLength(1);
  });

  it("refuses rather than silently clamping the cell into range", () => {
    // The failure this rules out: a cell at 12,3 quietly becoming 9,3 and the
    // player seeing a pumpkin in a square that has none.
    let clamped: unknown = "no throw";
    try {
      validateSnapshot(boardWith([{ x: 12, y: 3, crop: "PUMPKIN" }]));
    } catch (e) {
      clamped = e instanceof Error ? e.message : String(e);
    }
    expect(clamped).toMatch(/12,3/);
  });

  it("rejects a cell holding both a crop and a mutation", () => {
    expect(() =>
      validateSnapshot(boardWith([{ x: 1, y: 3, crop: "PUMPKIN", mutation: "CHOCONUT" }]))
    ).toThrow(/greenhouse cell at 1,3 holding both a crop and a mutation/i);
  });

  it("rejects a cell holding neither", () => {
    expect(() => validateSnapshot(boardWith([{ x: 1, y: 3 }]))).toThrow(/neither a crop nor a mutation/i);
    // A non-string id is not an id. Coercing `crop: 5` into "5" would put a
    // nameless tile on the board instead of saying the cell is wrong.
    expect(() => validateSnapshot(boardWith([{ x: 1, y: 3, crop: 5 }]))).toThrow(/neither a crop nor a mutation/i);
    expect(() => validateSnapshot(boardWith([{ x: 1, y: 3, crop: "   " }]))).toThrow(/neither a crop nor a mutation/i);
  });

  it("rejects a cell with no whole-number position", () => {
    for (const cell of [{ y: 1, crop: "A" }, { x: 1.5, y: 1, crop: "A" }, { x: "a", y: 1, crop: "A" }]) {
      expect(() => validateSnapshot(boardWith([cell]))).toThrow(/no whole-number position/i);
    }
  });

  it("rejects a cell that is not an object", () => {
    for (const cell of ["PUMPKIN", 4, null, ["x"]]) {
      expect(() => validateSnapshot(boardWith([cell]))).toThrow(/greenhouse cell that is not an object/i);
    }
  });

  it("names the offending cell so the mod crew can find it", () => {
    // These messages are rendered on the page, so they have to read as a
    // sentence and have to say WHICH cell. "Something is wrong with your
    // greenhouse" is not something anyone can act on.
    expect(() =>
      validateSnapshot(
        boardWith([
          { x: 0, y: 0, crop: "PUMPKIN" },
          { x: 3, y: 12, mutation: "CHOCONUT" },
        ])
      )
    ).toThrow(/at 3,12/);
  });
});

describe("an unreadable board is not observed, and costs nothing else", () => {
  /**
   * The other half of the split. A section we cannot read at all says nothing,
   * so it reads as "not observed" exactly like an absent one: no card, no
   * claim, and above all no loss of the chests in the same snapshot. Refusal is
   * reserved for a board that reads and then contradicts itself.
   */
  const unreadable = [
    "soon",
    42,
    null,
    ["cells"],
    { observedAt: 1, cells: [] },
    { observedAt: 1, size: [10], cells: [] },
    { observedAt: 1, size: [0, 10], cells: [] },
    { observedAt: 1, size: [10, 10], cells: "none" },
    { observedAt: 1, size: [1000, 1000], cells: [] },
    { observedAt: 1, size: ["10", "ten"], cells: [] },
  ];

  it("treats it as not observed rather than throwing", () => {
    for (const greenhouse of unreadable) {
      const out = validateSnapshot({ ...minimal, greenhouse });
      expect(out.greenhouse).toBeUndefined();
      expect("greenhouse" in out).toBe(false);
    }
  });

  it("keeps the rest of the island intact every time", () => {
    for (const greenhouse of unreadable) {
      const out = validateSnapshot({ ...minimal, greenhouse });
      expect(out.chests).toHaveLength(1);
      expect(out.sacks).toStrictEqual({ OAK_LOG: 12 });
    }
  });
});

describe("the honesty stamp", () => {
  it("keeps the observation time as sent", () => {
    const board = validateSnapshot(boardWith([{ x: 0, y: 0, crop: "MELON" }])).greenhouse;
    expect(board?.observedAt).toBe(1754092700000);
  });

  it("falls back to zero rather than to now when the time is missing or absurd", () => {
    // Zero renders as "never" through `ago`, which understates freshness. The
    // alternative - stamping the board with the moment it was parsed - would
    // overstate it, and an overstated freshness on a live-tracking board is the
    // single worst thing this section could do.
    for (const observedAt of [undefined, null, "yesterday", -5, 0, Number.NaN]) {
      const board = validateSnapshot({
        ...minimal,
        greenhouse: { observedAt, size: [10, 10], cells: [{ x: 0, y: 0, crop: "MELON" }] },
      }).greenhouse;
      expect(board?.observedAt).toBe(0);
    }
  });

  it("drops a malformed next-stage time without losing the cell", () => {
    for (const nextStageAt of [null, "soon", -1, 0, Number.NaN]) {
      const cells = validateSnapshot(boardWith([{ x: 0, y: 0, crop: "MELON", nextStageAt }])).greenhouse?.cells;
      expect(cells).toStrictEqual([{ x: 0, y: 0, crop: "MELON" }]);
    }
  });

  it("keeps a verified-empty board as data, and leaves the no-card rule to the page", () => {
    // "I looked and nothing is planted" is a real observation, distinct from
    // never having looked. The validator keeps that distinction; the card is
    // the one place that decides an empty board is not worth drawing.
    const board = validateSnapshot(boardWith([])).greenhouse;
    expect(board?.cells).toStrictEqual([]);
    expect(board?.observedAt).toBe(1754092700000);
  });
});

describe("a new snapshot replaces the board wholesale", () => {
  /**
   * The persistence rule, walked through the transport that actually applies
   * it. `applyLivePayload` is the single gate every mod snapshot passes,
   * whether it arrived over SSE or a poll, so proving it here proves it for
   * both.
   */
  const withBoard = boardWith([{ x: 0, y: 3, crop: "PUMPKIN" }]);

  it("carries the board in on the first snapshot", () => {
    const first = applyLivePayload({}, withBoard, 1000);
    expect(first.error).toBeNull();
    expect(first.feeds.mod?.snapshot.greenhouse?.cells).toHaveLength(1);
  });

  it("drops the board when the next snapshot does not carry one", () => {
    const first = applyLivePayload({}, withBoard, 1000);
    const second = applyLivePayload(first.feeds, minimal, 2000);

    expect(second.error).toBeNull();
    // Not observed this session. No keep-last, no merge, no board.
    expect(second.feeds.mod?.snapshot.greenhouse).toBeUndefined();
  });

  it("clears nothing else when the board goes away", () => {
    const first = applyLivePayload({}, withBoard, 1000);
    const second = applyLivePayload(first.feeds, minimal, 2000);
    const snapshot = second.feeds.mod?.snapshot;

    expect(snapshot?.chests).toHaveLength(1);
    expect(snapshot?.chests[0].items).toHaveLength(1);
    expect(snapshot?.sacks).toStrictEqual({ OAK_LOG: 12 });
    expect(snapshot?.player.name).toBe("Steve");
  });

  it("replaces an old board with a new one rather than blending them", () => {
    const first = applyLivePayload({}, withBoard, 1000);
    const later = applyLivePayload(
      first.feeds,
      boardWith([{ x: 9, y: 9, mutation: "CHOCONUT" }], { observedAt: 1754099999000 }),
      2000
    );

    const board = later.feeds.mod?.snapshot.greenhouse;
    expect(board?.cells).toStrictEqual([{ x: 9, y: 9, mutation: "CHOCONUT" }]);
    expect(board?.observedAt).toBe(1754099999000);
  });

  it("keeps the stored board when a bad snapshot is refused", () => {
    // The refusal path must never cost the player what is already on screen.
    // `applyLivePayload` returns the caller's own feed set by identity, so
    // there is no code path where a contradictory board replaces a good one.
    const first = applyLivePayload({}, withBoard, 1000);
    const bad = applyLivePayload(first.feeds, boardWith([{ x: 99, y: 0, crop: "PUMPKIN" }]), 2000);

    expect(bad.error).toMatch(/outside the 10x10 board/i);
    expect(bad.feeds).toBe(first.feeds);
    expect(bad.feeds.mod?.snapshot.greenhouse?.cells).toHaveLength(1);
  });
});
