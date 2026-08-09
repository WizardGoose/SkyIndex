import React, { useEffect, useState, useSyncExternalStore } from "react";
import {
  chooseIconSource,
  iconVersion,
  itemDisplayName,
  readTitle,
  reportIconFailure,
  requestIcon,
  subscribeIcons,
} from "../items/wikiImages";
import {
  itemResourceVersion,
  requestItemResource,
  resourceHeadSrcFor,
  resourceNameFor,
  subscribeItemResource,
} from "../items/itemResource";
import { packTextureSrc, subscribeTexturePack, texturePackVersion } from "../items/texturePack";

/**
 * The one item icon.
 *
 * WHY IT LOOKS LIKE THIS
 * ----------------------
 * The URL is derived from the item name, so a whole page of icons costs zero
 * API lookups and nothing is copied into this project. The wiki serves its own
 * CC BY-NC-SA content straight to the visitor's browser, which keeps the
 * share-alike clause off our build entirely. See `items/wikiCrafting.ts`.
 *
 * Misses are normal, not exceptional, so the component is built around failing
 * gracefully. Sources are tried in cost order and every one of them occupies
 * exactly `size` x `size`, so a miss never breaks the rhythm of a row:
 *
 *   1. `src`, when the caller has a better local asset (greenhouse crop art)
 *   2. the wiki image for each rung of the name ladder, most specific first:
 *      the name as given, then with trailing stars off, leading glyphs off,
 *      a `[Lvl N]` pet tag off, a reforge prefix off, then Hypixel's own name
 *      for the id, then the shape rules (trophy grade, rune, joining words)
 *   3. a batched wiki API lookup over those same rungs, for files that live
 *      under another name ("Boots of Divan" is drawn with the Golden Boots
 *      texture, and "Silver Hunter Helmet" with the Iron Helmet one)
 *   4. `lateSrc`, or failing that a player head rendered from the item's own
 *      texture hash, which is the rung that makes a miss rare rather than normal
 *   5. initials, or a blank tile of the same size
 *
 * Steps 1 and 2 are free. Step 3 only happens after the browser has actually
 * failed to load every rung, so first paint never touches the API, and the
 * lookups that do happen coalesce across the page. See `items/wikiImages.ts`.
 *
 * WHY THE HEAD RUNG IS HERE AND NOT AT THE CALL SITES
 * ---------------------------------------------------
 * It used to be the accessories page's private trick, passed down as `lateSrc`,
 * because that page is where blank tiles were most obvious. But the resource it
 * reads carries `skin.value` for every skull item in the game, not just the 390
 * accessories: 2,765 of 5,549 items have one. Pets, Abiphones, sacks, runes,
 * most of the decorative catalogue. Any surface that renders an item deserves
 * the same last resort, so it moved into the one component they all use and the
 * callers no longer have to know it exists.
 *
 * A caller's own `lateSrc` still wins, since a caller that went to the trouble
 * of supplying one knows something this component does not.
 *
 * Failures are tracked by URL rather than as a boolean, so a recycled element
 * whose `name` prop changed retries against the new URL instead of staying
 * stuck on the previous item's miss.
 */
export interface ItemIconProps {
  /** Display name. The wiki image URL is derived from this. */
  name: string;
  /**
   * Item id. Used only when there is no usable name, in which case it is
   * prettified (`ENCHANTED_BREAD` -> `Enchanted Bread`) and resolved like one.
   */
  id?: string;
  /**
   * The game's own Hypixel id, when the caller knows `id` is something else.
   * Exists for exactly one consumer, the texture pack lookup, whose keys ARE
   * Hypixel ids: the accessories field hands `id` a wiki slug (its comment
   * explains why), and the pet tiles have a `PET_<TYPE>` spelling that is not
   * a display id at all. Never used for name prettifying or the wiki ladder,
   * so passing it cannot change what renders when no pack is loaded.
   */
  hypixelId?: string;
  /** A preferred source tried before the wiki image, e.g. a bundled asset. */
  src?: string;
  /**
   * A last-resort source, tried only once every wiki rung has failed and
   * before the blank or initials fallback. Meant for a player head render.
   *
   * Optional, and normally unnecessary: this component already resolves a head
   * render from `id` on its own. Pass it only when the caller has a hash the
   * item resource does not carry, such as the island feed reading `extra.skin`
   * off a stack the player is actually holding.
   *
   * The ordering is not negotiable: the wiki sources are licensed, cached and
   * already working, so they get first refusal, and a third-party render is
   * the last thing standing between us and the fallback.
   *
   * TERMINAL. mc-heads.net answers an unknown hash with 200 and a default
   * Steve head rather than a 404, so a bad head render cannot be detected by
   * status and `onError` will never fire for it. Once this is shown it is the
   * answer; there is no rung after it that could rescue a wrong-looking head.
   */
  lateSrc?: string;
  /** Box size in px. Width and height both, always. */
  size?: number;
  /** What a total miss renders: two-letter initials, or an empty tile. */
  fallback?: "initials" | "blank";
  className?: string;
}

export const ItemIcon: React.FC<ItemIconProps> = ({
  name,
  id,
  hypixelId,
  src,
  lateSrc,
  size = 20,
  fallback = "initials",
  className = "",
}) => {
  const [failed, setFailed] = useState<string[]>([]);

  // Both subscriptions are for the side effect: a batched lookup landing, or
  // the item resource arriving, has to re-render the icons that were waiting on
  // it. The version numbers themselves are not needed.
  useSyncExternalStore(subscribeIcons, iconVersion, iconVersion);
  useSyncExternalStore(subscribeItemResource, itemResourceVersion, itemResourceVersion);
  /*
   * The texture pack store, same arrival shape as the two above: subscribing
   * kicks its one-time hydration from IndexedDB, and the notify when the
   * pack lands re-renders every icon that was waiting. With no pack loaded
   * the subscribe is a no-op that never opens a database, and `packSrc`
   * below is undefined, so the rendering is byte-identical to before this
   * feature existed. The rule for the whole feature: the pack is cached on
   * the user's side, violating
   * nothing - the user's own copy, read locally, distributed nowhere.
   */
  useSyncExternalStore(subscribeTexturePack, texturePackVersion, texturePackVersion);

  const display = itemDisplayName(name, id);
  const resourceName = resourceNameFor(id);
  const head = resourceHeadSrcFor(id);
  // The matching rule lives in packKeyCandidates: hypixel id first, display
  // name second. The raw `name` prop is passed rather than `display` so a
  // caller that only had an id does not ask the same key twice. `hypixelId`
  // outranks `id` because when a caller bothers to pass both, `id` is known
  // to be something else (a wiki slug, a prettifying source).
  const packSrc = packTextureSrc(hypixelId ?? id, name);

  const { current, exhausted, needLookup } = chooseIconSource({
    display,
    failed,
    src,
    packSrc,
    lateSrc: lateSrc ?? head,
    known: readTitle,
    resourceName,
  });

  // Only ask the network once the cheap rungs have really failed in the
  // browser. Both requests are batched and cached, and asking for the resource
  // is usually a no-op because building the item index already published it.
  //
  // `needLookup` can be true while a cached rung is painting fine (the rungs
  // above it are open questions worth one real ask), and `exhausted` can be
  // true with nothing left to look up (every rung proven missing, so only the
  // head resource could still help). Both fire, each for its own half.
  useEffect(() => {
    if (!display || (!exhausted && !needLookup)) return;
    requestItemResource();
    if (needLookup) requestIcon(display, resourceName);
  }, [display, exhausted, needLookup, resourceName]);

  if (!current) {
    if (fallback === "blank") {
      return (
        <span
          className={`shrink-0 rounded-sm bg-slate-800/60 ${className}`}
          style={{ width: size, height: size }}
          aria-hidden
        />
      );
    }
    return (
      <span
        className={`shrink-0 inline-flex items-center justify-center rounded-sm bg-slate-800 font-medium text-slate-500 ${className}`}
        style={{ width: size, height: size, fontSize: Math.max(7, Math.round(size * 0.4)), lineHeight: 1 }}
        aria-hidden
      >
        {(display || name).slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={current}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => {
        // A cached answer that errors is evicted so the title becomes a
        // question again; a failed guess is just a failed guess.
        reportIconFailure(current);
        setFailed((f) => (f.includes(current) ? f : [...f, current]));
      }}
      className={`shrink-0 object-contain ${className}`}
      style={{ width: size, height: size, imageRendering: "pixelated" }}
    />
  );
};

export default ItemIcon;
