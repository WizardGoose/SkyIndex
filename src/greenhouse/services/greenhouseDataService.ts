// =============================================================================
// Greenhouse Data Service
// =============================================================================
// Lookup helpers over the greenhouse dataset, for the code that is not a React
// component: the site search index, the info modal's id resolution, and so on.
//
// This file used to be a second loader. It fetched `public/greenhouse/data.json`
// over the network, cached it in a module-level variable, and served the
// BUNDLED values from that cache - which meant everything reading through here
// was looking at a dataset the wiki overlay had never touched, while the
// greenhouse pages were looking at one it had. The site search could therefore
// list a mutation's old rarity while the page for that mutation showed the new
// one, and nothing on screen explained the difference.
//
// `data/datasetStore` owns the assembly now, so this is a thin adapter over it:
// one dataset, one overlay, one answer. The exported API is unchanged, down to
// `loadGreenhouseData` still returning a promise, because `search/useSiteIndex`
// and `context/InfoModalContext` call it exactly as they always did.
//
// The fetch is gone with the loader. The store imports the same file
// statically, so the data is present before anyone asks for it and there is
// nothing left to await - which also retires the base-path bug that made this
// fetch 404 on the GitHub Pages deploy.

import { datasetReady, getDataset } from "../data/datasetStore";

// The shape of data.json is declared once, beside the store that parses it.
// Re-exported here under the original names so every existing `import type`
// against this module keeps resolving.
export type {
  EffectDefinition,
  CropDataJSON,
  MutationRequirementJSON,
  MutationDataJSON,
  GreenhouseDataJSON,
} from "../data/datasetStore";

import type { CropDataJSON, MutationDataJSON, EffectDefinition, GreenhouseDataJSON } from "../data/datasetStore";

// =============================================================================
// Data Loading Functions
// =============================================================================

/**
 * Load the greenhouse data.
 *
 * Resolves immediately: the store holds the bundled file from module load and
 * layers the wiki overlay on top as it arrives. Asking here also kicks the
 * background refresh, so a caller that is not a mounted component still gets
 * the same freshening a page would.
 */
export async function loadGreenhouseData(): Promise<GreenhouseDataJSON> {
  return datasetReady();
}

/**
 * Get crop data by ID.
 * Returns undefined if the crop doesn't exist.
 */
export function getCropData(cropId: string): (CropDataJSON & { id: string }) | undefined {
  const crop = getDataset().raw.crops[cropId];
  if (!crop) return undefined;

  return { ...crop, id: cropId };
}

/**
 * Get mutation data by ID.
 * Returns undefined if the mutation doesn't exist.
 */
export function getMutationData(mutationId: string): (MutationDataJSON & { id: string }) | undefined {
  const mutation = getDataset().raw.mutations[mutationId];
  if (!mutation) return undefined;

  return { ...mutation, id: mutationId };
}

/**
 * Get effect definition by ID.
 * Returns undefined if the effect doesn't exist.
 */
export function getEffectData(effectId: string): EffectDefinition | undefined {
  return getDataset().raw.effects[effectId];
}

/**
 * Get all crops.
 */
export function getAllCrops(): (CropDataJSON & { id: string })[] {
  return Object.entries(getDataset().raw.crops).map(([id, crop]) => ({
    ...crop,
    id,
  }));
}

/**
 * Get all mutations.
 */
export function getAllMutations(): (MutationDataJSON & { id: string })[] {
  return Object.entries(getDataset().raw.mutations).map(([id, mutation]) => ({
    ...mutation,
    id,
  }));
}

/**
 * Get all effects.
 */
export function getAllEffects(): (EffectDefinition & { id: string })[] {
  return Object.entries(getDataset().raw.effects).map(([id, effect]) => ({
    ...effect,
    id,
  }));
}

/**
 * Check if data is loaded.
 *
 * Always true. The dataset is a static import, so there is no state in which
 * this module has nothing to answer with. Kept because callers gate on it.
 */
export function isDataLoaded(): boolean {
  return true;
}

/**
 * Get the raw data (for advanced use cases).
 */
export function getRawData(): GreenhouseDataJSON | null {
  return getDataset().raw;
}

/**
 * Look up an item by ID - checks both crops and mutations.
 * Returns the item with a type indicator.
 */
export function getItemData(itemId: string):
  | { type: "crop"; data: CropDataJSON & { id: string } }
  | { type: "mutation"; data: MutationDataJSON & { id: string } }
  | undefined {
  const crop = getCropData(itemId);
  if (crop) {
    return { type: "crop", data: crop };
  }

  const mutation = getMutationData(itemId);
  if (mutation) {
    return { type: "mutation", data: mutation };
  }

  return undefined;
}
