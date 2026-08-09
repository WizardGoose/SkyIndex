import { deflateRaw, inflateRaw } from "pako";
import { CROP_IDS, MUTATION_IDS, CROP_TO_INDEX, MUTATION_TO_INDEX } from "../constants/cropMapping";

/**
 * The share transport: base64url(rawDeflate(grid string)).
 *
 * Nothing is uploaded anywhere. The code IS the layout, which is why a share
 * link is just our own designer route with the code hanging off it.
 *
 * The format is frozen on purpose. Every link already sitting in someone's
 * Discord history is a raw-deflate payload whose letters index into the
 * positional arrays in ../constants/cropMapping. Switching the compressor, or
 * reordering CROP_IDS or MUTATION_IDS, invalidates all of them silently: the
 * code still decodes, it just decodes into different crops. A v2 would have to
 * announce itself in the payload before any of that could change.
 */

const GRID_SIZE = 10;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

const LETTERS = "abcdefghijklmnopqrstuvwxyz";
const MAX_SINGLE_CROPS = 26; // a-z
const MAX_DOUBLE_CROPS = 26 * 26; // aa-zz = 676

function indexToDouble(idx: number): string {
  const first = LETTERS[Math.floor(idx / LETTERS.length)];
  const second = LETTERS[idx % LETTERS.length];
  return first + second;
}

function doubleToIndex(chars: string): number {
  const firstIdx = LETTERS.indexOf(chars[0].toLowerCase());
  const secondIdx = LETTERS.indexOf(chars[1].toLowerCase());
  if (firstIdx === -1 || secondIdx === -1) return -1;
  return firstIdx * LETTERS.length + secondIdx;
}

/**
 * bytes -> base64url.
 *
 * Chunked because `String.fromCharCode(...bytes)` spreads every byte into an
 * argument list, and a large enough payload blows the call stack. Today's codes
 * are about a hundred bytes so the naive version survives, which is exactly why
 * it would have been rewritten by whoever first made a payload big enough to
 * break it, in production, at a confusing moment.
 */
function toUrlSafeBase64(bytes: Uint8Array): string {
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromUrlSafeBase64(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

interface GroupedPlacements {
  [cropId: string]: number[]; // positions as flat indices (row * 10 + col)
}

function groupPlacements(
  placements: Array<{ cropId: string; position: [number, number] }>
): GroupedPlacements {
  const grouped: GroupedPlacements = {};
  for (const p of placements) {
    if (!grouped[p.cropId]) grouped[p.cropId] = [];
    grouped[p.cropId].push(p.position[0] * GRID_SIZE + p.position[1]);
  }
  return grouped;
}

function encodeGridString(
  inputs: GroupedPlacements,
  targets: GroupedPlacements
): string {
  const inputCrops = Object.keys(inputs);
  const targetCrops = Object.keys(targets);

  const inputIndices: number[] = [];
  const inputCropsList: string[] = [];
  
  for (const cropId of inputCrops) {
    let idx = CROP_TO_INDEX[cropId];
    if (idx !== undefined) {
      inputIndices.push(idx);
      inputCropsList.push(cropId);
    } else {
      idx = MUTATION_TO_INDEX[cropId];
      if (idx !== undefined) {
        inputIndices.push(CROP_IDS.length + idx);
        inputCropsList.push(cropId);
      }
    }
  }

  const targetIndices: number[] = [];
  const targetCropsList: string[] = [];
  
  for (const mutationId of targetCrops) {
    const idx = MUTATION_TO_INDEX[mutationId];
    if (idx !== undefined) {
      targetIndices.push(CROP_IDS.length + idx);
      targetCropsList.push(mutationId);
    }
  }

  // Validate crop counts
  if (inputCropsList.length > MAX_DOUBLE_CROPS) {
    throw new Error(`Too many input crops: ${inputCropsList.length} (max ${MAX_DOUBLE_CROPS})`);
  }
  if (targetCropsList.length > MAX_DOUBLE_CROPS) {
    throw new Error(`Too many target crops: ${targetCropsList.length} (max ${MAX_DOUBLE_CROPS})`);
  }

  // Use double mode if either category exceeds single-char limit
  const useDouble = inputCropsList.length > MAX_SINGLE_CROPS || targetCropsList.length > MAX_SINGLE_CROPS;
  const emptyChar = useDouble ? ".." : ".";

  // Build grid using local indices
  const grid = new Array<string>(TOTAL_CELLS).fill(emptyChar);

  // Assign characters to input crops
  inputCropsList.forEach((crop, localIdx) => {
    const chars = useDouble ? indexToDouble(localIdx) : LETTERS[localIdx];
    for (const pos of inputs[crop]) {
      grid[pos] = chars;
    }
  });

  // Assign characters to target crops
  targetCropsList.forEach((mutation, localIdx) => {
    const chars = useDouble ? indexToDouble(localIdx).toUpperCase() : LETTERS[localIdx].toUpperCase();
    for (const pos of targets[mutation]) {
      grid[pos] = chars;
    }
  });

  const inputIdx = inputIndices.map((i) => i.toString(36)).join(",");
  const targetIdx = targetIndices.map((i) => i.toString(36)).join(",");
  return inputIdx + "|" + targetIdx + "|" + grid.join("");
}

const UNKNOWN_CROP_MESSAGE =
  "This layout uses crops this version does not know about. Update the site, or ask for a fresh copy of the link.";

/**
 * Raised when an index in a code names a crop this build does not have.
 *
 * It gets its own type so `decodeDesign` can let it through its catch instead
 * of flattening it into the generic "not a valid layout" text. "Your site is
 * out of date" and "your code is mangled" call for different actions from the
 * player, and we can tell them apart here.
 */
class UnknownCropError extends Error {
  constructor() {
    super(UNKNOWN_CROP_MESSAGE);
    this.name = "UnknownCropError";
  }
}

/**
 * One shared index space: 0 up to CROP_IDS.length is a crop, and everything
 * above it continues into MUTATION_IDS at that offset.
 *
 * Every index has to resolve or the whole code is refused. This used to be a
 * `.map(...).filter(Boolean)`, which deleted an index this build did not
 * recognise and slid every later crop one slot down the list. The grid letters
 * are positional into that list, so the import then SUCCEEDED and drew a
 * layout made of the wrong crops. A refusal a player can act on beats a
 * plausible lie.
 *
 * The annotation on `id` is load-bearing: `noUncheckedIndexedAccess` is off, so
 * TypeScript believes an out-of-range lookup returns a crop id, which is why
 * nothing here ever looked wrong. The widening is what makes the guard real.
 */
function resolveCropId(idx: number): string {
  const id: string | undefined =
    idx < CROP_IDS.length ? CROP_IDS[idx] : MUTATION_IDS[idx - CROP_IDS.length];
  // Also catches NaN from a corrupt base 36 index and any negative index:
  // both miss every slot and land here rather than shifting the list.
  if (!id) throw new UnknownCropError();
  return id;
}

function decodeGridString(str: string): {
  inputs: GroupedPlacements;
  targets: GroupedPlacements;
} {
  const parts = str.split("|");
  if (parts.length !== 3) {
    throw new Error("Invalid format: expected 3 parts separated by pipes");
  }

  const [inputIdxStr, targetIdxStr, gridStr] = parts;

  // Parse indices
  const inputIndices = inputIdxStr ? inputIdxStr.split(",").map((c) => parseInt(c, 36)) : [];
  const targetIndices = targetIdxStr ? targetIdxStr.split(",").map((c) => parseInt(c, 36)) : [];

  // Map indices to crop/mutation IDs. No filtering: an index that does not
  // resolve rejects the code rather than being dropped out of the list.
  const inputCrops = inputIndices.map(resolveCropId);
  const targetCrops = targetIndices.map(resolveCropId);

  const useDouble = gridStr.length === TOTAL_CELLS * 2;
  const charWidth = useDouble ? 2 : 1;
  const expectedGridLength = TOTAL_CELLS * charWidth;

  if (gridStr.length !== expectedGridLength) {
    throw new Error(`Invalid grid: expected ${TOTAL_CELLS} or ${TOTAL_CELLS * 2} characters, got ${gridStr.length}`);
  }

  const emptyChar = useDouble ? ".." : ".";

  const inputs: GroupedPlacements = {};
  const targets: GroupedPlacements = {};

  // Initialize empty arrays for each crop
  inputCrops.forEach((crop) => {
    inputs[crop] = [];
  });
  targetCrops.forEach((crop) => {
    targets[crop] = [];
  });

  // Parse grid
  for (let pos = 0; pos < TOTAL_CELLS; pos++) {
    const chars = gridStr.slice(pos * charWidth, (pos + 1) * charWidth);
    if (chars === emptyChar) continue;

    // All uppercase = target, all lowercase = input
    const isTarget = chars === chars.toUpperCase() && chars !== chars.toLowerCase();
    const isInput = chars === chars.toLowerCase() && chars !== chars.toUpperCase();

    if (!isTarget && !isInput) continue;

    let idx: number;
    if (useDouble) {
      idx = doubleToIndex(chars);
    } else {
      idx = LETTERS.indexOf(chars.toLowerCase());
    }

    if (idx === -1) continue;

    if (isTarget && idx < targetCrops.length) {
      targets[targetCrops[idx]].push(pos);
    } else if (isInput && idx < inputCrops.length) {
      inputs[inputCrops[idx]].push(pos);
    }
  }

  return { inputs, targets };
}

function ungroupPlacements(
  grouped: GroupedPlacements
): Array<{ cropId: string; position: [number, number] }> {
  const placements: Array<{ cropId: string; position: [number, number] }> = [];
  for (const [cropId, positions] of Object.entries(grouped)) {
    for (const pos of positions) {
      const row = Math.floor(pos / GRID_SIZE);
      const col = pos % GRID_SIZE;
      placements.push({ cropId, position: [row, col] });
    }
  }
  return placements;
}

export function encodeDesign(
  inputPlacements: Array<{ cropId: string; position: [number, number] }>,
  targetPlacements: Array<{ cropId: string; position: [number, number] }>
): string {
  // Group placements by crop
  const inputs = groupPlacements(inputPlacements);
  const targets = groupPlacements(targetPlacements);

  // Encode to grid string format
  const gridString = encodeGridString(inputs, targets);

  // Compress with deflate (max compression)
  const compressed = deflateRaw(gridString, { level: 9 });

  // Convert to URL-safe base64
  return toUrlSafeBase64(compressed);
}

/**
 * Every whitespace character, not just the ends.
 *
 * Codes get pasted out of chat clients that hard-wrap long strings, and neither
 * base64url nor a URL ever legitimately contains whitespace, so removing it can
 * only ever repair a paste. `String(x ?? "")` because callers hand us whatever
 * came back from a URL parameter, which may be null.
 */
function scrub(value: string | null | undefined): string {
  return String(value ?? "").replace(/\s+/g, "");
}

const EMPTY_LINK_MESSAGE =
  "That link has a layout slot but nothing in it. Copy the whole link again.";

/**
 * The share link, on our own origin, as the inverse of `extractLayoutCode`.
 *
 * `base` is Vite's `import.meta.env.BASE_URL`: "/" locally and "/Skydex/" on
 * GitHub Pages, which is the same value src/App.tsx derives the router basename
 * from. Gluing the route onto it keeps the copied link openable on whichever
 * deployment produced it, instead of assuming the app sits at the root of its
 * origin. It lives here, next to the parser, so the sub-path case is a unit
 * test rather than a thing somebody checks by eye once.
 *
 * This link used to point at `https://api.skyshards.com/share/<code>`, a host
 * we do not run, and copying one also fired a POST at that host to warm a
 * server-side Discord preview image. Both are gone, and the preview image went
 * with them: we cannot render one on someone else's server. That is a
 * deliberate trade, not an oversight. Please do not add the POST back.
 *
 * Nothing was ever uploaded by any of it. The code is the whole layout, so the
 * link is self-contained.
 */
export function buildShareUrl(code: string, origin: string, base: string): string {
  const root = base || "/";
  const prefix = root.endsWith("/") ? root : `${root}/`;
  return `${origin}${prefix}greenhouse/designer?layout=${code}`;
}

/**
 * Pull the layout code out of whatever the player pasted.
 *
 * Three shapes have to keep working, because all three are already in the wild:
 *
 *   1. our own share link, `.../greenhouse/designer?layout=<code>`
 *   2. the legacy `https://api.skyshards.com/share/<code>` link, which is what
 *      every code shared before we cut that dependency looks like. We no longer
 *      produce these and the host is not ours, but a player pasting one should
 *      get their layout rather than an error, so the shape stays understood.
 *   3. a bare code, which is what you get when someone copies the tail of a
 *      link out of a message.
 *
 * A link carrying an empty `layout` is called out rather than falling through.
 * The old code returned the entire URL as if it were a raw code, so the player
 * got a base64 complaint about a string that was visibly a link.
 */
export function extractLayoutCode(input: string | null | undefined): string {
  const clean = scrub(input);
  if (!clean) return "";

  if (/[?&]layout=/.test(clean)) {
    let param: string | null = null;
    try {
      param = new URL(clean).searchParams.get("layout");
    } catch {
      // Not an absolute URL, so `new URL` refused it outright. A relative link
      // still carries the parameter, and a regex does not care about origins.
    }
    if (param === null) {
      const match = clean.match(/[?&]layout=([^&#]*)/);
      param = match ? match[1] : null;
    }
    if (param) return param;
    throw new Error(EMPTY_LINK_MESSAGE);
  }

  const shareMatch = clean.match(/\/share\/([^/?#]+)/);
  if (shareMatch) return shareMatch[1];

  return clean;
}

export function decodeDesign(encoded: string | null | undefined): {
  inputs: Array<{ cropId: string; position: [number, number] }>;
  targets: Array<{ cropId: string; position: [number, number] }>;
} {
  /*
   * Each failure gets its own sentence. This message is rendered in a toast to
   * a player, and pako's own wording ("invalid stored block lengths") tells
   * them nothing about whether they copied half a code or copied the wrong
   * thing entirely. pako also throws a bare string rather than an Error, so
   * letting it escape produced a message that was either meaningless or,
   * because `err instanceof Error` was false, swallowed into "Invalid format".
   */
  const clean = scrub(encoded);
  if (!clean) {
    throw new Error("Paste a layout code or share link first.");
  }

  let compressed: Uint8Array;
  try {
    compressed = fromUrlSafeBase64(clean);
  } catch {
    throw new Error("That code is damaged (it is not valid base64). Copy the whole link again.");
  }

  /*
   * Two distinct failures, one message, because a player cannot act on the
   * difference. pako throws for data that is not deflate at all, and returns
   * undefined for a stream that ran out early, which is what a truncated
   * copy-paste looks like. The undefined case is the nastier of the two: it
   * used to reach `.split("|")` and surface as a TypeError about reading a
   * property of undefined.
   */
  const unpackFailed = () =>
    new Error("That code could not be unpacked (the compressed data is corrupt or incomplete).");

  let inflated: unknown;
  try {
    inflated = inflateRaw(compressed, { to: "string" });
  } catch {
    throw unpackFailed();
  }
  if (typeof inflated !== "string" || !inflated) {
    throw unpackFailed();
  }
  const gridString: string = inflated;

  let grouped: { inputs: GroupedPlacements; targets: GroupedPlacements };
  try {
    grouped = decodeGridString(gridString);
  } catch (err) {
    // "Your site is out of date" is a genuinely different problem from "your
    // code is mangled", and the player can act on the difference, so that one
    // keeps its own wording instead of being flattened into the generic text.
    if (err instanceof UnknownCropError) throw err;
    throw new Error("That code unpacked, but what came out was not a valid greenhouse layout.");
  }

  return {
    inputs: ungroupPlacements(grouped.inputs),
    targets: ungroupPlacements(grouped.targets),
  };
}

