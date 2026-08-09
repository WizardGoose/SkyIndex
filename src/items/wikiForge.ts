import { useSyncExternalStore } from "react";
import type { Item, ItemIndex, RecipeIngredient } from "./useItemData";
import { norm, slug } from "./wikiCrafting";

/**
 * Forge recipes, fetched from the wiki at runtime.
 *
 * WHY THIS EXISTS
 * ---------------
 * The Forge is how most Dwarven Mines gear is made, and none of it appears in
 * `Module:Crafting/Data` because none of it is made on a crafting grid. So the
 * Items page simply did not know that Divan armor, the drills or Gemstone
 * Mixture existed, let alone what they cost to make.
 *
 * Wiki content is CC BY-NC-SA 3.0, so this follows `wikiCrafting.ts` exactly:
 * fetch at runtime, parse in the browser, ship code and never content. The wiki
 * serves its own pages to the visitor, as if they had opened them themselves.
 *
 * WHERE THE DATA ACTUALLY LIVES
 * -----------------------------
 * Two pages, and each carries what the other lacks:
 *
 *   `The Forge/Table` is the roster. One subpage, transcluded into the Forge
 *   article, with every recipe as a wikitable row: name, cost, duration and the
 *   Heart of the Mountain requirement, grouped under `==== Section ====`
 *   headings. It is the only place durations and requirements are stated as
 *   data rather than prose.
 *
 *   `Module:DetailedList/Data` is the ingredient store. The table's cost cells
 *   are mostly `{{DRL|/Item/}}` lookups into this Lua module, which maps an
 *   item name to `{ num, item }` pairs. Rows that do not use the lookup carry
 *   an inline `{{RL|4 Refined Umber|...}}` instead, so both forms are parsed.
 *
 * Category:Forged items exists and was considered as the roster, but it lists
 * pages rather than recipes: durations and requirements would still have to be
 * scraped out of each article's prose, one page per item. The table states all
 * of it in one fetch.
 */

const WIKI = "https://hypixelskyblock.minecraft.wiki";

export const FORGE_TABLE_PAGE = "The Forge/Table";
export const FORGE_DATA_MODULE = "Module:DetailedList/Data";

/** New surface, so a new key. Nothing else in this browser is touched. */
// v2: recipes now carry `wikiTitle` from the table's own icon column, which is
// what fixes the forge pets' icons (the Ammonite row draws `{{Slot|Ammonite
// Pet}}` while its article is plain "Ammonite", and `File:Ammonite.png` does
// not exist). A v1 snapshot has no icon titles and would keep the pets on
// initials for up to a day, so the key bumps in the same edit as the field.
// v3: v2 was poisoned the way the crafting cache's v5 was: a hot-reloading
// dev tab wrote a v2 snapshot after the key bump but before the icon-cell
// parsing landed, verified in the built page (119 v2 recipes, none carrying
// `wikiTitle`, TTL-protected for a day). Burned the same way.
export const FORGE_CACHE_KEY = "wizardsky.forge.v3";
const STALE_FORGE_KEYS = ["wizardsky.forge.v1", "wizardsky.forge.v2"];

/** The table changes with game updates, not with page views. */
export const FORGE_TTL = 24 * 60 * 60 * 1000;

export interface ForgeIngredient {
  name: string;
  qty: number;
}

export interface ForgeRecipe {
  /** Article name, from the row's name link, e.g. `Gemstone Mixture`. */
  name: string;
  /**
   * The wiki title the row's ICON is drawn from, when the table's own icon
   * cell (`{{Slot|Ammonite Pet}}`) names something other than the article.
   * This is the wiki's statement of where the image lives, not a guess: six
   * of the nine pet rows link the article `[[Ammonite]]` but draw `Ammonite
   * Pet`, and `File:Ammonite.png` does not exist. Null when the icon cell
   * matches the name or is absent.
   */
  wikiTitle: string | null;
  /** The table section the row sits under, e.g. `Refining`, `Gear`. */
  section: string;
  /** Item components. Coins are carried separately, never as an ingredient. */
  ingredients: ForgeIngredient[];
  /** Coin component of the cost, or null when the cost states none. */
  coins: number | null;
  /** Forge time in seconds, or null when the duration cell did not parse. */
  seconds: number | null;
  /** The duration cell's own words, kept so an unparsed cell still shows. */
  duration: string | null;
  /** Heart of the Mountain tier from the roman numeral, or null if absent. */
  hotm: number | null;
  /** Requirement text beyond the tier, e.g. `Tungsten IV collection`. */
  requirement: string | null;
}

/* ---------------------------------------------------------------- parsing */

const unescapeLua = (s: string) => s.replace(/\\'/g, "'");

/**
 * Parse `Module:DetailedList/Data` into name -> components.
 *
 * Shape, per the module's own header comment:
 *
 *   ['Item Name'] = {
 *       { num = 4, item = 'Fine Jade Gemstone' },
 *   },
 *
 * Coin costs appear as a component too (`{ num = 25000, item = 'Coins' }`),
 * and are kept here verbatim; the table parser is what separates coins from
 * items, so this stays a faithful reading of the module.
 */
export const parseDetailedListLua = (lua: string): Map<string, ForgeIngredient[]> => {
  const out = new Map<string, ForgeIngredient[]>();

  const blocks = [...lua.matchAll(/\[\s*'((?:[^'\\]|\\.)+)'\s*\]\s*=\s*\{/g)];
  for (let i = 0; i < blocks.length; i++) {
    const name = unescapeLua(blocks[i][1]);
    const start = blocks[i].index! + blocks[i][0].length;
    const end = i + 1 < blocks.length ? blocks[i + 1].index! : lua.length;
    const body = lua.slice(start, end);

    const components: ForgeIngredient[] = [];
    for (const [, num, item] of body.matchAll(/\{\s*num\s*=\s*([\d]+)\s*,\s*item\s*=\s*'((?:[^'\\]|\\.)*)'/g)) {
      const qty = Number(num);
      const itemName = unescapeLua(item).trim();
      if (qty > 0 && itemName) components.push({ name: itemName, qty });
    }
    if (components.length) out.set(name, components);
  }

  return out;
};

/**
 * Strip the wiki markup that appears inside requirement cells, keeping the
 * words. `{{Coll|Tungsten IV}}` says which collection, `{{ID|X}}` and
 * `{{NPCSprite|X}}` name an item or an NPC, and `X!label` inside `{{ID}}` is
 * the wiki's link-with-label form, where the part before the `!` is the item.
 */
const cleanCellText = (s: string): string =>
  s
    .replace(/\{\{\s*Coll\s*\|\s*([^}|]+?)\s*\}\}/gi, "$1 collection")
    .replace(/\{\{\s*(?:ID|NPCSprite)\s*\|\s*([^}|!]+)[^}]*\}\}/gi, "$1")
    .replace(/\[\[([^\]|]+)\|([^\]]*)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\{\{[^}]*\}\}/g, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/'''?/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** `1 Day 6 Hours` -> seconds. Null when no unit was recognised at all. */
export const parseDuration = (text: string): number | null => {
  let total = 0;
  let any = false;
  for (const [, n, unit] of text.matchAll(/([\d,]+)\s*(Day|Hour|Minute|Second)s?/gi)) {
    const value = Number(n.replace(/,/g, ""));
    if (!Number.isFinite(value)) continue;
    any = true;
    const u = unit.toLowerCase();
    total += value * (u === "day" ? 86400 : u === "hour" ? 3600 : u === "minute" ? 60 : 1);
  }
  return any ? total : null;
};

/** `2d 2h`, `4h 30m`, `30s`. The table's own unit words, shortened for a row. */
export const formatDuration = (seconds: number): string => {
  const parts: string[] = [];
  let rest = Math.max(0, Math.round(seconds));
  const push = (unit: string, size: number) => {
    const n = Math.floor(rest / size);
    if (n > 0) parts.push(`${n}${unit}`);
    rest -= n * size;
  };
  push("d", 86400);
  push("h", 3600);
  push("m", 60);
  if (rest > 0 || parts.length === 0) parts.push(`${rest}s`);
  return parts.join(" ");
};

/** The table writes HotM tiers as roman numerals, I through X. */
const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };

/**
 * One cost cell into components.
 *
 * Two forms appear, and only these two:
 *   `{{DRL|/Gemstone Mixture/}}`          a lookup into the Lua module
 *   `{{RL|4 Refined Umber|25000 Coins}}`  the list written inline
 *
 * Coins are split out rather than kept as an ingredient, because coins are a
 * price and not an item: a "Coins" node in a crafting tree can never resolve
 * and would sit forever as an unbuyable dead end (the same rule
 * `materialChain.ts` applies to infobox costs).
 */
const parseCostCell = (
  cell: string,
  drl: ReadonlyMap<string, ForgeIngredient[]>
): { ingredients: ForgeIngredient[]; coins: number | null } => {
  const ingredients: ForgeIngredient[] = [];
  let coins: number | null = null;

  const add = (name: string, qty: number) => {
    if (/^coins?$/i.test(name)) coins = (coins ?? 0) + qty;
    else ingredients.push({ name, qty });
  };

  const lookup = cell.match(/\{\{\s*DRL\s*\|\s*\/([^/}]+)\//i);
  if (lookup) {
    for (const c of drl.get(lookup[1].trim()) ?? []) add(c.name, c.qty);
  }

  const inline = cell.match(/\{\{\s*RL\s*\|([^{}]*)\}\}/i);
  if (inline) {
    for (const arg of inline[1].split("|")) {
      const m = arg.trim().match(/^([\d,]+)\s+(.+?)\s*$/);
      if (!m) continue;
      const qty = Number(m[1].replace(/,/g, ""));
      const name = m[2].trim();
      if (qty > 0 && name) add(name, qty);
    }
  }

  return { ingredients, coins };
};

/** A cell as written, with any rowspan it declares on its attribute prefix. */
interface RawCell {
  text: string;
  rowspan: number;
}

/**
 * Split one table row into cells, keeping rowspans.
 *
 * A cell starts at a line beginning with `|`; other lines continue the cell
 * above, which keeps a wrapped template attached to its own cell. `||` splits
 * two cells sharing a line, but only outside `{{ }}`, because template
 * arguments use single pipes and a `Coll` inside a cell must not become a
 * second cell. The attribute prefix (`rowspan="4" |`, `class="ct" |`) is read
 * for its rowspan and then dropped, since the rest is presentation.
 */
const rowCells = (row: string): RawCell[] => {
  const lines: string[] = [];
  for (const line of row.split("\n")) {
    const startsCell = line.startsWith("|") && !line.startsWith("|-") && !line.startsWith("|}") && !line.startsWith("|+");
    if (startsCell) lines.push(line.slice(1));
    else if (lines.length) lines[lines.length - 1] += `\n${line}`;
  }

  const cells: string[] = [];
  for (const line of lines) {
    let depth = 0;
    let current = "";
    for (let i = 0; i < line.length; i++) {
      if (line.startsWith("{{", i)) depth++;
      if (line.startsWith("}}", i)) depth = Math.max(0, depth - 1);
      if (depth === 0 && line.startsWith("||", i)) {
        cells.push(current);
        current = "";
        i++;
        continue;
      }
      current += line[i];
    }
    cells.push(current);
  }

  return cells.map((c) => {
    const attrs = c.match(/^\s*((?:[a-zA-Z-]+\s*=\s*"[^"]*"\s*)+)\|/);
    let text = c;
    let rowspan = 1;
    if (attrs) {
      text = c.slice(attrs[0].length);
      const span = attrs[1].match(/rowspan\s*=\s*"(\d+)"/i);
      if (span) rowspan = Math.max(1, Number(span[1]));
    }
    return { text: text.trim(), rowspan };
  });
};

/**
 * Parse `The Forge/Table` against the ingredient module.
 *
 * Column positions are the table's own: icon, name, cost, duration,
 * requirement, material cost. The first four after the icon are read; the
 * material cost column is a bazaar-flattened restatement of the cost column
 * and adds nothing the cost column does not already say.
 *
 * ROWSPAN IS THE WHOLE DIFFICULTY
 * -------------------------------
 * The table leans on `rowspan` hard: four Mithril accessories share one cost,
 * one duration and one requirement cell, and half the duration column is
 * spans. So cells are assigned to columns left to right, skipping any column
 * a live span still occupies, exactly as a browser lays the table out. Getting
 * this wrong does not drop rows, it silently shifts a duration into a
 * requirement column, which is why it is tested against a spanned fixture.
 *
 * Deliberately forgiving row by row: this reads a page other people edit, and
 * a malformed row should cost that row rather than the whole feature.
 */
export const parseForgeTable = (wikitext: string, drl: ReadonlyMap<string, ForgeIngredient[]>): ForgeRecipe[] => {
  const out: ForgeRecipe[] = [];
  let section = "";

  // Tables in document order, each owned by the last heading above it.
  const tables: { section: string; body: string }[] = [];
  for (const chunk of wikitext.split(/\n(?=====|\{\|)/)) {
    const heading = chunk.match(/^====\s*(.+?)\s*====/);
    if (heading) section = heading[1];
    const start = chunk.indexOf("{|");
    if (start === -1) continue;
    // A table runs to its `|}`. The page closes every table it opens.
    const end = chunk.indexOf("\n|}", start);
    tables.push({ section, body: chunk.slice(start, end === -1 ? undefined : end) });
  }

  for (const table of tables) {
    /** Live spans, one slot per column: the carried cell and rows remaining. */
    const carried: ({ cell: RawCell; remaining: number } | null)[] = [];

    for (const row of table.body.split(/\n\|-[^\n]*/)) {
      // Header rows declare with `!` and carry no cells this parser reads.
      if (/^\s*!/m.test(row) && !row.split("\n").some((l) => l.startsWith("|"))) continue;

      const parsed = rowCells(row);
      if (!parsed.length) continue;

      // Lay the row out: spanned columns first, fresh cells into the gaps.
      const columns: RawCell[] = [];
      let next = 0;
      for (let col = 0; col < Math.max(6, carried.length); col++) {
        const span = carried[col];
        if (span && span.remaining > 0) {
          columns[col] = span.cell;
          span.remaining -= 1;
          if (span.remaining === 0) carried[col] = null;
          continue;
        }
        if (next < parsed.length) {
          const cell = parsed[next++];
          columns[col] = cell;
          if (cell.rowspan > 1) carried[col] = { cell, remaining: cell.rowspan - 1 };
        }
      }

      const nameCell = columns[1]?.text ?? "";
      const link = nameCell.match(/\[\[([^\]|]+)/);
      if (!link) continue;
      const name = link[1].trim();

      /*
       * The icon cell, `{{Slot|Ammonite Pet}}`. Kept only when it names a
       * different title than the article, because that difference is the one
       * fact this column adds: it is where the image really lives.
       */
      const slotMatch = (columns[0]?.text ?? "").match(/\{\{\s*Slot\s*\|\s*([^}|]+)/i);
      const slotTitle = slotMatch ? slotMatch[1].trim() : "";
      const wikiTitle = slotTitle && norm(slotTitle) !== norm(name) ? slotTitle : null;

      const { ingredients, coins } = parseCostCell(columns[2]?.text ?? "", drl);

      const durationText = cleanCellText(columns[3]?.text ?? "");
      const seconds = parseDuration(durationText);

      const reqText = cleanCellText(columns[4]?.text ?? "");
      const roman = reqText.match(/^([IVX]+)\b/);
      const hotm = roman ? ROMAN[roman[1]] ?? null : null;
      const rest = roman ? reqText.slice(roman[0].length).trim() : reqText;

      out.push({
        name,
        wikiTitle,
        section: table.section,
        ingredients,
        coins,
        seconds,
        duration: durationText || null,
        hotm,
        requirement: rest || null,
      });
    }
  }

  return out;
};

/* ------------------------------------------------------------------ merge */

export interface ForgeIndex {
  recipes: ForgeRecipe[];
  /** Normalised item name -> recipe. First row wins if a name repeats. */
  byName: Map<string, ForgeRecipe>;
}

export const buildForgeIndex = (recipes: readonly ForgeRecipe[]): ForgeIndex => {
  const byName = new Map<string, ForgeRecipe>();
  for (const r of recipes) {
    const key = norm(r.name);
    if (key && !byName.has(key)) byName.set(key, r);
  }
  return { recipes: [...recipes], byName };
};

/**
 * Fold forge recipes into the item index.
 *
 * This is the fix for the actual complaint: forge outputs have no grid recipe,
 * so most of them were not in the index at all and could not even be selected.
 * Every forge output gets an entry, and any entry without a grid recipe takes
 * the forge components as its `recipe`, which is what lets the existing cost
 * tree, gather list and have/missing rollups run through forged gear unchanged.
 * An item that has both keeps the grid recipe; the forge panel shows the forge
 * route alongside it.
 *
 * THE ID RULE, STATED HONESTLY
 * ----------------------------
 * A forge-only item arrives with no Hypixel id, and the id is what bazaar
 * pricing keys on. The only derivation available is spelling: upper-snake of
 * the name (`Gemstone Mixture` -> `GEMSTONE_MIXTURE`). That is a guess, so it
 * is only accepted when the bazaar feed itself lists the derived id, which is
 * Hypixel's own confirmation that an item spells its id that way; ids are
 * unique, so a listed id cannot belong to some differently-named item that
 * happens to collide. An id the feed does not list stays null and the item
 * simply shows no price, which is the honest miss.
 *
 * THE PET ID RULE
 * ---------------
 * Rows in the table's "Pets" section are pets, and a pet's Hypixel id is
 * `PET_<UPPER_NAME>`, which no bazaar feed will ever confirm because pets are
 * not bazaar tradeable. So those rows get a second chance at an id, under the
 * same honesty bar: the derived `PET_` id is only accepted when the item
 * resource itself carries it (`resourceHasId`), which is Hypixel's own
 * confirmation the id exists. Measured live 2026-08-03 the resource lists no
 * `PET_` id for any of the nine pet rows, so today the guard rejects them all
 * and their `hypixelId` stays null, which is the honest answer; the icons are
 * carried by `wikiTitle` instead. If Hypixel ever adds them, they resolve on
 * the next refresh with no code change.
 *
 * Pure, and the input index is not mutated: every touched entry is copied.
 */
export const mergeForgeItems = (
  items: ItemIndex,
  forge: ForgeIndex,
  bazaarIds: ReadonlySet<string>,
  /** Whether Hypixel's item resource knows an id. Injected so this stays pure and testable. */
  resourceHasId: (id: string) => boolean = () => false
): ItemIndex => {
  if (!forge.recipes.length) return items;

  const out: ItemIndex = { ...items };
  const USED_IN_CAP = 40;

  for (const recipe of forge.recipes) {
    const id = slug(recipe.name);
    if (!id) continue;

    const existing = out[id];
    const derived = id.toUpperCase();
    const petDerived = recipe.section === "Pets" ? `PET_${derived}` : null;
    const confirmedId = bazaarIds.has(derived)
      ? derived
      : petDerived && resourceHasId(petDerived)
      ? petDerived
      : null;

    if (!existing) {
      out[id] = {
        name: recipe.name,
        hypixelId: confirmedId,
        ...(recipe.wikiTitle ? { wikiTitle: recipe.wikiTitle } : {}),
        tier: null,
        category: null,
        npcSell: null,
        yields: 1,
        recipe: null,
      };
    } else {
      let next = existing;
      if (existing.hypixelId === null && confirmedId) next = { ...next, hypixelId: confirmedId };
      // The icon title only ever fills a gap: an item the index already
      // resolves an image for has nothing to gain from the forge table's cell.
      if (!existing.wikiTitle && recipe.wikiTitle) next = { ...next, wikiTitle: recipe.wikiTitle };
      if (next !== existing) out[id] = next;
    }

    if (!out[id].recipe && recipe.ingredients.length) {
      const asRecipe: RecipeIngredient[] = recipe.ingredients.map((i) => ({ id: slug(i.name), name: i.name, qty: i.qty }));
      out[id] = { ...out[id], recipe: asRecipe };

      // Ingredients the index has never heard of get an entry too, under the
      // same id rule. Without this a Divan Fragment node in the cost tree has
      // no name to render and falls back to printing its slug.
      for (const ing of asRecipe) {
        if (out[ing.id]) continue;
        const ingDerived = ing.id.toUpperCase();
        out[ing.id] = {
          name: ing.name,
          hypixelId: bazaarIds.has(ingDerived) ? ingDerived : null,
          tier: null,
          category: null,
          npcSell: null,
          yields: 1,
          recipe: null,
        };
      }

      // The reverse index, so Gemstone Mixture's "used in" names the drills.
      for (const ing of asRecipe) {
        const target = out[ing.id];
        if (!target) continue;
        const usedIn = target.usedIn ?? [];
        if (usedIn.includes(id)) continue;
        const next: Item = {
          ...target,
          usedIn: usedIn.length < USED_IN_CAP ? [...usedIn, id] : usedIn,
          usedInTotal: (target.usedInTotal ?? 0) + 1,
        };
        out[ing.id] = next;
      }
    }
  }

  return out;
};

/* ------------------------------------------------------------------ store */

export interface ForgeState {
  index: ForgeIndex;
  fetchedAt: number | null;
  loading: boolean;
  error: string | null;
}

interface ForgeCache {
  fetchedAt: number;
  recipes: ForgeRecipe[];
}

const EMPTY_INDEX = buildForgeIndex([]);

let state: ForgeState = { index: EMPTY_INDEX, fetchedAt: null, loading: true, error: null };
const listeners = new Set<() => void>();
let hydrated = false;
let inFlight = false;

const publish = (patch: Partial<ForgeState>) => {
  state = { ...state, ...patch };
  for (const fn of listeners) fn();
};

const readCache = (): ForgeCache | null => {
  try {
    // Own derived cache only: a superseded snapshot of OUR parse is ours to
    // remove, and nothing the user entered lives under these keys.
    for (const k of STALE_FORGE_KEYS) localStorage.removeItem(k);
    const raw = localStorage.getItem(FORGE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ForgeCache;
    return Array.isArray(parsed?.recipes) && typeof parsed.fetchedAt === "number" ? parsed : null;
  } catch {
    return null;
  }
};

const writeCache = (cache: ForgeCache) => {
  try {
    localStorage.setItem(FORGE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // A full quota only costs a refetch next visit.
  }
};

const hydrate = () => {
  if (hydrated || typeof localStorage === "undefined") return;
  hydrated = true;
  const cached = readCache();
  if (cached) publish({ index: buildForgeIndex(cached.recipes), fetchedAt: cached.fetchedAt, loading: false });
};

const fresh = () => state.fetchedAt !== null && Date.now() - state.fetchedAt < FORGE_TTL;

const rawPage = async (page: string): Promise<string> => {
  const res = await fetch(`${WIKI}/index.php?title=${encodeURIComponent(page)}&action=raw`);
  if (!res.ok) throw new Error(`${page} responded ${res.status}`);
  return res.text();
};

/** Exported for callers outside React; the hook below is a wrapper over it. */
export const fetchForgeRecipes = async (): Promise<ForgeRecipe[]> => {
  const [table, lua] = await Promise.all([rawPage(FORGE_TABLE_PAGE), rawPage(FORGE_DATA_MODULE).catch(() => "")]);
  const recipes = parseForgeTable(table, parseDetailedListLua(lua));
  if (!recipes.length) throw new Error("the Forge table listed no recipes");
  return recipes;
};

const ensure = () => {
  if (inFlight || fresh() || typeof fetch === "undefined") return;
  inFlight = true;

  fetchForgeRecipes()
    .then((recipes) => {
      inFlight = false;
      const fetchedAt = Date.now();
      writeCache({ fetchedAt, recipes });
      publish({ index: buildForgeIndex(recipes), fetchedAt, loading: false, error: null });
    })
    .catch((e: Error) => {
      inFlight = false;
      // Whatever was cached stays on screen; a flaky network degrades to a
      // stale table rather than to no forge at all.
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

// Whichever tab refreshed the table, the others read the newer copy rather
// than spending a second fetch. Only this key, and only ever a re-read.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== FORGE_CACHE_KEY) return;
    const cached = readCache();
    if (cached) publish({ index: buildForgeIndex(cached.recipes), fetchedAt: cached.fetchedAt, loading: false, error: null });
  });
}

/** The store behind `useForgeRecipes`, for readers that are not components. */
export const forgeStore = { subscribe, getSnapshot };

export const useForgeRecipes = (): ForgeState => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
