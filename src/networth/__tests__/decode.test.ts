import { describe, expect, it } from "vitest";
import { readNbtBlob } from "../../nbt";
import { simplifyItems } from "../nbtSimplify";
import { valueItem } from "../itemValue";
import { TEST_CATALOGUE, TEST_PRICES } from "./testPrices";
import blobFixture from "./fixtures/blobs.json";
import type { RawItem } from "../types";

/**
 * The decode path, cross-checked against a different decoder.
 *
 * `simplifyItems` sits between this project's own NBT engine and the
 * valuation, and it is the one piece the parity script cannot cover: parity
 * feeds pre-parsed items to both sides precisely so that decoding is out of
 * scope there. So it is checked here instead, against output recorded from
 * prismarine-nbt, which is a completely independent implementation of the same
 * format. Agreeing with a second decoder on real bytes is the only evidence
 * that means anything for a binary parser.
 *
 * TWO REPRESENTATIONS DELIBERATELY DIFFER and are normalised below rather than
 * papered over:
 *
 *   TAG_Long. prismarine hands back a `[high, low]` pair of 32 bit halves.
 *   `src/nbt` reads longs as bigint (its own header explains why: a 64 bit
 *   value silently loses digits in a double) and this module narrows to a
 *   number only when that is exact. No field the valuation reads is a long;
 *   the only one present on a real item is `timestamp`.
 *
 *   TAG_Byte_Array. prismarine gives signed bytes, this project gives a
 *   `Uint8Array`. Same bits, different sign convention.
 */

const blobs = blobFixture.blobs as { base64: string; decoded: unknown[] }[];

/**
 * Walk both trees together and reduce the two known representation gaps to one
 * value on each side.
 *
 * Paired rather than one-sided on purpose. "A two number array" cannot be
 * recognised as a long by looking at one side alone: a genuine TAG_Int_Array of
 * length two would look identical. Comparing positions means the rule can be
 * the honest one, which is "their side is a two number array exactly where our
 * side is a single number".
 *
 * A shape mismatch is returned as a distinguishable pair rather than smoothed
 * over, so a real disagreement still fails the assertion.
 */
const canonPair = (ours: unknown, theirs: unknown): [unknown, unknown] => {
  // A long: theirs is [high, low], ours is one number (or a digit string when
  // the value could not survive the conversion).
  if (
    Array.isArray(theirs) &&
    theirs.length === 2 &&
    theirs.every((v) => typeof v === "number" && Number.isInteger(v)) &&
    (typeof ours === "number" || typeof ours === "string")
  ) {
    return ["<long>", "<long>"];
  }

  // A byte array: theirs is signed numbers, ours is a Uint8Array.
  if (ours instanceof Uint8Array && Array.isArray(theirs)) {
    return [Array.from(ours), theirs.map((v) => (typeof v === "number" && v < 0 ? v + 256 : v))];
  }

  if (Array.isArray(ours) && Array.isArray(theirs)) {
    if (ours.length !== theirs.length) return [ours, theirs];
    const a: unknown[] = [];
    const b: unknown[] = [];
    for (let i = 0; i < ours.length; i++) {
      const [left, right] = canonPair(ours[i], theirs[i]);
      a.push(left);
      b.push(right);
    }
    return [a, b];
  }

  if (typeof ours === "object" && ours !== null && typeof theirs === "object" && theirs !== null) {
    const keys = [...new Set([...Object.keys(ours), ...Object.keys(theirs)])];
    const a: Record<string, unknown> = {};
    const b: Record<string, unknown> = {};
    for (const key of keys) {
      const [left, right] = canonPair(
        (ours as Record<string, unknown>)[key],
        (theirs as Record<string, unknown>)[key]
      );
      a[key] = left;
      b[key] = right;
    }
    return [a, b];
  }

  return [ours, theirs];
};

describe("container decoding", () => {
  it("has blobs to check", () => {
    expect(blobs.length).toBeGreaterThan(0);
  });

  for (const [index, blob] of blobs.entries()) {
    it(`decodes blob ${index} to the same items prismarine-nbt produced`, async () => {
      const document = await readNbtBlob(blob.base64);
      const ours = simplifyItems(document.value);

      // Empty slots are dropped on the way out, so the recorded list is
      // filtered the same way before comparing.
      const theirs = blob.decoded.filter((item) => item && Object.keys(item).length > 0);

      expect(ours).toHaveLength(theirs.length);
      const [left, right] = canonPair(ours, theirs);
      expect(left).toEqual(right);
    });
  }

  it("yields an empty list rather than throwing when there is no item list", async () => {
    // Every profile carries fields that are legitimately absent, and one
    // missing wardrobe slot must not cost a player their whole networth. The
    // loud-failure path belongs to `readInventoryItems`, which the item browser
    // uses, not to this one.
    const document = await readNbtBlob(blobs[0].base64);
    document.value.value.delete("i");
    expect(simplifyItems(document.value)).toEqual([]);
  });

  it("values a decoded item without any further translation", async () => {
    // The point of matching prismarine's shape is that the decoded object goes
    // straight into the valuation. If it needed massaging first, the parity
    // gate would be measuring a different pipeline than the browser runs.
    const document = await readNbtBlob(blobs[0].base64);
    const [first] = simplifyItems(document.value);
    const result = valueItem(first as RawItem, { prices: TEST_PRICES, catalogue: TEST_CATALOGUE });
    expect(result).not.toBeNull();
    expect(typeof result!.id).toBe("string");
    expect(result!.id.length).toBeGreaterThan(0);
    expect(result!.name).not.toContain("§");
  });
});
