import { describe, expect, it } from "vitest";
import {
  DAYS_PER_YEAR,
  SKYBLOCK_DAY_MS,
  SKYBLOCK_EPOCH_MS,
  isEventLive,
  skyblockDate,
} from "../skyblockCalendar";

/**
 * The calendar, pinned to instants the wiki itself documents.
 *
 * Every case passes an explicit `now`, because the module's one design rule is
 * that nothing in it reads the clock. If a case here ever needs `Date.now()`,
 * the module has grown a hidden dependency and the test should fail to compile
 * rather than flake.
 */

/** Milliseconds of a given in-game date, built from the verified constants. */
const at = (year: number, month: number, day: number, extraMs = 0): number =>
  SKYBLOCK_EPOCH_MS + (((year - 1) * DAYS_PER_YEAR + (month - 1) * 31 + (day - 1)) * SKYBLOCK_DAY_MS) + extraMs;

describe("skyblockDate", () => {
  it("pins the epoch: Jun 11 2019 17:55:00 UTC is Year 1, Early Spring 1", () => {
    // "Time Systems" states the epoch as unix 1560275700 exactly.
    expect(SKYBLOCK_EPOCH_MS).toBe(1560275700 * 1000);
    expect(skyblockDate(SKYBLOCK_EPOCH_MS)).toEqual({ year: 1, month: 1, day: 1 });
  });

  it("pins a second wiki-documented instant: the end of Year 342", () => {
    /*
     * "Time Systems" records (in its Alpha-network trivia) that the end of
     * Year 342 fell at unix 1712692500 on the Alpha network, which it states
     * ran exactly 210 SkyBlock days = 70 hours ahead of the main server. So on
     * the MAIN server, Year 343 begins 70 hours later, at unix 1712944500,
     * which is also exactly epoch + 342 years, confirming the year length from
     * an independent wiki figure.
     */
    const year343 = 1712944500 * 1000;
    expect(year343).toBe(SKYBLOCK_EPOCH_MS + 342 * DAYS_PER_YEAR * SKYBLOCK_DAY_MS);
    expect(skyblockDate(year343)).toEqual({ year: 343, month: 1, day: 1 });
    // One millisecond earlier is still the last day of Year 342.
    expect(skyblockDate(year343 - 1)).toEqual({ year: 342, month: 12, day: 31 });
  });

  it("pins the New Year routine anchor: Day 29, Late Winter, Year 1", () => {
    // The article's countdown routine anchors at `A[D29 LWI Y1]`, which is
    // 11 months and 28 whole days after the epoch.
    const anchor = SKYBLOCK_EPOCH_MS + (11 * 31 + 28) * SKYBLOCK_DAY_MS;
    expect(skyblockDate(anchor)).toEqual({ year: 1, month: 12, day: 29 });
  });

  it("keeps the documented day-start minutes: every day starts at :55, :15 or :35", () => {
    // Stated outright by "Time Systems"; a consequence of the epoch minute
    // and the 20 minute day, checked over a whole month of day starts.
    for (let d = 0; d < 31; d++) {
      const minute = new Date(SKYBLOCK_EPOCH_MS + d * SKYBLOCK_DAY_MS).getUTCMinutes();
      expect([55, 15, 35]).toContain(minute);
    }
  });

  it("rolls Month 12 Day 31 into Month 1 Day 1 of the next year", () => {
    const lastTick = at(50, 12, 31, SKYBLOCK_DAY_MS - 1);
    expect(skyblockDate(lastTick)).toEqual({ year: 50, month: 12, day: 31 });
    expect(skyblockDate(lastTick + 1)).toEqual({ year: 51, month: 1, day: 1 });
  });

  it("never invents a date before the game existed", () => {
    expect(skyblockDate(SKYBLOCK_EPOCH_MS - 1)).toEqual({ year: 1, month: 1, day: 1 });
  });
});

describe("isEventLive", () => {
  it("opens the New Year Celebration on Late Winter 29-31 and not a day more", () => {
    expect(isEventLive("newYear", at(7, 12, 28, SKYBLOCK_DAY_MS - 1))).toBe(false);
    expect(isEventLive("newYear", at(7, 12, 29))).toBe(true);
    expect(isEventLive("newYear", at(7, 12, 31, SKYBLOCK_DAY_MS - 1))).toBe(true);
    // The wrap-around edge: the next millisecond is New Year's Day of the
    // following year, and the celebration is over.
    expect(isEventLive("newYear", at(7, 12, 31, SKYBLOCK_DAY_MS))).toBe(false);
    expect(skyblockDate(at(7, 12, 31, SKYBLOCK_DAY_MS))).toEqual({ year: 8, month: 1, day: 1 });
  });

  it("opens the Traveling Zoo twice a year, Early Summer and Early Winter 1-3", () => {
    expect(isEventLive("travelingZoo", at(12, 4, 1))).toBe(true);
    expect(isEventLive("travelingZoo", at(12, 4, 3))).toBe(true);
    expect(isEventLive("travelingZoo", at(12, 4, 4))).toBe(false);
    expect(isEventLive("travelingZoo", at(12, 10, 2))).toBe(true);
    expect(isEventLive("travelingZoo", at(12, 7, 2))).toBe(false);
  });

  it("opens the Spooky Festival on Autumn 29-31", () => {
    expect(isEventLive("spookyFestival", at(3, 8, 28))).toBe(false);
    expect(isEventLive("spookyFestival", at(3, 8, 29))).toBe(true);
    expect(isEventLive("spookyFestival", at(3, 8, 31))).toBe(true);
    expect(isEventLive("spookyFestival", at(3, 9, 1))).toBe(false);
  });

  it("opens the Season of Jerry on Late Winter 24-26, inside the workshop month", () => {
    expect(isEventLive("seasonOfJerry", at(9, 12, 23))).toBe(false);
    expect(isEventLive("seasonOfJerry", at(9, 12, 24))).toBe(true);
    expect(isEventLive("seasonOfJerry", at(9, 12, 26))).toBe(true);
    expect(isEventLive("seasonOfJerry", at(9, 12, 27))).toBe(false);
    // The workshop is open for the whole of Late Winter around it.
    expect(isEventLive("jerryWorkshop", at(9, 12, 1))).toBe(true);
    expect(isEventLive("jerryWorkshop", at(9, 12, 31))).toBe(true);
    expect(isEventLive("jerryWorkshop", at(9, 11, 31))).toBe(false);
    expect(isEventLive("jerryWorkshop", at(10, 1, 1))).toBe(false);
  });

  it("opens SkyBlock Bingo for the first seven REAL days of each month, UTC", () => {
    /*
     * The one deterministic event on the real calendar rather than the
     * in-game one: "for the first 7 days of every real life month" (Bingo
     * article, read 2026-08-03). Pinned at explicit UTC instants because the
     * SkyBlock date is irrelevant to it, and across a month boundary so the
     * off state is proven from both sides of the window.
     */
    expect(isEventLive("bingo", Date.UTC(2026, 7, 1, 0, 0, 0))).toBe(true); // Aug 1
    expect(isEventLive("bingo", Date.UTC(2026, 7, 7, 23, 59, 59))).toBe(true); // Aug 7, last minute
    expect(isEventLive("bingo", Date.UTC(2026, 7, 8, 0, 0, 0))).toBe(false); // Aug 8
    expect(isEventLive("bingo", Date.UTC(2026, 7, 15))).toBe(false); // mid-month
    expect(isEventLive("bingo", Date.UTC(2026, 7, 31, 23, 59, 59))).toBe(false); // month's end
    expect(isEventLive("bingo", Date.UTC(2026, 8, 1))).toBe(true); // Sep 1, next window
  });

  it("answers unknown, never a boolean, for events the calendar does not fix", () => {
    // Mining Fiesta, the Great Spook and their kind are scheduled by Hypixel
    // or by mayors, not by the in-game date, so no instant makes them "live".
    expect(isEventLive("unknown", at(5, 8, 30))).toBe("unknown");
    expect(isEventLive("unknown", SKYBLOCK_EPOCH_MS)).toBe("unknown");
  });
});
