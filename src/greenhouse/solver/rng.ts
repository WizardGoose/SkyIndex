/**
 * Seeded PRNG. The solver must never touch Math.random: the parity harness
 * compares our output against a captured baseline, so the same seed and the
 * same budget have to produce a byte-identical response every run.
 *
 * mulberry32: 32 bits of state, one multiply-xorshift round, passes gjrand for
 * our purposes and is three lines. We do not need cryptographic quality, we
 * need repeatability.
 */
export interface Rng {
  /** Uniform in [0, 1). */
  next(): number;
  /** Uniform integer in [0, n). Returns 0 when n <= 0. */
  int(n: number): number;
}

export const mulberry32 = (seed: number): Rng => {
  let a = seed >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (n: number): number => (n <= 0 ? 0 : Math.floor(next() * n) % n),
  };
};
