/**
 * Reading the part of a wiki article that is about getting the item.
 *
 * This lives in its own module because two callers need it and they must not
 * need each other: `sources.ts` classifies that region into a source category,
 * and `locations.ts` reads the merchants and zones named inside it. Leaving it
 * in `sources.ts` would have made the two import each other in a cycle.
 */

/** Infobox fields an editor records a source in. Measured against live articles. */
const SOURCE_FIELDS = [
  "obtain",
  "obtaining",
  "obtained",
  "source",
  "sources",
  "availability",
  "acquisition",
  "merchant",
] as const;

/** Section headings that introduce a source. */
const SOURCE_HEADING = /^(?:how\s+to\s+)?(?:obtain(?:ing|ment|ed)?|acquisition|sources?|drops?)$/i;

/**
 * Cut an article down to the part that talks about obtaining the item.
 *
 * A full wiki article mentions half the game. Classifying against all of it
 * would let a passing reference in a trivia section decide the answer, so the
 * search is restricted to the places an editor actually records a source: the
 * infobox, and any section whose heading is about obtaining.
 *
 * Returning the whole text when no such region is found is deliberate. It is
 * the difference between "we looked in the right place and found nothing",
 * which should fall through to `wiki`, and "this article is not laid out the
 * way we expected", where a broader look is better than giving up. Either way
 * a miss still ends at `wiki`.
 */
export const obtainRegion = (wikitext: string): string => {
  const parts: string[] = [];

  for (const key of SOURCE_FIELDS) {
    const m = wikitext.match(new RegExp(`\\|\\s*${key}\\s*=\\s*([^\\n|}]+)`, "i"));
    if (m) parts.push(m[1]);
  }

  /*
   * Sections are read with their SUBSECTIONS INCLUDED, and that is the whole
   * subtlety of this function.
   *
   * A real accessory article is laid out like this:
   *
   *   == Obtaining ==
   *   === Shop Purchase ===
   *   '''Junk Talisman''' can be purchased from Junker Joel.
   *
   * The body of `== Obtaining ==` is therefore EMPTY: the next thing after it
   * is another heading. An extractor that stops at the next heading of any
   * level reads that empty string, finds nothing in it, and reports the item as
   * unclassifiable while the answer sits one line below. Measured against the
   * live wiki this was the single biggest cause of "See wiki": the section was
   * being found and then read as blank.
   *
   * So a matching section runs until the next heading of the SAME OR HIGHER
   * level (that is, with the same number of equals signs or fewer), which is
   * what makes a subsection part of its parent rather than a sibling.
   *
   * A second bug lived here too and is worth recording so it does not come
   * back: an earlier version ended its capture with a `(?=^={2,}|\Z)`
   * lookahead, and `\Z` is not a JavaScript anchor. JavaScript reads it as an
   * escaped literal Z, so any section running to the end of the article never
   * matched at all.
   */
  const headings = [...wikitext.matchAll(/^(={2,})\s*([^=\n]+?)\s*=+[ \t]*$/gm)];

  for (let h = 0; h < headings.length; h++) {
    const level = headings[h][1].length;
    if (!SOURCE_HEADING.test(headings[h][2].trim())) continue;

    const from = headings[h].index + headings[h][0].length;
    let to = wikitext.length;
    for (let n = h + 1; n < headings.length; n++) {
      if (headings[n][1].length <= level) {
        to = headings[n].index;
        break;
      }
    }
    parts.push(wikitext.slice(from, to));
  }

  return parts.length > 0 ? parts.join("\n") : wikitext;
};
