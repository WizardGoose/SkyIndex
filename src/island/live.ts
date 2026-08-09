import { validateSnapshot } from "./validate";
import { modFeed } from "./merge";
import type { FeedSet } from "./merge";
import type { IslandSnapshot } from "./types";

/**
 * The live transport, minus the connection.
 *
 * The mod serves `GET /v1/events` as Server-Sent Events: one `island` event on
 * connect carrying the current snapshot, another every time a capture changes
 * it, and a heartbeat comment every 25 s. Browsers parse SSE natively, so the
 * whole thing costs zero dependencies, which is the rule this codebase runs on.
 *
 * Everything that decides *what a message means* lives here rather than inside
 * the `EventSource` callback, for two reasons. It can be tested by calling a
 * function with a string, with no fake `EventSource` and no DOM. And it makes
 * the important guarantee structural instead of a promise: on any failure these
 * functions return the caller's own `feeds` object **by identity**, so there is
 * no code path where a bad live message can replace stored data. The store
 * assigns whatever comes back, and assigning the same object is a no-op.
 *
 * Polling goes through `applyLivePayload` too. One validator, one assembly
 * step, one place where a snapshot becomes stored state, whichever transport
 * carried it.
 */

export const EVENTS_PATH = "/v1/events";

/** The named SSE event carrying a snapshot. Anything else on the stream is ignored. */
export const ISLAND_EVENT = "island";

export interface LiveResult {
  /** The next feed set, or the caller's own object unchanged when nothing was accepted. */
  feeds: FeedSet;
  /** Human-readable failure, or null on success. */
  error: string | null;
  /** The accepted snapshot, for callers that want it without digging into feeds. */
  snapshot: IslandSnapshot | null;
}

/**
 * Fold an already-parsed live payload into the feeds.
 *
 * This is the single gate. A snapshot that arrived over SSE and one that
 * arrived from a poll of `/v1/island` are the same kind of thing and get
 * exactly the same scrutiny; there is deliberately no looser path for the
 * streaming case just because it arrives more often.
 */
export function applyLivePayload(feeds: FeedSet, payload: unknown, at: number): LiveResult {
  let snapshot: IslandSnapshot;
  try {
    snapshot = validateSnapshot(payload);
  } catch (e) {
    // The mod is young and a bad build must not be able to overwrite good data
    // with nonsense. Report it, keep what we have.
    return { feeds, error: e instanceof Error ? e.message : String(e), snapshot: null };
  }
  return { feeds: { ...feeds, mod: modFeed(snapshot, at) }, error: null, snapshot };
}

/**
 * Fold a raw SSE `data` string into the feeds.
 *
 * SSE payloads are text, so this is `JSON.parse` plus the gate above. A
 * heartbeat never reaches here (comment lines are not events) and neither does
 * an unnamed message, so anything arriving is meant to be a snapshot.
 */
export function applyLiveMessage(feeds: FeedSet, data: unknown, at: number): LiveResult {
  if (typeof data !== "string" || data.trim() === "") {
    return { feeds, error: "The mod sent an empty live update.", snapshot: null };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    return { feeds, error: "The mod sent a live update that was not valid JSON.", snapshot: null };
  }

  return applyLivePayload(feeds, parsed, at);
}
