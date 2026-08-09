import { describe, expect, it } from "vitest";
import { atLeastOnce, binomialAtLeast, logGamma, regularisedIncompleteBeta } from "../probability";

/**
 * The percentiles the model reports are only as trustworthy as the binomial
 * tail underneath them, so it gets pinned against brute force rather than
 * against itself.
 */

/** Direct sum of binomial terms. Fine for small n, and independent of the CF. */
const bruteAtLeast = (n: number, q: number, k: number): number => {
  const logChoose = (a: number, b: number) => logGamma(a + 1) - logGamma(b + 1) - logGamma(a - b + 1);
  let total = 0;
  for (let i = Math.max(0, k); i <= n; i++) total += Math.exp(logChoose(n, i) + i * Math.log(q) + (n - i) * Math.log(1 - q));
  return total;
};

describe("logGamma", () => {
  it("reproduces factorials", () => {
    expect(logGamma(1)).toBeCloseTo(0, 12);
    expect(logGamma(5)).toBeCloseTo(Math.log(24), 12);
    expect(logGamma(11)).toBeCloseTo(Math.log(3628800), 10);
  });

  it("satisfies the reflection formula below 0.5", () => {
    // Gamma(0.5) = sqrt(pi)
    expect(logGamma(0.5)).toBeCloseTo(Math.log(Math.sqrt(Math.PI)), 12);
  });
});

describe("regularisedIncompleteBeta", () => {
  it("is 0 and 1 at the ends", () => {
    expect(regularisedIncompleteBeta(2, 3, 0)).toBe(0);
    expect(regularisedIncompleteBeta(2, 3, 1)).toBe(1);
  });

  it("is symmetric: I_x(a,b) = 1 - I_(1-x)(b,a)", () => {
    for (const [a, b, x] of [
      [2, 3, 0.25],
      [5, 1, 0.6],
      [10, 7, 0.4],
    ]) {
      expect(regularisedIncompleteBeta(a, b, x)).toBeCloseTo(1 - regularisedIncompleteBeta(b, a, 1 - x), 12);
    }
  });
});

describe("binomialAtLeast", () => {
  it("matches a brute-force binomial sum across a wide grid", () => {
    let worst = 0;
    for (const n of [1, 2, 5, 10, 37, 80, 200]) {
      for (const q of [0.01, 0.06, 0.15, 0.25, 0.5, 0.83, 0.99]) {
        for (const k of [1, 2, 3, Math.ceil(n / 2), n]) {
          if (k > n) continue;
          worst = Math.max(worst, Math.abs(binomialAtLeast(n, q, k) - bruteAtLeast(n, q, k)));
        }
      }
    }
    expect(worst).toBeLessThan(1e-9);
  });

  it("handles the degenerate edges", () => {
    expect(binomialAtLeast(10, 0.5, 0)).toBe(1); // at least zero is certain
    expect(binomialAtLeast(10, 0.5, 11)).toBe(0); // cannot exceed n
    expect(binomialAtLeast(0, 0.5, 1)).toBe(0);
    expect(binomialAtLeast(10, 1, 10)).toBe(1); // certain success
    expect(binomialAtLeast(10, 0, 1)).toBe(0); // impossible success
  });

  it("stays stable where a direct sum would overflow", () => {
    // n = 400k: the mean is 120k, so "at least the mean" sits near a half.
    expect(binomialAtLeast(400_000, 0.3, 120_000)).toBeGreaterThan(0.49);
    expect(binomialAtLeast(400_000, 0.3, 120_000)).toBeLessThan(0.51);
  });

  it("is monotone decreasing in the target", () => {
    let previous = 1;
    for (let k = 0; k <= 40; k++) {
      const current = binomialAtLeast(40, 0.35, k);
      expect(current).toBeLessThanOrEqual(previous + 1e-12);
      previous = current;
    }
  });
});

describe("atLeastOnce", () => {
  it("is the complement of all-failures", () => {
    expect(atLeastOnce(0.25, 4)).toBeCloseTo(1 - 0.75 ** 4, 12);
    expect(atLeastOnce(0.3, 1)).toBeCloseTo(0.3, 12);
  });

  it("saturates towards certainty as attempts grow", () => {
    expect(atLeastOnce(0.25, 100)).toBeGreaterThan(0.999999);
    expect(atLeastOnce(1, 1)).toBe(1);
    expect(atLeastOnce(0, 50)).toBe(0);
    expect(atLeastOnce(0.5, 0)).toBe(0);
  });
});
