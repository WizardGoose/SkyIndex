import { describe, expect, it } from "vitest";
import { BIOANALYSIS_MULTIPLIER, MUTATION_WEIGHTS } from "../constants";
import { cropSupport, isCropRequirement, isMechanicOnly, spawnChance } from "../spawnChance";

/**
 * The chance derivation is checked against the only two numbers Hypixel staff
 * ever confirmed. Everything else on the wiki's percentage column is an
 * editor's arithmetic, so these two are the whole of the ground truth.
 */

const ASHWREATH = [
  { crop: "nether_wart", count: 2 },
  { crop: "fire", count: 2 },
];

describe("staff-confirmed values", () => {
  /**
   * pikachuflare, July 27 2026: "Ashwreath's Mutation chance is confirmed as
   * 15%. It's 30% chance according to our weights... Since Fire isn't a crop,
   * the chance ... is only supported by the 2 netherwarts ... 30% * 50% = 15%."
   */
  it("derives Ashwreath's 15% from its weight of 30", () => {
    expect(MUTATION_WEIGHTS.value.ashwreath).toBe(30);
    expect(spawnChance("ashwreath", ASHWREATH)).toBeCloseTo(0.15, 12);
  });

  /** Same source: "with the Bioanalysis Artifact buff, it should be 17.25%." */
  it("derives the Bioanalysis Artifact's 17.25%", () => {
    expect(spawnChance("ashwreath", ASHWREATH, { bioanalysis: "artifact" })).toBeCloseTo(0.1725, 12);
  });

  it("treats Bioanalysis as a multiplier, not added percentage points", () => {
    expect(BIOANALYSIS_MULTIPLIER.artifact.value).toBe(1.15);
    // If it were +15 points, Ashwreath would be 30%, not 17.25%.
    expect(spawnChance("ashwreath", ASHWREATH, { bioanalysis: "artifact" })).toBeLessThan(0.2);
  });

  it("applies only the best accessory in the upgrade chain", () => {
    const none = spawnChance("choconut", [{ crop: "cocoa_beans", count: 2 }]);
    expect(spawnChance("choconut", [{ crop: "cocoa_beans", count: 2 }], { bioanalysis: "talisman" })).toBeCloseTo(none * 1.05, 12);
    expect(spawnChance("choconut", [{ crop: "cocoa_beans", count: 2 }], { bioanalysis: "ring" })).toBeCloseTo(none * 1.1, 12);
  });
});

describe("crop support", () => {
  it("counts Fire as the only non-crop", () => {
    expect(isCropRequirement("fire")).toBe(false);
    // Staff: "fermento and dead plants are indeed crops".
    expect(isCropRequirement("fermento")).toBe(true);
    expect(isCropRequirement("dead_plant")).toBe(true);
    expect(isCropRequirement("cocoa_beans")).toBe(true);
  });

  it("scales Ashwreath to half under both candidate rules", () => {
    // The two rules agree here, which is exactly why the data cannot separate them.
    expect(cropSupport(ASHWREATH, "share")).toBeCloseTo(0.5, 12);
    expect(cropSupport(ASHWREATH, "quarter")).toBeCloseTo(0.5, 12);
  });

  it("separates the two rules on a two-crop layout", () => {
    const choconut = [{ crop: "cocoa_beans", count: 2 }];
    expect(cropSupport(choconut, "share")).toBeCloseTo(1, 12);
    expect(cropSupport(choconut, "quarter")).toBeCloseTo(0.5, 12);
    // The factor of two that a single playtest would settle.
    expect(spawnChance("choconut", choconut, { supportRule: "share" })).toBeCloseTo(0.3, 12);
    expect(spawnChance("choconut", choconut, { supportRule: "quarter" })).toBeCloseTo(0.15, 12);
  });

  it("does not scale down a mutation with no spreading conditions", () => {
    expect(cropSupport([])).toBe(1);
    expect(spawnChance("lonelily", [])).toBeCloseTo(0.06, 12);
    expect(spawnChance("godseed", [])).toBeCloseTo(0.05, 12);
  });
});

describe("weight-zero mutations", () => {
  it("reports zero chance for the mechanic-only pair", () => {
    for (const id of ["shellfruit", "jerryflower"]) {
      expect(MUTATION_WEIGHTS.value[id]).toBe(0);
      expect(spawnChance(id, [])).toBe(0);
      expect(isMechanicOnly(id)).toBe(true);
    }
  });

  it("does not flag a normal mutation as mechanic-only", () => {
    expect(isMechanicOnly("choconut")).toBe(false);
    expect(isMechanicOnly("godseed")).toBe(false);
  });

  it("returns zero for an unknown id rather than guessing", () => {
    expect(spawnChance("not_a_mutation", [])).toBe(0);
  });
});

describe("the weight table", () => {
  it("covers all 40 mutations", () => {
    expect(Object.keys(MUTATION_WEIGHTS.value)).toHaveLength(40);
  });

  it("holds only the weights the staff leak listed", () => {
    for (const w of Object.values(MUTATION_WEIGHTS.value)) expect([0, 5, 6, 20, 25, 30]).toContain(w);
  });

  it("never produces a chance outside [0, 1]", () => {
    for (const id of Object.keys(MUTATION_WEIGHTS.value)) {
      const p = spawnChance(id, [{ crop: "wheat", count: 4 }], { bioanalysis: "artifact" });
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });
});
