import { describe, expect, it } from "vitest";
import type { DesignerPlacement } from "../../context/DesignerContext";
import type { MutationDefinition } from "../../types/greenhouse";
import { evaluateMutationTargets } from "../mutationValidation";

const placement = (
  id: string,
  cropId: string,
  position: [number, number],
  isMutation = false,
): DesignerPlacement => ({
  id,
  cropId,
  cropName: cropId,
  size: 1,
  position,
  isMutation,
});

const mutation = (id: string, requirements: MutationDefinition["requirements"]): MutationDefinition => ({
  id,
  name: id,
  size: 1,
  ground: "farmland",
  requirements,
  rarity: "common",
  growth_stages: 1,
  positive_buffs: [],
  negative_buffs: [],
  drops: {},
});

describe("designer mutation target readiness", () => {
  it("marks targets fed by other valid targets as delayed", () => {
    const inputs = [
      placement("pumpkin-top", "pumpkin", [4, 2]),
      placement("pumpkin-bottom", "pumpkin", [5, 2]),
      placement("melon-top-left", "melon", [3, 3]),
      placement("melon-top-right", "melon", [3, 4]),
      placement("melon-bottom-left", "melon", [6, 3]),
      placement("melon-bottom-right", "melon", [6, 4]),
    ];
    const targets = [
      placement("gloom-top", "gloomgourd", [4, 3], true),
      placement("gloom-bottom", "gloomgourd", [5, 3], true),
      placement("soggy-top", "soggybud", [4, 4], true),
      placement("soggy-bottom", "soggybud", [5, 4], true),
    ];

    const result = evaluateMutationTargets(inputs, targets, [
      mutation("gloomgourd", [
        { crop: "pumpkin", count: 1 },
        { crop: "melon", count: 1 },
      ]),
      mutation("soggybud", [
        { crop: "melon", count: 2 },
        { crop: "gloomgourd", count: 2 },
      ]),
    ]);

    expect(result.get("gloom-top")?.state).toBe("valid");
    expect(result.get("gloom-bottom")?.state).toBe("valid");
    expect(result.get("soggy-top")).toMatchObject({ state: "delayed", delay: 1 });
    expect(result.get("soggy-bottom")).toMatchObject({ state: "delayed", delay: 1 });
  });

  it("keeps a target invalid when a dependency grows first but another required quantity is still missing", () => {
    const inputs = [
      placement("melon-top", "melon", [3, 3]),
      placement("pumpkin", "pumpkin", [4, 2]),
      placement("melon-bottom", "melon", [6, 2]),
    ];
    const targets = [
      placement("gloom-top", "gloomgourd", [4, 3], true),
      placement("gloom-bottom", "gloomgourd", [5, 3], true),
      placement("soggy", "soggybud", [4, 4], true),
    ];

    const result = evaluateMutationTargets(inputs, targets, [
      mutation("gloomgourd", [
        { crop: "pumpkin", count: 1 },
        { crop: "melon", count: 1 },
      ]),
      mutation("soggybud", [
        { crop: "melon", count: 2 },
        { crop: "gloomgourd", count: 2 },
      ]),
    ]);

    expect(result.get("soggy")).toMatchObject({
      state: "invalid",
      delay: null,
      isValid: false,
      missingRequirements: [
        { crop: "melon", have: 1, needed: 2, satisfied: false },
      ],
      satisfiedRequirements: [
        { crop: "gloomgourd", have: 2, needed: 2, satisfied: true },
      ],
    });
  });

  it("supports multiple dependency generations without allowing a cycle to validate itself", () => {
    const inputs = [placement("seed", "seed", [4, 2])];
    const chainTargets = [
      placement("first", "first", [4, 3], true),
      placement("second", "second", [4, 4], true),
      placement("third", "third", [4, 5], true),
    ];
    const definitions = [
      mutation("first", [{ crop: "seed", count: 1 }]),
      mutation("second", [{ crop: "first", count: 1 }]),
      mutation("third", [{ crop: "second", count: 1 }]),
      mutation("cycle-a", [{ crop: "cycle-b", count: 1 }]),
      mutation("cycle-b", [{ crop: "cycle-a", count: 1 }]),
    ];

    const chain = evaluateMutationTargets(inputs, chainTargets, definitions);
    expect(chain.get("first")).toMatchObject({ state: "valid", delay: 0 });
    expect(chain.get("second")).toMatchObject({ state: "delayed", delay: 1 });
    expect(chain.get("third")).toMatchObject({ state: "delayed", delay: 2 });

    const cycle = evaluateMutationTargets([], [
      placement("cycle-a", "cycle-a", [4, 4], true),
      placement("cycle-b", "cycle-b", [4, 5], true),
    ], definitions);
    expect(cycle.get("cycle-a")?.state).toBe("invalid");
    expect(cycle.get("cycle-b")?.state).toBe("invalid");
  });
});
