/**
 * The plain-JSON facts on a profile member that the profile viewer states:
 * skill experience, when the profile was first joined, fairy souls.
 *
 * Read here, once, at the same moment the networth pull already has the member
 * in hand, rather than by a second request. Everything is optional and absent
 * stays absent: a member with no `player_data.experience` yields an empty map,
 * not a map of zeros, because "Hypixel did not say" and "level zero" are
 * different sentences and this site never trades one for the other.
 *
 * Field locations verified against docs/hypixel-api-cheatsheet.md (a real dump
 * of a real account): experience lives at `player_data.experience` keyed
 * `SKILL_FARMING` style, first join at `profile.first_join` (ms epoch), fairy
 * souls at `fairy_soul.total_collected`.
 */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export interface ProfileFacts {
  /**
   * Total skill experience by the payload's own key (`SKILL_FARMING`), only
   * for keys the payload actually states, only finite non-negative numbers.
   */
  skillXp: Record<string, number>;
  /** ms epoch of the member's first join, or null when unstated. */
  firstJoin: number | null;
  /** Fairy souls collected, or null when unstated. Null is not zero. */
  fairySouls: number | null;
  /**
   * SkyBlock leveling experience (`leveling.experience`), or null when the
   * payload does not state it. The game's own arithmetic is fixed: every
   * level costs 100 XP, so level = floor(xp / 100) and the remainder is the
   * progress into the current level. Verified against
   * docs/hypixel-api-cheatsheet.md (38220 = level 382, 20/100 in).
   */
  levelXp: number | null;
  /**
   * Accessory tuning allocations, `accessory_bag_storage.tuning.slot_N`:
   * slot key to stat key to points, numbers only, exactly as stated. The
   * loadout cards read these through `tuning_points_slot`. Empty when the
   * payload has none; a slot's absence is not zeros.
   */
  tuning: Record<string, Record<string, number>>;
  /** `accessory_bag_storage.selected_power`, the worn power stone, or null. */
  selectedPower: string | null;
}

export const EMPTY_FACTS: ProfileFacts = {
  skillXp: {},
  firstJoin: null,
  fairySouls: null,
  levelXp: null,
  tuning: {},
  selectedPower: null,
};

export const readProfileFacts = (member: unknown): ProfileFacts => {
  if (!isRecord(member)) return EMPTY_FACTS;

  const skillXp: Record<string, number> = {};
  const experience = isRecord(member.player_data) ? member.player_data.experience : undefined;
  if (isRecord(experience)) {
    for (const [key, value] of Object.entries(experience)) {
      if (typeof value === "number" && Number.isFinite(value) && value >= 0) skillXp[key] = value;
    }
  }

  const profile = isRecord(member.profile) ? member.profile : undefined;
  const firstJoin =
    profile && typeof profile.first_join === "number" && Number.isFinite(profile.first_join) && profile.first_join > 0
      ? profile.first_join
      : null;

  const fairy = isRecord(member.fairy_soul) ? member.fairy_soul : undefined;
  const fairySouls =
    fairy && typeof fairy.total_collected === "number" && Number.isFinite(fairy.total_collected)
      ? fairy.total_collected
      : null;

  const leveling = isRecord(member.leveling) ? member.leveling : undefined;
  const levelXp =
    leveling && typeof leveling.experience === "number" && Number.isFinite(leveling.experience) && leveling.experience >= 0
      ? leveling.experience
      : null;

  const bag = isRecord(member.accessory_bag_storage) ? member.accessory_bag_storage : undefined;
  const tuning: Record<string, Record<string, number>> = {};
  if (bag && isRecord(bag.tuning)) {
    for (const [slot, value] of Object.entries(bag.tuning)) {
      // Only the slot_N objects are allocations; siblings like
      // `highest_unlocked_slot` and `refund_2` are bookkeeping.
      if (!slot.startsWith("slot_") || !isRecord(value)) continue;
      const stats: Record<string, number> = {};
      for (const [stat, points] of Object.entries(value)) {
        if (typeof points === "number" && Number.isFinite(points)) stats[stat] = points;
      }
      tuning[slot] = stats;
    }
  }
  const selectedPower = bag && typeof bag.selected_power === "string" && bag.selected_power ? bag.selected_power : null;

  return { skillXp, firstJoin, fairySouls, levelXp, tuning, selectedPower };
};
