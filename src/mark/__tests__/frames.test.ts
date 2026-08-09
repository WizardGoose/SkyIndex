import { describe, expect, it } from "vitest";
import {
  ALERT_FRAME_MS,
  ALERT_FRAMES,
  BLINK_FRAME_MS,
  BLINK_FRAMES,
  CANVAS_H,
  CANVAS_W,
  IDLE_FRAME_MS,
  IDLE_FRAMES,
  MARK_ACCENT,
  MARK_WHITE,
  SATISFIED_FRAME_MS,
  SATISFIED_FRAMES,
  THINKING_FRAME_MS,
  THINKING_FRAMES,
} from "../frames";
import type { Frame, Run } from "../frames";

/** The rest pose: `IDLE_FRAMES[0]`, by definition of what "idle" means. */
const REST = IDLE_FRAMES[0];

/** Every expression's frame set, paired with its per-frame durations. */
const EXPRESSIONS: { name: string; frames: Frame[]; ms: number[] }[] = [
  { name: "idle", frames: IDLE_FRAMES, ms: IDLE_FRAME_MS },
  { name: "blink", frames: BLINK_FRAMES, ms: BLINK_FRAME_MS },
  { name: "alert", frames: ALERT_FRAMES, ms: ALERT_FRAME_MS },
  { name: "thinking", frames: THINKING_FRAMES, ms: THINKING_FRAME_MS },
  { name: "satisfied", frames: SATISFIED_FRAMES, ms: SATISFIED_FRAME_MS },
];

/** Expressions that are complete cycles: they play start to finish and end
 * back on the rest pose, so the player never needs to reverse them. Idle is
 * NOT one of these: it is a 2-frame rest/breathe oscillator the player
 * ping-pongs between, so its second frame is deliberately not rest (see the
 * dedicated idle test below). */
const COMPLETE_CYCLES = new Set(["blink", "thinking"]);

/** Expressions that are one-way "in" sequences: the player holds the last
 * frame while the state is true, and plays the array in reverse to leave. */
const IN_SEQUENCES = new Set(["alert", "satisfied"]);

describe("canvas", () => {
  it("is the same 35x12 grid every frame is drawn against", () => {
    expect(CANVAS_W).toBe(35);
    expect(CANVAS_H).toBe(12);
  });

  it("keeps every run of every frame inside the shared canvas", () => {
    for (const { name, frames } of EXPRESSIONS) {
      for (const [fi, frame] of frames.entries()) {
        for (const [x, y, w] of frame) {
          expect(x, `${name}[${fi}] run at (${x},${y})`).toBeGreaterThanOrEqual(0);
          expect(y, `${name}[${fi}] run at (${x},${y})`).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThan(CANVAS_H);
          expect(x + w, `${name}[${fi}] run at (${x},${y}) width ${w}`).toBeLessThanOrEqual(CANVAS_W);
          expect(w, `${name}[${fi}]`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("never draws a frame with nothing in it", () => {
    for (const { name, frames } of EXPRESSIONS) {
      for (const [fi, frame] of frames.entries()) {
        expect(frame.length, `${name}[${fi}]`).toBeGreaterThan(0);
      }
    }
  });

  it("only ever paints the mark's two colours", () => {
    for (const { name, frames } of EXPRESSIONS) {
      for (const frame of frames) {
        for (const [, , , color] of frame) {
          expect([MARK_WHITE, MARK_ACCENT], name).toContain(color);
        }
      }
    }
  });

  /** Two runs on the same row that touch or overlap should have been one
   * run. Not a correctness bug, just waste; worth catching while the data
   * is still generated rather than hand-edited. */
  it("keeps runs on a row non-overlapping and non-adjacent", () => {
    for (const { name, frames } of EXPRESSIONS) {
      for (const [fi, frame] of frames.entries()) {
        const byRowAndColor = new Map<string, Run[]>();
        for (const run of frame) {
          const key = `${run[1]}:${run[3]}`;
          const list = byRowAndColor.get(key) ?? [];
          list.push(run);
          byRowAndColor.set(key, list);
        }
        for (const runs of byRowAndColor.values()) {
          const sorted = [...runs].sort((a, b) => a[0] - b[0]);
          for (let i = 1; i < sorted.length; i++) {
            const prevEnd = sorted[i - 1][0] + sorted[i - 1][2];
            expect(sorted[i][0], `${name}[${fi}]`).toBeGreaterThan(prevEnd);
          }
        }
      }
    }
  });
});

describe("frame/timing shape", () => {
  it("gives every frame exactly one duration", () => {
    for (const { name, frames, ms } of EXPRESSIONS) {
      expect(ms.length, name).toBe(frames.length);
    }
  });

  it("keeps every duration a positive, finite number of milliseconds", () => {
    for (const { name, ms } of EXPRESSIONS) {
      for (const d of ms) {
        expect(d, name).toBeGreaterThan(0);
        expect(Number.isFinite(d), name).toBe(true);
      }
    }
  });

  it("has at least the minimum frame count the brief calls for", () => {
    expect(IDLE_FRAMES.length).toBeGreaterThanOrEqual(2);
    expect(BLINK_FRAMES.length).toBeGreaterThanOrEqual(5);
    expect(BLINK_FRAMES.length).toBeLessThanOrEqual(7);
    expect(ALERT_FRAMES.length).toBeGreaterThanOrEqual(3);
    expect(ALERT_FRAMES.length).toBeLessThanOrEqual(4);
    expect(THINKING_FRAMES.length).toBeGreaterThanOrEqual(6);
    expect(THINKING_FRAMES.length).toBeLessThanOrEqual(8);
    expect(SATISFIED_FRAMES.length).toBeGreaterThanOrEqual(4);
    expect(SATISFIED_FRAMES.length).toBeLessThanOrEqual(5);
  });

  it("holds the blink shut for longer than any other frame in its set", () => {
    /* The closed frame is the one that has to read clearly even though it
       is the shortest-lived shape in the sequence; it is not allowed to be
       the frame given the least time on screen. */
    const closedIndex = Math.floor(BLINK_FRAMES.length / 2);
    const closedMs = BLINK_FRAME_MS[closedIndex];
    for (const [i, ms] of BLINK_FRAME_MS.entries()) {
      if (i === closedIndex) continue;
      expect(ms).toBeLessThanOrEqual(closedMs);
    }
  });
});

describe("idle-compatibility", () => {
  it("defines idle frame 0 as the rest pose all transitions key off of", () => {
    expect(REST.length).toBeGreaterThan(0);
  });

  it("starts every expression on a frame identical to idle's rest pose", () => {
    for (const { name, frames } of EXPRESSIONS) {
      expect(sortedRuns(frames[0]), name).toEqual(sortedRuns(REST));
    }
  });

  it("ends every complete cycle back on the rest pose", () => {
    for (const name of COMPLETE_CYCLES) {
      const entry = EXPRESSIONS.find((e) => e.name === name)!;
      const last = entry.frames[entry.frames.length - 1];
      expect(sortedRuns(last), name).toEqual(sortedRuns(REST));
    }
  });

  /**
   * "In" sequences are the one deliberate exception: they hold their last
   * frame while the state stays true, so it must NOT equal rest (there
   * would be nothing to hold), but it also has to actually differ frame to
   * frame or the "widen" / "curve" would not read as motion at all.
   */
  it("keeps in-sequences moving away from rest and never collapsing to a repeat", () => {
    for (const name of IN_SEQUENCES) {
      const entry = EXPRESSIONS.find((e) => e.name === name)!;
      const last = entry.frames[entry.frames.length - 1];
      expect(sortedRuns(last), name).not.toEqual(sortedRuns(REST));

      const seen = new Set(entry.frames.map((f) => JSON.stringify(sortedRuns(f))));
      expect(seen.size, name).toBe(entry.frames.length);
    }
  });

  it("gives idle exactly two frames that ping-pong rather than a self-contained cycle", () => {
    /* Idle is a rest/breathe oscillator: the player bounces between index 0
       and index 1 forever. Frame 1 must therefore be a genuinely different
       pose, or the "breathing" loop would be a no-op. */
    expect(IDLE_FRAMES.length).toBe(2);
    expect(sortedRuns(IDLE_FRAMES[1])).not.toEqual(sortedRuns(REST));
  });

  it("loops thinking back to a rest-equivalent frame without a jump cut", () => {
    /* THINKING_FRAMES is a loop: the player repeats it from index 0. The
       last frame has to equal frame 0 (both rest) or the repeat would pop. */
    const last = THINKING_FRAMES[THINKING_FRAMES.length - 1];
    expect(sortedRuns(last)).toEqual(sortedRuns(THINKING_FRAMES[0]));
  });
});

function sortedRuns(frame: Frame): Run[] {
  return [...frame].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}
