#!/usr/bin/env node
/**
 * Capture real Hypixel item documents as networth test fixtures.
 *
 *   node tools/capture-networth-fixture.mjs
 *
 * Writes tools/fixtures/networth/{preparsed,blobs,catalogue,member}.json.
 * Pass --member-only to rewrite just member.json and leave the others alone.
 *
 * Every item document here comes verbatim off the keyless Hypixel API. Nothing
 * is hand-written, because a hand-written item is a guess about a shape the
 * calculator has to parse, and a guess that agrees with the parser proves
 * nothing. The only synthetic values are integer counts (sack amounts, essence
 * magnitudes, coin balances), where the shape is just "a number".
 */
import { createRequire } from "node:module";
import { gunzip, gzipSync } from "node:zlib";
import { promisify } from "node:util";
import { writeFileSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";

const gunzipAsync = promisify(gunzip);

// prismarine-nbt is not a direct dependency; it reaches us through
// skyhelper-networth, so resolve it from that package rather than from here.
const require = createRequire(import.meta.url);
const nbt = createRequire(require.resolve("skyhelper-networth"))("prismarine-nbt");

const OUT_DIR = "tools/fixtures/networth";
const API = "https://api.hypixel.net/v2";

/**
 * Two pages (the obvious first choice) only surface about 19 of the modifier
 * keys below, under the 25 the fixture has to cover. Rare modifiers such as
 * hook, wood_singularity_count and mana_disintegrator_count appear roughly
 * once per 8000 listings, so the page count is what buys coverage. Eight pages
 * measured 37 of 44 keys.
 */
const AUCTION_PAGES = 8;

// tag.ExtraAttributes keys that change an item's value. Coverage of this list
// is what the fixture is for.
const MODIFIER_KEYS = [
  "rarity_upgrades", "enchantments", "modifier", "gems", "dungeon_item_level",
  "upgrade_level", "hot_potato_count", "art_of_war_count", "artOfPeaceApplied",
  "ability_scroll", "ethermerge", "drill_part_engine", "drill_part_fuel_tank",
  "drill_part_upgrade_module", "line", "hook", "sinker", "talisman_enrichment",
  "wood_singularity_count", "jalapeno_count", "mana_disintegrator_count",
  "tuned_transmission", "farming_for_dummies_count", "polarvoid",
  "divan_powder_coating", "power_ability_scroll", "sack_pss", "thunder_charge",
  "runes", "dye_item", "skin", "petInfo", "new_years_cake",
  "new_year_cake_bag_data", "winning_bid", "collected_coins", "boosters",
  "levelable_overclocks", "party_hat_color", "party_hat_emoji", "is_shiny",
  "edition", "price", "donated_museum",
];

// Bucket sizes mirror a real profile's pre-parsed item categories. The sum is
// the selection target, so every selected item lands somewhere and no bucket
// has to repeat an item.
const BUCKETS = [
  ["inventory", 36], ["enderchest", 54], ["accessories", 30], ["storage", 40],
  ["wardrobe", 16], ["armor", 4], ["equipment", 4], ["museum", 20],
  ["personal_vault", 5], ["fishing_bag", 5], ["potion_bag", 5], ["quiver", 3],
  ["candy_inventory", 3], ["carnival_mask_inventory", 2], ["sacks_bag", 3],
  ["farming_toolkit", 2], ["hunting_toolkit", 2],
];
const CAPACITY = BUCKETS.reduce((n, [, size]) => n + size, 0);

// Pets carry a modifier key but the pets_data array is where their value is
// actually read from, so the item pool only needs enough of them to exercise
// petInfo parsing. Uncapped they would be ~880 of ~230 slots.
const PET_ITEM_CAP = 45;
const PET_ENTRY_CAP = 40;
const MIN_PLAIN = 12;
const SACK_COUNT = 120;

// Real essence types at realistic magnitudes, per docs/hypixel-api-cheatsheet.md.
const ESSENCE = [
  ["WITHER", 892], ["UNDEAD", 3065], ["DRAGON", 22], ["GOLD", 863],
  ["DIAMOND", 2491], ["ICE", 4445], ["SPIDER", 1391], ["CRIMSON", 782],
];

const fetchJson = async (url, tries = 3) => {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      if (body.success === false) throw new Error(body.cause || "success:false");
      return body;
    } catch (err) {
      if (attempt >= tries) throw new Error(`${url}: ${err.message}`);
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
};

/** item_bytes is base64 of a gzipped NBT compound whose `i` list holds items. */
const decodeItemBytes = async (base64) => {
  const buf = await gunzipAsync(Buffer.from(base64, "base64"));
  const parsed = await nbt.protos.big.parsePacketBuffer("nbt", buf, 0);
  const simplified = nbt.simplify(parsed.data);
  return Array.isArray(simplified.i) ? simplified.i : [];
};

const mapLimit = async (items, limit, fn) => {
  const out = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
};

const extraAttributes = (item) => item?.tag?.ExtraAttributes ?? null;

const modifierKeysOn = (item) => {
  const ea = extraAttributes(item);
  if (!ea) return [];
  return MODIFIER_KEYS.filter((k) => ea[k] !== undefined);
};

/** ExtraAttributes carrying nothing but an id: the no-modifier baseline case. */
const isPlain = (item) => {
  const ea = extraAttributes(item);
  return !!ea && Object.keys(ea).length === 1 && typeof ea.id === "string";
};

/**
 * A toolkit blob, which is NOT a container.
 *
 * Farming and hunting toolkits store each tool as an NBT document whose ROOT
 * compound is the item's ExtraAttributes: no `i` list, no display name. The
 * auction endpoints only ever hand out containers, so there is nothing verbatim
 * to capture for this shape and it has to be built.
 *
 * It is built with prismarine-nbt, the reference implementation, on purpose.
 * Both the library and this project's own decoder then read bytes neither of
 * them wrote, which makes the toolkit rows of the assembly gate a check on our
 * decoder as well as on our assembly.
 */
const toolkitBlob = (id, extra = {}) => {
  const value = { id: { type: "string", value: id } };
  for (const [key, entry] of Object.entries(extra)) value[key] = entry;
  const plain = nbt.writeUncompressed({ type: "compound", name: "", value });
  return gzipSync(plain).toString("base64");
};

/**
 * A whole profile member, assembled from verbatim single-item blobs.
 *
 * WHY THIS EXISTS ALONGSIDE preparsed.json. That fixture starts at the point
 * where items have already been sorted into categories, which is exactly the
 * step this one exercises. Category ASSEMBLY is a different failure surface
 * from valuation: an item counted in the wrong category, or twice, or not at
 * all, moves the total without any handler being wrong, and a fixture that
 * begins after assembly cannot see it.
 *
 * Every container field gets its own single-item blob so the expected count per
 * category is exactly known. Three cases are deliberately planted because they
 * are the assembly rules most likely to be got wrong:
 *
 *   a borrowed museum entry, which must NOT be counted (it is somebody else's)
 *   a toolkit slot flagged IN_USE, which must NOT be counted (it is already in
 *     the inventory blob, so counting it would double)
 *   sacks_counts present BOTH at the top level and nested, with different
 *     contents, so the precedence rule is pinned rather than assumed
 */
const buildMember = (decodedRows) => {
  const singles = [];
  const seen = new Set();
  for (const row of decodedRows) {
    if (!row || row.items.length !== 1) continue;
    const item = row.items[0];
    if (!item || extraAttributes(item)?.id === undefined) continue;
    if (seen.has(row.base64)) continue;
    seen.add(row.base64);
    singles.push(row.base64);
  }

  let cursor = 0;
  const next = () => {
    if (cursor >= singles.length) throw new Error("ran out of single-item blobs");
    return { type: 0, data: singles[cursor++] };
  };

  const loadoutArmor = {};
  for (const i of [0, 1, 2]) {
    loadoutArmor[i] = { id: i, HELMET: next(), CHESTPLATE: next(), LEGGINGS: next(), BOOTS: next() };
  }

  const loadoutEquipment = {};
  for (const i of [0, 1, 2]) {
    loadoutEquipment[i] = {
      id: i,
      EQUIPMENT_SLOT_1: next(),
      EQUIPMENT_SLOT_2: next(),
      EQUIPMENT_SLOT_3: next(),
      EQUIPMENT_SLOT_4: next(),
    };
  }

  const member = {
    // `#validate` upstream needs one of profile, player_data or leveling.
    leveling: { experience: 38220 },
    profile: { bank_account: 12500000 },
    currencies: {
      coin_purse: 10763000,
      essence: Object.fromEntries(ESSENCE.map(([n, amount]) => [n, { current: amount }])),
    },
    // Both spellings, with different contents. Upstream reads the top level
    // first; this fixture is what stops that rule being quietly re-decided.
    sacks_counts: { ENCHANTED_DIAMOND: 64, WHEAT: 1000 },
    inventory: {
      inv_armor: next(),
      equipment_contents: next(),
      inv_contents: next(),
      ender_chest_contents: next(),
      personal_vault_contents: next(),
      bag_contents: {
        talisman_bag: next(),
        fishing_bag: next(),
        potion_bag: next(),
        sacks_bag: next(),
        quiver: next(),
      },
      backpack_contents: { 0: next(), 1: next(), 2: next() },
      backpack_icons: { 0: next(), 1: next(), 2: next() },
      sacks_counts: { COBBLESTONE: 12345, ENCHANTED_COBBLESTONE: 7 },
    },
    shared_inventory: {
      candy_inventory_contents: next(),
      carnival_mask_inventory_contents: next(),
    },
    loadout: { armor: loadoutArmor, equipment: loadoutEquipment },
    garden_player_data: {
      farming_toolkit: {
        IS_UNLOCKED: true,
        CACTUS: { 0: { type: 0, data: toolkitBlob("ADVANCED_GARDENING_HOE") } },
        // IN_USE, so it is already in inv_contents and must not count twice.
        MELON: { 0: { type: 0, data: toolkitBlob("ADVANCED_GARDENING_AXE") } },
        IN_USE: { CACTUS: { 0: false }, MELON: { 0: true } },
      },
    },
    foraging: {
      hunting_toolkit: {
        IS_UNLOCKED: true,
        FISHING_NET: { 0: { type: 0, data: toolkitBlob("FISHING_NET") } },
        LASSO: { 0: { type: 0, data: toolkitBlob("LASSO") } },
        IN_USE: { FISHING_NET: { 0: false }, LASSO: { 0: false } },
      },
    },
    pets_data: { pets: [] },
  };

  const museum = {
    items: {
      HYPERION: { donated_time: 1, items: next() },
      // Borrowed: on loan from a co-op member, so not this player's worth.
      NECRON_HELMET: { donated_time: 2, borrowing: true, items: next() },
      SHADOW_FURY: { donated_time: 3, items: next() },
    },
    special: [{ items: next() }, { items: next() }],
  };

  return {
    member,
    museum,
    bankBalance: 189827987.09277594,
    /**
     * What each category must come to, counted by hand from the layout above.
     * Written down so the gate fails on a silent change to either side rather
     * than on only the two sides disagreeing with each other.
     */
    expectedCounts: {
      armor: 1,
      // One worn plus twelve loadout slots. This is the number that started
      // the whole assembly investigation.
      equipment: 13,
      inventory: 1,
      enderchest: 1,
      accessories: 1,
      personal_vault: 1,
      fishing_bag: 1,
      potion_bag: 1,
      sacks_bag: 1,
      quiver: 1,
      candy_inventory: 1,
      carnival_mask_inventory: 1,
      storage: 6,
      wardrobe: 12,
      // Two donated plus two special. The borrowed one is excluded.
      museum: 4,
      farming_toolkit: 1,
      hunting_toolkit: 2,
      // The TOP LEVEL map wins, and it has two entries.
      sacks: 2,
      essence: ESSENCE.length,
      pets: 0,
    },
    blobsUsed: cursor,
  };
};

const main = async () => {
  const memberOnly = process.argv.includes("--member-only");
  const capturedAt = new Date().toISOString();
  const source =
    `${API}/skyblock/auctions (pages 0-${AUCTION_PAGES - 1}) and /auctions_ended,` +
    " keyless; item documents verbatim";

  process.stderr.write(`fetching ${AUCTION_PAGES} auction pages plus auctions_ended\n`);
  const pages = await mapLimit(
    Array.from({ length: AUCTION_PAGES }, (_, p) => p),
    4,
    (p) => fetchJson(`${API}/skyblock/auctions?page=${p}`),
  );
  const ended = await fetchJson(`${API}/skyblock/auctions_ended`);

  const rows = [];
  for (const page of pages) rows.push(...(page.auctions ?? []));
  rows.push(...(ended.auctions ?? []));
  process.stderr.write(`decoding ${rows.length} auction rows\n`);

  // Decode once, then work purely off the decoded pool.
  const decodedRows = await mapLimit(rows, 16, async (row) => {
    try {
      return { base64: row.item_bytes, items: await decodeItemBytes(row.item_bytes) };
    } catch {
      return null;
    }
  });

  mkdirSync(OUT_DIR, { recursive: true });
  const write = (name, payload) => {
    const file = path.join(OUT_DIR, name);
    writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
    return { file, bytes: statSync(file).size };
  };

  /**
   * The raw member fixture is built from the same decoded rows but shares none
   * of the selection logic below, so it can be regenerated on its own.
   *
   * `--member-only` exists because the other three fixtures are already good
   * and the auction house changes by the minute: regenerating them to add an
   * unrelated file would swap a known set of captured modifiers for whatever
   * happens to be listed today, for no gain.
   */
  const memberFixture = buildMember(decodedRows);
  const memberPayload = {
    capturedAt,
    source: `${source}; container blobs verbatim, toolkit blobs written with prismarine-nbt`,
    note:
      "A whole profile member, for assembly parity. One single-item blob per container field, " +
      "so every category's expected count is exact. Plants a borrowed museum entry, an IN_USE " +
      "toolkit slot, and both spellings of sacks_counts.",
    ...memberFixture,
  };

  if (memberOnly) {
    const { file, bytes } = write("member.json", memberPayload);
    console.log(`single-item blobs available: ${
      decodedRows.filter((r) => r && r.items.length === 1).length
    }, used: ${memberFixture.blobsUsed}`);
    console.log("expected counts:");
    for (const [k, v] of Object.entries(memberFixture.expectedCounts)) {
      console.log(`  ${k.padEnd(24)} ${v}`);
    }
    console.log(`\n  ${file.padEnd(44)} ${bytes.toLocaleString()} bytes`);
    return;
  }

  const pool = [];
  const seen = new Set();
  for (const row of decodedRows) {
    if (!row) continue;
    for (const item of row.items) {
      if (!item || item.id === undefined) continue;
      const key = JSON.stringify(item);
      if (seen.has(key)) continue; // dedupe by JSON identity
      seen.add(key);
      pool.push({ item, base64: row.base64, keys: modifierKeysOn(item) });
    }
  }
  process.stderr.write(`pool: ${pool.length} distinct item documents\n`);

  // Selection: satisfy the mandated slices first, then take the items carrying
  // the most modifier keys, until the buckets are exactly full.
  const selected = [];
  const taken = new Set();
  const take = (entry) => {
    if (taken.has(entry)) return false;
    if (selected.length >= CAPACITY) return false;
    taken.add(entry);
    selected.push(entry);
    return true;
  };

  /**
   * Coverage comes first. Scoring items by how many modifier keys they carry
   * buries the rare ones: an item with five common keys always outranks the one
   * item in 8000 carrying `hook`, so the rare keys get crowded out of a fixed
   * number of slots. Greedy set cover instead guarantees one item per key that
   * exists in the pool at all, and costs at most one slot per key.
   */
  const poolKeys = new Set();
  for (const entry of pool) for (const k of entry.keys) poolKeys.add(k);

  const uncovered = new Set(poolKeys);
  while (uncovered.size && selected.length < CAPACITY) {
    let best = null;
    let bestGain = 0;
    for (const entry of pool) {
      if (taken.has(entry)) continue;
      let gain = 0;
      for (const k of entry.keys) if (uncovered.has(k)) gain++;
      if (gain > bestGain) {
        bestGain = gain;
        best = entry;
      }
    }
    if (!best) break;
    take(best);
    for (const k of best.keys) uncovered.delete(k);
  }

  const petEntries = pool.filter((e) => extraAttributes(e.item)?.petInfo !== undefined);
  for (const entry of petEntries.slice(0, PET_ITEM_CAP)) take(entry);

  for (const entry of pool.filter((e) => isPlain(e.item)).slice(0, MIN_PLAIN)) take(entry);

  /**
   * ENCHANTED_BOOK is absent from the live auction house: a scan of all 48
   * pages (47,696 listings) found no such item_name, and decoding 6,000+ items
   * across the full page range found no ExtraAttributes.id of ENCHANTED_BOOK.
   * Rather than hand-write book documents, reserve slots for the items with the
   * richest `enchantments` maps, which exercise the same valuation path.
   */
  const enchantRich = pool
    .filter((e) => {
      const ench = extraAttributes(e.item)?.enchantments;
      return ench && Object.keys(ench).length > 0;
    })
    .sort(
      (a, b) =>
        Object.keys(extraAttributes(b.item).enchantments).length -
        Object.keys(extraAttributes(a.item).enchantments).length,
    );
  for (const entry of enchantRich.slice(0, 20)) take(entry);

  // Rarest modifiers first so single-occurrence keys are never crowded out.
  const rarity = new Map(MODIFIER_KEYS.map((k) => [k, 0]));
  for (const entry of pool) for (const k of entry.keys) rarity.set(k, rarity.get(k) + 1);
  const score = (entry) =>
    entry.keys.reduce((n, k) => n + 1 + 1 / (rarity.get(k) || 1), 0);
  for (const entry of [...pool].sort((a, b) => score(b) - score(a))) take(entry);

  // Distribute. Pets are placed only where a profile would actually hold them.
  const items = Object.fromEntries(BUCKETS.map(([name]) => [name, []]));
  const isPet = (entry) => extraAttributes(entry.item)?.petInfo !== undefined;
  const petQueue = selected.filter(isPet);
  const restQueue = selected.filter((e) => !isPet(e));

  for (const [name, size] of BUCKETS) {
    const petFriendly = name === "inventory" || name === "enderchest";
    while (items[name].length < size) {
      let entry = petFriendly && petQueue.length ? petQueue.shift() : restQueue.shift();
      if (!entry) entry = petQueue.shift();
      if (!entry) {
        // Pool exhausted: cycle rather than leave a bucket short.
        const placed = Object.values(items).flat();
        if (!placed.length) break;
        items[name].push(placed[items[name].length % placed.length]);
        continue;
      }
      items[name].push(entry.item);
    }
  }
  // Any pet left over goes to enderchest so no selected pet is silently dropped.
  for (const entry of petQueue) items.enderchest.push(entry.item);

  /**
   * pets_data.pets entries, JSON.parse'd verbatim out of ExtraAttributes.petInfo.
   * Kept exactly as the API returns them: real petInfo carries hideInfo,
   * hideRightClick, noMove, petSoulbound and extraData too, and often omits
   * uuid/uniqueId/heldItem/skin. Normalising to a fixed key list would mean
   * inventing fields the game did not send.
   */
  const pets = [];
  const petSeen = new Set();
  for (const entry of petEntries) {
    if (pets.length >= PET_ENTRY_CAP) break;
    let parsed;
    try {
      parsed = JSON.parse(extraAttributes(entry.item).petInfo);
    } catch {
      continue;
    }
    if (!parsed || typeof parsed !== "object") continue;
    const key = JSON.stringify(parsed);
    if (petSeen.has(key)) continue;
    petSeen.add(key);
    pets.push(parsed);
  }

  // Sack ids are real bazaar product ids. The amounts are synthetic and
  // deterministic: a sack count is a bare integer, so there is no shape to get
  // wrong, and a fixed formula keeps the fixture reproducible.
  const bazaar = await fetchJson(`${API}/skyblock/bazaar`);
  const sacks = Object.keys(bazaar.products)
    .sort()
    .slice(0, SACK_COUNT)
    .map((id, index) => ({ id, amount: ((index * 7919) % 4096) + 1 }));

  const essence = ESSENCE.map(([name, amount]) => ({ id: `ESSENCE_${name}`, amount }));

  items.pets = pets;
  items.sacks = sacks;
  items.essence = essence;

  const preparsed = {
    capturedAt,
    source,
    profileData: {
      currencies: {
        coin_purse: 10763000,
        essence: Object.fromEntries(ESSENCE.map(([n, amount]) => [n, { current: amount }])),
      },
      profile: { bank_account: 12500000 },
      leveling: { experience: 38220 },
    },
    bankBalance: 189827987.09277594,
    items,
  };

  // Blobs let a test assert an independent decoder agrees with ours, so prefer
  // rows whose decoded items carry both enchantments and a modifier.
  const blobSeen = new Set();
  const blobCandidates = [];
  for (const row of decodedRows) {
    if (!row || blobSeen.has(row.base64)) continue;
    blobSeen.add(row.base64);
    const rich = row.items.filter((it) => {
      const ea = extraAttributes(it);
      return ea && ea.enchantments && ea.modifier !== undefined;
    }).length;
    blobCandidates.push({ row, rich });
  }
  blobCandidates.sort((a, b) => b.rich - a.rich);
  const blobs = blobCandidates.slice(0, 4).map(({ row }) => ({
    note: "auction item_bytes, one item",
    base64: row.base64,
    decoded: row.items,
  }));

  // Catalogue: entries the fixture actually references, plus entries whose
  // upgrade/gemstone/prestige data a networth calculator needs to walk.
  const referenced = new Set();
  for (const bucket of BUCKETS) {
    for (const item of items[bucket[0]]) {
      const id = extraAttributes(item)?.id;
      if (id) referenced.add(id);
    }
  }
  for (const pet of pets) if (pet.type) referenced.add(pet.type);
  for (const pet of pets) if (pet.heldItem) referenced.add(pet.heldItem);
  for (const sack of sacks) referenced.add(sack.id);
  for (const e of essence) referenced.add(e.id);

  const CATALOGUE_FIELDS = [
    "id", "name", "category", "tier", "upgrade_costs", "gemstone_slots",
    "prestige", "soulbound", "museum",
  ];
  const resources = await fetchJson(`${API}/resources/skyblock/items`);
  const catalogueItems = {};
  let upgradeGroup = 0;
  for (const entry of resources.items) {
    const isReferenced = referenced.has(entry.id);
    const hasUpgradeData =
      entry.upgrade_costs !== undefined ||
      entry.gemstone_slots !== undefined ||
      entry.prestige !== undefined;
    if (!isReferenced) {
      if (!hasUpgradeData || upgradeGroup >= 400) continue;
      upgradeGroup++;
    }
    const kept = {};
    for (const field of CATALOGUE_FIELDS) {
      if (entry[field] !== undefined) kept[field] = entry[field];
    }
    catalogueItems[entry.id] = kept;
  }

  const written = [
    write("preparsed.json", preparsed),
    write("blobs.json", { capturedAt, source, blobs }),
    write("catalogue.json", {
      capturedAt,
      source: `${API}/resources/skyblock/items`,
      items: catalogueItems,
    }),
    write("member.json", memberPayload),
  ];

  // Summary.
  const represented = new Set();
  for (const [name] of BUCKETS) {
    for (const item of items[name]) for (const k of modifierKeysOn(item)) represented.add(k);
  }
  if (pets.length) represented.add("petInfo");

  console.log("buckets:");
  for (const [name] of BUCKETS) console.log(`  ${name.padEnd(24)} ${items[name].length}`);
  console.log(`  ${"pets".padEnd(24)} ${pets.length}`);
  console.log(`  ${"sacks".padEnd(24)} ${sacks.length}`);
  console.log(`  ${"essence".padEnd(24)} ${essence.length}`);
  console.log(`\nitems placed: ${BUCKETS.reduce((n, [b]) => n + items[b].length, 0)}`);
  console.log(`pool: ${pool.length} distinct, selected: ${selected.length}`);
  console.log(`\nmodifier keys represented: ${represented.size} of ${MODIFIER_KEYS.length}`);
  console.log(`  ${[...represented].sort().join(", ")}`);
  // Distinguish "the live API never offered this key" from "we dropped it".
  // Only the first is acceptable; the second is a selection bug.
  const dropped = [...poolKeys].filter((k) => !represented.has(k)).sort();
  const neverSeen = MODIFIER_KEYS.filter((k) => !poolKeys.has(k));
  console.log(`  present in pool but not placed: ${dropped.join(", ") || "none"}`);
  console.log(`  never present in the auction pool: ${neverSeen.join(", ") || "none"}`);
  console.log(`\npets: ${pets.length}`);
  console.log(`catalogue entries: ${Object.keys(catalogueItems).length}`);
  console.log("\nfiles:");
  for (const { file, bytes } of written) {
    console.log(`  ${file.padEnd(44)} ${bytes.toLocaleString()} bytes`);
  }

  // Self-check: the fixture is only useful if it holds these invariants.
  const problems = [];
  for (const [name] of BUCKETS) {
    if (!Array.isArray(items[name])) problems.push(`bucket ${name} missing`);
  }
  for (const name of ["pets", "sacks", "essence"]) {
    if (!Array.isArray(items[name])) problems.push(`bucket ${name} missing`);
  }
  if (!pets.length) problems.push("pets is empty");
  if (represented.size < 25) problems.push(`only ${represented.size} modifier keys, need 25`);
  if (dropped.length) problems.push(`dropped pool keys: ${dropped.join(", ")}`);
  if (blobs.length !== 4) problems.push(`${blobs.length} blobs, need 4`);
  if (problems.length) {
    console.error(`\nFAILED: ${problems.join("; ")}`);
    process.exitCode = 1;
    return;
  }
  console.log("\nself-check passed");
};

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
