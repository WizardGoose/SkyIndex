import { useCallback, useSyncExternalStore } from "react";
import { modReachable } from "./layout";

/** A local preference only. The island snapshot remains under its own key. */
export const COMPANION_LINK_KEY = "wizardsky.companion-linked.v1";

type LinkStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type Probe = () => Promise<boolean>;

export interface CompanionLinkStore {
  getSnapshot: () => boolean;
  subscribe: (listener: () => void) => () => void;
  link: (probe: Probe) => Promise<boolean>;
  unlink: () => void;
  /** Apply the value received from another tab's storage event. */
  sync: (raw: string | null) => void;
}

/**
 * The deliberate permission gate for every companion-mod connection.
 *
 * Creating or subscribing to this store is inert. Only `link` calls the
 * supplied localhost probe, and the preference is written only after that
 * probe has proved the mod is answering. This is what keeps an ordinary visit
 * to Skydex from opening Chromium's local-network permission prompt.
 */
export const createCompanionLinkStore = (
  storage: LinkStorage | null,
): CompanionLinkStore => {
  let linked = false;
  try {
    linked = storage?.getItem(COMPANION_LINK_KEY) === "1";
  } catch {
    linked = false;
  }

  const listeners = new Set<() => void>();
  const publish = (next: boolean) => {
    if (linked === next) return;
    linked = next;
    for (const listener of listeners) listener();
  };

  const remember = (next: boolean) => {
    try {
      if (next) storage?.setItem(COMPANION_LINK_KEY, "1");
      else storage?.removeItem(COMPANION_LINK_KEY);
    } catch {
      // Locked-down/private storage still permits this session to link.
    }
    publish(next);
  };

  return {
    getSnapshot: () => linked,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    link: async (probe) => {
      if (linked) return true;
      const reachable = await probe();
      if (!reachable) return false;
      remember(true);
      return true;
    },
    unlink: () => remember(false),
    sync: (raw) => publish(raw === "1"),
  };
};

const browserStorage = (): LinkStorage | null => {
  if (typeof localStorage === "undefined") return null;
  return localStorage;
};

const companionLink = createCompanionLinkStore(browserStorage());

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === COMPANION_LINK_KEY) companionLink.sync(event.newValue);
  });
}

export const isCompanionLinked = companionLink.getSnapshot;
export const subscribeCompanionLink = companionLink.subscribe;

export const useCompanionLink = () => {
  const linked = useSyncExternalStore(
    companionLink.subscribe,
    companionLink.getSnapshot,
    companionLink.getSnapshot,
  );

  const link = useCallback(
    (signal?: AbortSignal) => companionLink.link(() => modReachable(signal)),
    [],
  );
  const unlink = useCallback(() => companionLink.unlink(), []);

  return { linked, link, unlink };
};
