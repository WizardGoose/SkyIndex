export const ATTRIBUTION_NOTICE_KEY = "skydex.attribution-notice.v1";

type AttributionStorage = Pick<Storage, "getItem" | "setItem">;

const browserStorage = (): AttributionStorage | null => {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
};

export const hasSeenAttributionNotice = (
  storage: AttributionStorage | null = browserStorage(),
): boolean => {
  if (!storage) return false;
  try {
    return storage.getItem(ATTRIBUTION_NOTICE_KEY) !== null;
  } catch {
    return false;
  }
};

export const markAttributionNoticeSeen = (
  storage: AttributionStorage | null = browserStorage(),
): void => {
  if (!storage) return;
  try {
    storage.setItem(
      ATTRIBUTION_NOTICE_KEY,
      JSON.stringify({ v: 1, seenAt: Date.now() }),
    );
  } catch {
    // Dismissal still lasts for this page through component state.
  }
};
