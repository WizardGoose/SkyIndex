import type { SavedLayout } from "../../types/layout";
import type { DesignerPlacement } from "../../context/DesignerContext";
import type { MutationDefinition } from "../../types/greenhouse";
import { evaluateMutationTargets, type EvaluatedMutationTarget } from "../../utilities/mutationValidation";

export interface LayoutPreviewDefinition {
  name: string;
  size: number;
  ground: string;
  grounds?: string[];
}

export interface LayoutPreviewPlacement {
  id: string;
  cropId: string;
  name: string;
  position: [number, number];
  size: number;
  ground: string | null;
  grounds: string[];
  isTarget: boolean;
}

export interface LayoutPreviewCount {
  cropId: string;
  name: string;
  count: number;
}

export interface LayoutPreviewGround {
  key: string;
  label: string;
  count: number;
}

export interface LayoutPreviewModel {
  placements: LayoutPreviewPlacement[];
  plants: LayoutPreviewCount[];
  targets: LayoutPreviewCount[];
  grounds: LayoutPreviewGround[];
}

export interface LayoutPreviewTargetStatus {
  id: string;
  cropId: string;
  name: string;
  validation: EvaluatedMutationTarget;
}

export interface LayoutPreviewStatus {
  counts: Record<"valid" | "delayed" | "invalid", number>;
  targets: LayoutPreviewTargetStatus[];
}

type DefinitionLookup = (id: string) => LayoutPreviewDefinition | undefined;

const title = (id: string): string =>
  id
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const countsFor = (placements: LayoutPreviewPlacement[]): LayoutPreviewCount[] => {
  const counts = new Map<string, LayoutPreviewCount>();
  for (const placement of placements) {
    const current = counts.get(placement.cropId);
    if (current) current.count += 1;
    else counts.set(placement.cropId, { cropId: placement.cropId, name: placement.name, count: 1 });
  }
  return [...counts.values()];
};

export const buildLayoutPreviewModel = (
  layout: SavedLayout,
  getCropDef: DefinitionLookup,
  getMutationDef: DefinitionLookup,
): LayoutPreviewModel => {
  const enhance = (isTarget: boolean) =>
    (placement: SavedLayout["inputs"][number], index: number): LayoutPreviewPlacement => {
      const definition = isTarget
        ? getMutationDef(placement.cropId) ?? getCropDef(placement.cropId)
        : getCropDef(placement.cropId) ?? getMutationDef(placement.cropId);
      const grounds = definition ? definition.grounds ?? [definition.ground] : [];
      return {
        id: `${isTarget ? "target" : "input"}-${index}-${placement.cropId}-${placement.position.join("-")}`,
        cropId: placement.cropId,
        name: definition?.name ?? title(placement.cropId),
        position: placement.position,
        size: definition?.size ?? 1,
        ground: grounds[0] ?? null,
        grounds,
        isTarget,
      };
    };

  const inputs = layout.inputs.map(enhance(false));
  const targets = layout.targets.map(enhance(true));
  const placements = [...inputs, ...targets];

  const occupiedGround = new Map<string, { key: string; grounds: string[] }>();
  for (const placement of placements) {
    if (placement.grounds.length === 0) continue;
    const key = placement.grounds.join("|");
    const [row, col] = placement.position;
    for (let rowOffset = 0; rowOffset < placement.size; rowOffset += 1) {
      for (let colOffset = 0; colOffset < placement.size; colOffset += 1) {
        occupiedGround.set(`${row + rowOffset},${col + colOffset}`, { key, grounds: placement.grounds });
      }
    }
  }

  const grounds = new Map<string, LayoutPreviewGround>();
  for (const cell of occupiedGround.values()) {
    const current = grounds.get(cell.key);
    if (current) current.count += 1;
    else {
      grounds.set(cell.key, {
        key: cell.key,
        label: cell.grounds.map(title).join(" or "),
        count: 1,
      });
    }
  }

  return {
    placements,
    plants: countsFor(inputs),
    targets: countsFor(targets),
    grounds: [...grounds.values()],
  };
};

export const buildLayoutPreviewStatus = (
  model: LayoutPreviewModel,
  mutations: MutationDefinition[],
): LayoutPreviewStatus => {
  const toDesignerPlacement = (placement: LayoutPreviewPlacement): DesignerPlacement => ({
    id: placement.id,
    cropId: placement.cropId,
    cropName: placement.name,
    size: placement.size,
    position: placement.position,
    isMutation: placement.isTarget,
  });
  const inputs = model.placements.filter((placement) => !placement.isTarget).map(toDesignerPlacement);
  const targetPlacements = model.placements.filter((placement) => placement.isTarget);
  const targets = targetPlacements.map(toDesignerPlacement);
  const evaluated = evaluateMutationTargets(inputs, targets, mutations);
  const targetStatus = targetPlacements.map((target) => ({
    id: target.id,
    cropId: target.cropId,
    name: target.name,
    validation: evaluated.get(target.id) ?? {
      state: "invalid" as const,
      delay: null,
      isValid: false,
      missingRequirements: [],
      satisfiedRequirements: [],
    },
  }));

  return {
    counts: {
      valid: targetStatus.filter((target) => target.validation.state === "valid").length,
      delayed: targetStatus.filter((target) => target.validation.state === "delayed").length,
      invalid: targetStatus.filter((target) => target.validation.state === "invalid").length,
    },
    targets: targetStatus,
  };
};
