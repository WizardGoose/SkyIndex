<!-- The site name appears twice in this file, in the heading and the first line
     of prose. Both are plain markdown copies of SITE_NAME in src/ui/brand.ts,
     which is the source of truth for the display name. -->

<div align="center">

<img src="docs/assets/wordmark.svg" alt="Skydex" width="880">

Skydex is a Hypixel SkyBlock toolkit that runs entirely in your browser.

<a href="LICENSE"><img src="docs/assets/badge-mit.svg" alt="MIT licensed" height="20"></a>
<a href="#quick-start"><img src="docs/assets/badge-browser.svg" alt="runs in your browser" height="20"></a>
<a href="#privacy"><img src="docs/assets/badge-no-tracking.svg" alt="no ads, no tracking" height="20"></a>
<a href="#privacy"><img src="docs/assets/badge-api-key.svg" alt="API key: Hypixel only" height="20"></a>

</div>

# Skydex

Skydex is a passion project: [contributions](docs/contributing.md),
[suggestions and requests](https://github.com/WizardGoose/Skydex/issues),
forks/edits - so on, so on.. are all welcome!

Skydex isnt currently in a state I exactly want it to be, however, I don't have
as much time as I do anymore - so Ill be posting smaller updates while I play
skyblock! I apologize if there are portions of the GUI that do not look very
visually intriguing, they will be fixed eventually!

So, what is it. Skydex is a Hypixel SkyBlock toolkit that runs entirely in your
browser. There is no Skydex account, no Skydex login and no Skydex server - the
site is a folder of static files, and every calculation happens on your own
machine. The greenhouse solver and the expansion optimizer are local and work
offline, so they keep going even when nothing else does!

New here and just want to run it? Start with the [setup guide](docs/SETUP.md),
which walks through it from scratch and assumes you have never run a Node
project before (that is not a dig, it is genuinely who it is written for).

## Getting started

The quickest, easiest way to start is
[Skydex on GitHub Pages](https://wizardgoose.github.io/Skydex/): open it in a
browser and use Skydex. No install, no account and no local server.

The companion mod is the other route for island data. Run `/skyindex copy` in
game, then paste the code into the Island page. Skydex imports it locally in
your browser, so the code does not go anywhere else.

<div align="center">

<img src="docs/assets/site.png" alt="The Skydex Crafting page, showing the full crafting tree for a Hyperion alongside a list of what to buy or gather" width="900">

<p><sub>The Crafting page, pulling a Hyperion apart into the things you
actually have to go and get. (a real screenshot, not a mockup!)</sub></p>

</div>

[What is inside](#what-is-inside) - [Getting started](#getting-started) -
[Quick start](#quick-start) -
[Configuration](#configuration) - [Privacy](#privacy) -
[The companion mod](#the-companion-mod) - [Credits](#credits) -
[Contributing](#contributing) - [A note on storage](#a-note-on-storage) -
[License](#license)

---

## What is inside

Five sections, plus the dashboard tucked behind the wordmark.

- **Profile** reads a player's SkyBlock profile: skills, accessories, networth
  and an island snapshot, with a 3D view of their skin!
- **Crafting** shows the full crafting tree for every craftable item, and says
  plainly when an item has no known crafting route (rather than quietly
  pretending there is one).
- **Forge** reads the forge table from the wiki, with times and costs.
- **Greenhouse** holds the Planner, the Solver and the Designer, for laying out
  a greenhouse and working out what a plot is worth.
- **Shards** holds Fusion, Recipes, Overview and Lines, the shard fusion
  calculator and its reference pages.

## Quick start

You will want Node **20.19 or newer, or 22.12 or newer**, and pnpm (this project
is built with pnpm 10.18.1). The [setup guide](docs/SETUP.md) covers installing
both if that sentence meant nothing to you, which is a completely fair thing for
it to have meant.

Run it locally for development:

```sh
pnpm install
pnpm run dev
```

That serves the site at `http://localhost:5173`. If that port is already busy,
Vite picks the next free one and prints the real address, so read the terminal
rather than assuming! (assuming is how you end up staring at a blank tab)

Look at a production build the way a visitor would:

```sh
pnpm start
```

That builds and then serves the result at `http://localhost:4180`. This is the
one that tells you the truth about what visitors actually get.

Publish to GitHub Pages:

```sh
pnpm run deploy
```

## Configuration

No environment file is needed, and there are no variables to set by hand!
`GITHUB_PAGES=true` is read at build time to pick the base path, and that is
all it does. It is the one difference between the two builds: with it the site
is rooted at `/Skydex/` to match the repo name, without it at `/`.
`pnpm run deploy` sets it for you, so the only time it matters by hand is if you
build the Pages artifact yourself.

Deep links on Pages go through `public/404.html`, which is the whole reason that
file exists: a static host has no rewrite rule, so a visitor opening
`/Skydex/greenhouse/planner` directly is served the 404 page, which stashes the
address and hands it to `src/components/AppWithRedirect.tsx` to restore. They
are a pair and only work together (please do not separate them, they get sad).

## Privacy

Skydex serves no ads, runs no analytics and sets no cookies, and it has no back
end that could log anything even if it wanted to. Your Hypixel API key is stored
in your own browser's localStorage and is sent to exactly one place,
`api.hypixel.net`, as a request header, never in a web address.

The full account of what your browser connects to, and what each host can see,
is on the Privacy page in the app at `/privacy-policy`
([source](src/pages/PrivacyPolicy.tsx)). Every claim on it is checkable against
a named file, which is deliberate - you should not have to take my word for it.

## The companion mod

There is an optional companion mod! It is not required, and everything on the
site works without it. When it is running, the site talks to it over plain HTTP
at `http://127.0.0.1:27916` on your own machine: it checks whether the mod is
up, listens for live updates, and sends a greenhouse layout across when you
press the button to do so. That traffic never leaves your computer and none of
it is reachable from the network. The mod is MIT, in its own repository.

(so yes, it is your computer talking to itself. Weird? A bit. Local? Entirely.)

## Credits

Skydex would not exist without the SkyBlock tools that came before it. I mean
that literally, not as a polite thing to put in a readme.

- **[SkyShards](https://github.com/Campionnn/SkyShards)** by Campion and xKapy.
  The shard fusion calculator, greenhouse solver and greenhouse designer are
  derived from their code, which is MIT licensed. This is real code ancestry,
  not just inspiration, and the terms and the history are set out in full in
  [NOTICE.md](NOTICE.md).
- **[SkyHelper-Networth](https://github.com/Altpapier/SkyHelper-Networth)** by
  Altpapier. The networth engine is a direct TypeScript port, MIT licensed.
- **[NotEnoughUpdates](https://github.com/NotEnoughUpdates/NotEnoughUpdates-REPO)**,
  for one constant describing accessory upgrade chains, fetched at runtime.
- **[SkyCrypt](https://cupcake.shiiyu.moe)** and other community sites were studied
  for how they present dense data. Nothing was copied from them: the influence
  is on layout and restraint, not on code.

Item, recipe and mutation data and item images are loaded live from the Hypixel
SkyBlock Wiki under CC BY-NC-SA 3.0, and player avatars come from MCHeads. None
of that content is redistributed here. [NOTICE.md](NOTICE.md) is the full
attribution and licensing record, including what ships in this repository and
what does not.

Thank you so much to the developers of these wonderful tools that allow the
community to thrive! If these utilities did not already exist, Skydex would not
be here.

## Contributing

The [contribution guide](docs/contributing.md) covers the layout of the codebase,
the data pipeline, the house rules and the gates a change has to pass. If you
want to change something, please do! (and if a gate yells at you and it is
wrong, tell me, because then the gate is the bug)

## A note on storage

This bit is boring and it matters, sorry. localStorage keys are hardcoded
literals and the legacy `wizardsky.*` prefix is permanent for the keys that
already shipped under it (new keys use `skyindex.*`). It is a storage namespace,
not the site name, and it survives renames on purpose: renaming it would orphan
every saved planner, target list, profile and island snapshot. Nobody is losing
their planner over a tidy string.

The repo's directory name is the same kind of namespace. The companion mod,
which shipped under the earlier SkyIndex name, keeps its `/skyindex` commands
(a command is muscle memory, not branding), and as of this release both the mod
and the site write island codes with the `SKYDEX-` prefix. Both still read
`SKYDEX-`, `SKYDEX1.` and the older `SKYINDEX1.` alike, so every code already
in circulation still pastes. See the comment in `src/ui/brand.ts`.

## License

Skydex is MIT licensed, and the grant in [LICENSE](LICENSE) covers the whole
history of the codebase, from the very first commit. (all of it. no carve-outs,
no "except that bit".) Attribution for the MIT works this project adapts lives
in [NOTICE.md](NOTICE.md). Wiki content, Hypixel API responses and Mojang assets
are loaded at runtime under their own terms and are not part of this grant.

---

if you're a fellow ironman mole person like me, wait in line to get your
cheese :3
