import { describe, it, expect } from "vitest";
import { parseTierResponse, tierCacheFresh, TIERS_TTL, type CategoriesResponse } from "../wikiTiers";

/**
 * Fixtures are minimal synthetic JSON shaped like the wiki's
 * `prop=categories&redirects=1` responses: the same `normalized`, `redirects`
 * and `pages` arrays, with invented page names. Structure is copied, content
 * is not.
 */

describe("parseTierResponse", () => {
  it("reads a tier category straight off the asked page", () => {
    const body: CategoriesResponse = {
      query: {
        pages: [
          {
            title: "Accretion Talisman",
            categories: [{ title: "Category:Accessories" }, { title: "Category:Common items" }],
          },
        ],
      },
    };
    expect(parseTierResponse(body, ["Accretion Talisman"])).toEqual({ accretiontalisman: "COMMON" });
  });

  it("follows normalisation and a redirect back to the asked name", () => {
    // "Angler Helmet" redirects to the set page "Angler Armor", which is the
    // page that carries the tier for all four pieces. The answer has to land
    // under the name that was asked, or the caller can never find it.
    const body: CategoriesResponse = {
      query: {
        normalized: [{ from: "Angler_Helmet", to: "Angler Helmet" }],
        redirects: [{ from: "Angler Helmet", to: "Angler Armor" }],
        pages: [{ title: "Angler Armor", categories: [{ title: "Category:Common items" }] }],
      },
    };
    expect(parseTierResponse(body, ["Angler_Helmet"])).toEqual({ anglerhelmet: "COMMON" });
  });

  it("records null for a page with no tier category, and for a missing page", () => {
    const body: CategoriesResponse = {
      query: {
        pages: [
          { title: "Ammonite", categories: [{ title: "Category:Pets" }] },
          { title: "Ghost Widget", missing: true },
        ],
      },
    };
    expect(parseTierResponse(body, ["Ammonite", "Ghost Widget"])).toEqual({
      ammonite: null,
      ghostwidget: null,
    });
  });

  it("refuses to pick between several tier categories on one page", () => {
    // A set page listing pieces of different rarities states no single tier;
    // choosing one would be a guess wearing a colour.
    const body: CategoriesResponse = {
      query: {
        pages: [
          {
            title: "Mixed Set",
            categories: [{ title: "Category:Common items" }, { title: "Category:Rare items" }],
          },
        ],
      },
    };
    expect(parseTierResponse(body, ["Mixed Set"])).toEqual({ mixedset: null });
  });

  it("spells multi-word tiers the way the index does", () => {
    const body: CategoriesResponse = {
      query: {
        pages: [{ title: "Party Hat", categories: [{ title: "Category:Very Special items" }] }],
      },
    };
    expect(parseTierResponse(body, ["Party Hat"])).toEqual({ partyhat: "VERY_SPECIAL" });
  });
});

describe("tierCacheFresh", () => {
  it("treats a cache inside the TTL as fresh and an old one as stale", () => {
    expect(tierCacheFresh({ fetchedAt: Date.now(), tiers: {} })).toBe(true);
    expect(tierCacheFresh({ fetchedAt: Date.now() - TIERS_TTL - 1, tiers: {} })).toBe(false);
    expect(tierCacheFresh({ fetchedAt: 0, tiers: {} })).toBe(false);
  });
});
