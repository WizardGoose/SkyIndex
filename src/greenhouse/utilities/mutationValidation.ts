import type { DesignerPlacement, MutationValidationInfo, RequirementInfo } from "../context/DesignerContext";
import type { MutationDefinition } from "../types/greenhouse";

export type MutationReadiness = "valid" | "delayed" | "invalid";

export interface EvaluatedMutationTarget extends MutationValidationInfo {
  state: MutationReadiness;
  /** Zero is ready now; one or more means that many mutation generations. */
  delay: number | null;
}

const cellsFor = (placement: DesignerPlacement): Array<[number, number]> => {
  const cells: Array<[number, number]> = [];
  for (let row = 0; row < placement.size; row++) {
    for (let col = 0; col < placement.size; col++) {
      cells.push([placement.position[0] + row, placement.position[1] + col]);
    }
  }
  return cells;
};

const adjacentCellKeys = (target: DesignerPlacement): Set<string> => {
  const [targetRow, targetCol] = target.position;
  const keys = new Set<string>();

  for (let row = 0; row < target.size; row++) {
    for (let col = 0; col < target.size; col++) {
      const cellRow = targetRow + row;
      const cellCol = targetCol + col;
      for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
        for (let colOffset = -1; colOffset <= 1; colOffset++) {
          if (rowOffset === 0 && colOffset === 0) continue;
          const neighborRow = cellRow + rowOffset;
          const neighborCol = cellCol + colOffset;
          if (
            neighborRow >= targetRow &&
            neighborRow < targetRow + target.size &&
            neighborCol >= targetCol &&
            neighborCol < targetCol + target.size
          ) continue;
          keys.add(`${neighborRow},${neighborCol}`);
        }
      }
    }
  }

  return keys;
};

const requirementInfo = (
  target: DesignerPlacement,
  mutation: MutationDefinition | undefined,
  available: DesignerPlacement[],
): Pick<MutationValidationInfo, "missingRequirements" | "satisfiedRequirements"> & { requirementsMet: boolean } => {
  if (!mutation) {
    return { requirementsMet: false, missingRequirements: [], satisfiedRequirements: [] };
  }

  const adjacent = adjacentCellKeys(target);
  const cellsByCrop = new Map<string, Set<string>>();
  for (const placement of available) {
    for (const [row, col] of cellsFor(placement)) {
      const key = `${row},${col}`;
      if (!adjacent.has(key)) continue;
      const cells = cellsByCrop.get(placement.cropId) ?? new Set<string>();
      cells.add(key);
      cellsByCrop.set(placement.cropId, cells);
    }
  }

  const missingRequirements: RequirementInfo[] = [];
  const satisfiedRequirements: RequirementInfo[] = [];
  for (const requirement of mutation.requirements) {
    const have = cellsByCrop.get(requirement.crop)?.size ?? 0;
    const info: RequirementInfo = {
      crop: requirement.crop,
      needed: requirement.count,
      have,
      satisfied: have >= requirement.count,
    };
    (info.satisfied ? satisfiedRequirements : missingRequirements).push(info);
  }

  return {
    requirementsMet: missingRequirements.length === 0,
    missingRequirements,
    satisfiedRequirements,
  };
};

/**
 * Resolve target mutations in growth waves. Inputs are available at wave 0;
 * targets that grow from them are ready now, and only become inputs for the
 * following wave. This prevents circular targets from validating each other.
 */
export const evaluateMutationTargets = (
  inputs: DesignerPlacement[],
  targets: DesignerPlacement[],
  mutations: MutationDefinition[],
): Map<string, EvaluatedMutationTarget> => {
  const definitions = new Map(mutations.map((mutation) => [mutation.id, mutation]));
  const result = new Map<string, EvaluatedMutationTarget>();
  const available = [...inputs];
  let pending = [...targets];
  let wave = 0;

  while (pending.length > 0) {
    const ready = pending.filter((target) =>
      requirementInfo(target, definitions.get(target.cropId), available).requirementsMet
    );
    if (ready.length === 0) break;

    for (const target of ready) {
      const details = requirementInfo(target, definitions.get(target.cropId), available);
      result.set(target.id, {
        state: wave === 0 ? "valid" : "delayed",
        delay: wave,
        isValid: wave === 0,
        missingRequirements: details.missingRequirements,
        satisfiedRequirements: details.satisfiedRequirements,
      });
    }

    const readyIds = new Set(ready.map((target) => target.id));
    pending = pending.filter((target) => !readyIds.has(target.id));
    available.push(...ready);
    wave += 1;
  }

  for (const target of pending) {
    const details = requirementInfo(target, definitions.get(target.cropId), available);
    result.set(target.id, {
      state: "invalid",
      delay: null,
      isValid: false,
      missingRequirements: details.missingRequirements,
      satisfiedRequirements: details.satisfiedRequirements,
    });
  }

  return result;
};
