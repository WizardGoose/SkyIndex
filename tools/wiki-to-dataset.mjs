#!/usr/bin/env node
/**
 * Rebuild the greenhouse mutation dataset from the wiki.
 *
 *   node tools/wiki-to-dataset.mjs           # diff against the current dataset
 *   node tools/wiki-to-dataset.mjs --write   # regenerate public/greenhouse/data.json
 *
 * The shipped data.json came from the SkyShards greenhouse branch, not from
 * the wiki, which means it can only ever be as fresh as that fork. This parses
 * the wiki's own Mutations table into the same shape, so the wiki becomes the
 * source of truth and the data can be refreshed whenever the game changes.
 *
 * Each row on that page looks like:
 *
 *   {{Slot|Thornshade}} | [[Thornshade]] | {{Uncommon}} | 25 | <description>
 *   {{Plainlist|
 *   * '''Size:''' 1x1
 *   * '''Growth Surface:''' {{ID|Farmland}}
 *   * '''Spreading Conditions:''' {{RD|4x Wild Rose}} / {{RD|4x Veilshroom}}
 *   * '''Effects:''' {{Green|Effect Spread}}
 *   }} | {{RL|190x Brown Mushroom|800x Wild Rose}}
 */
import { readFileSync, writeFileSync } from "node:fs";

const PAGE = "data/wiki/pages/Mutations.json";
const DATA = "public/greenhouse/data.json";

const current = JSON.parse(readFileSync(DATA, "utf8"));

let wiki = JSON.stringify(JSON.parse(readFileSync(PAGE, "utf8")));
wiki = wiki.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\t/g, " ");

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

// Resolve a wiki display name to the id already used in the dataset, so
// "Melon Slice" maps to `melon` rather than inventing `melon_slice`.
const byName = new Map();
for (const [id, c] of Object.entries(current.crops)) byName.set(norm(c.name), id);
for (const [id, m] of Object.entries(current.mutations)) byName.set(norm(m.name), id);
byName.set(norm("Melon Slice"), "melon");

const idFor = (name) => byName.get(norm(name)) ?? slug(name);

const RARITIES = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];

/**
 * Split the page into one chunk per mutation row.
 *
 * Three things bite here:
 *  - the last row has no following {{Slot|, so it must stop at the table end
 *    `|}` or it swallows the rest of the page and picks up a stray rarity
 *  - <ref> footnotes contain extra {{RD|...}} mentions ("in practice this can
 *    be achieved using 2x Snoozling") that are commentary, not requirements
 *  - HTML comments hide unrelated template calls
 */
const clean = (s) =>
  s
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

const rows = [];
const hits = [...wiki.matchAll(/\{\{Slot\|([^}]+)\}\}/g)];
for (let i = 0; i < hits.length; i++) {
  const start = hits[i].index;
  const nextRow = i + 1 < hits.length ? hits[i + 1].index : wiki.length;
  // A table row never survives past the table terminator.
  const tableEnd = wiki.indexOf("\n|}", start);
  const end = tableEnd > start && tableEnd < nextRow ? tableEnd : nextRow;
  rows.push({ name: hits[i][1].trim(), text: clean(wiki.slice(start, end)) });
}

const parsed = {};
const problems = [];

for (const row of rows) {
  const id = idFor(row.name);
  const t = row.text;

  const rarity = RARITIES.find((r) => t.includes(`{{${r}}}`));
  const sizeMatch = t.match(/'''Size:'''\s*(\d+)\s*x\s*\d+/i);
  /*
   * The whole Growth Surface LINE, then every {{ID|...}} on it. A single
   * capture stops at the first template, and the wiki writes multi-surface
   * rows as `{{ID|Farmland}}, {{ID|Dirt}}` (Lonelily is the one such row
   * today), so a lone capture silently dropped everything after the comma.
   */
  const groundLine = t.match(/'''Growth Surface:'''([^\n]*)/i);
  const grounds = groundLine
    ? [...groundLine[1].matchAll(/\{\{ID\|([^}]+)\}\}/g)].map((m) => slug(m[1]))
    : [];

  if (!rarity || !sizeMatch || grounds.length === 0) {
    // Rows without these fields are not mutation rows (layout subpages etc).
    continue;
  }

  /**
   * Spreading conditions, slash separated. Editors write them two ways and
   * both appear on the same page, sometimes in the same line:
   *   {{RD|4x Ashwreath}}   template form
   *   4x [[Witherbloom]]    plain wiki link
   * Missing the second form silently dropped a requirement from Cindershade
   * and Puffercloud, which would have understated their cost.
   */
  const requirements = [];
  const seen = new Set();
  const addReq = (name, count) => {
    const crop = idFor(name);
    if (seen.has(crop)) return;
    seen.add(crop);
    requirements.push({ crop, count: Number(count) });
  };

  const spread = t.match(/'''Spreading Conditions:'''([^\n]*)/i);
  if (spread) {
    const line = spread[1];
    for (const [, count, name] of line.matchAll(/\{\{RD\|\s*(\d+)x\s*([^}]+?)\s*\}\}/g)) addReq(name, count);
    for (const [, count, name] of line.matchAll(/(\d+)x\s*\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g)) addReq(name, count);
  }

  const drops = {};
  const rl = t.match(/\{\{RL\|([^}]+)\}\}/);
  if (rl) {
    for (const part of rl[1].split("|")) {
      const m = part.match(/^\s*([\d,]+)x\s*(.+?)\s*$/);
      if (m) drops[idFor(m[2])] = Number(m[1].replace(/,/g, ""));
    }
  }

  parsed[id] = {
    name: row.name,
    size: Number(sizeMatch[1]),
    // `ground` stays the single PRIMARY surface (first listed) because the
    // texture lookup and ~18 other call sites want exactly one; `grounds` is
    // additive and only emitted when the wiki actually lists several, so the
    // 39 single-surface entries in data.json do not change shape at all.
    ground: grounds[0],
    ...(grounds.length > 1 ? { grounds } : {}),
    requirements,
    rarity: rarity.toLowerCase(),
    drops,
  };
}

// ---- Compare against the shipped dataset -------------------------------
const currentIds = Object.keys(current.mutations);
const parsedIds = Object.keys(parsed);

const missing = currentIds.filter((id) => !parsed[id]);
const extra = parsedIds.filter((id) => !current.mutations[id]);

const diffs = [];
for (const id of currentIds) {
  const a = current.mutations[id];
  const b = parsed[id];
  if (!b) continue;

  if (a.rarity !== b.rarity) diffs.push(`${a.name}: rarity ours=${a.rarity} wiki=${b.rarity}`);
  if (a.size !== b.size) diffs.push(`${a.name}: size ours=${a.size} wiki=${b.size}`);
  if (a.ground !== b.ground) diffs.push(`${a.name}: ground ours=${a.ground} wiki=${b.ground}`);
  const groundsKey = (m) => (m.grounds ?? [m.ground]).join(", ");
  if (groundsKey(a) !== groundsKey(b)) diffs.push(`${a.name}: grounds ours=${groundsKey(a)} wiki=${groundsKey(b)}`);

  const key = (reqs) =>
    [...reqs]
      .map((r) => `${r.count}x${r.crop}`)
      .sort()
      .join("+") || "(none)";
  if (key(a.requirements) !== key(b.requirements)) {
    diffs.push(`${a.name}: requirements ours=${key(a.requirements)} wiki=${key(b.requirements)}`);
  }
}

console.log(`Parsed ${parsedIds.length} mutations from the wiki (dataset has ${currentIds.length})`);
if (missing.length) console.log(`\nIn dataset, not parsed from wiki: ${missing.join(", ")}`);
if (extra.length) console.log(`\nParsed from wiki, not in dataset: ${extra.join(", ")}`);

console.log(`\nField disagreements: ${diffs.length}`);
for (const d of diffs.slice(0, 25)) console.log("  " + d);

if (process.argv.includes("--write")) {
  // Preserve the fields the wiki table does not carry (buffs, decay, growth
  // stages, prose) so a regeneration never silently drops them.
  const merged = { ...current, mutations: { ...current.mutations } };
  for (const [id, m] of Object.entries(parsed)) {
    merged.mutations[id] = { ...(current.mutations[id] ?? {}), ...m };
    // `grounds` is only emitted for multi-surface rows, so a row that went
    // back to one surface must not keep a stale list from the previous write.
    if (!m.grounds) delete merged.mutations[id].grounds;
  }
  writeFileSync(DATA, JSON.stringify(merged, null, 2));
  console.log(`\nWrote ${DATA}`);
} else {
  console.log(`\n(dry run. pass --write to regenerate ${DATA})`);
}
