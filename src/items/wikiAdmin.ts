import { useSyncExternalStore } from "react";
import { norm } from "./wikiCrafting";

/**
 * Admin-only items, fetched from the wiki at runtime.
 *
 * WHY THIS EXISTS
 * ---------------
 * Admin-only and testing items do not belong in a crafting list; the
 * Artifact of Space sitting in it was the visible case. The wiki already
 * states which items those are: every admin item's article opens with the
 * Admin-only Content banner, and that banner is one template. Fetched raw,
 * the Artifact of Space article begins `{{Admin only}}`, and
 * `Template:Admin only` is the real name behind the banner (its source ends
 * by stamping `[[Category:Admin Only]]` on every page that transcludes it).
 *
 * `api.php?list=embeddedin` over that template names every such page, which
 * is the same authoritative-list trick `wikiShops.ts` plays with
 * `Template:Shop UI`; no item name is hardcoded here. Measured live
 * 2026-08-03: 28 pages embed it, of which 3 are in the crafting index at all
 * (Artifact of Space, Talisman of Space, Grizzly Paw; the rest are things
 * like "Sword of the Universe" that no recipe or resource category ever
 * pulls in). Titles are matched to items by normalised name, exactly, so
 * "Enchanted Clock (Admin)" can never hide the real Enchanted Clock.
 *
 * TESTING ITEMS, WHAT WAS ACTUALLY FOUND
 * --------------------------------------
 * The wiki has no testing category and no testing template (checked:
 * `Template:Test*` and `Category:Test*` are empty; `Template:Unobtainable`
 * exists but covers nine removed-content articles, a different claim). The
 * marking that does exist is Hypixel's own: the item resource carries three
 * items whose ids start `TEST_` ("Test Bucket Please Ignore", "Test Vampire
 * Chestplate", "Test Rift Wand"), and the crafting module's parser already
 * skips recipe keys matching /test item/i. `isTestingItem` below extends
 * both of those existing tests to the index itself; today that catches
 * exactly one indexed item, TEST_BUCKET_PLEASE_IGNORE, which rides in on its
 * ACCESSORY category.
 *
 * Wiki content is CC BY-NC-SA 3.0, so this follows `wikiCrafting.ts`:
 * fetched at runtime, parsed in the browser, nothing bundled.
 */

const WIKI = "https://hypixelskyblock.minecraft.wiki";
const API = `${WIKI}/api.php`;

export const ADMIN_TEMPLATE = "Template:Admin only";

/** New surface, so a new key. Nothing else in this browser is touched. */
export const ADMIN_CACHE_KEY = "wizardsky.adminItems.v1";

/** Admin items change when Hypixel staff invent one, not per page view. */
export const ADMIN_TTL = 24 * 60 * 60 * 1000;

/**
 * Is this item one of Hypixel's own testing items?
 *
 * Two tests, both inherited rather than invented: the /test item/i name rule
 * the crafting parser has always applied to recipe keys, and Hypixel's own
 * `TEST_` id prefix, which is how the resource spells "Test Bucket Please
 * Ignore". Pure, so it costs nothing and tests without a network.
 */
export const isTestingItem = (name: string, hypixelId?: string | null): boolean =>
  /test item/i.test(name) || Boolean(hypixelId && hypixelId.startsWith("TEST_"));

/* ---------------------------------------------------------------- fetching */

/**
 * Every main-namespace page that embeds the admin banner.
 *
 * Capped at a few continuation pages, same as `wikiShops.ts`: the list is 28
 * titles today, and a runaway loop against somebody else's API is not a
 * failure mode worth leaving open.
 */
export const fetchAdminTitles = async (): Promise<string[]> => {
  const titles: string[] = [];
  let cont: string | undefined;

  for (let page = 0; page < 4; page++) {
    const url = `${API}?${new URLSearchParams({
      action: "query",
      list: "embeddedin",
      eititle: ADMIN_TEMPLATE,
      einamespace: "0",
      eilimit: "500",
      format: "json",
      formatversion: "2",
      origin: "*",
      ...(cont ? { eicontinue: cont } : {}),
    })}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`admin list responded ${res.status}`);
    const body = (await res.json()) as {
      query?: { embeddedin?: { title?: string }[] };
      continue?: { eicontinue?: string };
    };

    for (const p of body.query?.embeddedin ?? []) {
      if (p.title) titles.push(p.title);
    }
    cont = body.continue?.eicontinue;
    if (!cont) break;
  }

  if (!titles.length) throw new Error("the wiki listed no admin items");
  return titles;
};

/* ------------------------------------------------------------------ store */

export interface AdminItemsState {
  /** Normalised page titles, for exact-name matching against the index. */
  names: ReadonlySet<string>;
  fetchedAt: number | null;
  loading: boolean;
  error: string | null;
}

interface AdminCache {
  fetchedAt: number;
  titles: string[];
}

const toNames = (titles: readonly string[]): ReadonlySet<string> => new Set(titles.map(norm));

let state: AdminItemsState = { names: new Set(), fetchedAt: null, loading: true, error: null };
const listeners = new Set<() => void>();
let hydrated = false;
let inFlight = false;

const publish = (patch: Partial<AdminItemsState>) => {
  state = { ...state, ...patch };
  for (const fn of listeners) fn();
};

const readCache = (): AdminCache | null => {
  try {
    const raw = localStorage.getItem(ADMIN_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminCache;
    return Array.isArray(parsed?.titles) && typeof parsed.fetchedAt === "number" ? parsed : null;
  } catch {
    return null;
  }
};

const writeCache = (cache: AdminCache) => {
  try {
    localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // A full quota only costs a refetch next visit.
  }
};

const hydrate = () => {
  if (hydrated || typeof localStorage === "undefined") return;
  hydrated = true;
  const cached = readCache();
  if (cached) publish({ names: toNames(cached.titles), fetchedAt: cached.fetchedAt, loading: false });
};

const fresh = () => state.fetchedAt !== null && Date.now() - state.fetchedAt < ADMIN_TTL;

const ensure = () => {
  if (inFlight || fresh() || typeof fetch === "undefined") return;
  inFlight = true;

  fetchAdminTitles()
    .then((titles) => {
      inFlight = false;
      const fetchedAt = Date.now();
      writeCache({ fetchedAt, titles });
      publish({ names: toNames(titles), fetchedAt, loading: false, error: null });
    })
    .catch((e: Error) => {
      inFlight = false;
      // Whatever was cached stays on screen; a flaky network degrades to a
      // stale admin list rather than to no filtering at all.
      publish({ loading: false, error: e.message });
    });
};

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  hydrate();
  ensure();
  return () => {
    listeners.delete(fn);
  };
};

const getSnapshot = () => state;

// Whichever tab refreshed the list, the others read the newer copy rather
// than spending a second fetch. Only this key, and only ever a re-read.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== ADMIN_CACHE_KEY) return;
    const cached = readCache();
    if (cached) publish({ names: toNames(cached.titles), fetchedAt: cached.fetchedAt, loading: false, error: null });
  });
}

/** The store behind `useAdminItems`, for readers that are not components. */
export const adminItemsStore = { subscribe, getSnapshot };

export const useAdminItems = (): AdminItemsState => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
