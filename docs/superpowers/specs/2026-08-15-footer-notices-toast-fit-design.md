# Footer Notices and Toast Fit Design

## Goal

Keep Skydex's required notices and source credits accessible without leaving a long attribution paragraph permanently expanded, and keep Designer notifications in the requested top-right corner without colliding awkwardly with a wide modal.

## Footer

- The visible first footer line is the Minecraft non-affiliation disclaimer in the footer's brighter `11px` treatment.
- A second, quieter line is a native `<details>` disclosure labelled `Skydex Project Credits`. Its disclosure marker remains visible so the row clearly expands.
- The expanded disclosure contains the Hypixel SkyBlock Wiki attribution and CC BY-NC-SA 3.0 link, the public Hypixel API source, and the existing SkyShards, SkyCrypt, SkyOcean, and MCHeads credits.
- No separate Credits page or new navigation item is added.

## First-Visit Notice

- On a browser's first Skydex visit, a compact bottom notice repeats the Wiki and API attribution and links to the Wiki and licence.
- The notice is informational, not a cookie-consent prompt. It never reads or writes `document.cookie` and sends no request when dismissed.
- Dismissal writes only a versioned local flag, `skydex.attribution-notice.v1`, to `localStorage` on that device.
- If browser storage is unavailable, dismissal lasts for the current page only and the notice may return on the next visit.
- The permanent Project Credits disclosure remains available after dismissal.

## Toast Fit

- The notification stack remains fixed at `top-3 right-3` and remains portalled above modal glass at `z-[100]`.
- Its normal maximum width remains 380px.
- On viewports wide enough to place a useful toast in the right gutter beside the Designer's `max-w-6xl` modal, CSS limits the stack to that gutter. This clears the modal's close control without changing the toast's corner.
- On smaller viewports, the existing responsive width remains so notification text does not become unreadably narrow.

## Verification

- Regression tests pin the visible disclaimer, disclosure marker and credits, versioned local-only dismissal, no cookie access, and top-right/gutter-aware toast classes.
- Focused tests run red before implementation and green afterward.
- The full site test suite, targeted lint, production build, and browser checks cover the footer, first-visit notice, dismissed state, and toast over the Load Layout modal.

## Excluded

- Unrelated Shards or companion-mod UI work.
- Analytics, cookies, server persistence, accounts, or any new external request.
- Moving the toast to another corner or changing notification content.
