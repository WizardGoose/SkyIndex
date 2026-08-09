import { describe, expect, it } from "vitest";
import { barSegments } from "../kit";

/**
 * The two-tone rail.
 *
 * `Bar` used to show one number: how much of the target you had harvested.
 * Against a target of 2,624 Choconut, a player holding 245 of them was told
 * "0%", which is arithmetically defensible and still a lie of omission. Stock
 * in hand is progress, so the rail credits it, and it credits it in a paler
 * tone because owning a thing and having grown it this run are different
 * claims and one bar that made them look identical would just be a tidier lie.
 *
 * The maths lives in `barSegments` rather than inside the component so it can
 * be checked here, with no DOM and no render, which is also why this file is
 * `.ts`: the suite runs in a node environment and mounting React to assert on
 * two percentages would prove nothing the arithmetic does not.
 *
 * What each case is guarding:
 *
 *   Clamping   `owned` is player stock, not a plan figure, and can exceed
 *              `total` by any amount. Unclamped it produced widths past 100%,
 *              which on a rail with no `overflow-hidden` runs off the end.
 *   Zero total A row whose requirement is met elsewhere arrives here with
 *              nothing to divide by. NaN widths render as no bar at all,
 *              which looks exactly like a bar that is legitimately empty, so
 *              the bug would have hidden itself.
 *   Layering   the segments are drawn one over the other, so `donePct` and
 *              `ownedPct` are what the eye sees, and their sum is the fill.
 *              It can reach 100 and must never pass it.
 */

describe("barSegments", () => {
  it("credits owned stock on its own, with no solid segment", () => {
    // The live case: 245 Choconut in hand against a plan that wants 2,624,
    // none of them grown yet. Roughly a tenth of the rail, all of it pale.
    const bar = barSegments(0, 245, 2624);

    expect(bar.donePct).toBe(0);
    expect(bar.ownedPct).toBeCloseTo(9.34, 2);
    expect(bar.fillPct).toBeCloseTo(9.34, 2);
    expect(bar.complete).toBe(false);
  });

  it("behaves exactly as the one-tone bar when nothing is owned", () => {
    // Every existing caller passes no `owned`, so this is the old bar's
    // arithmetic and it has to come out unchanged.
    const bar = barSegments(25, 0, 100);

    expect(bar.donePct).toBe(25);
    expect(bar.ownedPct).toBe(0);
    expect(bar.fillPct).toBe(25);
    expect(bar.complete).toBe(false);
  });

  it("stacks harvested on top of owned in one rail", () => {
    const bar = barSegments(30, 20, 100);

    expect(bar.donePct).toBe(30);
    expect(bar.ownedPct).toBe(20);
    expect(bar.fillPct).toBe(50);
    expect(bar.complete).toBe(false);
  });

  it("clamps when owned alone exceeds the total", () => {
    // Owning 5,000 of something a plan wants 100 of is a normal state, not an
    // error, and it fills the rail rather than overflowing it.
    const bar = barSegments(0, 5000, 100);

    expect(bar.donePct).toBe(0);
    expect(bar.ownedPct).toBe(100);
    expect(bar.fillPct).toBe(100);
    expect(bar.complete).toBe(true);
  });

  it("clamps when owned and harvested together exceed the total", () => {
    const bar = barSegments(80, 80, 100);

    expect(bar.donePct).toBe(80);
    expect(bar.ownedPct).toBe(20);
    expect(bar.fillPct).toBe(100);
    expect(bar.complete).toBe(true);
  });

  it("clamps the solid segment on its own too", () => {
    const bar = barSegments(500, 0, 100);

    expect(bar.donePct).toBe(100);
    expect(bar.ownedPct).toBe(0);
    expect(bar.fillPct).toBe(100);
  });

  it("returns an empty rail for a total of zero rather than dividing by it", () => {
    for (const bar of [barSegments(0, 0, 0), barSegments(5, 5, 0)]) {
      expect(bar.donePct).toBe(0);
      expect(bar.ownedPct).toBe(0);
      expect(bar.fillPct).toBe(0);
      expect(bar.complete).toBe(false);
      expect(Number.isNaN(bar.fillPct)).toBe(false);
    }
  });

  it("never lets the two segments sum past 100", () => {
    const cases: ReadonlyArray<[number, number, number]> = [
      [0, 0, 0],
      [0, 245, 2624],
      [1, 0, 3],
      [30, 20, 100],
      [99, 2, 100],
      [100, 100, 100],
      [5000, 5000, 1],
      [0, 1, 1],
      [702, 106, 702],
      [-5, -5, 100],
    ];

    for (const [done, owned, total] of cases) {
      const bar = barSegments(done, owned, total);
      expect(bar.donePct + bar.ownedPct).toBeLessThanOrEqual(100);
      expect(bar.donePct + bar.ownedPct).toBeCloseTo(bar.fillPct, 10);
      expect(bar.donePct).toBeGreaterThanOrEqual(0);
      expect(bar.ownedPct).toBeGreaterThanOrEqual(0);
      // The solid segment is drawn over the pale one, so it can never be the
      // longer of the two or it would paint outside the fill.
      expect(bar.donePct).toBeLessThanOrEqual(bar.fillPct);
    }
  });

  it("treats nonsense quantities as none rather than propagating them", () => {
    // Negative and non-finite inputs are not amounts of anything. They reach
    // here from arithmetic upstream, and a NaN width silently renders nothing.
    expect(barSegments(-10, 0, 100).donePct).toBe(0);
    expect(barSegments(0, -10, 100).ownedPct).toBe(0);
    expect(barSegments(Number.NaN, 10, 100).fillPct).toBe(10);
    expect(barSegments(10, Number.POSITIVE_INFINITY, 100).fillPct).toBe(10);
    expect(barSegments(10, 0, Number.NaN).fillPct).toBe(0);
  });

  it("marks a rail complete however it was filled", () => {
    expect(barSegments(100, 0, 100).complete).toBe(true);
    expect(barSegments(0, 100, 100).complete).toBe(true);
    expect(barSegments(60, 40, 100).complete).toBe(true);
    expect(barSegments(99, 0, 100).complete).toBe(false);
    expect(barSegments(60, 39, 100).complete).toBe(false);
  });
});
