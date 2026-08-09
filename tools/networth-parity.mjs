/**
 * Networth parity gate.
 *
 * Feeds ONE set of item documents to the real `skyhelper-networth` package and
 * to this project's TypeScript port, then reports the delta per category.
 *
 * WHY THIS IS THE ACCEPTANCE TEST AND UNIT TESTS ARE NOT. A port of forty
 * handlers and a fifty-five entry factor table can be wrong in ways that every
 * test written from the same misreading agrees with. The only check that cannot
 * be fooled that way is running the original alongside it on the same input.
 *
 * WHAT IS HELD IDENTICAL, so a delta can only mean a rules delta:
 *
 *   items      `tools/fixtures/networth/preparsed.json`, item documents pulled
 *              verbatim off Hypixel's keyless auction endpoints. Both sides get
 *              the same objects through the same pre-parsed seam
 *              (`ProfileNetworthCalculator.fromPreParsed` on their side,
 *              `calculateNetworth` on ours), so NBT decoding is out of scope
 *              here and is covered by its own unit tests.
 *
 *   prices     ONE snapshot, downloaded once at the top of this run and handed
 *              to both. The file regenerates every fifteen minutes, so two
 *              independent fetches would produce a delta that says nothing.
 *              It is written to tools/.cache/ rather than committed: the Prices
 *              repository carries no licence, so this project fetches it and
 *              never redistributes it. See NOTICE.md.
 *
 *   catalogue  ONE snapshot of Hypixel's item resource, downloaded the same way
 *              and pushed into the library through its own `setItems`.
 *
 * Run: pnpm parity:networth
 */

import { createRequire } from "node:module";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const FIXTURE = join(HERE, "fixtures", "networth", "preparsed.json");
const MEMBER_FIXTURE = join(HERE, "fixtures", "networth", "member.json");
const CACHE_DIR = join(HERE, ".cache");

const PRICES_URL = "https://raw.githubusercontent.com/SkyHelperBot/Prices/main/pricesV2.json";
const ITEMS_URL = "https://api.hypixel.net/v2/resources/skyblock/items";

/** Per-category tolerance. A category outside this fails the run. */
const TOLERANCE_PCT = 0.1;

/** How long a downloaded snapshot may be reused before this refetches it. */
const SNAPSHOT_TTL_MS = 60 * 60 * 1000;

const require = createRequire(join(ROOT, "node_modules", "skyhelper-networth", "index.js"));

const coins = (n) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 0 }).padStart(18);

/**
 * A snapshot on disk, downloaded if missing or old.
 *
 * Cached rather than refetched every run because the point is that BOTH sides
 * see one file, and because a parity gate that hammers somebody's raw.github
 * every time it is run is a parity gate that gets rate limited.
 */
async function snapshot(name, url) {
  const path = join(CACHE_DIR, name);
  try {
    const info = await stat(path);
    if (Date.now() - info.mtimeMs < SNAPSHOT_TTL_MS) {
      return JSON.parse(await readFile(path, "utf8"));
    }
  } catch {
    // Not there yet, or unreadable. Download it.
  }

  process.stdout.write(`downloading ${name} ...\n`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  const body = await response.json();
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(path, JSON.stringify(body));
  return body;
}

/**
 * Compare every ported constant table against the library's own.
 *
 * A transcription slip in a fifty-five entry factor table or a two hundred
 * entry level ladder does not necessarily move a fixture's total, because the
 * fixture may contain nothing that reads the wrong entry. This check does not
 * care what the fixture contains: it compares the tables directly, so a typo
 * cannot hide behind a gap in the sample.
 */
function compareConstants(theirs, ours) {
  const pairs = [
    ["APPLICATION_WORTH", theirs.applicationWorth.APPLICATION_WORTH, ours.APPLICATION_WORTH],
    ["ENCHANTMENTS_WORTH", theirs.applicationWorth.ENCHANTMENTS_WORTH, ours.ENCHANTMENTS_WORTH],
    ["BLOCKED_ENCHANTMENTS", theirs.misc.BLOCKED_ENCHANTMENTS, ours.BLOCKED_ENCHANTMENTS],
    ["IGNORED_ENCHANTMENTS", theirs.misc.IGNORED_ENCHANTMENTS, ours.IGNORED_ENCHANTMENTS],
    ["STACKING_ENCHANTMENTS", theirs.misc.STACKING_ENCHANTMENTS, ours.STACKING_ENCHANTMENTS],
    ["IGNORE_SILEX", theirs.misc.IGNORE_SILEX, ours.IGNORE_SILEX],
    ["MASTER_STARS", theirs.misc.MASTER_STARS, ours.MASTER_STARS],
    [
      "ALLOWED_RECOMBOBULATED_CATEGORIES",
      theirs.misc.ALLOWED_RECOMBOBULATED_CATEGORIES,
      ours.ALLOWED_RECOMBOBULATED_CATEGORIES,
    ],
    ["ALLOWED_RECOMBOBULATED_IDS", theirs.misc.ALLOWED_RECOMBOBULATED_IDS, ours.ALLOWED_RECOMBOBULATED_IDS],
    ["ENRICHMENTS", theirs.misc.ENRICHMENTS, ours.ENRICHMENTS],
    ["SPECIAL_ENCHANTMENT_NAMES", theirs.misc.SPECIAL_ENCHANTMENT_NAMES, ours.SPECIAL_ENCHANTMENT_NAMES],
    ["GEMSTONE_SLOTS", theirs.misc.GEMSTONE_SLOTS, ours.GEMSTONE_SLOTS],
    ["NON_COSMETIC_ITEMS", [...theirs.misc.NON_COSMETIC_ITEMS].sort(), [...ours.NON_COSMETIC_ITEMS].sort()],
    ["REFORGES", theirs.reforges.REFORGES, ours.REFORGES],
    // Sorted, because this project builds the prestige table from its pattern
    // rather than transcribing eighty lines, so key order legitimately differs.
    ["PRESTIGES", sortKeys(theirs.prestiges.PRESTIGES), sortKeys(ours.PRESTIGES)],
    ["SPECIAL_LEVELS", theirs.pets.SPECIAL_LEVELS, ours.SPECIAL_LEVELS],
    ["SOULBOUND_PETS", theirs.pets.SOULBOUND_PETS, ours.SOULBOUND_PETS],
    ["BLOCKED_CANDY_REDUCE_PETS", theirs.pets.BLOCKED_CANDY_REDUCE_PETS, ours.BLOCKED_CANDY_REDUCE_PETS],
    ["RARITY_OFFSET", theirs.pets.RARITY_OFFSET, ours.RARITY_OFFSET],
    ["TIERS", theirs.pets.TIERS, ours.TIERS],
    ["LEVELS", theirs.pets.LEVELS, ours.LEVELS],
    ["XP_TO_LEVEL_100", theirs.pets.XP_TO_LEVEL_100, ours.XP_TO_LEVEL_100],
    ["CUSTOM_PET_NAMES", theirs.pets.CUSTOM_PET_NAMES, ours.CUSTOM_PET_NAMES],
  ];

  const bad = [];
  for (const [name, a, b] of pairs) {
    if (JSON.stringify(a) !== JSON.stringify(b)) bad.push(name);
  }
  return { checked: pairs.length, bad };
}

const sortKeys = (obj) => Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));

/**
 * A copy of the fixture with soulbound markers written onto some of it.
 *
 * The fixture cannot carry a real soulbound item: soulbound items cannot be
 * auctioned, and the keyless auction endpoints are the only place this project
 * can capture verbatim item documents from. So the split is proven the only way
 * it can be, by marking a deterministic slice of the SAME documents on BOTH
 * sides and checking the two implementations agree about what that does. The
 * two markers are the two upstream reads: the museum-donation flag, and the
 * lore line the game prints, quoted from upstream's own source.
 */
const SOULBOUND_LORE = "§8§l* §8Soulbound §8§l*";

function markSoulbound(items) {
  const out = structuredClone(items);
  for (const [category, entries] of Object.entries(out)) {
    if (!Array.isArray(entries)) continue;
    entries.forEach((entry, index) => {
      if (!entry || typeof entry !== "object") return;
      if (category === "pets" || category === "sacks" || category === "essence") return;
      if (index % 5 === 0 && entry.tag?.display) {
        entry.tag.display.Lore = [...(entry.tag.display.Lore ?? []), SOULBOUND_LORE];
      }
      if (index % 7 === 0 && entry.tag?.ExtraAttributes) {
        entry.tag.ExtraAttributes.donated_museum = true;
      }
    });
  }
  return out;
}

async function main() {
  const fixture = JSON.parse(await readFile(FIXTURE, "utf8"));
  const prices = await snapshot("pricesV2.json", PRICES_URL);
  const itemsResource = await snapshot("hypixel-items.json", ITEMS_URL);

  /* ---------------------------------------------------------------------- */
  /* The real library                                                       */
  /* ---------------------------------------------------------------------- */

  // Importing the package starts its singleton manager, which fires its own
  // fetch of the items resource and a twelve hour interval. `setItems` below
  // overwrites whatever that produced with the pinned snapshot, so the two
  // sides cannot disagree because of a five minute old catalogue. The interval
  // is why this script calls process.exit at the end.
  const { ProfileNetworthCalculator } = require("skyhelper-networth");
  const { setItems } = require("skyhelper-networth/constants/itemsMap");
  setItems(itemsResource.items);

  /* ---------------------------------------------------------------------- */
  /* This port                                                              */
  /* ---------------------------------------------------------------------- */

  const { calculateNetworth } = await import("../src/networth/profileNetworth.ts");
  const { trimCatalogue } = await import("../src/networth/catalogue.ts");
  const ourConstants = await import("../src/networth/constants.ts");

  const catalogue = trimCatalogue(itemsResource);
  if (!catalogue) throw new Error("The items resource did not trim to a catalogue.");

  const coinsOf = () => ({
    purse: fixture.profileData.currencies?.coin_purse ?? 0,
    bank: fixture.bankBalance ?? 0,
    personalBank: fixture.profileData.profile?.bank_account ?? 0,
  });

  /* ---------------------------------------------------------------------- */
  /* Constant tables                                                        */
  /* ---------------------------------------------------------------------- */

  const constants = compareConstants(
    {
      applicationWorth: require("skyhelper-networth/constants/applicationWorth"),
      misc: require("skyhelper-networth/constants/misc"),
      reforges: require("skyhelper-networth/constants/reforges"),
      prestiges: require("skyhelper-networth/constants/prestiges"),
      pets: require("skyhelper-networth/constants/pets"),
    },
    ourConstants
  );

  /* ---------------------------------------------------------------------- */
  /* Report                                                                 */
  /* ---------------------------------------------------------------------- */

  const entryCount = Object.values(fixture.items).reduce((n, v) => n + v.length, 0);
  console.log("");
  console.log(`fixture   ${entryCount} entries across ${Object.keys(fixture.items).length} categories`);
  console.log(`prices    ${Object.keys(prices).length} ids, pinned snapshot`);
  console.log(`catalogue ${Object.keys(catalogue).length} ids, pinned snapshot`);
  console.log(`rules     skyhelper-networth ${require("skyhelper-networth/package.json").version}`);
  console.log("");
  console.log(
    `constants ${constants.checked - constants.bad.length}/${constants.checked} ported tables identical` +
      (constants.bad.length ? `   MISMATCH: ${constants.bad.join(", ")}` : "")
  );

  const failures = [];
  if (constants.bad.length) {
    for (const name of constants.bad) failures.push({ name: `constants.${name}`, a: 0, b: 0, delta: 0, pct: Infinity });
  }

  let worst = 0;
  let worstName = "none";

  /**
   * One pass: the same items and the same prices through both implementations,
   * compared per category on both totals.
   */
  const runPass = async (label, items, nonCosmetic) => {
    const calculator = ProfileNetworthCalculator.fromPreParsed(
      fixture.profileData,
      structuredClone(items),
      fixture.bankBalance
    );
    const theirs = nonCosmetic
      ? await calculator.getNonCosmeticNetworth({ prices })
      : await calculator.getNetworth({ prices });

    const ours = calculateNetworth(structuredClone(items), coinsOf(), { prices, catalogue, nonCosmetic });

    const categories = [...new Set([...Object.keys(theirs.types), ...Object.keys(ours.types)])].sort();

    console.log("");
    console.log(`### pass: ${label}`);
    console.log("");
    console.log(
      "category".padEnd(26) + "skyhelper".padStart(18) + "port".padStart(18) + "delta".padStart(18) + "     pct"
    );
    console.log("-".repeat(88));

    const row = (name, a, b) => {
      const delta = b - a;
      // A figure both sides call zero is a match, not a division by zero.
      const pct = a === 0 ? (b === 0 ? 0 : Infinity) : (Math.abs(delta) / Math.abs(a)) * 100;
      if (pct > worst) {
        worst = pct;
        worstName = `${label}/${name}`;
      }
      if (pct > TOLERANCE_PCT) failures.push({ name: `${label}/${name}`, a, b, delta, pct });
      const flag = pct > TOLERANCE_PCT ? "  FAIL" : "";
      console.log(
        name.padEnd(26) + coins(a) + coins(b) + coins(delta) + `  ${pct === Infinity ? "inf" : pct.toFixed(4)}%${flag}`
      );
    };

    for (const name of categories) {
      row(name, theirs.types[name]?.total ?? 0, ours.types[name]?.total ?? 0);
    }
    console.log("-".repeat(88));
    for (const name of categories) {
      row(`${name} (unsoulbound)`, theirs.types[name]?.unsoulboundTotal ?? 0, ours.types[name]?.unsoulboundTotal ?? 0);
    }
    console.log("-".repeat(88));
    row("networth", theirs.networth, ours.networth);
    row("unsoulboundNetworth", theirs.unsoulboundNetworth, ours.unsoulboundNetworth);
    row("purse", theirs.purse, ours.purse);
    row("bank", theirs.bank, ours.bank);
    row("personalBank", theirs.personalBank, ours.personalBank);

    if (theirs.noInventory !== ours.noInventory) {
      failures.push({ name: `${label}/noInventory`, a: theirs.noInventory, b: ours.noInventory, delta: 0, pct: Infinity });
    }
  };

  await runPass("as captured", fixture.items, false);
  await runPass("soulbound marked", markSoulbound(fixture.items), false);
  await runPass("non-cosmetic", fixture.items, true);

  /* ---------------------------------------------------------------------- */
  /* Assembly: a RAW member through both full profile paths                  */
  /* ---------------------------------------------------------------------- */

  /**
   * The three passes above start from items that are already sorted into
   * categories, so they cannot see an assembly mistake at all: an item counted
   * in the wrong category, or twice, or dropped, moves the total with every
   * handler behaving perfectly.
   *
   * This pass starts one step earlier. The same raw member and the same museum
   * document go through upstream's `parseItems` and through this project's
   * `parseMemberItems`, and both the per-category item COUNT and the total are
   * compared. The count is the point: two categories can total the same while
   * holding different items, and only the count catches a category that has
   * quietly absorbed another one's contents.
   *
   * It also exercises this project's own NBT decoder against bytes it did not
   * write, since both sides decode the same base64 blobs.
   */
  const memberFixture = JSON.parse(await readFile(MEMBER_FIXTURE, "utf8"));
  const { parseMemberItems, readCoinBalances } = await import("../src/networth/parseItems.ts");

  const theirAssembly = new ProfileNetworthCalculator(
    structuredClone(memberFixture.member),
    structuredClone(memberFixture.museum),
    memberFixture.bankBalance
  );
  const theirAssemblyResult = await theirAssembly.getNetworth({ prices });

  const ourAssemblyItems = await parseMemberItems(
    structuredClone(memberFixture.member),
    structuredClone(memberFixture.museum),
    { catalogue }
  );
  const ourAssemblyResult = calculateNetworth(
    ourAssemblyItems,
    readCoinBalances(memberFixture.member, memberFixture.bankBalance),
    { prices, catalogue }
  );

  const assemblyCategories = [
    ...new Set([...Object.keys(theirAssembly.items), ...Object.keys(ourAssemblyItems)]),
  ].sort();

  console.log("");
  console.log("### pass: assembly (raw member through both full profile paths)");
  console.log("");
  console.log(
    "category".padEnd(26) +
      "expect".padStart(8) +
      "skyhelper".padStart(11) +
      "port".padStart(8) +
      "skyhelper total".padStart(18) +
      "port total".padStart(18) +
      "     pct"
  );
  console.log("-".repeat(97));

  for (const name of assemblyCategories) {
    const theirCount = (theirAssembly.items[name] ?? []).length;
    const ourCount = (ourAssemblyItems[name] ?? []).length;
    const expected = memberFixture.expectedCounts[name];
    const a = theirAssemblyResult.types[name]?.total ?? 0;
    const b = ourAssemblyResult.types[name]?.total ?? 0;
    const pct = a === 0 ? (b === 0 ? 0 : Infinity) : (Math.abs(b - a) / Math.abs(a)) * 100;

    const countMismatch = theirCount !== ourCount;
    // A count both sides agree on but that the fixture did not expect means an
    // assembly rule changed on BOTH sides at once, which a two-way comparison
    // alone would call a pass.
    const expectMismatch = expected !== undefined && theirCount !== expected;

    if (countMismatch) {
      failures.push({ name: `assembly/${name} count`, a: theirCount, b: ourCount, delta: ourCount - theirCount, pct: Infinity });
    }
    if (expectMismatch) {
      failures.push({ name: `assembly/${name} expected count`, a: expected, b: theirCount, delta: theirCount - expected, pct: Infinity });
    }
    if (pct > TOLERANCE_PCT) failures.push({ name: `assembly/${name}`, a, b, delta: b - a, pct });
    if (pct > worst) {
      worst = pct;
      worstName = `assembly/${name}`;
    }

    const flags = `${countMismatch ? "  COUNT" : ""}${expectMismatch ? "  EXPECT" : ""}${pct > TOLERANCE_PCT ? "  FAIL" : ""}`;
    console.log(
      name.padEnd(26) +
        String(expected ?? "-").padStart(8) +
        String(theirCount).padStart(11) +
        String(ourCount).padStart(8) +
        coins(a).slice(-18).padStart(18) +
        coins(b).slice(-18).padStart(18) +
        `  ${pct === Infinity ? "inf" : pct.toFixed(4)}%${flags}`
    );
  }

  console.log("-".repeat(97));
  for (const [label, a, b] of [
    ["networth", theirAssemblyResult.networth, ourAssemblyResult.networth],
    ["unsoulboundNetworth", theirAssemblyResult.unsoulboundNetworth, ourAssemblyResult.unsoulboundNetworth],
    ["purse", theirAssemblyResult.purse, ourAssemblyResult.purse],
    ["bank", theirAssemblyResult.bank, ourAssemblyResult.bank],
    ["personalBank", theirAssemblyResult.personalBank, ourAssemblyResult.personalBank],
  ]) {
    const pct = a === 0 ? (b === 0 ? 0 : Infinity) : (Math.abs(b - a) / Math.abs(a)) * 100;
    if (pct > TOLERANCE_PCT) failures.push({ name: `assembly/${label}`, a, b, delta: b - a, pct });
    if (pct > worst) {
      worst = pct;
      worstName = `assembly/${label}`;
    }
    console.log(
      label.padEnd(53) + coins(a) + coins(b) + `  ${pct === Infinity ? "inf" : pct.toFixed(4)}%${pct > TOLERANCE_PCT ? "  FAIL" : ""}`
    );
  }

  // Which sack map won. Both sides must have read the same one, and the
  // fixture carries two different ones precisely so this cannot pass by luck.
  const theirSackIds = (theirAssembly.items.sacks ?? []).map((s) => s.id).sort();
  const ourSackIds = (ourAssemblyItems.sacks ?? []).map((s) => s.id).sort();
  const sacksAgree = JSON.stringify(theirSackIds) === JSON.stringify(ourSackIds);
  console.log("");
  console.log(`sacks_counts precedence: skyhelper read [${theirSackIds.join(", ")}], port read [${ourSackIds.join(", ")}]`);
  if (!sacksAgree) {
    failures.push({ name: "assembly/sacks precedence", a: theirSackIds.join(","), b: ourSackIds.join(","), delta: 0, pct: Infinity });
  }

  if (theirAssemblyResult.noInventory !== ourAssemblyResult.noInventory) {
    failures.push({
      name: "assembly/noInventory",
      a: theirAssemblyResult.noInventory,
      b: ourAssemblyResult.noInventory,
      delta: 0,
      pct: Infinity,
    });
  }

  console.log("");
  console.log(`worst delta ${worst === Infinity ? "inf" : worst.toFixed(4)}% (${worstName}), tolerance ${TOLERANCE_PCT}%`);

  if (failures.length > 0) {
    console.log("");
    console.log(`${failures.length} check(s) outside tolerance:`);
    for (const f of failures) {
      console.log(`  ${f.name}: skyhelper ${f.a}, port ${f.b}, delta ${f.delta}`);
    }
    process.exit(1);
  }

  console.log("PASS");
  // The library's manager holds a twelve hour interval open, so the process
  // would otherwise sit there having already answered the question.
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
