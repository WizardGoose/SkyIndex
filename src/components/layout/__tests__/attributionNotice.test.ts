import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AttributionNotice } from "../AttributionNotice";
import {
  ATTRIBUTION_NOTICE_KEY,
  hasSeenAttributionNotice,
  markAttributionNoticeSeen,
} from "../attributionNoticeState";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("first-visit attribution notice", () => {
  it("stays fixed above the page instead of inheriting relative panel positioning", () => {
    const markup = renderToStaticMarkup(createElement(AttributionNotice));

    expect(markup).toContain("fixed bottom-3");
    expect(markup).not.toContain("sd-lip");
  });

  it("uses one versioned local-only flag", () => {
    expect(ATTRIBUTION_NOTICE_KEY).toBe("skydex.attribution-notice.v1");

    const storage = new MemoryStorage();
    expect(hasSeenAttributionNotice(storage)).toBe(false);

    markAttributionNoticeSeen(storage);

    expect(hasSeenAttributionNotice(storage)).toBe(true);
    expect(storage.getItem(ATTRIBUTION_NOTICE_KEY)).not.toBeNull();
  });

  it("does not break dismissal when browser storage is unavailable", () => {
    const unavailable = {
      getItem: () => {
        throw new Error("storage disabled");
      },
      setItem: () => {
        throw new Error("storage disabled");
      },
    };

    expect(hasSeenAttributionNotice(unavailable)).toBe(false);
    expect(() => markAttributionNoticeSeen(unavailable)).not.toThrow();
  });
});
