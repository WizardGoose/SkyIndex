#!/usr/bin/env node
/**
 * Build the crafting database for every SkyBlock item.
 *
 *   node tools/build-recipes.mjs
 *
 * Source is the wiki's Module:Crafting/Data, which holds every crafting-grid
 * recipe in "Quick Recipe Syntax". Item metadata (tier, category) comes from
 * the keyless Hypixel resources endpoint, joined by display name.
 *
 * Output: public/items/recipes.json
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const LUA = "data/wiki/modules/Module_Crafting_Data.lua";
const COLLECTIONS = "data/wiki/modules/Module_Collection_Data.lua";
const OUT_DIR = "public/items";
const OUT = path.join(OUT_DIR, "recipes.json");

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

/** Slots a QRS spec covers. Rows A-C, columns 1-3, `*` means all. */
const countSlots = (spec) => {
  const slots = new Set();
  for (const [, rowPart, colPart] of spec.matchAll(/([ABC*])([123]+|\*)/g)) {
    const rows = rowPart === "*" ? ["A", "B", "C"] : [rowPart];
    const cols = colPart === "*" ? ["1", "2", "3"] : colPart.split("");
    for (const r of rows) for (const c of cols) slots.add(r + c);
  }
  return slots.size;
};

/**
 * Split one slot's contents into the item(s) that satisfy it.
 *
 * Editors write three things in here that all need handling:
 *   "Enchanted Iron Ingot, 64"                     item plus per-slot quantity
 *   "Scylla; Hyperion; Valkyrie"                   any ONE of these works
 *   "Enchanted Magma Cream, 12; "                  both, with trailing junk
 */
const parseSlotBody = (body) => {
  const options = body
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  return options.map((opt) => {
    const comma = opt.lastIndexOf(",");
    if (comma > -1) {
      const tail = opt.slice(comma + 1).trim();
      if (/^\d[\d,]*$/.test(tail)) {
        return { name: opt.slice(0, comma).trim().replace(/\\'/g, "'"), per: Number(tail.replace(/,/g, "")) };
      }
    }
    return { name: opt.replace(/\\'/g, "'"), per: 1 };
  });
};

const main = async () => {
  const lua = readFileSync(LUA, "utf8");

  // ---- 1. Parse every recipe ------------------------------------------
  const recipes = new Map();
  for (const [, rawName, body] of lua.matchAll(/\['((?:[^'\\]|\\.)+)'\]\s*=\s*\{'((?:[^'\\]|\\.)*)'\}/g)) {
    const rawKey = rawName.replace(/\\'/g, "'");
    if (/test item/i.test(rawKey)) continue; // wiki sandbox entries
    if (/^\{\d+\}$/.test(rawKey.trim())) continue; // template placeholders

    /**
     * A recipe key can carry its own yield: ['Agaricus Chumcap, 8'] means one
     * craft produces 8. Missing this treats every recipe as making 1, which
     * overstates the cost of anything that batches.
     */
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

    const merged = new Map();
    for (const [, spec, slotBody] of body.matchAll(/([ABC*][ABC*123]*)\s+"([^"]+)"/g)) {
      const slots = countSlots(spec);
      if (!slots) continue;

      // `{0}` / `{1}` are unexpanded template parameters, not real items.
      const options = parseSlotBody(slotBody).filter((o) => !/^\{\d+\}$/.test(o.name.trim()));
      if (!options.length) continue;

      // The first option is the canonical ingredient; the rest are swaps.
      const primary = options[0];
      const key = norm(primary.name);
      const qty = slots * primary.per;

      if (merged.has(key)) merged.get(key).qty += qty;
      else
        merged.set(key, {
          name: primary.name,
          qty,
          alternatives: options.slice(1).map((o) => o.name),
        });
    }

    if (merged.size) recipes.set(name, { yields, ingredients: [...merged.values()] });
  }

  console.log(`Parsed ${recipes.size} recipes from Module:Crafting/Data`);

  // ---- 2. Join to Hypixel item metadata --------------------------------
  let meta = new Map();
  try {
    const res = await fetch("https://api.hypixel.net/v2/resources/skyblock/items");
    const { items } = await res.json();
    for (const it of items ?? []) {
      if (!it.name) continue;
      const k = norm(it.name);
      if (!meta.has(k))
        meta.set(k, {
          id: it.id,
          tier: it.tier ?? null,
          category: it.category ?? null,
          // Proves the item is NPC-sellable and gives its floor value.
          npcSell: typeof it.npc_sell_price === "number" ? it.npc_sell_price : null,
        });
    }
    console.log(`Fetched metadata for ${meta.size} named items`);
  } catch (err) {
    console.warn(`! Hypixel items unavailable (${err.message}). Continuing without tiers.`);
  }

  /**
   * Resolve a display name to Hypixel metadata.
   * Falls back to the base name when the wiki appends a variant such as
   * "Aspect of the Leech (Rare)", which the API lists without the suffix.
   */
  const resolve = (name) => {
    const direct = meta.get(norm(name));
    if (direct) return direct;
    const stripped = name.replace(/\s*\([^)]*\)\s*$/, "").trim();
    if (stripped !== name) {
      const viaBase = meta.get(norm(stripped));
      if (viaBase) return viaBase;
    }
    return null;
  };

  // ---- 2b. Collection unlocks ------------------------------------------
  /**
   * Which collection tier hands you an item, and at what threshold.
   *
   * Collection/Data is shaped as:
   *   ['Acacia Log'] = { minion = 'Acacia',
   *     [3] = { required = 250, reward = { { 'Enchanted Acacia Log', type = 'Recipe' } } } }
   *
   * The reward type matters: a Recipe unlock means you can craft it once the
   * tier is reached, while a Trade means an NPC will swap for it. Both are
   * real answers to "where does this come from", so both are kept.
   */
  const unlocks = new Map(); // normalised item name -> [{ collection, tier, required, type }]
  try {
    const collLua = readFileSync(COLLECTIONS, "utf8");
    const blocks = [...collLua.matchAll(/\n\t\['([^']+)'\]\s*=\s*\{/g)];

    for (let i = 0; i < blocks.length; i++) {
      const collection = blocks[i][1];
      const start = blocks[i].index;
      const end = i + 1 < blocks.length ? blocks[i + 1].index : collLua.length;
      const body = collLua.slice(start, end);

      // Each numbered tier carries its own `required` and reward list.
      const tiers = [...body.matchAll(/\[(\d+)\]\s*=\s*\{\s*required\s*=\s*(\d+)([\s\S]*?)(?=\n\t\t\[\d+\]\s*=|\n\t\}|$)/g)];
      for (const [, tierStr, requiredStr, rest] of tiers) {
        for (const [, rewardName, type] of rest.matchAll(/\{\s*'([^']+)',\s*type\s*=\s*'([^']+)'\s*\}/g)) {
          if (type !== "Recipe" && type !== "Trade" && type !== "Dwarven Forge Recipe") continue;
          const k = norm(rewardName);
          if (!unlocks.has(k)) unlocks.set(k, []);
          unlocks.get(k).push({ collection, tier: Number(tierStr), required: Number(requiredStr), type });
        }
      }
    }
    console.log(`Parsed ${unlocks.size} items with a collection unlock from ${blocks.length} collections`);
  } catch (err) {
    console.warn(`! Collection data unavailable (${err.message}). Continuing without unlocks.`);
  }

  // ---- 3. Build the item index -----------------------------------------
  const seen = new Set();
  for (const [name, r] of recipes) {
    seen.add(name);
    for (const i of r.ingredients) seen.add(i.name);
  }

  const items = {};
  let matched = 0;

  for (const name of seen) {
    const id = slug(name);
    const m = resolve(name);
    if (m) matched += 1;

    items[id] = {
      name,
      hypixelId: m?.id ?? null,
      tier: m?.tier ?? null,
      category: m?.category ?? null,
      npcSell: m?.npcSell ?? null,
      ...(unlocks.has(norm(name)) ? { unlocks: unlocks.get(norm(name)) } : {}),
      ...(recipes.has(name)
        ? {
            yields: recipes.get(name).yields,
            recipe: recipes.get(name).ingredients.map((i) => ({
              id: slug(i.name),
              name: i.name,
              qty: i.qty,
              ...(i.alternatives.length ? { alternatives: i.alternatives.map((a) => ({ id: slug(a), name: a })) } : {}),
            })),
          }
        : { yields: 1, recipe: null }),
    };
  }

  /**
   * Reverse index: what each item feeds into.
   *
   * The forward recipe answers "what do I need"; this answers "what is this
   * for", which is the other half of why you would look an item up at all.
   * Capped per item so a staple like Enchanted Iron Ingot does not carry a
   * list of hundreds into the payload.
   */
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

  const craftable = Object.values(items).filter((i) => i.recipe).length;
  const pct = ((matched / seen.size) * 100).toFixed(1);

  console.log(`Indexed ${seen.size} items, ${craftable} craftable`);
  console.log(`Matched to a Hypixel id: ${matched} (${pct}%)`);

  const unmatched = Object.values(items)
    .filter((i) => !i.hypixelId)
    .map((i) => i.name);
  console.log(`Unmatched: ${unmatched.length}`);
  console.log(unmatched.slice(0, 12).map((n) => "   " + n).join("\n"));

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT, JSON.stringify({ items }, null, 0));
  const bytes = readFileSync(OUT).length;
  console.log(`\nWrote ${OUT} (${(bytes / 1024).toFixed(0)} KB)`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
