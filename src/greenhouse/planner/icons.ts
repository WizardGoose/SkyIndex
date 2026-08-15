/**
 * Bundled crop art, addressed so it resolves under any deploy base.
 *
 * `BASE_URL` is used consistently with the rest of the app's public assets,
 * keeping crop art correct from the canonical domain root.
 *
 * Handed to `ItemIcon` as its `src`, this is belt and braces: local art first,
 * the wiki image second, initials only if both miss.
 */
export const cropIconSrc = (id: string): string => `${import.meta.env.BASE_URL}greenhouse/crops/${id}.png`;
