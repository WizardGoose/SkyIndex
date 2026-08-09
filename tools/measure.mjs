import { readFileSync } from "node:fs";
import { decodePng } from "./png.mjs";

/**
 * Measure contrast on the real composite.
 *
 * Not on a theoretical panel colour - on the actual pixels Chrome produced,
 * after the photo, the scrim, the backdrop blur and the panel tint have all
 * been applied. That is the only ground truth here, because the whole point of
 * glass is that its effective colour depends on what is behind it, and what is
 * behind it is a photograph that varies across the page.
 *
 * An earlier approach measured a flat panel colour and got
 * numbers that were correct about a surface the user never saw. This reads the
 * screenshot.
 *
 *   node tools/measure.mjs <png> [--at x,y,w,h,label ...]
 *
 * For each region it reports the brightest pixel, because contrast is a
 * worst-case property: text is unreadable where the background is lightest,
 * not where it averages.
 */

/* --- WCAG ---------------------------------------------------------------- */

const chan = (v) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lum = (r, g, b) => 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
const ratio = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
const hexLum = (hex) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return lum((n >> 16) & 255, (n >> 8) & 255, n & 255);
};

/* --- run ----------------------------------------------------------------- */

const [file, ...rest] = process.argv.slice(2);
const img = decodePng(readFileSync(file));

const regions = rest
  .filter((a) => a.startsWith("--at="))
  .map((a) => {
    const [x, y, w, h, label] = a.slice(5).split(",");
    return { x: +x, y: +y, w: +w, h: +h, label: label ?? `${x},${y}` };
  });

/* The text colours actually used on panels in this build. */
const INKS = {
  "slate-100 #e8edf3": "#e8edf3",
  "slate-300 #b2bfce": "#b2bfce",
  "slate-400 #93a3b8": "#93a3b8",
  "emerald-300 #6fd0fb": "#6fd0fb",
  "emerald-400 #38bdf2": "#38bdf2",
  "gold #ffb545": "#ffb545",
};

console.log(`${file}  ${img.width}x${img.height}\n`);

/*
 * `--edge=y0,y1,label` reports, for a horizontal band, the x of the guide line
 * (`?guides=1` draws it in fuchsia) and the x of the first bright pixel after
 * it. Alignment claims are the easiest thing in this project to get wrong by a
 * few pixels and the hardest to check by eye in a 1600px screenshot.
 */
/*
 * `--row=y,x0,x1` dumps a scanline as colour RUNS: every place the colour
 * changes, with the x it changed at and how wide the run was.
 *
 * This is the thing that makes an alignment question answerable instead of
 * arguable. "Does the bar start where the icon ends" is a guess from a
 * screenshot and a fact from a run list. It also catches the failure that
 * screenshots hide best: a boundary landing one or two pixels off, which the
 * eye reads as fine and a run dump reads as `450 -> 452`.
 */
for (const a of rest.filter((s) => s.startsWith("--row="))) {
  const [y, x0 = "0", x1 = String(img.width)] = a.slice(6).split(",");
  const runs = [];
  let prev = null;
  let start = +x0;

  for (let x = +x0; x < Math.min(+x1, img.width); x++) {
    const i = (+y * img.width + x) * img.channels;
    /* Quantised to 8 levels per channel: raw values wobble by a unit or two
       across a flat fill because of the JPEG backdrop underneath, and without
       this every pixel reads as its own run. */
    const key = [img.data[i], img.data[i + 1], img.data[i + 2]].map((v) => v >> 5).join(",");
    if (key !== prev) {
      if (prev !== null) runs.push({ from: start, to: x, hex: runs.hex, width: x - start });
      start = x;
      prev = key;
      const j = (+y * img.width + x) * img.channels;
      runs.hex = "#" + [img.data[j], img.data[j + 1], img.data[j + 2]].map((v) => v.toString(16).padStart(2, "0")).join("");
    }
  }
  runs.push({ from: start, to: Math.min(+x1, img.width), hex: runs.hex, width: Math.min(+x1, img.width) - start });

  console.log(`row y=${y}  x ${x0}..${x1}`);
  for (const r of runs) {
    if (r.width < 2) continue; // single-pixel antialiasing, not a boundary
    console.log(`  x ${String(r.from).padStart(5)} -> ${String(r.to).padStart(5)}  ${String(r.width).padStart(4)}px  ${r.hex}`);
  }
  console.log("");
}

/*
 * `--bbox=rr,gg,bb` finds the bounding box of everything that is NOT the given
 * background colour, and reports its centre against the frame's centre.
 *
 * For "is the figure centred in its box", which is a question about where the
 * drawn pixels are, not about where the element is. CSS can centre a canvas
 * perfectly while the thing inside the canvas sits high - the two are
 * different claims and only this one answers the one anybody can see.
 */
for (const a of rest.filter((s) => s.startsWith("--bbox="))) {
  const bg = a.slice(7).split(",").map(Number);
  let x0 = img.width;
  let y0 = img.height;
  let x1 = -1;
  let y1 = -1;

  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const i = (y * img.width + x) * img.channels;
      const off =
        Math.abs(img.data[i] - bg[0]) + Math.abs(img.data[i + 1] - bg[1]) + Math.abs(img.data[i + 2] - bg[2]);
      if (off > 24) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }

  if (x1 < 0) {
    console.log(`bbox: NOTHING drawn - the whole frame is the background colour\n`);
  } else {
    console.log(`bbox  x ${x0}..${x1}  y ${y0}..${y1}   ${x1 - x0 + 1} x ${y1 - y0 + 1}`);
    console.log(`  centre   ${Math.round((x0 + x1) / 2)}, ${Math.round((y0 + y1) / 2)}`);
    console.log(`  frame    ${Math.round(img.width / 2)}, ${Math.round(img.height / 2)}`);
    console.log(
      `  offset   ${Math.round((x0 + x1) / 2 - img.width / 2)}, ${Math.round((y0 + y1) / 2 - img.height / 2)} px\n`
    );
  }
}

for (const a of rest.filter((s) => s.startsWith("--edge="))) {
  const [y0, y1, label = "band"] = a.slice(7).split(",");
  let guide = null;
  let firstInk = null;

  for (let x = 0; x < img.width; x++) {
    for (let y = +y0; y < +y1; y++) {
      const i = (y * img.width + x) * img.channels;
      const [r, g, b] = [img.data[i], img.data[i + 1], img.data[i + 2]];
      if (guide === null && r > 190 && g < 110 && b > 190) guide = x;
      if (firstInk === null && guide !== null && x > guide && lum(r, g, b) > 0.35) firstInk = x;
    }
  }

  console.log(`${label}`);
  console.log(`  guide (split)   x = ${guide}`);
  console.log(`  first ink after x = ${firstInk}`);
  console.log(`  delta           ${firstInk !== null && guide !== null ? firstInk - guide : "n/a"} px\n`);
}

for (const r of regions) {
  let peak = -1;
  let peakPx = [0, 0, 0];
  let sum = 0;
  let n = 0;

  for (let y = r.y; y < r.y + r.h && y < img.height; y++) {
    for (let x = r.x; x < r.x + r.w && x < img.width; x++) {
      const i = (y * img.width + x) * img.channels;
      const l = lum(img.data[i], img.data[i + 1], img.data[i + 2]);
      sum += l;
      n++;
      if (l > peak) {
        peak = l;
        peakPx = [img.data[i], img.data[i + 1], img.data[i + 2]];
      }
    }
  }

  const hex = "#" + peakPx.map((v) => v.toString(16).padStart(2, "0")).join("");
  console.log(`${r.label}`);
  console.log(`  brightest ${hex}   mean L ${(sum / n).toFixed(4)}   peak L ${peak.toFixed(4)}`);
  for (const [name, ink] of Object.entries(INKS)) {
    const cr = ratio(hexLum(ink), peak);
    const verdict = cr >= 4.5 ? "AA" : cr >= 3 ? "AA-large" : "FAIL";
    console.log(`  ${name.padEnd(22)} ${cr.toFixed(2).padStart(6)}:1  ${verdict}`);
  }
  console.log("");
}
