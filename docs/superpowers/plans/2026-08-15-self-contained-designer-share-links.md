# Self-contained Designer Share Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate one queryless Skydex share URL whose opaque payload freezes the layout name and mutation placements, and add the same Share action to Most Recent and every named saved-layout card.

**Architecture:** Keep the existing v1 grid codec unchanged for local layout identity and legacy links. Add a v2 share envelope around that grid text before raw-deflate/base64url transport, then teach both the browser and stateless Cloudflare Worker to decode either version. Route all page and loadout-card sharing through one browser helper so the clipboard behavior and naming rules cannot drift.

**Tech Stack:** React 19, TypeScript 5.8, Vitest 4, pako raw deflate, Cloudflare Workers Browser Run, lucide-react.

## Global Constraints

- New URLs are exactly `https://skydex.ca/greenhouse/share/<payload>` with no generated query string.
- Freeze a user-set name when present; otherwise freeze Skydex's generated layout nickname.
- `Most Recent` remains the UI role label; its shared layout name is the generated nickname inside the parentheses.
- Existing v1 payloads, fragment links, legacy SkyShards links, bare codes, and existing `?name=` links keep working.
- A v2 embedded name takes precedence over legacy query parameters.
- No KV, D1, R2, server cache write, analytics, application logging, dependency, or server-side lookup is added.
- Sharing from the Load layout modal must not load a layout, close the modal, rename anything, delete anything, or change the active design.
- Do not refactor unrelated Designer, storage, or preview behaviour.
- Work only in `E:/Storage/Projects/Skydex/.worktrees/skydex-ca-domain`; do not modify the WIP checkout.
- Do not deploy the Worker or push Git history without a separate explicit release approval.

---

## File structure

- Modify `src/greenhouse/utilities/designEncoding.ts`: normalize frozen names, encode v2 shares, decode v1/v2, and build queryless canonical links.
- Modify `src/greenhouse/utilities/__tests__/designEncoding.test.ts`: browser codec, normalization, URL, rejection, and compatibility coverage.
- Modify `cloudflare/layout-embed-worker.js`: decode the v2 envelope and use its name in share HTML, oEmbed, and preview rendering.
- Modify `src/site/__tests__/layoutEmbedWorker.test.ts`: cross-runtime v2 fixture and legacy fallback coverage.
- Modify `src/greenhouse/components/designer/DesignerActions.tsx`: one clipboard helper used by the main Share action and loadout cards.
- Modify `src/greenhouse/components/designer/LoadLayoutModal.tsx`: add the card-level Share control and expose a pure action-button component for interaction testing.
- Create `src/greenhouse/components/designer/__tests__/layoutShareActions.test.ts`: Share-button presence and callback-isolation coverage.

---

### Task 1: Add the versioned browser share codec

**Files:**
- Modify: `src/greenhouse/utilities/designEncoding.ts`
- Test: `src/greenhouse/utilities/__tests__/designEncoding.test.ts`

**Interfaces:**
- Produces: `normalizeSharedLayoutName(value: string): string`
- Produces: `encodeSharedDesign(inputs, targets, displayName): string`
- Extends: `decodeDesign(code)` return value with `name?: string`
- Preserves: `encodeDesign(inputs, targets): string` as the unchanged v1/local-identity encoder
- Preserves: `buildShareUrl(code, origin, base): string`, now always queryless

- [ ] **Step 1: Write failing v2 round-trip and normalization tests**

Add tests that call the wished-for API before it exists:

```ts
it("freezes the normalized display name inside a v2 share payload", () => {
  const code = encodeSharedDesign(inputs, targets, "  Wizard\u0007 | Waterworks  ");
  const decoded = decodeDesign(code);

  expect(decoded.name).toBe("Wizard | Waterworks");
  expect(asSet(decoded.inputs)).toStrictEqual(asSet(inputs));
  expect(asSet(decoded.targets)).toStrictEqual(asSet(targets));
});

it("round-trips Unicode and percent signs in a frozen name", () => {
  expect(decodeDesign(encodeSharedDesign(inputs, targets, "Café 100% 水")).name)
    .toBe("Café 100% 水");
});

it("rejects an empty frozen name", () => {
  expect(() => encodeSharedDesign(inputs, targets, " \u0007 ")).toThrow(/name/i);
});
```

- [ ] **Step 2: Run the codec tests and verify RED**

Run:

```powershell
pnpm test -- src/greenhouse/utilities/__tests__/designEncoding.test.ts
```

Expected: FAIL because `encodeSharedDesign` is not exported and `decodeDesign` does not return `name`.

- [ ] **Step 3: Implement the minimal v2 envelope**

Keep `encodeDesign` unchanged. Add normalization and an envelope parser around the existing grid string:

```ts
export function normalizeSharedLayoutName(value: string): string {
  const normalized = Array.from(value, (character) => {
    const point = character.codePointAt(0) ?? 0;
    return point < 32 || point === 127 ? " " : character;
  })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
  return Array.from(normalized).slice(0, 80).join("");
}

export function encodeSharedDesign(
  inputs: Array<{ cropId: string; position: [number, number] }>,
  targets: Array<{ cropId: string; position: [number, number] }>,
  displayName: string,
): string {
  const name = normalizeSharedLayoutName(displayName);
  if (!name) throw new Error("Enter a layout name before sharing.");
  const grid = encodeGridString(groupPlacements(inputs), groupPlacements(targets));
  return toUrlSafeBase64(deflateRaw(`v2|${encodeURIComponent(name)}|${grid}`, { level: 9 }));
}
```

Before `decodeGridString`, detect `v2|`, require exactly five pipe-separated parts, safely call `decodeURIComponent`, require the decoded name to equal its normalized form, and pass the remaining three parts to the unchanged grid decoder. Return `{ inputs, targets, name }` for v2 and omit `name` for v1.

- [ ] **Step 4: Write failing queryless URL and legacy tests**

Replace the old `?name=` generation expectation and add compatibility assertions:

```ts
it("builds a queryless canonical URL for a named v2 payload", () => {
  const code = encodeSharedDesign(inputs, targets, "My Gloom Garden");
  expect(buildShareUrl(code, "https://skydex.ca", "/")).toBe(
    `https://skydex.ca/greenhouse/share/${code}`,
  );
  expect(new URL(buildShareUrl(code, "https://skydex.ca", "/")).search).toBe("");
});

it("continues to decode the frozen v1 fixture", () => {
  expect(decodeDesign("y9YxqTE0qdEjHiQ6JmGwiAIA").name).toBeUndefined();
});
```

Add rejection fixtures for invalid percent escapes, an empty v2 name, non-canonical whitespace, and oversized inflated output.

- [ ] **Step 5: Run codec tests and verify GREEN**

Run the focused test command from Step 2.

Expected: all codec tests PASS, including unchanged v1 rejection and paste-repair coverage.

- [ ] **Step 6: Commit only the codec task**

```powershell
git add -- src/greenhouse/utilities/designEncoding.ts src/greenhouse/utilities/__tests__/designEncoding.test.ts
git commit -m "feat: encode names in designer share payloads"
```

---

### Task 2: Keep Cloudflare previews in parity with the browser

**Files:**
- Modify: `cloudflare/layout-embed-worker.js`
- Test: `src/site/__tests__/layoutEmbedWorker.test.ts`

**Interfaces:**
- Consumes: the v2 `v2|<encoded-name>|<v1-grid>` payload produced by `encodeSharedDesign`
- Extends: `decodeSharedLayout(code)` with `name?: string`
- Preserves: existing `requestedName` arguments only as a v1 legacy fallback

- [ ] **Step 1: Write a failing cross-runtime v2 test**

Import `encodeSharedDesign` into the Worker test and create the fixture with real browser production code:

```ts
const namedCode = encodeSharedDesign(SOGGY_INPUTS, SOGGY_TARGETS, "Wizard's | Waterworks");
const decoded = await decodeSharedLayout(namedCode);

expect(decoded.name).toBe("Wizard's | Waterworks");
expect(decoded.inputs).toEqual(SOGGY_INPUTS);
expect(decoded.targets).toEqual(SOGGY_TARGETS);
```

Add assertions that share HTML, oEmbed, and preview HTML use `Wizard's | Waterworks`, that their URLs contain no `?name=`, and that passing a conflicting requested name cannot override the embedded v2 name.

- [ ] **Step 2: Run the Worker tests and verify RED**

Run:

```powershell
pnpm test -- src/site/__tests__/layoutEmbedWorker.test.ts
```

Expected: FAIL because the Worker currently requires exactly three inflated parts and reads names from the query.

- [ ] **Step 3: Implement Worker v1/v2 parsing and precedence**

After bounded inflate, parse the envelope using the same rules as the browser. Return the optional embedded name. Resolve display names in this order:

```js
const displayName = layout.name ?? normalizeSharedName(requestedName) ?? summary.name;
```

Only append `name` to preview/oEmbed URLs when handling a v1 payload with a legacy requested name. A v2 document emits queryless canonical, preview, and oEmbed URLs.

- [ ] **Step 4: Verify Worker tests GREEN and keep logo coverage**

Run the focused Worker test command again.

Expected: all Worker tests PASS, including the canonical Montserrat diagonal wordmark checks.

- [ ] **Step 5: Commit only the Worker parity task**

```powershell
git add -- cloudflare/layout-embed-worker.js src/site/__tests__/layoutEmbedWorker.test.ts
git commit -m "feat: decode named designer shares at the edge"
```

---

### Task 3: Share the current design and every loadout card

**Files:**
- Modify: `src/greenhouse/components/designer/DesignerActions.tsx`
- Modify: `src/greenhouse/components/designer/LoadLayoutModal.tsx`
- Create: `src/greenhouse/components/designer/__tests__/layoutShareActions.test.ts`

**Interfaces:**
- Consumes: `encodeSharedDesign`, `buildShareUrl`, and `mostRecentLayoutNickname`
- Adds: `LoadLayoutModalProps.onShare(layout: SavedLayout, displayName: string): void`
- Adds: `LayoutCardActionButtons({ onLoad, onShare, onDelete? })`

- [ ] **Step 1: Write failing action-button tests**

Export the wished-for pure action group from the modal and test its two callback routes without a browser dependency:

```tsx
it("offers separate Load and Share actions", () => {
  const markup = renderToStaticMarkup(
    <LayoutCardActionButtons onLoad={() => undefined} onShare={() => undefined} />,
  );
  expect(markup).toContain("Load layout");
  expect(markup).toContain("Share layout");
});

it("routes Share without invoking Load", () => {
  const onLoad = vi.fn();
  const onShare = vi.fn();
  const element = LayoutCardActionButtons({ onLoad, onShare });
  const buttons = React.Children.toArray(element.props.children);
  const share = buttons.find((child) =>
    React.isValidElement<{ "aria-label"?: string }>(child) && child.props["aria-label"] === "Share layout",
  );
  expect(React.isValidElement<{ onClick: () => void }>(share)).toBe(true);
  if (React.isValidElement<{ onClick: () => void }>(share)) share.props.onClick();
  expect(onShare).toHaveBeenCalledOnce();
  expect(onLoad).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the action tests and verify RED**

Run:

```powershell
pnpm test -- src/greenhouse/components/designer/__tests__/layoutShareActions.test.ts
```

Expected: FAIL because `LayoutCardActionButtons` and the `onShare` prop do not exist.

- [ ] **Step 3: Add Share beside Load on every card**

Extract the existing footer buttons into `LayoutCardActionButtons`, import `Share2`, and render Share beside Load. Pass the exact sharing name separately from the UI role label:

```tsx
<LayoutCard
  layout={mostRecentLayout}
  displayName={`Most Recent (${nickname})`}
  onShare={() => onShare(mostRecentLayout, nickname)}
  onLoad={onLoadMostRecent}
  isMostRecent
/>
```

Named saved cards pass `layout.name` as both their visible layout name and frozen share name. The Share handler does not call `onClose` or `onLoad`.

- [ ] **Step 4: Route both sharing entry points through one callback**

In `DesignerActions`, add one async callback that encodes and copies a specific layout/name pair:

```ts
const copyLayoutShareLink = useCallback(async (
  layout: Pick<SavedLayout, "inputs" | "targets">,
  displayName: string,
) => {
  const code = encodeSharedDesign(layout.inputs, layout.targets, displayName);
  const url = buildShareUrl(code, window.location.origin, import.meta.env.BASE_URL);
  await navigator.clipboard.writeText(url);
  toast({ title: "Share link copied!", description: "Paste this link in Discord or share with others", variant: "success", duration: 3000 });
}, [toast]);
```

The main Share action finds an exact matching saved layout name; if none matches, use `mostRecentLayoutNickname({ inputs, targets })`. Pass `copyLayoutShareLink` to `LoadLayoutModal.onShare`. Catch rejected clipboard promises and preserve the existing error toast.

- [ ] **Step 5: Run the action and codec tests GREEN**

Run:

```powershell
pnpm test -- src/greenhouse/components/designer/__tests__/layoutShareActions.test.ts src/greenhouse/utilities/__tests__/designEncoding.test.ts
```

Expected: both files PASS; Share is present for the common card footer and callback isolation is proven.

- [ ] **Step 6: Commit only the UI sharing task**

```powershell
git add -- src/greenhouse/components/designer/DesignerActions.tsx src/greenhouse/components/designer/LoadLayoutModal.tsx src/greenhouse/components/designer/__tests__/layoutShareActions.test.ts
git commit -m "feat: share saved designer loadouts"
```

---

### Task 4: Integration and release-gate verification

**Files:**
- Verify only; modify the preceding task files only if a scoped failure proves they are incorrect.

**Interfaces:**
- Consumes: the complete browser, UI, and Worker implementation from Tasks 1-3
- Produces: local evidence suitable for a separate deployment/publish approval

- [ ] **Step 1: Run the complete focused sharing suite**

```powershell
pnpm test -- src/greenhouse/utilities/__tests__/designEncoding.test.ts src/site/__tests__/layoutEmbedWorker.test.ts src/greenhouse/components/designer/__tests__/layoutShareActions.test.ts src/greenhouse/__tests__/designerRoute.test.ts
```

Expected: all focused tests PASS.

- [ ] **Step 2: Run the full repository suite**

```powershell
pnpm test
```

Expected: every test file and test PASS.

- [ ] **Step 3: Build the production site**

```powershell
pnpm run build
```

Expected: TypeScript and Vite production build PASS.

- [ ] **Step 4: Run changed-source lint and diff integrity**

Run ESLint only on changed TypeScript/TSX files, then:

```powershell
git diff --check
git status --short --branch
```

Expected: no changed-source lint errors, no whitespace errors, no staged files, and no changes in the WIP checkout.

- [ ] **Step 5: Inspect a generated v2 URL without publishing it**

Use a test fixture or local script to confirm the generated URL has exactly one `/share/<payload>` path, an empty query string, the frozen name on decode, and the expected inputs/targets. Do not send the link to Discord yet because the production Worker still runs the prior decoder.

- [ ] **Step 6: Review the final diff against the scope fence**

Confirm the diff contains only codec, Worker parity, card Share controls, required tests, and the approved documents. Remove any unrelated behaviour before handoff.

- [ ] **Step 7: Stop at the production boundary**

Report local evidence and request explicit approval before Worker deployment, Discord production testing, Git history cleanup/squashing, or pushing `skydex/master`.
