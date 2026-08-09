import type { MutationGoal, SolveResponse } from "../types/greenhouse";
import type { SolverDataset } from "../solver";
import type { CacheableSolveOptions } from "./cacheKey";

/**
 * What crosses the worker boundary.
 *
 * Shared by both sides so the two halves cannot drift. Every message carries the
 * request `id` it belongs to: one worker serves many calls, and without an id a
 * late progress tick from an abandoned solve would be indistinguishable from a
 * live one and would drive the wrong spinner.
 *
 * Everything here is structured cloneable - plain arrays, plain objects, no
 * functions and no class instances - which is why `onProgress` is a message
 * rather than a callback passed through.
 */

export interface SolveRequestMessage {
  type: "solve";
  id: number;
  cells: [number, number][];
  targets: MutationGoal[];
  /**
   * Sent in full on every request.
   *
   * Keeping a copy in the worker and posting only a fingerprint would save a
   * structured clone of a few hundred kilobytes, which is around a millisecond
   * against a solve of around a second. It would also introduce a handshake
   * that has to stay correct across worker restarts. Not a trade worth making.
   */
  dataset: SolverDataset;
  options: CacheableSolveOptions;
}

export type WorkerOutboundMessage =
  | { type: "progress"; id: number; best: number; elapsedMs: number }
  | { type: "result"; id: number; response: SolveResponse }
  | { type: "error"; id: number; message: string };
