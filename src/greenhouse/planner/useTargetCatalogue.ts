import { useEffect, useMemo, useState } from "react";
import { useRecipes } from "../../items/useItemData";
import { wikiIconUrl, norm, slug } from "../../items/wikiCrafting";

/**
 * Things worth grinding towards that consume greenhouse mutations.
 *
 * Built at runtime rather than shipped. Most targets fall out of the crafting
 * index for free: any recipe with a mutation in its ingredient list is a
 * target. A few notable ones are not crafted on a grid at all, so their
 * ingredient lists are read from their wiki page on demand.
 *
 * Nothing wiki-derived is bundled with the app, which keeps the CC BY-NC-SA
 * share-alike clause off this project. See `items/wikiCrafting.ts`.
 */

const WIKI = "https://hypixelskyblock.minecraft.wiki";

/**
 * Targets the crafting grid does not cover.
 *
 * These are page names, not content. Their ingredient lists are fetched from
 * the wiki when the planner loads.
 *
 * "Ludleth" used to be in this list and is gone because Ludleth is an NPC,
 * not an item: the Rose Dragon is what he sells. The NPC's
 * page carries the same `{{RD|...}}` price rows as the pet he sells, so the
 * ingredient gate alone could not tell the seller from the thing sold and the
 * planner offered a person as something to grow. The Rose Dragon Pet article
 * carries its own price rows, so nothing was lost by dropping the vendor. The
 * `isNpcPage` guard below is the mechanism that keeps the mistake from coming
 * back through a future addition.
 */
const NON_CRAFTED_PAGES = ["Rose Dragon Pet"];

export interface TargetIngredient {
  name: string;
  qty: number;
  mutation: string | null;
  crop: string | null;
}

export interface CatalogueTarget {
  id: string;
  name: string;
  source: "crafting" | "infobox";
  wiki: string;
  ingredients: TargetIngredient[];
}

/** Icons come straight from the wiki, so there is no local icon path. */
export const itemIconPath = (target: CatalogueTarget): string | null => wikiIconUrl(target.name);

/*
 * v3, bumped in the same edit that changed what may be in the payload: a v2
 * cache written before the NPC guard can carry Ludleth for up to a day, and a
 * filter that only runs at fetch time cannot reach into it. New key, old key
 * left alone, per the storage rules.
 */
const CACHE_KEY = "wizardsky.targets.v3";
const TTL = 24 * 60 * 60 * 1000;

/**
 * Is this article about a person rather than a thing?
 *
 * The wiki answers this in its own voice: every page opens with an infobox
 * template whose name states what kind of subject it is. Ludleth's page opens
 * `{{Infobox/Character ...}}`; Rose Dragon Pet's opens `{{Infobox/Pet}}` and
 * `{{Infobox/Item ...}}`. So the classification is read off the template
 * names, not off a list of names to exclude: a page whose every infobox is a
 * character-family one is an NPC article, whatever it is called, and an NPC
 * is not a grind target no matter how many `{{RD|...}}` price rows its shop
 * section carries.
 *
 * A page with no infobox at all is NOT rejected here. Absence says "we could
 * not classify", not "this is a person", and the mutation-ingredient gate in
 * the fetch still stands between such a page and the catalogue.
 */
export const isNpcPage = (wikitext: string): boolean => {
  const kinds = [...wikitext.matchAll(/\{\{\s*Infobox\/([A-Za-z_ ]+)/g)].map(([, k]) => k.trim().toLowerCase());
  if (kinds.length === 0) return false;
  return kinds.every((k) => k === "character" || k === "npc");
};

/** Parse `{{RD|5 Condensed Helianthus}}` rows out of an article's wikitext. */
export const parseInfoboxIngredients = (wikitext: string): { name: string; qty: number }[] => {
  const merged = new Map<string, { name: string; qty: number }>();
  for (const [, qtyRaw, nameRaw] of wikitext.matchAll(/\{\{RD\|\s*([\d,]+)?\s*([^}|]+?)\s*\}\}/g)) {
    const name = nameRaw.trim();
    if (!name) continue;
    const qty = qtyRaw ? Number(qtyRaw.replace(/,/g, "")) : 1;
    const k = norm(name);
    const prev = merged.get(k);
    if (!prev) merged.set(k, { name, qty });
    else prev.qty = Math.max(prev.qty, qty);
  }
  return [...merged.values()];
};

export const useTargetCatalogue = (mutationIds: string[] = []) => {
  const { items, loading: recipesLoading } = useRecipes();
  const [nonCrafted, setNonCrafted] = useState<CatalogueTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mutationSet = useMemo(() => new Set(mutationIds), [mutationIds]);

  // ---- crafted targets, free from the crafting index --------------------
  const crafted = useMemo(() => {
    if (!mutationSet.size) return [];
    const out: CatalogueTarget[] = [];

    for (const [id, it] of Object.entries(items)) {
      if (!it.recipe) continue;
      const usesMutation = it.recipe.some((ing) => mutationSet.has(ing.id));
      if (!usesMutation) continue;

      out.push({
        id,
        name: it.name,
        source: "crafting",
        wiki: `${WIKI}/w/${encodeURIComponent(it.name.replace(/ /g, "_"))}`,
        ingredients: it.recipe.map((ing) => ({
          name: ing.name,
          qty: ing.qty,
          mutation: mutationSet.has(ing.id) ? ing.id : null,
          crop: null,
        })),
      });
    }

    return out;
  }, [items, mutationSet]);

  // ---- the handful that are not crafted on a grid -----------------------
  useEffect(() => {
    if (!mutationSet.size) return;
    const controller = new AbortController();

    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as { at: number; targets: CatalogueTarget[] };
        if (cached.at && Date.now() - cached.at < TTL) {
          setNonCrafted(cached.targets);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Fall through and refetch.
    }

    Promise.all(
      NON_CRAFTED_PAGES.map(async (page): Promise<CatalogueTarget | null> => {
        const url = `${WIKI}/api.php?${new URLSearchParams({
          action: "parse",
          page,
          prop: "wikitext",
          format: "json",
          formatversion: "2",
          origin: "*",
        })}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) return null;
        const json = (await res.json()) as { parse?: { wikitext?: string } };
        const wikitext = json.parse?.wikitext;
        if (!wikitext) return null;

        /*
         * The mechanism, applied where the data enters: a vendor's article
         * never becomes a target, however item-shaped its price list looks.
         */
        if (isNpcPage(wikitext)) return null;

        const ingredients = parseInfoboxIngredients(wikitext).map((ing) => ({
          ...ing,
          mutation: mutationSet.has(slug(ing.name)) ? slug(ing.name) : null,
          crop: null,
        }));

        if (!ingredients.some((i) => i.mutation)) return null;

        return {
          id: slug(page),
          name: page,
          source: "infobox",
          wiki: `${WIKI}/w/${encodeURIComponent(page.replace(/ /g, "_"))}`,
          ingredients,
        };
      })
    )
      .then((results) => {
        if (controller.signal.aborted) return;
        const found = results.filter((r): r is CatalogueTarget => Boolean(r));
        setNonCrafted(found);
        setLoading(false);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), targets: found }));
        } catch {
          // Cache is optional.
        }
      })
      .catch((err: Error) => {
        if (controller.signal.aborted) return;
        setError(err.message);
        setLoading(false);
      });

    return () => controller.abort();
  }, [mutationSet]);

  const targets = useMemo(
    () => [...crafted, ...nonCrafted].sort((a, b) => a.name.localeCompare(b.name)),
    [crafted, nonCrafted]
  );

  /*
   * `items` is handed back rather than kept private because it is the only
   * bridge between a greenhouse mutation id and its Hypixel id, and the planner
   * needs that bridge to read island counts. Calling `useRecipes` a second time
   * up in the page would work, but on a cold cache it is a second fetch of the
   * same few hundred kilobytes for data this hook already has in hand.
   */
  return { targets, items, loading: loading || recipesLoading, error };
};
