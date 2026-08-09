import type { IslandSnapshot } from "./types";
import { validateSnapshot } from "./validate";

/**
 * Clipboard transports: compact `SKYDEX2-` binary and legacy `SKYDEX-` JSON.
 *
 * This is the "GitHub Pages" mode of the mod, for players who cannot or will
 * not run a localhost server. `/skydex copy` in game puts the code on the
 * clipboard, the player pastes it here, and no data touches a network we own.
 *
 * WHY THE SEPARATOR IS A DASH, AND WHERE THE VERSION WENT
 * -------------------------------------------------------
 * `SKYDEX-` with the dash is the brand form of the prefix, chosen
 * deliberately with the hazard below in full view, so this file records both
 * halves honestly:
 *
 * The hazard: base64url's alphabet is `A-Z a-z 0-9 - _`, so a dash is a
 * PAYLOAD character and a generic "split at the first dash" parser would be
 * leaning on the accident that the fixed prefix contains none. This reader
 * never splits: it matches the literal prefix with `startsWith` and slices by
 * the length of whatever matched, so the dash in the separator seat and the
 * dashes inside the payload never meet. Anyone writing a THIRD-party reader
 * should copy that approach, not split on dashes.
 *
 * The version digit went with the dot. Old codes carried it in the prefix
 * (`SKYINDEX1.`, `SKYDEX1.`, both still read below); the current prefix is
 * versionless because the JSON inside already carries `schema`, which is
 * where a format change actually announces itself - `validateSnapshot` names
 * the schema it got and the schema it wanted. A future incompatible WIRE
 * format (not just a schema bump) takes a new prefix such as `SKYDEX2-`, and
 * the family detection below will call it a version mismatch rather than a
 * foreign string.
 *
 * Compression is the browser's own `DecompressionStream`, not pako. pako is in
 * this project for other code, but a 45 kB dependency to do what every browser
 * since 2023 does natively is not a trade worth making on a page most visitors
 * will never open.
 */

export const CODE_PREFIX = "SKYDEX-";
export const BINARY_CODE_PREFIX = "SKYDEX2-";

/**
 * Prefixes this site still READS, newest first.
 *
 * `SKYDEX1.` is a short-lived dot-form prefix this site emitted briefly
 * during the rename, so codes carrying it exist on clipboards measured in
 * hours - but they exist. `SKYINDEX1.` is the same format under the
 * pre-Skydex name, and existing installs of the companion mod still emit it.
 * The wire format never changed across any of these, only what it is called,
 * so refusing them would break codes in circulation to buy nothing. The mod
 * can start emitting the new prefix whenever it is next rebuilt; until then
 * everything pastes.
 */
const READ_PREFIXES = [BINARY_CODE_PREFIX, CODE_PREFIX, "SKYDEX1.", "SKYINDEX1."] as const;

/**
 * The family prefixes, used only to tell "wrong version" from "not one of ours".
 *
 * Both names appear for the same reason `READ_PREFIXES` carries both: a
 * `SKYINDEX2.` code from some future mod should still be met with "wrong
 * version" rather than "this is not ours". Nothing ever shipped under the older
 * `WZSKY` family, so it is gone rather than deprecated: a `WZSKY1.` code is
 * simply foreign and gets the generic rejection, not a version-mismatch message
 * that would imply we once spoke it.
 */
const FAMILIES = ["SKYDEX", "SKYINDEX"] as const;

const NO_STREAMS =
  "This browser cannot decompress island codes (it has no DecompressionStream). Try a current Firefox, Chrome or Safari.";

/**
 * base64url -> bytes.
 *
 * base64url swaps the two characters that are unsafe in a URL and drops the
 * padding, so putting `+`, `/` and `=` back is all that separates it from what
 * `atob` expects.
 */
const fromBase64Url = (s: string): Uint8Array => {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

/**
 * bytes -> base64url.
 *
 * Chunked because `String.fromCharCode(...bytes)` spreads every byte into an
 * argument list, and a big island blows the call stack somewhere north of a
 * hundred thousand items.
 */
const toBase64Url = (bytes: Uint8Array): string => {
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

/** Strict reader for the mod's SKYDEX2 binary payload. */
class BinaryReader {
  private offset = 0;
  private readonly text = new TextDecoder("utf-8", { fatal: true });

  private readonly bytes: Uint8Array;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
  }

  byte(label: string): number {
    if (this.offset >= this.bytes.length) throw new Error(`binary data ended while reading ${label}`);
    return this.bytes[this.offset++];
  }

  varint(label: string): number {
    let value = 0;
    let factor = 1;
    for (let i = 0; i < 10; i++) {
      const next = this.byte(label);
      value += (next & 0x7f) * factor;
      if (!Number.isSafeInteger(value)) throw new Error(`${label} is too large`);
      if ((next & 0x80) === 0) return value;
      factor *= 128;
    }
    throw new Error(`${label} varint is too long`);
  }

  count(label: string): number {
    const value = this.varint(label);
    if (value > this.bytes.length - this.offset + 1) throw new Error(`${label} exceeds the remaining data`);
    return value;
  }

  signed(label: string): number {
    const value = this.varint(label);
    return value % 2 === 0 ? value / 2 : -(value + 1) / 2;
  }

  string(label: string): string {
    const length = this.varint(`${label} length`);
    if (length > this.bytes.length - this.offset) throw new Error(`${label} exceeds the remaining data`);
    const value = this.text.decode(this.bytes.subarray(this.offset, this.offset + length));
    this.offset += length;
    return value;
  }

  end(): void {
    if (this.offset !== this.bytes.length) throw new Error("binary data has trailing bytes");
  }
}

const decodeBinarySnapshot = (bytes: Uint8Array): unknown => {
  const input = new BinaryReader(bytes);
  const magic = String.fromCharCode(input.byte("magic"), input.byte("magic"), input.byte("magic"), input.byte("magic"));
  if (magic !== "SKDX") throw new Error("binary data has the wrong Skydex signature");
  if (input.byte("version") !== 2) throw new Error("binary data uses an unsupported version");

  const exportedAt = input.varint("exportedAt");
  const pool = Array.from({ length: input.count("string pool size") }, (_, i) => input.string(`string pool ${i}`));
  const ref = (label: string): string | null => {
    const encoded = input.varint(label);
    if (encoded === 0) return null;
    const value = pool[encoded - 1];
    if (value === undefined) throw new Error(`${label} is outside the string pool`);
    return value;
  };

  const playerUuid = ref("player uuid");
  const playerName = ref("player name");
  const profileName = ref("profile name");
  const gameMode = ref("game mode");

  const extras = Array.from({ length: input.count("extras count") }, (_, i) => {
    const reforge = ref(`extra ${i} reforge`);
    const stars = input.varint(`extra ${i} stars`);
    const ench: Record<string, number> = {};
    for (let j = 0, n = input.count(`extra ${i} enchantments`); j < n; j++) {
      const id = ref("enchantment id");
      if (id === null) throw new Error("enchantment id is missing");
      ench[id] = input.varint("enchantment level");
    }
    const recomb = input.varint(`extra ${i} recomb`) !== 0;
    const skin = ref(`extra ${i} skin`);
    return {
      ...(reforge !== null ? { reforge } : {}),
      ...(stars !== 0 ? { stars } : {}),
      ...(Object.keys(ench).length ? { ench } : {}),
      ...(recomb ? { recomb: true } : {}),
      ...(skin !== null ? { skin } : {}),
    };
  });

  const section = (): unknown[] => {
    const count = input.count("section entries");
    const slots = Array.from({ length: count }, () => input.varint("slot") - 1);
    const ids = Array.from({ length: count }, () => {
      const id = ref("item id");
      if (id === null) throw new Error("item id is missing");
      return id;
    });
    const counts = Array.from({ length: count }, () => input.varint("item count"));
    const names = new Map<number, string>();
    for (let i = 0, n = input.count("section names"); i < n; i++) {
      const at = input.varint("name entry");
      const name = ref("item name");
      if (at >= count || name === null) throw new Error("invalid item name reference");
      names.set(at, name);
    }
    const itemExtras = new Map<number, unknown>();
    for (let i = 0, n = input.count("section extras"); i < n; i++) {
      const at = input.varint("extra entry");
      const which = input.varint("extra index");
      if (at >= count || extras[which] === undefined) throw new Error("invalid item extra reference");
      itemExtras.set(at, extras[which]);
    }
    return ids.map((id, i) => ({
      id,
      ...(names.has(i) ? { name: names.get(i) } : {}),
      count: counts[i],
      ...(slots[i] >= 0 ? { slot: slots[i] } : {}),
      ...(itemExtras.has(i) ? { extra: itemExtras.get(i) } : {}),
    }));
  };

  const flags = input.byte("section flags");
  if ((flags & ~0x3f) !== 0) throw new Error("binary data has unknown section flags");
  const snapshot: Record<string, unknown> = {
    schema: 1,
    exportedAt,
    player: { uuid: playerUuid, name: playerName },
    profile: { name: profileName, gameMode },
  };
  if (flags & 1) {
    const sacks: Record<string, number> = {};
    for (let i = 0, n = input.count("sacks"); i < n; i++) {
      const id = ref("sack id");
      if (id === null) throw new Error("sack id is missing");
      sacks[id] = input.varint("sack total");
    }
    snapshot.sacks = sacks;
  }
  if (flags & 2) {
    snapshot.chests = Array.from({ length: input.count("chests") }, () => ({
      pos: [input.signed("chest x"), input.signed("chest y"), input.signed("chest z")],
      name: ref("chest name"),
      lastSeen: input.varint("chest lastSeen"),
      items: section(),
    }));
  }
  if (flags & 4) snapshot.inventory = section();
  if (flags & 8) snapshot.enderChest = section();
  if (flags & 16) snapshot.storage = section();
  if (flags & 32) {
    const observedAt = input.varint("greenhouse observedAt");
    const width = input.varint("greenhouse width");
    const height = input.varint("greenhouse height");
    const cells = Array.from({ length: input.count("greenhouse cells") }, () => {
      const x = input.varint("greenhouse x");
      const y = input.varint("greenhouse y");
      const id = ref("greenhouse id");
      if (id === null) throw new Error("greenhouse id is missing");
      const kind = input.byte("greenhouse kind");
      if (kind > 1) throw new Error("greenhouse kind is invalid");
      const mutation = kind === 1;
      const nextStageAt = input.varint("greenhouse nextStageAt");
      return { x, y, ...(mutation ? { mutation: id } : { crop: id }), ...(nextStageAt > 0 ? { nextStageAt } : {}) };
    });
    snapshot.greenhouse = { observedAt, size: [width, height], cells };
  }
  input.end();
  return snapshot;
};
/**
 * Decode a pasted code into a validated snapshot.
 *
 * Every failure mode gets its own sentence, because this message is rendered
 * under the paste box and "unexpected token < in JSON" tells a player nothing
 * about whether they copied half the code or copied the wrong thing entirely.
 */
export async function decodeIslandCode(code: string): Promise<IslandSnapshot> {
  // All whitespace, not just the ends. Codes get pasted out of chat clients and
  // Discord messages that hard-wrap them, and base64url never contains
  // whitespace, so removing it can only ever repair a paste.
  const clean = String(code ?? "").replace(/\s+/g, "");

  if (!clean) {
    throw new Error("Paste an island code first. Run /skydex copy in game to put one on your clipboard.");
  }

  const matched = READ_PREFIXES.find((p) => clean.startsWith(p));

  if (!matched) {
    const family = FAMILIES.find((f) => clean.startsWith(f));
    if (family) {
      // Up to and including the first separator after the family name - a dot
      // for the retired dot-era prefixes, a dash for anything in the current
      // style. A code with neither is malformed rather than versioned, so
      // fall back to a slice long enough to show the family plus whatever
      // followed it.
      const sep = clean.slice(family.length).search(/[.-]/);
      const version = sep >= 0 ? clean.slice(0, family.length + sep + 1) : clean.slice(0, family.length + 4);
      // Site name hardcoded rather than imported from `src/ui/brand.ts`: this
      // file is the transport half of a contract shared with the companion mod
      // and depends on nothing outside `./types`, so it stays testable in a
      // bare node environment. A future renamer should grep for the literal.
      throw new Error(
        `That looks like a Skydex code from a different version (${version}). This site reads ${CODE_PREFIX} codes.`
      );
    }
    throw new Error(`That does not look like a Skydex island code. It should start with ${CODE_PREFIX}`);
  }

  // `matched.length`, never `CODE_PREFIX.length`: the legacy prefix is two
  // characters longer, and slicing by the wrong one would hand base64url two
  // stray characters of prefix and fail as "damaged code" on a perfectly good
  // paste.
  const payload = clean.slice(matched.length);
  if (!payload) {
    throw new Error("That code has a prefix but no data after it. It may have been cut short when copied.");
  }

  let bytes: Uint8Array;
  try {
    bytes = fromBase64Url(payload);
  } catch {
    throw new Error("That code is damaged (it is not valid base64). Copy it again from the game.");
  }

  if (typeof DecompressionStream === "undefined") {
    throw new Error(NO_STREAMS);
  }

  let unpacked: Uint8Array;
  try {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    unpacked = new Uint8Array(await new Response(stream).arrayBuffer());
  } catch {
    throw new Error("That code could not be unpacked (the compressed data is corrupt or incomplete).");
  }

  let parsed: unknown;
  try {
    parsed = matched === BINARY_CODE_PREFIX
      ? decodeBinarySnapshot(unpacked)
      : JSON.parse(new TextDecoder().decode(unpacked));
  } catch {
    throw new Error("That code unpacked, but what came out was not valid island data.");
  }

  // Validation errors are already written for a player, so they pass straight
  // through rather than being wrapped in another layer of apology.
  return validateSnapshot(parsed);
}

/**
 * Encode a snapshot back into a code.
 *
 * The site never needs this in normal use; the mod is the only producer. It is
 * here because a decoder you cannot round-trip is a decoder you are trusting on
 * faith, and writing the inverse costs a dozen lines.
 */
export async function encodeIslandCode(snapshot: IslandSnapshot): Promise<string> {
  if (typeof CompressionStream === "undefined") {
    throw new Error(NO_STREAMS);
  }
  const json = JSON.stringify(snapshot);
  const stream = new Blob([json]).stream().pipeThrough(new CompressionStream("gzip"));
  const buffer = await new Response(stream).arrayBuffer();
  return CODE_PREFIX + toBase64Url(new Uint8Array(buffer));
}
