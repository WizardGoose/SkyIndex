import { describe, expect, it } from "vitest";
import { columnsFor, columnOf, distribute, COLUMN_STEPS } from "../columns";

/**
 * The column layout behind the chest and sack boards.
 *
 * The property under test is not "the cards look nice", it is that a card's
 * column cannot be influenced by how tall anything is. That is what stops a
 * click on one card from rearranging the board around it, and it is the whole
 * reason this is a fixed distribution rather than masonry.
 */

describe("columnsFor", () => {
  it("gives three columns to a wide viewport and one to a narrow one", () => {
    expect(columnsFor(1440)).toBe(3);
    expect(columnsFor(320)).toBe(1);
  });

  it("steps exactly at the declared widths", () => {
    for (const step of COLUMN_STEPS) {
      expect(columnsFor(step.minWidth)).toBe(step.columns);
      expect(columnsFor(step.minWidth - 1)).toBeLessThan(step.columns);
    }
  });

  it("falls back to one column rather than NaN when the width is not a number", () => {
    expect(columnsFor(Number.NaN)).toBe(1);
  });
});

describe("distribute", () => {
  it("deals round robin so reading across a row follows the list", () => {
    expect(distribute(["a", "b", "c", "d", "e"], 3)).toEqual([["a", "d"], ["b", "e"], ["c"]]);
  });

  it("always returns exactly the requested number of columns, empty ones included", () => {
    expect(distribute(["a"], 3)).toEqual([["a"], [], []]);
    expect(distribute([], 3)).toEqual([[], [], []]);
  });

  it("refuses to produce zero columns, which would drop every card", () => {
    expect(distribute(["a", "b"], 0)).toEqual([["a", "b"]]);
    expect(distribute(["a", "b"], -4)).toEqual([["a", "b"]]);
  });

  it("keeps every input exactly once", () => {
    const keys = Array.from({ length: 62 }, (_, i) => `chest-${i}`);
    const flat = distribute(keys, 3).flat();
    expect(flat.slice().sort()).toEqual(keys.slice().sort());
    expect(flat).toHaveLength(keys.length);
  });
});

/**
 * The required behaviour, in as many words: collapse a chest and the chest
 * below it comes up to fill the gap, without anything jumping between columns.
 *
 * Collapse state is deliberately absent from `distribute`'s signature, so the
 * test drives the layout the way the page does - distribute first, decide
 * open/closed second - and checks that the second step cannot reach the first.
 */
describe("collapse keeps chests in their own column", () => {
  const keys = Array.from({ length: 11 }, (_, i) => `chest-${i}`);

  /** Exactly what the page does: a fixed distribution, then a per-card open flag. */
  const renderBoard = (columns: number, collapsed: ReadonlySet<string>) =>
    distribute(keys, columns).map((column) => column.map((key) => ({ key, open: !collapsed.has(key) })));

  const layoutOf = (board: { key: string }[][]) => board.map((column) => column.map((card) => card.key));

  it("lays the board out identically whatever is collapsed", () => {
    const open = renderBoard(3, new Set());
    const someCollapsed = renderBoard(3, new Set(["chest-1", "chest-4", "chest-9"]));
    const allCollapsed = renderBoard(3, new Set(keys));

    expect(layoutOf(someCollapsed)).toEqual(layoutOf(open));
    expect(layoutOf(allCollapsed)).toEqual(layoutOf(open));
  });

  it("leaves the chest below a collapsed one in the same column, directly beneath it", () => {
    const before = renderBoard(3, new Set());
    // chest-1 sits in column 1. chest-4 is the card immediately below it.
    expect(before[1].map((c) => c.key)).toEqual(["chest-1", "chest-4", "chest-7", "chest-10"]);

    const after = renderBoard(3, new Set(["chest-1"]));
    expect(after[1].map((c) => c.key)).toEqual(["chest-1", "chest-4", "chest-7", "chest-10"]);
    expect(after[1][0].open).toBe(false);
    // The gap closes because the collapsed card is shorter, not because anything
    // was moved: chest-4 is still the next card in that same column.
    expect(after[1][1].key).toBe("chest-4");
  });

  it("does not touch the other columns when one card collapses", () => {
    const before = renderBoard(3, new Set());
    const after = renderBoard(3, new Set(["chest-1"]));

    expect(after[0]).toEqual(before[0]);
    expect(after[2]).toEqual(before[2]);
  });

  it("puts a card's column entirely in the hands of its position", () => {
    keys.forEach((key, i) => {
      const board = layoutOf(renderBoard(3, new Set(["chest-0", "chest-5"])));
      expect(board[columnOf(i, 3)]).toContain(key);
    });
  });
});
