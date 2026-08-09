/**
 * Crafting data, fetched from the wiki at runtime.
 *
 * WHY THIS EXISTS
 * ---------------
 * Wiki content is CC BY-NC-SA 3.0. Bundling a derived `recipes.json` and 12 MB
 * of downloaded icons into the build would mean *we* redistribute wiki content,
 * which drags the share-alike clause onto this project and puts 2,000 of the
 * wiki's images in our repo.
 *
 * Fetching at runtime avoids the whole question. The wiki serves its own
 * content to the visitor's browser, exactly as if they had opened the wiki
 * themselves. We ship code, not content. Attribution still applies and is shown
 * in the footer.
 *
 * Two things make this cheap:
 *   - `Module:Crafting/Data` is 135 KB of Lua and comes back with
 *     `Access-Control-Allow-Origin: *`
 *   - image URLs are derivable from the item name, so icons need no API lookup
 *     at all and are loaded straight from the wiki by the browser
 */

import type { Item, ItemIndex, CollectionUnlock, ItemRequirement } from "./useItemData";
import { adoptResourceItems } from "./itemResource";

const WIKI = "https://hypixelskyblock.minecraft.wiki";
// v2: v1 only indexed items that appear in a grid recipe, which dropped 25 of
// the 40 greenhouse mutations and with them their Hypixel ids, so nothing the
// player owns could be matched to them. Bumping the key re-parses rather than
// serving those incomplete snapshots for up to a day. Only this derived cache
// is dropped; nothing the user entered lives under it.
// v3: v2 indexed only the 179 of 411 accessories that some recipe happened to
// mention, so the accessories page would have been missing 232 of them, almost
// all of them the uncraftable ones it exists to explain. Bumping the key
// re-parses rather than serving those incomplete snapshots for up to a day.
// Only this derived cache is dropped; nothing the user entered lives under it.
// v4: v3 was written before `requirements` and `stats` were added to the cached
// item, so a v3 snapshot carries neither. It was caught on the built page: the
// accessories page hydrated a same-day v3 cache and reported Combat 10 and
// Other 318, where a fresh index gives Combat 72 and Other 226. Every activity
// group and every Hypixel requirement gate silently degrades for as long as
// that snapshot is served, because both are read off fields the snapshot does
// not have. A payload that gains fields has to gain a key with them; this is
// the same bump v2 and v3 were.
// v6: the cached item now carries Hypixel's `origin` field, which is how the
// accessories page separates Rift accessories from normal ones (measured on
// the live resource: 29 accessories state `origin: "RIFT"`, and it is the only
// signal that gets the Scarf line right, which is dungeon loot wearing rift
// stats). Same rule as v4: a payload that gains a field gains a key, or a
// same-day origin-less snapshot serves rift-less entries for as long as it
// lives. v5 existed for minutes during development: a hot-reloading tab wrote
// a v5 snapshot after the key bump but before the field landed, which is
// exactly the poisoned-cache shape this list exists for, so it is retired the
// same way.
// v7: the cached item now carries `vanilla` (vanilla recipes are hidden
// by default; this index is for SkyBlock item crafting). The flag
// is read off the crafting module's own `-- Vanilla Recipes` section marker,
// so a v6 snapshot has no way to say which side of that line a recipe came
// from and would keep Acacia Doors in the list for up to a day. Same rule as
// v4 and v6: the payload gained a field, so it gains a key in the same edit.
// v8: v7 repeated v5's accident to the letter, and was caught the same way
// v5's comment predicts: a hot-reloading dev tab wrote a v7 snapshot after
// the key bump but before the vanilla parsing landed, verified in the built
// page (an acacia_door entry under v7 with no `vanilla` flag, TTL-protected
// for a day). Burned, exactly as v5 was.
// v9: `tier` no longer carries Hypixel's "UNOBTAINABLE", which is a flag, not
// a rarity (see the note on `meta` below and the Enchanted Clock collision it
// mispainted). A v8 snapshot still stores it, and a stored tier blocks the
// wiki fill from ever asking, so the rule change bumps the key with it.
// v10: v9 hit the same v5/v7 race - any dev tab open on 5173 hot
// reloads EVERY edit as it lands, so a key bump and its rule arriving as two
// edits is always a window, and a v9 snapshot with the UNOBTAINABLE tier
// still in it was verified on the built page. This bump is a single edit
// with the rule already in the file, which closes the window.
// v11: the parser used to scan a recipe's WHOLE body for slot patterns, which
// reads straight through the `//` that separates alternate recipe variants
// (see the comment on `firstVariant` below) as if every variant belonged to
// one recipe. A v10 snapshot still carries that corruption baked in - the
// built page showed Enchanted Charcoal at 256 Coal + 64 Log against the
// wiki's own stated 128 + 32 - so a v10 snapshot has to be re-parsed, not
// served, for every item with a `//` in its module entry.
// v12: the entry regex required a recipe's QRS string to be followed
// immediately by the entry's closing `}`, so any entry carrying a trailing
// `Output` or `ver` argument (see the comment on `ENTRY` below) was not
// parsed wrong, it was not parsed at all - 29 real keys, Enchanted Paper and
// Haste Block among them, were simply absent with nothing to show it. A v11
// snapshot was built by the same broken regex and is missing every one of
// them; only re-parsing recovers them; a same-day v11 tab is the same
// hot-reload race the v5/v7/v9 notes above describe, and closing it is why
// this bump is its own edit rather than folded into v11's.
// v13: ingredient names are stripped of trailing commas ("Shadow Crux," is
// the wiki's own typo in Cruxmotion, not an item). A v12 snapshot would keep
// serving the comma names for a day, so the payload change bumps the key with
// it, in this same edit, as always.
// v14: the cached item now carries Hypixel's `rift_transferrable` flag as
// `riftTransferable` (Rift_Transferable accessories belong both in the
// Rift and outside it; the accessories page lists those
// pieces in both areas on it). Measured on the live resource (2026-08-03): 68
// items carry the flag, always `true`, 20 of them accessories. Same rule as
// v4 and v6: a payload that gains a field gains a key with it.
// v15: v14 hit the same v5/v7/v9 race, verified in the built page
// minutes after the bump: the key landed one edit ahead of the field parse,
// a dev tab on 5173 hot-reloaded in the gap and wrote a v14 snapshot whose
// entries carry no `riftTransferable` at all, TTL-protected for a day
// (Scarf's Grimoire read back from the v14 blob without the flag). Burned
// exactly as v5, v7 and v9 were; THIS bump is a single edit with the parse
// already in the file, which is the only shape that closes the window.
export const CACHE_KEY = "wizardsky.crafting.v15";
const STALE_KEYS = [
  "wizardsky.crafting.v1",
  "wizardsky.crafting.v2",
  "wizardsky.crafting.v3",
  "wizardsky.crafting.v4",
  "wizardsky.crafting.v5",
  "wizardsky.crafting.v6",
  "wizardsky.crafting.v7",
  "wizardsky.crafting.v8",
  "wizardsky.crafting.v9",
  "wizardsky.crafting.v10",
  "wizardsky.crafting.v11",
  "wizardsky.crafting.v12",
  "wizardsky.crafting.v13",
  "wizardsky.crafting.v14",
];

/** Refresh the parsed database at most once a day. */
export const CRAFTING_TTL = 24 * 60 * 60 * 1000;

export const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

/**
 * Wiki image URL for an item, built straight from its name.
 *
 * MediaWiki serves `/images/thumb/<File>.png/<px>px-<File>.png` without any
 * API call, so a whole page of icons costs zero lookups. The browser loads
 * them from the wiki directly, so nothing is copied into this project.
 *
 * This is the cheap first guess, not the whole story. It cannot see a reforge
 * prefix ("Rapid Juju Shortbow" has no file of its own) and it cannot follow a
 * file redirect ("Boots of Divan" is drawn with the Golden Boots texture).
 * `wikiImages.ts` layers those two cases on top and is what `ItemIcon` calls.
 */
export const wikiIconUrl = (name: string, px = 64): string => {
  const file = encodeURIComponent(name.replace(/ /g, "_")) + ".png";
  return `${WIKI}/images/thumb/${file}/${px}px-${file}`;
};

/** Slots a Quick Recipe Syntax spec covers. Rows A-C, columns 1-3, `*` = all. */
const countSlots = (spec: string): number => {
  const slots = new Set<string>();
  for (const [, rowPart, colPart] of spec.matchAll(/([ABC*])([123]+|\*)/g)) {
    const rows = rowPart === "*" ? ["A", "B", "C"] : [rowPart];
    const cols = colPart === "*" ? ["1", "2", "3"] : colPart.split("");
    for (const r of rows) for (const c of cols) slots.add(r + c);
  }
  return slots.size;
};

/**
 * One slot's contents. Editors write four forms, all of which appear:
 *   "Enchanted Iron Ingot, 64"      item plus per-slot quantity
 *   "Scylla; Hyperion; Valkyrie"    any ONE of these works
 *   "Enchanted Magma Cream, 12; "   both, with trailing junk
 *   "Shadow Crux,"                  a comma with NO quantity after it
 *
 * That last one is a live editor slip, not a hypothetical: Cruxmotion's entry
 * quotes four of its six cruxes with a trailing comma inside the string. The
 * comma is punctuation someone forgot to delete, never part of a name, and
 * keeping it poisoned everything downstream of the name - the built page
 * showed "Shadow Crux," rendered verbatim with a wrong sprite,
 * because no wiki file ends in a comma and the icon ladder fell to a guess.
 * So a name is stripped of trailing commas on every path out of here.
 */
const parseSlotBody = (body: string): { name: string; per: number }[] =>
  body
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((opt) => {
      const comma = opt.lastIndexOf(",");
      if (comma > -1) {
        const tail = opt.slice(comma + 1).trim();
        if (/^\d[\d,]*$/.test(tail)) {
          return { name: opt.slice(0, comma).trim().replace(/\\'/g, "'").replace(/,+\s*$/, ""), per: Number(tail.replace(/,/g, "")) };
        }
      }
      return { name: opt.replace(/\\'/g, "'").replace(/,+\s*$/, "").trim(), per: 1 };
    })
    .filter((o) => !/^\{\d+\}$/.test(o.name.trim())); // unexpanded template params

export interface ParsedRecipe {
  yields: number;
  ingredients: { name: string; qty: number; alternatives: string[] }[];
  /**
   * True when the recipe sits in the module's own `-- Vanilla Recipes`
   * section. That marker is the wiki's classification, not ours: the module
   * is written as SkyBlock recipes first, then the marker, then every plain
   * Minecraft recipe (Acacia Door, Andesite, the wool and carpet colours),
   * then a `-- Templates` block. Measured on the live module 2026-08-03:
   * 1,251 keys before the marker, 303 after it, none on both sides.
   */
  vanilla?: boolean;
}

export const parseCraftingLua = (lua: string): Map<string, ParsedRecipe> => {
  const recipes = new Map<string, ParsedRecipe>();

  /**
   * Section boundaries, straight from the module's own comments. A fixture
   * (or a future rewrite of the module) without the markers parses exactly as
   * before: no vanilla flag, nothing skipped.
   */
  const vanillaAt = lua.indexOf("-- Vanilla Recipes");
  const templatesAt = lua.indexOf("-- Templates");

  /*
   * A table entry is `['Key'] = {'QRS STRING'}`, optionally followed by more
   * named arguments before the closing brace: `, Output = 'X, 8'` or `, ver =
   * 2` are the two shapes the module actually uses. The old pattern required
   * the QRS string's closing quote to be followed immediately by `}`, so any
   * entry carrying one of those extra arguments was not a shorter match, it
   * was NO match: the whole entry, QRS string included, silently never
   * reached the loop body. Measured live 2026-08-03 against the real module:
   * 29 keys carry a trailing argument, among them Enchanted Paper, Haste
   * Block, Diamond Head, Master Skull, Hard Glass and Potted Cactus, and all
   * 29 were absent from the index with no error and no trace - "no recipe"
   * looks identical to "recipe not on a grid" from the outside. The trailing
   * group below is the fix: zero or more `, name = 'string'` / `, name =
   * number` pairs, consumed and kept (as `argsBlob`) rather than discarded,
   * because `Output` is what recovers Haste Block's true yield below.
   */
  const ENTRY = /\['((?:[^'\\]|\\.)+)'\]\s*=\s*\{'((?:[^'\\]|\\.)*)'((?:\s*,\s*[A-Za-z]+\s*=\s*(?:'(?:[^'\\]|\\.)*'|-?\d+))*)\s*\}/g;

  for (const match of lua.matchAll(ENTRY)) {
    const [, rawName, body, argsBlob] = match;
    const rawKey = rawName.replace(/\\'/g, "'");
    if (/test item/i.test(rawKey)) continue;
    if (/^\{\d+\}$/.test(rawKey.trim())) continue;
    /*
     * Keys after `-- Templates` are template definitions ('T:Enchanted',
     * 'T:Sacks'), not items: they exist for other module entries to expand
     * and were leaking into the index as literal items named "T:Enchanted".
     * Same class of non-item as the `{1}` parameter keys already skipped.
     */
    if (templatesAt !== -1 && match.index! >= templatesAt) continue;
    const vanilla = vanillaAt !== -1 && match.index! >= vanillaAt;

    // A recipe key can carry its own yield: ['Agaricus Chumcap, 8'] makes 8.
    let name = rawKey;
    let yields = 1;
    const keyComma = rawKey.lastIndexOf(",");
    if (keyComma > -1) {
      const tail = rawKey.slice(keyComma + 1).trim();
      if (/^\d[\d,]*$/.test(tail)) {
        name = rawKey.slice(0, keyComma).trim();
        yields = Number(tail.replace(/,/g, ""));
      }
    }

    /*
     * The key rarely carries its own yield (`Agaricus Chumcap, 8` above); the
     * module's usual place for it is the trailing `Output` argument instead,
     * e.g. `Output = 'Haste Block, 8'`. Only read when it is unambiguous: a
     * single name (no `;`, which is a list of per-variant outputs such as
     * Diamond Head's seven Golden-Head recipes, and picking one would be a
     * guess about which variant it belongs to) whose name, once its own
     * comma-quantity is stripped, is the SAME item this entry already is.
     * Verified live 2026-08-03 against Haste Block's own infobox
     * (`Output = Haste Block, 8`, matching the wiki's stated 8-per-craft)
     * and against Enchanted Paper's, where the single-name rule correctly
     * declines: its Output is a two-entry list and the wiki's own infobox
     * states the 192-Sugar-Cane recipe yields 1, which is what the existing
     * default already gave it.
     */
    if (yields === 1) {
      const output = argsBlob.match(/Output\s*=\s*'((?:[^'\\]|\\.)*)'/);
      if (output && !output[1].includes(";")) {
        const outComma = output[1].lastIndexOf(",");
        const outTail = outComma > -1 ? output[1].slice(outComma + 1).trim() : "";
        if (/^\d[\d,]*$/.test(outTail)) {
          const outName = output[1].slice(0, outComma).trim().replace(/\\'/g, "'");
          if (norm(outName) === norm(name)) yields = Number(outTail.replace(/,/g, ""));
        }
      }
    }

    /*
     * `//` separates alternate recipe variants, per the module's own header
     * comment ("part 3: animated recipe -- separate each recipe with '//'").
     * Only the first variant is read. Summing every variant, which is what
     * scanning the whole body did, is wrong twice over: when the variants
     * restate the same total in a different slot shape it doubles every
     * shared ingredient (Enchanted Charcoal's two variants each need 128 Coal
     * + 32 Log; merging both gave 256 Coal + 64 Log), and when the variants
     * are genuinely different choices it unions mutually exclusive options
     * into one requirement (Beacon Block's three variants each use ONE of
     * Catalyst, Hyper Catalyst or Eternal Crystal; merging asked for all
     * three at once, on top of tripled Glass and Obsidian). Verified live
     * 2026-08-03 against the items' own infoboxes: Enchanted Charcoal states
     * `mat_cost_bazaar = *128 Coal *32 Oak Wood` and Beacon Block states
     * `ingredients = ... 3 Obsidian, 5 Glass` plus one Nether Star item; both
     * match the first variant exactly and neither matches the summed total.
     */
    const firstVariant = body.split("//")[0];

    const merged = new Map<string, { name: string; qty: number; alternatives: string[] }>();
    for (const [, spec, slotBody] of firstVariant.matchAll(/([ABC*][ABC*123]*)\s+"([^"]+)"/g)) {
      const slots = countSlots(spec);
      if (!slots) continue;

      const options = parseSlotBody(slotBody);
      if (!options.length) continue;

      const primary = options[0];
      const key = norm(primary.name);
      const qty = slots * primary.per;

      const existing = merged.get(key);
      if (existing) existing.qty += qty;
      else merged.set(key, { name: primary.name, qty, alternatives: options.slice(1).map((o) => o.name) });
    }

    if (merged.size) recipes.set(name, { yields, ingredients: [...merged.values()], ...(vanilla ? { vanilla: true } : {}) });
  }

  return recipes;
};

/**
 * Collection tiers that grant an item or its recipe.
 * Shape: ['Acacia Log'] = { [3] = { required = 250, reward = {{ 'X', type = 'Recipe' }} } }
 */
export const parseCollectionLua = (lua: string): Map<string, CollectionUnlock[]> => {
  const unlocks = new Map<string, CollectionUnlock[]>();
  const blocks = [...lua.matchAll(/\n\t\['([^']+)'\]\s*=\s*\{/g)];

  for (let i = 0; i < blocks.length; i++) {
    const collection = blocks[i][1];
    const start = blocks[i].index!;
    const end = i + 1 < blocks.length ? blocks[i + 1].index! : lua.length;
    const body = lua.slice(start, end);

    const tiers = [...body.matchAll(/\[(\d+)\]\s*=\s*\{\s*required\s*=\s*(\d+)([\s\S]*?)(?=\n\t\t\[\d+\]\s*=|\n\t\}|$)/g)];
    for (const [, tierStr, requiredStr, rest] of tiers) {
      for (const [, rewardName, type] of rest.matchAll(/\{\s*'([^']+)',\s*type\s*=\s*'([^']+)'\s*\}/g)) {
        if (type !== "Recipe" && type !== "Trade" && type !== "Dwarven Forge Recipe") continue;
        const k = norm(rewardName);
        if (!unlocks.has(k)) unlocks.set(k, []);
        unlocks.get(k)!.push({
          collection,
          tier: Number(tierStr),
          required: Number(requiredStr),
          type: type as CollectionUnlock["type"],
        });
      }
    }
  }

  return unlocks;
};

const rawModule = async (page: string, signal?: AbortSignal): Promise<string> => {
  const res = await fetch(`${WIKI}/index.php?title=${encodeURIComponent(page)}&action=raw`, { signal });
  if (!res.ok) throw new Error(`${page} responded ${res.status}`);
  return res.text();
};

export interface CraftingSnapshot {
  fetchedAt: number;
  items: ItemIndex;
}

const readCache = (): CraftingSnapshot | null => {
  try {
    for (const k of STALE_KEYS) localStorage.removeItem(k);
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CraftingSnapshot;
    return parsed?.items && parsed.fetchedAt ? parsed : null;
  } catch {
    return null;
  }
};

const writeCache = (snap: CraftingSnapshot) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(snap));
  } catch {
    // Payload is a few hundred KB and quotas vary. Losing the cache only
    // means refetching, so this is not worth surfacing.
  }
};

export interface HypixelItem {
  name?: string;
  id: string;
  tier?: string;
  category?: string;
  npc_sell_price?: number;
  /**
   * Requirements Hypixel states for the item, e.g. a slayer level needed to
   * buy or craft it. Present on a minority of items and carried through
   * untouched; see `ItemRequirement` for why it stays loosely typed.
   */
  requirements?: ItemRequirement[];
  /** Stat block, used to tell a farming accessory from a combat one. */
  stats?: Record<string, unknown>;
  /**
   * Where the item comes from, when Hypixel states it. The one value this
   * project consumes is `"RIFT"`, which is Hypixel's own claim that the item
   * is obtained inside the Rift Dimension; the accessories page splits its
   * Rift band on it. Absent on the large majority of items.
   */
  origin?: string;
  /**
   * Hypixel's own statement that the item may cross the dimension boundary:
   * a rift-transferable piece works both inside and outside the Rift. Present
   * (and always `true`) on 68 items as of 2026-08-03, 20 of them accessories;
   * absent everywhere else. Note Hypixel's spelling carries the double r.
   */
  rift_transferrable?: boolean;
  /**
   * Mojang texture property, present on every skull item.
   *
   * Nothing in this module reads it. It is declared so the type tells the truth
   * about what the response carries, because the array is handed to
   * `itemResource`, which does read it.
   */
  skin?: { value?: string } | null;
}

/**
 * Hypixel categories whose items belong in the index even with no grid recipe.
 *
 * The index is otherwise built from what the crafting module mentions, which is
 * the right rule for a crafting database and the wrong one for anything the
 * game hands you by another route. Greenhouse mutations are grown, not crafted,
 * so only the 15 of 40 that happen to be an ingredient in some recipe used to
 * survive. The other 25 were dropped along with their Hypixel ids, and that id
 * is the only bridge between an item here and what the player actually owns:
 * the island feed, the API sacks and the shard tally are all keyed by it. So
 * "need / have / missing" silently had nothing to match against and fell back
 * to manual entry.
 *
 * This is Hypixel's own categorisation, read from the resource the index
 * already fetches, so no id is invented and no list is bundled. An item the
 * resource does not name keeps a null `hypixelId`, which is the honest answer.
 *
 * ACCESSORY was added for the same reason, measured rather than assumed. Of the
 * 411 accessories Hypixel lists, only 179 are mentioned anywhere in the
 * crafting module; the other 232 appear in no recipe as either an output or an
 * ingredient and were therefore absent from this index entirely. That is not a
 * long tail of obscure items, it is most of the category, and it is skewed
 * exactly the wrong way: the ones that fall out are the ones with no recipe,
 * which is to say the quest rewards, the Dark Auction items, the mob drops and
 * the event hats. Anita's Talisman, Pesthunter Ring and the Hats of
 * Celebration were all invisible here.
 *
 * The accessories page is a checklist of what a player is missing and where to
 * get it, so an item having no recipe is the reason it belongs on the page, not
 * a reason to drop it. Including the category also makes every accessory
 * linkable from `/items`, which is what the page's cross-links point at.
 */
const RECIPELESS_CATEGORIES = new Set(["MUTATION", "ACCESSORY"]);

/**
 * Turn the three parsed sources into the item index.
 *
 * Pure, so it can be tested without the network.
 */
export const buildItemIndex = (
  recipes: Map<string, ParsedRecipe>,
  unlocks: Map<string, CollectionUnlock[]>,
  hypixelItems: HypixelItem[]
): ItemIndex => {
  const meta = new Map<
    string,
    {
      id: string;
      tier: string | null;
      category: string | null;
      npcSell: number | null;
      requirements: ItemRequirement[] | null;
      stats: Record<string, unknown> | null;
      origin: string | null;
      riftTransferable: boolean;
    }
  >();
  for (const it of hypixelItems) {
    if (!it.name) continue;
    const k = norm(it.name);
    if (!meta.has(k)) {
      meta.set(k, {
        id: it.id,
        /*
         * "UNOBTAINABLE" is Hypixel's flag for admin relics, not a rarity:
         * nothing on the ladder can render it, so keeping it buys no colour
         * and costs a real one. The concrete casualty was Enchanted Clock:
         * the resource carries ENCHANTED_CLOCK (the admin relic, tier
         * UNOBTAINABLE) and ENCHANTED_TIME_CLOCK (the craftable LEGENDARY
         * item) under the same display name, and first-wins handed the
         * craftable clock the relic's non-rarity, which blocked the wiki
         * tier fill from ever asking. Dropped here, the name resolves to a
         * null tier and the wiki answers Legendary.
         */
        tier: it.tier && it.tier !== "UNOBTAINABLE" ? it.tier : null,
        category: it.category ?? null,
        npcSell: typeof it.npc_sell_price === "number" ? it.npc_sell_price : null,
        requirements: Array.isArray(it.requirements) && it.requirements.length > 0 ? it.requirements : null,
        stats: it.stats && typeof it.stats === "object" ? it.stats : null,
        origin: typeof it.origin === "string" && it.origin ? it.origin : null,
        riftTransferable: it.rift_transferrable === true,
      });
    }
  }

  /** Wiki variants such as "Aspect of the Leech (Rare)" fall back to the base name. */
  const resolve = (name: string) => {
    const direct = meta.get(norm(name));
    if (direct) return direct;
    const stripped = name.replace(/\s*\([^)]*\)\s*$/, "").trim();
    return stripped !== name ? meta.get(norm(stripped)) ?? null : null;
  };

  const seen = new Set<string>();
  for (const [name, r] of recipes) {
    seen.add(name);
    for (const i of r.ingredients) seen.add(i.name);
  }
  // Names Hypixel itself gives us for things no recipe mentions.
  for (const it of hypixelItems) {
    if (it.name && it.category && RECIPELESS_CATEGORIES.has(it.category)) seen.add(it.name);
  }

  const items: ItemIndex = {};
  for (const name of seen) {
    const id = slug(name);
    const m = resolve(name);
    const r = recipes.get(name);

    /*
     * VANILLA, AND THE RESCUE THAT MAKES THE FLAG TRUSTWORTHY
     * -------------------------------------------------------
     * Vanilla recipes are hidden by default; this index is for SkyBlock
     * item crafting. The module's own section marker
     * is the classifier (see `ParsedRecipe.vanilla`), but it is a page other
     * people edit, and edited it has been: eight real SkyBlock items (Juju
     * Shortbow, Jasper Power Scroll, the whole misfiled J-cluster) sit in the
     * vanilla section because someone inserted them alphabetically into the
     * wrong half. So the marker alone would hide a dungeon bow.
     *
     * The rescue is Hypixel's word against the misfile: an item the resource
     * states a rarity for is one the game treats as a SkyBlock item, whatever
     * section its recipe was typed into. Measured live 2026-08-03: the rescue
     * recovers all 8 misfiled items plus 9 vanilla-shaped ones Hypixel itself
     * tiers (Diamond tools UNCOMMON, Crafting Table and Ender Chest RARE),
     * which stay visible on exactly that stated ground. Two misfiled items
     * have no resource tier (Jerry Helmet, Jungle Biome Stick) and stay
     * behind the toggle; hidden is stated, never silent, so they are one
     * click away rather than gone.
     */
    const vanilla = Boolean(r?.vanilla) && !m?.tier;

    items[id] = {
      name,
      hypixelId: m?.id ?? null,
      ...(vanilla ? { vanilla: true } : {}),
      tier: m?.tier ?? null,
      category: m?.category ?? null,
      npcSell: m?.npcSell ?? null,
      requirements: m?.requirements ?? null,
      stats: m?.stats ?? null,
      origin: m?.origin ?? null,
      ...(m?.riftTransferable ? { riftTransferable: true } : {}),
      yields: r?.yields ?? 1,
      recipe:
        r?.ingredients.map((i) => ({
          id: slug(i.name),
          name: i.name,
          qty: i.qty,
          ...(i.alternatives.length ? { alternatives: i.alternatives.map((a) => ({ id: slug(a), name: a })) } : {}),
        })) ?? null,
      ...(unlocks.has(norm(name)) ? { unlocks: unlocks.get(norm(name)) } : {}),
    } as Item;
  }

  // Reverse index: what each item feeds into. Capped so staples do not carry
  // a list of hundreds.
  const USED_IN_CAP = 40;
  for (const [id, it] of Object.entries(items)) {
    if (!it.recipe) continue;
    for (const ing of it.recipe) {
      const target = items[ing.id];
      if (!target) continue;
      if (!target.usedIn) target.usedIn = [];
      if (target.usedIn.length < USED_IN_CAP) target.usedIn.push(id);
      target.usedInTotal = (target.usedInTotal ?? 0) + 1;
    }
  }

  return items;
};

/**
 * Build the whole item index in the browser.
 *
 * Three sources, all CORS-open and all keyless: the wiki's crafting and
 * collection modules, plus Hypixel's item metadata for tier, category and NPC
 * sell price. Nothing here is shipped with the app.
 */
export const fetchCraftingData = async (signal?: AbortSignal): Promise<CraftingSnapshot> => {
  const [craftLua, collLua, hypixel] = await Promise.all([
    rawModule("Module:Crafting/Data", signal),
    rawModule("Module:Collection/Data", signal).catch(() => ""),
    fetch("https://api.hypixel.net/v2/resources/skyblock/items", { signal })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .catch(() => ({ items: [] as unknown[] })),
  ]);

  const resourceItems = (hypixel as { items?: HypixelItem[] }).items ?? [];

  // The icon ladder needs two more columns of this same response: Hypixel's own
  // display name for ids that do not spell it, and the `skin.value` that draws
  // a player head. Handing the array over here is what keeps that free, since
  // the alternative is a second download of the same few megabytes. This is a
  // publish, not a parse: nothing below depends on it and it cannot throw.
  adoptResourceItems(resourceItems);

  const items = buildItemIndex(
    parseCraftingLua(craftLua),
    collLua ? parseCollectionLua(collLua) : new Map<string, CollectionUnlock[]>(),
    resourceItems
  );

  const snap: CraftingSnapshot = { fetchedAt: Date.now(), items };
  writeCache(snap);
  return snap;
};

export const readCraftingCache = readCache;
