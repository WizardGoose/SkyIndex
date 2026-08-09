import { parseNbt } from "./reader";
import { writeNbt } from "./writer";
import type { NbtCompound, NbtDocument } from "./tags";

/**
 * The Hypixel transport: base64 of a compressed NBT document.
 *
 * Every binary field on a SkyBlock profile arrives this way. `inv_contents`,
 * `ender_chest_contents`, `talisman_bag`, `wardrobe_contents` and the backpack
 * blobs are all an object of the shape `{ type: 0, data: "<base64>" }`, and the
 * base64 decodes to gzip, and the gzip decompresses to an NBT document whose
 * root compound has a single key `i`. Verified against live data: see below.
 *
 * ## Compression is the browser's, not pako's
 *
 * `code.ts` already made this call for the island transport and the reasoning
 * carries over unchanged: pako is in this project for other code, but a 45 kB
 * dependency to do what every browser since 2023 does natively is not a trade
 * worth making. `DecompressionStream` it is, with the same guard and the same
 * apology when it is missing.
 *
 * ## Three containers, told apart by their first bytes
 *
 * Hypixel sends gzip. It has always sent gzip and every blob checked was gzip.
 * The other two cases are here anyway because they cost four lines and because
 * the failure they prevent is silent: handing zlib to a gzip decompressor
 * produces "corrupt data", which reads as "your inventory is broken" rather
 * than "we guessed the container wrong".
 *
 *   `1f 8b`   gzip. Decompressed with `DecompressionStream("gzip")`.
 *
 *   zlib      A zlib stream has no fixed magic. Its first byte encodes the
 *             compression method in the low nibble, and the method is always 8
 *             (deflate), and the two byte header is a multiple of 31. Both
 *             conditions together are the standard test, and both are applied,
 *             because the low nibble alone would also accept plenty of things
 *             that are not zlib at all.
 *
 *             The decompressor is `DecompressionStream("deflate")`. This is the
 *             one genuinely confusing name in the API and it is worth being
 *             exact about: `"deflate"` means "a deflate stream wrapped in the
 *             zlib header and Adler-32 trailer of RFC 1950", and `"deflate-raw"`
 *             means the bare RFC 1951 stream with no wrapper. The bytes this
 *             branch detects are the wrapper, so `"deflate"` is correct here
 *             and `"deflate-raw"` would fail on the very header that identified
 *             the format.
 *
 *   `0a`      Not compressed at all: a bare NBT document, which begins with the
 *             type byte of its root TAG_Compound. Parsed directly.
 *
 * There is no ambiguity between the three. `0x1f & 0x0f` is 15 and `0x0a & 0x0f`
 * is 10, so neither can be mistaken for the 8 the zlib test requires.
 *
 * ## What was verified, and how
 *
 * `GET /v2/skyblock/auctions` and `/v2/skyblock/auctions_ended` need no API key
 * and every entry carries `item_bytes`, which is this exact container holding
 * this exact document shape. Roughly 6000 live items were pulled and parsed
 * while this module was written. Every one was gzip, standard base64, root
 * TAG_Compound named `""`, single key `i`, a TAG_List of TAG_Compound. One of
 * them is baked into the test suite so that claim keeps being checked offline.
 */

const NO_STREAMS =
  "This browser cannot unpack item data (it has no DecompressionStream). Try a current Firefox, Chrome or Safari.";

const CANCELLED = "Reading that item data was cancelled.";

/**
 * base64 -> bytes.
 *
 * Standard base64, not the base64url `code.ts` deals in: Hypixel sends `+`, `/`
 * and `=` padding. `-` and `_` are therefore deliberately not translated. A
 * blob containing them is not one of Hypixel's, and quietly repairing it would
 * mean guessing at the intent of a producer we have never met.
 */
const fromBase64 = (text: string): Uint8Array => {
  // All whitespace, not just the ends, on the same reasoning `code.ts` gives:
  // base64 never contains whitespace, so removing it can only ever repair.
  const clean = text.replace(/\s+/g, "");
  // Hypixel pads, but a producer that strips padding is easy to accommodate and
  // impossible to confuse with anything else.
  const padded = clean + "=".repeat((4 - (clean.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

/**
 * bytes -> base64.
 *
 * Chunked because `String.fromCharCode(...bytes)` spreads every byte into an
 * argument list, and an ender chest full of named items blows the call stack
 * somewhere north of a hundred thousand of them. Same fix, same reason, as the
 * island transport.
 */
const toBase64 = (bytes: Uint8Array): string => {
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
};

/** gzip, zlib, raw NBT, or nothing we recognise. */
type Container = "gzip" | "zlib" | "nbt" | "unknown";

/**
 * Exported because it is the one piece of this module worth testing on its own:
 * every "that is not item data" message a player might see comes from getting
 * this wrong, and it is pure.
 */
export function detectContainer(bytes: Uint8Array): Container {
  if (bytes.length < 2) return "unknown";
  const b0 = bytes[0];
  const b1 = bytes[1];
  if (b0 === 0x1f && b1 === 0x8b) return "gzip";
  if ((b0 & 0x0f) === 8 && ((b0 << 8) | b1) % 31 === 0) return "zlib";
  // 0x0a is TAG_Compound, and a document's root is always one.
  if (b0 === 0x0a) return "nbt";
  return "unknown";
}

const hex = (byte: number): string => `0x${byte.toString(16).padStart(2, "0")}`;

/**
 * Run bytes through a decompression stream, with cancellation that actually
 * cancels.
 *
 * The abort listener cancels the stream rather than just setting a flag, so a
 * player who navigates away mid-parse is not left with a decompressor chewing
 * through a megabyte of ender chest in the background. Cancelling makes the
 * `Response` reject, which is why the `aborted` check comes first in the catch:
 * an abort must be reported as an abort, not as corrupt data.
 */
async function decompress(bytes: Uint8Array, format: "gzip" | "deflate", signal?: AbortSignal): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error(NO_STREAMS);
  }
  if (signal?.aborted) throw new Error(CANCELLED);

  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream(format));
  const onAbort = () => {
    void stream.cancel().catch(() => {});
  };
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    const buffer = await new Response(stream).arrayBuffer();
    return new Uint8Array(buffer);
  } catch {
    if (signal?.aborted) throw new Error(CANCELLED);
    throw new Error(
      `That item data could not be unpacked: it claims to be ${format === "gzip" ? "gzip" : "zlib"} but the ` +
        `compressed stream is corrupt or incomplete.`
    );
  } finally {
    signal?.removeEventListener("abort", onAbort);
  }
}

/**
 * Read one of Hypixel's base64 item blobs.
 *
 * Every failure mode gets its own sentence, on the same principle `code.ts`
 * works to: this string may well end up under a "your inventory could not be
 * read" heading, and "unexpected end of input" tells a player nothing about
 * whether their profile is private, their blob is truncated, or the site is
 * simply broken.
 */
export async function readNbtBlob(base64: string, signal?: AbortSignal): Promise<NbtDocument> {
  const text = String(base64 ?? "");
  if (text.trim() === "") {
    throw new Error("There is no item data here to read (the field was empty).");
  }

  let bytes: Uint8Array;
  try {
    bytes = fromBase64(text);
  } catch {
    throw new Error("That item data is damaged (it is not valid base64), so nothing could be unpacked from it.");
  }

  if (bytes.length === 0) {
    throw new Error("That item data decoded to nothing at all. It is empty.");
  }

  const container = detectContainer(bytes);
  if (container === "unknown") {
    // Naming the bytes matters. It is the difference between a bug report that
    // says "it does not work" and one that says which two bytes arrived, which
    // is enough to tell a truncated field from a JSON string that was never
    // item data in the first place.
    const seen = bytes.length > 1 ? `${hex(bytes[0])} ${hex(bytes[1])}` : hex(bytes[0]);
    throw new Error(
      `That does not look like item data. It unpacked to ${bytes.length} bytes starting ${seen}, and item ` +
        `data starts with 1f 8b (gzip), a zlib header, or 0a (uncompressed NBT).`
    );
  }

  const plain =
    container === "nbt"
      ? bytes
      : await decompress(bytes, container === "gzip" ? "gzip" : "deflate", signal);

  if (signal?.aborted) throw new Error(CANCELLED);

  // `parseNbt` throws sentences of its own, already written for a person, so
  // they travel up untouched rather than being wrapped in another apology.
  return parseNbt(plain);
}

/**
 * Write one, gzipped and base64'd, exactly as Hypixel would.
 *
 * The site has no reason to produce these in normal use. It is here for the
 * same reason `encodeIslandCode` is: a decoder you cannot round trip is a
 * decoder you are trusting on faith, and the transport half deserves that proof
 * as much as the parser half does. The test suite builds its inventory fixtures
 * with it and reads them back through `readNbtBlob`, so the whole path from a
 * tree to a base64 string and back is exercised, not just the parser.
 */
export async function writeNbtBlob(name: string, value: NbtCompound): Promise<string> {
  if (typeof CompressionStream === "undefined") {
    throw new Error(NO_STREAMS);
  }
  const plain = writeNbt(name, value);
  const stream = new Blob([plain as BlobPart]).stream().pipeThrough(new CompressionStream("gzip"));
  const buffer = await new Response(stream).arrayBuffer();
  return toBase64(new Uint8Array(buffer));
}
