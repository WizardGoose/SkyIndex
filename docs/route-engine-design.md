# Route engine design notes (task #17)

Captured 2026-08-02 from the owner's own description and rough mockup, before
any implementation. This is the vision document; the engineering plan comes
after the local solver (task #5) and the API cheatsheet land.

## The problem, in the owner's framing

Today the planner answers "what do I need for Rose Dragon" as a flat bill:
grow this 27 million times, then that one, then the next. Correct, but it is
a shopping list, not a route. The owner wants the tool to optimize HOW he
gets there over time, not just WHAT the total is.

## The chess engine metaphor (his)

- A **move** is one complete garden cycle.
- The engine searches ahead over sequences of moves and shows the line it
  found: **a board snapshot per move**, like a chess engine showing the
  position after each move of its principal variation.
- His mockup renders this as one grid where the current cycle's placements
  are drawn solid and a future cycle's placements are drawn as ghosts on the
  same board. (Rough, his words: "ITS ROUGH AND NOT OPTIMAL, THERE MUST BE A
  BETTER WAY TO DO THIS" - the ghost-overlay idea is directional, not a
  binding UI spec.)

## The mockup, corrected by the owner (2026-08-02)

First reading (wrong): solid = this cycle's plantings, ghosts = next cycle's
plantings. His correction: **only the base crops are ever planted** - in the
mockup, the cocoa beans, pumpkins and melon. Everything ghosted GROWS on its
own: the two lower-tier mutations spawn from the planted base over cycles,
and the highlighted center mutation forms LAST, from the spawned mutations
themselves satisfying its adjacency - no replanting in between.

So the unit of play is not "a layout per target" but a **cascade layout**:
plant once, leave (his words: "just cause I leave for say a day, and then
come back, its all grown, I do one harvest, do the next one"), and the board
upgrades itself tier by tier. This leans directly on the confirmed mechanic
that spawned mutations count as adjacency for further mutations.

Owner addition (2026-08-02): **the planted base does not have to be crops -
already-owned mutations can be planted as cascade bases too.** That widens
the search space considerably: the engine's move generator must consider
spending stock (planting owned mutations as fixed adjacency anchors) versus
keeping it, which turns inventory into a plannable resource, not just a
discount on the bill. The sequential-discount rules in planEstimates are the
accounting model to stay consistent with.

Ownership note: the owner has asked the session lead (Fable) to personally
take the optimization pass on the engine core once the draft exists -
"optimized" here means measured: profiled hot paths, a benchmark harness
with fixed seeds before/after, and honest complexity accounting, per the
prove-don't-assert house rule.

**His own falsifiability note, preserved verbatim in spirit: "I believe in
theory it should be functionally better and more optimal than just doing 18
fields of the same thing over and over. But I could actually be wrong."**
The engine's first job is therefore to MEASURE cascade layouts against flat
single-mutation farming under the real time model (spawn probability per
cycle, spawn placement randomness among eligible cells, decay, harvest
timing) and report which wins for a given target - not to assume either
answer. If flat farming wins for some tiers, the tool says so.

Engineering note on spawn placement: a cascade requires tier-1 mutations to
appear in positions that satisfy the tier-2 requirement around a reserved
cell. Whether spawn placement among eligible cells is uniform-random,
deterministic, or biased is load-bearing for cascade viability and must be
pinned (wiki + in-game observation) before the engine prices cascades.

## Design forces the route must respect

1. **Stability beats churn.** "Something that allows us to grind away at
   these mutations, but still not have to always replace with different
   setups." Layouts should share stable substructures across consecutive
   cycles - e.g. one side of the board locked in on Choconut production for
   several moves while the other side rotates. Full teardowns between cycles
   are a cost the engine must count, not ignore.
2. **The research feedback loop.** Donating researched mutations levels the
   mutation talisman (Bioanalysis chain), which raises greenhouse grow speed
   itself. Research is therefore an INVESTMENT move: donating early
   accelerates every later cycle. The engine should be able to recommend
   research-first lines when the math favors them. Exact numbers (which
   donations, which talisman tiers, how much speed) must come from the wiki
   and the API dump - not from memory.
3. **Unlock gating.** Higher-tier mutations require researching lower ones
   first ("you need to research new mutations in order to get higher levels
   of things"). The route engine inherits this dependency graph.
4. **The time model** (stage formula, spawn chance per cycle, decay caps)
   already exists and prices each move. A move's cost is wall-clock time, not
   cycle count.
5. **Plots.** SETTLED from documentation (2026-08-02, Desk UI page of the
   wiki): greenhouses = (PLOT_LIMIT ?? 0) + 1, where PLOT_LIMIT counts
   PURCHASED tiers (0-2), base 1 greenhouse, max 3. The owner has 1 (no
   purchases; key absent from his API response, consistent). Ceilings for
   the sibling upgrades, also documented: Growth Speed max tier 9 (+50%
   total), Plant Yield max tier 9 (+20% total; the owner sits at 4 = +8%).
   Multi-greenhouse futures multiply the board area the engine plans over -
   design for 1-3 boards from the start.

## What the local solver makes affordable

The remote solver took 2-10s per solve; the local one runs ~160ms and is
deterministic. Searching over candidate cycle-sequences (dozens to hundreds
of solves per route) was unaffordable before and is now a sub-minute job,
which is the enabling fact for the whole feature.

## What "solve quality" means here (pinned 2026-08-02, owner asked)

Quality is not one number; it is six testable properties, in priority order:

1. **Legal.** The answer must be buildable on a real board: no cell claimed
   twice, every adjacency and ground rule satisfied. A better-looking number
   on an impossible plot is the worst output the engine can produce (we
   caught exactly this once: 102 spawns on 100 cells). The legality gate
   runs on every answer, always.
2. **Right objective.** A perfect answer to the wrong question is a bad
   solve. The objective is time-to-milestone under the real time model,
   including the owner's attention as a cost: a plan that needs a login
   every 3 hours is worse FOR A HUMAN than one 5 percent slower that
   harvests once a day. AFK-friendliness is part of the objective function,
   not a nice-to-have.
3. **Measured against the provable bound, not against a competitor.** Every
   mutation has a mathematical ceiling (ring bounds and friends). Quality is
   the gap to that ceiling: at the bound we KNOW the answer is perfect;
   short of it we report the gap ("71 of at most 76"). "Beats the old
   solver" is a fact worth knowing but is not the definition of good.
4. **Honest labels.** Exactly three: OPTIMAL only when proved at a bound;
   BEST-KNOWN with the gap stated; INFEASIBLE with the reason. The engine
   never borrows confidence it has not earned.
5. **Reproducible.** Same inputs, same answer, seeded randomness. A solve
   that cannot be reproduced cannot be tested, compared or trusted, and
   flickering answers read as randomness to the player.
6. **Robust under the dice.** Spawns are probabilistic, placement may be
   random. Quality includes expected time AND spread: "2 days, give or take
   6 hours" can be a better plan than "1.8 days, give or take 3 days", and
   the engine should surface both numbers so the choice is the player's.

And one property of the process rather than the answer: the harness stays.
Parity baselines, regression fixtures and the legality gate are what keep
quality true as the code changes, which matters more than any single solve.

## The live board: verified + estimated (owner, 2026-08-02)

Two owner additions that snap together into one feature:

1. **Per-cycle forward simulation.** The time model already prices spawn
   probability per cycle; run it FORWARD from the last observed board state,
   cycle by cycle, filling in expected spawns/growth until every target has
   a completion estimate ("when do the crops finally finish"). The output is
   a timeline of expected board states - which is also exactly the
   chess-engine board-per-move view, so one renderer serves both.
2. **Greenhouse detection in the mod.** Detect the greenhouse structure on
   the Garden while the player is there, read the entire planted patch
   (every crop/mutation from client-visible block state), and ship it to
   the site (live server, or folded into the export code). Research round
   dispatched: how Skyblocker/SkyHanni recognize areas/structures, what
   block palette identifies the greenhouse, passive-only constraints. The
   spec section for a `greenhouse` payload gets pinned AFTER the research,
   not before.

Together: the site can show a **live greenhouse where every cell is either
VERIFIED (mod observed it, timestamped) or ESTIMATED (simulated forward from
the last observation under the time model)** - visually distinct, honestly
labeled, converging back to verified every time the player walks past. The
estimate is allowed to be wrong; it is never allowed to be unlabeled.

## Open questions for the engineering round

- ~~Where do donated/researched mutations live in the API?~~ ANSWERED
  (2026-08-02, see docs/hypixel-api-cheatsheet.md): they mostly DO NOT. No
  research level, donation counter or bioanalysis field exists in the
  profile. The only API signals are garden_player_data.analyzed_greenhouse_crops
  (membership list, his: 13) and discovered_greenhouse_crops (his: 16).
  Consequence: numeric research progress must come from the mod reading the
  in-game research/donation UI (a future capture target), from the
  Bioanalysis accessory tier derived out of talisman_bag NBT, or from the
  player stating it - the engine must treat research state as
  partially-observable and label its source.
- Exact Bioanalysis tier thresholds and grow-speed contributions (wiki pass,
  cite pages).
- Search formulation: this smells like weighted shortest-path over
  (inventory, research-state, layout) nodes with move = solve+grow+harvest;
  the honest first version may be beam search over candidate stable layouts
  rather than full optimality. Measure before promising optimal.
- UI: sequence-of-boards vs ghost overlay vs both (his mockup leans ghost
  overlay; the mod's in-game layout push should eventually receive per-move
  layouts too).
