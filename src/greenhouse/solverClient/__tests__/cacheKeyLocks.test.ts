import { describe, it, expect } from "vitest";
import { canonicalRequest } from "../cacheKey";
import type { LockDefinition, MutationGoal } from "../../types/greenhouse";

/**
 * Pinned placements and priorities belong in the cache key.
 *
 * Leaving them out is the dangerous kind of cache bug. Two solves with
 * DIFFERENT pins would agree on a key, so the second player would be handed a
 * layout built around someone else's pins while their own were quietly
 * ignored. It would look completely plausible and be wrong, which is worse
 * than having no cache at all: a wrong answer that arrives instantly reads as
 * authoritative.
 */

const CELLS: [number, number][] = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
];

const TARGETS: MutationGoal[] = [{ mutation: "choconut", maximize: true, count: null }];

/** Two targets, so a ranking between them is a real question. */
const TWO_TARGETS: MutationGoal[] = [
  { mutation: "choconut", maximize: true, count: null },
  { mutation: "soggybud", maximize: true, count: null },
];

const key = (options: Parameters<typeof canonicalRequest>[2] = {}) =>
  canonicalRequest(CELLS, TARGETS, options);

const multiKey = (options: Parameters<typeof canonicalRequest>[2] = {}) =>
  canonicalRequest(CELLS, TWO_TARGETS, options);

describe("cache key: pinned placements", () => {
  it("tells two different pin sets apart", () => {
    const a: LockDefinition[] = [{ name: "cocoa_beans", size: 1, position: [0, 0] }];
    const b: LockDefinition[] = [{ name: "cocoa_beans", size: 1, position: [1, 1] }];

    expect(key({ locks: a })).not.toBe(key({ locks: b }));
  });

  it("tells a pinned crop apart from a pinned mutation at the same cell", () => {
    const crop: LockDefinition[] = [{ name: "cocoa_beans", size: 1, position: [0, 0] }];
    const mutation: LockDefinition[] = [{ name: "snoozling", size: 1, position: [0, 0] }];

    expect(key({ locks: crop })).not.toBe(key({ locks: mutation }));
  });

  it("tells the same pin apart at a different size", () => {
    const small: LockDefinition[] = [{ name: "snoozling", size: 1, position: [0, 0] }];
    const large: LockDefinition[] = [{ name: "snoozling", size: 3, position: [0, 0] }];

    expect(key({ locks: small })).not.toBe(key({ locks: large }));
  });

  it("treats pinning something as a different question from pinning nothing", () => {
    const locks: LockDefinition[] = [{ name: "cocoa_beans", size: 1, position: [0, 0] }];

    expect(key({ locks })).not.toBe(key());
    expect(key({ locks })).not.toBe(key({ locks: [] }));
  });

  it("does not care what order the pins arrived in", () => {
    // The grid hands them over in placement order, which is not meaningful.
    const one: LockDefinition[] = [
      { name: "cocoa_beans", size: 1, position: [0, 0] },
      { name: "wheat", size: 1, position: [1, 1] },
    ];
    const other: LockDefinition[] = [
      { name: "wheat", size: 1, position: [1, 1] },
      { name: "cocoa_beans", size: 1, position: [0, 0] },
    ];

    expect(key({ locks: one })).toBe(key({ locks: other }));
  });

  it("reads an empty pin list as no pins", () => {
    expect(key({ locks: [] })).toBe(key());
  });
});

describe("cache key: priorities", () => {
  it("tells two different rankings apart, where a ranking means something", () => {
    expect(multiKey({ priorities: { choconut: 30 } })).not.toBe(
      multiKey({ priorities: { choconut: 12 } })
    );
  });

  /**
   * With ONE target a priority is not a question, it is decoration.
   *
   * `Field.priorityValue` becomes a fixed multiple of the spawn count when
   * there is nothing to rank against, so it scales the score without reordering
   * anything. Measured across nine mutations at priorities 1, 7 and 34: every
   * response byte-identical to the unranked solve.
   *
   * Keying on it cost a real number. A request carrying a priority was not the
   * canonical request, so it missed the shipped precompute and fell back to a
   * cold search: Ashwreath returned 51 where the build ships 52, because
   * someone had set a ranking that could not possibly matter.
   */
  it("ignores a ranking on a single target, because it cannot change the answer", () => {
    expect(key({ priorities: { choconut: 30 } })).toBe(key({ priorities: { choconut: 12 } }));
    expect(key({ priorities: { choconut: 30 } })).toBe(key());
  });

  it("does not care what order the ranking was written in", () => {
    expect(multiKey({ priorities: { choconut: 30, soggybud: 13 } })).toBe(
      multiKey({ priorities: { soggybud: 13, choconut: 30 } })
    );
  });

  it("reads an empty ranking as no ranking", () => {
    expect(key({ priorities: {} })).toBe(key());
  });
});
