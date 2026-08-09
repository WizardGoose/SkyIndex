import { describe, expect, it } from "vitest";
import { parseTalismanUpgrades } from "../neuUpgrades";

/**
 * The NEU parser, against fixtures shaped like the real file.
 *
 * `constants/misc.json` carries a dozen constants; only `talisman_upgrades`
 * may be read, and its verified shape is id -> the full ascent above that id,
 * stated redundantly from every rung (SPEED_RING repeats the tail of
 * SPEED_TALISMAN's array). The parser's contract is: consecutive pairs become
 * edges, the redundancy dedupes away, and nothing else in the file is touched.
 */

/** Shaped like the live file: other constants present, ascents redundant. */
const MISC = {
  item_types: { SWORD: [] },
  tier_colors: { COMMON: "f" },
  talisman_upgrades: {
    SPEED_TALISMAN: ["SPEED_RING", "SPEED_ARTIFACT", "SPEED_RELIC"],
    SPEED_RING: ["SPEED_ARTIFACT", "SPEED_RELIC"],
    SPEED_ARTIFACT: ["SPEED_RELIC"],
    SHADY_RING: ["CROOKED_ARTIFACT", "SEAL_OF_THE_FAMILY"],
  },
  minions: { COBBLESTONE: 11 },
};

describe("parseTalismanUpgrades", () => {
  it("turns each ascent into consecutive edges", () => {
    const edges = parseTalismanUpgrades(MISC);
    expect(edges).toContainEqual({ fromId: "SPEED_TALISMAN", toId: "SPEED_RING" });
    expect(edges).toContainEqual({ fromId: "SPEED_RING", toId: "SPEED_ARTIFACT" });
    expect(edges).toContainEqual({ fromId: "SPEED_ARTIFACT", toId: "SPEED_RELIC" });
    // The renamed chain the whole wiki layer was built around: NEU states it too.
    expect(edges).toContainEqual({ fromId: "SHADY_RING", toId: "CROOKED_ARTIFACT" });
    expect(edges).toContainEqual({ fromId: "CROOKED_ARTIFACT", toId: "SEAL_OF_THE_FAMILY" });
  });

  it("dedupes the redundant statements of the same chain", () => {
    /*
     * The live file states every chain from every rung, so the SPEED line
     * above contributes six array members that flatten to exactly three
     * edges. Measured on the real file: 299 entries, 422 distinct edges.
     */
    const edges = parseTalismanUpgrades(MISC);
    const speed = edges.filter((e) => e.fromId.startsWith("SPEED") || e.toId.startsWith("SPEED"));
    expect(speed).toHaveLength(3);
  });

  it("reads only talisman_upgrades, whatever else the file carries", () => {
    const edges = parseTalismanUpgrades(MISC);
    expect(edges.some((e) => e.fromId === "COBBLESTONE" || e.fromId === "SWORD")).toBe(false);
  });

  it("drops malformed entries without losing the good ones", () => {
    const edges = parseTalismanUpgrades({
      talisman_upgrades: {
        GOOD_TALISMAN: ["GOOD_RING"],
        NOT_AN_ARRAY: "GOOD_RING",
        MIXED_TALISMAN: ["MIXED_RING", 7, null, "", "MIXED_ARTIFACT"],
        SELF_TALISMAN: ["SELF_TALISMAN"],
      },
    });

    expect(edges).toContainEqual({ fromId: "GOOD_TALISMAN", toId: "GOOD_RING" });
    // The junk members vanish and the chain re-knits around them.
    expect(edges).toContainEqual({ fromId: "MIXED_TALISMAN", toId: "MIXED_RING" });
    expect(edges).toContainEqual({ fromId: "MIXED_RING", toId: "MIXED_ARTIFACT" });
    // A self-upgrade is a typo, not a cycle worth modelling.
    expect(edges.some((e) => e.fromId === e.toId)).toBe(false);
    expect(edges.some((e) => e.fromId === "NOT_AN_ARRAY")).toBe(false);
  });

  it("answers empty for anything that is not the file", () => {
    expect(parseTalismanUpgrades(null)).toStrictEqual([]);
    expect(parseTalismanUpgrades(undefined)).toStrictEqual([]);
    expect(parseTalismanUpgrades("talisman_upgrades")).toStrictEqual([]);
    expect(parseTalismanUpgrades({})).toStrictEqual([]);
    expect(parseTalismanUpgrades({ talisman_upgrades: ["SPEED_RING"] })).toStrictEqual([]);
    expect(parseTalismanUpgrades({ talisman_upgrades: null })).toStrictEqual([]);
  });
});
