import type { ExpansionPlan } from "./planExpansion.ts";

/**
 * What crosses the expansion worker boundary.
 *
 * Shared by both sides so the halves cannot drift, and everything here is
 * structured cloneable: plain arrays and plain objects only.
 *
 * Unlike the solver protocol there is no progress message. A plan is one
 * indivisible answer rather than a search that improves as it runs, so there
 * is no partial result worth showing, and the id exists only so a stale worker
 * reply cannot resolve a newer request.
 */
export interface ExpansionRequestMessage {
  type: "expansion";
  id: number;
  unlocked: [number, number][];
  locked: [number, number][];
}

export type ExpansionOutboundMessage =
  | { type: "result"; id: number; plan: ExpansionPlan }
  | { type: "error"; id: number; message: string };
