import { TAG_IDS, TAG_LABELS } from "./tags";
import type { NbtCompound, NbtTag } from "./tags";
import { encodeModifiedUtf8, modifiedUtf8Length } from "./modifiedUtf8";
import { MAX_DEPTH } from "./reader";

/**
 * The NBT writer: a tagged tree in, bytes out.
 *
 * This exists first and foremost so the tests can build fixtures by encoding,
 * which is the only honest way to test a binary reader. A fixture written by
 * hand as a byte array is a second implementation of the format, written by the
 * same person, at the same moment, from the same misunderstanding: if the
 * reader has the wrong idea about, say, whether a list's length comes before or
 * after its element type, the hand-built fixture will have the same wrong idea
 * and the test will pass. Encoding with a writer and reading back only passes
 * if the two halves agree, and the two halves are the only two things that
 * could disagree.
 *
 * That is only worth anything if the writer is a genuine inverse, so it is one:
 * every tag type, `bigint` longs unwidened, modified UTF-8 strings byte for
 * byte, list element types preserved including the TAG_End of an empty list,
 * compound key order preserved. Verified the strong way rather than asserted:
 * a real Hypixel auction blob read with `parseNbt` and written back with
 * `writeNbt` produces the identical 903 bytes.
 *
 * ## Why it range checks
 *
 * A tree that came from `parseNbt` is always in range by construction, so the
 * checks below only ever fire on a tree somebody built by hand. That is exactly
 * when they are worth having. Writing 300 into a TAG_Byte would store 44 and
 * say nothing, and a stack count that is silently wrong by 256 in an inventory
 * tool is the whole category of bug this codebase is organised against. The
 * writer would rather refuse than round.
 *
 * Floats are the one exception and are not range checked. A TAG_Float is a
 * 32 bit float and a value a 32 bit float cannot represent becomes the nearest
 * one it can, or an infinity: that is not the writer losing information the
 * caller did not ask to lose, it is what storing a number in a float means, and
 * Minecraft does the same. NaN and the infinities are legal float payloads and
 * are written through untouched.
 */

/**
 * A growable output buffer.
 *
 * Starts at a kilobyte and doubles. NBT is written strictly forwards with no
 * back-patching, so nothing more clever is needed: no length placeholder ever
 * has to be revisited, because every length in the format is known before the
 * thing it measures is written.
 */
class Sink {
  private buffer: Uint8Array;
  private view: DataView;
  private length = 0;

  constructor(initial = 1024) {
    this.buffer = new Uint8Array(initial);
    this.view = new DataView(this.buffer.buffer);
  }

  private room(count: number): number {
    const end = this.length + count;
    if (end > this.buffer.length) {
      let size = this.buffer.length;
      while (size < end) size *= 2;
      const grown = new Uint8Array(size);
      grown.set(this.buffer.subarray(0, this.length));
      this.buffer = grown;
      // The old view pointed at the old buffer. Forgetting this line is a
      // silent corruption rather than a crash, so it lives next to the growth.
      this.view = new DataView(this.buffer.buffer);
    }
    const at = this.length;
    this.length = end;
    return at;
  }

  /*
   * EVERY ACCESSOR BELOW RESERVES FIRST, ON ITS OWN LINE. THIS IS LOAD BEARING.
   *
   * The natural way to write these is `this.view.setUint8(this.room(1), value)`,
   * and it is wrong in a way that hides for a long time. JavaScript evaluates
   * the member expression `this.view` BEFORE it evaluates the argument
   * `this.room(1)`. When that call is the one that grows the sink, `room`
   * replaces both `this.buffer` and `this.view`, and the write then lands on
   * the view that was captured a moment earlier: the old, smaller one. The
   * offset it was handed is only valid in the new buffer, so it is past the end
   * of the old one.
   *
   * Reserving into a local first means the buffer and the view are both read
   * after any growth has happened.
   *
   * This was a real defect, not a hypothetical. It survived every small fixture
   * because a growth has to coincide with one of these calls to show, and it
   * only surfaced against a bag the size Hypixel actually sends, where it threw
   * "offset is out of bounds" out of `raw`. On a `set` it throws; on a
   * `DataView` write past the end it also throws, so at least it fails loudly
   * rather than corrupting a blob silently.
   */

  u8(value: number): void {
    const at = this.room(1);
    this.view.setUint8(at, value);
  }

  i8(value: number): void {
    const at = this.room(1);
    this.view.setInt8(at, value);
  }

  i16(value: number): void {
    const at = this.room(2);
    this.view.setInt16(at, value, false);
  }

  u16(value: number): void {
    const at = this.room(2);
    this.view.setUint16(at, value, false);
  }

  i32(value: number): void {
    const at = this.room(4);
    this.view.setInt32(at, value, false);
  }

  i64(value: bigint): void {
    const at = this.room(8);
    this.view.setBigInt64(at, value, false);
  }

  f32(value: number): void {
    const at = this.room(4);
    this.view.setFloat32(at, value, false);
  }

  f64(value: number): void {
    const at = this.room(8);
    this.view.setFloat64(at, value, false);
  }

  raw(bytes: Uint8Array): void {
    const at = this.room(bytes.length);
    this.buffer.set(bytes, at);
  }

  /** Two byte unsigned length, then modified UTF-8. */
  string(text: string, what: string, where: string): void {
    const size = modifiedUtf8Length(text);
    if (size > 0xffff) {
      throw new Error(
        `Cannot write ${what} at ${where}: it is ${size} bytes once encoded, and an NBT string carries its ` +
          `length in two bytes, so 65535 is the most it can hold.`
      );
    }
    this.u16(size);
    this.raw(encodeModifiedUtf8(text));
  }

  /** A copy, trimmed to what was actually written. */
  result(): Uint8Array {
    return this.buffer.slice(0, this.length);
  }
}

const requireInteger = (value: number, min: number, max: number, label: string, where: string): void => {
  if (!Number.isInteger(value)) {
    throw new Error(
      `Cannot write ${label} at ${where}: ${value} is not a whole number, and ${label} stores whole numbers only.`
    );
  }
  if (value < min || value > max) {
    throw new Error(
      `Cannot write ${label} at ${where}: ${value} is outside ${min} to ${max}, which is everything ${label} ` +
        `can hold. Writing it anyway would store a different number and say nothing.`
    );
  }
};

const LONG_MIN = -(2n ** 63n);
const LONG_MAX = 2n ** 63n - 1n;

function writePayload(sink: Sink, tag: NbtTag, where: string, depth: number): void {
  const label = TAG_LABELS[tag.type];
  switch (tag.type) {
    case "byte":
      requireInteger(tag.value, -128, 127, label, where);
      sink.i8(tag.value);
      return;
    case "short":
      requireInteger(tag.value, -32768, 32767, label, where);
      sink.i16(tag.value);
      return;
    case "int":
      requireInteger(tag.value, -2147483648, 2147483647, label, where);
      sink.i32(tag.value);
      return;
    case "long":
      if (tag.value < LONG_MIN || tag.value > LONG_MAX) {
        throw new Error(
          `Cannot write ${label} at ${where}: ${tag.value} does not fit in 64 signed bits. ` +
            `Writing it would wrap it round to a different number.`
        );
      }
      sink.i64(tag.value);
      return;
    // Floats and doubles are written as given: see the note at the top of this
    // file for why they are the one type with no range check.
    case "float":
      sink.f32(tag.value);
      return;
    case "double":
      sink.f64(tag.value);
      return;
    case "byteArray":
      sink.i32(tag.value.length);
      sink.raw(tag.value);
      return;
    case "string":
      sink.string(tag.value, `a ${label}`, where);
      return;
    case "intArray":
      sink.i32(tag.value.length);
      // Element by element rather than a bulk copy, because a typed array is
      // in the platform's byte order and NBT is big-endian. A `set` here would
      // write every number backwards on every machine anyone owns.
      for (let i = 0; i < tag.value.length; i++) sink.i32(tag.value[i]);
      return;
    case "longArray":
      sink.i32(tag.value.length);
      for (let i = 0; i < tag.value.length; i++) sink.i64(tag.value[i]);
      return;
    case "list": {
      const { elementType, value } = tag;
      if (elementType === "end") {
        // The empty list's own type. A non-empty one cannot be written because
        // it cannot be read back: TAG_End has no payload, so the reader would
        // consume nothing per element. Refusing here means the reader never
        // has to meet the thing at all.
        if (value.length > 0) {
          throw new Error(
            `Cannot write the TAG_List at ${where}: it holds ${value.length} entries but is typed TAG_End, ` +
              `which has no payload. Only an empty list may be typed TAG_End.`
          );
        }
        sink.u8(TAG_IDS.end);
        sink.i32(0);
        return;
      }
      // One declared type for the whole list is the format's rule, so a mixed
      // list is unwritable rather than merely unusual. Catching it here names
      // the offending index; letting it through would write bytes that claim a
      // type they do not have and blow up in a reader somewhere else entirely.
      for (let i = 0; i < value.length; i++) {
        if (value[i].type !== elementType) {
          throw new Error(
            `Cannot write the TAG_List at ${where}: it is declared as ${TAG_LABELS[elementType]} but entry ` +
              `${i} is a ${TAG_LABELS[value[i].type]}. Every entry of a list shares one type.`
          );
        }
      }
      sink.u8(TAG_IDS[elementType]);
      sink.i32(value.length);
      writeChildren(sink, value, where, depth);
      return;
    }
    case "compound": {
      if (depth + 1 > MAX_DEPTH) {
        // The reader has the same cap, for the same reason. Here it doubles as
        // the only defence against a tree that contains itself, which is easy
        // to build by accident and would otherwise recurse until the stack
        // gives out.
        throw new Error(
          `Cannot write this tree: it nests more than ${MAX_DEPTH} levels deep at ${where}. ` +
            `Either it is far deeper than any real item data, or it contains itself.`
        );
      }
      for (const [key, child] of tag.value) {
        sink.u8(TAG_IDS[child.type]);
        sink.string(key, "a tag name", where);
        writePayload(sink, child, `${where === "the root compound" ? "" : `${where}.`}${key}`, depth + 1);
      }
      sink.u8(TAG_IDS.end);
      return;
    }
  }
}

/** Split out only so the list case stays readable; the depth cap is applied here. */
function writeChildren(sink: Sink, children: readonly NbtTag[], where: string, depth: number): void {
  if (depth + 1 > MAX_DEPTH) {
    throw new Error(
      `Cannot write this tree: it nests more than ${MAX_DEPTH} levels deep at ${where}. ` +
        `Either it is far deeper than any real item data, or it contains itself.`
    );
  }
  for (let i = 0; i < children.length; i++) {
    writePayload(sink, children[i], `${where}[${i}]`, depth + 1);
  }
}

/**
 * Encode a document.
 *
 * The inverse of `parseNbt`, and provably so: reading a real Hypixel blob and
 * writing it back reproduces the bytes exactly. The one input that does not
 * come back identical is a string containing a raw `00` byte, which is not
 * legal modified UTF-8 in the first place and which the writer normalises to
 * the `C0 80` spelling the format requires. `modifiedUtf8.ts` says so at
 * length; it is recorded here too because "true inverse" is a claim and this is
 * its single exception.
 */
export function writeNbt(name: string, value: NbtCompound): Uint8Array {
  const sink = new Sink();
  sink.u8(TAG_IDS.compound);
  sink.string(name, "the root compound's name", "the root compound");
  writePayload(sink, value, "the root compound", 0);
  return sink.result();
}
