// The defining module, not the `../services` barrel: that barrel re-exports
// `dataService`, which reads this directory, and the round trip is a cycle.
import { DataService } from "../services/dataService";

/**
 * Checks if a shard name is valid (case-insensitive, trims whitespace).
 * Returns true if the name matches a known shard.
 */
export async function isValidShardName(name: string): Promise<boolean> {
  if (!name) return false;
  const map = await DataService.getInstance().getShardNameToKeyMap();
  return !!map[name.trim().toLowerCase()];
}
