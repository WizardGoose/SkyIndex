import { usableNames } from "./banks";
import { FIXED_BANKS, MAX_LENGTH, PATTERNS, isSlot } from "./patterns";
import type { Pattern, Slot } from "./patterns";
import { makeRng, randInt } from "./prng";

/**
 * Pattern templates crossed with word banks, seeded.
 *
 * The module is pure. `prepareSayings` turns a list of names into an immutable
 * deck, `pickSaying` turns a deck and a seed into one sentence, and neither
 * touches the DOM, the clock, storage or `Math.random`. The only thing that is
 * not deterministic is the seed itself, which the page supplies from the visit
 * and the focus count, and which is the single place chance is allowed in.
 *
 * WHY A DECK RATHER THAN A FUNCTION OF THE NAMES
 * ----------------------------------------------
 * Two of the guarantees cost work that should not be repeated per sentence.
 * A pattern can only be used if every one of its slots has something to put in
 * it, and a name can only be used in a pattern if the finished sentence still
 * fits the field. Both are decided once, when the index lands, and then a draw
 * is a couple of array reads. It also means the combination count is a
 * property of the prepared deck rather than an estimate: the eligible sets are
 * the sets, so multiplying their sizes is the answer and not an approximation
 * of it.
 */

export interface PreparedPattern {
  pattern: Pattern;
  /** Names short enough that this pattern's output still fits the field. */
  things: readonly string[];
  /** How many `thing` slots this pattern has. Zero, one, or two. */
  thingSlots: number;
  /** Distinct sentences this pattern alone can produce. */
  combinations: number;
}

export interface SayingDeck {
  usable: readonly PreparedPattern[];
  /** Running weight totals, for one draw instead of a scan. */
  cumulative: readonly number[];
  totalWeight: number;
  /** Distinct sentences the whole deck can produce. */
  combinations: number;
  /** Names that survived filtering, before any per-pattern length budget. */
  nameCount: number;
}

/** Longest entry in a fixed bank, used to reserve room for it in the budget. */
const widest = (bank: readonly string[]): number => bank.reduce((n, s) => Math.max(n, s.length), 0);

/**
 * How many characters a `thing` may spend in this pattern.
 *
 * The literal fragments are known, and the fixed banks are reserved at their
 * widest entry rather than their average, so the budget holds for every draw
 * and not merely for most of them. When a pattern has two `thing` slots the
 * remainder is split evenly between them. That is slightly stingier than
 * checking the pair's combined length would be, and it is what makes the count
 * a clean product of two independent sets instead of a count over pairs.
 */
const thingBudget = (pattern: Pattern): number => {
  let literal = 0;
  let reserved = 0;
  let thingSlots = 0;

  for (const part of pattern.parts) {
    if (!isSlot(part)) {
      literal += part.length;
    } else if (part.kind === "thing") {
      thingSlots += 1;
    } else {
      reserved += widest(FIXED_BANKS[part.kind]);
    }
  }

  if (thingSlots === 0) return 0;
  return Math.floor((MAX_LENGTH - literal - reserved) / thingSlots);
};

/**
 * Build the deck.
 *
 * `names` is whatever the live search index is holding: item names, mutation
 * names and shard names, in whatever order they arrive. Passing an empty list
 * is a supported state and not a degraded one. It is what the first paint of a
 * cold visit looks like, and it leaves the five patterns that need no index at
 * all, so the field still has a real question in it while the fetches land.
 */
export const prepareSayings = (names: Iterable<string> = []): SayingDeck => {
  const pool = usableNames(names);

  const usable: PreparedPattern[] = [];
  const cumulative: number[] = [];
  let totalWeight = 0;
  let combinations = 0;

  for (const pattern of PATTERNS) {
    const thingSlots = pattern.parts.filter((p) => isSlot(p) && p.kind === "thing").length;
    const things = thingSlots > 0 ? pool.filter((n) => n.length <= thingBudget(pattern)) : [];

    /* A pattern with more `thing` slots than eligible names would have to
       repeat a name inside one sentence, so it is dropped rather than allowed
       to produce "Foul Flesh, or Foul Flesh?". */
    if (thingSlots > things.length) continue;

    let count = 1;
    for (let i = 0; i < thingSlots; i++) count *= things.length - i;
    for (const part of pattern.parts) {
      if (isSlot(part) && part.kind !== "thing") count *= FIXED_BANKS[part.kind].length;
    }
    if (count <= 0) continue;

    usable.push({ pattern, things, thingSlots, combinations: count });
    totalWeight += pattern.weight;
    cumulative.push(totalWeight);
    combinations += count;
  }

  return { usable, cumulative, totalWeight, combinations, nameCount: pool.length };
};

/** The prepared pattern a draw lands on, by weight. */
const choosePattern = (deck: SayingDeck, rng: () => number): PreparedPattern | null => {
  if (deck.usable.length === 0) return null;

  const roll = rng() * deck.totalWeight;
  for (let i = 0; i < deck.cumulative.length; i++) {
    if (roll < deck.cumulative[i]) return deck.usable[i];
  }
  return deck.usable[deck.usable.length - 1];
};

/**
 * One name, never one already used in this sentence.
 *
 * The draw is over the unused names rather than over all of them with a
 * retry, so it terminates in one step and stays uniform. `taken` never holds
 * more than one index in practice, so walking past it is a comparison and not
 * a scan.
 */
const drawThing = (things: readonly string[], rng: () => number, taken: number[]): string => {
  let i = randInt(rng, things.length - taken.length);
  for (const t of [...taken].sort((a, b) => a - b)) {
    if (i >= t) i += 1;
  }
  taken.push(i);
  return things[i];
};

/**
 * One saying, from a seed.
 *
 * The same seed and the same deck always give the same sentence, which is what
 * makes this testable and what would make a reported string reproducible. An
 * empty deck cannot happen (the house line needs no index) but is handled
 * anyway, because a placeholder is not worth a thrown error.
 */
export const pickSaying = (deck: SayingDeck, seed: string | number): string => {
  const rng = makeRng(seed);
  const chosen = choosePattern(deck, rng);
  if (!chosen) return "What are we grinding?";

  const taken: number[] = [];
  let out = "";

  for (const part of chosen.pattern.parts) {
    if (!isSlot(part)) {
      out += part;
      continue;
    }
    out += slotText(part, chosen, rng, taken);
  }

  return out;
};

const slotText = (slot: Slot, prepared: PreparedPattern, rng: () => number, taken: number[]): string => {
  if (slot.kind === "thing") return drawThing(prepared.things, rng, taken);
  const bank = FIXED_BANKS[slot.kind];
  return bank[randInt(rng, bank.length)];
};

/**
 * Every distinct sentence the deck can produce.
 *
 * A plain sum over patterns of the product of their slot sizes. It is exact
 * rather than indicative because the eligible name set per pattern is already
 * narrowed by the length budget, so there is nothing in the product that
 * cannot actually be drawn.
 */
export const countSayings = (deck: SayingDeck): number => deck.combinations;

/** The per-pattern breakdown, so the arithmetic can be shown rather than claimed. */
export const explainCount = (deck: SayingDeck): { id: string; things: number; combinations: number }[] =>
  deck.usable.map((p) => ({ id: p.pattern.id, things: p.things.length, combinations: p.combinations }));
