import { useEffect, useMemo, useState } from "react";
import { loadGreenhouseData } from "../greenhouse/services/greenhouseDataService";
import { useTargetCatalogue } from "../greenhouse/planner/useTargetCatalogue";
import { buildSearchIndex } from "./searchIndex";
import type { SearchEntry } from "./types";

/**
 * The React half of the search: fetch the five sources, hand them to the pure
 * builder, hold the result.
 *
 * Everything here is a read. Nothing in this file writes to localStorage, and
 * nothing it calls does either. `useTargetCatalogue` caches its own two wiki
 * lookups under a key it owns and has owned since before this page existed;
 * this hook adds no keys of its own.
 *
 * Cost, since this runs on the site's front door:
 *   greenhouse data.json   33 KB, static, cached by the service after one load
 *   fusion-properties.json 47 KB, static
 *   crafting index         fetched by useTargetCatalogue, served from its own
 *                          localStorage cache on every visit after the first
 * The two static files are fetched once per page load and never again. The
 * crafting index is the same fetch the Items page and the Planner already make,
 * so on a warm cache the landing page costs nothing extra at all.
 *
 * Failure is not an error state here. If a source does not arrive, its rows are
 * simply absent from the index and everything else still searches. A universal
 * search that shows an error banner because the shard table timed out would be
 * worse than one that quietly finds fewer things.
 */

interface MutationRow {
  id: string;
  name: string;
  rarity: string | null;
}

interface ShardRow {
  key: string;
  name: string;
  rarity: string | null;
}

/** The shape of one row of `public/fusion-properties.json`. */
interface ShardProperty {
  name?: string;
  rarity?: string;
}

export interface SiteIndex {
  index: SearchEntry[];
  /** True until every source has either landed or failed. Drives the mark. */
  loading: boolean;
}

export const useSiteIndex = (): SiteIndex => {
  const [mutations, setMutations] = useState<MutationRow[] | null>(null);
  const [shards, setShards] = useState<ShardRow[] | null>(null);

  const base = import.meta.env.BASE_URL;

  // ---- greenhouse mutations ---------------------------------------------
  useEffect(() => {
    let live = true;
    loadGreenhouseData()
      .then((data) => {
        if (!live) return;
        setMutations(Object.entries(data.mutations).map(([id, m]) => ({ id, name: m.name, rarity: m.rarity })));
      })
      .catch(() => {
        if (live) setMutations([]);
      });
    return () => {
      live = false;
    };
  }, []);

  // ---- fusion shards -----------------------------------------------------
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${base}fusion-properties.json`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json: Record<string, ShardProperty>) => {
        setShards(
          Object.entries(json)
            .filter(([, s]) => Boolean(s?.name))
            .map(([key, s]) => ({ key, name: s.name as string, rarity: s.rarity ?? null }))
        );
      })
      .catch(() => {
        if (!controller.signal.aborted) setShards([]);
      });
    return () => controller.abort();
  }, [base]);

  /*
   * Targets need the mutation ids to exist first, which is why this is not
   * started in parallel with the fetch above. The hook is a no-op until the
   * list is non-empty and recomputes the moment it is not.
   */
  const mutationIds = useMemo(() => (mutations ?? []).map((m) => m.id), [mutations]);
  const { targets, items } = useTargetCatalogue(mutationIds);

  const index = useMemo(
    () =>
      buildSearchIndex({
        items: Object.entries(items).map(([id, it]) => ({ id, name: it.name, tier: it.tier })),
        mutations: mutations ?? [],
        targets: targets.map((t) => ({ id: t.id, name: t.name })),
        shards: shards ?? [],
        assetBase: base,
      }),
    [items, mutations, targets, shards, base]
  );

  /*
   * "Still arriving", not "broken". A source that failed sets itself to an
   * empty array rather than staying null, so this settles either way and the
   * mark's thinking cadence always resolves.
   */
  const loading = mutations === null || shards === null || Object.keys(items).length === 0;

  return { index, loading };
};
