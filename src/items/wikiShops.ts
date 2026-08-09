import { useSyncExternalStore } from "react";
import { norm } from "./wikiCrafting";
import type { EventKey } from "../accessories/skyblockCalendar";

/**
 * NPC shop stock, fetched from the wiki at runtime.
 *
 * WHY THIS EXISTS
 * ---------------
 * "Bought from an NPC" was the one acquisition route the Items page could only
 * gesture at. The wiki does state it as data: every shop NPC's article
 * transcludes a `<Name>/UI` subpage whose `{{Shop UI|...}}` call lists each
 * stock entry with its in-game tooltip, and the tooltip carries the cost.
 *
 * Wiki content is CC BY-NC-SA 3.0, so this follows `wikiCrafting.ts` exactly:
 * fetch at runtime, parse in the browser, ship code and never content.
 *
 * THE ENUMERABLE SET
 * ------------------
 * `api.php?list=embeddedin` over `Template:Shop UI` names every page that uses
 * the template, which is the authoritative "which NPCs have a shop" answer; no
 * NPC name is hardcoded here. The `<Name>/UI` subpages are kept and the parent
 * articles dropped (a parent only embeds the template by transcluding its own
 * subpage, so keeping both would parse everything twice). The subpages are
 * then fetched fifty titles per request, the same batching `island/sacks.ts`
 * uses, so roughly ninety shops cost three requests a day, cached.
 *
 * WHAT AN ENTRY LOOKS LIKE
 * ------------------------
 * One positional template parameter per stock slot:
 *
 *   |Wheat; 3, none, &fWheat &8x3, %inherit%//&7Cost/&630 Coins//&eClick...
 *
 * item name (with an optional `; stack` suffix), two display fields, then the
 * tooltip: `/` separates lines, `//` separates paragraphs, `&x` are colour
 * codes and `\,` is an escaped comma. The paragraph opening with `&7Cost`
 * holds the price, one component per line: `&630 Coins`, `&d1\,000 Motes`, or
 * an item barter like `&fIron Ingot &8x24`. Named parameters (`arrow=`,
 * `confirmation=`) and coordinate-keyed slots (`3, 3=Anvil...`, which are UI
 * furniture such as reforge anvils, not stock) are skipped.
 */

const WIKI = "https://hypixelskyblock.minecraft.wiki";
const API = `${WIKI}/api.php`;

export const SHOP_TEMPLATE = "Template:Shop UI";

/** New surface, so a new key. Nothing else in this browser is touched. */
export const SHOPS_CACHE_KEY = "wizardsky.shops.v1";

/** Shop stock changes with game updates, not with page views. */
export const SHOPS_TTL = 24 * 60 * 60 * 1000;

/** One component of an offer's price. A price may have several. */
export type ShopCost =
  | { kind: "currency"; currency: string; amount: number }
  | { kind: "item"; name: string; qty: number };

export interface ShopOffer {
  /** Item article name, verbatim from the entry. */
  item: string;
  /** How many the offer hands over per purchase. */
  stack: number;
  /** Every component of the price, in the tooltip's order. */
  costs: ShopCost[];
}

export interface ShopStock {
  /** The NPC's article name, e.g. `Farm Merchant` or `Plumber Joe (Rift)`. */
  npc: string;
  offers: ShopOffer[];
}

/* ---------------------------------------------------------------- parsing */

const stripCodes = (s: string) => s.replace(/&[0-9a-fk-orA-FK-OR]/g, "").replace(/\\,/g, ",").trim();

/**
 * The price out of one entry's tooltip.
 *
 * Lines after the `Cost` header, within its paragraph only: the next `//`
 * closes the price, which is what keeps `Stock`, `Click to trade!` and
 * `Not unlocked!` out of it. Currencies write the amount first (`30 Coins`,
 * `1,000 Motes`); item barters write the quantity last (`Iron Ingot x24`) or
 * not at all (`Cleaver`). A line is read as currency only when the words after
 * the number carry no digits of their own, so an editor writing an
 * amount-first item cannot silently become a currency with a number in it.
 */
export const parseCosts = (tooltip: string): ShopCost[] => {
  const paragraph = tooltip.split("//").find((p) => stripCodes(p).toLowerCase().startsWith("cost"));
  if (!paragraph) return [];

  const out: ShopCost[] = [];
  for (const line of paragraph.split("/").slice(1)) {
    const text = stripCodes(line);
    if (!text) continue;

    const currency = text.match(/^([\d,]+)\s+([^\d]+)$/);
    if (currency) {
      const amount = Number(currency[1].replace(/,/g, ""));
      if (Number.isFinite(amount) && amount > 0) {
        // "1 Coin" and "30 Coins" are the same currency.
        const unit = currency[2].trim().replace(/^Coin$/i, "Coins");
        out.push({ kind: "currency", currency: unit, amount });
        continue;
      }
    }

    const barter = text.match(/^(.+?)\s+x([\d,]+)$/);
    if (barter) {
      const qty = Number(barter[2].replace(/,/g, ""));
      if (Number.isFinite(qty) && qty > 0) {
        out.push({ kind: "item", name: barter[1].trim(), qty });
        continue;
      }
    }

    out.push({ kind: "item", name: text, qty: 1 });
  }

  return out;
};

/**
 * Every stock entry in one UI subpage.
 *
 * A page can hold several `{{Shop UI}}` calls (dungeon-floor and quest-state
 * tabs restate the whole shop), so blocks are parsed in order and entries
 * deduplicated on item plus price: a repeat is the same offer shown again,
 * while the same item at a genuinely different price is two offers and both
 * survive.
 */
export const parseShopUiPage = (wikitext: string): ShopOffer[] => {
  const offers: ShopOffer[] = [];
  const seen = new Set<string>();

  for (const block of wikitext.split(/\{\{\s*Shop UI/i).slice(1)) {
    // Params are one per line. A line that opens no param continues the one
    // above it, and `}}` at line start closes the template.
    let current: string | null = null;
    const params: string[] = [];
    for (const line of block.split("\n")) {
      if (line.startsWith("}}")) break;
      if (line.startsWith("|")) {
        if (current !== null) params.push(current);
        current = line.slice(1);
      } else if (current !== null) {
        current += `\n${line}`;
      }
    }
    if (current !== null) params.push(current);

    for (const param of params) {
      // Template options and coordinate-keyed furniture slots are not stock.
      if (/^\s*[a-zA-Z]+\s*=/.test(param)) continue;
      if (/^\s*\d+\s*,\s*\d+\s*=/.test(param)) continue;

      // The item field is everything before the first unescaped comma.
      const comma = param.search(/(?<!\\),/);
      if (comma === -1) continue;
      const head = param.slice(0, comma).trim();
      const tooltip = param.slice(comma + 1);

      let item = head;
      let stack = 1;
      const semi = head.lastIndexOf(";");
      if (semi > -1 && /^\d[\d,]*$/.test(head.slice(semi + 1).trim())) {
        item = head.slice(0, semi).trim();
        stack = Number(head.slice(semi + 1).trim().replace(/,/g, ""));
      }
      if (!item) continue;

      const costs = parseCosts(tooltip);
      // No stated price means the slot is not something you buy.
      if (!costs.length) continue;

      const key = `${norm(item)}|${costs.map((c) => (c.kind === "currency" ? `c:${c.currency}:${c.amount}` : `i:${norm(c.name)}:${c.qty}`)).join("+")}`;
      if (seen.has(key)) continue;
      seen.add(key);
      offers.push({ item, stack, costs });
    }
  }

  return offers;
};

/* ------------------------------------------------------------------ index */

/**
 * Shops whose counter is not simply open.
 *
 * The stock index used to be time-unaware, so a Bingo Talisman wore an
 * "obtainable now" border for three weeks of every month while the Bingo NPC
 * did not exist. The mechanism: where a shop NPC's own wiki article states an
 * availability gate, the listing carries that gate as a calendar key, and the
 * actionable border (src/accessories/ui/actionable.ts) only lights the shop
 * door when `isEventLive` answers `true` for it. A key of `unknown` marks a
 * gate the clock cannot decide, and unknown NEVER lights a border, per the
 * standing rule in the calendar module. A shop absent from this map is an
 * always-open counter (Weaponsmith, Farm Merchant and the rest) and lights
 * exactly as before.
 *
 * Keys are NPC article names as the stock fetch produces them (the `/UI`
 * subpage title with the subpage stripped). Every entry below was verified
 * against its article on 2026-08-03; the quoted phrases are from those
 * articles.
 */
export const SHOP_EVENTS: Record<string, EventKey> = {
  // "hosts a SkyBlock Bingo for the first seven days of every real life
  // month" (Bingo (NPC)). Real-world window; see `isBingoLive` in the
  // calendar module for the encoding and its UTC caveat.
  "Bingo (NPC)": "bingo",
  // "located in the Village during the Spooky Festival" (Fear Mongerer).
  "Fear Mongerer": "spookyFestival",
  // "spawns during the Traveling Zoo event and sells Pets" (Oringo).
  Oringo: "travelingZoo",
  // The event's own article; its stock table is the Traveling Zoo's.
  "Traveling Zoo": "travelingZoo",
  // "located in Terry's Shack on Jerry's Workshop" (Terry). The Workshop
  // island is open for Late Winter, the calendar's jerryWorkshop window.
  Terry: "jerryWorkshop",
  // "found in Einary's Emporium in Jerry's Workshop" (Einary).
  Einary: "jerryWorkshop",
  // "Sherry's Showroom is a Location on Jerry's Workshop" (Sherry's Showroom).
  Sherry: "jerryWorkshop",
  // Infobox: "Appears during the New Year Celebration to give away New Year
  // Cakes and sell New Year Cake Bag" (Baker).
  Baker: "newYear",
  // Gates the clock cannot decide, so they never light:
  // "They only appear after defeating Kuudra once" (Drakuu), and the shop
  // dialogue further requires a Cataclysmic eruption. Progression, not time.
  Drakuu: "unknown",
  // "found in Unincorporated during the Great Spook" (Vargul). The Great
  // Spook runs on real-world announcements, off-calendar.
  "Vargul the Unearthed": "unknown",
  // "located in the Village during the Year of the Seal" (Lukas), a themed
  // year Hypixel announces rather than the calendar fixing.
  "Lukas the Aquarist": "unknown",
  // "while Diaz is in office" (Liz). Mayor-dependent.
  Liz: "unknown",
  // "appears in the Dragon's Nest while a Dragon fight is taking place"
  // (Gregory). Lobby state, not clock.
  Gregory: "unknown",
  // Marked {{Historical}}: "Malmar was an NPC... Removed" (Malmar) and
  // "Armorsmith was a shop NPC... They were removed" (Armorsmith). A removed
  // counter must never claim to be open.
  Malmar: "unknown",
  Armorsmith: "unknown",
};

export interface ShopListing {
  npc: string;
  offer: ShopOffer;
  /**
   * The availability gate the NPC's article states, when it states one.
   * Absent for the ordinary always-open shops. `unknown` means "gated, but
   * not by anything a clock can decide", which the border treats as closed.
   */
  event?: EventKey;
}

export interface ShopIndex {
  shops: ShopStock[];
  /** Normalised item name -> every shop listing that sells it. */
  byItem: Map<string, ShopListing[]>;
}

export const buildShopIndex = (shops: readonly ShopStock[]): ShopIndex => {
  const byItem = new Map<string, ShopListing[]>();
  for (const shop of shops) {
    // Derived from the code map at build time, never persisted: the cached
    // payload (`ShopsCache`) still holds raw ShopStock only, which is why no
    // cache key bump accompanies this field.
    const event = SHOP_EVENTS[shop.npc];
    for (const offer of shop.offers) {
      const key = norm(offer.item);
      if (!key) continue;
      const listing: ShopListing = event === undefined ? { npc: shop.npc, offer } : { npc: shop.npc, offer, event };
      const list = byItem.get(key);
      if (list) list.push(listing);
      else byItem.set(key, [listing]);
    }
  }
  return { shops: [...shops], byItem };
};

/* ---------------------------------------------------------------- fetching */

/**
 * Every page that embeds the shop template, from the wiki's own index.
 *
 * Main namespace only, and capped at a few continuation pages: the list is
 * ~170 titles today and a runaway loop against somebody else's API is not a
 * failure mode worth leaving open.
 */
const fetchShopPageTitles = async (): Promise<string[]> => {
  const titles: string[] = [];
  let cont: string | undefined;

  for (let page = 0; page < 4; page++) {
    const url = `${API}?${new URLSearchParams({
      action: "query",
      list: "embeddedin",
      eititle: SHOP_TEMPLATE,
      einamespace: "0",
      eilimit: "500",
      format: "json",
      formatversion: "2",
      origin: "*",
      ...(cont ? { eicontinue: cont } : {}),
    })}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`shop list responded ${res.status}`);
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

  // The subpages are the stock; a parent article only transcludes its own.
  return titles.filter((t) => t.includes("/"));
};

/** Batched content fetch, fifty titles per request, like `island/sacks.ts`. */
const fetchShopPages = async (titles: readonly string[]): Promise<ShopStock[]> => {
  const shops: ShopStock[] = [];

  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    const url = `${API}?${new URLSearchParams({
      action: "query",
      prop: "revisions",
      rvprop: "content",
      rvslots: "main",
      titles: batch.join("|"),
      format: "json",
      formatversion: "2",
      origin: "*",
    })}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`shop pages responded ${res.status}`);
    const body = (await res.json()) as {
      query?: { pages?: { title?: string; revisions?: { slots?: { main?: { content?: string } } }[] }[] };
    };

    for (const page of body.query?.pages ?? []) {
      const text = page.revisions?.[0]?.slots?.main?.content;
      if (!page.title || !text) continue;
      const offers = parseShopUiPage(text);
      if (!offers.length) continue;
      // `Farm Merchant/UI` is stock for `Farm Merchant`; deeper subpage names
      // (`Bingo (NPC)/Bingo Shop UI`) still reduce to their article.
      shops.push({ npc: page.title.split("/")[0], offers });
    }
  }

  return shops;
};

/** Exported for callers outside React; the hook below is a wrapper over it. */
export const fetchShops = async (): Promise<ShopStock[]> => {
  const titles = await fetchShopPageTitles();
  if (!titles.length) throw new Error("the wiki listed no shop pages");
  const shops = await fetchShopPages(titles);
  if (!shops.length) throw new Error("no shop page yielded any stock");
  return shops;
};

/* ------------------------------------------------------------------ store */

export interface ShopsState {
  index: ShopIndex;
  fetchedAt: number | null;
  loading: boolean;
  error: string | null;
}

interface ShopsCache {
  fetchedAt: number;
  shops: ShopStock[];
}

const EMPTY_INDEX = buildShopIndex([]);

let state: ShopsState = { index: EMPTY_INDEX, fetchedAt: null, loading: true, error: null };
const listeners = new Set<() => void>();
let hydrated = false;
let inFlight = false;

const publish = (patch: Partial<ShopsState>) => {
  state = { ...state, ...patch };
  for (const fn of listeners) fn();
};

const readCache = (): ShopsCache | null => {
  try {
    const raw = localStorage.getItem(SHOPS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ShopsCache;
    return Array.isArray(parsed?.shops) && typeof parsed.fetchedAt === "number" ? parsed : null;
  } catch {
    return null;
  }
};

const writeCache = (cache: ShopsCache) => {
  try {
    localStorage.setItem(SHOPS_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // A full quota only costs a refetch next visit.
  }
};

const hydrate = () => {
  if (hydrated || typeof localStorage === "undefined") return;
  hydrated = true;
  const cached = readCache();
  if (cached) publish({ index: buildShopIndex(cached.shops), fetchedAt: cached.fetchedAt, loading: false });
};

const fresh = () => state.fetchedAt !== null && Date.now() - state.fetchedAt < SHOPS_TTL;

const ensure = () => {
  if (inFlight || fresh() || typeof fetch === "undefined") return;
  inFlight = true;

  fetchShops()
    .then((shops) => {
      inFlight = false;
      const fetchedAt = Date.now();
      writeCache({ fetchedAt, shops });
      publish({ index: buildShopIndex(shops), fetchedAt, loading: false, error: null });
    })
    .catch((e: Error) => {
      inFlight = false;
      // Whatever was cached stays on screen; a flaky network degrades to a
      // stale stock list rather than to no shops at all.
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

// Whichever tab refreshed the stock, the others read the newer copy rather
// than spending a second fetch. Only this key, and only ever a re-read.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== SHOPS_CACHE_KEY) return;
    const cached = readCache();
    if (cached) publish({ index: buildShopIndex(cached.shops), fetchedAt: cached.fetchedAt, loading: false, error: null });
  });
}

/** The store behind `useShopStock`, for readers that are not components. */
export const shopsStore = { subscribe, getSnapshot };

export const useShopStock = (): ShopsState => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

/** Human line for one price: `30 coins`, `1,000 motes + 24x Iron Ingot`. */
export const describeCosts = (costs: readonly ShopCost[]): string =>
  costs
    .map((c) => {
      if (c.kind === "item") return `${c.qty.toLocaleString()}x ${c.name}`;
      const unit = c.currency.toLowerCase();
      // "1 coin", not "1 coins". Only a trailing plural s is trimmed.
      return `${c.amount.toLocaleString()} ${c.amount === 1 ? unit.replace(/s$/, "") : unit}`;
    })
    .join(" + ");
