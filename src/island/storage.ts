import { validateSnapshot } from "./validate";
import { deriveSections, SECTION_KEYS } from "./merge";
import type { FeedSet, IslandFeed, IslandSource, SectionKey, SectionState } from "./merge";

/**
 * How the island lives on disk.
 *
 * There is exactly one key, `wizardsky.island.v1`, and it has held two shapes
 * over its life:
 *
 *   v1  `{ receivedAt, snapshot }` - one feed, from the mod, before the API
 *       existed as a source.
 *   v2  `{ v: 2, feeds: { mod?, api? } }` - the same data plus per-feed section
 *       provenance.
 *
 * The v1 shape is read forward as the mod feed, permanently. Not for one
 * release, not behind a flag: a browser that has not opened this page in a year
 * still has a v1 blob sitting there, and the day it does open it that blob is
 * the player's entire chest history. The reader tolerates both shapes for as
 * long as this code exists, nothing is ever deleted on migration, and the write
 * path is only ever reached after a successful read.
 *
 * The key name did not change with the shape. Bumping it to `.v2` would have
 * meant either abandoning every existing snapshot or writing a second key to
 * migrate between, and both are worse than versioning inside the value.
 */

export const ISLAND_KEY = "wizardsky.island.v1";

const STORED_VERSION = 2;

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const SOURCES: readonly IslandSource[] = ["mod", "api"];

const STATES: readonly SectionState[] = ["captured", "empty", "hidden", "absent"];

const isState = (v: unknown): v is SectionState => typeof v === "string" && (STATES as readonly string[]).includes(v);

/**
 * Rebuild a feed's section states.
 *
 * Most states can be re-derived from the snapshot, but `hidden` cannot - an API
 * feed whose sacks are private stores an empty `sacks` object, and only the
 * stored state remembers why. So stored values are trusted when they are one of
 * the four known states and re-derived otherwise, which also repairs a blob
 * written by a future build using a state this one has never heard of.
 */
const readSections = (
  raw: unknown,
  snapshot: Parameters<typeof deriveSections>[0]
): Record<SectionKey, SectionState> => {
  const derived = deriveSections(snapshot);
  if (!isObject(raw)) return derived;

  const out = { ...derived };
  for (const key of SECTION_KEYS) {
    const value = raw[key];
    if (isState(value)) out[key] = value;
  }
  return out;
};

const readFeed = (source: IslandSource, raw: unknown): IslandFeed | null => {
  if (!isObject(raw)) return null;
  try {
    const snapshot = validateSnapshot(raw.snapshot);
    const receivedAt = typeof raw.receivedAt === "number" && Number.isFinite(raw.receivedAt) ? raw.receivedAt : 0;
    // `source` is taken from the map key, never from the stored object, so a
    // hand-edited blob cannot make an API feed claim to be the mod.
    return { source, receivedAt, snapshot, sections: readSections(raw.sections, snapshot) };
  } catch {
    // One unreadable feed does not cost us the other.
    return null;
  }
};

/**
 * Parse whatever is in localStorage into feeds.
 *
 * Never throws. An unreadable blob yields no feeds and is left exactly where it
 * is on disk - this module has no delete path at all; clearing is an explicit
 * user action elsewhere.
 */
export function decodeFeeds(raw: string | null): FeedSet {
  if (!raw) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!isObject(parsed)) return {};

  // v2 and anything later that keeps a `feeds` map. The version number is not
  // gated on, so a v3 blob with familiar feeds still reads rather than being
  // thrown away by a build that predates it.
  if (isObject(parsed.feeds)) {
    const out: FeedSet = {};
    for (const source of SOURCES) {
      const feed = readFeed(source, parsed.feeds[source]);
      if (feed) out[source] = feed;
    }
    return out;
  }

  // v1: a bare `{ receivedAt, snapshot }` from before the API feed existed.
  // Everything the old build ever stored came from the mod.
  if ("snapshot" in parsed) {
    const feed = readFeed("mod", parsed);
    if (feed) return { mod: feed };
  }

  return {};
}

/** Serialise feeds for storage. Explicit field list, so nothing incidental rides along. */
export function encodeFeeds(feeds: FeedSet): string {
  const out: Record<string, unknown> = {};
  for (const source of SOURCES) {
    const feed = feeds[source];
    if (!feed) continue;
    out[source] = { receivedAt: feed.receivedAt, snapshot: feed.snapshot, sections: feed.sections };
  }
  return JSON.stringify({ v: STORED_VERSION, feeds: out });
}
