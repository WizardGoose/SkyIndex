/**
 * The word banks.
 *
 * Banks own nouns and verbs. They do not own grammar: nothing in this file
 * knows what sentence it will end up in, and no entry carries punctuation, an
 * article or a plural. That division is the whole trick behind the module, and
 * it is what makes every generated string grammatical by construction rather
 * than grammatical by luck. See `patterns.ts` for the other half.
 *
 * RULES EVERY ENTRY OBEYS, AND THE TESTS PIN
 * ------------------------------------------
 *   - No leading or trailing space, and no double space inside.
 *   - No punctuation of any kind, and in particular no dash of any width.
 *   - Activities are gerunds, so they fit every frame that takes one without
 *     conjugation: "What are we X today?", "Time to stop X?", "Still X?".
 *   - Moods are sentence openers that already carry their own capital, so no
 *     pattern ever has to capitalise a slot at runtime.
 *
 * WHAT IS NOT IN HERE
 * -------------------
 * Item names. There are roughly 2,900 of them and they are the reason this
 * module produces more sentences than a person will ever see, but they are
 * fetched at runtime from the wiki and from Hypixel and are deliberately not
 * bundled with this app (see `items/wikiCrafting.ts` for why that matters).
 * They arrive as an argument instead. When they have not arrived, the patterns
 * that need them are simply not used, which is why there is no hardcoded
 * stand-in list here pretending to be the index.
 */

/**
 * What a person does in this game, as gerunds.
 *
 * Chosen for being what players actually say rather than what a menu would
 * say: nobody "cultivates", they grow, and nobody "acquires", they hoard. Each
 * one has to survive all three activity frames, which is why there is no
 * "afk" (a fine word, but "Time to stop afk?" is not a sentence).
 */
export const ACTIVITIES: readonly string[] = [
  "grinding",
  "growing",
  "smashing",
  "fusing",
  "hoarding",
  "counting",
  "farming",
  "stacking",
  "sorting",
  "chasing",
  "planning",
  "crafting",
  "collecting",
  "min-maxing",
  "tracking",
  "buying",
  "selling",
  "brewing",
  "digging",
  "restocking",
];

/**
 * Sentence openers that take a gerund.
 *
 * Small on purpose. Every candidate had to read as something one person would
 * actually say to another mid grind, which ruled out most of them: "Merrily"
 * and "Once more unto" are exactly the forced whimsy this project does not do.
 */
export const MOODS: readonly string[] = ["Still", "Back to", "Done", "Straight back to", "Halfway through"];

/**
 * Quantities, as the numbers this game actually deals in.
 *
 * Two families, and nothing outside them. Powers of two up from a stack of 64,
 * because that is how storage counts, and multiples of 160 because that is how
 * many of a thing one enchanted version costs, which makes 25,600 the price of
 * an enchanted enchanted one. Nothing here is a round decimal number: 50,000 is
 * what a person inventing a quantity picks, and it reads as invented.
 */
export const QUANTITIES: readonly number[] = [
  16, 32, 64, 128, 160, 256, 320, 512, 640, 1024, 1280, 2048, 2560, 4096, 5120, 8192, 16384, 25600, 51200, 102400,
];

/**
 * A number with thousands separators, without `toLocaleString`.
 *
 * `toLocaleString` would make the output depend on the machine's locale, and a
 * seeded generator whose result changes between two computers is not seeded.
 */
export const groupDigits = (n: number): string => {
  const s = String(Math.trunc(Math.abs(n)));
  let out = "";
  for (let i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 === 0) out += ",";
    out += s[i];
  }
  return n < 0 ? `-${out}` : out;
};

/** `QUANTITIES` as the strings a pattern will actually splice in. */
export const QUANTITY_WORDS: readonly string[] = QUANTITIES.map(groupDigits);

/**
 * The long dashes, by code point, so that this file contains no literal one.
 *
 * 0x2010 to 0x2015 is the dash block (hyphen, non-breaking hyphen, figure,
 * en, em, horizontal bar) and 0x2212 is the minus sign, which a paste from a
 * spreadsheet can drag in. A plain ASCII hyphen at 0x2D is a different
 * character and is allowed: it is what "min-maxing" is spelled with.
 */
const DASH_CODES = new Set([0x2010, 0x2011, 0x2012, 0x2013, 0x2014, 0x2015, 0x2212]);

export const hasLongDash = (s: string): boolean => {
  for (let i = 0; i < s.length; i++) if (DASH_CODES.has(s.charCodeAt(i))) return true;
  return false;
};

/**
 * Which names from the live index are allowed to be spliced into a sentence.
 *
 * The index is built for searching, so it holds things that are perfectly good
 * search targets and poor sentence subjects: `Gill Membrane, 64` carries its
 * own quantity, `Inferno Minion Fuel (Crude Gabagool Legendary)` carries a
 * parenthetical, and `2 IQ Points` starts with a digit, which collides with
 * the patterns that put a quantity in front of the name.
 *
 * A spaced hyphen goes too. `Perfect Chestplate - Tier XI` is the wiki's way of
 * writing a dash, and while an ASCII hyphen is not an em dash and does not
 * break the project's rule on the letter, dropping a dash-by-function into the
 * middle of a generated question breaks it on the spirit. "Back to the Perfect
 * Chestplate - Tier XI mines?" is the sentence that made the case. A hyphen
 * inside a word, as in "Anti-Healing Potion", is ordinary spelling and stays.
 *
 * Rejecting all of this costs about 270 of the roughly 2,400 names the live
 * index holds, and buys the guarantee that every sentence reads as a sentence.
 * That trade is the right way round: variety is not scarce here and quality is.
 */
export const isUsableName = (name: string): boolean => {
  if (typeof name !== "string") return false;
  const t = name.trim();
  if (t.length < 3 || t.length > 44) return false;
  if (t !== name) return false;
  if (/[(),:;"/\\[\]{}|]/.test(t)) return false;
  if (hasLongDash(t)) return false;
  if (/\s-|-\s/.test(t)) return false;
  if (/^\d/.test(t)) return false;
  if (/\s{2}/.test(t)) return false;
  return /^[A-Za-z]/.test(t);
};

/** The live index's names, filtered and deduped, order preserved. */
export const usableNames = (names: Iterable<string>): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const n of names) {
    if (!isUsableName(n) || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
};
