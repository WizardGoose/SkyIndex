<!-- The site name appears twice in this file, in the heading and the first line
     of prose. Both are plain markdown copies of SITE_NAME in src/ui/brand.ts,
     which is the source of truth for the display name. -->

# Skydex

Skydex is a personal Hypixel SkyBlock toolkit: shard fusion calculator,
greenhouse solver and designer, grind planner, item and recipe lookup, and an
island snapshot view.

## Getting Started
To run locally:
```sh
pnpm install
pnpm run dev
```

No environment file is needed, and there are no variables to set. `GITHUB_PAGES=true`
is read at build time to pick the base path, and that is all.

`VITE_API_TARGET` is gone, along with the `/api` dev proxy it fed. Both existed
for a single call, the Hypixel player-profile lookup behind Fusion, then Manage
Inventory, then Import, which went through api.skyshards.com. That call now goes
straight to api.hypixel.net from your own browser with your own Hypixel API key
(entered on the Settings page), so dev and a built site take the identical path.

Everything runs in the browser. The greenhouse solver and the expansion
optimizer are local and work offline, and `pnpm check` makes no network call.
See [NOTICE.md](NOTICE.md) for attribution and licensing.

## Credits
The shard fusion calculator, greenhouse solver and greenhouse designer are
derived from [SkyShards](https://github.com/Campionnn/SkyShards) by Campion and
xKapy ([live upstream site](https://skyshards.com/)). Wiki data is used under
CC BY-NC-SA 3.0. Full attribution and licensing terms are in
[NOTICE.md](NOTICE.md).

## A note on storage
localStorage keys are hardcoded literals and the legacy `wizardsky.*` prefix
is permanent for the keys that already shipped under it (new keys use
`skyindex.*`). It is a storage namespace, not the site name, and it survives
renames on purpose: renaming it would orphan every saved planner, target
list, profile and island snapshot. The repo's directory name is the same kind
of namespace. The companion mod, which shipped under the earlier SkyIndex
name, uses `/skyindex` commands and the `SKYINDEX1.` wire prefix; those are a
command and a wire protocol rather than branding, so the Skydex rename left
them alone and every island code already in circulation still pastes.
See the comment in `src/ui/brand.ts`.

## License

Skydex is MIT licensed, and the grant in [LICENSE](LICENSE) covers the whole
history of the codebase, from the very first commit. Skydex simply would not
exist without the wonderful developers behind
[SkyShards](https://github.com/Campionnn/SkyShards),
[SkyHelper](https://github.com/Altpapier/SkyHelper-Networth), and the other
SkyBlock tools that gave me the inspiration to build Skydex. Attribution for the
MIT works this project adapts lives in [NOTICE.md](NOTICE.md). Wiki content,
Hypixel API responses and Mojang assets are loaded at runtime under their own
terms and are not part of this grant.

---

if you're a fellow ironman mole person like me, wait in line to get your
cheese :3
