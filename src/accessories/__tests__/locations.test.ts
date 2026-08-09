import { describe, it, expect } from "vitest";
import {
  classifyLocationPage,
  groupFromLocation,
  parseLocationSignals,
  signalTitle,
  type LocationIndex,
} from "../locations";
import { groupOf } from "../grouping";
import type { CheckedRequirement } from "../requirements";

/**
 * Classifying an accessory by WHERE YOU GET IT.
 *
 * The idea: where do you buy them? From the Great Harvest? That is farming.
 * Lotus Atoll? That is fishing. The wiki exposes all of it; the information
 * only has to be pulled.
 *
 * WHY THESE TESTS ARE SHAPED THE WAY THEY ARE
 * -------------------------------------------
 * Measured against the live wiki, the first working version of this layer moved
 * 117 accessories out of Other and a large minority of those moves were WRONG:
 * Rings of Love and Voter's Badges filed under Mining, the Combat Merchant
 * filed under Farming, every Glacial accessory filed under Fishing. A wrong
 * activity is worse than no activity, because it sends a player to the wrong
 * island for an evening.
 *
 * So the weight here is not on the happy path. Every case below that says NOT
 * is a real misclassification that was measured, diagnosed and fixed, and it is
 * pinned so it cannot come back quietly.
 *
 * The fixtures are short structural excerpts of the real articles, each cited
 * to the page it came from. Nothing wiki-derived is bundled with the app; these
 * are the shapes the parser has to survive, not content.
 */

/* -------------------------------------------------------------------------- */
/* Reading the names out of an accessory article                              */
/* -------------------------------------------------------------------------- */

describe("parseLocationSignals", () => {
  it("reads the merchant an editor filled into the infobox", () => {
    // Candy Talisman. `|merchant =` is the single most reliable signal there
    // is, and it is a machine-readable claim rather than a parsed sentence.
    const article = `{{Exclusive/Spooky}}\n{{Infobox/Accessory\n|id = CANDY_TALISMAN\n|merchant = Fear Mongerer\n|buy = {{RD|16 Green Candy}}\n}}\n`;
    expect(parseLocationSignals(article)).toContain("npc:Fear Mongerer");
  });

  it("does not read `merchant = n` as an NPC called n", () => {
    const article = `{{Infobox/Accessory\n|id = THING\n|merchant = n\n}}\n`;
    expect(parseLocationSignals(article)).toEqual([]);
  });

  it("ignores names that appear only in trivia", () => {
    /*
     * Kuudra's Heart, near enough verbatim. This sentence is about who
     * suggested the item, and reading it filed a Crimson Isle combat accessory
     * under a mayoral candidate. The Potato Ring carries the same sentence,
     * which is the proof that no single activity was ever behind it.
     */
    const article =
      `{{Infobox/Accessory\n|id = KUUDRAS_HEART\n}}\n` +
      `'''Kuudra's Heart''' is an accessory.\n\n` +
      `== Trivia ==\n* This item was created by a player after becoming a Minister for {{NPCSprite|Candidate Aura;Aura}}.\n`;
    expect(parseLocationSignals(article)).toEqual([]);
  });

  it("ignores a zone named as a landmark rather than a source", () => {
    // Bits Talisman. "was briefly placeable on a Private Island" is not where
    // the item comes from, and reading it made the Bits Talisman a farming item.
    const article =
      `{{Infobox/Accessory\n|id = BITS_TALISMAN\n}}\n` +
      `== Trivia ==\n* For a short time this talisman was placeable on a {{Zone|Private Island}}.\n`;
    expect(parseLocationSignals(article)).toEqual([]);
  });

  it("drops a clause that only offers the item back to you", () => {
    /*
     * The single biggest measured error. Rusty stands in the Gold Mine and
     * sells back one-time quest rewards, so 34 accessories name him. Routing
     * them through where he stands filed Rings of Love, Voter's Badges and
     * Organ Donor under Mining, and the Gold Mine half of the sentence is just
     * as misleading as the Rusty half, which is why the whole clause goes.
     */
    const article =
      `{{Infobox/Accessory\n|id = RING_OF_LOVE\n}}\n` +
      `== Obtaining ==\n* Once unlocked, you can buy the tier you are on from {{NPCSprite|Rusty}} in the {{Zone|Gold Mine}}.\n`;
    expect(parseLocationSignals(article)).toEqual([]);
  });

  it("still reads a genuine source in the obtaining section", () => {
    const article =
      `{{Infobox/Accessory\n|id = JUNK_TALISMAN\n}}\n` +
      `== Obtaining ==\n=== Shop Purchase ===\nSold by {{NPCSprite|Junker Joel}} in the {{Zone|Backwater Bayou}}.\n`;
    const signals = parseLocationSignals(article);
    expect(signals).toContain("npc:Junker Joel");
    expect(signals).toContain("zone:Backwater Bayou");
  });

  it("keeps a zone and an NPC of the same name apart", () => {
    expect(signalTitle("npc:Anita")).toBe("Anita");
    expect(signalTitle("zone:The Garden")).toBe("The Garden");
  });
});

/* -------------------------------------------------------------------------- */
/* The mapping table: merchant or location -> activity, each one cited         */
/* -------------------------------------------------------------------------- */

/**
 * Every fixture below is an excerpt of the page named in the comment, and that
 * page IS the citation: nothing here is a hand-written opinion about what an
 * NPC does. The classifier reads the article, and a page that says nothing
 * recognisable leaves its accessories in Other.
 */
describe("classifyLocationPage: the two canonical examples", () => {
  it("Lotus Atoll is fishing", () => {
    // [[Lotus Atoll]]. The second example, and it is a real article: an
    // island reached from the Backwater Bayou with Lotusfish in it.
    const page =
      `{{Infobox/Location\n|prev_location=[[Backwater Bayou]]\n|sublocations = * [[Lotus Highlands]]\n|mobs = * Lotusfish\n}}\n` +
      `The '''Lotus Atoll''' is an island past the Backwater Bayou.\n`;
    expect(classifyLocationPage(page)).toBe("fishing");
  });

  it("Anita and The Garden are farming", () => {
    /*
     * The first example, "the Great Harvest", is NOT an article on
     * this wiki: searching it returns Farmer Rigby, Dreadfarm and Farmhand. So
     * the farming exemplars pinned here are the pages the farming accessories
     * actually cite. Anita runs Jacob's contests and SkyMart redirects to The
     * Garden, which is how the idea shows up in the real data.
     */
    const anita =
      `{{Infobox/Character\n|shop = yes\n|location = [[Farmhouse]]\n}}\n` +
      `'''Anita''' sells unique [[Farming]] related items.\n[[Category:Farming]]\n`;
    expect(classifyLocationPage(anita)).toBe("farming");

    const garden =
      `{{Infobox/Location\n|prev_location = [[Private Island]]\n}}\n` +
      `The Garden is an island where players can farm.\n[[Category:Garden]]\n`;
    expect(classifyLocationPage(garden)).toBe("farming");
  });
});

describe("classifyLocationPage: what the editors filed the page under", () => {
  it("reads a category as the strongest claim a page makes", () => {
    const mining = `The '''Dwarven Mines'''.\n[[Category:Mining]]\n[[Category:Locations]]\n`;
    expect(classifyLocationPage(mining)).toBe("mining");

    // [[Argofay Bugshopper]], a Rift merchant in the Wyld Woods.
    const rift = `The '''Argofay Bugshopper''' sells things.\n[[Category:Rift Dimension]]\n`;
    expect(classifyLocationPage(rift)).toBe("rift");

    // [[Simon]], who appears for the SkyBlock Anniversary.
    const event = `'''Simon''' appears during the SkyBlock Anniversary.\n[[Category:Events]]\n`;
    expect(classifyLocationPage(event)).toBe("event");
  });

  it("reads the location type an infobox states outright", () => {
    // [[Spider's Den]] and [[Murkwater Loch]] both state their purpose in the
    // infobox, which is immune to how the surrounding prose is worded.
    const den = `{{Infobox/Location\n|type = [[Combat]] location\n|travel_scroll = [[Travel Scroll to Spider's Den]]\n}}\n`;
    expect(classifyLocationPage(den)).toBe("combat");

    const loch = `{{Infobox/Location\n|id = murkwater_loch\n|type=[[Foraging]] location\n}}\n`;
    expect(classifyLocationPage(loch)).toBe("foraging");

    // [[Crimson Isle]] writes the same claim through a skill template.
    const crimson = `{{Infobox/Location\n|type = {{Skl|Combat|Island}}\n|sublocations = *[[Dojo]]\n}}\n`;
    expect(classifyLocationPage(crimson)).toBe("combat");
  });

  it("reads Rift membership from the infobox rather than from the word woods", () => {
    // [[Wyld Woods]]. The Rift's own village is in a wood, which is exactly how
    // 11 Rift accessories were filed under Foraging.
    const page = `{{Infobox/Location\n|id=wyld_woods\n|mobs=* Odonata\n|location = [[Rift Dimension]]\n}}\n`;
    expect(classifyLocationPage(page)).toBe("rift");
  });

  it("reads what a merchant deals in when they say so", () => {
    // [[Agatha]] on Galatea, and [[Moby]], who both describe their own stock.
    const agatha = `{{Infobox/Character\n|location = [[Murkwater Loch]]\n|location_page_description = Hosts contests and sells various {{Skill|Foraging}}-related items.\n}}\n`;
    expect(classifyLocationPage(agatha)).toBe("foraging");

    const moby = `{{Infobox/Character\n|location_page_description = Also sells various {{Skill|Fishing}}-related items.\n}}\n`;
    expect(classifyLocationPage(moby)).toBe("fishing");
  });
});

describe("classifyLocationPage: the contexts that hijack every other vocabulary", () => {
  it("calls Jerry's Workshop an event and NOT fishing", () => {
    // [[Jerry's Workshop]]. There is fishing on the Winter Island, and reading
    // that filed every Glacial accessory under Fishing. The season is the wall.
    const page =
      `'''Jerry's Workshop''', also known as the '''Winter Island''', is an island open during Late Winter.\n` +
      `Players can go fishing in the Glacial Cave.\n`;
    expect(classifyLocationPage(page)).toBe("event");
  });

  it("calls the Fear Mongerer an event and NOT fishing", () => {
    // [[Fear Mongerer]], who trades during the Spooky Festival.
    const page = `The '''Fear Mongerer''' is an [[NPC]] located in the Village during the [[Spooky Festival]]. They sell items in exchange for Candy.\n`;
    expect(classifyLocationPage(page)).toBe("event");
  });

  it("calls a Rift NPC rift and NOT foraging", () => {
    // [[Inverted Sirius]], who stands in the Wyld Woods.
    const page = `{{Infobox/Character\n|location = [[Wyld Woods]]\n}}\n'''Inverted Sirius''' lets the player transfer items out of the [[Rift]].\n[[Category:Rift Dimension]]\n`;
    expect(classifyLocationPage(page)).toBe("rift");
  });
});

describe("classifyLocationPage: the furniture around the prose", () => {
  it("ignores a zone named in one row of a dialogue table", () => {
    /*
     * [[Combat Merchant]]. His article carries a dialogue table with a row per
     * zone, and `{{zone|The Garden}}` in one of those rows made the NPC who
     * sells mob drops a farming NPC. Six accessories moved on that.
     */
    const page =
      `{{Infobox/Character\n|location = Thaumaturgist\n}}\n` +
      `The '''Combat Merchant''' is an [[NPC]] who sells various mob drops and [[Accessories]].\n\n` +
      `== Dialogue ==\n{| class="wikitable"\n| {{zone|The Garden}} | None |\n|}\n`;
    expect(classifyLocationPage(page)).toBe("combat");
  });

  it("ignores a zone used as a geographical landmark", () => {
    // [[Colosseum]]: "found south of the Fishing Outpost" turned a PvP arena
    // into a fishing location.
    const page =
      `{{Infobox/Location\n|location = [[Hub Island]]\n}}\n` +
      `The '''Colosseum''' is a [[Location]] on the [[Hub Island]] found south of the {{Zone|Fishing Outpost}}. It used to serve as a PvP arena.\n`;
    expect(classifyLocationPage(page)).toBe("combat");
  });

  it("ignores a hatnote pointing at a different page", () => {
    // [[Jacobus]] upgrades the Accessory Bag. His article opens with a hatnote
    // about Jacob, who runs the farming contests, and that made him a farmer.
    const page =
      `{{For|the NPC that runs [[Farming Contest]]s|Jacob}}\n{{Infobox/Character\n|location = [[Thaumaturgist]]\n}}\n` +
      `'''Jacobus''' offers to increase the size of the player's [[Accessory Bag]].\n`;
    expect(classifyLocationPage(page)).toBeNull();
  });

  it("does not read a skill named in a shop table as the merchant's trade", () => {
    // [[Tyashoi Alchemist]], a Halloween quest giver whose shop table mentions
    // Combat. The selling verb is what separates a trade from a table cell.
    const page =
      `'''Tyashoi Alchemist''' is an [[NPC]] in the [[Village]] during real-life Halloween.\n\n` +
      `== Shop ==\n{| class="wikitable"\n! Slot !! Notes\n|-\n| 1 || Requires {{Skill|Combat}} 20\n|}\n`;
    expect(classifyLocationPage(page)).toBe("event");
  });
});

describe("classifyLocationPage: real places that are still not an activity", () => {
  it("leaves a counter that sells back what you already earned unmapped", () => {
    // [[Rusty]]. His own article says what he is, and it is not a miner.
    const page =
      `{{Infobox/Character\n|location = [[Gold Mine]]\n}}\n` +
      `'''Rusty''' is an [[NPC]] located in the Gold Mine. He sells back one-time rewards from quests for a certain amount of coins.\n`;
    expect(classifyLocationPage(page)).toBeNull();
  });

  it("leaves the Dark Auction as its own thing", () => {
    // [[Sirius]] hosts it. The tile already carries a Dark Auction source tag,
    // so folding it into an activity would say less, not more.
    const page = `'''Sirius''' is an [[NPC]] located in the [[Wilderness]]. He hosts the auction.\n[[Category:Dark Auction]]\n`;
    expect(classifyLocationPage(page)).toBeNull();
  });

  it("leaves mayors, cosmetics and races unmapped", () => {
    // [[Candidate Aura]]: a mayoral candidate is an office, not a place.
    expect(classifyLocationPage(`'''Candidate Aura''' was a mayoral candidate.\n[[Category:Mayor]]\n`)).toBeNull();
    // [[Taylor]] sells skins and dyes, which is account state, not an activity.
    expect(
      classifyLocationPage(`'''Taylor''' sells seasonally rotating cosmetics for [[SkyBlock Gems]].\n`)
    ).toBeNull();
    // [[Gustave]] runs the Woods Race. The island is not why the item exists.
    expect(classifyLocationPage(`'''Gustave''' runs a race.\n[[Category:Racing]]\n`)).toBeNull();
  });

  it("does not let an incidental mention veto a real activity", () => {
    /*
     * [[Bingo]] explains that the Auction House, Bazaar, Museum and Gem Shop
     * are DISABLED on Bingo profiles. Reading that as "this page is about a gem
     * shop" unfiled every Bingo accessory, which is why the veto may only read
     * the opening sentences, where an article says what it IS.
     */
    const page =
      `'''Bingo''' is a gamemode playable during the monthly SkyBlock Bingo event.\n` +
      `Players reach milestones on a new profile to gain points.\n` +
      `[[Auction House]], [[Bazaar]], [[Museum]], [[SkyBlock Gems|Gem Shop]] and [[Trading]] are disabled on Bingo profiles.\n`;
    expect(classifyLocationPage(page)).toBe("event");
  });

  it("returns null for a page that says nothing recognisable", () => {
    // The honest outcome, and it happens for 17 of 65 names measured live.
    expect(classifyLocationPage(`'''Lucius''' is an [[NPC]] in the [[Wilderness]].\n`)).toBeNull();
    expect(classifyLocationPage("")).toBeNull();
    expect(classifyLocationPage("   ")).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/* Picking one answer per accessory                                            */
/* -------------------------------------------------------------------------- */

describe("groupFromLocation", () => {
  const index: LocationIndex = { "npc:Anita": "farming", "zone:Backwater Bayou": "fishing" };

  it("takes the first signal that resolves", () => {
    expect(groupFromLocation(["npc:Anita", "zone:Backwater Bayou"], index)).toBe("farming");
    expect(groupFromLocation(["npc:Nobody", "zone:Backwater Bayou"], index)).toBe("fishing");
  });

  it("returns null when nothing resolves", () => {
    expect(groupFromLocation(["npc:Nobody"], index)).toBeNull();
    expect(groupFromLocation([], index)).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/* Where this sits in the order                                                */
/* -------------------------------------------------------------------------- */

const slayer: CheckedRequirement = {
  kind: "slayer",
  target: "Tarantula Broodfather Slayer",
  threshold: "7",
  how: "Level it.",
  raw: "SLAYER",
  state: "unknown",
  have: null,
  gap: null,
};

describe("groupOf: acquisition location is a FALLBACK, never an override", () => {
  const index: LocationIndex = {
    "npc:Combat Merchant": "combat",
    "npc:Anita": "farming",
    "zone:Backwater Bayou": "fishing",
  };

  it("lets a stat block win over where the thing is sold", () => {
    /*
     * The rule that keeps this layer honest. A stat says what an item DOES and
     * a counter only says where it came from, so a farming accessory sold by
     * the Combat Merchant is still a farming accessory.
     */
    expect(
      groupOf({
        checked: [],
        source: "shop",
        stats: { FARMING_FORTUNE: 10 },
        locations: ["npc:Combat Merchant"],
        locationIndex: index,
      })
    ).toBe("farming");
  });

  it("lets a requirement win over both", () => {
    expect(
      groupOf({
        checked: [slayer],
        source: "shop",
        stats: { FARMING_FORTUNE: 10 },
        locations: ["npc:Anita"],
        locationIndex: index,
      })
    ).toBe("combat");
  });

  it("fills the gap when the stats are silent", () => {
    // The whole point: most of the catalogue grants walk speed or nothing at
    // all, and the counter is then the only evidence there is.
    expect(
      groupOf({ checked: [], source: "shop", stats: null, locations: ["npc:Anita"], locationIndex: index })
    ).toBe("farming");

    expect(
      groupOf({
        checked: [],
        source: "shop",
        stats: { WALK_SPEED: 2 },
        locations: ["zone:Backwater Bayou"],
        locationIndex: index,
      })
    ).toBe("fishing");
  });

  it("never guesses: an unmapped name leaves the accessory in Other", () => {
    expect(
      groupOf({ checked: [], source: "shop", stats: null, locations: ["npc:Nobody"], locationIndex: index })
    ).toBe("other");

    // And with no location data at all, which is what every caller that has not
    // been given an index sees.
    expect(groupOf({ checked: [], source: "shop", stats: null })).toBe("other");
    expect(groupOf({ checked: [], source: "shop", stats: null, locations: ["npc:Anita"] })).toBe("other");
  });

  it("still prefers a seasonal source to Other when no name resolves", () => {
    expect(
      groupOf({ checked: [], source: "event", stats: null, locations: ["npc:Nobody"], locationIndex: index })
    ).toBe("event");
  });
});
