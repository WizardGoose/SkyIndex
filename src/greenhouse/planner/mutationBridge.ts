/**
 * Hypixel ids for greenhouse mutations, so island counts can find them.
 *
 * The island feed is keyed by Hypixel id and the planner is keyed by the site's
 * mutation id, and `src/inventory` bridges the two through an item index's
 * `hypixelId` field. That index is the wiki crafting index, which is built from
 * `Module:Crafting/Data`: it only knows an item at all if some recipe mentions
 * it. Most greenhouse mutations are not crafting ingredients, so most of them
 * were simply missing from it, and a missing bridge reads on screen as "you own
 * none of this" - the exact lie this feature exists to prevent.
 *
 * That was not a hypothetical. It is the Choconut bug: Gloomgourd happened to
 * appear in a recipe and auto-filled correctly at 106, while Choconut did not
 * appear in one and silently showed nothing despite 245 sitting in the player's
 * backpacks. Same data, same code path, different index coverage.
 *
 * `wikiCrafting` now also seeds every item Hypixel categorises as MUTATION,
 * which fixes the coverage at source. This module is the belt to that braces,
 * and it is worth having for two reasons that outlive the original bug:
 *
 *   1. The crafting index is fetched from the network and cached for 24 hours
 *      under a key whose name does not change when the builder changes. A
 *      browser holding yesterday's index gets yesterday's coverage, so a fix at
 *      source does not reach existing players for up to a day.
 *   2. The index can fail to load entirely - the wiki is a third party and the
 *      fetch is best effort. Without a fallback that takes the greenhouse's own
 *      auto-fill down with it, for every mutation at once.
 *
 * This is NOT a second mapping competing with the first. The crafting index
 * always wins where it has an answer; this only fills holes, and
 * `__tests__/mutationBridge.test.ts` pins that precedence so it cannot invert.
 */

/** Hypixel's own id convention, applied to a display name. */
const upperSnake = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .toUpperCase();

/**
 * Merge derived mutation ids into an item index, without ever overriding it.
 *
 * Derived from the mutation's display NAME rather than from its id, because the
 * island's ids follow Hypixel's naming and so does this. The two happen to
 * agree for all 40 mutations in the current dataset (every greenhouse id is
 * already the slug of its name), but if one ever diverged the name is the half
 * that stays correct.
 *
 * A mutation the index already has a `hypixelId` for is left completely alone.
 */
export const withMutationIds = <T extends { hypixelId: string | null }>(
  index: Record<string, T>,
  mutations: readonly { id: string; name: string }[]
): Record<string, { hypixelId: string | null }> => {
  const out: Record<string, { hypixelId: string | null }> = { ...index };

  for (const mutation of mutations) {
    if (!mutation?.id || !mutation.name) continue;
    // The crafting index is authoritative wherever it has an answer.
    if (out[mutation.id]?.hypixelId) continue;

    const derived = upperSnake(mutation.name);
    if (!derived) continue;
    out[mutation.id] = { ...(out[mutation.id] ?? {}), hypixelId: derived };
  }

  return out;
};
