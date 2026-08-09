import { inflateSync } from "node:zlib";

/**
 * A minimal PNG reader: 8-bit, non-interlaced, colour type 2 or 6.
 *
 * That is what Chrome writes, and supporting more would be code with no
 * caller. Shared by `measure.mjs` (which reads pixels) and `shot.mjs` (which
 * only needs to know whether the capture came back blank).
 */
export const decodePng = (buf) => {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not a png");

  let pos = 8;
  let width = 0;
  let height = 0;
  let channels = 0;
  const idat = [];

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8) throw new Error(`bit depth ${data[8]} unsupported`);
      if (data[12] !== 0) throw new Error("interlaced png unsupported");
      channels = data[9] === 6 ? 4 : data[9] === 2 ? 3 : 0;
      if (!channels) throw new Error(`colour type ${data[9]} unsupported`);
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    pos += len + 12;
  }

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);

  /* Un-filter. Each scanline is decoded against the one above, so this has to
     run in order - the whole image is reconstructed even to read one pixel. */
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;

    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? cur[i - channels] : 0;
      const b = prev ? prev[i] : 0;
      const c = prev && i >= channels ? prev[i - channels] : 0;
      let v = src[i];

      switch (filter) {
        case 1:
          v += a;
          break;
        case 2:
          v += b;
          break;
        case 3:
          v += (a + b) >> 1;
          break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          break;
        }
        default:
          break;
      }
      cur[i] = v & 0xff;
    }
  }

  return { width, height, channels, data: out };
};

/**
 * How many pixels differ from the top-left pixel by more than a hair.
 *
 * Used as "did anything actually draw". A WebGL capture that lost its race
 * comes back as one flat colour, and that is indistinguishable from a correct
 * screenshot of an empty page unless you already know what you asked for,
 * which is why the caller decides what counts as enough ink.
 */
export const inkCount = (img) => {
  const [r0, g0, b0] = [img.data[0], img.data[1], img.data[2]];
  let n = 0;
  for (let i = 0; i < img.data.length; i += img.channels) {
    if (Math.abs(img.data[i] - r0) + Math.abs(img.data[i + 1] - g0) + Math.abs(img.data[i + 2] - b0) > 24) n++;
  }
  return n;
};
