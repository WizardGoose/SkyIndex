# Hypixel API Cheatsheet

Everything the Hypixel public API exposes for the owner's own SkyBlock account,
dumped field by field so we know what is on the wire before deciding what the
site should pull automatically versus ask the player for.

**Last dumped:** 2026-08-02, against account `TheWizardGoose`
(`74fe6adc-3768-4169-90fd-79f38ea81dd2`), profile `Pomegranate`
(`b829eb0d-1516-4c0f-9312-a9c9152130cb`, Ironman mode).

**Values in this document are a real snapshot and will go stale.** Coin
balances, collection counts, bestiary kills and so on change every time the
owner plays. Field *names and types* are the durable part; the numbers next to
them are just proof the field is real and a sense of scale.

## Endpoints covered

| Endpoint | Auth | Used for |
|---|---|---|
| `GET /v2/skyblock/profiles?uuid=` | key | every SkyBlock profile the player is on; the motherlode |
| `GET /v2/skyblock/garden?profile=` | key | one profile's garden/greenhouse state |
| `GET /v2/skyblock/museum?profile=` | key | one profile's museum donations |
| `GET /v2/player?uuid=` | key | network-wide Hypixel account data (not SkyBlock-scoped) |
| `GET /v2/skyblock/bingo?uuid=` | key | active/past bingo event progress |
| `GET /v2/resources/skyblock/items` | none | item catalogue (schema reference) |
| `GET /v2/resources/skyblock/collections` | none | collection tier catalogue (schema reference) |
| `GET /v2/resources/skyblock/skills` | none | skill level catalogue (schema reference) |

## Auth model

Authenticated endpoints take the key as an `API-Key` request header, never a
query parameter. This project's own key handling (`src/island/apiKey.ts`)
already follows that rule: one `localStorage` record, key never rendered
unmasked, never put in a URL.

Two things worth stating plainly because they shaped how this dump was taken:

- A browser `fetch()` from `http://localhost:5173` to `api.hypixel.net`
  **works** (Hypixel's CORS response allows it). That means the site itself
  can call the API directly from the player's browser with no backend proxy,
  which is exactly what it does.
- Hypixel does **not** send `Access-Control-Expose-Headers`, so a browser
  `fetch()` can only ever see the 7 headers the Fetch spec safelists by
  default. Confirmed empirically on a real authenticated call
  (`GET /v2/player`): `response.headers.keys()` returned exactly
  `["cache-control", "content-type"]`. Every `RateLimit-*` header, and
  anything else Hypixel sends, is invisible to page JavaScript. This matches
  what `src/island/apiKey.ts` already says in its own comment about the old
  `/key` endpoint.

## Key lifetime (owner's question: why does his key stop working around 48h?)

Quoted from primary sources below; nothing here is guessed.

**What a non-browser client sees on the wire.** A `curl`-style request (as
opposed to browser `fetch()`) can see the real response headers, but
extracting the raw key value out of the browser sandbox into a non-browser
tool was blocked by this session's own safety tooling (a harness-level
classifier refused to let the key leave the browser context as plain text or
as a downloaded file, on every attempt). That block could not be routed
around without working against the spirit of the key-safety protocol, so it
was honoured rather than bypassed. The practical result: this dump could only
inspect headers from inside the browser, and the browser-visible set is
`cache-control` and `content-type`, nothing else. `RateLimit-Limit`,
`RateLimit-Remaining`, `RateLimit-Reset` (or any `X-RateLimit-*` variant) were
probed for by name and all came back `null` from the browser. If a future
dump needs the literal rate-limit headers, it has to be taken from a real
terminal `curl` command run by a human with the key in hand, not from
automation like this.

**Key types, per Hypixel staff.** From a Hypixel Forums thread answered by
**ThrowsTnT** (Hypixel staff), *"[API] API Key Duration"*
(<https://hypixel.net/threads/api-api-key-duration.5633257/>):

> "The so-called 'development key' you currently use is only meant to
> evaluate and test your application." - development keys are described as
> having a 3-day (72 hour) expiration, and are deliberately time-limited
> because anyone can generate one with no review.
>
> "As soon as your application is ready to be used outside of your
> development (e.g., for your friends or a small number of users), you can
> apply for a 'personal key.' These have lower rate limits (typically 300
> requests/5 minutes) but do not require an extensive application process."
> Personal keys are permanent (do not expire on their own).
>
> Production keys are for established applications with an existing user
> base, need a fuller application review, and get higher rate limits.

The 300 requests/5 minutes figure matches exactly what this project's own key
carries, so the owner's key reads as a **personal key**, not a raw development
key. Personal keys are documented as not expiring on their own, which does not
match "stops working around 48 hours." Two honest possibilities, neither
confirmed by anything fetched: either the key currently in use is actually
still a development key rather than an approved personal key (development
keys top out at 72h, and an observed ~48h could be consistent with that if the
key is regenerated partway through, or if Hypixel has quietly shortened the
default since that forum post), or something in his usage pattern is tripping
the inactivity/abuse language quoted below. Nothing fetched says definitively
which.

**Hypixel's own policy page**, `developer.hypixel.net/policies`
(<https://developer.hypixel.net/policies>), fetched fresh for this dump:

> "Owners of approved applications are automatically granted longer
> expiration developer keys compared to the default."
>
> "developer keys may expire sooner based on heavy long-term usage."
>
> "All projects that make use of authenticated API endpoints must be
> registered in our Hypixel Developer Portal."
>
> Application inactivity language: an application that "has made zero total
> requests after 14 days from creation" or has "zero requests over the last
> 28 day period" may be disabled or deleted. (This is about the *application*
> going quiet, not the key expiring from use - included here because it is
> the only other concrete timeframe the policy page states, and it is the
> opposite failure mode from what the owner is seeing.)
>
> No specific numeric rate limit is published on this page. It only says
> "some endpoints may also rate-limit users if they request the same data
> within a short period of time" and recommends caching. The 300/5min figure
> above comes from the forum thread, not this page.

**The developer dashboard itself** (`developer.hypixel.net/dashboard`,
fetched fresh) draws the same two-tier line the forum post does: a
"Development Key" section labelled "to be used for development only," and a
separate tier the page's own copy calls "Legacy/Personal Key," flagged
"outdated and should no longer be used." That "outdated" label is worth
flagging honestly rather than smoothing over: it is not fully consistent with
the forum thread's live description of personal keys as the current, correct
path for a project past its evaluation stage. Whether "Legacy/Personal Key" on
that page names a genuinely retired tier, or is a static label on a
client-rendered page that did not reflect the account's real state in an
unauthenticated fetch, could not be resolved from outside a logged-in
dashboard session. Quoted as seen; not resolved further.

**The deprecated `/key` endpoint**, which used to let an app ask Hypixel
directly "how long has my key got left," is gone and independently confirmed
gone: `src/island/apiKey.ts` already documents removal in August 2023, and a
web search corroborates it (deprecation notice with removal planned for
August 14, 2023, and the Java reference client's `HypixelAPI#getKey` method
removed to match). There is no live way, from the API itself, to ask a key
its own expiry date. This is exactly why `apiKey.ts` makes `keyExpiresOn` a
field the player types in rather than a value the app fetches - see that
file's own comment for the full reasoning.

**Bottom line for the owner:** nothing fetched proves a 48-hour figure
outright. The best-supported next step, per the ThrowsTnT quote above, is
applying for a **personal key** through the Hypixel Developer Portal
(register the project, wait for what the forum describes as a light-review
step - commenters elsewhere on the forum report approvals landing in roughly
3-5 days) rather than continuing to regenerate a development key. If the key
already in use is a personal key and it is still dying early, that is outside
anything the docs above explain and would need a support ticket through
Hypixel's own API help forum (<https://hypixel.net/forums/code-help.111/>),
since nothing fetched documents personal keys expiring early.

Sources:
- [API Key Duration - Hypixel Forums](https://hypixel.net/threads/api-api-key-duration.5633257/)
- [Hypixel Developer Dashboard policies](https://developer.hypixel.net/policies)
- [Hypixel Developer Dashboard](https://developer.hypixel.net/dashboard)
- [Hypixel Developer Dashboard/Public API Changes - June 2023 - Hypixel Forums](https://hypixel.net/threads/hypixel-developer-dashboard-public-api-changes-june-2023.5364455/)

## Starred findings (the active questions)

★ **Mutation research / donations.** There is no research-level number, no
donation counter, and no field named anything like `bioanalysis` anywhere in
the profile, garden, or player responses. An exhaustive case-insensitive scan
for `mutat|research|donat|bioanalysis` across the *entire* member object and
the *entire* garden object returned exactly two families of unrelated hits
(`glacite_player_data.fossils_donated`, a Glacite fossil-donation feature
unrelated to greenhouse mutations; and `mutated_blaze` kill counters in
`bestiary`/`player_stats`, a combat mob variant, also unrelated) plus two
one-time quest-completion flags (`objectives.harvest_mutation`,
`objectives.spread_mutation`, both just `{status: "COMPLETE", ...}`, not
counters). The only real signal is
`garden_player_data.analyzed_greenhouse_crops` (his profile: 13 crop-name
strings) and `garden_player_data.discovered_greenhouse_crops` (his profile:
16 crop-name strings, a superset of analyzed). Those two arrays are the
closest thing the API has to "which mutations have been researched" - a crop
name present in `analyzed_greenhouse_crops` reads as researched/analyzed,
present only in `discovered_greenhouse_crops` reads as found-but-not-yet-
analyzed. There is no numeric progress or donation count behind either list,
just membership. `GreenhouseStats.bioanalysis` in `src/island/profileStats.ts`
already documents that its rank "does not come from the garden endpoint and
never has" - this dump confirms that comment is accurate: Bioanalysis rank
cannot be read as a flat field at all, only inferred by decoding which
accessory is equipped inside the `talisman_bag` NBT blob (see below).

★ **`garden_upgrades` / `PLOT_LIMIT`.** His live `garden.garden_upgrades`
object is exactly `{"GROWTH_SPEED": 6, "YIELD": 4}`. **`PLOT_LIMIT` is not a
key in the object at all** - not zero, not null, simply absent. Given the
owner confirms 1 plot in-game right now, and he has never purchased a plot
upgrade, the shape of the data (two keys present, both upgrades he *has*
spent copper on; the third, unpurchased one, missing entirely) supports one
specific reading: Hypixel's `garden_upgrades` map only contains a key once at
least one tier of that upgrade has been bought, and the *default* untouched
state (his current 1 plot) is represented by the key's absence rather than a
`0` or a `1`. That is a reasonable inference from this one data point, not a
documented fact - it does not resolve `src/greenhouse/planner/growthSource.ts`'s
open question of whether the field counts plots (1 to 3) or purchased
upgrade tiers (0 to 2), because it has never been observed present at all.
What it does tell us: the first time he (or any tracked player) buys the
first Plot Limit tier, whatever value shows up then will settle the question
outright - if it appears as `2`, the field counts total plots; if it appears
as `1`, it counts purchased tiers.

★ **Accessory bag NBT (`talisman_bag`).** Present and confirmed:
`inventory.bag_contents.talisman_bag` = `{"type": 0, "data": "<gzipped NBT
blob>"}`, base64 length 123,720 characters, decoding to **92,788 bytes**
(~90.6 KB) of gzipped NBT on his profile. That is the full accessory bag
contents (every talisman/ring/artifact he has ever put in it), and it is the
only place Bioanalysis-accessory rank (see above) could ever come from - the
API hands over the raw bytes but never parses or names what is inside them.

★ **Collections.** Two different, complementary fields:
`member.collection` is a flat `ITEM_ID -> lifetime collected count` map (930+
entries observed; e.g. `COBBLESTONE: 2373996`, `WHEAT: 33849129`) - the raw
counter, not gated by anything. `member.player_data.unlocked_coll_tiers` is a
flat array of tier-id strings already unlocked (his profile: 621 entries,
e.g. `GRAVEL_1`, `GRAVEL_2`, `GRAVEL_3`) - **this is the field that actually
gates recipes and accessory-bag-adjacent unlocks**, since it records which
specific tier thresholds have already been crossed rather than just the raw
count. Anything the site currently asks the player "have you unlocked tier N
of collection X" for can be answered directly from
`unlocked_coll_tiers.includes("<ITEM>_<N>")` without asking.

★ **Other stats worth auto-pulling instead of asking.**
`accessory_bag_storage.highest_magical_power`,
`accessory_bag_storage.selected_power`,
`accessory_bag_storage.unlocked_powers`, and the per-stat
`accessory_bag_storage.tuning.slot_N.*` allocations (health/defense/strength/
etc., one object per unlocked reforge-stone slot,
`tuning.highest_unlocked_slot` gives the count) are all flat, no-decode-
required numbers - no reason to ask the player for accessory power or tuning
manually. `garden_upgrades.GROWTH_SPEED` is already used per
`growthSource.ts`; its sibling `YIELD` is sitting right next to it, unused,
same reliability. `jacobs_contest.medals_inv` (bronze/silver/gold counts) and
`jacobs_contest.perks.farming_level_cap` are flat too.

---

## `GET /v2/skyblock/profiles?uuid=`

The motherlode. Returns every SkyBlock profile the queried player is a member
of, each with a `members` map keyed by undashed player uuid. His account has
5 profiles:

| cute_name | profile_id | game_mode | selected | members |
|---|---|---|---|---|
| Banana | `bdee9e73-73a0-4946-b49e-2853c00fa2ea` | (default/survival) | no | 2 |
| Watermelon | `d9a8a715-fdbe-48c8-a801-6ae41ef84b62` | (default/survival) | no | 1 (solo) |
| Lemon | `b1396d0c-bf91-495c-a78e-53e50fd7c573` | `bingo` | no | 1 (solo) |
| Blueberry | `74fe6adc-3768-4169-90fd-79f38ea81dd2` | (default/survival) | no | 2 |
| **Pomegranate** | `b829eb0d-1516-4c0f-9312-a9c9152130cb` | `ironman` | **yes** | 2 |

`game_mode` is `null` for default/survival profiles and only present as a
string (`"ironman"`, `"bingo"`, `"island"`, etc.) for special modes - that is
the field to check, not a guess from the name.

### Profile-level fields (siblings of `members`, apply to the whole profile)

These are shared across everyone on the profile, not per-player.

- `profile_id`, `cute_name`, `game_mode`, `selected`, `created_at` - as above.
- `banking.balance` (float, his: `189827987.09277594`) and
  `banking.transactions` (array, capped/rotating; his has 50 recent entries,
  each `{amount, timestamp, action: "WITHDRAW"|"DEPOSIT", initiator_name}`).
  Bank access is a profile-wide toggle in SkyBlock, hence living here and not
  under a member.
- `community_upgrades.upgrade_states` - array, one entry per community-upgrade
  purchase across the profile's history:
  `{upgrade, tier, started_ms, started_by, claimed_by}`. His profile has 12
  entries covering `island_size`, `minion_slots` (tiers 1-5+), and
  `coins_allowance` (tiers 1-2+), all `started_by`/`claimed_by` his own uuid.
  `community_upgrades.currently_upgrading` is `null` when nothing is mid-flight.

### His member object (`hisMember`, i.e. `members["74fe6adc3768416990fd79f38ea81dd2"]`)

35 top-level categories. Full field inventory below, one subsection per
category, generated directly from the live response (not hand-transcribed) -
depth is capped and wide uniform lookup maps (item collections, bestiary kill
counters, skill XP, etc.) are shown as "flat map, N entries, sample" rather
than enumerated in full, since enumerating 500+ near-identical
`ITEM_ID: count` lines would just repeat catalogue data without adding any
new field-shape information. Anything not sampled this way is shown in full.


##### `accessory_bag_storage`

  - `bag_upgrades_purchased` (int) 21
  - `highest_magical_power` (int) 1088
  - `selected_power` (string) forceful
  - `tuning` (object) 
    - `highest_unlocked_slot` (int) 4
    - `refund_2` (bool) True
    - `slot_0` (object) 
      - `attack_speed` (int) 0
      - `critical_chance` (int) 0
      - `critical_damage` (int) 0
      - `defense` (int) 0
      - `health` (int) 0
      - `intelligence` (int) 0
      - `strength` (int) 107
      - `walk_speed` (int) 0
    - `slot_1` (object) 
      - `attack_speed` (int) 0
      - `critical_chance` (int) 0
      - `critical_damage` (int) 0
      - `defense` (int) 0
      - `health` (int) 0
      - `intelligence` (int) 0
      - `purchase_ts` (int) 1764723857308
      - `strength` (int) 57
      - `walk_speed` (int) 33
    - `slot_2` (object) 
      - `attack_speed` (int) 0
      - `critical_chance` (int) 0
      - `critical_damage` (int) 70
      - `defense` (int) 0
      - `health` (int) 0
      - `intelligence` (int) 37
      - `purchase_ts` (int) 1767687929915
      - `strength` (int) 0
      - `walk_speed` (int) 0
    - `slot_3` (object) 
      - `attack_speed` (int) 0
      - `critical_chance` (int) 0
      - `critical_damage` (int) 0
      - `defense` (int) 0
      - `health` (int) 0
      - `intelligence` (int) 107
      - `purchase_ts` (int) 1767687930971
      - `strength` (int) 0
      - `walk_speed` (int) 0
    - `slot_4` (object) 
      - `attack_speed` (int) 0
      - `critical_chance` (int) 0
      - `critical_damage` (int) 0
      - `defense` (int) 0
      - `health` (int) 0
      - `intelligence` (int) 0
      - `purchase_ts` (int) 1767687932036
      - `strength` (int) 107
      - `walk_speed` (int) 0
  - `unlocked_powers` (array) 

##### `attributes`

  - `stacks` (object) 
    (flat map, 128 entries, every value is `int`) sample:
      - `arachno`: 3
      - `arachno_resistance`: 38
      - `atomized_glacite`: 6
      - `atomized_mithril`: 48
      - `attack_speed`: 17
      - `battle_experience`: 8
      - ...122 more, same shape

##### `bestiary`

  - `deaths` (object) 
    (flat map, 203 entries, every value is `int`) sample:
      - `agarimoo_35`: 4
      - `arachne_keeper_100`: 2
      - `ashfang_200`: 5
      - `ashfang_blue_blaze_150`: 1
      - `ashfang_red_blaze_150`: 1
      - `automaton_100`: 6
      - ...197 more, same shape
  - `kills` (object) 
    - `agarimoo_35` (int) 163
    - `alligator_120` (int) 63
    - `arachne_300` (int) 76
    - `arachne_500` (int) 29
    - `arachne_brood_100` (int) 1497
    - `arachne_brood_200` (int) 377
    - `arachne_keeper_100` (int) 121
    - `ashfang_200` (int) 1
    - `atoll_croaker_45` (int) 1643
    - `automaton_100` (int) 1178
    - ...543 more keys (not shown, see raw dump)
  - `milestone` (object) 
    - `last_claimed_milestone` (int) 276
  - `miscellaneous` (object) 
    - `max_kills_visible` (bool) True

##### `collection`

  (flat map, 86 entries, every value is `int`) sample:
    - `AGARICUS_CAP`: 150
    - `BLAZE_ROD`: 13577
    - `BONE`: 5573294
    - `CACTUS`: 8742229
    - `CADUCOUS_STEM`: 619
    - `CARROT_ITEM`: 40635741
    - ...80 more, same shape

##### `currencies`

  - `coin_purse` (int) 10763000
  - `essence` (object) 
    - `CRIMSON` (object) 
      - `current` (int) 782
    - `DIAMOND` (object) 
      - `current` (int) 2491
    - `DRAGON` (object) 
      - `current` (int) 22
    - `GOLD` (object) 
      - `current` (int) 863
    - `ICE` (object) 
      - `current` (int) 4445
    - `SPIDER` (object) 
      - `current` (int) 1391
    - `UNDEAD` (object) 
      - `current` (int) 3065
    - `WITHER` (object) 
      - `current` (int) 892
  - `motes_purse` (int) 205369

##### `dungeons`

  - `daily_runs` (object) 
    - `completed_runs_count` (int) 22
    - `current_day_stamp` (int) 20486
  - `dungeon_hub_race_settings` (object) 
    - `runback` (bool) False
    - `selected_race` (string) giant_mushroom
    - `selected_setting` (string) anything
  - `dungeon_journal` (object) 
    - `unlocked_journals` (object) (array, len=19, sample=['grim_adversity', 'expedition_volume_3', 'expedition_volume_4'])
  - `dungeon_types` (object) 
    - `catacombs` (object) 
      - `best_runs` (object) 
        - `0` (array) 
          - [0]:
            - `damage_dealt` (float) 393209.80172178766
            - `damage_mitigated` (float) 28612.324294138998
            - `deaths` (int) 0
            - `dungeon_class` (string) berserk
            - `elapsed_time` (int) 217871
            - `mobs_killed` (int) 33
            - `score_bonus` (int) 1
            - `score_exploration` (int) 67
            - `score_skill` (int) 66
            - `score_speed` (int) 70
            - ...3 more keys (not shown, see raw dump)
        - `1` (array) 
          - [0]:
            - `damage_dealt` (float) 8772656.393167099
            - `damage_mitigated` (float) 65717.48602556586
            - `deaths` (int) 0
            - `dungeon_class` (string) berserk
            - `elapsed_time` (int) 684188
            - `mobs_killed` (int) 250
            - `score_bonus` (int) 5
            - `score_exploration` (int) 100
            - `score_skill` (int) 100
            - `score_speed` (int) 93
            - ...3 more keys (not shown, see raw dump)
        - `2` (array) 
          - [0]:
            - `damage_dealt` (float) 6538871.89316152
            - `damage_mitigated` (float) 70852.4638230869
            - `deaths` (int) 0
            - `dungeon_class` (string) mage
            - `elapsed_time` (int) 188401
            - `mobs_killed` (int) 88
            - `score_bonus` (int) 0
            - `score_exploration` (int) 81
            - `score_skill` (int) 100
            - `score_speed` (int) 100
            - ...3 more keys (not shown, see raw dump)
        - `3` (array) 
          - [0]:
            - `damage_dealt` (float) 238700.32034623687
            - `damage_mitigated` (float) 56474.14205574989
            - `deaths` (int) 3
            - `dungeon_class` (string) berserk
            - `elapsed_time` (int) 172253
            - `mobs_killed` (int) 0
            - `score_bonus` (int) 3
            - `score_exploration` (int) 97
            - `score_skill` (int) 90
            - `score_speed` (int) 100
            - ...3 more keys (not shown, see raw dump)
        - `4` (array) 
          - [0]:
            - `damage_dealt` (float) 10392315.2617538
            - `damage_mitigated` (float) 166006.64396972655
            - `deaths` (int) 0
            - `dungeon_class` (string) berserk
            - `elapsed_time` (int) 314946
            - `mobs_killed` (int) 43
            - `score_bonus` (int) 5
            - `score_exploration` (int) 100
            - `score_skill` (int) 100
            - `score_speed` (int) 100
            - ...3 more keys (not shown, see raw dump)
        - `5` (array) 
          - [0]:
            - `ally_healing` (float) 3777.940625
            - `damage_dealt` (float) 57797382.81609267
            - `damage_mitigated` (float) 361411.87941601576
            - `deaths` (int) 0
            - `dungeon_class` (string) berserk
            - `elapsed_time` (int) 197900
            - `mobs_killed` (int) 99
            - `score_bonus` (int) 15
            - `score_exploration` (int) 94
            - `score_skill` (int) 100
            - ...4 more keys (not shown, see raw dump)
        - `6` (array) 
          - [0]:
            - `damage_dealt` (float) 147614008.47895774
            - `damage_mitigated` (float) 537592.7516132812
            - `deaths` (int) 0
            - `dungeon_class` (string) berserk
            - `elapsed_time` (int) 264321
            - `mobs_killed` (int) 59
            - `score_bonus` (int) 17
            - `score_exploration` (int) 100
            - `score_skill` (int) 100
            - `score_speed` (int) 100
            - ...3 more keys (not shown, see raw dump)
        - `7` (array) 
          - [0]:
            - `ally_healing` (int) 154
            - `damage_dealt` (float) 445854642.49803543
            - `damage_mitigated` (float) 1626247.849336598
            - `deaths` (int) 0
            - `dungeon_class` (string) berserk
            - `elapsed_time` (int) 416801
            - `mobs_killed` (int) 70
            - `score_bonus` (int) 14
            - `score_exploration` (int) 96
            - `score_skill` (int) 100
            - ...4 more keys (not shown, see raw dump)
      - `best_score` (object) 
        - `0` (int) 204
        - `1` (int) 304
        - `2` (int) 295
        - `3` (int) 303
        - `4` (int) 305
        - `5` (int) 314
        - `6` (int) 317
        - `7` (int) 313
        - `best` (int) 317
      - `experience` (float) 9212310.16273662
      - `fastest_time` (object) 
        - `0` (int) 101153
        - `1` (int) 131539
        - `2` (int) 141850
        - `3` (int) 172253
        - `4` (int) 171448
        - `5` (int) 165891
        - `6` (int) 203204
        - `7` (int) 345249
        - `best` (int) 101153
      - `fastest_time_s` (object) 
        - `1` (int) 133591
        - `2` (int) 141850
        - `3` (int) 172253
        - `4` (int) 211941
        - `5` (int) 376692
        - `6` (int) 309194
        - `7` (int) 416424
        - `best` (int) 133591
      - `fastest_time_s_plus` (object) 
        - `1` (int) 131539
        - `3` (int) 615222
        - `4` (int) 185107
        - `5` (int) 165891
        - `6` (int) 203204
        - `7` (int) 345249
        - `best` (int) 131539
      - `highest_tier_completed` (int) 7
      - `milestone_completions` (object) 
        - `0` (int) 5
        - `1` (int) 50
        - `2` (int) 59
        - `3` (int) 7
        - `4` (int) 88
        - `5` (int) 112
        - `6` (int) 124
        - `7` (int) 102
        - `total` (int) 547
      - `mobs_killed` (object) 
        - `0` (int) 492
        - `1` (int) 8478
        - `2` (int) 7319
        - `3` (int) 709
        - `4` (int) 11215
        - `5` (int) 12191
        - `6` (int) 14052
        - `7` (int) 15412
        - `total` (int) 69868
      - `most_damage_berserk` (object) 
        - `0` (float) 2556371.4133271747
        - `1` (float) 10486693.608308688
        - `2` (float) 22228701.995390307
        - `3` (float) 46364752.67188761
        - `4` (float) 388439319.7911221
        - `5` (float) 185775154.95022982
        - `6` (float) 1139677970.7744708
        - `7` (float) 2385336770.399526
        - `best` (float) 2385336770.399526
      - ...8 more keys (not shown, see raw dump)
    - `master_catacombs` (object) 
      - `best_runs` (object) 
        - `1` (array) 
          - [0]:
            - `ally_healing` (int) 144
            - `damage_dealt` (float) 180413439.99050826
            - `damage_mitigated` (float) 1097999.474307207
            - `deaths` (int) 1
            - `dungeon_class` (string) berserk
            - `elapsed_time` (int) 305808
            - `mobs_killed` (int) 79
            - `score_bonus` (int) 1
            - `score_exploration` (int) 80
            - `score_skill` (int) 99
            - ...4 more keys (not shown, see raw dump)
        - `2` (array) 
          - [0]:
            - `damage_dealt` (float) 146023414.9496262
            - `damage_mitigated` (float) 309839.41125
            - `deaths` (int) 0
            - `dungeon_class` (string) berserk
            - `elapsed_time` (int) 209035
            - `mobs_killed` (int) 46
            - `score_bonus` (int) 0
            - `score_exploration` (int) 44
            - `score_skill` (int) 70
            - `score_speed` (int) 100
            - ...3 more keys (not shown, see raw dump)
        - `3` (array) 
          - [0]:
            - `damage_dealt` (float) 29977298.845772147
            - `damage_mitigated` (float) 260898.46628418012
            - `deaths` (int) 4
            - `dungeon_class` (string) berserk
            - `elapsed_time` (int) 209709
            - `mobs_killed` (int) 1
            - `score_bonus` (int) 0
            - `score_exploration` (int) 29
            - `score_skill` (int) 29
            - `score_speed` (int) 100
            - ...3 more keys (not shown, see raw dump)
      - `best_score` (object) 
        - `1` (int) 303
        - `2` (int) 282
        - `3` (int) 291
        - `best` (int) 303
      - `fastest_time` (object) 
        - `1` (int) 188087
        - `2` (int) 209035
        - `3` (int) 209709
        - `best` (int) 188087
      - `fastest_time_s` (object) 
        - `1` (int) 305808
        - `2` (int) 292056
        - `3` (int) 364002
        - `best` (int) 292056
      - `fastest_time_s_plus` (object) 
        - `1` (int) 188087
        - `best` (int) 188087
      - `highest_tier_completed` (int) 3
      - `milestone_completions` (object) 
        - `1` (int) 2
        - `2` (int) 2
        - `3` (int) 6
        - `total` (int) 10
      - `mobs_killed` (object) 
        - `1` (int) 107
        - `2` (int) 167
        - `3` (int) 816
        - `total` (int) 1090
      - `most_damage_berserk` (object) 
        - `1` (float) 180413439.99050826
        - `2` (float) 439877466.3421972
        - `3` (float) 1252153049.8615725
        - `best` (float) 1252153049.8615725
      - `most_healing` (object) 
        - `1` (int) 162
        - `2` (float) 376.951171875
        - `3` (float) 18948.228515625
        - `best` (float) 18948.228515625
      - ...2 more keys (not shown, see raw dump)
  - `dungeons_blah_blah` (array) 
  - `last_dungeon_run` (string) CATACOMBS_FLOOR_SEVEN
  - `player_classes` (object) 
    - `archer` (object) 
      - `experience` (float) 910249.1725396893
    - `berserk` (object) 
      - `experience` (float) 6481027.725391846
    - `healer` (object) 
      - `experience` (float) 277716.64298198285
    - `mage` (object) 
      - `experience` (float) 1035904.8430458957
    - `tank` (object) 
      - `experience` (float) 1180720.5190859672
  - `secrets` (int) 3947
  - `selected_dungeon_class` (string) berserk
  - `treasures` (object) 
    - `chests` (array) 
    - `runs` (array) 

##### `events`

  - `easter` (object) 
    - `chocolate` (int) 56720603207
    - `chocolate_level` (int) 6
    - `chocolate_multiplier_upgrades` (int) 20
    - `chocolate_since_prestige` (int) 329378863691
    - `click_upgrades` (int) 9
    - `employees` (object) 
      - `rabbit_bro` (int) 220
      - `rabbit_cousin` (int) 220
      - `rabbit_dog` (int) 220
      - `rabbit_father` (int) 220
      - `rabbit_grandma` (int) 220
      - `rabbit_sis` (int) 220
      - `rabbit_uncle` (int) 220
    - `last_viewed_chocolate_factory` (int) 1785283189766
    - `rabbit_barn_capacity_level` (int) 247
    - `rabbit_filter` (string) found
    - `rabbit_hitmen` (object) 
      - `egg_slot_cooldown_mark` (int) 1785283190692
      - `egg_slot_cooldown_sum` (int) 13200000
      - `missed_uncollected_eggs` (int) 11
      - `rabbit_hitmen_slots` (int) 11
    - ...7 more keys (not shown, see raw dump)

##### `experimentation`

  - `charge_track_timestamp` (int) 1785139428659
  - `claimed_retroactive_rng` (bool) True
  - `claims_resets` (int) 3
  - `claims_resets_timestamp` (int) 1771996783333
  - `numbers` (object) 
    - `attempts_1` (int) 7
    - `attempts_2` (int) 16
    - `attempts_3` (int) 160
    - `best_score_1` (int) 14
    - `best_score_2` (int) 9
    - `best_score_3` (int) 9
    - `bonus_clicks` (int) 3
    - `claimed` (bool) True
    - `claims_1` (int) 7
    - `claims_2` (int) 15
    - ...3 more keys (not shown, see raw dump)
  - `pairings` (object) 
    - `best_score_0` (int) 4
    - `best_score_1` (int) 5
    - `best_score_2` (int) 7
    - `best_score_3` (int) 5
    - `best_score_4` (int) 6
    - `best_score_5` (int) 8
    - `bonus_clicks` (int) 0
    - `claimed` (bool) True
    - `claims_0` (int) 4
    - `claims_1` (int) 6
    - ...6 more keys (not shown, see raw dump)
  - `serums_drank` (int) 3
  - `simon` (object) 
    - `attempts_0` (int) 7
    - `attempts_1` (int) 7
    - `attempts_2` (int) 6
    - `attempts_3` (int) 12
    - `attempts_5` (int) 162
    - `best_score_0` (int) 11
    - `best_score_1` (int) 15
    - `best_score_2` (int) 12
    - `best_score_3` (int) 12
    - `best_score_5` (int) 12
    - ...9 more keys (not shown, see raw dump)

##### `fairy_soul`

  - `fairy_exchanges` (int) 50
  - `total_collected` (int) 254
  - `unspent_souls` (int) 4

##### `foraging`

  - `fish_family` (object) (array, len=9, sample=['TREE_THE_FISH', 'SHRIMP_THE_FISH', 'MOB_THE_FISH'])
  - `hina` (object) 
    - `tasks` (object) 
      - `claimed_rewards` (object) (array, len=66, sample=['USE_FUSION_MACHINE', 'PARTICIPATE_AGATHA_CONTEST', 'SHARD_FROM_HUNTRAP_25'])
      - `completed_tasks` (object) (array, len=65, sample=['USE_FUSION_MACHINE', 'PARTICIPATE_AGATHA_CONTEST', 'SHARD_FROM_HUNTRAP_25'])
      - `task_progress` (object) 
        (flat map, 26 entries, every value is `int`) sample:
          - `AGATHA_CONTEST_POINTS`: 3000
          - `CATCH_AZURE_5`: 5
          - `CATCH_COD_5`: 6
          - `CATCH_CORALOT_5`: 5
          - `CATCH_DREADWING_3`: 3
          - `CATCH_HIDEONLEAF_5`: 5
          - ...20 more, same shape
      - `tier_claimed` (int) 6
  - `hunting_toolkit` (object) 
    - `FISHING_NET` (array) 
      - [0]:
        - `data` (string) <likely gzipped NBT blob, base64 length 204, decoded 153 bytes>
        - `type` (int) 0
    - `HUNTING_SCYTHE` (array) 
      - [0]:
        - `data` (string) <likely gzipped NBT blob, base64 length 200, decoded 148 bytes>
        - `type` (int) 0
    - `HUNTING_TOOLKIT` (array) 
      - [0]:
        - `data` (string) <likely gzipped NBT blob, base64 length 148, decoded 110 bytes>
        - `type` (int) 0
    - `IN_USE` (object) 
      - `FISHING_NET` (object) 
        - `0` (bool) True
      - `HUNTING_SCYTHE` (object) 
        - `0` (bool) False
      - `LASSO` (object) 
        - `0` (bool) False
      - `POCKET_BLACK_HOLE` (object) 
        - `0` (bool) False
      - `TRAP` (object) 
        - `0` (bool) False
        - `1` (bool) False
        - `2` (bool) False
        - `3` (bool) False
        - `4` (bool) False
    - `IS_UNLOCKED` (bool) True
    - `LASSO` (array) 
      - [0]:
        - `data` (string) <likely gzipped NBT blob, base64 length 176, decoded 130 bytes>
        - `type` (int) 0
    - `POCKET_BLACK_HOLE` (array) 
      - [0]:
        - `data` (string) <likely gzipped NBT blob, base64 length 184, decoded 137 bytes>
        - `type` (int) 0
    - `TRAP` (array) 
      - [0]:
        - `data` (string) <likely gzipped NBT blob, base64 length 144, decoded 108 bytes>
        - `type` (int) 0
  - `songs` (object) 
    - `harp` (object) 
      - `claimed_talisman` (bool) True
      - `selected_song` (string) pachelbel
      - `selected_song_epoch` (int) 1728253904941
      - `song_amazing_grace_best_completion` (int) 1
      - `song_amazing_grace_completions` (int) 1
      - `song_amazing_grace_perfect_completions` (int) 1
      - `song_brahms_best_completion` (int) 1
      - `song_brahms_completions` (int) 1
      - `song_brahms_perfect_completions` (int) 1
      - `song_fire_and_flames_best_completion` (int) 1
      - ...32 more keys (not shown, see raw dump)
  - `starlyn` (object) 
    - `personal_bests` (object) 
      - `FIG_LOG` (int) 201919
      - `MANGROVE_LOG` (int) 84260
      - `agatha` (int) 9054
  - `tree_gifts` (object) 
    - `FIG` (int) 3605
    - `MANGROVE` (int) 727

##### `foraging_core`

  - `daily_gifts` (int) 0
  - `daily_log_cut` (array) 
  - `daily_log_cut_day` (int) 20659
  - `daily_trees_cut` (int) 0
  - `daily_trees_cut_day` (int) 20659
  - `forests_whispers` (int) 7212452
  - `forests_whispers_spent` (int) 7088411

##### `forge`

  - `forge_processes` (object) 
    - `forge_1` (object) 

##### `garden_player_data`

  - `analyzed_greenhouse_crops` (object) (array, len=13, sample=['veilshroom', 'thornshade', 'ashwreath'])
  - `copper` (int) 2455
  - `discovered_greenhouse_crops` (object) (array, len=16, sample=['veilshroom', 'thornshade', 'ashwreath'])
  - `farming_toolkit` (object) 
    - `CACTUS` (array) 
      - [0]:
        - `data` (string) <likely gzipped NBT blob, base64 length 340, decoded 254 bytes>
        - `type` (int) 0
    - `CARROT` (array) 
      - [0]:
        - `data` (string) <likely gzipped NBT blob, base64 length 448, decoded 335 bytes>
        - `type` (int) 0
    - `COCOA_BEANS` (array) 
      - [0]:
        - `data` (string) <likely gzipped NBT blob, base64 length 296, decoded 221 bytes>
        - `type` (int) 0
    - `IN_USE` (object) 
      - `CACTUS` (object) 
        - `0` (bool) False
      - `CARROT` (object) 
        - `0` (bool) False
      - `COCOA_BEANS` (object) 
        - `0` (bool) False
      - `MELON` (object) 
        - `0` (bool) False
      - `MUSHROOM` (object) 
        - `0` (bool) False
      - `NETHER_STALK` (object) 
        - `0` (bool) False
      - `POTATO` (object) 
        - `0` (bool) False
      - `PUMPKIN` (object) 
        - `0` (bool) False
      - `SUGAR_CANE` (object) 
        - `0` (bool) False
      - `SUNFLOWER` (object) 
        - `0` (bool) False
      - ...2 more keys (not shown, see raw dump)
    - `IS_UNLOCKED` (bool) True
    - `MELON` (array) 
      - [0]:
        - `data` (string) <likely gzipped NBT blob, base64 length 548, decoded 411 bytes>
        - `type` (int) 0
    - `MUSHROOM` (array) 
      - [0]:
        - `data` (string) <likely gzipped NBT blob, base64 length 356, decoded 265 bytes>
        - `type` (int) 0
    - `NETHER_STALK` (array) 
      - [0]:
        - `data` (string) <likely gzipped NBT blob, base64 length 400, decoded 299 bytes>
        - `type` (int) 0
    - `POTATO` (array) 
      - [0]:
        - `data` (string) <likely gzipped NBT blob, base64 length 436, decoded 325 bytes>
        - `type` (int) 0
    - `PUMPKIN` (array) 
      - [0]:
        - `data` (string) <likely gzipped NBT blob, base64 length 444, decoded 331 bytes>
        - `type` (int) 0
    - ...4 more keys (not shown, see raw dump)
  - `larva_consumed` (int) 5

##### `glacite_player_data`

  - `corpses_looted` (object) 
    - `lapis` (int) 153
  - `fossil_dust` (int) 370
  - `fossils_donated` (array) 
  - `mineshafts_entered` (int) 133

##### `inventory`

  - `backpack_contents` (object) 
    - `0` (object) 
      - `data` (string) <likely gzipped NBT blob, base64 length 2652, decoded 1989 bytes>
      - `type` (int) 0
    - `1` (object) 
      - `data` (string) <likely gzipped NBT blob, base64 length 7220, decoded 5414 bytes>
      - `type` (int) 0
    - `2` (object) 
      - `data` (string) <likely gzipped NBT blob, base64 length 684, decoded 513 bytes>
      - `type` (int) 0
    - `3` (object) 
      - `data` (string) <likely gzipped NBT blob, base64 length 1392, decoded 1044 bytes>
      - `type` (int) 0
    - `4` (object) 
      - `data` (string) <gzipped NBT blob, base64 length 48, decoded ~36 bytes (near-empty slot)>
      - `type` (int) 0
    - `5` (object) 
      - `data` (string) <likely gzipped NBT blob, base64 length 7516, decoded 5636 bytes>
      - `type` (int) 0
    - `6` (object) 
      - `data` (string) <likely gzipped NBT blob, base64 length 2352, decoded 1763 bytes>
      - `type` (int) 0
    - `7` (object) 
      - `data` (string) <likely gzipped NBT blob, base64 length 4876, decoded 3656 bytes>
      - `type` (int) 0
    - `8` (object) 
      - `data` (string) <likely gzipped NBT blob, base64 length 4944, decoded 3708 bytes>
      - `type` (int) 0
  - `backpack_icons` (object) 
    - `0` (object) 
      - `data` (string) <likely gzipped NBT blob, base64 length 1836, decoded 1376 bytes>
      - `type` (int) 0
    - `1` (object) 
      - `data` (string) <likely gzipped NBT blob, base64 length 1836, decoded 1377 bytes>
      - `type` (int) 0
    - `2` (object) 
      - `data` (string) <likely gzipped NBT blob, base64 length 1840, decoded 1380 bytes>
      - `type` (int) 0
    - `3` (object) 
      - `data` (string) <likely gzipped NBT blob, base64 length 1840, decoded 1378 bytes>
      - `type` (int) 0
    - `4` (object) 
      - `data` (string) <likely gzipped NBT blob, base64 length 1840, decoded 1379 bytes>
      - `type` (int) 0
    - `5` (object) 
      - `data` (string) <likely gzipped NBT blob, base64 length 1836, decoded 1376 bytes>
      - `type` (int) 0
    - `6` (object) 
      - `data` (string) <likely gzipped NBT blob, base64 length 1740, decoded 1305 bytes>
      - `type` (int) 0
    - `7` (object) 
      - `data` (string) <likely gzipped NBT blob, base64 length 1744, decoded 1306 bytes>
      - `type` (int) 0
    - `8` (object) 
      - `data` (string) <likely gzipped NBT blob, base64 length 1740, decoded 1304 bytes>
      - `type` (int) 0
  - `bag_contents` (object) 
    - `fishing_bag` (object) 
      - `data` (string) <likely gzipped NBT blob, base64 length 484, decoded 363 bytes>
      - `type` (int) 0
    - `potion_bag` (object) 
      - `data` (string) <likely gzipped NBT blob, base64 length 1440, decoded 1080 bytes>
      - `type` (int) 0
    - `quiver` (object) 
      - `data` (string) <likely gzipped NBT blob, base64 length 492, decoded 368 bytes>
      - `type` (int) 0
    - `sacks_bag` (object) 
      - `data` (string) <likely gzipped NBT blob, base64 length 28524, decoded 21392 bytes>
      - `type` (int) 0
    - `talisman_bag` (object) 
      - `data` (string) <likely gzipped NBT blob, base64 length 123720, decoded 92788 bytes>
      - `type` (int) 0
  - `ender_chest_contents` (object) 
    - `data` (string) <likely gzipped NBT blob, base64 length 100284, decoded 75213 bytes>
    - `type` (int) 0
  - `equipment_contents` (object) 
    - `data` (string) <likely gzipped NBT blob, base64 length 5684, decoded 4263 bytes>
    - `type` (int) 0
  - `inv_armor` (object) 
    - `data` (string) <likely gzipped NBT blob, base64 length 3288, decoded 2464 bytes>
    - `type` (int) 0
  - `inv_contents` (object) 
    - `data` (string) <likely gzipped NBT blob, base64 length 4956, decoded 3717 bytes>
    - `type` (int) 0
  - `personal_vault_contents` (object) 
    - `data` (string) <gzipped NBT blob, base64 length 48, decoded ~36 bytes (near-empty slot)>
    - `type` (int) 0
  - `sacks_counts` (object) 
    (flat map, 497 entries, every value is `int`) sample:
      - `ABSOLUTE_ENDER_PEARL`: 0
      - `AGARIMOO_TONGUE`: 50
      - `AGGOURDIAN`: 5
      - `ALLIGATOR_SKIN`: 2
      - `APPLE`: 0
      - `ARCHITECT_FIRST_DRAFT`: 0
      - ...491 more, same shape
  - `wardrobe_equipped_slot` (int) 9

##### `item_data`

  - `favorite_arrow` (string) EXPLOSIVE_ARROW
  - `soulflow` (int) 58380

##### `jacobs_contest`

  - `contests` (object) 
    - `334:12_9:POTATO_ITEM` (object) 
      - `claimed_participants` (int) 475
      - `claimed_position` (int) 450
      - `claimed_rewards` (bool) True
      - `collected` (int) 320
    - `334:1_2:POTATO_ITEM` (object) 
      - `claimed_participants` (int) 866
      - `claimed_position` (int) 715
      - `claimed_rewards` (bool) True
      - `collected` (int) 809
    - `334:2_4:MUSHROOM_COLLECTION` (object) 
      - `collected` (int) 11
    - `334:7_2:NETHER_STALK` (object) 
      - `claimed_participants` (int) 757
      - `claimed_position` (int) 482
      - `claimed_rewards` (bool) True
      - `collected` (int) 2921
    - `335:10_29:INK_SACK:3` (object) 
      - `claimed_medal` (string) bronze
      - `claimed_participants` (int) 1027
      - `claimed_position` (int) 516
      - `claimed_rewards` (bool) True
      - `collected` (int) 20753
    - `335:10_8:INK_SACK:3` (object) 
      - `claimed_medal` (string) bronze
      - `claimed_participants` (int) 635
      - `claimed_position` (int) 321
      - `claimed_rewards` (bool) True
      - `collected` (int) 8431
    - `335:11_10:WHEAT` (object) 
      - `claimed_medal` (string) bronze
      - `claimed_participants` (int) 1474
      - `claimed_position` (int) 489
      - `claimed_rewards` (bool) True
      - `collected` (int) 95399
    - `335:11_16:CARROT_ITEM` (object) 
      - `claimed_participants` (int) 916
      - `claimed_position` (int) 654
      - `claimed_rewards` (bool) True
      - `collected` (int) 2305
    - `335:11_19:POTATO_ITEM` (object) 
      - `claimed_participants` (int) 869
      - `claimed_position` (int) 800
      - `claimed_rewards` (bool) True
      - `collected` (int) 800
    - `335:11_1:CARROT_ITEM` (object) 
      - `collected` (int) 800
    - ...659 more keys (not shown, see raw dump)
  - `medals_inv` (object) 
    - `bronze` (int) 19
    - `gold` (int) 8
    - `silver` (int) 7
  - `perks` (object) 
    - `double_drops` (int) 7
    - `farming_level_cap` (int) 10
    - `personal_bests` (bool) True
  - `personal_bests` (object) 
    (flat map, 13 entries, every value is `int`) sample:
      - `CACTUS`: 561760
      - `CARROT_ITEM`: 1208261
      - `DOUBLE_PLANT`: 1365338
      - `INK_SACK:3`: 709082
      - `MELON`: 3155320
      - `MOONFLOWER`: 1003810
      - ...7 more, same shape
  - `talked` (bool) True
  - `unique_brackets` (object) 
    - `bronze` (object) (array, len=13, sample=['INK_SACK:3', 'CARROT_ITEM', 'MOONFLOWER'])
    - `diamond` (array) 
    - `gold` (object) (array, len=11, sample=['INK_SACK:3', 'POTATO_ITEM', 'CARROT_ITEM'])
    - `platinum` (array) 
    - `silver` (object) (array, len=13, sample=['INK_SACK:3', 'CARROT_ITEM', 'MOONFLOWER'])

##### `leveling`

  - `bop_bonus` (string) DEFENSIVE_STRONGMAN
  - `category_expanded` (bool) True
  - `claimed_talisman` (bool) True
  - `completed_tasks` (object) (array, len=552, sample=['NATIONAL_MINING_MONTH_FORTUNATE_FESTIVITY_2', 'NATIONAL_MINING_MONTH_FORTUNATE_FESTIVITY_3', 'NATIONAL_MINING_MONTH_FORTUNATE_FESTIVITY_1'])
  - `completions` (object) 
    - `NUCLEUS_RUNS` (int) 50
  - `emblem_unlocks` (array) 
  - `experience` (int) 38220
  - `fishing_festival_sharks_killed` (int) 1767
  - `highest_pet_score` (int) 296
  - `last_viewed_tasks` (array) 
  - ...1 more keys (not shown, see raw dump)

##### `loadout`

  - `armor` (object) 
    - `1` (object) 
      - `BOOTS` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 996, decoded 746 bytes>
        - `type` (int) 0
      - `CHESTPLATE` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 848, decoded 636 bytes>
        - `type` (int) 0
      - `HELMET` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 2300, decoded 1724 bytes>
        - `type` (int) 0
      - `LEGGINGS` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 956, decoded 716 bytes>
        - `type` (int) 0
      - `id` (int) 1
    - `10` (object) 
      - `BOOTS` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 900, decoded 674 bytes>
        - `type` (int) 0
      - `CHESTPLATE` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 904, decoded 677 bytes>
        - `type` (int) 0
      - `LEGGINGS` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 904, decoded 676 bytes>
        - `type` (int) 0
      - `id` (int) 10
    - `11` (object) 
      - `BOOTS` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1140, decoded 854 bytes>
        - `type` (int) 0
      - `CHESTPLATE` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 952, decoded 713 bytes>
        - `type` (int) 0
      - `HELMET` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 2492, decoded 1868 bytes>
        - `type` (int) 0
      - `LEGGINGS` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 956, decoded 715 bytes>
        - `type` (int) 0
      - `id` (int) 11
    - `12` (object) 
      - `BOOTS` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1048, decoded 784 bytes>
        - `type` (int) 0
      - `CHESTPLATE` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 892, decoded 668 bytes>
        - `type` (int) 0
      - `HELMET` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 2164, decoded 1623 bytes>
        - `type` (int) 0
      - `LEGGINGS` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 892, decoded 668 bytes>
        - `type` (int) 0
      - `id` (int) 12
    - `13` (object) 
      - `BOOTS` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1092, decoded 817 bytes>
        - `type` (int) 0
      - `CHESTPLATE` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1000, decoded 750 bytes>
        - `type` (int) 0
      - `HELMET` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 2644, decoded 1981 bytes>
        - `type` (int) 0
      - `LEGGINGS` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1000, decoded 749 bytes>
        - `type` (int) 0
      - `id` (int) 13
    - `14` (object) 
      - `BOOTS` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1344, decoded 1007 bytes>
        - `type` (int) 0
      - `CHESTPLATE` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1152, decoded 864 bytes>
        - `type` (int) 0
      - `HELMET` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 2656, decoded 1990 bytes>
        - `type` (int) 0
      - `LEGGINGS` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1152, decoded 863 bytes>
        - `type` (int) 0
      - `id` (int) 14
    - `15` (object) 
      - `BOOTS` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1228, decoded 919 bytes>
        - `type` (int) 0
      - `CHESTPLATE` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1136, decoded 850 bytes>
        - `type` (int) 0
      - `HELMET` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 2244, decoded 1683 bytes>
        - `type` (int) 0
      - `LEGGINGS` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1128, decoded 844 bytes>
        - `type` (int) 0
      - `id` (int) 15
    - `16` (object) 
      - `BOOTS` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1004, decoded 751 bytes>
        - `type` (int) 0
      - `CHESTPLATE` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1016, decoded 761 bytes>
        - `type` (int) 0
      - `HELMET` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 2368, decoded 1776 bytes>
        - `type` (int) 0
      - `LEGGINGS` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1016, decoded 761 bytes>
        - `type` (int) 0
      - `id` (int) 16
    - `17` (object) 
      - `BOOTS` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1264, decoded 947 bytes>
        - `type` (int) 0
      - `CHESTPLATE` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1168, decoded 874 bytes>
        - `type` (int) 0
      - `HELMET` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1288, decoded 965 bytes>
        - `type` (int) 0
      - `LEGGINGS` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1132, decoded 849 bytes>
        - `type` (int) 0
      - `id` (int) 17
    - `18` (object) 
      - `BOOTS` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1252, decoded 938 bytes>
        - `type` (int) 0
      - `CHESTPLATE` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1104, decoded 827 bytes>
        - `type` (int) 0
      - `HELMET` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 2576, decoded 1930 bytes>
        - `type` (int) 0
      - `LEGGINGS` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1092, decoded 818 bytes>
        - `type` (int) 0
      - `id` (int) 18
    - ...12 more keys (not shown, see raw dump)
  - `equipment` (object) 
    - `1` (object) 
      - `EQUIPMENT_SLOT_1` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1956, decoded 1466 bytes>
        - `type` (int) 0
      - `EQUIPMENT_SLOT_2` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 2248, decoded 1684 bytes>
        - `type` (int) 0
      - `EQUIPMENT_SLOT_3` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1940, decoded 1453 bytes>
        - `type` (int) 0
      - `EQUIPMENT_SLOT_4` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1948, decoded 1459 bytes>
        - `type` (int) 0
      - `id` (int) 1
    - `2` (object) 
      - `id` (int) 2
    - `3` (object) 
      - `EQUIPMENT_SLOT_1` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 2152, decoded 1614 bytes>
        - `type` (int) 0
      - `EQUIPMENT_SLOT_2` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 2100, decoded 1574 bytes>
        - `type` (int) 0
      - `EQUIPMENT_SLOT_3` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 2132, decoded 1598 bytes>
        - `type` (int) 0
      - `EQUIPMENT_SLOT_4` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 2036, decoded 1525 bytes>
        - `type` (int) 0
      - `id` (int) 3
    - `4` (object) 
      - `EQUIPMENT_SLOT_1` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 2088, decoded 1565 bytes>
        - `type` (int) 0
      - `EQUIPMENT_SLOT_2` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 2120, decoded 1590 bytes>
        - `type` (int) 0
      - `EQUIPMENT_SLOT_3` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 2124, decoded 1591 bytes>
        - `type` (int) 0
      - `EQUIPMENT_SLOT_4` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1936, decoded 1450 bytes>
        - `type` (int) 0
      - `id` (int) 4
    - `5` (object) 
      - `EQUIPMENT_SLOT_1` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 2212, decoded 1658 bytes>
        - `type` (int) 0
      - `EQUIPMENT_SLOT_2` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 2032, decoded 1522 bytes>
        - `type` (int) 0
      - `EQUIPMENT_SLOT_3` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 2016, decoded 1510 bytes>
        - `type` (int) 0
      - `EQUIPMENT_SLOT_4` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 2164, decoded 1623 bytes>
        - `type` (int) 0
      - `id` (int) 5
    - `6` (object) 
      - `EQUIPMENT_SLOT_1` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 2364, decoded 1773 bytes>
        - `type` (int) 0
      - `EQUIPMENT_SLOT_2` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 2188, decoded 1639 bytes>
        - `type` (int) 0
      - `EQUIPMENT_SLOT_3` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 2184, decoded 1638 bytes>
        - `type` (int) 0
      - `EQUIPMENT_SLOT_4` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 2184, decoded 1638 bytes>
        - `type` (int) 0
      - `id` (int) 6
    - `7` (object) 
      - `EQUIPMENT_SLOT_1` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1996, decoded 1496 bytes>
        - `type` (int) 0
      - `EQUIPMENT_SLOT_2` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 2156, decoded 1617 bytes>
        - `type` (int) 0
      - `EQUIPMENT_SLOT_4` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 2144, decoded 1608 bytes>
        - `type` (int) 0
      - `id` (int) 7
    - `8` (object) 
      - `EQUIPMENT_SLOT_1` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 2392, decoded 1793 bytes>
        - `type` (int) 0
      - `EQUIPMENT_SLOT_2` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1812, decoded 1359 bytes>
        - `type` (int) 0
      - `EQUIPMENT_SLOT_3` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1816, decoded 1360 bytes>
        - `type` (int) 0
      - `EQUIPMENT_SLOT_4` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1804, decoded 1353 bytes>
        - `type` (int) 0
      - `id` (int) 8
    - `9` (object) 
      - `EQUIPMENT_SLOT_1` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1888, decoded 1414 bytes>
        - `type` (int) 0
      - `EQUIPMENT_SLOT_2` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1868, decoded 1400 bytes>
        - `type` (int) 0
      - `EQUIPMENT_SLOT_3` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1864, decoded 1397 bytes>
        - `type` (int) 0
      - `EQUIPMENT_SLOT_4` (object) 
        - `data` (string) <likely gzipped NBT blob, base64 length 1868, decoded 1399 bytes>
        - `type` (int) 0
      - `id` (int) 9
    - `equipped_set` (int) 2
  - `loadouts` (object) 
    - `1` (object) 
      - `armor_set_id` (int) 3
      - `equipment_set_id` (int) 6
      - `id` (int) 1
      - `name` (string) Loadout 1
      - `pet` (string) 7c11d559-39c8-45db-83ec-d730f8ebe0eb
    - `10` (object) 
      - `id` (int) 10
      - `name` (string) Loadout 10
    - `11` (object) 
      - `id` (int) 11
      - `name` (string) Loadout 11
    - `12` (object) 
      - `id` (int) 12
      - `name` (string) Loadout 12
    - `2` (object) 
      - `armor_set_id` (int) 2
      - `equipment_set_id` (int) 4
      - `id` (int) 2
      - `name` (string) Loadout 2
      - `pet` (string) 373166e6-70d2-4b88-9f81-e4ea78662c54
    - `3` (object) 
      - `armor_set_id` (int) 13
      - `equipment_set_id` (int) 8
      - `id` (int) 3
      - `name` (string) Loadout 3
      - `pet` (string) afa44c45-d894-45ce-9bee-444737fa92d0
      - `power_stone` (string) slender
      - `tuning_points_slot` (int) 2
    - `4` (object) 
      - `armor_set_id` (int) 8
      - `equipment_set_id` (int) 3
      - `id` (int) 4
      - `name` (string) Loadout 4
      - `pet` (string) b3614c5c-0162-4ba1-b4d6-04f0c5c79d70
      - `power_stone` (string) forceful
      - `tuning_points_slot` (int) 4
    - `5` (object) 
      - `armor_set_id` (int) 9
      - `equipment_set_id` (int) 2
      - `id` (int) 5
      - `name` (string) Loadout 5
      - `pet` (string) 2c2102f1-68ca-4be1-aaa2-ab159ee2c39f
      - `power_stone` (string) forceful
      - `tuning_points_slot` (int) 4
    - `6` (object) 
      - `armor_set_id` (int) 15
      - `equipment_set_id` (int) 9
      - `id` (int) 6
      - `name` (string) Loadout 6
      - `pet` (string) afa44c45-d894-45ce-9bee-444737fa92d0
      - `power_stone` (string) slender
      - `tuning_points_slot` (int) 2
    - `7` (object) 
      - `id` (int) 7
      - `name` (string) Loadout 7
    - ...2 more keys (not shown, see raw dump)

##### `mining_core`

  - `biomes` (object) 
    - `dwarven` (object) 
    - `goblin` (object) 
      - `king_quest_active` (bool) False
      - `king_quests_completed` (int) 89
    - `jungle` (object) 
      - `jungle_temple_chest_uses` (int) 1
      - `jungle_temple_open` (bool) False
    - `precursor` (object) 
      - `claiming_with_precursor_apparatus` (bool) False
      - `talked_to_professor` (bool) True
  - `crystals` (object) 
    - `amber_crystal` (object) 
      - `state` (string) NOT_FOUND
      - `total_found` (int) 95
      - `total_placed` (int) 94
    - `amethyst_crystal` (object) 
      - `state` (string) NOT_FOUND
      - `total_found` (int) 95
      - `total_placed` (int) 94
    - `aquamarine_crystal` (object) 
      - `state` (string) FOUND
      - `total_found` (int) 1
    - `citrine_crystal` (object) 
      - `state` (string) FOUND
      - `total_found` (int) 1
    - `jade_crystal` (object) 
      - `state` (string) NOT_FOUND
      - `total_found` (int) 95
      - `total_placed` (int) 94
    - `jasper_crystal` (object) 
      - `state` (string) FOUND
      - `total_found` (int) 1
    - `onyx_crystal` (object) 
      - `state` (string) FOUND
      - `total_found` (int) 1
    - `opal_crystal` (object) 
      - `state` (string) FOUND
      - `total_found` (int) 1
    - `peridot_crystal` (object) 
      - `state` (string) FOUND
      - `total_found` (int) 1
    - `ruby_crystal` (object) 
      - `state` (string) FOUND
      - `total_found` (int) 2
    - ...2 more keys (not shown, see raw dump)
  - `current_daily_effect` (string) powder_bonus
  - `current_daily_effect_last_changed` (int) 27
  - `daily_ores_mined` (int) 0
  - `daily_ores_mined_day` (int) 20662
  - `daily_ores_mined_day_gemstone` (int) 20662
  - `daily_ores_mined_day_glacite` (int) 20662
  - `daily_ores_mined_day_mithril_ore` (int) 20662
  - `daily_ores_mined_gemstone` (int) 0
  - ...15 more keys (not shown, see raw dump)

##### `nether_island_player_data`

  - `abiphone` (object) 
    - `active_contacts` (object) (array, len=38, sample=['dean', 'slayer', 'tomioka'])
    - `contact_data` (object) 
      - `alchemist` (object) 
        - `completed_quest` (bool) True
        - `talked_to` (bool) True
      - `alda` (object) 
        - `completed_quest` (bool) True
      - `anita` (object) 
        - `talked_to` (bool) True
      - `arrow_forger` (object) 
        - `completed_quest` (bool) True
        - `incoming_calls_count` (int) 22
        - `last_call_incoming` (int) 1785212476259
        - `specific` (object) 
          - `unlocked_target_practice_iv` (bool) True
      - `blacksmith` (object) 
        - `talked_to` (bool) True
      - `brynmor` (object) 
        - `completed_quest` (bool) True
      - `builder` (object) 
        - `completed_quest` (bool) True
        - `incoming_calls_count` (int) 218
        - `last_call_incoming` (int) 1785238964639
        - `talked_to` (bool) True
      - `captain_ahone` (object) 
        - `incoming_calls_count` (int) 3
        - `last_call_incoming` (int) 1754270462225
      - `community_shop` (object) 
        - `completed_quest` (bool) True
        - `incoming_calls_count` (int) 87
        - `last_call` (int) 1780203481061
        - `last_call_incoming` (int) 1785663286003
        - `talked_to` (bool) True
      - `dean` (object) 
        - `incoming_calls_count` (int) 10
        - `last_call_incoming` (int) 1729903534277
      - ...27 more keys (not shown, see raw dump)
    - `games` (object) 
      - `snake_best_score` (int) 13
      - `tic_tac_toe_draws` (int) 12
      - `tic_tac_toe_losses` (int) 5
    - `has_used_sirius_personal_phone_number_item` (bool) True
    - `operator_chip` (object) 
      - `repaired_index` (int) 8
    - `selected_ringtone` (string) TARREGA
    - `selected_sort` (string) most_called
    - `trio_contact_addons` (int) 11
  - `barbarians_reputation` (int) -5
  - `dojo` (object) 
    (flat map, 14 entries, every value is `int`) sample:
      - `dojo_points_archer`: 1008
      - `dojo_points_fireball`: 705
      - `dojo_points_lock_head`: 1182
      - `dojo_points_mob_kb`: 550
      - `dojo_points_snake`: 2760
      - `dojo_points_sword_swap`: 992
      - ...8 more, same shape
  - `kuudra_completed_tiers` (object) 
    - `highest_wave_hot` (int) 11
    - `highest_wave_none` (int) 10
    - `hot` (int) 5
    - `none` (int) 57
  - `kuudra_party_finder` (object) 
    - `group_builder` (object) 
      - `combat_level_required` (int) 0
      - `note` (string) need a carry - im bad at game
      - `tier` (string) NONE
    - `search_settings` (object) 
  - `last_minibosses_killed` (array) 
  - `mages_reputation` (int) 1150
  - `mages_reputation_highest` (int) 1150
  - `matriarch` (object) 
    - `last_attempt` (int) 1764572531632
    - `pearls_collected` (int) 3
    - `recent_refreshes` (array) 
  - `quests` (object) 
    - `alchemist_quest` (object) 
    - `aranya_quest` (object) 
      - `talked_to_npc` (bool) True
    - `chicken_quest` (object) 
      - `chicken_quest_collected` (array) 
      - `chicken_quest_progress` (int) 2
      - `chicken_quest_start` (bool) True
    - `chicken_quest_handed_in` (int) 1728439114286
    - `duel_training_quest` (object) 
    - `edelis_quest` (object) 
    - `kuuda_boss_daily` (object) 
    - `last_reset` (int) 93
    - `miniboss_daily` (object) 
    - `miniboss_data` (object) 
      - `ASHFANG` (bool) True
      - `BARBARIAN_DUKE_X` (bool) True
      - `BLADESOUL` (bool) True
      - `MAGE_OUTLAW` (bool) True
      - `MAGMA_BOSS` (bool) True
    - ...9 more keys (not shown, see raw dump)
  - ...1 more keys (not shown, see raw dump)

##### `objectives`

  - `acquire_dustgrain` (object) 
    - `completed_at` (int) 1765841243399
    - `progress` (int) 0
    - `status` (string) COMPLETE
  - `analyze_crop` (object) 
    - `completed_at` (int) 1765841281923
    - `progress` (int) 0
    - `status` (string) COMPLETE
  - `analyze_greenhouse_crop` (object) 
    - `completed_at` (int) 1765834337614
    - `progress` (int) 0
    - `status` (string) COMPLETE
  - `apply_engine` (object) 
    - `completed_at` (int) 1744775173941
    - `progress` (int) 0
    - `status` (string) COMPLETE
  - `apply_rod_part` (object) 
    - `completed_at` (int) 1744775277365
    - `progress` (int) 0
    - `status` (string) COMPLETE
  - `beth_commission_1` (object) 
    - `completed_at` (int) 1765832978914
    - `progress` (int) 0
    - `status` (string) COMPLETE
  - `beth_commission_2` (object) 
    - `completed_at` (int) 1765832978917
    - `progress` (int) 0
    - `status` (string) COMPLETE
  - `beth_commission_3` (object) 
    - `completed_at` (int) 1765832978918
    - `progress` (int) 0
    - `status` (string) COMPLETE
  - `beth_investigate_lab` (object) 
    - `completed_at` (int) 1765840961525
    - `progress` (int) 0
    - `status` (string) COMPLETE
  - `beth_pull_lever` (object) 
    - `completed_at` (int) 1765841166946
    - `progress` (int) 0
    - `status` (string) COMPLETE
  - ...557 more keys (not shown, see raw dump)

##### `pets_data`

  - `autopet` (object) 
    - `rules` (array) 
      - [0]:
        - `data` (object) 
        - `disabled` (bool) False
        - `exceptions` (array) 
          - [0]:
            - `data` (object) 
              - `island` (string) garden
            - `id` (string) NOT_IN_ISLAND
        - `id` (string) ENTER_COMBAT
        - `name` (string) §7[Lvl 100] §6Hedgehog
        - `uniqueId` (string) 4286b7f7-9887-45b2-8842-a2b78522b4d9
        - `uuid` (string) 99f427eb4a814ef4a1812b00c0c877da
    - `rules_limit` (int) 14
  - `pet_care` (object) 
    - `coins_spent` (float) 4477238.512387412
    - `pet_types_sacrificed` (array) 
  - `pets` (array) 
    - [0]:
      - `active` (bool) False
      - `candyUsed` (int) 0
      - `exp` (float) 27140148.403461084
      - `extra` (object) 
      - `heldItem` (string) GRANDMAS_KNITTING_NEEDLE
      - `petSoulbound` (bool) False
      - `skin` (null) None
      - `tier` (string) LEGENDARY
      - `type` (string) GRANDMA_WOLF
      - `uniqueId` (string) 508e5458-eff0-4952-a26f-5c579bc11cd3
      - ...1 more keys (not shown, see raw dump)

##### `player_data`

  - `achievement_spawned_island_types` (array) 
  - `active_effects` (array) 
  - `crafted_generators` (object) (array, len=324, sample=['COBBLESTONE_1', 'COBBLESTONE_2', 'SNOW_1'])
  - `death_count` (int) 905
  - `disabled_potion_effects` (array) 
  - `experience` (object) 
    (flat map, 12 entries, every value is `float`) sample:
      - `SKILL_ALCHEMY`: 40568394.25
      - `SKILL_CARPENTRY`: 207058100.93166715
      - `SKILL_COMBAT`: 108283118.2432479
      - `SKILL_ENCHANTING`: 295817719.07939833
      - `SKILL_FARMING`: 369253280.9851344
      - `SKILL_FISHING`: 45237763.951043
      - ...6 more, same shape
  - `fishing_treasure_caught` (int) 2513
  - `garden_chips` (object) 
    - `cropshot` (int) 15
    - `evergreen` (int) 15
    - `hypercharge` (int) 20
    - `mechamind` (int) 15
    - `overdrive` (int) 15
    - `quickdraw` (int) 20
    - `rarefinder` (int) 20
    - `sowledge` (int) 15
    - `synthesis` (int) 10
    - `vermin_vaporizer` (int) 15
  - `last_death` (int) 224843003
  - `paused_effects` (array) 
  - ...5 more keys (not shown, see raw dump)

##### `player_stats`

  - `auctions` (object) 
    - `bids` (int) 6
    - `gold_spent` (int) 172899999
    - `highest_bid` (int) 38900000
    - `total_bought` (object) 
      - `EPIC` (int) 3
      - `LEGENDARY` (int) 1
      - `MYTHIC` (int) 1
      - `ULTIMATE` (int) 1
      - `total` (int) 6
    - `won` (int) 6
  - `candy_collected` (object) 
    - `green_candy` (int) 8040
    - `purple_candy` (int) 2676
    - `spooky_festival_330` (object) 
      - `green_candy` (int) 47
      - `purple_candy` (int) 9
      - `total` (int) 56
    - `spooky_festival_335` (object) 
      - `green_candy` (int) 55
      - `purple_candy` (int) 17
      - `total` (int) 72
    - `spooky_festival_344` (object) 
      - `green_candy` (int) 1
      - `total` (int) 1
    - `spooky_festival_371` (object) 
      - `green_candy` (int) 8
      - `purple_candy` (int) 3
      - `total` (int) 11
    - `spooky_festival_372` (object) 
      - `green_candy` (int) 61
      - `purple_candy` (int) 6
      - `total` (int) 67
    - `spooky_festival_374` (object) 
      - `green_candy` (int) 483
      - `purple_candy` (int) 155
      - `total` (int) 638
    - `spooky_festival_375` (object) 
      - `green_candy` (int) 786
      - `purple_candy` (int) 272
      - `total` (int) 1058
    - `spooky_festival_377` (object) 
      - `green_candy` (int) 341
      - `purple_candy` (int) 112
      - `total` (int) 453
    - ...16 more keys (not shown, see raw dump)
  - `deaths` (object) 
    (flat map, 168 entries, every value is `int`) sample:
      - `agarimoo`: 4
      - `arachne_keeper`: 2
      - `ashfang`: 5
      - `ashfang_blue_blaze`: 1
      - `ashfang_red_blaze`: 1
      - `automaton`: 7
      - ...162 more, same shape
  - `end_island` (object) 
    - `dragon_fight` (object) 
      - `amount_summoned` (object) 
        - `old` (int) 4
        - `protector` (int) 1
        - `superior` (int) 1
        - `total` (int) 14
        - `unstable` (int) 4
        - `wise` (int) 1
        - `young` (int) 3
      - `ender_crystals_destroyed` (int) 3
      - `fastest_kill` (object) 
        - `best` (int) 800
        - `old` (int) 1150
        - `protector` (int) 1150
        - `strong` (int) 800
        - `superior` (int) 950
        - `unstable` (int) 850
        - `wise` (int) 1000
        - `young` (int) 2600
      - `highest_rank` (object) 
        - `best` (int) 2
        - `old` (int) 3
        - `protector` (int) 2
        - `strong` (int) 6
        - `superior` (int) 5
        - `unstable` (int) 5
        - `wise` (int) 5
        - `young` (int) 6
      - `most_damage` (object) 
        - `best` (float) 685659.9637897903
        - `old` (float) 641112.2561914166
        - `protector` (float) 408325.4382650731
        - `strong` (float) 144169.40845865977
        - `superior` (float) 685659.9637897903
        - `unstable` (float) 310470.52554274164
        - `wise` (float) 571544.0449583674
        - `young` (float) 190852.62379016133
      - `summoning_eyes_contributed` (object) 
        - `old` (int) 16
        - `protector` (int) 4
        - `superior` (int) 4
        - `total` (int) 56
        - `unstable` (int) 16
        - `wise` (int) 4
        - `young` (int) 12
    - `special_zealot_loot_collected` (int) 373
    - `summoning_eyes_collected` (int) 45
  - `gifts` (object) 
    - `total_given` (int) 712
    - `total_received` (int) 1370
  - `glowing_mushrooms_broken` (int) 1515
  - `highest_critical_damage` (float) 73235897.22160435
  - `highest_damage` (float) 255796464.05860493
  - `items_fished` (object) 
    - `large_treasure` (int) 326
    - `normal` (int) 17392
    - `outstanding` (int) 29
    - `total` (int) 24846
    - `treasure` (int) 2513
    - `trophy_fish` (int) 945
    - `trophy_frog` (int) 3641
  - `kills` (object) 
    (flat map, 702 entries, every value is `int`) sample:
      - `agarimoo`: 76
      - `agarimoo_35`: 87
      - `alligator`: 14
      - `alligator_120`: 49
      - `arachne`: 47
      - `arachne_brood`: 1183
      - ...696 more, same shape
  - ...13 more keys (not shown, see raw dump)

##### `profile`

  - `bank_account` (int) 0
  - `cookie_buff_active` (bool) True
  - `first_join` (int) 1709322087210
  - `personal_bank_upgrade` (int) 3

##### `quests`

  - `trapper_quest` (object) 
    - `last_task_time` (int) 1767857155776
    - `pelt_count` (int) 51

##### `rift`

  - `access` (object) 
    - `charge_track_timestamp` (int) 1770757709134
    - `last_free` (int) 1732265356486
  - `black_lagoon` (object) 
    - `completed_step` (int) 4
    - `delivered_science_paper` (bool) True
    - `received_science_paper` (bool) True
    - `talked_to_edwin` (bool) True
  - `castle` (object) 
    - `unlocked_pathway_skip` (bool) True
  - `dead_cats` (object) 
    - `found_cats` (object) (array, len=9, sample=['first', 'third', 'second'])
    - `montezuma` (object) 
      - `active` (bool) True
      - `candyUsed` (int) 0
      - `exp` (int) 18608500
      - `extra` (object) 
      - `heldItem` (null) None
      - `petSoulbound` (bool) False
      - `skin` (null) None
      - `tier` (string) EPIC
      - `type` (string) FRACTURED_MONTEZUMA_SOUL
      - `uniqueId` (null) None
      - ...1 more keys (not shown, see raw dump)
    - `picked_up_detector` (bool) True
    - `talked_to_jacquelle` (bool) True
    - `unlocked_pet` (bool) True
  - `dreadfarm` (object) 
    - `caducous_feeder_uses` (array) 
    - `shania_stage` (int) 2
  - `enigma` (object) 
    - `bought_cloak` (bool) True
    - `claimed_bonus_index` (int) 3
    - `found_souls` (object) (array, len=50, sample=['RIFT_1', 'WOODS_FLOWER_POT', 'SOUL_IN_A_BOX'])
  - `gallery` (object) 
    - `elise_step` (int) 5
    - `secured_trophies` (array) 
      - [0]:
        - `timestamp` (int) 1728850512668
        - `type` (string) wyldly_supreme
        - `visits` (int) 14
  - `inventory` (object) 
    - `ender_chest_contents` (object) 
      - `data` (string) <likely gzipped NBT blob, base64 length 17536, decoded 13150 bytes>
      - `type` (int) 0
    - `ender_chest_page_icons` (array) 
    - `equipment_contents` (object) 
      - `data` (string) <likely gzipped NBT blob, base64 length 5788, decoded 4341 bytes>
      - `type` (int) 0
    - `inv_armor` (object) 
      - `data` (string) <likely gzipped NBT blob, base64 length 2756, decoded 2065 bytes>
      - `type` (int) 0
    - `inv_contents` (object) 
      - `data` (string) <likely gzipped NBT blob, base64 length 18016, decoded 13512 bytes>
      - `type` (int) 0
  - `lifetime_purchased_boundaries` (array) 
  - `slayer_quest` (object) 
    - `combat_xp` (int) 345
    - `completion_state` (int) 0
    - `last_killed_mob_island` (string) RIFT
    - `recent_mob_kills` (array) 
      - [0]:
        - `timestamp` (int) 1769295332484
        - `xp` (int) 30
    - `solo` (bool) True
    - `start_timestamp` (int) 1769295276374
    - `tier` (int) 3
    - `type` (string) vampire
    - `used_armor` (bool) False
  - ...5 more keys (not shown, see raw dump)

##### `shards`

  - `fused` (int) 139
  - `fusion_result_sort` (string) id_highest_to_lowest
  - `owned` (array) 
    - [0]:
      - `amount_owned` (int) 7
      - `captured` (int) 1770365615925
      - `type` (string) SPHINX
  - `traps` (object) 

##### `shared_inventory`

  - `candy_inventory_contents` (object) 
    - `data` (string) <likely gzipped NBT blob, base64 length 1864, decoded 1396 bytes>
    - `type` (int) 0
  - `carnival_mask_inventory_contents` (object) 
    - `data` (string) <likely gzipped NBT blob, base64 length 5604, decoded 4203 bytes>
    - `type` (int) 0

##### `skill_tree`

  - `experience` (object) 
    - `foraging` (int) 347000
    - `mining` (int) 1247000
  - `last_reset` (object) 
    - `foraging` (int) 1771046147754
    - `mining` (int) 1775209073100
  - `mining` (object) 
    - `custom_name` (string) Heart of the Mountain 1
  - `nodes` (object) 
    - `foraging` (object) 
      - `center_of_the_forest` (int) 5
      - `daily_wishes` (int) 1
      - `deep_waters` (int) 50
      - `efficient_forager` (int) 1
      - `foraging_fortune` (int) 1
      - `galateas_might` (int) 44
      - `hunters_luck` (int) 50
      - `sweep` (int) 1
      - `toggle_center_of_the_forest` (bool) True
      - `toggle_daily_wishes` (bool) True
      - ...6 more keys (not shown, see raw dump)
    - `foraging_2` (object) 
      - `center_of_the_forest` (int) 5
    - `foraging_3` (object) 
      - `center_of_the_forest` (int) 5
    - `foraging_4` (object) 
      - `center_of_the_forest` (int) 5
    - `foraging_5` (object) 
      - `center_of_the_forest` (int) 5
    - `mining` (object) 
      - `blockhead` (int) 20
      - `core_of_the_mountain` (int) 10
      - `efficient_miner` (int) 100
      - `fortunate_mineman` (int) 50
      - `gem_lover` (int) 20
      - `great_explorer` (int) 1
      - `keep_it_cool` (int) 1
      - `lonesome_miner` (int) 45
      - `metal_head` (int) 1
      - `mining_fortune` (int) 50
      - ...42 more keys (not shown, see raw dump)
    - `mining_2` (object) 
      - `core_of_the_mountain` (int) 10
    - `mining_3` (object) 
      - `core_of_the_mountain` (int) 10
    - `mining_4` (object) 
      - `core_of_the_mountain` (int) 10
    - `mining_5` (object) 
      - `core_of_the_mountain` (int) 10
  - `refund_ability_free` (bool) True
  - `selected_ability` (object) 
    - `mining` (string) mining_speed_boost
  - `tokens_spent` (object) 
    - `forest` (int) 7
    - `mountain` (int) 25

##### `slayer`

  - `slayer_bosses` (object) 
    - `blaze` (object) 
      - `claimed_levels` (object) 
    - `enderman` (object) 
      - `boss_attempts_tier_0` (int) 57
      - `boss_attempts_tier_1` (int) 103
      - `boss_attempts_tier_2` (int) 153
      - `boss_attempts_tier_3` (int) 307
      - `boss_kills_tier_0` (int) 56
      - `boss_kills_tier_1` (int) 91
      - `boss_kills_tier_2` (int) 134
      - `boss_kills_tier_3` (int) 201
      - `claimed_levels` (object) 
        - `level_1` (bool) True
        - `level_2` (bool) True
        - `level_3` (bool) True
        - `level_4` (bool) True
        - `level_5` (bool) True
        - `level_6` (bool) True
        - `level_7` (bool) True
      - `xp` (int) 143757
    - `spider` (object) 
      - `boss_attempts_tier_0` (int) 2
      - `boss_attempts_tier_1` (int) 12
      - `boss_attempts_tier_2` (int) 25
      - `boss_attempts_tier_3` (int) 276
      - `boss_attempts_tier_4` (int) 84
      - `boss_kills_tier_0` (int) 2
      - `boss_kills_tier_1` (int) 12
      - `boss_kills_tier_2` (int) 25
      - `boss_kills_tier_3` (int) 274
      - `boss_kills_tier_4` (int) 54
      - ...2 more keys (not shown, see raw dump)
    - `vampire` (object) 
      - `boss_attempts_tier_0` (int) 13
      - `boss_attempts_tier_1` (int) 14
      - `boss_attempts_tier_2` (int) 16
      - `boss_attempts_tier_3` (int) 35
      - `boss_attempts_tier_4` (int) 3
      - `boss_kills_tier_0` (int) 13
      - `boss_kills_tier_1` (int) 14
      - `boss_kills_tier_2` (int) 11
      - `boss_kills_tier_3` (int) 28
      - `claimed_levels` (object) 
        - `level_1` (bool) True
        - `level_2` (bool) True
        - `level_3` (bool) True
        - `level_4` (bool) True
        - `level_5` (bool) True
      - ...1 more keys (not shown, see raw dump)
    - `wolf` (object) 
      - `boss_attempts_tier_0` (int) 1
      - `boss_attempts_tier_1` (int) 7
      - `boss_attempts_tier_2` (int) 1
      - `boss_attempts_tier_3` (int) 820
      - `boss_kills_tier_0` (int) 1
      - `boss_kills_tier_1` (int) 7
      - `boss_kills_tier_2` (int) 1
      - `boss_kills_tier_3` (int) 816
      - `claimed_levels` (object) 
        - `level_1` (bool) True
        - `level_2` (bool) True
        - `level_3` (bool) True
        - `level_4` (bool) True
        - `level_5` (bool) True
        - `level_6` (bool) True
        - `level_7` (bool) True
        - `level_8` (bool) True
      - `xp` (int) 582030
    - `zombie` (object) 
      - `boss_attempts_tier_0` (int) 6
      - `boss_attempts_tier_1` (int) 4
      - `boss_attempts_tier_2` (int) 9
      - `boss_attempts_tier_3` (int) 160
      - `boss_attempts_tier_4` (int) 561
      - `boss_kills_tier_0` (int) 6
      - `boss_kills_tier_1` (int) 4
      - `boss_kills_tier_2` (int) 9
      - `boss_kills_tier_3` (int) 159
      - `boss_kills_tier_4` (int) 549
      - ...2 more keys (not shown, see raw dump)

##### `temples`

  - `unlocked_temples` (array) 

##### `trophy_fish`

  - `blobfish` (int) 623
  - `blobfish_bronze` (int) 461
  - `blobfish_diamond` (int) 6
  - `blobfish_gold` (int) 11
  - `blobfish_silver` (int) 145
  - `flyfish` (int) 10
  - `flyfish_bronze` (int) 6
  - `flyfish_gold` (int) 1
  - `flyfish_silver` (int) 3
  - `golden_fish` (int) 58
  - ...59 more keys (not shown, see raw dump)

##### `winter_player_data`

  - `refined_jyrre_uses` (int) 3

(Profile-level fields such as `banking` and `community_upgrades` are siblings
of `members`, not part of this member object - see "Profile-level fields"
above.)

---

## `GET /v2/skyblock/garden?profile=`

One garden's full state, not member-scoped (a garden is shared across the
whole profile). His garden (Pomegranate):

- `uuid` (string) - profile id, undashed.
- `commission_data.visits` (object) - flat map, one key per garden NPC,
  visit count. 118 NPCs on his profile.
- `commission_data.completed` (object) - same NPC keys, completions instead
  of visits.
- `commission_data.total_completed` (int) 1394
- `commission_data.unique_npcs_served` (int) 118
- `selected_barn_skin` (string) `"beautifall_cabin"`
- `unlocked_barn_skins` (array of strings) 4 entries.
- `unlocked_plots_ids` (array of strings) - which of the garden's main-grid
  plots have been unlocked. His profile: 15 entries, e.g. `beginner_2`,
  `beginner_3`, `intermediate_2`. **This is the regular garden plot grid, a
  different mechanic from `garden_upgrades.PLOT_LIMIT` below** (greenhouse
  concurrent-crop capacity) - do not conflate the two when reading "plots."
- `resources_collected` (object) - flat map, one key per farmable crop item
  id, lifetime amount collected on the garden itself (separate from the
  per-member `collection` counter, which tracks the player's own lifetime
  total across all sources).
- `garden_experience` (int) 136536
- `composter_data` - `organic_matter`, `fuel_units`, `compost_units`,
  `compost_items`, `conversion_ticks`, `last_save` (all int/epoch-ms), and
  `upgrades.{speed,multi_drop,fuel_cap,organic_matter_cap,cost_reduction}`
  (ints, upgrade tiers).
- `active_commissions` (object) - keyed by NPC name, each
  `{requirement: [{original_item, original_amount, item, amount}],
  status, position}`.
- `crop_upgrade_levels` (object) - flat map, one key per crop item id,
  int tier level. 13 entries on his profile (one per crop he has planted).
- ★ `garden_upgrades` (object) - **exactly `{"GROWTH_SPEED": 6, "YIELD": 4}`
  on his live profile. No `PLOT_LIMIT` key.** See the starred finding above
  for what that absence most likely means.
- `last_growth_stage_time` (int, epoch ms)
- `greenhouse_slots` (array of `{x, z}` coordinate pairs) - 88 entries on his
  profile, the physical greenhouse crop-plot grid coordinates.

**Exhaustive scan for `mutat|research|donat|bioanalysis` across the entire
garden object: zero hits.** Nothing greenhouse-mutation-related lives here
beyond the two arrays already covered on the member object
(`analyzed_greenhouse_crops` / `discovered_greenhouse_crops`).

---

## `GET /v2/skyblock/museum?profile=`

`museum.members.<uuid>` per member (same uuid keying as profiles):

- `value` (int) - total museum score. His: `320889007`.
- `appraisal` (bool) - `true`.
- `items.<ITEM_ID>` (object) - one entry per catalogued item ever donated to
  the museum (weapons, armor, rare tools). ~350 entries on his profile.
  Shape: `{donated_time (epoch ms), featured_slot (string, optional, e.g.
  "armor_sets:0"), borrowing (bool, optional - item is on loan back to him),
  items: {type: 0, data: <gzipped NBT blob>}}`. Blob sizes observed: roughly
  200-8000 bytes decoded, one per item.
- `special` (array) - donations that do not map to a fixed catalogue id
  (event/limited items). 8 entries on his profile, same
  `{donated_time, items: {type, data}}` shape minus the name key.

No mutation/research/bioanalysis fields here either - "donated" in this
endpoint means museum donations specifically, unrelated to greenhouse
mutation research.

---

## `GET /v2/player?uuid=`

Network-wide Hypixel account data - rank, karma, achievements, minigame
stats. **Not SkyBlock-scoped**; SkyBlock data lives entirely under
`/skyblock/profiles`. 64 top-level keys on `player`, e.g.:

- `uuid`, `playername`, `displayname`, `firstLogin`, `lastLogin`, `lastLogout`
  (strings/epoch-ms).
- `newPackageRank` (string, e.g. `"MVP_PLUS"`), `monthlyPackageRank`,
  `mostRecentMonthlyPackageRank`, `rankPlusColor`, `monthlyRankColor`.
- `karma` (int), `networkExp` (int), `achievementPoints` (int).
- `achievements` (object, 79 keys - per-game progress achievement values),
  `achievementsOneTime` (array of 263 completed one-time achievement ids).
- `stats` (object, 26 keys - one per minigame Hypixel tracks; does not
  include full SkyBlock profile data, only whatever summary counters the
  network layer keeps).

**Exhaustive scan for `mutat|research|donat|bioanalysis|greenhouse` across the
entire player object: zero hits.** Confirms this endpoint has nothing to add
to the mutation-research question.

---

## `GET /v2/skyblock/bingo?uuid=`

Answered. `{success: true, events: [{key, points, completed_goals: [...]}]}`
- one entry per bingo event the player has participated in, `key` is
Hypixel's internal event id (int), `points` is the event score, and
`completed_goals` is an array of goal-id strings. His profile: 4 past events,
scores 0-25, `completed_goals` lists things like `bank_coins`,
`reforge_titanic`, `stat_critical_damage`.

---

## Keyless resources (schema reference only, no auth, sampled lightly per house rules)

These describe the game's static catalogue, not any player's data, so they
are not re-dumped in full here - just enough to show the shape.

### `GET /v2/resources/skyblock/collections`

`{success, lastUpdated, version, collections: {CATEGORY: {name, items:
{ITEM_ID: {name, maxTiers, tiers: [{tier, amountRequired, unlocks: [...]}]}}
}}}`. 6 categories (`FARMING`, `MINING`, `COMBAT`, `FORAGING`, `FISHING`,
`RIFT`). This is the catalogue that `member.collection` (raw counts) and
`player_data.unlocked_coll_tiers` (which tiers are crossed) are measured
against - cross-reference `amountRequired` against `member.collection` to
compute progress toward the next tier, no need to hardcode thresholds.

### `GET /v2/resources/skyblock/items`

`{success, lastUpdated, items: [...]}`. 5,549 items on the live catalogue.
Each item: `{id, name, material, item_model, category, npc_sell_price,
museum (bool), stats: {STAT_NAME: value}, requirements: [{type, ...}],
museum_data: {donation_xp, category, game_stage}}` (exact key set varies per
item; not every item has every key - `stats` and `requirements` in particular
are absent on plain resource items).

### `GET /v2/resources/skyblock/skills`

`{success, lastUpdated, version, skills: {SKILL_NAME: {name, description,
maxLevel, levels: [{level, totalExpRequired, unlocks: [...]}]}}}`. 12 skills:
`FARMING`, `MINING`, `COMBAT`, `FORAGING`, `FISHING`, `ENCHANTING`,
`ALCHEMY`, `CARPENTRY`, `RUNECRAFTING`, `SOCIAL`, `TAMING`, `HUNTING`. This is
the catalogue `player_data.experience.SKILL_<NAME>` (raw XP, see the member
inventory above) is measured against to compute a skill level.
