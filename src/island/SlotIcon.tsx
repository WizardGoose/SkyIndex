import React from "react";
import { ItemIcon } from "../ui/ItemIcon";
import { headUrl } from "./heads";

/**
 * An item icon for a container slot.
 *
 * WHAT THIS IS NOW
 * ----------------
 * A thin wrapper over `ItemIcon`, and nothing else. It used to compose the
 * shared primitives from `items/wikiImages` by hand, because the one thing it
 * needed - "try this source LAST" - had no expression in `ItemIcon`, whose only
 * injectable source was `src` and therefore first. The old comment here said
 * the cleaner shape was a `lateSrc` prop on `ItemIcon` and that it was flagged
 * rather than edited because that file belonged to another agent. That prop now
 * exists, so the workaround is gone.
 *
 * This is a straight gain rather than tidying. The hand-rolled chain had two
 * rungs, the derived name and a reforge strip. `ItemIcon` has the whole ladder:
 * trailing stars, leading glyphs, the `[Lvl N]` pet tag, the reforge prefix,
 * Hypixel's own name for the id, the trophy grade and rune shape rules, the
 * batched wiki API lookup for files that live under another title, and a head
 * render resolved from the id when the stack carries no hash of its own. Island
 * slot grids render the widest spread of raw game ids anywhere on the site, so
 * they were the surface losing the most by resolving worse here than the same
 * item resolved elsewhere.
 *
 * WHY THE FILE SURVIVES AT ALL
 * ----------------------------
 * Two decisions belong to island slots specifically and are worth stating once
 * rather than at every call site:
 *
 *   - `extra.skin` is a texture hash, not a URL, and it becomes one only through
 *     `headUrl`, which is the guard that keeps an unvalidated string out of a
 *     request. Doing that conversion here means no caller can skip it.
 *   - `fallback="blank"`. Island lists are full of raw Hypixel ids that will
 *     never resolve to a wiki file, and a grid of two-letter initials is noise
 *     rather than information.
 *
 * The hash still goes in as `lateSrc` rather than `src`, and the ordering is
 * still the point: wiki art is licensed, cached, consistent with the rest of the
 * site and correct for the many head-shaped items that do have a proper icon, so
 * it keeps first refusal. A caller's `lateSrc` beats the head `ItemIcon` derives
 * from the id on its own, which is the right precedence here: this hash was read
 * off the stack the player is actually holding, so it is the more specific fact.
 *
 * The head service, its verification and its one quirk are documented in
 * `heads.ts`, which owns the URL and is a plain module so it can be tested
 * without rendering anything.
 */

export interface SlotIconProps {
  name: string;
  id?: string;
  /**
   * The game's own Hypixel id when `id` is absent or is something else, for
   * the texture pack lookup only (the pet tiles' `PET_<TYPE>` spelling).
   * See `ItemIcon.hypixelId`.
   */
  hypixelId?: string;
  /** Texture hash from `extra.skin`, when the item carries one. */
  skin?: string;
  /** A preferred source tried before the wiki, e.g. bundled crop art. */
  src?: string;
  size?: number;
  className?: string;
}

/*
 * PRECEDENCE NOTE FOR SKULL ITEMS: a
 * loaded texture pack beats the `extra.skin` head render, deliberately.
 * The pack texture is the pack author's drawn ICON for this exact item id,
 * while the head render is a 3D-ish face crop of the stack's skin; a player
 * who loaded FurfSky expects FurfSky's icon, and the head remains the last
 * rung for every item the pack does not state. `skin` stays the more
 * specific fact than the id-derived head, exactly as before.
 */
export const SlotIcon: React.FC<SlotIconProps> = ({ name, id, hypixelId, skin, src, size = 22, className = "" }) => (
  <ItemIcon
    name={name}
    id={id}
    hypixelId={hypixelId}
    src={src}
    // `headUrl` returns null for anything that is not a plain hex hash, and the
    // prop takes a string or nothing, so a rejected hash becomes "no late
    // source" rather than a request that should never have been made.
    lateSrc={(skin ? headUrl(skin) : null) ?? undefined}
    size={size}
    fallback="blank"
    className={className}
  />
);

export default SlotIcon;
