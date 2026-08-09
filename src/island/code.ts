import type { IslandSnapshot } from "./types";
import { validateSnapshot } from "./validate";

/**
 * The clipboard transport: `SKYDEX-` + base64url(gzip(minified JSON)).
 *
 * This is the "GitHub Pages" mode of the mod, for players who cannot or will
 * not run a localhost server. `/skyindex copy` in game puts the code on the
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
const READ_PREFIXES = [CODE_PREFIX, "SKYDEX1.", "SKYINDEX1."] as const;

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
    throw new Error("Paste an island code first. Run /skyindex copy in game to put one on your clipboard.");
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

  let json: string;
  try {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    json = await new Response(stream).text();
  } catch {
    throw new Error("That code could not be unpacked (the compressed data is corrupt or incomplete).");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
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
