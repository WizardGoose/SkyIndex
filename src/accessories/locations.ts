import type { AccessoryGroup } from "./grouping";
// Straight from the module that defines it. `sources.ts` re-exports it for
// compatibility, but `sources.ts` also imports this file, so reading it from
// there is the cycle the move to `wikitext.ts` existed to remove.
import { obtainRegion } from "./wikitext";

/**
 * Where you actually go to get an accessory, and what that says about it.
 *
 * THE KEY INSIGHT
 * ---------------
 * Grouping accessories by their stat block classifies 125 of 407 and leaves 282
 * in an "Other" bucket, which is a useless answer to "show me the farming ones".
 * The fix is to ask where you get the thing: bought at the Great Harvest? That
 * is farming. Lotus Atoll? That is fishing. The wiki exposes all of it; the
 * information only has to be pulled.
 *
 * A stat block says what an item DOES; the counter it is sold at
 * says what part of the game it belongs to, and for the several hundred
 * accessories whose stats are silent that is the only evidence there is.
 *
 * (On those two examples, measured: "Lotus Atoll" is a real article and does
 * resolve to fishing. "Great Harvest" is not an article on this wiki at all --
 * searching it returns Farmer Rigby, Dreadfarm and Farmhand -- so the farming
 * exemplars pinned in the tests are Anita and The Garden, which are the pages
 * the farming accessories actually cite.)
 *
 * NOTHING HERE IS GUESSED
 * -----------------------
 * The tempting shortcut is a hand-written table mapping NPC names to activities
 * from memory. That is the kind of confident invention the rest of this codebase
 * refuses, and across 99 distinct names it would be wrong somewhere.
 *
 * So each name is resolved against ITS OWN wiki article: the Dwarven Mines page
 * carries `[[Category:Mining]]`, Wyld Woods carries `|location = [[Rift
 * Dimension]]`, Anita carries `[[Category:Farming]]`. The classification reads
 * those pages, not our assumptions, and a name whose page says nothing
 * recognisable stays unmapped and leaves its accessory in Other.
 *
 * TWO WAYS THIS WENT WRONG, BOTH MEASURED, BOTH FIXED HERE
 * --------------------------------------------------------
 * A first cut of this file read every `{{Zone}}` and `{{NPCSprite}}` in the
 * whole article and matched location pages on loose prose. It produced 117
 * reclassifications of which a large minority were confidently wrong, which is
 * worse than the Other bucket it was emptying. The two faults are worth keeping
 * written down because both are easy to reintroduce:
 *
 *   1. TRIVIA IS NOT AN ACQUISITION. "Kuudra's Heart was created by a YouTuber
 *      after becoming a Minister for Candidate Aura" put Kuudra's Heart under a
 *      mayoral candidate. "This talisman was briefly placeable on a Private
 *      Island" put the Bits Talisman under farming. "The item model is Sirius's
 *      head" pulled in the Dark Auction. None of those sentences is about where
 *      the item comes from. So free templates are now read ONLY inside the
 *      obtain region that `sources.ts` already computes, and the structured
 *      infobox fields are read from the whole article, because an editor does
 *      not put trivia in `|merchant =`. That split also FIXES a silent loss: the
 *      Candy Talisman states `|merchant = Fear Mongerer` and nothing else, and
 *      reading only the region had been throwing that away.
 *
 *   2. A RE-SALE COUNTER IS NOT AN ORIGIN. Rusty stands in the Gold Mine and
 *      "sells back one-time rewards from quests". 34 accessories name him, and
 *      routing them through where he stands filed Rings of Love, Voter's
 *      Badges, Organ Donor and Bioanalysis under Mining. Not one of them is a
 *      mining accessory. Clauses that offer an item for re-purchase are dropped
 *      before extraction, the same way `sources.ts` drops clauses that deny.
 *
 * The rule both faults break is the same one the rest of this page keeps: an
 * honest Other beats a confident wrong answer, because a wrong activity sends a
 * player to the wrong island for an evening.
 */

/** MediaWiki link and template noise around a value. */
const clip = (raw: string): string =>
  raw
    .replace(/\[\[|\]\]/g, "")
    .split("|")[0]
    .split(";")[0]
    .trim();

/**
 * Counters that re-sell something you already earned elsewhere.
 *
 * Rusty is the whole reason this exists: his own article says he "sells back
 * one-time rewards from quests", so a sentence naming him describes a second
 * chance at an item rather than where the item comes from. The clause is
 * dropped whole, which also removes the zone it names, because "buy it from
 * Rusty in the {{Zone|Gold Mine}}" is one claim and the Gold Mine half of it is
 * just as misleading as the Rusty half.
 *
 * Same shape as `withoutDenials` in `sources.ts`, and for the same reason: we
 * are not trying to understand the sentence, only to avoid being misled by it.
 */
const RESALE = /\b(rusty|buy\s+the\s+tier\s+you\s+are\s+on|re-?purchas\w*|sells?\s+back)\b/i;

const withoutResales = (text: string): string =>
  text
    .split(/(?<=[.;:!?])\s+|\n+|\*/)
    .filter((clause) => !RESALE.test(clause))
    .join("\n");

/**
 * Pull the merchant, NPC and zone names out of one accessory article.
 *
 * Prefixed so a zone and an NPC that happen to share a name stay distinct, and
 * so the resolver can be told what kind of page to expect.
 *
 * Structured fields come from the whole article and free templates come only
 * from the obtain region. See fault 1 in the note at the top of this file.
 */
export function parseLocationSignals(wikitext: string): string[] {
  const out = new Set<string>();

  const merchant = wikitext.match(/\|\s*merchant\s*=\s*([^\n|}]+)/i);
  if (merchant) {
    const value = clip(merchant[1]);
    // `|merchant = n` is an editor saying "not sold", not an NPC called n.
    if (value && !/^(n|no|none|yes|y)$/i.test(value)) out.add(`npc:${value}`);
  }

  const location = wikitext.match(/\|\s*location\s*=\s*([^\n|}]+)/i);
  if (location && clip(location[1])) out.add(`zone:${clip(location[1])}`);

  /*
   * No obtaining section means no free templates are read at all.
   *
   * `obtainRegion` returns the WHOLE article when it cannot find a region,
   * which is the right answer for `sources.ts`: a broader look beats giving up,
   * and a miss there still ends at the honest "See wiki". Here the same
   * fallback is dangerous, because it silently readmits the trivia this
   * function exists to exclude, and a miss here produces a confident wrong
   * ACTIVITY rather than an admission. So the asymmetry is deliberate: when the
   * article never says how you obtain the item, the only signals that count are
   * the structured fields above.
   */
  const region = obtainRegion(wikitext);
  if (region === wikitext) return [...out];

  const obtaining = withoutResales(region);

  for (const m of obtaining.matchAll(/\{\{[Zz]one\|([^}]+)\}\}/g)) {
    const value = clip(m[1]);
    if (value) out.add(`zone:${value}`);
  }
  for (const m of obtaining.matchAll(/\{\{NPCSprite\|([^}]+)\}\}/g)) {
    const value = clip(m[1]);
    if (value) out.add(`npc:${value}`);
  }

  return [...out];
}

/** The bare page title behind a prefixed signal. */
export const signalTitle = (signal: string): string => signal.slice(signal.indexOf(":") + 1);

/* -------------------------------------------------------------------------- */
/* Reading a location or NPC page                                             */
/* -------------------------------------------------------------------------- */

/**
 * Pages that are real, and are still not an activity.
 *
 * Every one of these is a place you can stand or a person you can talk to, so
 * the temptation is to file it somewhere. Each is left unmapped on purpose:
 *
 *   Dark Auction   the task is explicit that it stays its own thing, and it
 *                  already has its own source tag on the tile. Sirius hosts it.
 *                  ([[Category:Dark Auction]] on Sirius.)
 *   quest counters Rusty, who "sells back one-time rewards from quests".
 *   mayors         a mayoral candidate is an office, not a place, and the
 *                  perks span every activity in the game. Kuudra's Heart and
 *                  the Potato Ring both cite Candidate Aura, which is the
 *                  proof: no single activity covers that pair.
 *                  ([[Category:Mayor]].)
 *   admin counters Elizabeth at the Community Center (City Projects, account
 *                  upgrades) and Taylor's cosmetics and gem shop. Neither sells
 *                  an activity, they sell account state.
 *   races          [[Category:Racing]] is a minigame that happens to live on
 *                  some island; the island is not why the item exists.
 */
const NOT_AN_ACTIVITY_CATEGORIES = /^(dark auction|mayor|mayor election|racing)$/i;
/*
 * `auction house` was in this list and had to come out: Bingo profiles restrict
 * it and the Crimson Isle has one, so it vetoed two pages that are genuinely an
 * event and genuinely combat. It is a lesson about where these patterns are
 * allowed to run rather than about the phrase, and the answer is the stripped
 * lead below, never the raw article.
 */
const NOT_AN_ACTIVITY_PROSE =
  /\b(sells?\s+back\s+one-?time|rewards?\s+from\s+quests|city\s+projects|account\s+&?\s*(?:and\s*)?profile\s+upgrades|cosmetics|skyblock\s+gems)\b/i;

/**
 * A clause saying a thing is switched OFF is not a claim about what the page is.
 *
 * Bingo's lead lists the Auction House, the Bazaar, the Museum and the Gem Shop
 * as features DISABLED on Bingo profiles. Reading that as "this page is about a
 * gem shop" vetoed a genuine event and unfiled every Bingo accessory. Same
 * reasoning, and the same clause-splitting shape, as `withoutDenials` in
 * `sources.ts`: we are not trying to understand the sentence, only to avoid
 * being misled by it.
 */
const DENIAL = /\b(disabled|unavailable|cannot|can't|are\s+not|is\s+not|no\s+longer)\b/i;

const vetoed = (text: string): boolean =>
  text
    .split(/(?<=[.;:!?])\s+|\n+/)
    .some((clause) => NOT_AN_ACTIVITY_PROSE.test(clause) && !DENIAL.test(clause));

/**
 * Category name to activity.
 *
 * A category is an editor stating outright what a page IS, which is stronger
 * than anything the prose can offer, so it is consulted first.
 */
const CATEGORY_GROUPS: readonly { group: AccessoryGroup; pattern: RegExp }[] = [
  { group: "rift", pattern: /^rift dimension$/i },
  { group: "dungeons", pattern: /^(dungeons?|catacombs)$/i },
  { group: "farming", pattern: /^(farming|farming tools|garden)$/i },
  { group: "mining", pattern: /^(mining|mining tools)$/i },
  { group: "fishing", pattern: /^(fishing|fishing tools|trophy fish)$/i },
  { group: "foraging", pattern: /^(foraging|park)$/i },
  { group: "event", pattern: /^(events?|year of the .+|spooky festival|carnival|bingo|great potato war)$/i },
  { group: "combat", pattern: /^(combat|slayers?|mobs)$/i },
];

/**
 * The wiki states a location's purpose structurally, and it is worth reading.
 *
 * `Infobox/Location` carries `|type = [[Mining]] Location` on the Gold Mine and
 * `|type = [[Combat]] location` on Spider's Den, and every Rift sub-area
 * carries `|location = [[Rift Dimension]]`. That is a machine-readable claim
 * about the place, immune to how the surrounding prose is worded.
 */
const TYPE_FIELD = /\|\s*type\s*=\s*(?:\[\[([A-Za-z ]+)\]\]|\{\{Skl\|([A-Za-z ]+)\|)/i;
/**
 * "sells various {{Skill|Foraging}}-related items", which is the wiki stating
 * what a merchant deals in.
 *
 * The selling verb is required, and that requirement is the whole rule. A bare
 * `{{Skill|...}}` anywhere in the first part of an article also appears in shop
 * TABLES, where it describes one row rather than the NPC: the Tyashoi
 * Alchemist is a Halloween quest giver whose table mentions Combat, and reading
 * that made a Halloween NPC a combat NPC.
 */
const SKILL_TEMPLATE = /(?:sells?|trades?|deals?)[^.\n]{0,80}\{\{Skill\|([A-Za-z ]+)[|}]/i;
/** The zone an NPC actually stands in, as opposed to one named in their dialogue. */
const LOCATION_FIELD = /\|\s*location\s*=\s*([^\n|}]+)/i;

const SKILL_GROUPS: readonly { group: AccessoryGroup; pattern: RegExp }[] = [
  { group: "mining", pattern: /^mining$/i },
  { group: "farming", pattern: /^farming$/i },
  { group: "fishing", pattern: /^fishing$/i },
  { group: "foraging", pattern: /^foraging$/i },
  { group: "combat", pattern: /^combat$/i },
];

/**
 * Strip templates so prose can be read without the furniture around it.
 *
 * This is the single most important line in the file, because every remaining
 * misclassification measured against the live wiki came from matching a phrase
 * that was sitting inside a template rather than in a sentence:
 *
 *   the Combat Merchant has a DIALOGUE TABLE with one row per zone, so
 *   `{{zone|The Garden}}` made him a farming NPC;
 *   the Colosseum is described as "south of the {{Zone|Fishing Outpost}}", a
 *   landmark, which made a PvP arena a fishing location;
 *   Jacobus opens with the HATNOTE `{{For|the NPC that runs [[Farming
 *   Contest]]s|Jacob}}`, which made the accessory-bag upgrader a farmer.
 *
 * Four passes because templates nest, and each pass removes the innermost
 * layer. What survives is the article's actual prose, which is the only part
 * that describes the page's own subject.
 */
const strippedLead = (wikitext: string): string => {
  let text = wikitext;
  for (let i = 0; i < 4; i++) text = text.replace(/\{\{[^{}]*\}\}/g, " ");
  return text.slice(0, LEAD_CHARS);
};

/**
 * Prose vocabulary, in priority order, and the order is the entire design.
 *
 * Rift and event go FIRST because they are contexts that hijack every other
 * vocabulary, which is exactly how the first cut of this file went wrong:
 *
 *   the Rift's own village sits in the "Wyld Woods", so a Rift NPC read as
 *   foraging (11 accessories, including Inverted Sirius and the Argofay
 *   Bugshopper);
 *   the Spooky Festival and Jerry's Workshop both have fishing in them, so the
 *   Fear Mongerer and the whole Winter Island read as fishing (18 accessories,
 *   including every Glacial and Candy accessory).
 *
 * Combat stays last for the reason it always did: "mob", "boss" and "arena"
 * turn up in prose about places that are really about something else.
 */
const LOCATION_RULES: readonly { group: AccessoryGroup; pattern: RegExp }[] = [
  {
    group: "rift",
    pattern:
      /\b(rift dimension|the rift|mirrorverse|wyld woods|west village|stillgore|barrier street|the mountaintop|dreadfarm|lagoon hut)\b/i,
  },
  {
    group: "event",
    pattern:
      /\b(spooky festival|jerry'?s workshop|winter island|new year celebration|travelling zoo|traveling zoo|bingo|hoppity|easter|halloween|christmas|advent|anniversary|carnival|year of the|mayor election|festival|during the .{0,24}event)\b/i,
  },
  { group: "dungeons", pattern: /\b(dungeon hub|dungeons?|catacombs)\b/i },
  {
    group: "mining",
    pattern:
      /\b(mining|dwarven mines|crystal hollows|glacite|mineshaft|deep caverns|gold mine|coal mine|heart of the mountain)\b/i,
  },
  { group: "farming", pattern: /\b(farming|the garden|jacob'?s|crop|pest|garden visitor)\b/i },
  {
    group: "fishing",
    pattern: /\b(fishing|sea creature|trophy fish|trophy frog|aquarist|bayou|lotus atoll|fisherman)\b/i,
  },
  { group: "foraging", pattern: /\b(foraging|galatea|spruce woods|logging|tree(?:capitator)?)\b/i },
  { group: "combat", pattern: /\b(combat|slayer|crimson isle|kuudra|colosseum|mob|boss|arena)\b/i },
];

/** How much of a page is read. The lead plus the structure, not the trivia. */
const LEAD_CHARS = 1400;

/**
 * How much of the lead the "not an activity" veto may read.
 *
 * Short on purpose. A wiki article states what its subject IS in the opening
 * sentence or two, and everything after that is detail in which the same words
 * mean something else. Bingo is the case that set this number: its lead
 * explains that "[[Auction House]], [[Bazaar]], [[Museum]], [[SkyBlock
 * Gems|Gem Shop]] and [[Trading]] are DISABLED on Bingo profiles", and reading
 * the whole lead turned a list of things you cannot do into a veto that
 * unfiled every Bingo accessory.
 */
const VETO_CHARS = 300;

/**
 * What activity a location or NPC page is about, or null.
 *
 * Four passes, strongest evidence first: what the editors filed it under, what
 * it is explicitly NOT, what its infobox states, and only then its prose.
 */
export function classifyLocationPage(wikitext: string): AccessoryGroup | null {
  if (!wikitext.trim()) return null;

  const categories = [...wikitext.matchAll(/\[\[Category:([^\]|]+)/gi)].map((m) => m[1].trim());

  // 1. What the editors filed it under, including the categories that mean
  //    "this is real, and it is still not an activity".
  for (const category of categories) {
    if (NOT_AN_ACTIVITY_CATEGORIES.test(category)) return null;
  }
  for (const category of categories) {
    for (const rule of CATEGORY_GROUPS) {
      if (rule.pattern.test(category)) return rule.group;
    }
  }

  const head = wikitext.slice(0, LEAD_CHARS);
  const lead = strippedLead(wikitext);

  /*
   * 2. Counters that sell account state, or a second copy of something already
   *    earned. Read from the stripped lead rather than the raw article, so an
   *    incidental mention cannot veto a page that is really an activity.
   */
  if (vetoed(lead.slice(0, VETO_CHARS))) return null;

  /*
   * 3. The infobox, which states a page's purpose outright and is the reason
   *    Geo is mining and Odawa is Rift: an NPC's `|location =` is the zone they
   *    actually stand in, unlike a zone named in one row of their dialogue.
   *    This runs AFTER the veto on purpose, because Rusty stands in the Gold
   *    Mine and must not be read as a miner.
   */
  const type = head.match(TYPE_FIELD);
  const typeName = type?.[1] ?? type?.[2];
  if (typeName) {
    for (const rule of SKILL_GROUPS) {
      if (rule.pattern.test(typeName.trim())) return rule.group;
    }
  }

  const skill = head.match(SKILL_TEMPLATE);
  if (skill) {
    for (const rule of SKILL_GROUPS) {
      if (rule.pattern.test(skill[1].trim())) return rule.group;
    }
  }

  const where = head.match(LOCATION_FIELD)?.[1];
  if (where) {
    for (const rule of LOCATION_RULES) {
      if (rule.pattern.test(where)) return rule.group;
    }
  }

  // 4. The prose, ordered so the hijacking contexts are tested first.
  for (const rule of LOCATION_RULES) {
    if (rule.pattern.test(lead)) return rule.group;
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Resolving a whole catalogue's worth of names                               */
/* -------------------------------------------------------------------------- */

/** signal (`npc:Anita`) -> the activity its page turned out to be about. */
export type LocationIndex = Record<string, AccessoryGroup>;

const API = "https://hypixelskyblock.minecraft.wiki/api.php";
const BATCH = 50;

/**
 * Resolve a set of signals by reading the page each one names.
 *
 * `redirects=1` is on because merchants are frequently linked under an alias
 * (SkyMart redirects to The Garden), and the response's redirect table is used
 * to record the answer under the name the accessory actually used as well as
 * under the page's real title.
 *
 * Cost is one extra batched pass, roughly two requests, because it runs over
 * the distinct NAMES rather than over the accessories.
 */
export async function fetchLocationGroups(
  signals: readonly string[],
  signal?: AbortSignal
): Promise<LocationIndex> {
  const index: LocationIndex = {};
  if (signals.length === 0) return index;

  const titles = [...new Set(signals.map(signalTitle))];

  for (let i = 0; i < titles.length; i += BATCH) {
    const slice = titles.slice(i, i + BATCH);
    const url = `${API}?${new URLSearchParams({
      action: "query",
      titles: slice.join("|"),
      prop: "revisions",
      rvprop: "content",
      rvslots: "main",
      format: "json",
      formatversion: "2",
      origin: "*",
      redirects: "1",
    })}`;

    try {
      const res = await fetch(url, { signal });
      if (!res.ok) continue;
      const json = (await res.json()) as {
        query?: {
          redirects?: { from: string; to: string }[];
          pages?: { title: string; revisions?: { slots?: { main?: { content?: string } } }[] }[];
        };
      };

      const cameFrom = new Map<string, string[]>();
      for (const r of json.query?.redirects ?? []) {
        if (!cameFrom.has(r.to)) cameFrom.set(r.to, []);
        cameFrom.get(r.to)!.push(r.from);
      }

      for (const page of json.query?.pages ?? []) {
        const text = page.revisions?.[0]?.slots?.main?.content;
        if (!text) continue;
        const group = classifyLocationPage(text);
        if (!group) continue;
        for (const title of [page.title, ...(cameFrom.get(page.title) ?? [])]) {
          index[`npc:${title}`] = group;
          index[`zone:${title}`] = group;
        }
      }
    } catch {
      if (signal?.aborted) return index;
      continue;
    }
  }

  return index;
}

/** The first signal on an accessory that resolves, or null. */
export function groupFromLocation(
  signals: readonly string[],
  index: LocationIndex
): AccessoryGroup | null {
  for (const s of signals) {
    const group = index[s];
    if (group) return group;
  }
  return null;
}
