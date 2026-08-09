import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { decodePng, inkCount } from "./png.mjs";

/**
 * Headless screenshot.
 *
 * The reason this file exists: the Browser pane in the environment this was
 * built in does not composite, so `requestAnimationFrame` never runs and the
 * pane's own screenshot times out. Everything visual in the previous round was
 * therefore shipped unseen - which is exactly how an open mouth rendered as a
 * `0` for three rounds without anyone noticing.
 *
 * Chrome's own headless mode does composite, so this is the eye.
 *
 *   node tools/shot.mjs <path> <out.png> [width] [height]
 *
 * `--virtual-time-budget` is what makes the result deterministic: Chrome fast
 * forwards timers and waits for the network to settle before the capture, so
 * the webfont is loaded and the layout is final rather than whatever happened
 * to be on screen after a fixed sleep.
 */

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
].find((p) => existsSync(p));

if (!CHROME) {
  console.error("No Chrome found.");
  process.exit(1);
}

/*
 * The fourth argument is a device scale factor. `3` renders every CSS pixel as
 * a 3x3 block, which is the zoom: point the window at one component, shoot it
 * at scale 3, and the result is big enough to actually inspect an edge rather
 * than squint at a 1600px page and assume.
 */
const [path = "/?bare=1", out = "shots/shot.png", w = "1600", h = "1000", scale = "1"] = process.argv.slice(2);
const url = `http://localhost:5173${path}`;
const target = resolve(out);
mkdirSync(resolve(target, ".."), { recursive: true });

/*
 * WebGL captures race the compositor.
 *
 * Measured on the player model: the SAME command produced a drawn model on
 * roughly one run in three and a completely blank frame on the others. It is
 * not a timeout - raising `--virtual-time-budget` from 6s to 20s made it no
 * better - it is virtual time starving the animation frame the renderer needs.
 * `--run-all-compositor-stages-before-draw` made it worse.
 *
 * So the capture verifies itself: shoot, decode, and if the frame came back as
 * one flat colour, shoot again. A page that is GENUINELY blank costs four
 * attempts and then reports it, which is the right failure - silence would
 * amount to reporting a rendering bug that does not exist. That very nearly
 * happened: three blank captures in a row read exactly like "the 3D model is
 * broken", and it was the capture all along.
 */
const ATTEMPTS = Number(process.env.SHOT_ATTEMPTS ?? 4);

/*
 * Check the server is actually up FIRST.
 *
 * The blank-frame retry above only asks "did anything draw", and Chrome's own
 * "This site can't be reached" page draws plenty. A dead dev server therefore
 * produced a perfectly valid-looking capture of an error page, which was then
 * read as a render. One request up front turns that into an error instead of
 * a misleading picture.
 */
try {
  const probe = await fetch(url, { method: "GET" });
  if (!probe.ok) throw new Error(`HTTP ${probe.status}`);
} catch (e) {
  console.error(`Dev server not answering at ${url} - ${e.message}. Start it before capturing.`);
  process.exit(1);
}

const capture = () =>
  execFileSync(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      // Optional persistent profile (absolute path), so localStorage seeded by
      // one capture survives into the next. Without it every run is amnesiac,
      // which is right for stateless pages and useless for the island page.
      ...(process.env.SHOT_PROFILE ? [`--user-data-dir=${process.env.SHOT_PROFILE}`] : []),
      // Software raster still runs the backdrop-filter pass; without this flag
      // newer Chrome refuses to fall back to SwiftShader and the glass renders
      // as a flat fill, which would quietly make every capture a lie.
      "--enable-unsafe-swiftshader",
      "--hide-scrollbars",
      `--force-device-scale-factor=${scale}`,
      `--window-size=${w},${h}`,
      // Virtual time never advances IndexedDB completions, so a page that
      // reads or writes IDB dies mid-transaction under it. SHOT_NO_VTIME
      // trades font determinism for real wall-clock async.
      ...(process.env.SHOT_NO_VTIME ? [] : [`--virtual-time-budget=${process.env.SHOT_BUDGET ?? 6000}`]),
      `--screenshot=${target}`,
      url,
    ],
    { stdio: "ignore" }
  );

let ink = 0;
let tries = 0;
while (tries < ATTEMPTS) {
  tries++;
  capture();
  ink = inkCount(decodePng(readFileSync(target)));
  if (ink > 0) break;
}

if (ink === 0) {
  console.error(`BLANK after ${tries} attempts - nothing drew. Either the page is empty or WebGL never rendered.`);
  process.exitCode = 1;
} else if (tries > 1) {
  console.log(`(took ${tries} attempts - the first ${tries - 1} lost the compositor race)`);
}

console.log(`wrote ${target}`);
