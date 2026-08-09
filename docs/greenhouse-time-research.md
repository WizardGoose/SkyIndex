# Greenhouse mutation timing — research

Everything behind `src/greenhouse/timeModel/`. The job was to replace an
optimistic deterministic estimate with an honest expected-time model, and to
do it from sources rather than from feel.

The rule throughout: a number is **CITED** with the page and section it came
from, or it is **ASSUMED** and says so, with the playtest that would settle it.
Nothing was invented to fill a gap. Where the sources are silent, this document
says they are silent.

Research date **2026-08-01**, against the live wiki
(`hypixelskyblock.minecraft.wiki`), the official Hypixel changelogs it cites,
and ic's Alpha Items Spreadsheet.

---

## 1. The headline answers

| Question | Answer | Confidence |
|---|---|---|
| When does a mutation roll to spawn? | On the **growth cycle** tick, globally synchronised across the Greenhouse | **Cited** |
| Is a growth cycle the same as a growth stage? | Yes | **Cited** |
| What is the per-spot chance? | `weight/100 x cropSupport x bioanalysis` | Weights cited, support rule **ambiguous** |
| Do crops last ~3 days? | The 3-day clock is real, but it is on the **mutation**, not the planted crops | **Cited**, see §4 |
| Are input crops consumed when a mutation spawns? | **No.** They stay in the ground | **Cited** |
| Does a spawned mutation block its spot? | **Yes**, until harvested | **Cited** |
| Does any of this run while offline? | **Yes.** The Greenhouse grows offline | **Cited** |
| What happens when two mutations contend for one spot? | **Undocumented** | Genuinely unknown |

---

## 2. The roll cadence — the fact the model hangs on

This is the single most load-bearing sentence found, and it is not on the
Mutations page at all. It is in the 0.24 release notes,
**Changelog/2025/December 15/0, § Mutations** (Hypixel post 6027542):

> "Here you can see the Dustgrain Mutation surrounded by 4 Wheat, which is the
> requirement for it to spread to the middle plot. **Whether it actually spreads
> onto the middle plot depends on the growth cycle, which triggers every few
> hours in the Greenhouse and updates all crops and mutations simultaneously.**"

Three things fall out of it:

1. There is **no separate mutation tick**. The spawn roll happens on the growth
   cycle.
2. The cycle is **global and synchronous** — "updates all crops and mutations
   simultaneously", not per-plant random ticking.
3. Therefore the interval between spawn rolls is exactly one growth stage.

"Growth cycle" is Hypixel's word, "Growth Stage" is the wiki's. They are the
same tick, confirmed by **Changelog/2025/December 12**:

> "Adjusted growth cycle speeds in the Greenhouse: ** The base time per growth
> cycle: **3 -> 4 hours**"

which matches **Greenhouse § Growth Stage**'s 4-hour baseline. The existing
formula in `planner/time.ts` was already verified at both ends and is untouched:

```
T = 14400 / (1 + 0.025c + 0.0025g + upgradeTerm)
```

The same December 12 changelog independently explains two of its constants —
"Garden Levels are a quarter as effective" and "The unique crop bonus is half as
effective" than their Garden equivalents, which is why `g` contributes 0.0025
rather than the Garden's 0.01.

**Newly sourced:** the flat `+0.50` at tier 9 had no wiki citation. The Desk UI
dump (`The Desk/UI`, Greenhouse upgrades) gives **Growth Speed I–VIII at +5%
each and IX at +10%**, totalling +50% — which is exactly the term `time.ts`
already implements. That rule is now sourced, not just numerically inferred.

---

## 3. Spawn chance

### 3.1 The weights are ground truth

Hypixel staff **mrkeith**, July 24 2026, quoted in full as ref `mrkeith` on
**Mutations**, leaked the internal weight table, with the note *"weight of 0
means special conditions required"*. Re-verified against the live page on
2026-08-01: no weight has changed.

| Weight | Mutations |
|---|---|
| 30 | Dustgrain, Witherbloom, Ashwreath, Gloomgourd, Veilshroom, Scourroot, Shadevine, Choconut |
| 25 | Cindershade, Soggybud, Thornshade, Do-not-eat-shroom, Chocoberry, Creambloom, Duskbloom, Snoozling, PlantBoy Advance, Thunderling, Noctilume, Magic Jellybean, All-in Aloe, Puffercloud, Zombud, Fleshtrap, Blastberry, Turtlellini, Coalroot, Chloronite, Chorus Fruit, Startlevine, Stoplight Petal, Cheesebite |
| 20 | Devourer, Glasscorn, Phantomleaf, Timestalk |
| 6 | Lonelily |
| 5 | Godseed |
| 0 | Jerryflower, Shellfruit |

### 3.2 The crop-support scaling — and the ambiguity in it

Staff **pikachuflare**, July 27 2026 (ref `pikachuflare` on **Mutations**):

> "Ashwreath's Mutation chance is confirmed as 15%. It's 30% chance according to
> our weights, but we also have a mechanic where mutations happen depending on
> the surrounding crops. Since Fire isn't a crop, the chance of Ashwreath's
> mutation is only supported by the 2 netherwarts (25% + 25% = 50%),
> 30% * 50% = 15%."

So `chance = weight/100 x cropSupport`. Same source resolves the two ambiguous
items: *"Lonelily is special case, fermento and dead plants are indeed crops"* —
so **Fire is the only non-crop** in any spreading condition in the whole table.

**This is where the research hits a wall that honesty requires flagging.** Two
different rules reproduce that one worked example:

| Rule | Definition | Ashwreath | Choconut (2x Cocoa Beans) |
|---|---|---|---|
| `share` | each required item is worth `1/total` | 2/4 = 50% → **15%** | 2/2 = 100% → **30%** |
| `quarter` | each adjacent crop is worth a flat 25% | 2 x 25% = 50% → **15%** | 2 x 25% = 50% → **15%** |

They agree on Ashwreath — which is the *only* staff-confirmed percentage — and
disagree by a factor of two on every 2-crop layout.

**The wiki's percentage column is not evidence either way.** Its revision
history shows the numbers were added by editor Lunaynx on 2026-07-27 with the
comment "added spawn chance clarification", generated mechanically as
`weight/100`, which silently assumes `share`. Only Ashwreath's 15% traces to
staff. A related unknown: **Changelog/2026/February 2** says "Rebalanced multiple
lower tier mutations to require less surrounding crops to spread" — under
`quarter` that rebalance would have *cut* those mutations' effective chances;
under `share` it would have left them unchanged. Nothing says which happened.

The model defaults to **`share`** (it reproduces the published table) and
implements `quarter` behind a flag. Sensitivity is measured in §7.

> **PLAYTEST TO SETTLE IT.** Sow a full plot of Choconut, note the spot count S,
> leave it exactly one growth cycle, count the Choconut that appeared. Expect
> `S x 0.30` under `share` and `S x 0.15` under `quarter`. At S = 72 that is
> **21.6 vs 10.8** — one cycle separates them, a handful makes it certain.

### 3.3 Bioanalysis is multiplicative

An upgrade chain, so only the best held applies:

| Item | Effect | Unlock |
|---|---|---|
| Bioanalysis Talisman | "increases the chance for crops to mutate in the Greenhouse by **+5%**" | Crop Analyzer Milestone I |
| Bioanalysis Ring | "...by **+10%**" | Milestone IV |
| Bioanalysis Artifact | "...by **+15%**" | Milestone VI |

The "+15%" is a **multiplier, not 15 percentage points**, proved arithmetically
by the same staff post: *"with the Bioanalysis Artifact buff, it should be
17.25%"*, and 15 x 1.15 = 17.25 exactly. The alpha spreadsheet corroborates the
lore text at `greenhouse.csv` L101–L103 (alpha datamine).

**No other spawn-chance modifier exists.** Searched the Desk upgrades (Growth
Speed and Plant Yield only), Garden Chips, and the Rose Dragon Pet — the Rose
Dragon's only Mutations link is its *crafting cost*, not a chance buff.

### 3.4 Contention — genuinely undocumented

The Mutations table header carries the caveat, and nothing else:

> "Listed spawn chances assume no other mutations can spawn on the same empty spot."

It never says what the numbers become when they can. **Changelog/2026/February 4**
makes it harder rather than easier: *"Gave Zombud and Godseed priority over other
crops in mutating"* — priority is a separate mechanism from weight (Godseed's
weight of 5 is the lowest non-zero), so it is not a plain weighted lottery.

The model **sidesteps this rather than guessing**: the planner solves one target
mutation per plot with unused crops stripped, so only the target is eligible and
the listed chance applies unmodified. Multi-target or shared plots are outside
what this model can honestly cost. Noted in `constants.ts` as
`CONTENTION_MODEL`.

---

## 4. Verdict on "crops last about 3 days"

**Verdict: the 3-day clock is real and is the modal value, but it governs the
spawned mutation, not the planted input crops.**

The decisive text is on **Dead Plant § Obtaining** — a page the Greenhouse
article never links from its body, which is why this was easy to miss:

> "A **Dead Plant** replaces plants in the Greenhouse if they reach **-100**
> water. Alternatively, the **decay** mechanic will turn most fully grown
> mutation into Dead Plants after a few days, even if fully hydrated or placed by
> the player. Different mutations can have different decay timers. **The lowest
> is 3 days**, and certain mutations do not have any decay at all. This can be
> observed using the Plant Diagnostics Tool."

Independent official confirmation of the unit — **Changelog/2026/February 2**:

> "Increased Noctilume's decay period **from 5 to 6 days**"

The bundled dataset has `noctilume.decay = 6`, matching post-patch. That is a
two-source lock on both the unit and the field's meaning.

| Sub-question | Verdict |
|---|---|
| Is `decay` in days? | **CONFIRMED** |
| Does it apply to the spawned mutation? | **CONFIRMED** |
| Does it apply to the planted input crops? | **REFUTED** — no source says base crops decay on a timer |
| Is `decay: 0` genuinely "never"? | **CONFIRMED**, and individually confirmed per mutation |

The three `decay: 0` entries each have their own trivia line: All-in Aloe *"does
not decay while growing or after being placed by the player"*, and Magic
Jellybean and Fleshtrap *"do not decay when fully grown or placed by the
player"*.

**Why the owner's observation is still right in practice.** 23 of the 40
mutations have `decay: 3`, so 3 days is the modal timer. And from tier 2 onward
the "planted crops" *are* mutations — Duskbloom, Creambloom, Thornshade and the
rest are inputs to higher tiers, and they carry their own 3-day clock. So a
higher-tier plot genuinely does rot out from under you at ~3 days. What is
different from the intuition is the mechanism: it is the mutation-inputs
decaying, not base crops expiring. Base crops have exactly one documented death
path, water reaching **-100**.

The model takes the **tighter of the two clocks** — the mutation's own decay and
the shortest-lived decaying input — as the ceiling on how long a planting may
sit (`maxHarvestWindow` in `adapter.ts`).

**Caveats, stated plainly:**

- The wiki has **no decay column**. Only "lowest is 3 days" and the single
  Noctilume patch note corroborate the dataset's numbers. The 5s and the other
  6s are **unverified against any source**.
- **When the decay clock starts is not stated** — at spawn, or at full growth.
  Dead Plant says "fully grown", but Soggybud can *"decay before they finish
  growing"* and All-in Aloe is exempted *"while growing **or** after being
  placed"*, which only reads sensibly if decay normally runs during growth too.
  Logged as `DECAY_CLOCK_START`.
- **Farming § Greenhouse contradicts Dead Plant** on the water threshold, saying
  a plant dies at **0** rather than -100. Dead Plant is the more specific and
  more recent page; the discrepancy is unresolved.

---

## 5. Mechanics that shape the model

### 5.1 Input crops persist — a planting is a pump, not a single shot

**Startlevine § Tips:**

> "Since **Blastberry** is required to grow **Startlevine**, any Startlevine
> actively growing **will be destroyed if the Blastberry decays**."

That only makes sense if the Blastberry is still standing there after the
Startlevine spawned. So inputs are **not consumed at spawn time** — every
still-empty qualifying spot rolls again next cycle, off the same sowing. This is
what makes the multi-cycle harvest window meaningful rather than a re-sow loop.

### 5.2 A spawned mutation blocks its spot

**Snoozling § Tips:**

> "Since a **Lonelily** or **Godseed** could grow within the 3x3 area and
> **prevent a Snoozling from growing**, they should be harvested if they appear."

Mutations spawn on "an empty soil plot" (Mutations, lead), so an occupied spot
is out of the running until harvested. Hence at most one mutation per spot per
harvest — the model's per-spot Bernoulli, not a Poisson count.

### 5.3 The Greenhouse runs offline

**Greenhouse § Overview:** *"They will grow while offline and can be harvested
once mature."* The 0.24 notes call this the design intent: *"grow crops over
multiple real-life hours or days whether your are online or offline."*

This is the **opposite** of Garden plots (`The Garden`: *"They do not grow if the
player is outside the Garden or offline"*), so that rule must not be carried
over. Consequence for the model: estimates are **real-world wall clock**, not
play time.

Offline behaviour was patched twice. **Changelog/2026/February 4** added a grace
period ("3 growth cycles pass normally... a 5 cycle grace period"), then
**Changelog/2026/February 17** superseded it:

> "It no longer stops mutations from growing even if they had enough water to
> survive. Instead, freshly grown mutations while offline will now only stop
> growing if they were about to dry out, effectively increasing how long they can
> grow while offline."

**No replacement numbers were published.** The old 3+5 figures must not be used.
The model assumes uninterrupted cycles, which is correct for a watered plot.

### 5.4 Per-mutation mechanics that break a naive stage count

The model does **not** yet price these; they are logged so the next pass can.
Each stalls or resets the clock in a way `stages x stageSeconds` misses:

| Mutation | Mechanic |
|---|---|
| Snoozling | Sleeps at stages **5, 10, 15**; cannot grow until right-clicked awake |
| Cheesebite | A Rat spawns at stages **4 and 7** and halts growth until vacuumed |
| Noctilume | Only advances during the matching time of day (sun/moon) — wall clock, not stage timer, dominates |
| Glasscorn | Harvestable at stages **7–8 only**; if another stage passes at 8 it **resets to 1** |
| All-in Aloe | Escalating reset-to-stage-1 chance from stage **4** (3%, +3pp per stage, 72% at 27). The `All-in Aloe/Table` subpage publishes an **"Expected Stages to Reach"** column — a ready-made input |
| Magic Jellybean | Harvestable from stage 12; +1x drop multiplier every 12 stages, capped at 10x |
| Fleshtrap | Cannot grow while hunger is 0; needs manual feeding across all 14 stages |
| PlantBoy Advance | Failing the Snake minigame **subtracts 3 growth stages** |
| Thunderling | Accrues 2000 charge/stage and self-destructs above 16000 unless discharged |
| Startlevine | Destroyed outright if its parent Blastberry decays |
| Blastberry | Explodes on harvest **or decay**, destroying adjacent crops — a hazard clock for the whole plot |
| Chorus Fruit | Teleports each stage, deleting whatever crop it lands on |
| Devourer | Per-stage chance to destroy neighbours — chance marked `{{InfoNeeded}}`, genuinely absent |

Two corrections to prior beliefs worth recording: All-in Aloe's reset threshold
is stage **4**, not 14 (stage 14 is the expected-drop optimum, 9.37 expected
drops, which is probably where "14" came from); and Snoozling pauses at exactly
three points, not every 5 stages indefinitely. Glasscorn has an unresolved wiki
inconsistency — the article says 8 growth stages, the Mutations table says 9.

### 5.5 The planting lead-in, and the two questions under it

Re-checked **2026-08-02** against the live wiki, prompted by an owner report that
the base crop's own growth might be missing from a planting's clock.

**It is not missing.** `plantingOutcome` charges
`inputStages x stageSeconds` before the roll window opens, where `inputStages`
is the slowest requirement's growth. Soggybud is the worked example: 2h 57m a
stage on its two-crop plot, 11 stages of Melon, then 10 of its own, which is the
21 stages and the 2d 14h the planner prints. Eleven of those twenty one stages
are the Melon reaching maturity. Pinned in
`planner/__tests__/baseCropLeadIn.test.ts` against its parts rather than its
total, because the term produces no line of its own on the page and could be
dropped without anything else looking wrong.

Two things sit underneath it and **the wiki answers neither**.

**Is the lead-in paid once, or every planting?** That is the replant question,
§10.6, and it is still open. No page states whether a Greenhouse tile keeps its
plant through a harvest. The Garden's random-tick replenish and its `Replenish`
enchantment are documented, and the Greenhouse is explicitly a different clock on
a different page, so that behaviour must not be carried across. The model pays
the lead-in on **every** planting, which is the conservative reading: it can
overstate the work and never understate it.

**Do mutation inputs pay it too?** They do today, and the owner's rule says they
should not: a mutation placed from stock is already grown, so it should cost
nothing to mature. This matters, because 20 of the 40 mutations have a mutation
input with nonzero growth stages, and the extreme is All-in Aloe charging 120
stages of Magic Jellybean lead-in it may never pay.

**The rule is not sourced.** An `insource:"placed by the player"` sweep of the
whole wiki returns six pages, three of them mutations, and they do not agree:

| Page | Wording | Reads as |
|---|---|---|
| Magic Jellybean, Fleshtrap (Trivia) | "do not decay when fully grown **or** placed by the player" | two separate states, so placed is NOT grown |
| All-in Aloe (Trivia) | "does not decay **while growing or after being placed** by the player" | placed contrasted with growing, so placed IS grown |
| Dead Plant (Obtaining) | decay turns "most **fully grown** mutation into Dead Plants ... even if fully hydrated **or placed by the player**" | placed treated as inside the fully-grown class |

And there is at least one mutation where the rule is **definitely false**:
**Fertilized Jerryseed § Usage** says it "can be planted on farmland in the
Greenhouse to grow a Jerryflower", stalling at stage 5 until fed. That is a seed
item, obtained from an NPC chain rather than by harvesting, so a Jerryflower
placed into a plot is genuinely not pre-grown. **All-in Aloe § Obtaining** adds a
second non-harvested route, crafting from nine fragments, with no statement about
what growth state the result is in.

So the change is **not made**. Acting on it would shorten every estimate on the
site, and shortening on an unsourced assumption is the one move this model does
not make. Logged as `PLACED_MUTATION_PREGROWN` in §10.10 with the playtest that
settles it.

One terminology note found on the way: the Greenhouse crop table's column is
headed **"Growth Cycles"** while the timing section and the Mutations table both
say **"Growth Stages"**. `insource:/Growth Cycles/` returns that one page, so the
term is never defined. Treat it as a wiki inconsistency rather than a second
clock; the per-crop counts themselves are what the dataset uses and they match.

### 5.6 Water

**Greenhouse § Water Level:** *"After each growth stage, a crop loses between
**2-3 Water Level**"* and *"If a crop has negative Water Level during a Growth
Stage, **it has a chance not to advance** to the next stage."*

**That chance is never quantified.** The model therefore assumes a watered plot
and is optimistic if the plot dries out (`WATER_PENALTY`). The can-water →
Water-Level conversion is also undocumented: watering can capacity and flow rate
are published, the exchange rate is not.

---

## 6. The model

Three steps, all closed-form. No simulation anywhere, which is why the
percentiles are exact and the tests can pin them against brute-force binomials.

**Per spot, per planting.** With chance `p` per cycle and a harvest window of
`w` cycles:

```
q = 1 - (1 - p)^w
```

**Per planting, per round.** A plot has `S` spots and `plots` run in parallel, so
one round harvests `Binomial(S x plots, q)`.

**Across rounds.** Independent binomials add, so after `r` rounds the total is
`Binomial(r x S x plots, q)`, giving exactly:

```
P(done within r rounds) = P(Binomial(r x S x plots, q) >= need)
```

evaluated through the regularised incomplete beta, which stays accurate where a
direct binomial sum would overflow (a 100-spot plot over 40 rounds is n = 4000).
Expected rounds is the sum of survival probabilities; percentiles are a binary
search on the same monotone function.

The "it didn't proc before the crops expired, so I replanted" loop is **not** a
special case here — it is simply the rounds where the binomial came up short,
already priced into the tail.

**The harvest window is a decision, not a constant.** Because rolls land every
cycle and inputs persist, waiting longer fills more of the plot — but yield
saturates while the clock keeps running, so there is an interior optimum. The
model reports it as a concrete "leave it N cycles" instruction. For Choconut at
p = 0.30 the optimum is **5 cycles**; harvesting every cycle instead costs
roughly twice as long overall.

### Two deliberate disagreements with the old model

1. **Zero-stage mutations.** The old model returns "instant" for the eleven
   mutations with 0 growth stages, since `0 x stageSeconds = 0`. But a spawn roll
   only happens on a cycle tick, so a planting can never span less than one
   cycle. The new model charges one cycle. (This was a real bug caught by the
   test suite — the optimiser was claiming infinite throughput on Lonelily.)
2. **Parallel plots.** `totalSeconds` divides plantings by plots as a plain
   fraction, so 10 plantings across 3 plots reads as 3.33 rounds. You cannot run
   a third of a round; it takes 4, with two plots idle at the end. The new model
   counts whole rounds and is never optimistic.

Everywhere else, **p = 1 with a single attempt reproduces `planner/time.ts` to
the second** — that is the first test in the suite.

---

## 7. Old model vs new — the Rose Dragon plan

Rose Dragon Egg needs 1x each of Glasscorn, Devourer, All-in Aloe, Phantomleaf
and Timestalk (**Rose Dragon Pet § Obtaining**), which the solver expands to
**428 plantings across 6 cycles**. Reproduce with
`npx tsx tools/time-model-compare.mjs`.

| Scenario | Old | New (expected) | New (p90 bound) | Ratio |
|---|---|---|---|---|
| 1 plot, no upgrades | 980d 7h | **1448d 21h** | ~1477d 18h | **1.48x** |
| 3 plots, Crop Growth 200, Growth Speed 9 | 167d 23h | **275d** | ~280d 11h | **1.64x** |
| 1 plot, with Bioanalysis Artifact | 980d 7h | **1384d 20h** | ~1417d 22h | **1.41x** |
| 1 plot, `quarter` support rule instead | 980d 7h | 1532d 2h | ~1560d | 1.56x |

Per-cycle, the correction is heavily front-loaded — cycle 1 is **2.07x** while
cycle 6 is **1.01x**. That is the right shape: early cycles need thousands of
low-tier mutations where the chance dominates, whereas the last cycle needs one
All-in Aloe whose 27 growth stages dwarf the waiting. Worst single line is
**Ashwreath at 2.57x**, which is exactly what a 15% chance should do to an
estimate that assumed certainty.

**Sensitivity to the unresolved support rule is smaller than feared: 1448d vs
1532d, about 5.8%.** Most mutations require 4 or more crops, where the two rules
agree; only the 2-crop commons diverge. So the ambiguity in §3.2 is worth
settling but is not load-bearing for the headline number.

**On the p90 column:** it sums each mutation's own p90, which assumes every one
of them runs unlucky simultaneously. That is a conservative upper bound, not a
true p90 of the whole grind, and it is labelled as such in the CLI output and in
`combineCycles`. A true joint p90 would need the convolution across mutations;
the per-mutation distributions are tight (large spot counts concentrate the
binomial), so the honest summary is "expect ~1449 days, and the spread on any
individual mutation is small".

---

## 8. Every ASSUMED constant, and how to settle it

| Constant | Assumption | Playtest |
|---|---|---|
| `CROP_SUPPORT_RULE` | `share` — each requirement worth `1/total` | One cycle on a full Choconut plot: 21.6 spawns vs 10.8 separates the rules |
| `ROLLS_PER_SPOT_PER_CYCLE` | Exactly 1, and failures are memoryless | Record empty spots per cycle; i.i.d. rolls make it decay as `S(1-p)^n` |
| `CONTENTION_MODEL` | Irrelevant, because solved plots are single-target | Only needed if multi-target plots are ever planned |
| `DECAY_CLOCK_START` | Starts when the mutation is fully grown | Read the remaining time off the **Plant Diagnostics Tool** |
| `WATER_PENALTY` | Zero — plots stay watered | Not worth measuring; keep the plot watered and it holds |
| Dataset decay values | 5s and non-Noctilume 6s trusted as-is | Plant Diagnostics Tool shows Decay Time per plant |

---

## 9. Sources

**Official Hypixel patch notes** (authoritative):

| Date | Content used |
|---|---|
| 2025-12-15 (post 6027542) | 0.24 release: the growth-cycle roll sentence; 10x10 grid; offline growth |
| 2025-12-12 | Base cycle 3 → 4 hours; Garden Level quartered; unique-crop bonus halved; "Mutations no longer count towards the unique bonus" |
| 2026-01-13 (6046108) | Offline calculation fix; Moonflower/Sunflower merged for the unique bonus |
| 2026-01-20 / 01-27 | "Added Decay Time to Diagnostic Tool"; Rosewater Flask capped at 4 stages |
| 2026-02-02 (6056168) | Noctilume decay 5 → 6 days; "Rebalanced multiple lower tier mutations to require less surrounding crops" |
| 2026-02-04 (6057003) | Offline grace period; "Gave Zombud and Godseed priority over other crops in mutating" |
| 2026-02-17 (6062397) | Supersedes the Feb 4 grace period |

**Hypixel staff Discord**, quoted in full as refs on **Mutations** (tagged
`staff = y` by the wiki, semi-official):

- `mrkeith`, 2026-07-24 — the 40-entry weight table.
- `pikachuflare`, 2026-07-27 — the weight x crop-support model, Bioanalysis
  verified multiplicative, "fermento and dead plants are indeed crops".

**Wiki pages:** Mutations, Greenhouse, Dead Plant, The Garden, The Desk/UI,
Ethereal Vine, Bioanalysis Talisman/Ring/Artifact, Plant Diagnostics Tool, Rose
Dragon Pet, and all 40 mutation articles. No `Talk:` page exists for Mutations,
Greenhouse or Bioanalysis Artifact — there is no discussion to mine.

**ic's Alpha Items Spreadsheet** (`1-uupZnFWLT0l-aPOxY-QGTMi1c3dLmZkUBC_Ho2-3Pc`,
maintained by ic22487, last updated 2026-07-15) — **alpha datamine, flagged as
such**. All 28 content tabs were enumerated and every post-12/25 tab grepped.

It is an *item* datamine — renders, skins, NBT, lore, shop costs — so mechanics
only surface where they happen to be printed on a tooltip. It contains **no**
spawn weights, **no** decay figures, **no** growth-stage counts and **no** cycle
timing. It corroborates the Bioanalysis lore (`greenhouse.csv` L101–L103) and
confirms that **no tab between 12/25 and 7/26 rebalanced any greenhouse number**.

Its one genuinely new contribution is the **7/26 Torrhus Canyon** shard trio,
which the model does not yet price:

| Shard | Attribute | Effect (alpha datamine) |
|---|---|---|
| Timestalk Clone Shard | `greenhouse_speed` | "+0.5-5% Growth Speed in your Greenhouse" |
| Zombuddy Shard | `mutation_serendipity` | "Mutations have a **+0.5-5% chance to instantly re-mutate at their first growth phase when harvested**" |
| Locust Shard | `crop_speed` | "+1-10 Crop Growth while in The Garden" |

`mutation_serendipity` is an entirely new mechanic — a free re-roll on harvest
that bypasses the spread wait — not a rebalance of an existing number. Worth
confirming against live before modelling.

One stale-sheet flag: `greenhouse.csv` L43/L45 still shows the Rosewater Flask
at the pre-January **6** growth stages; live is **4**.

**Wiki text with no citation of its own** (community-measured, treat as
weaker): the growth-stage formula itself, the 2–3 Water Level drain, the -100
Dead Plant threshold, and all per-mutation growth-stage counts.

---

## 10. Open questions

1. **Which crop-support rule is real?** The one measurable ambiguity that moves
   the headline number (§3.2). One Choconut plot, one cycle.
2. **What happens on a contested spot**, and what "priority" means mechanically.
3. **When the decay clock starts** — spawn or full growth.
4. **The negative-water stall probability**, never quantified.
5. **Post-Feb-17 offline behaviour** has no published numbers.
6. **Do base crops regrow after harvest in the Greenhouse?** No page addresses
   it. If they do, the sustained-throughput regime (§6) becomes the right model
   for base-crop-fed mutations rather than the conservative re-sow one.
7. **Are the dataset's decay 5s and 6s correct?** Only Noctilume's 6 is sourced.
8. **Glasscorn: 8 or 9 growth stages?** The article and the table disagree.
9. **Do the 7/26 Torrhus shards exist on live**, and does `mutation_serendipity`
   work as its tooltip describes?
10. **Is a mutation placed from stock already fully grown?** (§5.5,
    `PLACED_MUTATION_PREGROWN`.) The three trivia lines that touch it contradict
    one another and Fertilized Jerryseed is a counterexample. Settles the input
    lead-in for 20 of the 40 mutations, so it is the second largest unresolved
    lever after the crop-support rule. **PLAYTEST:** place a harvested Soggybud,
    which has 10 growth stages, into an empty plot and read it with the Plant
    Diagnostics Tool. A stage count of 10 of 10 means placed is pre-grown; a 1 of
    10 with a running timer means it is not.
11. **Does a spreading condition require its surrounding crops to be mature?**
    Never stated. All 40 conditions are written purely as counts of adjacent
    crop blocks, and the one staff quote on the mechanic is about whether a
    neighbour counts as a crop at all, not about its growth state. The model
    assumes maturity is required, which is what makes the §5.5 lead-in a cost at
    all; if immature crops count, the lead-in shrinks or vanishes.
