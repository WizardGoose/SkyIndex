import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { DesignerPlacement } from "../../context/DesignerContext";
import type { MutationDefinition } from "../../types/greenhouse";
import { generateMutationLayout } from "../mutationLayoutGenerator";
import { evaluateMutationTargets } from "../mutationValidation";

type MutationDataset = {
  mutations: Record<string, Omit<MutationDefinition, "id">>;
};

const dataset = JSON.parse(
  readFileSync(resolve(process.cwd(), "public/greenhouse/data.json"), "utf8"),
) as MutationDataset;

const mutations: MutationDefinition[] = Object.entries(dataset.mutations).map(
  ([id, definition]) => ({ id, ...definition }),
);
const mutationById = new Map(mutations.map((mutation) => [mutation.id, mutation]));
const mutationIds = new Set(mutationById.keys());

const placement = (
  id: string,
  cropId: string,
  position: [number, number],
  size = 1,
  isMutation = false,
): DesignerPlacement => ({
  id,
  cropId,
  cropName: mutationById.get(cropId)?.name ?? cropId,
  size,
  position,
  isMutation,
});

const ringCells = (size: number): [number, number][] => {
  const cells: [number, number][] = [];
  for (let rowOffset = -1; rowOffset <= size; rowOffset += 1) {
    for (let colOffset = -1; colOffset <= size; colOffset += 1) {
      const insideTarget =
        rowOffset >= 0 &&
        rowOffset < size &&
        colOffset >= 0 &&
        colOffset < size;
      if (!insideTarget) cells.push([4 + rowOffset, 4 + colOffset]);
    }
  }
  return cells;
};

describe("dataset-wide mutation readiness audit", () => {
  it("accepts every generated complete layout and rejects every one-crop-short variant", () => {
    const issues: string[] = [];

    for (const mutation of mutations) {
      const layout = generateMutationLayout(
        mutation.id,
        mutation.size,
        mutation.requirements,
      );
      const inputs: DesignerPlacement[] = [];
      for (let row = 0; row < layout.grid.length; row += 1) {
        for (let col = 0; col < layout.grid[row].length; col += 1) {
          const cell = layout.grid[row][col];
          if (!cell || cell.isCenter) continue;
          inputs.push(placement(`input-${row}-${col}`, cell.cropId, [row, col]));
        }
      }
      const target = placement(
        `target-${mutation.id}`,
        mutation.id,
        layout.centerPosition,
        mutation.size,
        true,
      );
      const complete = evaluateMutationTargets(inputs, [target], mutations).get(target.id);
      if (complete?.state !== "valid") {
        issues.push(`${mutation.id}: complete generated layout was ${complete?.state ?? "missing"}`);
      }

      for (const requirement of mutation.requirements) {
        const removedIndex = inputs.findIndex(
          (input) => input.cropId === requirement.crop,
        );
        if (removedIndex === -1) {
          issues.push(`${mutation.id}: generator omitted ${requirement.crop}`);
          continue;
        }
        const oneShort = inputs.filter((_, index) => index !== removedIndex);
        const incomplete = evaluateMutationTargets(oneShort, [target], mutations).get(target.id);
        if (incomplete?.state !== "invalid") {
          issues.push(
            `${mutation.id}: ${requirement.crop} one short was ${incomplete?.state ?? "missing"}`,
          );
        }
      }
    }

    expect(issues).toEqual([]);
  });

  it("marks dependency layouts delayed only when every final quantity is reachable", () => {
    const issues: string[] = [];

    for (const mutation of mutations) {
      const dependencyCrops = new Set(
        mutation.requirements
          .map((requirement) => requirement.crop)
          .filter((cropId) => mutationIds.has(cropId)),
      );
      if (dependencyCrops.size === 0) continue;

      const cells = ringCells(mutation.size);
      const definitions = [
        ...[...dependencyCrops].map((cropId) => ({
          ...mutationById.get(cropId)!,
          requirements: [],
        })),
        mutation,
      ];

      const buildScenario = (missingRequirementIndex: number | null) => {
        const inputs: DesignerPlacement[] = [];
        const dependencies: DesignerPlacement[] = [];
        let cellIndex = 0;

        mutation.requirements.forEach((requirement, requirementIndex) => {
          const count = Math.max(
            0,
            requirement.count - (requirementIndex === missingRequirementIndex ? 1 : 0),
          );
          for (let index = 0; index < count; index += 1) {
            const cell = cells[cellIndex++];
            const next = placement(
              `${requirement.crop}-${requirementIndex}-${index}`,
              requirement.crop,
              cell,
              1,
              dependencyCrops.has(requirement.crop),
            );
            (next.isMutation ? dependencies : inputs).push(next);
          }
        });

        const target = placement(
          `target-${mutation.id}`,
          mutation.id,
          [4, 4],
          mutation.size,
          true,
        );
        return {
          target,
          result: evaluateMutationTargets(
            inputs,
            [...dependencies, target],
            definitions,
          ).get(target.id),
        };
      };

      const complete = buildScenario(null);
      if (complete.result?.state !== "delayed") {
        issues.push(`${mutation.id}: complete dependency layout was ${complete.result?.state ?? "missing"}`);
      }

      mutation.requirements.forEach((requirement, requirementIndex) => {
        const incomplete = buildScenario(requirementIndex);
        if (incomplete.result?.state !== "invalid") {
          issues.push(
            `${mutation.id}: unreachable ${requirement.crop} quantity was ${incomplete.result?.state ?? "missing"}`,
          );
        }
      });
    }

    expect(issues).toEqual([]);
  });
});
