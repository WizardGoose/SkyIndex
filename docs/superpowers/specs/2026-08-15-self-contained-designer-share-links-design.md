# Self-contained Designer share links

Date: 2026-08-15
Status: Approved design

## Goal

Designer share links use one opaque path payload and no generated query parameters:

`https://skydex.ca/greenhouse/share/<payload>`

The payload contains the complete mutation layout and the exact display name shown to the sender. Skydex does not store or resolve the link through a server-side database.

## Product behaviour

- A user-set saved-layout name is frozen into the payload exactly after the existing name normalization rules are applied.
- An automatically generated name is also frozen into the payload. Opening the link later must show the same name even if Skydex's naming rules change.
- The main Designer Share action copies the queryless canonical URL.
- Every card in the Load layout modal has a Share button beside Load layout, including Most Recent and manually saved layouts.
- `Most Recent` remains a UI role label. Its frozen shared name is the generated nickname shown inside the parentheses, such as `Soggy Field`.
- Sharing a card copies its link without loading it, closing the modal, or changing the active design.
- The existing success/error toast pattern reports the clipboard result.
- Existing rename and delete controls retain their current behaviour.

## Payload format

The existing layout payload remains the v1 format:

`rawDeflate(<input-indexes>|<target-indexes>|<100-cell-grid>)`

New links use a v2 envelope inside the same raw-deflate and base64url transport:

`v2|<percent-encoded-display-name>|<input-indexes>|<target-indexes>|<100-cell-grid>`

Percent-encoding prevents names containing pipes, percent signs, Unicode, or spaces from becoming structural delimiters. The normalized display name is limited to 80 Unicode code points before encoding. The existing compressed and inflated-size ceilings remain enforced.

The regular local layout encoder remains available for layout equality checks. A separate shared-layout encoder creates the v2 envelope so adding a display name cannot change local saved-layout identity or matching behaviour.

## Decoding and compatibility

- Browser decoding accepts both v1 and v2 payloads.
- Cloudflare preview decoding accepts both v1 and v2 payloads.
- v2 returns the embedded frozen display name alongside inputs and targets.
- v1 has no embedded name. Existing `?name=` links remain readable as a legacy fallback, and otherwise retain procedural-name generation.
- For v2, the embedded name takes precedence over any query parameter. A query cannot rename a frozen link.
- New Skydex links never generate `?name=` or `preview=`.
- Canonical metadata, preview-image URLs, and oEmbed URLs are generated without name or cache-busting query parameters for v2 links.
- Existing fragment links, legacy SkyShards share links, bare codes, and existing v1 Skydex share links continue to import.

## Component boundaries

### Browser share codec

`designEncoding.ts` owns v1/v2 encoding, bounded decoding, display-name normalization, code extraction, and canonical queryless URL construction.

### Designer actions

The page-level Share action determines the displayed name: an exact matching saved layout keeps its user name; otherwise the current layout receives the same generated nickname used by Skydex's loadout presentation. It then encodes the name and layout together.

### Load layout modal

`LoadLayoutModal` receives one `onShare(layout, displayName)` callback. Most Recent shares the generated nickname inside its UI role label, while a manually saved card shares its user-set name.

### Cloudflare preview Worker

The Worker decodes the embedded name in memory and uses it for the Discord title and preview image. The request is discarded after the response; no KV, D1, R2, cache write, analytics, or application logging is introduced.

## Error handling

- Empty, malformed, oversized, corrupt, or unknown-crop payloads keep the existing actionable errors.
- A malformed v2 name or invalid percent-encoding rejects the payload instead of silently changing its name.
- Empty normalized names are rejected during v2 encoding and decoding; every new shared payload has a stable display name.
- Clipboard failures surface through the existing error toast and do not close the Load modal.

## Verification

Automated tests must prove:

1. User-set and generated names survive a v2 encode/decode round trip.
2. Unicode, pipe characters, percent signs, repeated whitespace, and control characters normalize and round-trip safely.
3. New URLs are exactly `/greenhouse/share/<payload>` with no query string.
4. Browser and Worker decode the same v2 fixture to the same name, inputs, and targets.
5. A query parameter cannot override an embedded v2 name.
6. Existing v1 fixtures and legacy URL shapes still decode.
7. Main Designer sharing and card sharing copy a self-contained queryless URL.
8. Most Recent and manually saved cards both expose Share; clicking it does not call Load or close the modal.
9. Discord share HTML, oEmbed metadata, and the 1200 by 630 preview use the frozen name and queryless resource URLs.
10. The full test suite, production build, changed-source lint, and diff-integrity checks pass or clearly identify unrelated pre-existing failures.

## Release boundary

Implementation and verification happen only in the isolated launch worktree. Deployment of the updated Worker and publication to `skydex/master` require an explicit release approval after local verification.
