import { describe, expect, it } from "vitest";
import type { SavedLayout } from "../../../types/layout";
import { buildLayoutPreviewModel, buildLayoutPreviewStatus } from "../layoutPreviewModel";
import { mostRecentLayoutNickname, previewGridCells } from "../layoutPreviewPresentation";

const layout: SavedLayout = {
  id: "saved-1",
  name: "Garden",
  savedAt: 1,
  modifiedAt: 1,
  inputs: [
    { cropId: "wheat", position: [0, 0] },
    { cropId: "wheat", position: [0, 1] },
    { cropId: "cactus", position: [1, 0] },
  ],
  targets: [{ cropId: "soggybud", position: [2, 2] }],
};

const crops = {
  wheat: { name: "Wheat", size: 1, ground: "farmland" },
  cactus: { name: "Cactus", size: 1, ground: "sand" },
};

const mutations = {
  soggybud: { name: "Soggybud", size: 2, ground: "farmland" },
};

describe("Designer saved-layout preview model", () => {
  it("summarizes what the player plants, what it makes, and the occupied ground cells", () => {
    const preview = buildLayoutPreviewModel(
      layout,
      (id) => crops[id as keyof typeof crops],
      (id) => mutations[id as keyof typeof mutations],
    );

    expect(preview.plants).toEqual([
      { cropId: "wheat", name: "Wheat", count: 2 },
      { cropId: "cactus", name: "Cactus", count: 1 },
    ]);
    expect(preview.targets).toEqual([{ cropId: "soggybud", name: "Soggybud", count: 1 }]);
    expect(preview.grounds).toEqual([
      { key: "farmland", label: "Farmland", count: 6 },
      { key: "sand", label: "Sand", count: 1 },
    ]);
  });

  it("keeps alternate valid growth surfaces visible", () => {
    const preview = buildLayoutPreviewModel(
      { ...layout, inputs: [], targets: [{ cropId: "lonelily", position: [0, 0] }] },
      () => undefined,
      () => ({ name: "Lonelily", size: 1, ground: "farmland", grounds: ["farmland", "dirt"] }),
    );

    expect(preview.grounds).toEqual([
      { key: "farmland|dirt", label: "Farmland or Dirt", count: 1 },
    ]);
  });
});

describe("Designer saved-layout presentation", () => {
  it("pins every background cell to the intended explicit grid row and column", () => {
    const cells = previewGridCells();

    expect(cells).toHaveLength(100);
    expect(cells[0]).toEqual({ index: 0, gridColumnStart: 1, gridRowStart: 1 });
    expect(cells[99]).toEqual({ index: 99, gridColumnStart: 10, gridRowStart: 10 });
  });

  it("gives a watery layout a deterministic playful recent-layout name", () => {
    expect(
      mostRecentLayoutNickname({
        ...layout,
        inputs: [
          { cropId: "melon", position: [0, 0] },
          { cropId: "gloomgourd", position: [0, 1] },
        ],
        targets: [{ cropId: "soggybud", position: [1, 1] }],
      }),
    ).toBe("Soggy Field");
  });

  it("uses the primary target name when no themed nickname applies", () => {
    expect(
      mostRecentLayoutNickname({
        ...layout,
        inputs: [{ cropId: "wheat", position: [0, 0] }],
        targets: [{ cropId: "sunflower", position: [1, 1] }],
      }),
    ).toBe("Sunflower Patch");
  });

  it("derives the recent-layout name from what the field makes, not its ingredients", () => {
    expect(
      mostRecentLayoutNickname({
        ...layout,
        inputs: [
          { cropId: "melon", position: [4, 3] },
          { cropId: "pumpkin", position: [5, 3] },
        ],
        targets: [
          { cropId: "gloomgourd", position: [4, 4] },
          { cropId: "gloomgourd", position: [5, 4] },
        ],
      }),
    ).toBe("Gloom Grove");
  });
});

describe("Designer saved-layout mutation status", () => {
  it("marks a target delayed when every requirement becomes reachable", () => {
    const statusLayout: SavedLayout = {
      ...layout,
      inputs: [
        { cropId: "melon", position: [3, 3] },
        { cropId: "melon", position: [5, 5] },
        { cropId: "pumpkin", position: [4, 2] },
        { cropId: "melon", position: [6, 2] },
      ],
      targets: [
        { cropId: "gloomgourd", position: [4, 3] },
        { cropId: "gloomgourd", position: [5, 3] },
        { cropId: "soggybud", position: [4, 4] },
      ],
    };
    const cropDefinitions = {
      melon: { name: "Melon", size: 1, ground: "farmland" },
      pumpkin: { name: "Pumpkin", size: 1, ground: "farmland" },
    };
    const mutationDefinitions = {
      gloomgourd: {
        name: "Gloomgourd",
        size: 1,
        ground: "farmland",
        id: "gloomgourd",
        requirements: [
          { crop: "pumpkin", count: 1 },
          { crop: "melon", count: 1 },
        ],
        rarity: "rare",
        growth_stages: 1,
        positive_buffs: [],
        negative_buffs: [],
        drops: {},
      },
      soggybud: {
        name: "Soggybud",
        size: 1,
        ground: "farmland",
        id: "soggybud",
        requirements: [
          { crop: "melon", count: 2 },
          { crop: "gloomgourd", count: 2 },
        ],
        rarity: "rare",
        growth_stages: 1,
        positive_buffs: [],
        negative_buffs: [],
        drops: {},
      },
    };
    const model = buildLayoutPreviewModel(
      statusLayout,
      (id) => cropDefinitions[id as keyof typeof cropDefinitions],
      (id) => mutationDefinitions[id as keyof typeof mutationDefinitions],
    );

    const status = buildLayoutPreviewStatus(model, Object.values(mutationDefinitions));

    expect(status.counts).toEqual({ valid: 2, delayed: 1, invalid: 0 });
    expect(status.targets.find((target) => target.cropId === "soggybud")?.validation).toMatchObject({
      state: "delayed",
      missingRequirements: [],
      satisfiedRequirements: [
        { crop: "melon", have: 2, needed: 2 },
        { crop: "gloomgourd", have: 2, needed: 2 },
      ],
    });

    const underSupplied = buildLayoutPreviewModel(
      {
        ...statusLayout,
        inputs: statusLayout.inputs.filter(
          (input) => input.cropId !== "melon" || input.position[1] !== 5,
        ),
      },
      (id) => cropDefinitions[id as keyof typeof cropDefinitions],
      (id) => mutationDefinitions[id as keyof typeof mutationDefinitions],
    );
    const underSuppliedStatus = buildLayoutPreviewStatus(
      underSupplied,
      Object.values(mutationDefinitions),
    );

    expect(underSuppliedStatus.counts).toEqual({ valid: 2, delayed: 0, invalid: 1 });
    expect(
      underSuppliedStatus.targets.find((target) => target.cropId === "soggybud")?.validation,
    ).toMatchObject({
      state: "invalid",
      missingRequirements: [{ crop: "melon", have: 1, needed: 2 }],
      satisfiedRequirements: [{ crop: "gloomgourd", have: 2, needed: 2 }],
    });
  });
});
