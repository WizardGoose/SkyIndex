import { BIOANALYSIS_MULTIPLIER, CROP_SUPPORT_RULE, MUTATION_WEIGHTS, NON_CROP_REQUIREMENTS } from "./constants";
import { clamp } from "./probability";

/**
 * Per-spot, per-cycle spawn chance.
 *
 * Built from the staff weight table rather than the wiki's percentage column,
 * because the weights are leaked ground truth and the percentages are an
 * editor's arithmetic on top of them. The one staff-confirmed percentage,
 * Ashwreath's 15%, falls out of this as a result rather than being hardcoded,
 * which is the check that the derivation is right.
 *
 *   chance = weight/100  x  cropSupport  x  bioanalysis
 *
 * `cropSupport` is the unresolved part. See CROP_SUPPORT_RULE in constants.ts:
 * staff gave one worked example and two different rules reproduce it. Both are
 * implemented here so the doubt is visible in the code and can be flipped in
 * one place, rather than baked in silently.
 */

/** A spreading-condition entry: how many of what must be adjacent. */
export interface Requirement {
  crop: string;
  count: number;
}

export type BioanalysisTier = "none" | "talisman" | "ring" | "artifact";

export interface ChanceOptions {
  /** Best Bioanalysis accessory held. They upgrade, so only one applies. */
  bioanalysis?: BioanalysisTier;
  /** Override the unresolved support rule, for sensitivity analysis. */
  supportRule?: "share" | "quarter";
}

/** Denominator for the "quarter" rule: crops touching a spot are worth 25% each. */
const QUARTER_DENOMINATOR = 4;

/** True when a requirement is a crop for the purposes of chance scaling. */
export const isCropRequirement = (crop: string): boolean => !NON_CROP_REQUIREMENTS.value.includes(crop);

/**
 * The fraction of a mutation's spawn weight its layout actually supports.
 *
 * Requirements that are not crops (Fire, and only Fire in the current data)
 * contribute nothing, which is why Ashwreath rolls at half its weight.
 */
export const cropSupport = (requirements: Requirement[], rule: "share" | "quarter" = CROP_SUPPORT_RULE.value): number => {
  const total = requirements.reduce((sum, r) => sum + r.count, 0);
  const cropped = requirements.filter((r) => isCropRequirement(r.crop)).reduce((sum, r) => sum + r.count, 0);

  // No spreading conditions at all: nothing to scale down. Lonelily spawns on
  // bare soil and its 6% weight is already the whole story.
  if (total === 0) return 1;

  return rule === "quarter" ? clamp(cropped / QUARTER_DENOMINATOR, 0, 1) : cropped / total;
};

/**
 * Per-spot, per-cycle spawn probability in [0, 1].
 *
 * Returns 0 for weight-0 mutations (Jerryflower, Shellfruit). Those are never
 * rolled for - they only exist through a special mechanic - so a 0 here is a
 * correct statement about spawning, not missing data. Callers must route them
 * through their mechanic instead of asking this function for a time.
 */
export const spawnChance = (mutationId: string, requirements: Requirement[], options: ChanceOptions = {}): number => {
  const weight = MUTATION_WEIGHTS.value[mutationId];
  if (weight === undefined || weight <= 0) return 0;

  const support = cropSupport(requirements, options.supportRule ?? CROP_SUPPORT_RULE.value);
  const buff = BIOANALYSIS_MULTIPLIER[options.bioanalysis ?? "none"].value;

  return clamp((weight / 100) * support * buff, 0, 1);
};

/** True when a mutation never spawns by chance and needs its own mechanic. */
export const isMechanicOnly = (mutationId: string): boolean => (MUTATION_WEIGHTS.value[mutationId] ?? 0) <= 0;
