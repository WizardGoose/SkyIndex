import type { CompanionLinkStore } from "./companionLink";

export interface CompanionTransportGate {
  /** Register one consumer that wants live companion data. */
  request: () => () => void;
  /** Release the preference subscription owned by this gate. */
  dispose: () => void;
}

/**
 * Starts localhost transport only when both conditions are true: the user has
 * explicitly linked the mod, and at least one mounted consumer needs it.
 */
export const createCompanionTransportGate = (
  access: Pick<CompanionLinkStore, "getSnapshot" | "subscribe">,
  start: () => void,
  stop: () => void,
): CompanionTransportGate => {
  let demand = 0;
  let running = false;

  const reconcile = () => {
    const shouldRun = demand > 0 && access.getSnapshot();
    if (shouldRun === running) return;
    running = shouldRun;
    if (running) start();
    else stop();
  };

  const unsubscribeAccess = access.subscribe(reconcile);

  return {
    request: () => {
      demand += 1;
      reconcile();
      let released = false;
      return () => {
        if (released) return;
        released = true;
        demand = Math.max(0, demand - 1);
        reconcile();
      };
    },
    dispose: () => {
      unsubscribeAccess();
      demand = 0;
      reconcile();
    },
  };
};
