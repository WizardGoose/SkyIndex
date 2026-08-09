/**
 * Java's modified UTF-8, which is what every string in an NBT document is.
 *
 * NBT strings are written by `java.io.DataOutputStream.writeUTF`, and that
 * method does not write UTF-8. It writes a near miss that the JVM documentation
 * calls "modified UTF-8", and the two places it diverges are exactly the two
 * places a `TextDecoder` will quietly hand back the wrong string rather than
 * complain:
 *
 *   U+0000 is written as the two bytes `C0 80` instead of a single `00`, so
 *   that a string may contain a NUL without the encoded form containing a zero
 *   byte. Standard UTF-8 calls that an overlong encoding and rejects it, so a
 *   non-fatal `TextDecoder` turns it into U+FFFD and a fatal one throws.
 *
 *   A character outside the Basic Multilingual Plane (an emoji, most obviously)
 *   is not written as the four byte sequence UTF-8 would use. Java encodes the
 *   two UTF-16 surrogates that make up the character separately, each as its
 *   own three byte sequence, for six bytes total. This is the encoding also
 *   known as CESU-8. Standard UTF-8 forbids encoding surrogate code points at
 *   all, so a `TextDecoder` produces two replacement characters and the emoji
 *   is gone.
 *
 * So this file hand-rolls both directions rather than reaching for
 * `TextDecoder`/`TextEncoder`. It is about sixty lines of arithmetic, it has no
 * divergent cases to paper over, and the alternative is a decoder that is
 * correct only on the subset of inputs that happen to also be valid UTF-8: a
 * player whose item is named with an emoji would get a mangled name and no
 * error, which is precisely the "confidently wrong" outcome this codebase
 * refuses everywhere else.
 *
 * A convenient consequence of surrogates being encoded individually: the
 * decoder never has to know about supplementary characters. It decodes each
 * three byte sequence into one UTF-16 code unit, and a JavaScript string built
 * from a high surrogate followed by a low surrogate *is* the supplementary
 * character, with no further work. The encoder is symmetric: it walks code
 * units rather than code points, so a surrogate pair naturally becomes two
 * three byte sequences without a special case.
 *
 * ## The one asymmetry, stated honestly
 *
 * A raw `00` byte is not legal modified UTF-8, but Java's own `readUTF`
 * accepts it and yields U+0000, so this decoder does too. The encoder writes
 * U+0000 as `C0 80`, per the format. That means a document containing a raw
 * `00` inside a string will not survive a decode then encode byte for byte:
 * it comes back as `C0 80`. The string value is identical, only the bytes
 * differ, and Java behaves the same way. Every other input round trips exactly.
 */

/**
 * Chunked for the same reason `code.ts` chunks its `btoa`: applying
 * `String.fromCharCode` to a spread of a large array blows the call stack
 * somewhere north of a hundred thousand arguments. NBT strings are capped at
 * 65535 bytes by their own two byte length prefix, so this can never actually
 * bite here, but the bound is stated rather than assumed.
 */
const CHUNK = 0x8000;

const fromCodeUnits = (units: number[]): string => {
  if (units.length <= CHUNK) return String.fromCharCode(...units);
  let out = "";
  for (let i = 0; i < units.length; i += CHUNK) {
    out += String.fromCharCode(...units.slice(i, i + CHUNK));
  }
  return out;
};

/**
 * Decode `length` bytes starting at `start`.
 *
 * `context` is woven into any error so the message can say where in the
 * document the bad string was, rather than "invalid byte" with no address.
 */
export function decodeModifiedUtf8(bytes: Uint8Array, start: number, length: number, context: string): string {
  const end = start + length;
  const units: number[] = [];

  let i = start;
  while (i < end) {
    const a = bytes[i];

    // The single byte form. Note that `00` lands here: see the asymmetry note
    // at the top of this file for why it is accepted rather than rejected.
    if (a < 0x80) {
      units.push(a);
      i += 1;
      continue;
    }

    // A continuation byte, or a four byte lead. Either way the stream is not
    // modified UTF-8, and saying which of the two it was makes the difference
    // between a corrupt blob and a blob written by something that is not Java.
    if (a < 0xc0) {
      throw new Error(
        `That item data contains a broken string in ${context}: byte 0x${a.toString(16).padStart(2, "0")} ` +
          `appears where a character should start. It is a continuation byte, so the text is cut or corrupt.`
      );
    }
    if (a >= 0xf0) {
      throw new Error(
        `That item data contains a string in ${context} that is plain UTF-8, not the modified UTF-8 Minecraft ` +
          `writes (byte 0x${a.toString(16)} starts a four byte sequence, which Java never produces). ` +
          `Whatever wrote this blob was not Minecraft.`
      );
    }

    const width = a < 0xe0 ? 2 : 3;
    if (i + width > end) {
      throw new Error(
        `That item data ended in the middle of a character in ${context}: a ${width} byte character starts ` +
          `${end - i} byte${end - i === 1 ? "" : "s"} before the end of the text. The data is cut short.`
      );
    }

    const b = bytes[i + 1];
    if ((b & 0xc0) !== 0x80) {
      throw new Error(
        `That item data contains a broken string in ${context}: a ${width} byte character is followed by ` +
          `0x${b.toString(16).padStart(2, "0")}, which is not a continuation byte.`
      );
    }

    if (width === 2) {
      // Includes the `C0 80` spelling of U+0000, which needs no special case:
      // the arithmetic produces 0 on its own.
      units.push(((a & 0x1f) << 6) | (b & 0x3f));
      i += 2;
      continue;
    }

    const c = bytes[i + 2];
    if ((c & 0xc0) !== 0x80) {
      throw new Error(
        `That item data contains a broken string in ${context}: a 3 byte character is followed by ` +
          `0x${c.toString(16).padStart(2, "0")}, which is not a continuation byte.`
      );
    }
    // A surrogate decodes to a lone code unit here and pairs up with its
    // neighbour in the finished string. That is the whole supplementary
    // character story: see the note at the top of this file.
    units.push(((a & 0x0f) << 12) | ((b & 0x3f) << 6) | (c & 0x3f));
    i += 3;
  }

  return fromCodeUnits(units);
}

/**
 * How many bytes `text` will occupy once encoded.
 *
 * Separate from the encoder because a string in NBT is prefixed by its encoded
 * length as an unsigned 16 bit number, so the length has to be known before the
 * bytes are written, and counting twice is cheaper than allocating twice.
 */
export function modifiedUtf8Length(text: string): number {
  let total = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    // The order matters: U+0000 takes the two byte branch, not the one byte
    // branch it would otherwise fall into.
    if (c > 0 && c < 0x80) total += 1;
    else if (c < 0x800) total += 2;
    else total += 3;
  }
  return total;
}

/** Encode `text`, without the length prefix. The writer adds that. */
export function encodeModifiedUtf8(text: string): Uint8Array {
  const out = new Uint8Array(modifiedUtf8Length(text));
  let o = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c > 0 && c < 0x80) {
      out[o++] = c;
    } else if (c < 0x800) {
      // U+0000 arrives here and becomes `C0 80`, which is the entire point of
      // the format being "modified".
      out[o++] = 0xc0 | (c >> 6);
      out[o++] = 0x80 | (c & 0x3f);
    } else {
      // Walking code units rather than code points means a surrogate pair is
      // two separate trips through this branch, which is exactly the six byte
      // CESU-8 form Java writes for a supplementary character.
      out[o++] = 0xe0 | (c >> 12);
      out[o++] = 0x80 | ((c >> 6) & 0x3f);
      out[o++] = 0x80 | (c & 0x3f);
    }
  }
  return out;
}
