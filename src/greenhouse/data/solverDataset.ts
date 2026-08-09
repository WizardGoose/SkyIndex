import type { CropDefinition, MutationDefinition } from "../types/greenhouse";
import type { SolverDataset } from "../solver";
import type { GreenhouseDataJSON } from "./datasetStore";

/**
 * Raw `data.json` shape to the record shape the solver wants, in one place.
 *
 * The app reaches the solver by a longer road: `datasetStore.buildLists` turns
 * the file into the two ARRAYS the pages render from, and
 * `greenhouseService.solverDataset` turns those arrays back into records keyed
 * by id. That road is fine for the app - the arrays are what React renders -
 * but it runs through a React store that adopts localStorage at import time,
 * so a Node build script cannot walk it.
 *
 * This module is the same conversion with nothing else attached: no React, no
 * storage, no fetch. `tools/build-solver-precompute.mjs` uses it to build the
 * dataset it solves against, and a test pins that what it produces agrees, in
 * every field the solver actually reads, with what the running app hands the
 * solver. If the two ever drift, that test fails rather than the precompute
 * quietly never applying.
 *
 * Field-for-field this mirrors `buildLists`, including the two places it is
 * asymmetric, because a "tidier" version here would be a different dataset:
 *
 *   growth_stages   a mutation carries `?? 0` (MutationDefinition types it as a
 *                   number) but the SAME mutation re-listed as a crop keeps the
 *                   raw nullable value (CropDefinition allows null)
 *   decay           passed straight through, never defaulted. A stated 0 means
 *                   "never rots"; an absent field means nobody said
 */

/**
 * Every mutation appears twice on purpose: once as a mutation, and once as a
 * crop, because a mutation can be planted as an ingredient for a higher tier.
 * That duplication is load bearing for the designer palette, and it is also the
 * reason `dataset.crops` holds 57 keys for a file with 17 crops in it.
 */
export const toSolverDataset = (raw: GreenhouseDataJSON): SolverDataset => {
  const crops: Record<string, CropDefinition> = {};
  const mutations: Record<string, MutationDefinition> = {};

  for (const [id, crop] of Object.entries(raw.crops)) {
    crops[id] = {
      id,
      name: crop.name,
      size: crop.size,
      priority: 0,
      ground: crop.ground,
      growth_stages: crop.growth_stages,
      positive_buffs: crop.positive_buffs,
      negative_buffs: crop.negative_buffs,
      isMutation: false,
    };
  }

  for (const [id, mutation] of Object.entries(raw.mutations)) {
    mutations[id] = {
      id,
      name: mutation.name,
      size: mutation.size,
      ground: mutation.ground,
      requirements: mutation.requirements,
      special: mutation.special,
      rarity: mutation.rarity,
      growth_stages: mutation.growth_stages ?? 0,
      decay: mutation.decay,
      positive_buffs: mutation.positive_buffs,
      negative_buffs: mutation.negative_buffs,
      drops: mutation.drops,
    };

    crops[id] = {
      id,
      name: mutation.name,
      size: mutation.size,
      priority: 0,
      ground: mutation.ground,
      growth_stages: mutation.growth_stages,
      positive_buffs: mutation.positive_buffs,
      negative_buffs: mutation.negative_buffs,
      isMutation: true,
    };
  }

  return { crops, mutations };
};
