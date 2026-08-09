import { describe, expect, it } from "vitest";
import { datasetFingerprint, solverDatasetFingerprint, solverRelevantDataset } from "../cacheKey";
import { toSolverDataset } from "../../data/solverDataset";
import { solverDataset } from "../../services/greenhouseService";
import { getDataset } from "../../data/datasetStore";
import type { CropDefinition, MutationDefinition } from "../../types/greenhouse";
import type { SolverDataset } from "../../solver";

/**
 * The pin on what the solver-scoped fingerprint covers.
 *
 * `solverDatasetFingerprint` is what decides whether a layout that shipped with
 * the build may be handed to a player, so the cost of it being WRONG is not a
 * slow page - it is a plot that looks authoritative and does not work. There is
 * exactly one way it can be wrong in that direction: the solver starts reading
 * a field the fingerprint does not cover, and nobody notices.
 *
 * This file is built so that nobody CAN not notice. Every field on both dataset
 * types is classified below in a `Record<keyof T, ...>`, so adding a field to
 * `MutationDefinition` or `CropDefinition` fails `tsc` here until someone says
 * what it is. Classifying it "solver" then fails at runtime until the projection
 * in `cacheKey.ts` actually includes it, and classifying it "display" fails if
 * it turns out the projection does include it. The two tables and the projection
 * are held against each other from both sides, which is what keeps this from
 * being a test that only restates the implementation.
 */

type FieldRole =
  /** The solver reads it, so it must move the fingerprint. */
  | "solver"
  /** Nothing under `solver/` reads it, so it must NOT move the fingerprint. */
  | "display";

/**
 * Where each classification comes from, so it can be re-derived rather than
 * trusted. Established by reading every use of `dataset.` under `solver/`:
 *
 *   size          compileProblem's block geometry and ringSizeFor, and
 *                 validateSolveResponse checks a reported spawn against it
 *   requirements  the palette, reqSum, fullRing, reqSlotOfCrop. It is
 *                 ORDER sensitive - see the test below
 *   special       isZeroAdjacent, which is the lonelily rule
 *
 * Everything else is genuinely unread. Two are worth stating explicitly because
 * they look like they should matter:
 *
 *   ground        the solver does not model soil compatibility at all. If it
 *                 ever starts to, this entry moves to "solver" and the
 *                 projection has to grow to match
 *   id            the solver addresses a mutation by its RECORD KEY and never
 *                 reads the inner `id` field (see the comment on
 *                 `isZeroAdjacent` in problem.ts). The key set is covered
 *                 separately, by a test below
 */
const MUTATION_FIELDS: Record<keyof MutationDefinition, FieldRole> = {
  id: "display",
  name: "display",
  size: "solver",
  ground: "display",
  // The full surface list (Lonelily grows on Farmland AND Dirt). Same story
  // as `ground` directly above: the solver does not model soil at all, so the
  // list is display data and must not move the shipped precompute.
  grounds: "display",
  requirements: "solver",
  special: "solver",
  rarity: "display",
  growth_stages: "display",
  decay: "display",
  positive_buffs: "display",
  negative_buffs: "display",
  drops: "display",
};

/**
 * Every crop field is "display".
 *
 * `compileProblem` asks `dataset.crops[lock.name] === undefined` to tell a
 * locked crop from a locked mutation, and that is the only time it looks at
 * `crops` at all. Existence is the entire question, so the id SET is the entire
 * answer and nothing inside an entry matters. The id set is pinned separately.
 */
const CROP_FIELDS: Record<keyof CropDefinition, FieldRole> = {
  id: "display",
  name: "display",
  size: "display",
  priority: "display",
  ground: "display",
  grounds: "display",
  growth_stages: "display",
  positive_buffs: "display",
  negative_buffs: "display",
  isMutation: "display",
};

/**
 * A different value for every field, so "the fingerprint did not move" can
 * never be true merely because nothing was actually changed. Each test asserts
 * the nudge landed before it asserts what the fingerprint did about it.
 */
const MUTATION_NUDGE: Record<keyof MutationDefinition, unknown> = {
  id: "not_gloomgourd",
  name: "Gloom Gourd Renamed",
  size: 3,
  ground: "soul_sand",
  grounds: ["soul_sand", "dirt"],
  requirements: [{ crop: "carrot", count: 5 }],
  special: "requires_zero_adjacent",
  rarity: "legendary",
  growth_stages: 9,
  decay: 7,
  positive_buffs: ["something"],
  negative_buffs: ["something else"],
  drops: { gloomgourd: 4 },
};

const CROP_NUDGE: Record<keyof CropDefinition, unknown> = {
  id: "not_carrot",
  name: "Carrot Renamed",
  size: 2,
  priority: 5,
  ground: "mycelium",
  grounds: ["mycelium", "dirt"],
  growth_stages: 8,
  positive_buffs: ["something"],
  negative_buffs: ["something else"],
  isMutation: true,
};

const mutation = (id: string, over: Partial<MutationDefinition> = {}): MutationDefinition => ({
  id,
  name: id,
  size: 2,
  ground: "farmland",
  requirements: [{ crop: "carrot", count: 4 }],
  special: "none",
  rarity: "rare",
  growth_stages: 3,
  decay: 3,
  positive_buffs: [],
  negative_buffs: [],
  drops: { [id]: 1 },
  ...over,
});

const crop = (id: string, over: Partial<CropDefinition> = {}): CropDefinition => ({
  id,
  name: id,
  size: 1,
  priority: 0,
  ground: "farmland",
  growth_stages: 4,
  positive_buffs: [],
  negative_buffs: [],
  isMutation: false,
  ...over,
});

const base = (): SolverDataset => ({
  mutations: { gloomgourd: mutation("gloomgourd"), noctilume: mutation("noctilume", { size: 1 }) },
  crops: { carrot: crop("carrot"), pumpkin: crop("pumpkin") },
});

const withMutationField = (field: string, value: unknown): SolverDataset => {
  const dataset = base();
  dataset.mutations.gloomgourd = {
    ...dataset.mutations.gloomgourd,
    [field]: value,
  } as MutationDefinition;
  return dataset;
};

const withCropField = (field: string, value: unknown): SolverDataset => {
  const dataset = base();
  dataset.crops.carrot = { ...dataset.crops.carrot, [field]: value } as CropDefinition;
  return dataset;
};

describe("solverDatasetFingerprint covers every field the solver reads", () => {
  for (const [field, role] of Object.entries(MUTATION_FIELDS)) {
    it(`mutation.${field} is ${role === "solver" ? "covered" : "ignored"}`, () => {
      const before = base();
      const after = withMutationField(field, MUTATION_NUDGE[field as keyof MutationDefinition]);

      // Anti-tautology: prove the nudge actually changed the dataset first, so
      // a "did not move" result cannot come from having changed nothing.
      expect(after.mutations.gloomgourd[field as keyof MutationDefinition]).not.toEqual(
        before.mutations.gloomgourd[field as keyof MutationDefinition]
      );

      const moved = solverDatasetFingerprint(after) !== solverDatasetFingerprint(before);
      expect(moved).toBe(role === "solver");
    });
  }

  for (const [field, role] of Object.entries(CROP_FIELDS)) {
    it(`crop.${field} is ${role === "solver" ? "covered" : "ignored"}`, () => {
      const before = base();
      const after = withCropField(field, CROP_NUDGE[field as keyof CropDefinition]);

      expect(after.crops.carrot[field as keyof CropDefinition]).not.toEqual(
        before.crops.carrot[field as keyof CropDefinition]
      );

      const moved = solverDatasetFingerprint(after) !== solverDatasetFingerprint(before);
      expect(moved).toBe(role === "solver");
    });
  }

  it("projects exactly the fields classified as solver-relevant, and no others", () => {
    /*
     * The other direction of the pin. The loops above prove each classified
     * field behaves as classified; this proves the projection is not carrying
     * something nobody classified, which would make the classification table a
     * comfortable fiction.
     */
    const expected = Object.entries(MUTATION_FIELDS)
      .filter(([, role]) => role === "solver")
      .map(([field]) => field)
      .sort();

    const projected = solverRelevantDataset(base());
    expect(Object.keys(projected.mutations.gloomgourd).sort()).toEqual(expected);

    // Crops are reduced to their ids, so no crop field can leak in at all.
    expect(projected.crops).toEqual(["carrot", "pumpkin"]);
  });
});

describe("solverDatasetFingerprint and the shape of the dataset", () => {
  it("moves when a mutation is added or removed, because the id set is the identity", () => {
    const before = base();
    const added: SolverDataset = {
      ...before,
      mutations: { ...before.mutations, veilshroom: mutation("veilshroom") },
    };
    expect(solverDatasetFingerprint(added)).not.toBe(solverDatasetFingerprint(before));

    const removed: SolverDataset = { ...before, mutations: { gloomgourd: before.mutations.gloomgourd } };
    expect(solverDatasetFingerprint(removed)).not.toBe(solverDatasetFingerprint(before));
  });

  it("moves when a crop is added or removed, even though no crop FIELD matters", () => {
    // This is the pair to the "every crop field is display" table above: what
    // the solver asks about a crop is whether it exists, so existence is what
    // has to be covered.
    const before = base();
    const added: SolverDataset = { ...before, crops: { ...before.crops, melon: crop("melon") } };
    expect(solverDatasetFingerprint(added)).not.toBe(solverDatasetFingerprint(before));

    const removed: SolverDataset = { ...before, crops: { carrot: before.crops.carrot } };
    expect(solverDatasetFingerprint(removed)).not.toBe(solverDatasetFingerprint(before));
  });

  it("moves when requirements are reordered, because the solver is order sensitive", () => {
    /*
     * Not conservatism, a real dependency. `compileProblem` builds the crop
     * palette by walking `requirements` in order, and the relaxed-geometry seed
     * in `solveLocal` reaches for `requirements[0].crop` specifically. Two
     * orderings of the same list can therefore produce different layouts.
     */
    const before: SolverDataset = {
      ...base(),
      mutations: {
        gloomgourd: mutation("gloomgourd", {
          requirements: [
            { crop: "carrot", count: 2 },
            { crop: "pumpkin", count: 2 },
          ],
        }),
      },
    };
    const reordered: SolverDataset = {
      ...base(),
      mutations: {
        gloomgourd: mutation("gloomgourd", {
          requirements: [
            { crop: "pumpkin", count: 2 },
            { crop: "carrot", count: 2 },
          ],
        }),
      },
    };
    expect(solverDatasetFingerprint(reordered)).not.toBe(solverDatasetFingerprint(before));
  });

  it("is stable across key insertion order, so a rebuilt dataset is not a changed one", () => {
    const a: SolverDataset = {
      mutations: { gloomgourd: mutation("gloomgourd"), noctilume: mutation("noctilume", { size: 1 }) },
      crops: { carrot: crop("carrot"), pumpkin: crop("pumpkin") },
    };
    const b: SolverDataset = {
      mutations: { noctilume: mutation("noctilume", { size: 1 }), gloomgourd: mutation("gloomgourd") },
      crops: { pumpkin: crop("pumpkin"), carrot: crop("carrot") },
    };
    expect(solverDatasetFingerprint(b)).toBe(solverDatasetFingerprint(a));
  });

  it("treats an absent special and an explicitly undefined one as the same dataset", () => {
    const absent = base();
    delete (absent.mutations.gloomgourd as Partial<MutationDefinition>).special;
    const explicit = withMutationField("special", undefined);
    expect(solverDatasetFingerprint(explicit)).toBe(solverDatasetFingerprint(absent));
  });

  it("is not the same function as the broad cache fingerprint", () => {
    // If these ever agreed on everything, one of them would be pointless. The
    // broad one is deliberately over-inclusive and guards the LRU cache, where
    // a false alarm costs one re-solve.
    const renamed = withMutationField("name", "Something Else");
    expect(solverDatasetFingerprint(renamed)).toBe(solverDatasetFingerprint(base()));
    expect(datasetFingerprint(renamed)).not.toBe(datasetFingerprint(base()));
  });
});

describe("the app and the build script build the same dataset", () => {
  it("agrees on every solver-relevant field", () => {
    /*
     * The build script cannot walk the app's road to a `SolverDataset`: that
     * road runs through a React store which adopts localStorage at import time.
     * So there are two constructions, and this is what stops them drifting.
     *
     * If they ever disagree, the shipped fingerprint would never match the live
     * one and the precompute would simply stop applying - silently, with no
     * symptom but a slower page. This test is the symptom.
     */
    const fromApp = solverDataset();
    const fromBuildScript = toSolverDataset(getDataset().raw);

    expect(solverDatasetFingerprint(fromBuildScript)).toBe(solverDatasetFingerprint(fromApp));

    // And they agree on the ids themselves, not merely on a hash of them.
    expect(Object.keys(fromBuildScript.mutations).sort()).toEqual(
      Object.keys(fromApp.mutations).sort()
    );
    expect(Object.keys(fromBuildScript.crops).sort()).toEqual(Object.keys(fromApp.crops).sort());
  });
});
