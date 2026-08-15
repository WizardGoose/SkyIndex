# Skydex user guide

Skydex is a Hypixel SkyBlock multi-tool built for ironman players. Everything
runs in your own browser: the greenhouse solver, the planner, the fusion
calculator. Nothing you type or import is sent to any server this project owns,
because there isn't one.

This guide walks through the site in the order you will probably meet it:
what each page does, how to connect your Hypixel API key, how the companion
mod feeds the Island page, and what the planner's numbers actually mean.

## The pages, one by one

### Landing page (/)

One search field. Type the name of a mutation, an item, a shard, or a page,
and go straight to it. If you have a plan running, one line under the field
shows how far through it you are. That is the whole page on purpose: it is a
front door, not a brochure.

### Dashboard (/dashboard)

The answer to "where was I, and what do I do next". It reads the plan the
Planner last saved, so it loads instantly and works offline. What you own is
read live, so the progress number stays honest even when the plan itself has
not been recomputed.

From top to bottom: the big percentage (how far through the current grind you
are), the up-next list (what to plant next and how long each planting takes),
then links to the tools.

### Greenhouse Solver (/greenhouse)

Pick one or more mutations and the solver finds a plot layout that produces as
many of them as possible. The solve runs locally, in a Web Worker in your own
browser. No request leaves your machine, and it works offline.

Things worth knowing:

- You can set which cells of your plot are unlocked, so the answer matches the
  greenhouse you actually have.
- You can pin crops or mutations to specific cells and the solver works around
  them.
- The result is labelled honestly. **OPTIMAL** means the solver proved no
  layout can do better. **FEASIBLE** means this is the best it found within
  its budget, stated against the upper bound it could prove. It never claims
  optimality it cannot back up.
- Common full-plot solves are precomputed at build time, so they come back
  instantly. A custom plot is a different question and is always solved live,
  which takes a few seconds.
- If you run the companion mod in Locally Hosted mode, a send button pushes
  the solved layout into the game as a ghost-tile overlay (see the mod section
  below).

### Greenhouse Designer (/greenhouse#designer)

Lay out a plot by hand and check it. Place crops and mutation targets on the
grid, and the validator tells you which mutations your layout actually
supports and which requirements are missing. Share links carry the whole
layout in the URL, so sending a design to a friend involves no server.

### Greenhouse Planner (/greenhouse#planner)

The big one. Pick a target (a shard, a recipe, a mutation, a quantity) and the
planner turns it into a grow order: which mutations to farm, in what order,
how many plantings each takes, and how long the whole thing is expected to
take. What the numbers mean is covered in its own section below.

### Items (/items)

A browser for every craftable item, with full crafting trees. Each node in a
tree answers one question: is it cheaper to craft this or buy it? Prices are
live from the bazaar. Only about a quarter of items are bazaar tradeable, so
an unpriced node reads as "no price" rather than free, and an unpriced branch
can never make a tree look cheaper than it is.

In ironman mode the buy option disappears entirely, because there is no Bazaar
and no Auction House on an ironman profile. Every tree bottoms out in things
you personally farm, mine, or kill.

### Accessories (/accessories)

What you are missing, and where to get it. Every accessory tile carries a
source chip: crafted, bought, dropped, quest reward, or "See wiki" when the
source genuinely is not known. You do not need an API key to browse the
catalogue.

With an API key set, the page splits into Missing and Owned by reading your
accessory bag. If the bag cannot be read at all, the page says so and shows
one ungrouped catalogue instead of inventing a zero. Upgraded-away accessories
(a talisman you turned into its ring) are not counted as missing.

### Island (/island)

Where is my stuff. The Hypixel API cannot see inside island chests, so this
page is fed by the companion mod, plus an optional keyed API pull that fills
in sacks. Search sits at the top because the real question is never "show me
chest 12", it is "where did I put the enchanted mushrooms". Searching
auto-opens the chests that match.

Every section says where its data came from and how fresh it is. The page is
careful to keep four different kinds of nothing apart:

- verified empty: we looked, there is nothing there
- not shared via API settings: Hypixel is withholding it, you can change that
  in game
- not captured yet: the mod has not seen it opened
- no source at all: nothing can see this

None of those ever shows as a zero, because a made-up zero is a confident lie
in a tool whose one job is telling you where your things are.

### Fusion (/fusion)

The shard fusion calculator, inherited from SkyShards. Pick a target attribute
shard and it finds the cheapest fusion path to it. It can use your inventory
and owned attributes (managed in the same page) so the path accounts for what
you already hold. Importing your profile from Hypixel needs your own API key
(see below); the request goes straight from your browser to Hypixel.

Related pages: **/shards** is the owned-shards editor, where you record which
shards you hold. **/fusion-lines** draws the fusion family tree as a graph.
**/recipes** is the recipe lookup.

### Settings (/settings)

One place for everything that is a setting: your Hypixel API key and account,
your game mode, and the wiki data cache. The Island page links here when it
needs something.

## Your Hypixel API key

Several features are better with your own Hypixel API key: sacks on the Island
page, the Owned split on Accessories, profile import in Fusion, and automatic
game mode detection.

The rules the key is held under, in full:

- It lives in one localStorage entry in your own browser and is never sent
  anywhere except **api.hypixel.net**, as a request header.
- It never appears in a URL, never in an error message, and is never shown
  unmasked (the input is a password field).
- There is no server between you and Hypixel. Deleting it is one button, and
  it removes exactly that one stored entry.

Hypixel keys expire, and Hypixel does not publish the expiry date over the
API, so the Settings page lets you type the date in yourself. If you do, the
site counts down and warns you when the key is close to dying. If you do not,
nothing nags you about it.

## Ironman vs normal mode

The site has two cost models and a toggle between them:

- **Ironman**: no Bazaar, no Auction House, no trading. "Just buy it" is never
  an answer, so every crafting tree bottoms out in things you gather yourself.
  Stranded profiles count as ironman too, since they are strictly more
  restricted.
- **Normal**: the cheaper of craft or buy is the right call, and coin costs
  are meaningful.

The default is ironman, because that is who the site is for. If you have an
API key set, the site reads your profile's actual game mode and fills the
toggle in, marked with a small "from API" chip so a control never changes on
its own without saying why. If you set the toggle yourself, your choice is the
truth from then on: the API never overwrites a manual choice. Settings has an
option to hand the toggle back to automatic if you change your mind.

## The companion mod and the Island page

The Hypixel API does not reliably expose island chests, ender chest pages,
storage backpacks, or your live inventory. The Skydex mod, a passive Fabric
client mod, captures those as you naturally open them in game and hands them
to the site. It sends no packets, automates nothing, and never asks Hypixel's
servers for anything, which keeps it in the same allowed category as mods like
Skyblocker and NEU.

There are two ways the data reaches the site, and the mod's settings screen
(`/skydex` in game) asks you which Skydex you use:

### Paste codes (for the hosted site)

Run `/skydex copy` in game (or press the button in `/skydex`). The mod
puts an export code on your clipboard. It starts with `SKYDEX2-` or `SKYDEX-` and is your
island data, compressed and encoded, nothing more. Paste it into the box on
the Island page and the site decodes it locally, in your browser. The code
never touches a network.

By default the export code carries sacks and island chests, the things the
API cannot give the site. If the site has your API key it fills in the rest
itself; if not, the mod has a setting to include your inventory, ender chest,
and storage in the code too.

### Live local server (for a locally run site)

If you run the site on the same machine you play on, the mod runs a small
read-only server bound to 127.0.0.1 only. The Island page connects to it and
updates within a second of anything changing: open a chest in game, watch it
appear on the page. No pasting involved.

This mode also enables the layout overlay: design a plot on the site, press
send, and the mod paints translucent ghost tiles on your island floor showing
what goes where. It never places a block; you build it by hand.

### Both at once

The mod's live feed and the Hypixel API are kept as separate feeds and merged
when the page reads them, with each section labelled by where it came from.
The mod's data wins where it is fresher, and a bad or garbled message can
never overwrite good stored data.

## What the planner's numbers mean

The Planner turns a target into a grow order, and the numbers on it are worth
understanding because none of them is a guess.

**Plantings.** The unit of cost. One planting is one plot, sown once,
harvested once. The planner asks the solver what a single optimal plot of each
mutation yields and what it costs to sow, then computes plantings as the
demand divided by that yield, rounded up. Anything you already own comes off
the demand first, and the plantings your stock removed are shown as credit on
the row's counter rather than silently vanishing.

**Cycles.** The grow order. Mutations are grouped into cycles by dependency:
cycle 1 grows the inputs that cycle 2 needs, and so on up to the target. You
work through them in order.

**Plot sizing.** A demand of 2 does not get a 51-spawn plot. Small demands get
plots sized to the job, and the row says what that costs in waiting: "2 spots,
about 6 cycles for both to fill" is the honest price of the cheapest plot that
can hold the job.

**Expected vs 90% times.** A mutation spawn is a dice roll, so a planting is
a fistful of coin flips rather than a guaranteed harvest, and the times are
stated as a distribution:

- **Expected** is the average wall clock for the whole job, from nothing.
- **90%** is a conservative bound: nine out of ten runs finish within it. The
  plan-wide 90% figure sums each mutation's own bound, which assumes every one
  of them runs unlucky at once, so it is an upper bound and labelled as one.

Both numbers also come in a "left" form that discounts the plantings you have
already ticked off.

**Harvest windows.** "Every 2 cycles" means: leave the planting standing that
many growth cycles before harvesting, because each cycle the standing plot
rolls again for more spawns. The model picks the window that finishes the job
soonest, and where decay is what ends the window rather than diminishing
returns, it says so.

**The breakdown.** Hover a time and it shows its working, in the order you
actually wait through it: "21 stages: 11 Melon maturation + 10 Soggybud
growth". The input crops maturing are part of the clock, which surprises
people the first time; the breakdown exists so the number is readable, not
just right.

**Progress.** Counted in units, not rows, so a 12-item row cannot cancel out a
2,624-item row. Stock you already hold counts toward the plan, clamped at what
the plan actually asks for, so an overflowing sack cannot read as a finished
grind.

One caveat the estimates carry, quoted where it applies: the spawn chance
model assumes each required crop carries an equal share of the support. That
is the one rule still waiting on an in-game check; every other number behind
the estimates is sourced, and the sources are in
[greenhouse-time-research.md](greenhouse-time-research.md).

## Where your data lives

Everything the site remembers about you is in your browser's localStorage:
your plan, your owned shards, your island snapshot, your API key, your
settings. Nothing is synced anywhere. Clearing site data in your browser
clears all of it, and the site starts fresh.
