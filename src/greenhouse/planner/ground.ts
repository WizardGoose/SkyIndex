export const GROUND_LABELS: Record<string, string> = {
  farmland: "Farmland",
  sand: "Sand",
  soul_sand: "Soul Sand",
  mycelium: "Mycelium",
  netherrack: "Netherrack",
  end_stone: "End Stone",
};

export const groundLabel = (id: string): string => GROUND_LABELS[id] ?? id.replace(/_/g, " ");
