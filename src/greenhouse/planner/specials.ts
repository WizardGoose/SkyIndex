import type { MutationDefinition } from "../types/greenhouse";

/**
 * Special-cased mutations.
 *
 * Four mutations carry an empty `requirements` array in the dataset, which is
 * NOT the same as "free". Each has a `special` marker and prose in
 * `growing_info` describing a mechanic the adjacency model cannot express.
 * Treating them as zero-cost put an epic (Shellfruit) in cycle 1 alongside the
 * commons, which is nonsense - it needs an epic and a rare of its own.
 *
 * Everything here is derived from the dataset's own `special` / `growing_info`
 * text, quoted in `note` so the reasoning is auditable rather than invented.
 */

export type SpecialKind =
  /** Genuinely needs no crops - spawns on bare soil. */
  | "free"
  /** Real dependencies exist but are expressed as a mechanic, not adjacency. */
  | "mechanic"
  /** Cannot be produced by arranging a greenhouse plot at all. */
  | "unplannable";

export interface SpecialRule {
  kind: SpecialKind;
  /** Dependencies the adjacency data omits. Empty for isolation/unplannable. */
  requires: { crop: string; count: number }[];
  /** Short label for the UI. */
  label: string;
  /** Verbatim explanation, so the player can check our interpretation. */
  note: string;
  /** True when the planner cannot schedule this and must hand it to the player. */
  excludeFromCycles: boolean;
}

export const SPECIALS: Record<string, SpecialRule> = {
  lonelily: {
    kind: "free",
    requires: [],
    label: "No crops needed",
    note: "Marked `requires_zero_adjacent`. It needs zero adjacent crops, so it spawns on bare soil with nothing planted around it. The greenhouse solver confirms this by filling a whole plot with 100 Lonelily and no crops at all.",
    excludeFromCycles: false,
  },

  shellfruit: {
    kind: "mechanic",
    // "Turtlellini must be exploded TWICE by Blastberry to make a Shellfruit."
    // One Turtlellini is the body; two Blastberry explosions are needed. A
    // Blastberry explodes once when it decays, so two are budgeted.
    requires: [
      { crop: "turtlellini", count: 1 },
      { crop: "blastberry", count: 2 },
    ],
    label: "Explosion mechanic",
    note: "Turtlellini must be exploded TWICE by Blastberry to make a Shellfruit. Budgeted as 1 Turtlellini + 2 Blastberry, since a Blastberry explodes once when it decays. If you can re-prime one Blastberry instead, the real cost is lower.",
    excludeFromCycles: false,
  },

  godseed: {
    kind: "mechanic",
    requires: [],
    label: "Spreads from positive effects",
    note: "Spreads like a weed from an adjacent crop carrying all of the positive effects into a large enough open area. There is no fixed crop pattern, so the planner cannot schedule it. Grow it opportunistically.",
    excludeFromCycles: true,
  },

  jerryflower: {
    kind: "unplannable",
    requires: [],
    label: "Quest chain",
    note: "Requires an Unfulfilled Jerryseed from a Jerry Visitor, taken to Xalx with a Mysterious Crop, reforged to Dirty Unripe Jerryseed, given to Dirt in the Dwarven Mines, then fed 10x Move Jerry at Stage 5. Nothing to do with plot layout.",
    excludeFromCycles: true,
  },
};

export const specialFor = (id: string): SpecialRule | undefined => SPECIALS[id];

export const isUnplannable = (id: string): boolean => Boolean(SPECIALS[id]?.excludeFromCycles);

/** True when this mutation spawns on bare soil with no crops required. */
export const needsNoCrops = (id: string): boolean => SPECIALS[id]?.kind === "free";

/**
 * The effective requirements of a mutation: its adjacency data, plus any
 * dependencies that only exist as a described mechanic.
 */
export const effectiveRequirements = (mutation: MutationDefinition): { crop: string; count: number }[] => {
  const special = SPECIALS[mutation.id];
  if (!special || special.requires.length === 0) return mutation.requirements;
  return [...mutation.requirements, ...special.requires];
};
