/**
 * One normal form, used by every part of the search.
 *
 * Lowercase, and every run of anything that is not a letter or a digit becomes
 * a single space. That is what makes "Cocoa Beans", "cocoa_beans" and
 * "COCOA-BEANS" the same string, which matters because the three data sources
 * spell the same thing three ways: the crafting index uses display names, the
 * greenhouse dataset uses snake_case ids, the shard table uses Title Case.
 *
 * Apostrophes are deleted rather than turned into a space, which is the one
 * place the general rule gives the wrong answer. "Necron's Handle" has to
 * normalise to "necrons handle", because that is what a person types when they
 * do not bother with the apostrophe, and it is the only way that query can
 * reach the item. Turning it into a space would give "necron s handle" and the
 * search would silently miss.
 *
 * Kept in its own file with no imports so the pure search core and the React
 * layer can share it without either one dragging the other in.
 */
export const normalise = (s: string): string =>
  s
    .toLowerCase()
    .replace(/['’ʼ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * A typed query turned into something a wiki title could plausibly be.
 *
 * Only used for the fallback wiki row, and only when nothing in the index
 * matched, so it is allowed to be a guess. Title case per word, because that is
 * how MediaWiki titles on this wiki are written.
 */
export const titleCase = (s: string): string =>
  s
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
