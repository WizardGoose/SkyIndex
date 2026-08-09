import { planExpansion, type ExpansionPlan } from "./planExpansion.ts";
import type { ExpansionRequestMessage, ExpansionOutboundMessage } from "./expansionProtocol.ts";

/**
 * Runs an expansion plan, off the main thread where that is possible.
 *
 * A worker is created per request and torn down after it, rather than kept
 * alive like the solver's. Planning is a deliberate button press that happens
 * once in a while, not a burst of dozens of solves, so a resident worker would
 * hold memory for minutes to save a few milliseconds of startup once.
 *
 * The synchronous fallback is not an afterthought. Anywhere without `Worker`,
 * which includes the test environment and any server side render, still gets a
 * correct plan; it just blocks while it computes. Same answer either way: the
 * planner is deterministic and shares no state with its caller.
 */
export interface ExpansionClientOptions {
  /** Test and diagnostic seam, matching the solver client's shape. */
  createWorker?: () => Worker | null;
}

const defaultCreateWorker = (): Worker | null => {
  if (typeof Worker === "undefined") return null;
  try {
    // The URL form is what lets Vite find, bundle and fingerprint the worker.
    return new Worker(new URL("./expansion.worker.ts", import.meta.url), { type: "module" });
  } catch {
    // Some environments expose `Worker` but refuse to build a module one. The
    // synchronous path is perfectly correct, so fall back rather than fail.
    return null;
  }
};

let nextId = 1;

export const runExpansion = (
  unlocked: [number, number][],
  locked: [number, number][],
  options: ExpansionClientOptions = {}
): Promise<ExpansionPlan> => {
  const createWorker = options.createWorker ?? defaultCreateWorker;
  const worker = createWorker();
  if (!worker) return Promise.resolve(planExpansion(unlocked, locked));

  const id = nextId++;
  return new Promise<ExpansionPlan>((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      worker.terminate();
      fn();
    };

    worker.onmessage = (event: MessageEvent<ExpansionOutboundMessage>) => {
      const msg = event.data;
      if (!msg || msg.id !== id) return;
      if (msg.type === "result") finish(() => resolve(msg.plan));
      else if (msg.type === "error") finish(() => reject(new Error(msg.message)));
    };

    /*
     * A worker that dies mid-plan must reject rather than hang. Without this
     * the caller's promise never settles and the modal spins forever, which is
     * a worse failure than an error message.
     */
    worker.onerror = () => finish(() => reject(new Error("Expansion planning failed")));

    const request: ExpansionRequestMessage = { type: "expansion", id, unlocked, locked };
    worker.postMessage(request);
  });
};
