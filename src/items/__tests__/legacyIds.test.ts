import { describe, it, expect } from "vitest";
import { legacyItemName, legacyWikiTitle, splitLegacyId } from "../legacyIds";
import { prettify } from "../../island/format";
import { itemDisplayName, nameLadder } from "../wikiImages";

/**
 * The fixture list is real data. Every string in the "reported" block below
 * was actually seen rendered wrong on a live island, so these are
 * regression tests in the strict sense rather than invented cases.
 *
 * Two properties matter more than any individual mapping, and each gets its
 * own block at the bottom:
 *
 *   1. ADDITIVE. An id the table does not know must come out of `prettify`
 *      byte-identical to what it produced before this module existed. The
 *      point of the fix is that it can only improve a name, never degrade one,
 *      and that is only true if the fallback is genuinely untouched.
 *
 *   2. ONE NAME PATH. The corrected name has to travel the same route the
 *      mangled one did, so the icon ladder resolves from it with no second
 *      code path to keep in step.
 */

describe("splitLegacyId", () => {
  it("splits on the colon and reads the damage value", () => {
    expect(splitLegacyId("INK_SACK:4")).toEqual({ base: "INK_SACK", damage: 4 });
    expect(splitLegacyId("RED_ROSE:5")).toEqual({ base: "RED_ROSE", damage: 5 });
    expect(splitLegacyId("STAINED_GLASS:11")).toEqual({ base: "STAINED_GLASS", damage: 11 });
  });

  /**
   * The whole reason this function exists. `LOG_2` is its own id, so a digit
   * after an underscore is part of the name and only a colon introduces a
   * damage value.
   */
  it("never mistakes an underscore digit for a damage value", () => {
    expect(splitLegacyId("LOG_2")).toEqual({ base: "LOG_2", damage: 0 });
    expect(splitLegacyId("LOG_2:1")).toEqual({ base: "LOG_2", damage: 1 });

    // The two that would collide under a sloppier split, kept apart.
    expect(legacyItemName("LOG_2")).toBe("Acacia Log");
    expect(legacyItemName("LOG:2")).toBe("Birch Log");
    expect(legacyItemName("LOG_2:1")).toBe("Dark Oak Log");
  });

  it("treats a bare id and damage zero as the same item", () => {
    expect(splitLegacyId("POTATO_ITEM")).toEqual({ base: "POTATO_ITEM", damage: 0 });
    expect(legacyItemName("INK_SACK:0")).toBe(legacyItemName("INK_SACK"));
  });

  it("leaves a non-numeric tail alone rather than carving up the id", () => {
    expect(splitLegacyId("SOME_ID:VARIANT")).toEqual({ base: "SOME_ID:VARIANT", damage: 0 });
    expect(splitLegacyId("PET:GOLDEN_DRAGON")).toEqual({ base: "PET:GOLDEN_DRAGON", damage: 0 });
  });

  it("tolerates surrounding whitespace", () => {
    expect(splitLegacyId("  LOG_2:1  ")).toEqual({ base: "LOG_2", damage: 1 });
  });
});

describe("legacyItemName, by class", () => {
  it("maps the dye range", () => {
    expect(legacyItemName("INK_SACK:4")).toBe("Lapis Lazuli");
    expect(legacyItemName("INK_SACK")).toBe("Ink Sac");
    expect(legacyItemName("INK_SACK:1")).toBe("Rose Red");
    expect(legacyItemName("INK_SACK:2")).toBe("Cactus Green");
    expect(legacyItemName("INK_SACK:3")).toBe("Cocoa Beans");
    expect(legacyItemName("INK_SACK:11")).toBe("Dandelion Yellow");
    expect(legacyItemName("INK_SACK:14")).toBe("Orange Dye");
  });

  it("maps both wood ids", () => {
    expect(legacyItemName("LOG")).toBe("Oak Log");
    expect(legacyItemName("LOG:1")).toBe("Spruce Log");
    expect(legacyItemName("LOG:3")).toBe("Jungle Log");
    expect(legacyItemName("LOG_2:1")).toBe("Dark Oak Log");
  });

  it("maps the flowers", () => {
    expect(legacyItemName("RED_ROSE")).toBe("Poppy");
    expect(legacyItemName("RED_ROSE:5")).toBe("Orange Tulip");
    expect(legacyItemName("RED_ROSE:8")).toBe("Oxeye Daisy");
    expect(legacyItemName("YELLOW_FLOWER")).toBe("Dandelion");
  });

  it("maps the tall plants", () => {
    expect(legacyItemName("DOUBLE_PLANT")).toBe("Sunflower");
    expect(legacyItemName("DOUBLE_PLANT:5")).toBe("Peony");
    expect(legacyItemName("DOUBLE_PLANT:4")).toBe("Rose Bush");
  });

  it("maps the fish", () => {
    expect(legacyItemName("RAW_FISH")).toBe("Raw Cod");
    expect(legacyItemName("RAW_FISH:1")).toBe("Raw Salmon");
    expect(legacyItemName("RAW_FISH:3")).toBe("Pufferfish");
  });

  it("maps the renamed ids that carry no damage value", () => {
    expect(legacyItemName("POTATO_ITEM")).toBe("Potato");
    expect(legacyItemName("CARROT_ITEM")).toBe("Carrot");
    expect(legacyItemName("SULPHUR")).toBe("Gunpowder");
  });

  it("maps every gemstone quality across every gem", () => {
    expect(legacyItemName("ROUGH_SAPPHIRE_GEM")).toBe("Rough Sapphire Gemstone");
    expect(legacyItemName("FLAWED_JADE_GEM")).toBe("Flawed Jade Gemstone");
    expect(legacyItemName("FINE_AMBER_GEM")).toBe("Fine Amber Gemstone");
    expect(legacyItemName("FLAWLESS_RUBY_GEM")).toBe("Flawless Ruby Gemstone");
    expect(legacyItemName("PERFECT_TOPAZ_GEM")).toBe("Perfect Topaz Gemstone");

    const gems = ["Amber", "Amethyst", "Aquamarine", "Citrine", "Jade", "Jasper",
      "Onyx", "Opal", "Peridot", "Ruby", "Sapphire", "Topaz"];
    const tiers = ["Rough", "Flawed", "Fine", "Flawless", "Perfect"];
    let mapped = 0;
    for (const gem of gems) {
      for (const tier of tiers) {
        const id = `${tier.toUpperCase()}_${gem.toUpperCase()}_GEM`;
        expect(legacyItemName(id)).toBe(`${tier} ${gem} Gemstone`);
        mapped++;
      }
    }
    expect(mapped).toBe(60);
  });

  it("accepts a lower-cased id, which is what page fallbacks carry", () => {
    expect(legacyItemName("ink_sack:4")).toBe("Lapis Lazuli");
    expect(legacyItemName("potato_item")).toBe("Potato");
  });
});

describe("legacyItemName, on what it refuses to guess", () => {
  /**
   * Hypixel's item table stops at `INK_SACK:14` and `LOG:3`. The vanilla game
   * has more damage values in both ranges, but a name we cannot source is a
   * name we do not invent, because the player will act on it.
   */
  it("leaves a damage value Hypixel does not list unmapped", () => {
    expect(legacyItemName("INK_SACK:15")).toBeNull();
    expect(legacyItemName("INK_SACK:99")).toBeNull();
    expect(legacyItemName("LOG:4")).toBeNull();
    expect(legacyItemName("LOG_2:2")).toBeNull();
    expect(legacyItemName("DOUBLE_PLANT:6")).toBeNull();
    expect(legacyItemName("RAW_FISH:4")).toBeNull();
  });

  it("leaves an id merely shaped like a gemstone unmapped", () => {
    expect(legacyItemName("ROUGH_UNOBTAINIUM_GEM")).toBeNull();
    expect(legacyItemName("SHINY_RUBY_GEM")).toBeNull();
    expect(legacyItemName("RUBY_GEM")).toBeNull();
    expect(legacyItemName("ROUGH_RUBY_GEM_EXTRA")).toBeNull();
  });

  it("leaves an ordinary modern id alone", () => {
    expect(legacyItemName("ENCHANTED_BREAD")).toBeNull();
    expect(legacyItemName("HYPERION")).toBeNull();
    expect(legacyItemName("")).toBeNull();
  });
});

describe("prettify routes legacy ids through the one name path", () => {
  /** The "was" strings are exactly what rendered before the fix. */
  it("fixes every name reported as mangled", () => {
    expect(prettify("INK_SACK:4")).toBe("Lapis Lazuli"); // was "Ink Sack 4"
    expect(prettify("LOG_2:1")).toBe("Dark Oak Log"); // was "Log 2 1"
    expect(prettify("POTATO_ITEM")).toBe("Potato"); // was "Potato Item"
    expect(prettify("RED_ROSE:5")).toBe("Orange Tulip"); // was "Red Rose 5"
    expect(prettify("DOUBLE_PLANT:5")).toBe("Peony"); // was "Double Plant 5"
    expect(prettify("ROUGH_SAPPHIRE_GEM")).toBe("Rough Sapphire Gemstone"); // was "Rough Sapphire Gem"
  });

  /**
   * The additive guarantee. These are the exact strings the old title-caser
   * produced, asserted literally, so a regression that "improves" an unmapped
   * id fails here rather than shipping.
   */
  it("leaves an unmapped id exactly as it was before", () => {
    expect(prettify("ENCHANTED_BROWN_MUSHROOM")).toBe("Enchanted Brown Mushroom");
    expect(prettify("ENCHANTED_BREAD")).toBe("Enchanted Bread");
    expect(prettify("HYPERION")).toBe("Hyperion");
    expect(prettify("juju_shortbow")).toBe("Juju Shortbow");

    // Still ugly, still unchanged, because we do not know these two.
    expect(prettify("INK_SACK:15")).toBe("Ink Sack 15");
    expect(prettify("LOG:4")).toBe("Log 4");
  });

  it("carries the correction into the icon layer's display name", () => {
    expect(itemDisplayName(undefined, "INK_SACK:4")).toBe("Lapis Lazuli");
    expect(itemDisplayName("INK_SACK:4")).toBe("Lapis Lazuli");
    expect(itemDisplayName(undefined, "LOG_2:1")).toBe("Dark Oak Log");

    // A real display name still wins over the id, as it always did.
    expect(itemDisplayName("Dark Oak Log", "LOG_2:1")).toBe("Dark Oak Log");
  });
});

describe("the icon ladder, on legacy names", () => {
  /**
   * The mangled name could never resolve, because no `Ink_Sack_4.png` exists.
   * The corrected one is rung zero, which is the cheapest rung there is.
   */
  it("puts the corrected name at the top of the ladder", () => {
    expect(nameLadder(prettify("INK_SACK:4"))[0]).toBe("Lapis Lazuli");
    expect(nameLadder(prettify("LOG_2:1"))[0]).toBe("Dark Oak Log");
    expect(nameLadder(prettify("INK_SACK:4"))).not.toContain("Ink Sack 4");
  });

  it("falls a gemstone back to the gem's own article", () => {
    expect(nameLadder("Rough Sapphire Gemstone")).toEqual(["Rough Sapphire Gemstone", "Sapphire Gemstone"]);
    expect(nameLadder("Perfect Topaz Gemstone")).toEqual(["Perfect Topaz Gemstone", "Topaz Gemstone"]);
  });

  it("works from a mod-supplied gemstone name, decoration and all", () => {
    // Verbatim from a live island snapshot, where the game puts a private-use
    // glyph from its own font in front of this one. Written as an escape so
    // the character survives an editor that will not render it.
    const decorated = "\uE010 Flawless Ruby Gemstone";
    expect(nameLadder(decorated)).toContain("Flawless Ruby Gemstone");
    expect(nameLadder(decorated)).toContain("Ruby Gemstone");
  });

  it("does not add a rung to anything that is not a gemstone", () => {
    expect(legacyWikiTitle("Aspect of the Dragons")).toBeNull();
    expect(legacyWikiTitle("Rough Unobtainium Gemstone")).toBeNull();
    expect(legacyWikiTitle("Sapphire Gemstone")).toBeNull();
    expect(nameLadder("Hyperion")).toEqual(["Hyperion"]);
  });
});
