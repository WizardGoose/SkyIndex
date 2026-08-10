import type { LoadoutStatement } from "../networth/parseItems";

export interface ActiveLoadoutSignals {
  activePetUuid: string | null;
  selectedPower: string | null;
  equippedEquipmentSetId: number | null;
}

/**
 * Resolve the saved loadout that owns the current tuning slot.
 *
 * equipment.equipped_set is the only direct current-set pointer Hypixel
 * exposes, so it leads. Pet and power are weaker corroboration: either can be
 * changed independently after switching loadouts and must not erase a unique
 * equipment match. Every step still requires one unique result; ambiguity is
 * returned as unknown rather than guessed.
 */
export const resolveActiveLoadout = (
  loadouts: readonly LoadoutStatement[],
  signals: ActiveLoadoutSignals
): LoadoutStatement | null => {
  let candidates = [...loadouts];
  if (signals.equippedEquipmentSetId !== null) {
    const equipmentMatches = candidates.filter((loadout) => loadout.equipmentSetId === signals.equippedEquipmentSetId);
    if (equipmentMatches.length === 1) return equipmentMatches[0];
    if (equipmentMatches.length === 0) return null;
    candidates = equipmentMatches;
  }

  if (signals.selectedPower !== null) {
    const power = signals.selectedPower.toLowerCase();
    const powerMatches = candidates.filter((loadout) => loadout.powerStone?.toLowerCase() === power);
    if (powerMatches.length === 1) return powerMatches[0];
    if (powerMatches.length === 0) return null;
    candidates = powerMatches;
  }

  if (signals.activePetUuid !== null) {
    const petMatches = candidates.filter((loadout) => loadout.petUuid === signals.activePetUuid);
    if (petMatches.length === 1) return petMatches[0];
    if (petMatches.length === 0) return null;
    candidates = petMatches;
  }

  return null;
};
