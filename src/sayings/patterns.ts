import { ACTIVITIES, MOODS, QUANTITY_WORDS } from "./banks";

/**
 * The sentence templates.
 *
 * Patterns own the grammar. A pattern is not a format string and there is no
 * interpolation anywhere in this module: it is an array of literal fragments
 * and slot markers, joined end to end. That is what makes the output
 * grammatical by construction, because the only thing a slot can do is put one
 * bank entry between two fixed pieces of English, and every bank entry was
 * chosen to fit the frames it appears in.
 *
 * THE THREE RULES THAT KEEP IT GRAMMATICAL
 * ----------------------------------------
 *   1. No indefinite article ever precedes a slot. "a {thing}" would produce
 *      "a Enchanted Diamond" for a third of the index and there is no cheap
 *      way to be right about it, so the construction is simply not available.
 *      The definite article is fine and is used, because "the" agrees with
 *      everything. A test asserts no pattern breaks this.
 *   2. Nothing is ever pluralised. Item names are proper nouns with irregular
 *      plurals ("Enchanted Lapis") and guessing at them is how a generator
 *      starts sounding like a generator. Where a count is wanted, the patterns
 *      use the notation the game itself uses, `Foul Flesh x512`, which is a
 *      count and not a plural.
 *   3. Every fragment carries its own spacing and its own punctuation, so
 *      joining is a plain concatenation with no clean-up pass afterwards. A
 *      test asserts no output ever has a double space or a space before a
 *      question mark.
 *
 * WHAT WAS THROWN OUT
 * -------------------
 * "The index awaits. {thing}?" was in the brief and is not here. It reads as a
 * narrator rather than as the person who built the site, and this project's
 * standing rule is that a line which makes you wince once will make you wince
 * every time. "How many {thing} left?" went for rule 2. "Which {thing} this
 * time?" went because it only works when the name is a category and most of
 * them are not.
 */

export type SlotKind = "thing" | "activity" | "qty" | "mood";

export interface Slot {
  kind: SlotKind;
}

/** A literal fragment of English, or a hole to put a bank entry in. */
export type Part = string | Slot;

export interface Pattern {
  /** Stable name, used by the tests and by nothing else. */
  id: string;
  /** Relative likelihood against every other usable pattern. */
  weight: number;
  parts: readonly Part[];
}

const THING: Slot = { kind: "thing" };
const ACT: Slot = { kind: "activity" };
const QTY: Slot = { kind: "qty" };
const MOOD: Slot = { kind: "mood" };

export const isSlot = (p: Part): p is Slot => typeof p !== "string";

/**
 * The banks, by slot kind. `thing` is absent because it is the one bank that
 * is not a constant: it comes from the live search index and is passed in.
 */
export const FIXED_BANKS: Record<Exclude<SlotKind, "thing">, readonly string[]> = {
  activity: ACTIVITIES,
  qty: QUANTITY_WORDS,
  mood: MOODS,
};

/**
 * How long a saying is allowed to be.
 *
 * The field is `max-w-[34rem]`, which is 544px, less 44px of left padding for
 * the search glyph and 16px on the right, so 484px of room at 15px. Sixty
 * characters of mixed-case text lands comfortably inside that on the narrowest
 * font stack the site can fall back to. A placeholder that gets clipped by the
 * input is worse than a plain one, so the budget is enforced rather than
 * hoped for: names too long for a given pattern are not eligible for it, which
 * is also what makes the combination count exactly computable.
 */
export const MAX_LENGTH = 58;

/**
 * Pattern one, kept first and kept heavier than the rest.
 *
 * This is the line the site shipped with and the voice everything else here is
 * an extension of. It carries four times the weight of any single other
 * pattern, which puts it on screen about one visit in six: often enough to
 * stay the house line, rarely enough that the rest of the module is not
 * decoration.
 */
export const PATTERNS: readonly Pattern[] = [
  { id: "house", weight: 4, parts: ["What are we grinding?"] },

  { id: "activity-today", weight: 1, parts: ["What are we ", ACT, " today?"] },
  { id: "mood-activity", weight: 1, parts: [MOOD, " ", ACT, "?"] },
  { id: "stop-activity", weight: 1, parts: ["Time to stop ", ACT, "?"] },
  { id: "still-activity", weight: 1, parts: ["Are we still ", ACT, "?"] },

  { id: "bare", weight: 1, parts: [THING, "?"] },
  { id: "looking-for", weight: 1, parts: ["Looking for ", THING, "?"] },
  { id: "mines", weight: 1, parts: ["Back to the ", THING, " mines?"] },
  { id: "need", weight: 1, parts: ["Need ", THING, "?"] },
  { id: "where-from", weight: 1, parts: ["Where does ", THING, " come from?"] },
  { id: "cost", weight: 1, parts: ["What does ", THING, " cost?"] },
  { id: "start-with", weight: 1, parts: ["Start with ", THING, "?"] },
  { id: "last-one", weight: 1, parts: ["Down to the last ", THING, "?"] },
  { id: "everything-on", weight: 1, parts: ["Everything on ", THING, "?"] },
  { id: "chasing", weight: 1, parts: ["Chasing ", THING, "?"] },
  { id: "find", weight: 1, parts: ["Find ", THING, "."] },
  { id: "first", weight: 1, parts: [THING, " first?"] },
  { id: "anything-about", weight: 1, parts: ["Anything to do with ", THING, "?"] },
  { id: "again", weight: 1, parts: [THING, " again?"] },

  { id: "count-suffix", weight: 1, parts: [THING, " x", QTY, "?"] },
  { id: "count-to-go", weight: 1, parts: [QTY, "x ", THING, " to go?"] },
  { id: "count-left", weight: 1, parts: [QTY, "x ", THING, " left?"] },

  /* The only pattern with two variable nouns, and the reason the total is
     measured in millions rather than thousands. It earns its place by being
     the question a person genuinely asks themselves in front of this field. */
  { id: "or", weight: 1, parts: [THING, ", or ", THING, "?"] },
];
