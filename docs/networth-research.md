# Networth research (SkyHelper, prices, per-category data)

Researched 2026-08-02. Everything below was verified by reading the actual
SkyHelper-Networth source (master, matching npm 2.8.0 published 2026-07-29)
and by fetching the actual endpoints with an `Origin` header to check CORS.

## TL;DR recommendation

Re-derive, do not depend. Port the valuation rules from SkyHelper-Networth
(MIT, so porting is fully legal inside our GPL-3.0 site, with attribution in
NOTICE.md) into our own TypeScript module, fed by our existing NBT engine and
one runtime price fetch:

- Price source: `https://raw.githubusercontent.com/SkyHelperBot/Prices/main/pricesV2.json`
  One file, about 747 KB, flat `{ "ITEM_ID": price }` map, CORS `*`,
  regenerated every 15 minutes. Covers bazaar items, auction lowest-BIN
  items, and pets in one payload. Fetch at runtime, cache for 5 minutes.
- The npm package itself cannot run in a browser (details in section 2), so
  "just npm install it" is off the table anyway. The calculation logic is
  very portable: base price by normalized item id, times count, plus a list
  of additive modifiers, each `price(modifier item) * count * factor` with a
  55-entry factor table.
- Every category SkyCrypt shows can be fed from data we already have
  (Hypixel API with the user's key, plus our NBT engine), and our island
  chests become one extra category using the exact same item-valuation
  function.

One expectation to correct: SkyCrypt itself gives us nothing here. Its code
is AGPL (cannot copy), its public API is Cloudflare-guarded (a plain fetch
returned 403), and its networth is computed server-side by this same
SkyHelper library. The actual sources of truth are the MIT library, the open
prices file, and the Hypixel API. That is good news: all three are usable,
and we do not need SkyCrypt at all.

## 1. License of SkyHelper-Networth

- Repo: https://github.com/Altpapier/SkyHelper-Networth
  (the SkyHelperBot org repo does not exist; SkyHelperBot only hosts the
  Prices repo. npm `repository` field points at Altpapier.)
- npm: `skyhelper-networth`, latest 2.8.0, published 2026-07-29, actively
  maintained. `license` field: MIT.
- LICENSE file in the repo: standard MIT, "Copyright (c) 2022 Altpapier".

MIT is one-way compatible with GPL-3.0: we may depend on it, vendor it, or
port its code into our GPL-3.0 codebase, as long as we keep the MIT
copyright notice for the portions that came from it. So license is not a
constraint at all here. Add a line to NOTICE.md like:
"Networth valuation rules ported from SkyHelper-Networth (MIT, (c) 2022
Altpapier), https://github.com/Altpapier/SkyHelper-Networth".

The "learn but never copy" house rule applies to SkyCrypt (AGPL), not to
this library (MIT). Copying from SkyHelper-Networth is allowed.

## 2. Can it run in a browser? No, and here is exactly why

Dependencies of 2.8.0: `axios` and `prismarine-nbt`. But the blockers are in
the package's own code, verified by reading it:

- `constants/itemsMap.js` calls `require('fs')` and `require('path')` at
  module load, reads `.itemsBackup.json` from disk on import, and writes it
  with `fs.writeFileSync` every 12 hours. There is no browser equivalent.
- `helper/decode.js` uses `require('zlib')` (`gunzip`) and Node `Buffer`.
- `prismarine-nbt` itself needs `Buffer` and zlib polyfills.
- `managers/NetworthManager.js` is a singleton whose constructor runs at
  import time: it immediately fetches
  `https://api.hypixel.net/v2/resources/skyblock/items` and starts a
  `setInterval` refresh every 12 hours. Import-time network and timers in a
  bundle are exactly the kind of side effect we do not want.

You could force it through Vite with node polyfills (buffer, browserify-zlib,
an fs no-op shim) and use `ProfileNetworthCalculator.fromPreParsed` to skip
its NBT decoding, but you would be shipping axios, prismarine-nbt, protodef,
and polyfills to value items, while fighting import-time side effects. Not
worth it.

Is the logic simple enough to re-derive? Yes. Measured scope of the library,
excluding tests: about 3970 lines of JS, most of it JSDoc comments and
boilerplate. The real content is:

- `helper/parseItems.js` (154 lines): maps API fields to categories. We
  replace this with our own code over our own NBT engine (src/nbt/ already
  decodes Hypixel gzip blobs with DecompressionStream).
- `calculators/helpers/SkyBlockItemNetworthHelper.js` (202 lines): item id
  normalization (skins, runes, new year cakes, party hats, shiny, starred
  fallback) plus soulbound and cosmetic detection.
- About 40 tiny handler files, almost all the same shape: if the item has
  attribute X, add `prices[X_ITEM] * amount * APPLICATION_WORTH.x`.
- `constants/applicationWorth.js` (55 lines): the factor table, for example
  recombobulator 0.8, enchantments 0.85, hot potato book 1, pet candy 0.65.
- Pet pricing (`PetNetworthHelper.js`, 193 lines): prices file has keys
  `LVL_1_{RARITY}_{TYPE}`, `LVL_100_...`, `LVL_200_...` (and `_SKINNED_...`
  variants); compute the pet level from exp, then linearly interpolate
  between the LVL_1 and LVL_100 prices by exp progress (100 to 200 for
  pets that go to 200, like Golden Dragon), then apply pet item, skin, and
  candy-penalty handlers.
- Sacks and essence use `BasicItemNetworthCalculator`: literally
  `prices[id] * amount`, nothing else. Our island chests are the same shape.

A faithful TypeScript port is a few focused days: roughly 1500 to 2000 lines
including the constants tables. Since MIT allows direct porting, the handlers
can be translated nearly mechanically rather than re-invented, which also
keeps our numbers matching SkyCrypt's (same rules, same prices file).

## 3. Prices: sources, verified

### SkyHelper prices (recommended, primary)

- URL (read from `helper/prices.js` line 21):
  `https://raw.githubusercontent.com/SkyHelperBot/Prices/main/pricesV2.json`
- Verified by fetching on 2026-08-02:
  - `Content-Length: 746680` (about 747 KB, 14159 keys)
  - `Access-Control-Allow-Origin: *` (present with a cross-origin Origin
    header, so a GitHub Pages site can fetch it directly)
  - `Cache-Control: max-age=300`
  - Payload shape: flat JSON object, uppercase item id to number, e.g.
    `"HYPERION": 470000000`, `"RECOMBOBULATOR_3000": 9945297.1`,
    `"WHEAT": 5.3`, `"ENCHANTMENT_ULTIMATE_LEGION_5": 31804443.2`,
    `"ESSENCE_WITHER": ...`, `"RUNE_ANTLERS_3": ...`,
    `"LVL_100_EPIC_ENDER_DRAGON": ...`
- Update cadence: the Prices repo commits "prices update" every 15 minutes
  (checked the commit log; pushes at :07, :22, :37, :52).
- Terms: the Prices repo has no license file. That is fine for our use: we
  fetch it at runtime and never bundle or redistribute it, same as SkyHelper
  and every bot using the library does. If we ever wanted to mirror it, we
  would ask first.
- It covers bazaar AND auction items AND pets in one file, which means one
  fetch prices everything, including sack contents and island-chest
  contents. Bazaar-sourced entries (like WHEAT) track bazaar value, auction
  entries track lowest BIN with SkyHelper's own smoothing/outlier handling.

### Hypixel bazaar (already in the site, keep as cross-check only)

- `https://api.hypixel.net/v2/skyblock/bazaar`, keyless.
- Verified: `access-control-allow-origin: *`.
- Only bazaar products, no auction items, so it cannot price gear, pets, or
  most accessories. Not needed for networth if we use pricesV2, but it is
  fresher (live order book) if we ever want a "sacks at instant-sell value"
  toggle.

### Auction-house alternatives (fallbacks, not needed for v1)

- Moulberry lowestbin: `https://moulberry.codes/lowestbin.json` returned
  HTTP 525 (SSL failure at Cloudflare) when checked, so it is not something
  to build on.
- Coflnet: `https://sky.coflnet.com/api/...` responded with proper CORS
  (reflects the origin, allow-credentials). It is per-item request oriented
  though, hundreds of requests for a full profile, and has its own rate
  limits and commercial terms. Good spare tire, wrong primary.

## 4. Input data per category

Field paths verified against SkyHelper `helper/parseItems.js` and against our
own captured payload documented in docs/hypixel-api-cheatsheet.md. "member"
means `profiles[i].members[uuid]` from
`GET https://api.hypixel.net/v2/skyblock/profiles?uuid=...` (user key; the
endpoint sends `access-control-allow-origin: *`, verified, so the key stays
between the browser and api.hypixel.net).

| Category | Source | Field | We have it? |
|---|---|---|---|
| Purse | API | `member.currencies.coin_purse` | yes |
| Co-op bank | API | `profile.banking.balance` (profile level, needs the player's Banking API toggle on) | yes |
| Personal bank | API | `member.profile.bank_account` | yes |
| Inventory | API NBT or mod | `member.inventory.inv_contents.data` (base64 gzip NBT; needs Inventory API toggle) | yes (NBT engine) |
| Armor (worn) | API NBT | `member.inventory.inv_armor.data` | yes |
| Equipment (worn) | API NBT | `member.inventory.equipment_contents.data` | yes |
| Wardrobe | API NBT | `member.loadout.armor.{slot}.{HELMET,CHESTPLATE,LEGGINGS,BOOTS}.data`, one blob per piece. This is the CURRENT location (confirmed in our own cheatsheet payload and in SkyHelper master). Older docs say `inventory.wardrobe_contents`; current SkyHelper does not read that anymore. Loadout equipment lives at `member.loadout.equipment.{slot}.EQUIPMENT_SLOT_1..4.data` and is folded into the equipment category | yes |
| Ender chest | API NBT or mod | `member.inventory.ender_chest_contents.data` | yes |
| Storage (backpacks) | API NBT or mod | `member.inventory.backpack_contents.{n}.data` plus `backpack_icons.{n}.data` (the icon backpack items themselves count) | yes |
| Accessories | API NBT | `member.inventory.bag_contents.talisman_bag.data` | yes |
| Fishing bag | API NBT | `member.inventory.bag_contents.fishing_bag.data` | yes |
| Potion bag | API NBT | `member.inventory.bag_contents.potion_bag.data` | yes |
| Sacks bag (the sack items) | API NBT | `member.inventory.bag_contents.sacks_bag.data` | yes |
| Quiver | API NBT | `member.inventory.bag_contents.quiver.data` | yes |
| Personal vault | API NBT | `member.inventory.personal_vault_contents.data` | yes |
| Candy | API NBT | `member.shared_inventory.candy_inventory_contents.data` (plus `carnival_mask_inventory_contents`) | yes |
| Sacks (contents) | API or mod | `member.inventory.sacks_counts` in current payloads; SkyHelper also falls back to legacy `member.sacks_counts`. Our src/island/hypixel.ts already reads both. Flat `{ ITEM_ID: count }`. Hidden entirely if the player's API toggle is off, which is exactly the hole our mod fills | yes (both paths) |
| Essence | API | `member.currencies.essence.{TYPE}.current`, valued as `ESSENCE_{TYPE}` | yes |
| Pets | API | `member.pets_data.pets[]` (json objects: type, tier, exp, heldItem, candyUsed, skin). Pets found as items in chests carry the same json in `tag.ExtraAttributes.petInfo` | yes |
| Museum | API, second call | `GET /v2/skyblock/museum?profile={profileId}` (key). Decode `members[uuid].items.{id}.items.data` skipping entries with `borrowing: true`, plus `members[uuid].special[].items.data` | yes, one extra fetch |
| Island chests | mod only | Our island-data spec: `chests[].items[]` with `id`, `count`, optional `extra` (reforge, stars, ench, recomb) | yes, unique to us |

Also parsed by SkyHelper, trivial to include: farming toolkit
(`member.garden_player_data.farming_toolkit`) and hunting toolkit
(`member.foraging.hunting_toolkit`), plus new year cake bags (a nested NBT
blob inside the cake bag item's `new_year_cake_bag_data` attribute).

Ironman note: pricesV2 is one general market list, not mode-aware, and
SkyHelper applies the same numbers to every profile. So "same networth for
ironman and normal" happens automatically. No extra work.

## 5. How SkyCrypt displays it, and what ours should show

SkyCrypt renders the output structure of this library, computed on their
server. The library's `getNetworth()` returns:

```
{
  networth,              // grand total including coins
  unsoulboundNetworth,   // total counting only transferable value
  purse, bank, personalBank,
  noInventory,           // true when the Inventory API toggle is off
  types: {
    <category>: {
      total,
      unsoulboundTotal,
      items: [ { name, id, price, count, soulbound, cosmetic,
                 basePrice, calculation[] } ]   // sorted by price,
                                                // equal items stacked
    }
  }
}
```

The categories in the SkyCrypt screenshot map to these keys: Accessories
(accessories), Armor (armor), Candy (candy_inventory), Enderchest
(enderchest), Essence (essence), Inventory (inventory), Museum (museum),
Pets (pets), Sacks (sacks), Storage (storage), Wardrobe (wardrobe).
"Unsoulbound" is `unsoulboundNetworth`, "Total" is `networth`. SkyCrypt
hides zero-value categories and the library also produces equipment,
personal_vault, fishing_bag, potion_bag, sacks_bag, quiver,
carnival_mask_inventory and the toolkits, which SkyCrypt folds away or
hides when small.

For Skydex, to be at least as informative:

- Header: Total networth, Unsoulbound networth, and the three coin lines
  (purse, co-op bank, personal bank).
- One row per category with its total; expandable to the stacked, sorted
  item list, each item showing count, value, and a soulbound marker. The
  `calculation[]` array gives per-modifier lines (star costs, recomb,
  enchants) for a SkyCrypt-beating tooltip if we want it.
- Our extra row: Island Chests, from mod data, valued with the same item
  function (base price by id times count; when `extra` is present, apply
  the matching modifier handlers: recomb, stars, enchantments, reforge).
  Flag it visually as "mod data, not in the API", with per-chest drilldown
  since we know positions and container names.
- Show data-freshness and coverage honestly: which categories came from
  API, which from the mod, and which are missing because an API toggle is
  off (the spec's "no data" vs "verified empty" distinction).

## 6. Concrete implementation plan

1. `src/networth/prices.ts`: runtime fetch of pricesV2.json with a 5 minute
   in-memory cache and localStorage fallback of the last good copy (with its
   timestamp shown in the UI). Never bundled.
2. `src/networth/itemValue.ts`: the ported item valuation. Input: our
   decoded NBT item (id, count, ExtraAttributes). Steps: normalize id,
   look up base price, run the modifier handlers, track soulboundPortion
   and cosmetic flags. Port the APPLICATION_WORTH table and the handler
   list from SkyHelper (MIT, attribute in NOTICE.md).
3. `src/networth/petValue.ts`: pet level from exp tables, LVL_1/100/200
   interpolation, pet item, skin, candy penalty.
4. `src/networth/basicValue.ts`: sacks, essence, island-chest simple items:
   `prices[id] * count`.
5. `src/networth/categories.ts`: our own parseItems equivalent mapping the
   table in section 4 onto category arrays, reusing src/nbt and the island
   store. Museum fetch added to the existing API layer.
6. UI: breakdown panel per section 5.
7. Parity check: run one real profile through the actual Node library once
   (as a dev script, not shipped) and diff category totals against our port
   to catch translation mistakes.

Ongoing cost to accept: Hypixel adds new modifiers a few times a year and
SkyHelper adds a handler. We diff their handler directory occasionally and
port the delta. Pinning our port to a known lib version string in the UI
("valuation rules: SkyHelper 2.8.0 equivalent") keeps this honest.

## 7. Blockers and honest caveats

- No hard blockers. License is clean (MIT), prices endpoint is public with
  CORS `*`, all Hypixel endpoints used send CORS `*` (verified on
  /v2/skyblock/profiles, /v2/skyblock/museum, /v2/skyblock/bazaar and
  /v2/resources/skyblock/items).
- The npm package is unusable in-browser as published, so the plan is a
  port, not a dependency. This is the main thing that contradicts the
  "just use the library" hope.
- SkyCrypt exposes nothing we can consume: AGPL code, 403-guarded API.
  Everything we need comes from the library source, the prices file, and
  the Hypixel API instead.
- Museum is a second API call per profile; players can hide museum,
  banking, inventory, and sacks via API toggles, so every category needs a
  "hidden by player settings" state (the site already models this for
  sacks).
- Island-chest items carry compact `extra` data, not full NBT, so deep
  modifiers (gemstones, scrolls, hot potato books, dyes, runes) are not
  visible for chest items today. Their value will be slightly conservative
  on modified gear until the mod ships richer `extra` fields. Base plus
  recomb, stars, ench, reforge already covers the big movers.
- pricesV2 has no ironman-specific pricing, which is exactly the behaviour
  the owner asked for.
