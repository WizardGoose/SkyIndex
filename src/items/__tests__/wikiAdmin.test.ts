import { describe, it, expect } from "vitest";
import { isTestingItem } from "../wikiAdmin";
import { norm } from "../wikiCrafting";

describe("isTestingItem", () => {
  it("keeps the parser's own /test item/i rule", () => {
    expect(isTestingItem("Test Item Please Ignore")).toBe(true);
    expect(isTestingItem("A test item of some kind")).toBe(true);
  });

  it("reads Hypixel's TEST_ id prefix, which is how the real ones are marked", () => {
    // The one testing item actually in the index today: it rides in on its
    // ACCESSORY category and its name passes no name test at all.
    expect(isTestingItem("Test Bucket Please Ignore", "TEST_BUCKET_PLEASE_IGNORE")).toBe(true);
    expect(isTestingItem("Test Rift Wand", "TEST_WAND_WEAPON")).toBe(true);
  });

  it("never flags a real item that merely contains the word", () => {
    // "Protester's Cap"-shaped names contain 'test' but not 'test item', and a
    // real id never starts TEST_.
    expect(isTestingItem("Protester's Cap", "PROTESTERS_CAP")).toBe(false);
    expect(isTestingItem("Greatest Hoe", null)).toBe(false);
    expect(isTestingItem("Contest Trophy")).toBe(false);
  });
});

describe("admin title matching", () => {
  it("matches by exact normalised title, so a disambiguated page cannot hide the real item", () => {
    // The live list carries "Enchanted Clock (Admin)" and "Dungeon Journal
    // (Admin-only Item)". Normalised they keep their parenthetical, so the
    // real Enchanted Clock's name can never collide with them.
    const names = new Set(["Enchanted Clock (Admin)", "Artifact of Space"].map(norm));
    expect(names.has(norm("Enchanted Clock"))).toBe(false);
    expect(names.has(norm("Artifact of Space"))).toBe(true);
  });
});
