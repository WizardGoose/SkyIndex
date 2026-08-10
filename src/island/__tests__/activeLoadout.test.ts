import { describe, expect, it } from "vitest";
import { resolveActiveLoadout } from "../activeLoadout";
import type { LoadoutStatement } from "../../networth/parseItems";
import { parseMemberLoadouts } from "../../networth/parseItems";

const loadout = (id: number, overrides: Partial<LoadoutStatement> = {}): LoadoutStatement => ({
  id, name: `Loadout ${id}`, armorSetId: null, equipmentSetId: null,
  petUuid: null, powerStone: null, tuningSlot: null, ...overrides,
});

describe("active equipment-set parsing", () => {
  it("keeps Hypixel's equipped set id and keeps malformed or absent values unknown", async () => {
    expect((await parseMemberLoadouts({ loadout: { equipment: { equipped_set: 4 } } })).equippedEquipmentSetId).toBe(4);
    expect((await parseMemberLoadouts({ loadout: { equipment: { equipped_set: "4" } } })).equippedEquipmentSetId).toBeNull();
    expect((await parseMemberLoadouts({})).equippedEquipmentSetId).toBeNull();
  });
});

describe("resolveActiveLoadout", () => {
  it("uses every stated current-state signal to identify one loadout", () => {
    const result = resolveActiveLoadout([
      loadout(1, { petUuid: "pet-a", powerStone: "forceful", equipmentSetId: 2 }),
      loadout(2, { petUuid: "pet-a", powerStone: "forceful", equipmentSetId: 4 }),
    ], { activePetUuid: "pet-a", selectedPower: "FORCEFUL", equippedEquipmentSetId: 4 });
    expect(result?.id).toBe(2);
  });

  it("uses the direct equipped-set pointer even when pet or power changed afterwards", () => {
    const result = resolveActiveLoadout([
      loadout(1, { petUuid: "pet-a", powerStone: "forceful", equipmentSetId: 2, tuningSlot: 1 }),
      loadout(2, { petUuid: "pet-b", powerStone: "slender", equipmentSetId: 4, tuningSlot: 3 }),
    ], { activePetUuid: "pet-new", selectedPower: "itchy", equippedEquipmentSetId: 4 });
    expect(result?.id).toBe(2);
    expect(result?.tuningSlot).toBe(3);
  });

  it("refuses absent, contradictory, and ambiguous signals", () => {
    const entries = [loadout(1, { petUuid: "pet-a", powerStone: "forceful" }), loadout(2, { petUuid: "pet-a", powerStone: "forceful" })];
    expect(resolveActiveLoadout(entries, { activePetUuid: null, selectedPower: null, equippedEquipmentSetId: null })).toBeNull();
    expect(resolveActiveLoadout(entries, { activePetUuid: "pet-a", selectedPower: "forceful", equippedEquipmentSetId: null })).toBeNull();
    expect(resolveActiveLoadout(entries, { activePetUuid: "pet-b", selectedPower: "forceful", equippedEquipmentSetId: null })).toBeNull();
  });
});
