/**
 * A seeded pseudo-random generator, written here because the alternative was a
 * dependency for eleven lines.
 *
 * `Math.random` cannot be seeded, and an unseeded generator would make the
 * saying module untestable: there would be no way to assert that a given seed
 * produces a given sentence, and no way to reproduce a bad string someone
 * reported. Everything downstream of this file is a pure function of its seed.
 *
 * mulberry32 is the algorithm. It is a 32-bit state, three multiplies and a
 * couple of shifts, and its output is far more uniform than a placeholder
 * picker needs. It is not cryptographic and nothing here should ever be used
 * where that matters.
 */

/**
 * A string or number folded into a 32-bit unsigned seed.
 *
 * FNV-1a for strings, so two different words cannot collide by accident of
 * length, and a plain unsigned cast for numbers. Numbers are the normal case
 * here (a visit stamp plus a focus counter); strings exist so a test can say
 * `seedFrom("choconut")` and mean it.
 */
export const seedFrom = (seed: string | number): number => {
  if (typeof seed === "number") return seed >>> 0;

  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

/**
 * A generator of numbers in [0, 1), from a seed.
 *
 * Returned as a closure rather than as an object with a `.next()` so it drops
 * straight into the places a caller would otherwise have written
 * `Math.random`, which keeps the call sites at the top of this module readable.
 */
export const makeRng = (seed: string | number): (() => number) => {
  let a = seedFrom(seed);

  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** An integer in [0, n). Returns 0 when n is not a positive integer. */
export const randInt = (rng: () => number, n: number): number => {
  if (!(n > 0)) return 0;
  return Math.min(n - 1, Math.floor(rng() * n));
};
