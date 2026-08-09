import { solveLocal } from "../solver";
import type { SolveRequestMessage, WorkerOutboundMessage } from "./protocol";

/**
 * The solver, off the main thread.
 *
 * A solve runs for about a second of solid computation. On the main thread that
 * is a second of frozen scrolling, dead buttons and a progress spinner that
 * cannot even spin, which is the specific reason this work used to be posted to
 * a server instead. Here it is simply moved one thread across.
 *
 * This file is deliberately almost empty. The core is pure and synchronous - no
 * DOM, no fetch, no storage - so there is nothing to do but call it and report
 * what comes back. Caching, cancellation, request routing and progress shaping
 * all live on the client side, where they can be tested without a worker.
 */

const post = (msg: WorkerOutboundMessage) => (postMessage as (m: WorkerOutboundMessage) => void)(msg);

self.onmessage = (event: MessageEvent<SolveRequestMessage>) => {
  const msg = event.data;
  if (!msg || msg.type !== "solve") return;

  try {
    const response = solveLocal(msg.cells, msg.targets, msg.dataset, {
      ...msg.options,
      // Annotated rather than inferred. The core's own signature already says
      // this, but spelling it out keeps the worker readable on its own and
      // makes a change to that callback's shape a visible error here.
      onProgress: (best: number, elapsedMs: number) =>
        post({ type: "progress", id: msg.id, best, elapsedMs }),
    });
    post({ type: "result", id: msg.id, response });
  } catch (err: unknown) {
    /*
     * A thrown solve is reported, never left silent.
     *
     * Without this the client's promise for that id would simply never settle
     * and the UI would spin forever, which is a far worse failure than an
     * error message. The id is echoed so only the request that failed is
     * rejected; anything else in flight carries on.
     */
    const message = err instanceof Error ? err.message : "Greenhouse solve failed";
    post({ type: "error", id: msg.id, message });
  }
};
