import { describe, it, expect, beforeEach } from "vitest";
import {
  currentGreenhouseStats,
  setApiBioanalysis,
  setManualGreenhouseStats,
} from "../profileStats";

/**
 * The Bioanalysis seam.
 *
 * Kept in its own file rather than appended to `profileStats.test.ts` for a
 * practical reason: this module's store is module-level state, so a suite that
 * touches it has to be deliberate about the order it runs in, and interleaving
 * these cases with the pure parser tests already in that file would couple two
 * suites that have no reason to know about each other.
 *
 * What is worth pinning down here is not the arithmetic, which is trivial. It
 * is the three claims the rest of the greenhouse code depends on:
 *
 *   1. a rank read off the accessory bag surfaces as `source: "api"`, so the
 *      settings panel shows the same provenance chip it shows for Growth Speed
 *   2. a number the player typed still beats it, because the precedence rule
 *      was extended rather than forked
 *   3. `null` and `0` stay different claims all the way through
 */
describe("setApiBioanalysis", () => {
  beforeEach(() => {
    // Withdraw both halves so each case starts from "nobody has said".
    setApiBioanalysis(null);
    setManualGreenhouseStats({});
  });

  it("surfaces a bag reading as an API-sourced stat", () => {
    setApiBioanalysis(3);
    expect(currentGreenhouseStats().bioanalysis).toEqual({ value: 3, source: "api" });
  });

  it("treats a read bag holding none as a real zero, not as silence", () => {
    setApiBioanalysis(0);
    // The distinction this whole module is built around. Zero is an answer.
    expect(currentGreenhouseStats().bioanalysis).toEqual({ value: 0, source: "api" });
  });

  it("treats an unreadable bag as silence, not as zero", () => {
    setApiBioanalysis(null);
    expect(currentGreenhouseStats().bioanalysis).toBeNull();
  });

  it("lets a number the player typed win, without forking the precedence rule", () => {
    setApiBioanalysis(1);
    setManualGreenhouseStats({ bioanalysis: 3 });
    expect(currentGreenhouseStats().bioanalysis).toEqual({ value: 3, source: "manual" });
  });

  it("shows the bag reading again once the override is withdrawn", () => {
    setApiBioanalysis(2);
    setManualGreenhouseStats({ bioanalysis: 0 });
    expect(currentGreenhouseStats().bioanalysis).toEqual({ value: 0, source: "manual" });

    setManualGreenhouseStats({});
    expect(currentGreenhouseStats().bioanalysis).toEqual({ value: 2, source: "api" });
  });

  it("declines a rank outside the three known accessories", () => {
    // There is no Bioanalysis relic, so rank 4 means the caller is not holding
    // what we think it is. Declining beats rendering a confident wrong number.
    for (const bad of [4, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      setApiBioanalysis(2);
      setApiBioanalysis(bad);
      expect(currentGreenhouseStats().bioanalysis).toBeNull();
    }
  });

  it("leaves the other greenhouse stats alone", () => {
    setApiBioanalysis(3);
    const stats = currentGreenhouseStats();
    // Growth Speed is the garden endpoint's business and no bag reading may
    // invent one, so with no pull behind us it stays null.
    expect(stats.growthSpeedTier).toBeNull();
    expect(stats.cropGrowth).toBeNull();
    expect(stats.plots).toBeNull();
  });
});
