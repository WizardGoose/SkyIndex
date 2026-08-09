import type { RecipeIngredient } from "./useItemData";
import { norm, slug } from "./wikiCrafting";

/**
 * Material chains for items the crafting module does not cover.
 *
 * `Module:Crafting/Data` only holds grid recipes. Enchanted items are not made
 * on a grid, so none of them appear there, which is why a tree used to stop
 * dead at "Enchanted Brown Mushroom Block". Their breakdown lives in the
 * article infobox instead:
 *
 *   |prev_material    = Enchanted Brown Mushroom
 *   |mat_cost_bazaar  = 160 Enchanted Brown Mushroom     <- one step
 *   |raw_materials    = 25600 Brown Mushroom             <- fully expanded
 *
 * We want the ONE STEP version, because the tree recurses and would otherwise
 * double count: 160 Enchanted Brown Mushroom, each of which is 160 Brown
 * Mushroom, is the same 25,600 the wiki quotes. Where the one-step field is
 * missing we fall back to the expanded one, which lands correctly as a leaf.
 *
 * Fetched on demand and batched, so opening one tree costs one request rather
 * than one per item. Nothing is bundled; see `wikiCrafting.ts`.
 */

const API = "https://hypixelskyblock.minecraft.wiki/api.php";
// v2: v1 stored currency as an ingredient ("100000x Coins"). Bumping the key
// re-fetches rather than serving those poisoned entries forever. Only this
// derived cache is dropped; nothing the user entered lives under it.
const CACHE_KEY = "wizardsky.chains.v2";
const STALE_KEYS = ["wizardsky.chains.v1"];
const BATCH = 50;

/** id -> ingredients, or null when the wiki has no chain for it. */
export type ChainIndex = Record<string, RecipeIngredient[] | null>;

const readCache = (): ChainIndex => {
  try {
    for (const k of STALE_KEYS) localStorage.removeItem(k);
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}") as ChainIndex;
  } catch {
    return {};
  }
};

const writeCache = (index: ChainIndex) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(index));
  } catch {
    // Optional cache.
  }
};

/**
 * Currencies are priced, not crafted.
 *
 * Some infoboxes quote a purchase price in the same field as materials, e.g.
 * Atominizer's `mat_cost_bazaar = *100000 Coins`. That parses as cleanly as a
 * real ingredient, so without this guard the tree grows a "Coins" node that no
 * recipe can ever resolve and that shows forever as an unbuyable dead end.
 * Coin cost is already carried by bazaar pricing, so dropping it loses nothing.
 */
const CURRENCY = /^(coins?|bits?|copper|motes?|pelts?|gems?|skyblock xp|experience)$/i;

/**
 * Parse a material field into ingredients.
 *
 * Values look like "160 Enchanted Brown Mushroom", usually carry a leading `*`
 * bullet, and may list several: "*6 Enchanted Red Sand Cube *64 Wither Soul".
 */
const parseMaterials = (value: string): RecipeIngredient[] => {
  const out: RecipeIngredient[] = [];

  for (const part of value.split(/\s*[*\n]\s*/)) {
    const m = part.trim().match(/^([\d,]+)\s*x?\s+(.+?)\s*$/i);
    if (!m) continue;
    const qty = Number(m[1].replace(/,/g, ""));
    const name = m[2].replace(/\[\[|\]\]/g, "").trim();
    if (!qty || !name || CURRENCY.test(name)) continue;
    out.push({ id: slug(name), name, qty });
  }

  return out;
};

const parseInfobox = (wikitext: string): RecipeIngredient[] | null => {
  const field = (key: string) => wikitext.match(new RegExp(`\\|\\s*${key}\\s*=\\s*([^\\n|}]+)`))?.[1]?.trim();

  // One step first. `raw_materials` is already fully expanded, so using it
  // while the tree also recurses would multiply the same cost twice.
  const oneStep = field("mat_cost_bazaar");
  if (oneStep) {
    const parsed = parseMaterials(oneStep);
    if (parsed.length) return parsed;
  }

  const expanded = field("raw_materials");
  if (expanded) {
    const parsed = parseMaterials(expanded);
    if (parsed.length) return parsed;
  }

  return null;
};

/**
 * Fetch chains for the given item names, in batches of 50.
 * Returns only what was newly learned; callers merge it into their index.
 */
export const fetchMaterialChains = async (names: string[], signal?: AbortSignal): Promise<ChainIndex> => {
  const learned: ChainIndex = {};
  if (!names.length) return learned;

  for (let i = 0; i < names.length; i += BATCH) {
    const slice = names.slice(i, i + BATCH);

    const url = `${API}?${new URLSearchParams({
      action: "query",
      titles: slice.join("|"),
      prop: "revisions",
      rvprop: "content",
      rvslots: "main",
      format: "json",
      formatversion: "2",
      origin: "*",
    })}`;

    const res = await fetch(url, { signal });
    if (!res.ok) continue;

    const json = (await res.json()) as {
      query?: { pages?: { title: string; revisions?: { slots?: { main?: { content?: string } } }[] }[] };
    };

    for (const page of json.query?.pages ?? []) {
      const text = page.revisions?.[0]?.slots?.main?.content;
      // Record a null for pages with no chain so we never ask again.
      learned[slug(page.title)] = text ? parseInfobox(text) : null;
    }

    // Anything the API did not echo back at all.
    for (const name of slice) {
      const id = slug(name);
      if (!(id in learned)) learned[id] = null;
    }
  }

  return learned;
};

export const readChainCache = readCache;
export const writeChainCache = writeCache;
export { norm };
