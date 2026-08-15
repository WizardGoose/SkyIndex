import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../context", () => ({
  useGreenhouseData: () => ({
    mutations: [
      {
        id: "soggybud",
        name: "Soggybud",
        size: 1,
        ground: "farmland",
        requirements: [
          { crop: "melon", count: 1 },
          { crop: "gloomgourd", count: 1 },
        ],
        rarity: "rare",
        growth_stages: 1,
        positive_buffs: [],
        negative_buffs: [],
        drops: {},
      },
    ],
    getCropDef: (id: string) =>
      ({
        melon: { name: "Melon", size: 1, ground: "farmland" },
        gloomgourd: { name: "Gloomgourd", size: 1, ground: "farmland" },
      })[id],
    getMutationDef: (id: string) =>
      ({ soggybud: { name: "Soggybud", size: 1, ground: "farmland" } })[id],
  }),
}));

import { DesignerLayoutPreview } from "../DesignerLayoutPreview";

describe("Designer layout preview links", () => {
  it("links crops and mutations in both the grid and inventory summary to their wiki articles", () => {
    const markup = renderToStaticMarkup(
      React.createElement(DesignerLayoutPreview, {
        layout: {
          inputs: [
            { cropId: "melon", position: [4, 3] },
            { cropId: "gloomgourd", position: [4, 5] },
          ],
          targets: [{ cropId: "soggybud", position: [4, 4] }],
        },
      }),
    );

    expect(markup.match(/https:\/\/hypixelskyblock\.minecraft\.wiki\/wiki\/Gloomgourd/g)).toHaveLength(2);
    expect(markup.match(/https:\/\/hypixelskyblock\.minecraft\.wiki\/wiki\/Soggybud/g)).toHaveLength(2);
    expect(markup).toContain("Gloomgourd on the wiki");
    expect(markup).toContain("Soggybud on the wiki");
    expect(markup).toContain('<span class="inline-flex min-w-0 items-center gap-1.5">');
    expect(markup).toContain("md:grid-cols-[minmax(22rem,26rem)_minmax(0,1fr)]");
    expect(markup).toContain("Mutation status");
    expect(markup).toContain('data-preview-target-state="');
  });
});
