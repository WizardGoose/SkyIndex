import type { SavedLayout } from "../../types/layout";

export interface PreviewGridCell {
  index: number;
  gridColumnStart: number;
  gridRowStart: number;
}

export const previewGridCells = (): PreviewGridCell[] =>
  Array.from({ length: 100 }, (_, index) => ({
    index,
    gridColumnStart: (index % 10) + 1,
    gridRowStart: Math.floor(index / 10) + 1,
  }));

const TARGET_NICKNAMES: Record<string, string> = {
  soggybud: "Soggy Field",
  gloomgourd: "Gloom Grove",
  cream_bloom: "Cream Meadow",
  creambloom: "Cream Meadow",
};

const title = (id: string): string =>
  id
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const mostRecentLayoutNickname = (layout: Pick<SavedLayout, "inputs" | "targets">): string => {
  const targetCounts = new Map<string, number>();
  for (const placement of layout.targets) {
    const id = placement.cropId.toLowerCase();
    targetCounts.set(id, (targetCounts.get(id) ?? 0) + 1);
  }
  const primaryTarget = [...targetCounts.entries()]
    .sort((left, right) => right[1] - left[1])[0]?.[0];
  if (primaryTarget) return TARGET_NICKNAMES[primaryTarget] ?? `${title(primaryTarget)} Patch`;
  const primaryInput = layout.inputs[0]?.cropId;
  return primaryInput ? `${title(primaryInput)} Plot` : "Fresh Plot";
};
