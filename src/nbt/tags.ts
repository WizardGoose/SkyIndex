/**
 * The Named Binary Tag value model.
 *
 * NBT is Minecraft's own serialisation format and it is what Hypixel puts on
 * the wire for every field the JSON cannot describe: `inv_contents`,
 * `ender_chest_contents`, `talisman_bag`, the backpack blobs. Those fields are
 * base64 of gzip of NBT, and `hypixel.ts` states plainly that v1 refused to
 * read them because "a subtly wrong binary parser in a 'where is my stuff' tool
 * is worse than an honest blank". This module is the thing that lifts that
 * restriction, so every decision in it is made with that sentence in mind: it
 * would rather throw a sentence a person can act on than hand back a number it
 * is not sure about.
 *
 * The format itself is small. A tag is a one byte type id, and (except inside a
 * list, where the type is declared once for the whole list) a two byte length
 * followed by that many bytes of name, then a payload whose shape the type id
 * decides. Everything numeric is big-endian. A document's root is a named
 * TAG_Compound, which is why `parseNbt` returns a name alongside a value even
 * though Hypixel's own blobs always name the root `""` (verified: see below).
 *
 * ## Why a tagged union rather than plain values
 *
 * The obvious model is "turn it into ordinary JavaScript" - a compound becomes
 * an object, a list becomes an array, everything else becomes a number or a
 * string. That model cannot be written back out. A `1` that came from a
 * TAG_Byte and a `1` that came from a TAG_Int are the same JavaScript value and
 * re-encoding has to guess, and a guess in an encoder is how a round trip
 * quietly stops being a round trip. Keeping the type beside the value costs one
 * property and buys a writer that is a true inverse, which is the only way to
 * build test fixtures that prove the reader rather than agree with it.
 *
 * ## Why compounds are a Map and not an object
 *
 * Two reasons, both about not lying.
 *
 * Key order. A JavaScript object does not preserve insertion order for keys
 * that look like array indices: `{"1": a, "0": b}` iterates `0` then `1`. NBT
 * compound keys are arbitrary strings and nothing stops one being `"0"`, so an
 * object would silently reorder a real document and the bytes written back out
 * would not match the bytes read in. A `Map` preserves insertion order for
 * every key without exception.
 *
 * Hostile keys. A blob is remote data. A compound containing the key
 * `__proto__` assigned into an object literal is a prototype hazard for free.
 * A `Map` has no such notion, so the question never arises.
 *
 * ## Why TAG_Long and TAG_LongArray are `bigint`
 *
 * A JavaScript number is a double and carries 53 bits of integer precision. A
 * TAG_Long carries 64. Reading one into a number is exact only while the value
 * happens to be small, and silently wrong the moment it is not, which is the
 * worst possible failure shape: it works on every value you test with and
 * breaks on somebody's real data. SkyBlock stores item timestamps and various
 * ids as longs (verified: `tag.ExtraAttributes.timestamp` on a live auction
 * item is a TAG_Long holding 1778538353925), so this is not hypothetical. The
 * cost of `bigint` is that a consumer has to convert deliberately, which is
 * exactly the point: the conversion is where the precision decision belongs.
 *
 * ## What was verified against real Hypixel data, and how
 *
 * Everything asserted about SkyBlock's own shape in this module was checked
 * against live blobs pulled from `GET /v2/skyblock/auctions` and
 * `/v2/skyblock/auctions_ended`, which are keyless endpoints whose `item_bytes`
 * field is the same base64 gzip NBT container the profile inventory fields use.
 * Roughly 6000 real items were parsed. What that sample established:
 *
 *   - the container is gzip (magic `1f 8b`) and the decompressed document
 *     begins with byte `0x0a`, a TAG_Compound, named `""`.
 *   - the root compound's only key is `i`, a TAG_List of TAG_Compound.
 *   - an EMPTY TAG_List is written with element type TAG_End: `tag.ench` on a
 *     real item is a `List<End>[0]`. Handling that case is not defensive
 *     programming, it is required to read Hypixel at all.
 *   - an empty inventory slot is an empty TAG_Compound. Verified from the
 *     nested `builder's_ruler_data` blob on a live auction, whose `i` list held
 *     54 compounds and all 54 were empty.
 *
 * The per-field findings live in `items.ts` next to the code that reads them.
 */

/**
 * Tag type ids, exactly as the format numbers them.
 *
 * A plain frozen object rather than an `enum` because this project compiles
 * with `erasableSyntaxOnly`, which forbids enums outright.
 */
export const TAG_IDS = {
  end: 0,
  byte: 1,
  short: 2,
  int: 3,
  long: 4,
  float: 5,
  double: 6,
  byteArray: 7,
  string: 8,
  list: 9,
  compound: 10,
  intArray: 11,
  longArray: 12,
} as const;

/** Every tag name, including `end`, which is a terminator and never a value. */
export type NbtTagName = keyof typeof TAG_IDS;

/** The names that actually carry a payload. `end` is structural, not data. */
export type NbtValueName = Exclude<NbtTagName, "end">;

/** Id to name, for turning a byte off the wire back into something readable. */
export const TAG_NAMES: readonly NbtTagName[] = [
  "end",
  "byte",
  "short",
  "int",
  "long",
  "float",
  "double",
  "byteArray",
  "string",
  "list",
  "compound",
  "intArray",
  "longArray",
];

/**
 * Spec spellings, used only in error messages.
 *
 * An error that says `TAG_LongArray` can be pasted into a search engine and
 * lands on the format's documentation. One that says `longArray` cannot.
 */
export const TAG_LABELS: Readonly<Record<NbtTagName, string>> = {
  end: "TAG_End",
  byte: "TAG_Byte",
  short: "TAG_Short",
  int: "TAG_Int",
  long: "TAG_Long",
  float: "TAG_Float",
  double: "TAG_Double",
  byteArray: "TAG_Byte_Array",
  string: "TAG_String",
  list: "TAG_List",
  compound: "TAG_Compound",
  intArray: "TAG_Int_Array",
  longArray: "TAG_Long_Array",
};

export interface NbtByte {
  readonly type: "byte";
  /** Signed, -128 to 127, because that is what the format stores. See `items.ts` on stack counts. */
  readonly value: number;
}

export interface NbtShort {
  readonly type: "short";
  /** Signed, -32768 to 32767. */
  readonly value: number;
}

export interface NbtInt {
  readonly type: "int";
  /** Signed 32 bit. */
  readonly value: number;
}

export interface NbtLong {
  readonly type: "long";
  /** Signed 64 bit. `bigint` on purpose: see the note at the top of this file. */
  readonly value: bigint;
}

export interface NbtFloat {
  readonly type: "float";
  /**
   * Stored as a 32 bit float, held here as a double.
   *
   * Widening is lossless in this direction, and narrowing back on write is the
   * same rounding the value already went through, so a read then write round
   * trip is bit for bit exact. Building a float by hand from a value a float32
   * cannot represent is the one case that loses information, and it loses it in
   * the same way Minecraft would.
   */
  readonly value: number;
}

export interface NbtDouble {
  readonly type: "double";
  readonly value: number;
}

export interface NbtByteArray {
  readonly type: "byteArray";
  /**
   * `Uint8Array`, not `Int8Array`, despite the format calling these signed bytes.
   *
   * The signedness is a display question and the bits are identical either way.
   * What is not identical is how usable the result is: the only thing SkyBlock
   * actually stores in a TAG_Byte_Array is another gzip NBT document (verified:
   * `ExtraAttributes["builder's_ruler_data"]` on a live auction item is a
   * byte array whose contents start `1f 8b`), and every byte-consuming web API,
   * `Blob` and `DecompressionStream` included, takes a `Uint8Array`. Handing a
   * consumer the type they have to convert before doing the one thing this
   * field is for would be a papercut with nothing on the other side of it.
   */
  readonly value: Uint8Array;
}

export interface NbtString {
  readonly type: "string";
  /**
   * Already decoded from Java's modified UTF-8. See `modifiedUtf8.ts` for what
   * that format is and where it diverges from the UTF-8 `TextDecoder` speaks.
   */
  readonly value: string;
}

export interface NbtList {
  readonly type: "list";
  /**
   * The element type, declared once for the whole list by the format itself.
   *
   * Kept even though it is implied by the contents of a non-empty list, because
   * an empty list still has one on the wire and Hypixel writes `end` for it.
   * Dropping it would make the writer guess, and a writer that guesses is not
   * an inverse.
   */
  readonly elementType: NbtTagName;
  readonly value: readonly NbtTag[];
}

export interface NbtCompound {
  readonly type: "compound";
  /** A `Map`, for key order and for `__proto__`. Both reasons are at the top of this file. */
  readonly value: Map<string, NbtTag>;
}

export interface NbtIntArray {
  readonly type: "intArray";
  readonly value: Int32Array;
}

export interface NbtLongArray {
  readonly type: "longArray";
  /** `BigInt64Array` for the same 64 bit reason `NbtLong` is a `bigint`. */
  readonly value: BigInt64Array;
}

export type NbtTag =
  | NbtByte
  | NbtShort
  | NbtInt
  | NbtLong
  | NbtFloat
  | NbtDouble
  | NbtByteArray
  | NbtString
  | NbtList
  | NbtCompound
  | NbtIntArray
  | NbtLongArray;

/**
 * A whole document: the root's name and the root compound.
 *
 * The name is carried rather than discarded because the format has it and
 * throwing away a field on the grounds that the one producer we know about
 * always leaves it blank is how a parser acquires an undocumented assumption.
 * Hypixel does always leave it blank (verified across roughly 6000 live auction
 * blobs, every one named `""`), and a caller is free to ignore it.
 */
export interface NbtDocument {
  readonly name: string;
  readonly value: NbtCompound;
}

/**
 * Constructors.
 *
 * These exist because the tagged union is verbose to write by hand and the test
 * suite builds every one of its fixtures by encoding a tree with our own
 * writer. `nbt.compound({ i: nbt.list("compound", [...]) })` is readable;
 * the object literal it expands to is not, and a fixture nobody can read is a
 * fixture nobody checks. They are exported rather than kept in the tests
 * because the mod side of this project will eventually want to build item NBT
 * too, and one set of constructors is better than two.
 *
 * They deliberately do no validation. Range checking lives in the writer, in
 * one place, at the moment a value has to become bytes, so that a caller
 * assembling a tree in several steps is not fought at every step.
 */
export const nbt = {
  byte: (value: number): NbtByte => ({ type: "byte", value }),
  short: (value: number): NbtShort => ({ type: "short", value }),
  int: (value: number): NbtInt => ({ type: "int", value }),
  long: (value: bigint): NbtLong => ({ type: "long", value }),
  float: (value: number): NbtFloat => ({ type: "float", value }),
  double: (value: number): NbtDouble => ({ type: "double", value }),
  byteArray: (value: Uint8Array): NbtByteArray => ({ type: "byteArray", value }),
  string: (value: string): NbtString => ({ type: "string", value }),
  list: (elementType: NbtTagName, value: readonly NbtTag[] = []): NbtList => ({
    type: "list",
    elementType,
    value,
  }),
  /**
   * Built from a plain record for readability at the call site.
   *
   * `Object.entries` preserves insertion order for every key that is not an
   * array index, which covers every key any hand-written fixture will ever use.
   * A caller who genuinely needs a compound keyed `"0"` in a chosen order can
   * build the `Map` directly, and the reader always does.
   */
  compound: (entries: Record<string, NbtTag> = {}): NbtCompound => ({
    type: "compound",
    value: new Map(Object.entries(entries)),
  }),
  intArray: (value: Int32Array | readonly number[]): NbtIntArray => ({
    type: "intArray",
    value: value instanceof Int32Array ? value : Int32Array.from(value),
  }),
  longArray: (value: BigInt64Array | readonly bigint[]): NbtLongArray => ({
    type: "longArray",
    value: value instanceof BigInt64Array ? value : BigInt64Array.from(value),
  }),
};
