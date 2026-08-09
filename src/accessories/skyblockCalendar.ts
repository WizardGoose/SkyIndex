/**
 * The SkyBlock calendar, as pure arithmetic.
 *
 * WHY THIS EXISTS
 * ---------------
 * "The event it comes from is currently running" is one of the three things
 * that light an actionable border on a missing accessory (see `actionable.ts`
 * in `ui/`), and it is the only one of the three that is a function of the
 * clock. SkyBlock's in-game calendar runs on a fixed real-time schedule, so
 * whether the Traveling Zoo is open right now is not a fetch, it is a division.
 *
 * THE CONSTANTS, VERIFIED AGAINST THE WIKI'S "Time Systems" ARTICLE
 * -----------------------------------------------------------------
 * These are game facts (numbers), not wiki prose, so encoding them here with a
 * citation is fine where bundling wiki text would not be. Each was read from
 * the article rather than remembered, on 2026-08-03:
 *
 *   day      "1 Day || 20 Minutes" (the conversion table). One SkyBlock day is
 *            20 real minutes.
 *   month    "1 SkyBlock Month consists of exactly 31 SkyBlock Days."
 *   year     "1 SkyBlock Year consists of exactly 12 SkyBlock Months of 31
 *            SkyBlock Days, or a total of 372 SkyBlock Days." The conversion
 *            table states the same year as 124 real hours.
 *   epoch    "The SkyBlock Epoch ... is defined to be Early Spring 1, Year 1
 *            at 00:00, which converts to Jun 11, 2019 at 17:55:00 (UTC), or
 *            unix time of 1560275700." That is the MAIN server; the article
 *            records that the Alpha network has run offset from it.
 *
 * The article also states that every SkyBlock day starts at :55, :15 or :35
 * real time, which follows from the epoch minute and the 20 minute day and is
 * used here only as a sanity check in the tests.
 *
 * MONTH NUMBERING
 * ---------------
 * Month 1 is Early Spring, because that is what the epoch is defined at. The
 * year runs Early/Mid/Late Spring, Summer, Autumn, Winter, so Late Winter is
 * month 12. Every window below is written against that numbering.
 *
 * THE CLOCK IS AN ARGUMENT
 * ------------------------
 * Every function takes `now` in real milliseconds (a `Date.now()` value) and
 * none of them ever calls `Date.now()` itself, so a test can pin any instant
 * in history and the answer is deterministic. The caller owns the clock.
 */

/** Unix milliseconds of Year 1, Month 1 (Early Spring), Day 1, 00:00. */
export const SKYBLOCK_EPOCH_MS = 1560275700000;

/** One SkyBlock day, in real milliseconds: 20 real minutes. */
export const SKYBLOCK_DAY_MS = 20 * 60 * 1000;

/** Days per month and months per year, both exact. */
export const DAYS_PER_MONTH = 31;
export const MONTHS_PER_YEAR = 12;
export const DAYS_PER_YEAR = DAYS_PER_MONTH * MONTHS_PER_YEAR; // 372

export interface SkyblockDate {
  /** 1-based: the epoch instant is Year 1. */
  year: number;
  /** 1-based: 1 is Early Spring, 12 is Late Winter. */
  month: number;
  /** 1-based: 1 to 31. */
  day: number;
}

/**
 * The in-game date at a real instant.
 *
 * Pure integer arithmetic off the epoch. An instant before the epoch has no
 * SkyBlock date (the game did not exist), and rather than inventing year zero
 * or negative months this answers the epoch date itself, which is the only
 * question a page asking "what is live right now" could ever mean by it.
 */
export function skyblockDate(now: number): SkyblockDate {
  const elapsed = Math.max(0, now - SKYBLOCK_EPOCH_MS);
  const days = Math.floor(elapsed / SKYBLOCK_DAY_MS);

  return {
    year: Math.floor(days / DAYS_PER_YEAR) + 1,
    month: Math.floor((days % DAYS_PER_YEAR) / DAYS_PER_MONTH) + 1,
    day: (days % DAYS_PER_MONTH) + 1,
  };
}

/**
 * The recurring events whose windows the calendar itself fixes.
 *
 * `unknown` is a real member of the type, not an absence: it is the honest
 * answer for every event item whose specific event either could not be named
 * from its article, or is scheduled by Hypixel rather than by the calendar
 * (Mining Fiesta and Fishing Festival hang off mayor perks, the Great Spook
 * and the Anniversary run on real-world announcements, Hoppity's Hunt on its
 * own seasonal schedule). None of those can be computed from `now`, so
 * `isEventLive` answers "unknown" for them and an unknown event NEVER lights
 * a border: a border is an instruction to go and act, and "maybe" is not one.
 */
export type EventKey =
  | "newYear"
  | "travelingZoo"
  | "spookyFestival"
  | "seasonOfJerry"
  | "jerryWorkshop"
  | "bingo"
  | "unknown";

/** One in-calendar window: whole days of one month, inclusive on both ends. */
interface EventWindow {
  month: number;
  firstDay: number;
  lastDay: number;
}

/**
 * The windows, each verified against its own article on 2026-08-03. The wiki
 * states them both in prose and in machine-readable countdown routines
 * (`{{LiveCountdownBox|routine=A[D29 LWI Y1] C[3d ...]}}`), and the two agree
 * in every case below; the routine is quoted because it is the less ambiguous
 * of the pair.
 *
 *   New Year Celebration   "takes place Late Winter, 29-31 (in-game time)";
 *                          routine `A[D29 LWI] C[3d]`. Month 12, days 29-31.
 *                          It does NOT spill into Month 1: the article, the
 *                          routine and the Calendar overview table all say
 *                          three days ending with the year.
 *   Traveling Zoo          "takes place twice a year, in Early Summer 1-3
 *                          ... and in Early Winter 1-3"; routine
 *                          `A[D1 ESU] C[3d / 5mo 28d / 3d / 5mo 28d]`.
 *                          Months 4 and 10, days 1-3.
 *   Spooky Festival        "takes place from Autumn 29-31"; routine
 *                          `A[D29 AU] C[3d]`. Month 8, days 29-31. (Foxy's
 *                          Extra Event perk can add off-calendar occurrences;
 *                          those are mayor-dependent and deliberately not
 *                          modelled, so this window is the guaranteed floor.)
 *   Season of Jerry        "taking place on Day 24 of Late Winter"; routine
 *                          `A[D24 LWI] C[3d]`. Month 12, days 24-26.
 *   Jerry's Workshop       "open during the whole season of Late Winter";
 *                          routine `A[D1 LWI] C[1mo]`. Month 12, days 1-31.
 */
const EVENT_WINDOWS: Record<Exclude<EventKey, "unknown" | "bingo">, readonly EventWindow[]> = {
  newYear: [{ month: 12, firstDay: 29, lastDay: 31 }],
  travelingZoo: [
    { month: 4, firstDay: 1, lastDay: 3 },
    { month: 10, firstDay: 1, lastDay: 3 },
  ],
  spookyFestival: [{ month: 8, firstDay: 29, lastDay: 31 }],
  seasonOfJerry: [{ month: 12, firstDay: 24, lastDay: 26 }],
  jerryWorkshop: [{ month: 12, firstDay: 1, lastDay: 31 }],
};

/**
 * Whether SkyBlock Bingo is on, which is NOT a SkyBlock-calendar question.
 *
 * Bingo is the one deterministic event that runs on the REAL calendar rather
 * than the in-game one. Verified against the wiki on 2026-08-03, both pages
 * agreeing: the Bingo article says the gamemode is accessible "for the first
 * 7 days of every real life month", and the Bingo (NPC) article says the NPC
 * "hosts a SkyBlock Bingo for the first seven days of every real life month".
 *
 * Neither article states a timezone, so this uses UTC as the least surprising
 * anchor for a server-scheduled window. The claim this function makes is
 * therefore "UTC days 1 through 7", and it can be off by boundary hours at
 * the month edge, never by days. Exported separately from `EVENT_WINDOWS`
 * because those windows are in-game months and this one simply is not; wiring
 * it through that table would have meant faking a SkyBlock date for it.
 */
const isBingoLive = (now: number): boolean => new Date(now).getUTCDate() <= 7;

/** Plain words for each key, for hover text and hints. */
export const EVENT_LABEL: Record<EventKey, string> = {
  newYear: "New Year Celebration",
  travelingZoo: "Traveling Zoo",
  spookyFestival: "Spooky Festival",
  seasonOfJerry: "Season of Jerry",
  jerryWorkshop: "Jerry's Workshop",
  bingo: "SkyBlock Bingo",
  unknown: "an event we could not pin down",
};

/**
 * Whether an event is running at a real instant.
 *
 * Three-valued on purpose. `true` and `false` are computed claims about the
 * calendar; `"unknown"` is the refusal for events the calendar does not fix
 * (see the `EventKey` note). Callers deciding whether to light an actionable
 * border must treat only `true` as actionable, which `actionable.ts` does.
 *
 * A window is whole in-game days, inclusive: the New Year Celebration is live
 * from the first tick of Month 12 Day 29 to the last tick of Day 31, and one
 * millisecond later the date is Year+1 Month 1 Day 1 and it is not. That
 * year-boundary rollover is pinned in the tests, since an off-by-one there
 * would light a border for a whole extra month.
 */
export function isEventLive(event: EventKey, now: number): boolean | "unknown" {
  if (event === "unknown") return "unknown";
  // Real-world monthly, not an in-game window. See `isBingoLive`.
  if (event === "bingo") return isBingoLive(now);

  const date = skyblockDate(now);
  return EVENT_WINDOWS[event].some(
    (w) => date.month === w.month && date.day >= w.firstDay && date.day <= w.lastDay
  );
}
