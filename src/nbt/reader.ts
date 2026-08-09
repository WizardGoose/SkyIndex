import { TAG_IDS, TAG_LABELS, TAG_NAMES } from "./tags";
import type { NbtCompound, NbtDocument, NbtList, NbtTag, NbtTagName } from "./tags";
import { decodeModifiedUtf8 } from "./modifiedUtf8";

/**
 * The NBT reader: bytes in, a tagged tree out.
 *
 * Everything in the format is big-endian, so every numeric read goes through a
 * `DataView` rather than a typed array. Typed arrays use the platform's byte
 * order, which is little-endian on every machine this will ever run on, so
 * `new Int32Array(buffer)` over NBT bytes produces silently byte-swapped
 * numbers. `DataView` takes the endianness as an argument and its default is
 * big-endian, which is the one case in the web platform where the default is
 * the one we want.
 *
 * ## What this reader refuses to do
 *
 * The input is remote data. Not hostile in practice, since it comes from
 * Hypixel, but it arrives over a network and it is parsed in a browser tab, so
 * it is treated as though somebody wrote it on purpose to break us. Three
 * classes of failure are closed off, and each one gets its own sentence rather
 * than a shared "malformed data" that tells a player nothing:
 *
 *   Running off the end. Every read checks first. Reading past the end throws
 *   a sentence naming what it was in the middle of and where in the document
 *   that was, rather than returning `undefined` or `NaN` and letting the wrong
 *   answer travel three layers up before anyone notices.
 *
 *   Nesting. A compound inside a list inside a compound recurses, so a blob
 *   nested a million levels deep would exhaust the JavaScript stack and take
 *   the page with it. `MAX_DEPTH` stops that long before the engine does.
 *
 *   Declared lengths. Every array and list states its own length, unchecked,
 *   as a signed 32 bit number. A declared length of 2147483647 must fail on
 *   the spot rather than being handed to an allocator. The check is not a
 *   fixed cap but a comparison against how many bytes are actually left: a
 *   list of a million compounds needs at least a million bytes to exist, so
 *   if a million bytes do not remain, the length is a lie and nothing is
 *   allocated.
 *
 * ## What it deliberately tolerates
 *
 * Trailing bytes after the root compound closes. The document has been read in
 * full and complaining would risk rejecting a real blob over padding that
 * costs us nothing. Verified against live Hypixel data that there is normally
 * no trailing content at all (a real auction blob consumed 903 of its 903
 * decompressed bytes), so this leniency has never yet been needed. It is here
 * because the alternative is a hard failure on a difference that does not
 * affect a single value we read.
 */

/**
 * Nesting limit.
 *
 * 512 is far past anything real and far short of anything dangerous. For scale:
 * the deepest path in a genuine SkyBlock item blob is about five levels
 * (`root` to `i` to the item to `tag` to `ExtraAttributes` to `enchantments`),
 * verified by parsing roughly 6000 live auction items. So this is not a budget
 * anyone can spend by accident, only a floor under the stack.
 */
export const MAX_DEPTH = 512;

/**
 * The fewest bytes an element of each type can possibly occupy.
 *
 * This is what turns a declared length into an honest question. A TAG_List of
 * TAG_Compound claiming a billion entries needs at least a billion bytes,
 * because the shortest possible compound is a single TAG_End terminator. A
 * TAG_String needs at least its own two byte length prefix. The numbers are
 * lower bounds, not exact sizes, which is all the check needs: it exists to
 * reject the impossible, and the ordinary read that follows catches the merely
 * truncated.
 */
const MIN_ELEMENT_BYTES: Readonly<Record<NbtTagName, number>> = {
  end: 0,
  byte: 1,
  short: 2,
  int: 4,
  long: 8,
  float: 4,
  double: 8,
  byteArray: 4,
  string: 2,
  list: 5,
  compound: 1,
  intArray: 4,
  longArray: 4,
};

class Cursor {
  readonly bytes: Uint8Array;
  readonly view: DataView;
  offset = 0;
  depth = 0;
  /**
   * Where in the document we are, as `.key` and `[index]` fragments.
   *
   * Purely for error messages, and worth its keep for exactly that: "ended in
   * the middle of a 4 byte integer" is a shrug, and "ended in the middle of a
   * 4 byte integer at i[27].tag.ExtraAttributes.rarity_upgrades" tells whoever
   * is holding the broken blob which item to go and look at.
   */
  readonly path: string[] = [];

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
    // The byte offset and length matter: a `Uint8Array` handed to us may be a
    // view onto part of a larger buffer (a `subarray` of a decompressed blob,
    // say), and a `DataView` over the whole buffer would read the wrong bytes.
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  where(): string {
    if (this.path.length === 0) return "the root compound";
    return this.path.join("").replace(/^\./, "");
  }

  /**
   * Claim `count` bytes and return the offset they start at.
   *
   * Every single read in this file goes through here, which is the only reason
   * "reading past the end" can be a promise rather than a hope.
   */
  take(count: number, what: string): number {
    const end = this.offset + count;
    if (end > this.bytes.length) {
      throw new Error(
        `That item data ended in the middle of ${what} (at ${this.where()}). ` +
          `It is ${this.bytes.length} bytes long and reading ${what} needed ${end}. It was cut short.`
      );
    }
    const at = this.offset;
    this.offset = end;
    return at;
  }

  /**
   * Reject a declared length that cannot possibly fit in what is left.
   *
   * Called before any allocation, never after.
   */
  requireRoom(count: number, unitBytes: number, what: string): void {
    if (!Number.isInteger(count) || count < 0) {
      throw new Error(
        `That item data declares ${what} with a negative length (${count}) at ${this.where()}. ` +
          `Lengths are written as signed numbers and a real one is never below zero, so this data is corrupt.`
      );
    }
    const needed = count * unitBytes;
    const left = this.bytes.length - this.offset;
    if (needed > left) {
      throw new Error(
        `That item data claims ${what} holding ${count} entries at ${this.where()}, which would need at least ` +
          `${needed} bytes, but only ${left} bytes remain. Nothing was read: the length itself is wrong.`
      );
    }
  }

  u8(what: string): number {
    return this.view.getUint8(this.take(1, what));
  }

  i8(what: string): number {
    return this.view.getInt8(this.take(1, what));
  }

  i16(what: string): number {
    return this.view.getInt16(this.take(2, what), false);
  }

  u16(what: string): number {
    return this.view.getUint16(this.take(2, what), false);
  }

  i32(what: string): number {
    return this.view.getInt32(this.take(4, what), false);
  }

  i64(what: string): bigint {
    return this.view.getBigInt64(this.take(8, what), false);
  }

  f32(what: string): number {
    return this.view.getFloat32(this.take(4, what), false);
  }

  f64(what: string): number {
    return this.view.getFloat64(this.take(8, what), false);
  }

  /** Two byte unsigned length, then that many bytes of modified UTF-8. */
  string(what: string): string {
    const length = this.u16(`the length of ${what}`);
    const at = this.take(length, what);
    return decodeModifiedUtf8(this.bytes, at, length, this.where());
  }

  /** One byte type id, resolved to a name or rejected. */
  tagName(what: string): NbtTagName {
    const id = this.u8(what);
    const name = TAG_NAMES[id];
    if (name === undefined) {
      throw new Error(
        `That item data uses tag type ${id} at ${this.where()}, which is not one of the 13 NBT tag types. ` +
          `Either it is corrupt or it is not NBT at all.`
      );
    }
    return name;
  }

  enter(what: string): void {
    this.depth += 1;
    if (this.depth > MAX_DEPTH) {
      throw new Error(
        `That item data nests ${what} more than ${MAX_DEPTH} levels deep (at ${this.where()}). ` +
          `Real item data is about five levels deep, so this is either corrupt or built to crash the page.`
      );
    }
  }

  leave(): void {
    this.depth -= 1;
  }
}

/** Read one payload of the given type. The name, where there is one, is already consumed. */
function readPayload(cursor: Cursor, type: NbtTagName): NbtTag {
  const label = TAG_LABELS[type];
  switch (type) {
    case "end":
      // Unreachable from any caller: `readCompound` handles the terminator
      // itself and `readList` rejects a non-empty list of TAG_End. Present so
      // the switch is total rather than relying on a default that hides a bug.
      throw new Error(`That item data has a ${label} where a value was expected, at ${cursor.where()}.`);
    case "byte":
      return { type, value: cursor.i8(`a ${label}`) };
    case "short":
      return { type, value: cursor.i16(`a ${label}`) };
    case "int":
      return { type, value: cursor.i32(`a ${label}`) };
    case "long":
      return { type, value: cursor.i64(`a ${label}`) };
    case "float":
      return { type, value: cursor.f32(`a ${label}`) };
    case "double":
      return { type, value: cursor.f64(`a ${label}`) };
    case "string":
      return { type, value: cursor.string(`a ${label}`) };
    case "byteArray": {
      const length = cursor.i32(`the length of a ${label}`);
      cursor.requireRoom(length, 1, `a ${label}`);
      const at = cursor.take(length, `a ${label}`);
      // `slice` copies. A `subarray` would keep the whole decompressed blob
      // alive behind a handful of bytes, and would let a consumer write
      // through into the buffer the rest of the tree was read from.
      return { type, value: cursor.bytes.slice(at, at + length) };
    }
    case "intArray": {
      const length = cursor.i32(`the length of an ${label}`);
      cursor.requireRoom(length, 4, `an ${label}`);
      const value = new Int32Array(length);
      for (let i = 0; i < length; i++) value[i] = cursor.i32(`an ${label}`);
      return { type, value };
    }
    case "longArray": {
      const length = cursor.i32(`the length of a ${label}`);
      cursor.requireRoom(length, 8, `a ${label}`);
      const value = new BigInt64Array(length);
      for (let i = 0; i < length; i++) value[i] = cursor.i64(`a ${label}`);
      return { type, value };
    }
    case "list":
      return readList(cursor);
    case "compound":
      return readCompound(cursor);
  }
}

function readList(cursor: Cursor): NbtList {
  const elementType = cursor.tagName("the element type of a TAG_List");
  const length = cursor.i32("the length of a TAG_List");

  if (elementType === "end") {
    // An empty list is written with element type TAG_End, and this is not a
    // corner case to be tolerated: it is what Hypixel actually sends. Verified
    // on a live auction item whose `tag.ench` is a TAG_List of TAG_End with
    // length 0. A non-empty one is a different matter, and has to be rejected
    // rather than looped over, because TAG_End has no payload and reading
    // "length" of them would consume nothing and produce nothing forever.
    if (length !== 0) {
      throw new Error(
        `That item data has a TAG_List at ${cursor.where()} claiming ${length} entries of TAG_End, ` +
          `which is a terminator and holds no value. Only an empty list may be typed TAG_End.`
      );
    }
    return { type: "list", elementType, value: [] };
  }

  cursor.requireRoom(length, MIN_ELEMENT_BYTES[elementType], `a TAG_List of ${TAG_LABELS[elementType]}`);

  cursor.enter("lists and compounds");
  const value: NbtTag[] = [];
  for (let i = 0; i < length; i++) {
    cursor.path.push(`[${i}]`);
    value.push(readPayload(cursor, elementType));
    cursor.path.pop();
  }
  cursor.leave();

  return { type: "list", elementType, value };
}

function readCompound(cursor: Cursor): NbtCompound {
  cursor.enter("lists and compounds");
  const value = new Map<string, NbtTag>();

  for (;;) {
    const type = cursor.tagName("a tag type inside a TAG_Compound");
    if (type === "end") break;

    const key = cursor.string("the name of a tag");
    cursor.path.push(`.${key}`);
    // Last one wins on a duplicate key, which is what a `Map` does for free and
    // what every NBT reader does. A duplicate is malformed either way and there
    // is no reading of the format under which the earlier value is the right
    // answer, so this is not worth an error that would cost somebody an
    // otherwise readable inventory.
    value.set(key, readPayload(cursor, type));
    cursor.path.pop();
  }

  cursor.leave();
  return { type: "compound", value };
}

/**
 * Parse a whole document.
 *
 * The root of an NBT document is a named TAG_Compound: one type byte that must
 * be 10, a two byte name length, the name, then the compound's contents. The
 * name is empty in everything Hypixel sends but is returned rather than
 * dropped, because throwing away a field on the grounds that today's only
 * producer leaves it blank is how a parser acquires an assumption nobody wrote
 * down.
 *
 * Takes bytes that are already decompressed. `readNbtBlob` in `blob.ts` is the
 * one that deals with base64 and gzip, and the split is deliberate: this
 * function is synchronous and total, which is what makes it cheap to test
 * against thousands of generated inputs.
 */
export function parseNbt(bytes: Uint8Array): NbtDocument {
  if (bytes.length === 0) {
    throw new Error("That item data is empty. There is nothing to read.");
  }

  const cursor = new Cursor(bytes);
  const first = bytes[0];

  if (first !== TAG_IDS.compound) {
    // The overwhelmingly likely cause of a wrong first byte is compressed data
    // arriving at the wrong door, so say that outright instead of making
    // somebody work it out from a tag id.
    if (first === 0x1f && bytes[1] === 0x8b) {
      throw new Error(
        "That item data is still compressed (it begins with the gzip magic bytes). " +
          "Read it with readNbtBlob, which unpacks the container first."
      );
    }
    if ((first & 0x0f) === 8 && bytes.length > 1 && ((first << 8) | bytes[1]) % 31 === 0) {
      throw new Error(
        "That item data is still compressed (it begins with a zlib header). " +
          "Read it with readNbtBlob, which unpacks the container first."
      );
    }
    const known = TAG_NAMES[first];
    throw new Error(
      `That item data does not start with a TAG_Compound, so it is not an NBT document. ` +
        `Its first byte is ${first}${known ? ` (${TAG_LABELS[known]})` : ""}, and a document must begin with 10 (TAG_Compound).`
    );
  }

  cursor.offset = 1;
  const name = cursor.string("the root compound's name");
  const value = readCompound(cursor);
  return { name, value };
}
