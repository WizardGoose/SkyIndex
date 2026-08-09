import { planExpansion } from "./planExpansion.ts";
import type { ExpansionRequestMessage, ExpansionOutboundMessage } from "./expansionProtocol.ts";

/**
 * The expansion planner, off the main thread.
 *
 * A full 88 step plan is several seconds of solid computation. Run inline it
 * would freeze the modal it was launched from, including the spinner meant to
 * show that it is working. The planner core is pure and synchronous, so as
 * with the solver worker there is nothing to do here but call it and report.
 */
const post = (msg: ExpansionOutboundMessage) =>
  (postMessage as (m: ExpansionOutboundMessage) => void)(msg);

self.onmessage = (event: MessageEvent<ExpansionRequestMessage>) => {
  const msg = event.data;
  if (!msg || msg.type !== "expansion") return;
  try {
    post({ type: "result", id: msg.id, plan: planExpansion(msg.unlocked, msg.locked) });
  } catch (err: unknown) {
    // A thrown plan is reported rather than left silent, for the same reason
    // the solver worker does it: an unsettled promise spins the UI forever.
    const message = err instanceof Error ? err.message : "Expansion planning failed";
    post({ type: "error", id: msg.id, message });
  }
};
