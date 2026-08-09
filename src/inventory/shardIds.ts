import { getShards, shardBridge, subscribeShards } from "./shardsStore";

/**
 * The shard key to Hypixel id bridge, loaded only when it can matter.
 *
 * `shardsStore` reads the shard suite's tally, which is keyed by shard key
 * (`C1`). Everything downstream is keyed by Hypixel id (`SHARD_GROVE`). The
 * translation between the two lives in the fusion dataset, and that dataset is
 * 2.2 MB. The Items page, the planner and the dashboard all ask what the player
 * owns, and none of them should pay 2.2 MB for the privilege unless there is
 * something in it for them.
 *
 * So the load is deferred twice over:
 *
 *   1. `import()` rather than a top level import, so the dataset's loader is a
 *      separate chunk that the pages above never pull into their own.
 *   2. The import only fires once the shard tally has something in it. An empty
 *      tally has nothing to bridge - every entry would be dropped for want of a
 *      count, not for want of an id - so fetching the bridge would be pure
 *      waste. This is what "asked for shard data" means in practice: the ask is
 *      real only when there are shards to ask about.
 *
 * The loader reused here is `DataService`, the same singleton the shard pages
 * use, so a player who opens the fusion calculator after the planner gets the
 * dataset from that cache rather than paying for it twice.
 *
 * Same store shape as the rest of the site (`profile/useProfile`,
 * `island/useIsland`, `shardsStore`): one module-level current value, one
 * listener set, and a value whose identity only changes when it really changes.
 * There is no cross-tab `storage` listener here on purpose - this is derived
 * from a file that ships with the site, not from anything a tab can write.
 */

/** Null until the dataset has been read. Not an empty object: those differ. */
let bridge: Record<string, string | null> | null = null;
let loading = false;
/**
 * Set after a failed load, and never cleared.
 *
 * The dataset is a static file served beside the app. If it will not load, it
 * will not load, and retrying on every mount would be a page-navigation-shaped
 * request loop against our own host for a feature that is additive anyway. The
 * shard tally simply contributes nothing, which is the same honest answer as a
 * player who has never opened the calculator.
 */
let failed = false;

const listeners = new Set<() => void>();

/** Live only while somebody is subscribed, so an unmounted page holds nothing. */
let unsubscribeCounts: (() => void) | null = null;

const load = () => {
  if (bridge !== null || loading || failed) return;
  loading = true;

  import("../services/dataService")
    .then((m) => m.DataService.getInstance().loadShards())
    .then((shards) => {
      loading = false;
      bridge = shardBridge(shards);
      for (const fn of listeners) fn();
    })
    .catch(() => {
      loading = false;
      failed = true;
    });
};

/** Nothing to bridge means nothing to fetch. */
const loadIfShardsMatter = () => {
  if (Object.keys(getShards()).length === 0) return;
  load();
};

/**
 * Subscribe to the bridge.
 *
 * Also watches the tally while subscribed, so a player who sets their shards on
 * the calculator and then opens the planner gets the bridge pulled in at that
 * moment rather than having to reload the page.
 */
export const subscribeShardIds = (fn: () => void) => {
  listeners.add(fn);
  if (listeners.size === 1) {
    // Registered before the explicit check, so the re-read that `subscribeShards`
    // performs for its own first subscriber is not missed.
    unsubscribeCounts = subscribeShards(loadIfShardsMatter);
    loadIfShardsMatter();
  }
  return () => {
    listeners.delete(fn);
    if (listeners.size === 0 && unsubscribeCounts) {
      unsubscribeCounts();
      unsubscribeCounts = null;
    }
  };
};

/** The bridge, or null while it has not been needed or has not arrived yet. */
export const getShardIds = (): Record<string, string | null> | null => bridge;
