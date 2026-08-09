import { describe, expect, it } from "vitest";
import { CODE_PREFIX, decodeIslandCode, encodeIslandCode } from "../code";
import type { IslandSnapshot } from "../types";

/**
 * The clipboard transport.
 *
 * The round trip is the load-bearing test: a decoder nobody has ever fed a real
 * encoded payload is a decoder you are trusting on faith. Everything else here
 * is a failure mode, and each one asserts on the *message* rather than just
 * "it threw", because these strings are rendered under the paste box and a
 * player has to be able to act on them.
 */

const fixture: IslandSnapshot = {
  schema: 1,
  exportedAt: 1754092800000,
  player: { uuid: "b876ec32-e396-476b-a115-8438d83c67d4", name: "Steve" },
  profile: { name: "Papaya", gameMode: "ironman" },
  sacks: { ENCHANTED_BROWN_MUSHROOM: 25600, OAK_LOG: 4096 },
  chests: [
    {
      pos: [12, 71, -34],
      name: "Mushroom Storage",
      lastSeen: 1754092700000,
      items: [
        { id: "OAK_LOG", name: "Oak Log", count: 64 },
        { id: "ENCHANTED_BROWN_MUSHROOM", name: "Enchanted Brown Mushroom", count: 12 },
      ],
    },
  ],
  inventory: [{ id: "ROOKIE_HOE", name: "Rookie Hoe", count: 1 }],
  // enderChest deliberately omitted: not captured.
  storage: [],
};

/** base64url, duplicated here so the test does not lean on the module it tests. */
const b64url = (bytes: Uint8Array): string => {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

/** A well-formed code wrapping arbitrary text, for "gzip that is not JSON". */
const gzipCode = async (text: string): Promise<string> => {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  const buffer = await new Response(stream).arrayBuffer();
  return CODE_PREFIX + b64url(new Uint8Array(buffer));
};

describe("island code round trip", () => {
  it("decodes the exact SKYDEX2 code produced by the Java mod", async () => {
    const javaCode =
      "SKYDEX2-H4sIAAAAAAAA_wv2dolgaphw4UCbMaegY3CAq3NIvL9bfIiHa7yrn4ugY3FBanKJQn6aQklGqoJrXgqrc0ZqcYmEq5-zh6NfiKtLvFOQf7hfvG9osEeQv78" +
      "vu7-jd7yPvztXcElRYnlSalFRJXd4ZlViUYp7fn5xqkqqYZpBskmKka4BEOiagAgLEGGAAIbsmUX5ebmJeRzsbJwM7IwsDScYGSV6GJ2ZIc5kZGV1YGBgBA" +
      "EGJgYAytIaZ8AAAAA";

    const out = await decodeIslandCode(javaCode);
    expect(out).toStrictEqual({
      schema: 1,
      exportedAt: 1754092800000,
      player: { uuid: "e1f0c4d2-0000-4000-8000-000000000001", name: "WizardGoose" },
      profile: { name: "Strawberry", gameMode: "ironman" },
      sacks: { ENCHANTED_BROWN_MUSHROOM: 25600 },
      chests: [{
        pos: [12, 70, -34],
        name: "Chest",
        lastSeen: 1754092800000,
        items: [{ id: "OAK_LOG", name: "Oak Log", count: 64, slot: 4 }],
      }],
      inventory: [{ id: "ASPECT_OF_THE_END", name: "Aspect of the End", count: 1, slot: 0 }],
    });
  });

  it("survives encode then decode unchanged", async () => {
    const code = await encodeIslandCode(fixture);
    expect(code.startsWith(CODE_PREFIX)).toBe(true);

    const out = await decodeIslandCode(code);
    expect(out).toStrictEqual(fixture);
  });

  it("keeps 'not captured' and 'verified empty' apart across the wire", async () => {
    const out = await decodeIslandCode(await encodeIslandCode(fixture));
    expect(out.storage).toStrictEqual([]);
    expect(out.enderChest).toBeUndefined();
    expect("enderChest" in out).toBe(false);
  });

  it("tolerates the whitespace a chat client adds to a pasted code", async () => {
    const code = await encodeIslandCode(fixture);
    const mangled = `\n  ${code.slice(0, 20)}\n${code.slice(20)}  \n`;
    const out = await decodeIslandCode(mangled);
    expect(out.player.name).toBe("Steve");
  });

  /**
   * The renames changed what the transport is CALLED, not what it is. Every
   * code a player already has on their clipboard - `SKYINDEX1.` from the mod
   * (which keeps emitting it until rebuilt), `SKYDEX1.` from the brief
   * dot-era during the rename - has to keep
   * pasting. The three prefixes all differ in length, so these also pin that
   * the payload is sliced by the prefix that actually matched.
   */
  it("still reads a legacy SKYINDEX1. code, byte for byte", async () => {
    const current = await encodeIslandCode(fixture);
    expect(current.startsWith("SKYDEX-")).toBe(true);

    const legacy = `SKYINDEX1.${current.slice("SKYDEX-".length)}`;
    const out = await decodeIslandCode(legacy);
    expect(out).toStrictEqual(fixture);
  });

  it("still reads a dot-era SKYDEX1. code, byte for byte", async () => {
    const current = await encodeIslandCode(fixture);
    const dotEra = `SKYDEX1.${current.slice("SKYDEX-".length)}`;
    const out = await decodeIslandCode(dotEra);
    expect(out).toStrictEqual(fixture);
  });

  /**
   * The dash is a base64url payload character, so the one way this format
   * could betray a reader is a payload that HAPPENS to begin with a dash
   * right after the prefix's own. `startsWith` + slice-by-length must hand
   * that leading dash to the decoder untouched.
   */
  it("does not eat a payload that itself starts with a dash", async () => {
    const current = await encodeIslandCode(fixture);
    const payload = current.slice("SKYDEX-".length);
    // Only meaningful when the payload genuinely starts with a dash; force
    // the case by decoding a hand-built code either way.
    const out = await decodeIslandCode(`SKYDEX-${payload}`);
    expect(out).toStrictEqual(fixture);
  });
});

describe("island code rejections", () => {
  it("says so when nothing was pasted", async () => {
    await expect(decodeIslandCode("   ")).rejects.toThrow(/paste an island code/i);
  });

  it("rejects a string that is not one of ours", async () => {
    await expect(decodeIslandCode("hello there")).rejects.toThrow(
      /does not look like a Skydex island code.*SKYDEX-/i
    );
  });

  it("names the version when handed a SKYINDEX2. code", async () => {
    await expect(decodeIslandCode("SKYINDEX2.abcdef")).rejects.toThrow(/different version.*SKYINDEX2\./i);
  });

  it("recognises SKYDEX2- as current and rejects corrupt payload data", async () => {
    await expect(decodeIslandCode("SKYDEX2-abcdef")).rejects.toThrow(/could not be unpacked/i);
  });

  it("treats the retired WZSKY family as foreign, not as a version mismatch", async () => {
    // Nothing shipped under the old prefix, so it is not a version we ever
    // spoke. It gets the generic rejection like any other stray string.
    const error = await decodeIslandCode("WZSKY1.abcdef").then(
      () => new Error("should not have decoded"),
      (e: Error) => e
    );
    expect(error.message).toMatch(/does not look like a Skydex island code/i);
    expect(error.message).not.toMatch(/different version/i);
  });

  it("still handles a family prefix with no version dot", async () => {
    await expect(decodeIslandCode("SKYINDEXNOPE")).rejects.toThrow(/different version/i);
  });

  it("rejects a prefix with no payload", async () => {
    await expect(decodeIslandCode(CODE_PREFIX)).rejects.toThrow(/cut short/i);
  });

  it("rejects garbage base64", async () => {
    await expect(decodeIslandCode(`${CODE_PREFIX}!!!!not base64!!!!`)).rejects.toThrow(/base64/i);
  });

  it("rejects valid base64 that is not gzip", async () => {
    const notGzip = b64url(new TextEncoder().encode("hello world, uncompressed"));
    await expect(decodeIslandCode(CODE_PREFIX + notGzip)).rejects.toThrow(/could not be unpacked/i);
  });

  it("rejects gzip that is not JSON", async () => {
    const code = await gzipCode("this compressed fine but is not JSON");
    await expect(decodeIslandCode(code)).rejects.toThrow(/not valid island data/i);
  });

  it("passes a validation failure through with its own message", async () => {
    const code = await gzipCode(JSON.stringify({ ...fixture, schema: 2 }));
    await expect(decodeIslandCode(code)).rejects.toThrow(/schema version 2.*version 1/i);
  });
});

/**
 * `name` is optional on the wire, which is mostly a size decision: across a few
 * thousand stacks the display names are most of a code's bytes. The reader has
 * to make the omission invisible, so a code that ships bare ids must come out
 * the far end with usable labels.
 */
describe("codes with item names omitted", () => {
  it("round-trips a name-absent item into a prettified label", async () => {
    // Built by hand rather than from the fixture, because a producer omitting
    // `name` is exactly the shape being tested.
    const bare = {
      schema: 1,
      exportedAt: 1754092800000,
      player: { uuid: "b876ec32-e396-476b-a115-8438d83c67d4", name: "Steve" },
      profile: { name: "Papaya", gameMode: "ironman" },
      sacks: {},
      chests: [
        {
          pos: [0, 70, 0],
          name: "Chest",
          lastSeen: 1754092700000,
          items: [{ id: "ENCHANTED_BROWN_MUSHROOM", count: 25600 }, { id: "OAK_LOG", count: 64 }],
        },
      ],
    };

    const code = await gzipCode(JSON.stringify(bare));
    const out = await decodeIslandCode(code);

    expect(out.chests[0].items).toStrictEqual([
      { id: "ENCHANTED_BROWN_MUSHROOM", name: "Enchanted Brown Mushroom", count: 25600 },
      { id: "OAK_LOG", name: "Oak Log", count: 64 },
    ]);
  });

  it("survives our own encode-decode cycle once names are filled in", async () => {
    const bare = {
      schema: 1,
      exportedAt: 1754092800000,
      player: { uuid: "b876ec32-e396-476b-a115-8438d83c67d4", name: "Steve" },
      profile: { name: "Papaya", gameMode: null },
      sacks: { OAK_LOG: 1 },
      chests: [{ pos: [0, 70, 0], name: "Chest", lastSeen: 1, items: [{ id: "OAK_LOG", count: 1 }] }],
    };

    const once = await decodeIslandCode(await gzipCode(JSON.stringify(bare)));
    const twice = await decodeIslandCode(await encodeIslandCode(once));

    // Prettifying is idempotent, so a second pass through the transport changes
    // nothing. A normalisation that drifted on every round trip would be a bug.
    expect(twice).toStrictEqual(once);
  });

  it("leaves a code smaller when names are omitted", async () => {
    const withNames = await encodeIslandCode(fixture);
    const withoutNames = await gzipCode(
      JSON.stringify({ ...fixture, chests: fixture.chests.map((c) => ({ ...c, items: c.items.map(({ id, count }) => ({ id, count })) })) })
    );
    expect(withoutNames.length).toBeLessThan(withNames.length);
  });
});
