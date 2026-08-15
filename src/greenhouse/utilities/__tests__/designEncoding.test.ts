import { describe, expect, it } from "vitest";
import { deflateRaw } from "pako";
import { buildShareUrl, decodeDesign, encodeDesign, extractLayoutCode } from "../designEncoding";

/**
 * The share transport.
 *
 * Every share link anyone has ever pasted into Discord is one of these codes,
 * and the code is the entire layout: there is no server holding a copy to fall
 * back on. That makes two things load bearing here.
 *
 * The first is the round trip, because a codec nobody has fed a real payload is
 * a codec you are trusting on faith. The second is the letter-to-crop binding,
 * which is positional against the arrays in ../../constants/cropMapping. A code
 * that decodes into the wrong crops looks like a working import, so the fixtures
 * below name the expected crop ids as literals on purpose: reordering CROP_IDS
 * or MUTATION_IDS should break this file loudly rather than break old links
 * silently.
 *
 * Failure cases assert on the message, not just "it threw", because these
 * strings land in a toast and pako's own wording ("invalid stored block
 * lengths") tells a player nothing about what to do next.
 */

type Placement = { cropId: string; position: [number, number] };

/** base64url, duplicated here so the test does not lean on the module it tests. */
const b64url = (bytes: Uint8Array): string => {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

/** A well-formed code wrapping an arbitrary grid string, built without the encoder. */
const codeFor = (gridString: string): string => b64url(deflateRaw(gridString, { level: 9 }));

/** Placements come back grouped by crop, so compare as an order-independent set. */
const asSet = (placements: Placement[]): string[] =>
  placements.map((p) => `${p.cropId}@${p.position[0]},${p.position[1]}`).sort();

/** A 100 cell grid of single-width characters, empty except where told otherwise. */
const grid = (cells: Record<number, string>, width: 1 | 2 = 1): string => {
  const out = new Array<string>(100).fill(".".repeat(width));
  for (const [pos, chars] of Object.entries(cells)) out[Number(pos)] = chars;
  return out.join("");
};

const inputs: Placement[] = [
  { cropId: "wheat", position: [0, 0] },
  { cropId: "wheat", position: [0, 1] },
  { cropId: "carrot", position: [4, 7] },
  { cropId: "nether_wart", position: [9, 9] },
];

const targets: Placement[] = [
  { cropId: "ashwreath", position: [2, 2] },
  { cropId: "timestalk", position: [5, 5] },
];

describe("design code round trip", () => {
  it("survives encode then decode with inputs and targets", () => {
    const out = decodeDesign(encodeDesign(inputs, targets));

    expect(asSet(out.inputs)).toStrictEqual(asSet(inputs));
    expect(asSet(out.targets)).toStrictEqual(asSet(targets));
  });

  it("keeps inputs and targets in their own halves", () => {
    const out = decodeDesign(encodeDesign(inputs, targets));

    // A mutation used as an input must not reappear as a target, and vice
    // versa: the grid stores the distinction as letter case and nothing else.
    expect(out.inputs.some((p) => p.cropId === "ashwreath")).toBe(false);
    expect(out.targets.some((p) => p.cropId === "wheat")).toBe(false);
  });

  it("round-trips a layout with no targets at all", () => {
    const out = decodeDesign(encodeDesign(inputs, []));

    expect(asSet(out.inputs)).toStrictEqual(asSet(inputs));
    expect(out.targets).toStrictEqual([]);
  });

  it("round-trips more than 26 distinct crops, which forces double mode", () => {
    // 17 crops plus 10 mutations used as inputs. Past 26 the encoder switches
    // to two characters per cell, and the decoder infers that purely from the
    // grid being 200 characters instead of 100.
    const many: Placement[] = [
      "wheat", "potato", "carrot", "pumpkin", "melon", "cocoa_beans", "sugar_cane",
      "cactus", "nether_wart", "red_mushroom", "brown_mushroom", "moonflower",
      "sunflower", "wild_rose", "fire", "dead_plant", "fermento",
      "ashwreath", "choconut", "dustgrain", "gloomgourd", "lonelily", "scourroot",
      "shadevine", "veilshroom", "witherbloom", "chocoberry",
    ].map((cropId, i): Placement => ({ cropId, position: [Math.floor(i / 10), i % 10] }));

    expect(many).toHaveLength(27);

    // Placed clear of the 27 inputs. A cell holds one thing, so a target laid
    // on top of an input overwrites it, which would be a fixture bug rather
    // than a codec one.
    const lateTargets: Placement[] = [
      { cropId: "ashwreath", position: [9, 8] },
      { cropId: "timestalk", position: [9, 9] },
    ];

    const out = decodeDesign(encodeDesign(many, lateTargets));

    expect(asSet(out.inputs)).toStrictEqual(asSet(many));
    expect(asSet(out.targets)).toStrictEqual(asSet(lateTargets));
  });

  it("round-trips the 27th crop specifically, not just the count", () => {
    // The boundary case: index 26 is the first that cannot be a single letter.
    const many: Placement[] = [
      "wheat", "potato", "carrot", "pumpkin", "melon", "cocoa_beans", "sugar_cane",
      "cactus", "nether_wart", "red_mushroom", "brown_mushroom", "moonflower",
      "sunflower", "wild_rose", "fire", "dead_plant", "fermento",
      "ashwreath", "choconut", "dustgrain", "gloomgourd", "lonelily", "scourroot",
      "shadevine", "veilshroom", "witherbloom", "chocoberry",
    ].map((cropId, i): Placement => ({ cropId, position: [Math.floor(i / 10), i % 10] }));

    const out = decodeDesign(encodeDesign(many, []));

    expect(out.inputs).toContainEqual({ cropId: "chocoberry", position: [2, 6] });
  });
});

/**
 * The letters in the grid are local (first crop listed is "a"), and the index
 * list at the front of the payload is what binds them to real ids. These codes
 * are hand-built so the assertion is about the mapping itself rather than about
 * the encoder agreeing with itself.
 */
describe("letter-to-crop binding is positional", () => {
  it("maps input index 0 and target index 17 to the first crop and first mutation", () => {
    // Indices are base 36, so 17 is written "h". CROP_IDS.length is 17, which
    // is where the shared index scheme continues into MUTATION_IDS.
    const out = decodeDesign(codeFor(`0|h|${grid({ 0: "a", 1: "A" })}`));

    expect(out.inputs).toStrictEqual([{ cropId: "wheat", position: [0, 0] }]);
    expect(out.targets).toStrictEqual([{ cropId: "ashwreath", position: [0, 1] }]);
  });

  it("maps the last crop and the last mutation", () => {
    // 16 is the final CROP_IDS slot, 56 the final MUTATION_IDS slot (17 + 39).
    const out = decodeDesign(codeFor(`g|1k|${grid({ 34: "a", 99: "A" })}`));

    expect(out.inputs).toStrictEqual([{ cropId: "fermento", position: [3, 4] }]);
    expect(out.targets).toStrictEqual([{ cropId: "timestalk", position: [9, 9] }]);
  });

  it("binds the second letter to the second id in the list, not to a fixed crop", () => {
    // Same letters, different index list: "b" means whatever was listed second.
    const cells = grid({ 0: "a", 11: "b" });

    const first = decodeDesign(codeFor(`0,2|${""}|${cells}`));
    expect(asSet(first.inputs)).toStrictEqual(["carrot@1,1", "wheat@0,0"]);

    const swapped = decodeDesign(codeFor(`2,0|${""}|${cells}`));
    expect(asSet(swapped.inputs)).toStrictEqual(["carrot@0,0", "wheat@1,1"]);
  });

  it("reads a double-mode grid with two characters per cell", () => {
    const out = decodeDesign(codeFor(`0,2|h|${grid({ 0: "aa", 5: "ab", 99: "AA" }, 2)}`));

    expect(asSet(out.inputs)).toStrictEqual(["carrot@0,5", "wheat@0,0"]);
    expect(out.targets).toStrictEqual([{ cropId: "ashwreath", position: [9, 9] }]);
  });
});

/**
 * The link a player copies. It has to point at our own deployment and it has to
 * survive being pasted back in, which is the pair of properties the old
 * `https://api.skyshards.com/share/<code>` link did not have.
 */
describe("buildShareUrl", () => {
  const code = encodeDesign(inputs, targets);

  it("builds a canonical fragment link on our own origin", () => {
    expect(buildShareUrl(code, "https://skydex.ca", "/")).toBe(
      `https://skydex.ca/greenhouse/share/${code}`,
    );
  });

  it("keeps the legacy base argument source-compatible without using it", () => {
    expect(buildShareUrl(code, "https://skydex.ca", "/Skydex/")).toBe(
      `https://skydex.ca/greenhouse/share/${code}`,
    );
  });

  it("includes a matching saved name without changing the encoded layout", () => {
    const url = buildShareUrl(code, "https://skydex.ca", "/", "  My Gloom Garden  ");

    expect(url).toBe(
      `https://skydex.ca/greenhouse/share/${code}?name=My+Gloom+Garden`,
    );
    expect(extractLayoutCode(url)).toBe(code);
  });

  it("always uses the canonical origin root whatever the legacy base looks like", () => {
    for (const base of ["/", "/SkyShards/", "/SkyShards", ""]) {
      const url = buildShareUrl(code, "https://wizard.example", base);
      expect(url).toBe(`https://wizard.example/greenhouse/share/${code}`);
    }
  });

  it("points at a URL our own paste handler can read back", () => {
    // The two halves are inverses. If either drifts, a shared link stops
    // importing, and that is not something a user can work around.
    for (const base of ["/", "/SkyShards/"]) {
      const url = buildShareUrl(code, "https://wizard.example", base);
      expect(extractLayoutCode(url)).toBe(code);
      expect(asSet(decodeDesign(extractLayoutCode(url)).inputs)).toStrictEqual(asSet(inputs));
    }
  });

  it("never points at a host we do not run", () => {
    expect(buildShareUrl(code, "https://wizard.example", "/")).not.toMatch(/skyshards\.com/);
  });
});

describe("extractLayoutCode", () => {
  const code = encodeDesign(inputs, targets);

  it("passes a bare code through untouched", () => {
    expect(extractLayoutCode(code)).toBe(code);
  });

  it("reads canonical absolute and relative fragment links", () => {
    expect(
      extractLayoutCode(`https://skydex.ca/greenhouse#designer?layout=${code}`),
    ).toBe(code);
    expect(extractLayoutCode(`/greenhouse#designer?layout=${code}`)).toBe(code);
  });

  it("reads our own link when the site is served under a sub-path", () => {
    expect(
      extractLayoutCode(`https://user.github.io/SkyShards/greenhouse/designer?layout=${code}`)
    ).toBe(code);
  });

  it("still reads a legacy api.skyshards.com share link", () => {
    // We no longer produce these, but they are sitting in Discord history and a
    // player pasting one should get their layout rather than an error.
    expect(extractLayoutCode(`https://api.skyshards.com/share/${code}`)).toBe(code);
  });

  it("reads a relative link that new URL() refuses", () => {
    expect(extractLayoutCode(`/greenhouse/designer?layout=${code}`)).toBe(code);
  });

  it("ignores other query parameters around the layout", () => {
    expect(extractLayoutCode(`https://wizard.example/d?tab=grid&layout=${code}&zoom=2`)).toBe(code);
  });

  it("stops at a fragment", () => {
    expect(extractLayoutCode(`https://wizard.example/d?layout=${code}#grid`)).toBe(code);
  });

  it("strips whitespace and newlines from a wrapped paste", () => {
    // Chat clients hard-wrap long codes. base64url never contains whitespace,
    // so removing it can only ever repair a paste.
    const wrapped = `  ${code.slice(0, 8)}\n${code.slice(8, 20)}\r\n ${code.slice(20)}  `;
    expect(extractLayoutCode(wrapped)).toBe(code);
    expect(asSet(decodeDesign(wrapped).inputs)).toStrictEqual(asSet(inputs));
  });

  it("strips whitespace out of a wrapped link too", () => {
    const wrapped = `https://wizard.example/greenhouse/designer?layout=${code.slice(0, 10)}\n${code.slice(10)}`;
    expect(extractLayoutCode(wrapped)).toBe(code);
  });

  it("calls out a link whose layout parameter is empty", () => {
    // This used to fall through and return the whole URL as if it were a code,
    // so the player got a base64 complaint about something visibly a link.
    expect(() => extractLayoutCode("https://wizard.example/greenhouse/designer?layout=")).toThrow(
      /layout slot but nothing in it/i
    );
  });

  it("calls out an empty layout parameter on a relative link as well", () => {
    expect(() => extractLayoutCode("/greenhouse/designer?layout=&tab=grid")).toThrow(
      /layout slot but nothing in it/i
    );
  });

  it("returns an empty string for empty or whitespace-only input", () => {
    expect(extractLayoutCode("")).toBe("");
    expect(extractLayoutCode("   \n\t ")).toBe("");
    expect(extractLayoutCode(null)).toBe("");
    expect(extractLayoutCode(undefined)).toBe("");
  });

  it("does not mistake an unrelated parameter ending in layout for ours", () => {
    expect(extractLayoutCode("https://wizard.example/d?mylayout=abc")).toBe(
      "https://wizard.example/d?mylayout=abc"
    );
  });
});

/** Every failure must arrive as an Error, never as pako's bare string. */
const failureOf = (input: string | null | undefined): Error => {
  try {
    decodeDesign(input);
  } catch (err) {
    expect(err).toBeInstanceOf(Error);
    return err as Error;
  }
  throw new Error("expected decodeDesign to reject");
};

/**
 * Indices this build cannot resolve.
 *
 * There are 17 crops and 40 mutations sharing one index space, so 0 through 56
 * resolve and 57 upward do not. An index arrives here either because the code
 * was written by a newer dataset or because it is corrupt, and in both cases
 * the letters in the grid are positional into the resolved list. Dropping an
 * unresolvable entry, which is what the old `.filter(Boolean)` did, slides
 * every later crop one slot down and produces a layout that imports cleanly
 * and shows the wrong plants. Rejecting is the whole point of this block.
 */
describe("codes naming crops this build does not have", () => {
  const unknownMessage = /crops this version does not know about/i;

  it("rejects an unknown index in the input list", () => {
    // "1l" is 57 in base 36, one past the last mutation.
    expect(failureOf(codeFor(`1l|h|${grid({ 0: "a" })}`)).message).toMatch(unknownMessage);
  });

  it("rejects an unknown index in the target list", () => {
    // The `idx - CROP_IDS.length` branch, which is the easy one to get wrong.
    expect(failureOf(codeFor(`0|1l|${grid({ 0: "a", 1: "A" })}`)).message).toMatch(unknownMessage);
  });

  it("rejects an index far past the end of the table", () => {
    // "zz" is 1295, the kind of number a corrupted payload produces.
    expect(failureOf(codeFor(`zz|h|${grid({ 0: "a" })}`)).message).toMatch(unknownMessage);
  });

  it("rejects an index that is not a number at all", () => {
    // parseInt("!", 36) is NaN, which misses every slot rather than matching one.
    expect(failureOf(codeFor(`!|h|${grid({ 0: "a" })}`)).message).toMatch(unknownMessage);
  });

  it("rejects a negative index", () => {
    // The crop-side branch: -1 is below CROP_IDS.length but indexes nothing.
    expect(failureOf(codeFor(`-1|h|${grid({ 0: "a" })}`)).message).toMatch(unknownMessage);
  });

  it("rejects even when the unknown crop is never placed on the grid", () => {
    // The index list is the contract. A code we cannot fully read is refused
    // whether or not the missing crop happens to appear in a cell.
    expect(failureOf(codeFor(`0,1l|h|${grid({ 0: "a" })}`)).message).toMatch(unknownMessage);
  });

  it("does not silently shift later crops into an unknown crop's slot", () => {
    // The regression this whole block exists for. Three inputs, the middle one
    // unknown: wheat, <unknown>, carrot, with "a", "b" and "c" laid out in
    // order down the grid.
    const code = codeFor(`0,1l,2|${""}|${grid({ 0: "a", 1: "b", 2: "c" })}`);

    // Before the fix the unknown entry was dropped from the list, so "b" bound
    // to carrot and cell 1 came back as carrot: a clean-looking import of a
    // layout the sharer never built. Now the code is refused outright.
    const error = failureOf(code);
    expect(error.message).toMatch(unknownMessage);

    // Stated as its own assertion so the intent survives a reworded message:
    // under no circumstances does this code yield a layout.
    expect(() => decodeDesign(code)).toThrow();
  });

  it("keeps its own wording instead of the generic unpacked-but-invalid text", () => {
    // The cause is actionable ("update the site" or "get a fresh link"), so it
    // must not be flattened by the catch around decodeGridString.
    const message = failureOf(codeFor(`1l|h|${grid({ 0: "a" })}`)).message;
    expect(message).not.toMatch(/not a valid greenhouse layout/i);
    expect(message).toMatch(/update the site, or ask for a fresh copy of the link/i);
  });

  it("still accepts the highest indices that do resolve", () => {
    // The boundary from the other side: 16 is the last crop, 56 the last
    // mutation. A guard that rejected these would break real shared links.
    const out = decodeDesign(codeFor(`g|1k|${grid({ 0: "a", 99: "A" })}`));

    expect(out.inputs).toStrictEqual([{ cropId: "fermento", position: [0, 0] }]);
    expect(out.targets).toStrictEqual([{ cropId: "timestalk", position: [9, 9] }]);
  });
});

describe("decodeDesign rejections", () => {

  it("rejects a tiny compressed code before it can expand into an oversized payload", () => {
    const expansionBomb = codeFor("x".repeat(128 * 1024));

    expect(failureOf(expansionBomb).message).toMatch(/too large/i);
  });

  it("rejects an oversized compressed payload before attempting to unpack it", () => {
    let state = 0x5eed1234;
    const bytes = Uint8Array.from({ length: 16 * 1024 }, () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state >>> 24;
    });
    const oversizedCode = b64url(deflateRaw(bytes, { level: 9 }));

    expect(failureOf(oversizedCode).message).toMatch(/too large/i);
  });

  it("says so when nothing was pasted", () => {
    expect(failureOf("").message).toMatch(/paste a layout code/i);
  });

  it("says so when only whitespace was pasted", () => {
    expect(failureOf("   \n\t  ").message).toMatch(/paste a layout code/i);
  });

  it("tolerates null and undefined without throwing a type error", () => {
    expect(failureOf(null).message).toMatch(/paste a layout code/i);
    expect(failureOf(undefined).message).toMatch(/paste a layout code/i);
  });

  it("names base64 when the code contains characters base64 cannot hold", () => {
    expect(failureOf("!!!! not base64 !!!!").message).toMatch(/not valid base64/i);
  });

  it("rejects valid base64 that is not deflate at all", () => {
    const notDeflate = b64url(new TextEncoder().encode("hello world, uncompressed"));
    expect(failureOf(notDeflate).message).toMatch(/could not be unpacked/i);
  });

  it("rejects a stream that runs out early rather than reading undefined", () => {
    // pako returns undefined here instead of throwing, which used to reach
    // .split("|") and surface as "cannot read properties of undefined".
    const full = deflateRaw(`0|17|${grid({ 0: "a" })}`, { level: 9 });
    const half = b64url(full.subarray(0, Math.max(1, Math.floor(full.length / 2))));
    expect(failureOf(half).message).toMatch(/could not be unpacked/i);
  });

  it("rejects a code truncated the way a bad copy-paste truncates one", () => {
    const code = encodeDesign(inputs, targets);
    const error = failureOf(code.slice(0, Math.floor(code.length / 2)));
    expect(error.message).toMatch(/not valid base64|could not be unpacked|not a valid greenhouse layout/i);
    expect(error.message).not.toMatch(/stored block|incorrect header|invalid distance/i);
  });

  it("rejects deflate that unpacks into something that is not a layout", () => {
    expect(failureOf(codeFor("this compressed fine but is not a grid")).message).toMatch(
      /not a valid greenhouse layout/i
    );
  });

  it("rejects a grid that is the wrong length", () => {
    expect(failureOf(codeFor("0|h|abc")).message).toMatch(/not a valid greenhouse layout/i);
  });

  it("never leaks pako wording to the player", () => {
    for (const hostile of ["", "   ", "not base64 at all", "@@@@", "aaaa", "AAAAAAAA"]) {
      const error = failureOf(hostile);
      expect(error.message).not.toMatch(/stored block|incorrect header|invalid distance|invalid code/i);
      expect(error.message).not.toMatch(/undefined|\[object/i);
    }
  });
});
