import { prettify } from "./format";
import type {
  GreenhouseBoard,
  GreenhouseCell,
  IslandChest,
  IslandItem,
  IslandSnapshot,
  ItemExtra,
} from "./types";

/**
 * Structural validation for an island snapshot.
 *
 * Hand rolled rather than zod, which is available, for one reason: the
 * forward-compatibility rule in the spec says unknown fields must be ignored,
 * and the honest way to guarantee that is to build the output object field by
 * field so there is no code path that could copy an unknown key through. A
 * schema library would do the same job, but you would have to read its
 * stripping semantics to believe it. Here you can see it.
 *
 * The other governing idea is that the mod is a young piece of software talking
 * to a browser we do not control, so the failure policy is graded:
 *
 *   hard fail   the document is not the contract at all (wrong schema number,
 *               not an object, `chests` present but not an array). Nothing can
 *               be salvaged and pretending otherwise would show the player a
 *               confidently wrong island.
 *   drop        one row inside a collection is malformed. A single corrupt
 *               chest must not cost the player the other forty, so it is
 *               skipped and the rest lands.
 *   default     a scalar is missing or the wrong type but the meaning is
 *               obvious ("" for a name, null for a game mode). Rejecting a
 *               whole snapshot over a blank profile name would be absurd.
 */

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Lenient scalar reads. A number that arrived as a string is still a number to a human. */
const asString = (v: unknown, fallback = ""): string => {
  if (typeof v === "string") return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return fallback;
};

const asFiniteNumber = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
};

/**
 * One stack. Returns null for anything we cannot name, because an item row with
 * no id is not a thing the player can go and look for.
 */
/**
 * Structured item detail, read field by field.
 *
 * Built explicitly like everything else here, so an unknown key the mod adds
 * next month is ignored rather than carried into typed output. Two rules worth
 * stating because they are easy to get subtly wrong:
 *
 * Anything malformed is dropped rather than defaulted. A reforge is either a
 * name or nothing; there is no sensible stand-in for one, and a tooltip that
 * confidently reads "Reforge: 0" is worse than one that omits the line.
 *
 * An `extra` with nothing usable in it comes back `undefined`, never `{}`. The
 * spec omits the object when empty, so producing an empty one would invent a
 * distinction the wire format does not have and would make "has extra" true for
 * an item that has none.
 */
const readExtra = (v: unknown): ItemExtra | undefined => {
  if (!isObject(v)) return undefined;

  const out: ItemExtra = {};

  const reforge = asString(v.reforge);
  if (reforge) out.reforge = reforge;

  const stars = asFiniteNumber(v.stars);
  if (stars !== null && stars > 0) out.stars = stars;

  if (isObject(v.ench)) {
    const ench: Record<string, number> = {};
    for (const [id, raw] of Object.entries(v.ench)) {
      if (!id) continue;
      const level = asFiniteNumber(raw);
      if (level === null || level < 0) continue;
      ench[id] = level;
    }
    if (Object.keys(ench).length > 0) out.ench = ench;
  }

  // Strictly `true`. A truthy string or a 1 is a producer bug, and quietly
  // agreeing with it would put a recombobulated marker on an item that is not.
  if (v.recomb === true) out.recomb = true;

  // Hex only, and length-checked. This value is interpolated into a URL, so
  // anything that is not a plain texture hash is dropped rather than sent: a
  // stray slash or a query character would let malformed data reshape the
  // request, and there is no legitimate hash that needs one.
  const skin = asString(v.skin).toLowerCase();
  if (/^[0-9a-f]{32,64}$/.test(skin)) out.skin = skin;

  return Object.keys(out).length > 0 ? out : undefined;
};

const readItem = (v: unknown): IslandItem | null => {
  if (!isObject(v)) return null;
  const id = asString(v.id);
  if (!id) return null;
  const count = asFiniteNumber(v.count);
  if (count === null || count < 0) return null;

  // `name` is optional on the wire. Producers omit it whenever it would just be
  // the title-cased id, because across a few thousand stacks that is most of a
  // code's size, and only send one when it genuinely differs: reforges, stars,
  // renamed items. So an absent name is normal input, never a rejection.
  //
  // Prettifying here rather than at render time is deliberate. The name is not
  // only a label: the wiki icon URL is derived from it, so a raw
  // ENCHANTED_BREAD would resolve to nothing while "Enchanted Bread" resolves
  // to the real image. Doing it once at the reader boundary means every
  // consumer downstream, icons included, sees a usable name.
  const name = asString(v.name);
  const item: IslandItem = { id, name: name || prettify(id), count };

  // A container slot index. Non-integer, negative or absurd values are dropped
  // rather than clamped: a wrong slot would draw the stack in the wrong cell,
  // which is a quieter and more confusing failure than simply packing it.
  const slot = asFiniteNumber(v.slot);
  if (slot !== null && Number.isInteger(slot) && slot >= 0 && slot < 1000) item.slot = slot;

  // Assigned conditionally so an item with nothing to add has no `extra` key at
  // all, matching the wire format rather than carrying an empty object around.
  const extra = readExtra(v.extra);
  if (extra) item.extra = extra;

  return item;
};

const readItemList = (v: unknown): IslandItem[] => {
  if (!Array.isArray(v)) return [];
  const out: IslandItem[] = [];
  for (const raw of v) {
    const item = readItem(raw);
    if (item) out.push(item);
  }
  return out;
};

/**
 * An optional section, where absence carries meaning.
 *
 * `undefined` in, `undefined` out: the mod has not captured this container.
 * An array in, an array out even if it empties to nothing: the mod looked.
 * Anything else (a string, a number, null) is a section we cannot read, and it
 * is treated as not captured rather than as verified empty, because claiming
 * "your ender chest is empty" on the strength of a malformed field is the one
 * lie this file exists to prevent.
 */
const readOptionalSection = (v: unknown): IslandItem[] | undefined => {
  if (v === undefined) return undefined;
  if (!Array.isArray(v)) return undefined;
  return readItemList(v);
};

/** `[x, y, z]`, all finite. A chest with no position has no identity. */
const readPos = (v: unknown): [number, number, number] | null => {
  if (!Array.isArray(v) || v.length < 3) return null;
  const x = asFiniteNumber(v[0]);
  const y = asFiniteNumber(v[1]);
  const z = asFiniteNumber(v[2]);
  if (x === null || y === null || z === null) return null;
  return [x, y, z];
};

const readChest = (v: unknown): IslandChest | null => {
  if (!isObject(v)) return null;
  const pos = readPos(v.pos);
  if (!pos) return null;
  const lastSeen = asFiniteNumber(v.lastSeen);
  return {
    pos,
    name: asString(v.name, "Chest"),
    // A chest we have never timestamped still shows its contents; the UI just
    // has nothing to say about when.
    lastSeen: lastSeen !== null && lastSeen >= 0 ? lastSeen : 0,
    // Unlike the optional top-level sections, a chest's `items` is required by
    // the contract, so a missing one is an empty chest rather than a mystery.
    items: readItemList(v.items),
  };
};

/**
 * Sack totals, keyed by Hypixel id.
 *
 * Drops any entry whose value is not a finite non-negative number. A negative
 * or NaN sack count would poison every downstream sum and there is no honest
 * way to guess what it meant.
 */
const readSacks = (v: unknown): Record<string, number> => {
  if (!isObject(v)) return {};
  const out: Record<string, number> = {};
  for (const [key, raw] of Object.entries(v)) {
    if (!key) continue;
    const n = asFiniteNumber(raw);
    if (n === null || n < 0) continue;
    out[key] = n;
  }
  return out;
};

/**
 * The greenhouse board, a later addition to the contract.
 *
 * Two spec sentences govern this section and they pull in opposite directions,
 * so the split between them is stated once here rather than repeated at each
 * check: "readers must tolerate unknown cell fields" and "cells outside `size`
 * are a validation error, not a silent clamp".
 *
 * The line drawn is: we DROP what we cannot read, and we REFUSE what contradicts
 * itself.
 *
 *   drop     the section envelope is unreadable - not an object, no usable
 *            `size`, `cells` not a list. Nothing about the board can be
 *            believed, so it reads as not observed and no card renders. That
 *            is exactly how an absent section already behaves, and it tells no
 *            lie: an absent board claims nothing.
 *   refuse   the section reads, and then says something impossible: a cell
 *            outside the size it just declared, a cell that is both a crop and
 *            a mutation, a cell that is neither. Skipping such a cell would
 *            draw a board with a plant missing, which is a confidently wrong
 *            picture of the player's greenhouse and precisely what the spec forbids
 *            with "not a silent clamp".
 *
 * Refusing throws, which the transports already handle without data loss:
 * `applyLivePayload` returns the caller's own feed set by identity on a throw,
 * so a bad build can never replace a good snapshot, and the message surfaces on
 * the page where the mod crew can read it. A silent drop would leave nothing on
 * screen and nothing to debug.
 *
 * Note what is NOT refused: an unknown key on a cell, which is the forward
 * compatibility promise, and a malformed `nextStageAt`, which is an enrichment
 * rather than a structural claim and so is simply left off.
 */

/**
 * `[width, height]`, both positive integers.
 *
 * Capped because the size is what the page loops over: a producer bug sending
 * a six-figure width would otherwise ask the browser to lay out billions of
 * cells. Sixty-four is far above any greenhouse Hypixel has shipped or is
 * likely to, so the cap is a guard rather than a limit anyone will meet.
 */
const readBoardSize = (v: unknown): [number, number] | null => {
  if (!Array.isArray(v) || v.length < 2) return null;
  const width = asFiniteNumber(v[0]);
  const height = asFiniteNumber(v[1]);
  if (width === null || height === null) return null;
  if (!Number.isInteger(width) || !Number.isInteger(height)) return null;
  if (width <= 0 || height <= 0 || width > 64 || height > 64) return null;
  return [width, height];
};

/** A cell id: a Hypixel-style string, or nothing. Never a coerced number, because no id is one. */
const readCellId = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/**
 * One occupied cell, bounds-checked against the board that declared it.
 *
 * Throws rather than returning null, because every failure here is one of the
 * contradictions above and each deserves its own sentence: "somewhere in your
 * greenhouse something is wrong" is not a message anybody can act on.
 */
const readGreenhouseCell = (v: unknown, size: [number, number]): GreenhouseCell => {
  if (!isObject(v)) {
    throw new Error("Island data has a greenhouse cell that is not an object.");
  }

  const x = asFiniteNumber(v.x);
  const y = asFiniteNumber(v.y);
  if (x === null || y === null || !Number.isInteger(x) || !Number.isInteger(y)) {
    throw new Error("Island data has a greenhouse cell with no whole-number position.");
  }
  if (x < 0 || y < 0 || x >= size[0] || y >= size[1]) {
    throw new Error(
      `Island data has a greenhouse cell at ${x},${y}, outside the ${size[0]}x${size[1]} board it describes.`
    );
  }

  const crop = readCellId(v.crop);
  const mutation = readCellId(v.mutation);
  if (crop !== "" && mutation !== "") {
    throw new Error(`Island data has a greenhouse cell at ${x},${y} holding both a crop and a mutation.`);
  }
  if (crop === "" && mutation === "") {
    throw new Error(`Island data has a greenhouse cell at ${x},${y} holding neither a crop nor a mutation.`);
  }

  // Built field by field like everything else here, so an unknown key the mod
  // adds next month is tolerated on the wire and absent from typed output.
  const cell: GreenhouseCell = crop !== "" ? { x, y, crop } : { x, y, mutation };

  // Dropped rather than refused when malformed: a countdown is an extra the
  // player may or may not have diagnosed, and losing one badge is a far smaller
  // harm than refusing the board it sits on. Zero and negatives go too, since
  // the field is an absolute ms epoch and neither is one.
  const nextStageAt = asFiniteNumber(v.nextStageAt);
  if (nextStageAt !== null && nextStageAt > 0) cell.nextStageAt = nextStageAt;

  return cell;
};

const readGreenhouse = (v: unknown): GreenhouseBoard | undefined => {
  // Absent is the normal state, for everybody who has not been to the Garden
  // with the mod running. Never an error, never a warning.
  if (v === undefined) return undefined;

  // Unreadable envelope: treated as not observed, exactly like a malformed
  // optional section. No board is shown and nothing is claimed.
  if (!isObject(v)) return undefined;
  const size = readBoardSize(v.size);
  if (!size) return undefined;
  if (!Array.isArray(v.cells)) return undefined;

  const cells: GreenhouseCell[] = [];
  for (const raw of v.cells) cells.push(readGreenhouseCell(raw, size));

  // `observedAt` defaults rather than refuses, matching `lastSeen` on a chest:
  // the same graded policy, and `ago()` renders a zero as "never", which
  // understates the board's freshness instead of overstating it.
  const observedAt = asFiniteNumber(v.observedAt);

  return {
    observedAt: observedAt !== null && observedAt > 0 ? observedAt : 0,
    size,
    cells,
  };
};

/**
 * Validate and normalise an arbitrary parsed JSON value into a snapshot.
 *
 * Throws `Error` with a message written for a player, not a developer: these
 * strings get rendered under the paste box, so "Island data is for schema
 * version 2" has to make sense to someone who has never read this file.
 */
export function validateSnapshot(value: unknown): IslandSnapshot {
  if (!isObject(value)) {
    throw new Error("Island data is not a JSON object.");
  }

  // The version gate comes first. Everything below assumes v1 field meanings,
  // so reading any of it out of a v2 document would be guesswork.
  // Site name hardcoded in the two messages below rather than imported from
  // `src/ui/brand.ts`: this file is pure data validation with no dependency
  // outside `./types`, which is what keeps it testable in a bare node
  // environment. A future renamer should grep for the literal.
  const schema = asFiniteNumber(value.schema);
  if (schema === null) {
    throw new Error("Island data has no schema version, so it is not a Skydex snapshot.");
  }
  if (schema !== 1) {
    throw new Error(
      `Island data is schema version ${schema}, but this site only understands version 1. Update Skydex.`
    );
  }

  const exportedAt = asFiniteNumber(value.exportedAt);
  if (exportedAt === null) {
    throw new Error("Island data has no valid export timestamp.");
  }

  const player = isObject(value.player) ? value.player : {};
  const profile = isObject(value.profile) ? value.profile : {};

  // Present-but-wrong-type is a hard fail here, unlike the optional sections,
  // because `chests` is the load-bearing part of the whole feature: silently
  // showing an island with no chests would read as "you own nothing".
  if (value.chests !== undefined && !Array.isArray(value.chests)) {
    throw new Error("Island data has a 'chests' field that is not a list.");
  }

  const chests: IslandChest[] = [];
  for (const raw of (value.chests as unknown[]) ?? []) {
    const chest = readChest(raw);
    if (chest) chests.push(chest);
  }

  const gameModeRaw = profile.gameMode;
  const gameMode = typeof gameModeRaw === "string" && gameModeRaw !== "" ? gameModeRaw : null;

  // Built key by key. Nothing from `value` reaches the output except through a
  // named read above, which is what makes "unknown fields are ignored" true by
  // construction rather than by promise.
  const snapshot: IslandSnapshot = {
    schema: 1,
    exportedAt,
    player: { uuid: asString(player.uuid), name: asString(player.name) },
    profile: { name: asString(profile.name), gameMode },
    sacks: readSacks(value.sacks),
    chests,
  };

  // Assigned conditionally so an absent section stays absent rather than
  // becoming an explicit `undefined` key, which would survive JSON.stringify
  // as nothing but would show up in `Object.keys` and in deep-equality tests.
  const inventory = readOptionalSection(value.inventory);
  if (inventory !== undefined) snapshot.inventory = inventory;

  const enderChest = readOptionalSection(value.enderChest);
  if (enderChest !== undefined) snapshot.enderChest = enderChest;

  const storage = readOptionalSection(value.storage);
  if (storage !== undefined) snapshot.storage = storage;

  // Same conditional assignment as the sections above, for the same reason: an
  // unobserved greenhouse has no key at all, so nothing downstream can mistake
  // an explicit `undefined` for a board.
  const greenhouse = readGreenhouse(value.greenhouse);
  if (greenhouse !== undefined) snapshot.greenhouse = greenhouse;

  return snapshot;
}
