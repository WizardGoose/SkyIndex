/**
 * Bundled crop art, addressed so it resolves under any deploy base.
 *
 * `getCropImagePath` in `types/greenhouse.ts` returns a root-absolute
 * "/greenhouse/crops/<id>.png". That only resolves when the site is served
 * from the domain root. The GitHub Pages build sets Vite's base to
 * "/Skydex/", so on the deployed site every one of those paths 404s and
 * every crop and mutation icon collapses to its initials fallback. That is the
 * "planner mutations have no icons" symptom. The rest of the app already
 * prefixes `BASE_URL` by hand for its shard icons; this does the same for crop
 * art, which is why it is a fix rather than a workaround.
 *
 * Handed to `ItemIcon` as its `src`, this is belt and braces: local art first,
 * the wiki image second, initials only if both miss.
 */
export const cropIconSrc = (id: string): string => `${import.meta.env.BASE_URL}greenhouse/crops/${id}.png`;
