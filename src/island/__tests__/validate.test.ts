import { describe, expect, it } from "vitest";
import { validateSnapshot } from "../validate";

/**
 * Structural validation.
 *
 * Two behaviours matter more than the rest and are tested hardest: unknown
 * fields must never reach the output (that is the forward-compatibility promise
 * to the mod), and an omitted section must never become an empty one (that is
 * the promise to the player that "not captured" and "you own none" look
 * different on screen).
 */

const minimal = {
  schema: 1,
  exportedAt: 1754092800000,
  player: { uuid: "u", name: "Steve" },
  profile: { name: "Papaya", gameMode: "ironman" },
  sacks: {},
  chests: [],
};

describe("validateSnapshot acceptance", () => {
  it("normalises a minimal snapshot", () => {
    const out = validateSnapshot(minimal);
    expect(out.schema).toBe(1);
    expect(out.exportedAt).toBe(1754092800000);
    expect(out.player).toStrictEqual({ uuid: "u", name: "Steve" });
    expect(out.profile).toStrictEqual({ name: "Papaya", gameMode: "ironman" });
    expect(out.chests).toStrictEqual([]);
  });

  it("ignores unknown fields instead of copying them through", () => {
    const out = validateSnapshot({
      ...minimal,
      futureField: { anything: true },
      pets: [{ id: "BEE" }],
      chests: [{ pos: [1, 2, 3], name: "Chest", lastSeen: 5, items: [], tier: "future" }],
      inventory: [{ id: "OAK_LOG", name: "Oak Log", count: 3, enchantments: { growth: 5 } }],
    });

    expect(Object.keys(out).sort()).toStrictEqual(
      ["chests", "exportedAt", "inventory", "player", "profile", "sacks", "schema"].sort()
    );
    expect("futureField" in out).toBe(false);
    expect("pets" in out).toBe(false);
    expect(Object.keys(out.chests[0]).sort()).toStrictEqual(["items", "lastSeen", "name", "pos"]);
    expect(out.inventory?.[0]).toStrictEqual({ id: "OAK_LOG", name: "Oak Log", count: 3 });
  });

  it("keeps an omitted section undefined and an empty one empty", () => {
    const out = validateSnapshot({ ...minimal, enderChest: [] });
    expect(out.enderChest).toStrictEqual([]);
    expect("enderChest" in out).toBe(true);
    expect(out.inventory).toBeUndefined();
    expect("inventory" in out).toBe(false);
    expect(out.storage).toBeUndefined();
    expect("storage" in out).toBe(false);
  });

  it("treats a malformed optional section as not captured, never as empty", () => {
    // "Your ender chest is empty" on the strength of a broken field is the one
    // lie the whole no-data/verified-empty rule exists to prevent.
    const out = validateSnapshot({ ...minimal, enderChest: "oops" });
    expect(out.enderChest).toBeUndefined();
    expect("enderChest" in out).toBe(false);
  });

  it("defaults soft scalars rather than rejecting the snapshot over them", () => {
    const out = validateSnapshot({
      schema: 1,
      exportedAt: 1,
      player: {},
      profile: { name: "Papaya" },
      sacks: {},
      chests: [],
    });
    expect(out.player).toStrictEqual({ uuid: "", name: "" });
    expect(out.profile.gameMode).toBeNull();
  });

  it("drops malformed sack entries and keeps the good ones", () => {
    const out = validateSnapshot({
      ...minimal,
      sacks: {
        OAK_LOG: 4096,
        BAD_STRING: "lots",
        BAD_NEGATIVE: -5,
        BAD_NAN: Number.NaN,
        BAD_NULL: null,
        NUMERIC_STRING: "128",
      },
    });
    expect(out.sacks).toStrictEqual({ OAK_LOG: 4096, NUMERIC_STRING: 128 });
  });

  it("drops malformed chests without failing the whole snapshot", () => {
    const out = validateSnapshot({
      ...minimal,
      chests: [
        { pos: [1, 2, 3], name: "Good", lastSeen: 10, items: [{ id: "OAK_LOG", name: "Oak Log", count: 1 }] },
        { name: "No position", items: [] },
        { pos: [1, "x", 3], name: "Bad position", items: [] },
        "not even an object",
        null,
        { pos: [4, 5, 6], items: [{ id: "COBBLESTONE", count: 64 }, { name: "No id", count: 1 }] },
      ],
    });

    expect(out.chests).toHaveLength(2);
    expect(out.chests[0].name).toBe("Good");
    // Name defaults, timestamp defaults, the id-less item row is dropped and the
    // name-less one gets its id prettified into a label.
    expect(out.chests[1].name).toBe("Chest");
    expect(out.chests[1].lastSeen).toBe(0);
    expect(out.chests[1].items).toStrictEqual([{ id: "COBBLESTONE", name: "Cobblestone", count: 64 }]);
  });
});

/**
 * `name` became optional to keep clipboard codes small: producers
 * omit it whenever it would just be the title-cased id, and only ship one when
 * it genuinely differs, as with reforges, stars and renamed items.
 *
 * The reader has to make that invisible. A missing name is ordinary input, and
 * the prettified id has to reach the UI because the wiki icon URL is derived
 * from the name, so leaving a raw id in there would cost the item its picture
 * as well as its label.
 */
describe("optional item names", () => {
  const chestWith = (items: unknown[]) => ({
    ...minimal,
    chests: [{ pos: [1, 2, 3], name: "Chest", lastSeen: 10, items }],
  });

  it("prettifies the id when a chest item has no name", () => {
    const out = validateSnapshot(chestWith([{ id: "ENCHANTED_BROWN_MUSHROOM", count: 25600 }]));
    expect(out.chests[0].items[0]).toStrictEqual({
      id: "ENCHANTED_BROWN_MUSHROOM",
      name: "Enchanted Brown Mushroom",
      count: 25600,
    });
  });

  it("treats an empty-string name the same as an absent one", () => {
    const out = validateSnapshot(chestWith([{ id: "OAK_LOG", name: "", count: 1 }]));
    expect(out.chests[0].items[0].name).toBe("Oak Log");
  });

  it("keeps a name that genuinely differs from the id", () => {
    // Reforges, stars and renames are exactly why the field still exists.
    const out = validateSnapshot(chestWith([{ id: "HYPERION", name: "Heroic Hyperion ✪✪✪", count: 1 }]));
    expect(out.chests[0].items[0].name).toBe("Heroic Hyperion ✪✪✪");
  });

  it("applies the same rule to inventory, ender chest and storage", () => {
    const out = validateSnapshot({
      ...minimal,
      inventory: [{ id: "ROOKIE_HOE", count: 1 }],
      enderChest: [{ id: "SUPER_COMPACTOR_3000", count: 2 }],
      storage: [{ id: "JUMBO_BACKPACK", count: 1 }],
    });
    expect(out.inventory?.[0].name).toBe("Rookie Hoe");
    expect(out.enderChest?.[0].name).toBe("Super Compactor 3000");
    expect(out.storage?.[0].name).toBe("Jumbo Backpack");
  });

  it("does not reject an item for lacking a name", () => {
    const out = validateSnapshot(chestWith([{ id: "A", count: 1 }, { id: "B", count: 2 }]));
    expect(out.chests[0].items).toHaveLength(2);
  });
});

describe("validateSnapshot rejection", () => {
  it("rejects a non-object", () => {
    expect(() => validateSnapshot("nope")).toThrow(/not a JSON object/i);
    expect(() => validateSnapshot(null)).toThrow(/not a JSON object/i);
  });

  it("rejects a document with no schema version", () => {
    expect(() => validateSnapshot({ exportedAt: 1 })).toThrow(/no schema version/i);
  });

  it("rejects schema 2 and names the version it found", () => {
    expect(() => validateSnapshot({ ...minimal, schema: 2 })).toThrow(/version 2.*only understands version 1/i);
  });

  it("rejects a missing export timestamp", () => {
    expect(() => validateSnapshot({ ...minimal, exportedAt: "yesterday" })).toThrow(/export timestamp/i);
  });

  it("rejects a chests field that is present but not a list", () => {
    expect(() => validateSnapshot({ ...minimal, chests: { a: 1 } })).toThrow(/'chests'.*not a list/i);
  });

  it("tolerates chests being absent entirely", () => {
    const noChests = { schema: 1, exportedAt: 1, player: {}, profile: {}, sacks: {} };
    expect(validateSnapshot(noChests).chests).toStrictEqual([]);
  });
});

/**
 * Structured `extra` arrived to feed a real tooltip.
 *
 * It is optional, and the important half of that word is backwards
 * compatibility: every snapshot and every code produced before it existed has
 * none, and that must stay completely ordinary. Not a warning, and above all
 * not an empty object standing in for it, because "has extra" would then be
 * true for every item that has none.
 */
describe("optional item extra", () => {
  const itemWith = (item: Record<string, unknown>) => {
    const out = validateSnapshot({
      ...minimal,
      chests: [{ pos: [1, 2, 3], name: "Chest", lastSeen: 10, items: [item] }],
    });
    return out.chests[0].items[0];
  };

  it("leaves an item with no extra completely untouched", () => {
    const item = itemWith({ id: "OAK_LOG", count: 64 });
    expect(item).toStrictEqual({ id: "OAK_LOG", name: "Oak Log", count: 64 });
    expect(item.extra).toBeUndefined();
    expect("extra" in item).toBe(false);
  });

  it("reads a full extra", () => {
    const item = itemWith({
      id: "HYPERION",
      name: "Heroic Hyperion",
      count: 1,
      extra: { reforge: "Heroic", stars: 5, ench: { ULTIMATE_WISE: 5, SHARPNESS: 7 }, recomb: true },
    });
    expect(item.extra).toStrictEqual({
      reforge: "Heroic",
      stars: 5,
      ench: { ULTIMATE_WISE: 5, SHARPNESS: 7 },
      recomb: true,
    });
  });

  it("reads a partial extra without inventing the missing fields", () => {
    const item = itemWith({ id: "TERMINATOR", count: 1, extra: { reforge: "Rapid" } });
    expect(item.extra).toStrictEqual({ reforge: "Rapid" });
    expect(item.extra?.stars).toBeUndefined();
    expect(item.extra?.ench).toBeUndefined();
    expect(item.extra?.recomb).toBeUndefined();
  });

  it("ignores unknown keys inside extra without leaking them into typed output", () => {
    const item = itemWith({
      id: "HYPERION",
      count: 1,
      extra: { reforge: "Heroic", futureField: { anything: true }, gemstones: ["RUBY"], powerScroll: "WITHER" },
    });
    expect(item.extra).toStrictEqual({ reforge: "Heroic" });
    expect(Object.keys(item.extra ?? {})).toStrictEqual(["reforge"]);
  });

  it("drops an extra that holds nothing usable rather than storing an empty object", () => {
    // The wire format omits `extra` when empty, so producing `{}` here would
    // invent a distinction the contract does not have.
    for (const extra of [{}, { unknownOnly: 1 }, { reforge: "" }, { stars: 0 }, { ench: {} }, { recomb: false }]) {
      const item = itemWith({ id: "OAK_LOG", count: 1, extra });
      expect(item.extra).toBeUndefined();
      expect("extra" in item).toBe(false);
    }
  });

  it("ignores an extra that is not an object at all", () => {
    for (const extra of ["lots", 42, null, ["a"], true]) {
      expect(itemWith({ id: "OAK_LOG", count: 1, extra }).extra).toBeUndefined();
    }
  });

  it("drops malformed enchant levels but keeps the good ones", () => {
    const item = itemWith({
      id: "ENCHANTED_BOOK",
      count: 1,
      extra: { ench: { BIG_BRAIN: 3, BAD: "lots", NEGATIVE: -1, ALSO_BAD: null, "": 5 } },
    });
    expect(item.extra?.ench).toStrictEqual({ BIG_BRAIN: 3 });
  });

  it("only accepts recomb as a literal true", () => {
    // A truthy 1 or "yes" is a producer bug, and agreeing with it would put a
    // recombobulated marker on an item that is not.
    expect(itemWith({ id: "A", count: 1, extra: { recomb: 1 } }).extra).toBeUndefined();
    expect(itemWith({ id: "A", count: 1, extra: { recomb: "yes" } }).extra).toBeUndefined();
    expect(itemWith({ id: "A", count: 1, extra: { recomb: true } }).extra).toStrictEqual({ recomb: true });
  });

  it("carries extra through the flat sections too", () => {
    const out = validateSnapshot({
      ...minimal,
      inventory: [{ id: "ASPECT_OF_THE_END", count: 1, extra: { reforge: "Withered", stars: 5 } }],
    });
    expect(out.inventory?.[0].extra).toStrictEqual({ reforge: "Withered", stars: 5 });
  });
});

/**
 * `slot` and `extra.skin`, two later additions.
 *
 * Both are optional and both are load-bearing for the container view: `slot`
 * is what lets a chest be drawn as its real shape, and `skin` is the only way
 * to draw the large slice of SkyBlock that is player heads with custom
 * textures. Neither may ever be required, because every snapshot produced
 * before they existed has neither.
 */
describe("optional slot and skin", () => {
  const itemWith = (item: Record<string, unknown>) =>
    validateSnapshot({
      ...minimal,
      chests: [{ pos: [1, 2, 3], name: "Chest", lastSeen: 10, items: [item] }],
    }).chests[0].items[0];

  it("reads a valid slot", () => {
    expect(itemWith({ id: "OAK_LOG", count: 1, slot: 0 }).slot).toBe(0);
    expect(itemWith({ id: "OAK_LOG", count: 1, slot: 53 }).slot).toBe(53);
  });

  it("leaves slot absent when it is missing, so old snapshots pack as before", () => {
    const item = itemWith({ id: "OAK_LOG", count: 1 });
    expect(item.slot).toBeUndefined();
    expect("slot" in item).toBe(false);
  });

  it("drops a nonsense slot rather than clamping it", () => {
    // A wrong slot draws the stack in the wrong cell, which is a quieter and
    // more confusing failure than simply packing it.
    for (const slot of [-1, 1.5, Number.NaN, null, "abc", 100000]) {
      expect(itemWith({ id: "OAK_LOG", count: 1, slot }).slot).toBeUndefined();
    }
  });

  it("coerces a numeric string, consistently with every other number here", () => {
    // Belt and braces on the reader side, the same as counts and sack totals.
    // Not a licence for the producer to send strings.
    expect(itemWith({ id: "OAK_LOG", count: 1, slot: "3" }).slot).toBe(3);
  });

  it("reads a texture hash", () => {
    const hash = "94a02e1a4dcf7a61558c79cdabb4f78ed37ae82f965541b612af088cfcff2b1b";
    expect(itemWith({ id: "PET_ROCK", count: 1, extra: { skin: hash } }).extra?.skin).toBe(hash);
  });

  it("lower-cases a hash so the URL form is stable", () => {
    const upper = "94A02E1A4DCF7A61558C79CDABB4F78ED37AE82F965541B612AF088CFCFF2B1B";
    expect(itemWith({ id: "PET_ROCK", count: 1, extra: { skin: upper } }).extra?.skin).toBe(upper.toLowerCase());
  });

  it("rejects anything that is not a plain hex hash", () => {
    // This value is interpolated into a URL, so a slash or a query character
    // could reshape the request. There is no legitimate hash that needs one.
    for (const skin of [
      "../../etc/passwd",
      "abc",
      "94a02e1a/../../evil",
      "94a02e1a?x=1",
      "http://evil.example/x",
      "zzzz2e1a4dcf7a61558c79cdabb4f78ed37ae82f965541b612af088cfcff2b1b",
      42,
      null,
    ]) {
      expect(itemWith({ id: "PET_ROCK", count: 1, extra: { skin } }).extra?.skin).toBeUndefined();
    }
  });

  it("does not invent an extra just because skin was invalid", () => {
    const item = itemWith({ id: "PET_ROCK", count: 1, extra: { skin: "nope" } });
    expect(item.extra).toBeUndefined();
    expect("extra" in item).toBe(false);
  });

  it("carries slot and skin together through a flat section", () => {
    const hash = "b548678e44f9f62d350c24a3e01907c0545bef66810590333e654bd931c187db";
    const out = validateSnapshot({
      ...minimal,
      inventory: [{ id: "PET_ROCK", count: 1, slot: 8, extra: { skin: hash } }],
    });
    expect(out.inventory?.[0].slot).toBe(8);
    expect(out.inventory?.[0].extra?.skin).toBe(hash);
  });
});
