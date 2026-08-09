/**
 * Numerics for the greenhouse time model.
 *
 * Everything here is standard, closed-form probability. No simulation, no
 * random sampling - the same inputs always give the same answer, which is what
 * makes the model testable.
 *
 * The one non-obvious identity doing the heavy lifting:
 *
 *   P(Binomial(n, q) >= k) = I_q(k, n - k + 1)
 *
 * the regularised incomplete beta function. That matters because summing
 * binomial terms directly overflows and loses precision once n runs into the
 * thousands, which it does here - a 100-spot plot over 40 plantings is n=4000.
 */

/** log Gamma, Lanczos approximation. Accurate to ~15 significant figures. */
const LANCZOS = [
  676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905,
  -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

export const logGamma = (z: number): number => {
  if (z < 0.5) {
    // Reflection: Gamma(z)Gamma(1-z) = pi / sin(pi z)
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  const x = z - 1;
  let a = 0.99999999999980993;
  const t = x + 7.5;
  for (let i = 0; i < LANCZOS.length; i++) a += LANCZOS[i] / (x + i + 1);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
};

/**
 * Continued fraction for the incomplete beta, modified Lentz method.
 * This is the classic Numerical Recipes `betacf`.
 */
const betaContinuedFraction = (a: number, b: number, x: number): number => {
  const TINY = 1e-30;
  const EPS = 3e-16;
  const MAX_ITER = 500;

  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;

  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < TINY) d = TINY;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= MAX_ITER; m++) {
    const m2 = 2 * m;

    // even step
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < TINY) d = TINY;
    c = 1 + aa / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    h *= d * c;

    // odd step
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < TINY) d = TINY;
    c = 1 + aa / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const del = d * c;
    h *= del;

    if (Math.abs(del - 1) < EPS) break;
  }

  return h;
};

/** Regularised incomplete beta I_x(a, b). Returns a probability in [0, 1]. */
export const regularisedIncompleteBeta = (a: number, b: number, x: number): number => {
  if (!(x > 0)) return 0;
  if (x >= 1) return 1;

  const front = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));

  // The continued fraction converges quickly only on one side of the mean, so
  // flip to the complement when x is on the far side.
  return x < (a + 1) / (a + b + 2)
    ? (front * betaContinuedFraction(a, b, x)) / a
    : 1 - (Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + b * Math.log(1 - x) + a * Math.log(x)) * betaContinuedFraction(b, a, 1 - x)) / b;
};

/**
 * P(X >= k) where X ~ Binomial(n, q).
 *
 * The "at least" direction is the one the model wants everywhere: "did this
 * many plantings deliver at least the demand?"
 */
export const binomialAtLeast = (n: number, q: number, k: number): number => {
  if (k <= 0) return 1;
  if (n <= 0) return 0;
  if (k > n) return 0;
  if (q >= 1) return 1;
  if (q <= 0) return 0;
  return regularisedIncompleteBeta(k, n - k + 1, q);
};

/** Clamp helper used by several callers. */
export const clamp = (value: number, low: number, high: number): number => Math.min(high, Math.max(low, value));

/**
 * Probability that at least one success occurs in `attempts` independent
 * trials of probability `p`. The per-spot, per-planting workhorse.
 */
export const atLeastOnce = (p: number, attempts: number): number => {
  if (attempts <= 0) return 0;
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  return 1 - Math.pow(1 - p, attempts);
};
