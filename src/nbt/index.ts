/**
 * The NBT engine's public surface.
 *
 * Hypixel hands several of the most useful things on a profile over as
 * base64 of gzipped Named Binary Tag: the accessory bag, the inventory, the
 * ender chest, the wardrobe and the pets. This module is what turns those bytes
 * into something the site can read, with no dependency added to do it: the
 * decompression is the browser's own `DecompressionStream`, the same choice and
 * for the same reason as `src/island/code.ts`.
 *
 * Consumers import from here rather than from a file inside, so the split
 * between the tag model, the reader, the writer, the transport and the SkyBlock
 * projection stays an implementation detail.
 *
 * The writer is exported deliberately, not as a curiosity. Every fixture in the
 * test suite is built by encoding a tree with it, so a passing test proves the
 * reader and the writer agree rather than proving the reader agrees with a
 * hand-typed byte array that the same person wrote. A decoder you cannot
 * round-trip is a decoder you are trusting on faith.
 */

export { parseNbt, MAX_DEPTH } from "./reader";
export { writeNbt } from "./writer";
export { readNbtBlob, writeNbtBlob, detectContainer } from "./blob";
export { readInventoryItems, readItemIds, stripColourCodes } from "./items";
export type { NbtItem } from "./items";
export { decodeModifiedUtf8, encodeModifiedUtf8, modifiedUtf8Length } from "./modifiedUtf8";

export { nbt, TAG_IDS, TAG_NAMES, TAG_LABELS } from "./tags";
export type {
  NbtTag,
  NbtTagName,
  NbtValueName,
  NbtDocument,
  NbtByte,
  NbtShort,
  NbtInt,
  NbtLong,
  NbtFloat,
  NbtDouble,
  NbtByteArray,
  NbtString,
  NbtList,
  NbtCompound,
  NbtIntArray,
  NbtLongArray,
} from "./tags";
