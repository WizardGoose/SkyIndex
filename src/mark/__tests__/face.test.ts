import { describe, expect, it } from "vitest";
import {
  EYE_GLYPHS,
  EYE_WIDTH_EM,
  GLYPH_METRICS,
  MOUTH,
  NUDGE_EM,
  REST,
  TIMING,
  blinkGap,
  faceString,
  nudgeEm,
  resolveEye,
} from "../face";
import type { FaceState } from "../face";

/** Everything off. Each test turns on only what it is about. */
const REST_STATE: FaceState = {
  still: false,
  satisfied: false,
  thinking: false,
  scan: 1,
  blink: false,
  alert: false,
  sleeping: false,
  glance: 0,
  petted: false,
  yawning: false,
};

const at = (over: Partial<FaceState>): FaceState => ({ ...REST_STATE, ...over });

describe("the state machine", () => {
  it("rests on the house glyph", () => {
    expect(resolveEye(REST_STATE)).toBe("W");
    expect(faceString(REST_STATE)).toBe("W.W");
  });

  it("maps each state to its kaomoji", () => {
    /* `w.w`, not `u.u`: the glyph is still named `u` internally because a blink
       and a nap are different states, but they are the same drawing now, so the
       readout has to say what a person sees. */
    expect(faceString(at({ blink: true }))).toBe("w.w");
    /* Focus is `W.W` by default now: the mark is `w.w` until you engage with
       the page, so WAKING is the reaction and `O.O` would be a second one
       stacked on it. The old startle is still available behind the option, and
       is asserted for below. */
    expect(faceString(at({ alert: true }))).toBe("W.W");
    expect(faceString(at({ alert: true }), { wideEyedFocus: true })).toBe("O.O");
    expect(faceString(at({ thinking: true, scan: 1 }))).toBe(">.>");
    expect(faceString(at({ thinking: true, scan: -1 }))).toBe("<.<");
    expect(faceString(at({ satisfied: true }))).toBe("^.^");
  });

  it("never changes the mouth", () => {
    const every = [
      REST_STATE,
      at({ blink: true }),
      at({ alert: true }),
      at({ thinking: true, scan: 1 }),
      at({ thinking: true, scan: -1 }),
      at({ satisfied: true }),
      at({ still: true }),
    ];
    for (const s of every) {
      const face = faceString(s);
      expect(face).toHaveLength(3);
      expect(face[1]).toBe(MOUTH);
      /* Both eyes are always the same glyph. A face with odd eyes is a
         different design and not this one. */
      expect(face[0]).toBe(face[2]);
    }
  });

  it("lets a blink interrupt focus, and puts focus back afterwards", () => {
    /* Asserted against the wide-eyed option, because that is the setting where
       focus and rest are different glyphs and the claim has something to say.
       On the default setting focus IS `W`, so a blink returning to `W` would
       pass this test without proving anything about ordering. */
    const wide = { wideEyedFocus: true };
    expect(resolveEye(at({ alert: true, blink: true }), wide)).toBe("u");
    expect(resolveEye(at({ alert: true, blink: false }), wide)).toBe("O");
  });

  it("suppresses a blink while a query is in flight or has just landed", () => {
    expect(resolveEye(at({ thinking: true, blink: true, scan: 1 }))).toBe(">");
    expect(resolveEye(at({ satisfied: true, blink: true }))).toBe("^");
  });

  it("ranks a landed result above the query that produced it", () => {
    expect(resolveEye(at({ satisfied: true, thinking: true, alert: true, blink: true }))).toBe("^");
  });

  it("goes completely static under reduced motion, whatever else is true", () => {
    const loud = { satisfied: true, thinking: true, scan: -1, blink: true, alert: true };
    expect(faceString(at({ ...loud, still: true }))).toBe("W.W");
    /* Proving the guard rather than the ordering: without it, that same state
       resolves to something else entirely. */
    expect(faceString(at(loud))).not.toBe("W.W");
  });

  it("treats a scan of zero as one side rather than as a third state", () => {
    expect(resolveEye(at({ thinking: true, scan: 0 }))).toBe(">");
  });

  it("only ever emits glyphs the metrics table knows about", () => {
    /* Exhaustive over every flag AND both option settings. The metrics table is
       what reserves the eye's width, so a glyph the table has never heard of is
       a glyph with no advance and no nudge: it would render at the wrong height
       and shove the mouth sideways. This is the test that has to grow every
       time a state is added, which is why it is written as a sweep rather than
       as a list of cases. */
    for (const still of [false, true]) {
      for (const satisfied of [false, true]) {
        for (const thinking of [false, true]) {
          for (const scan of [-1, 0, 1]) {
            for (const blink of [false, true]) {
              for (const alert of [false, true]) {
                for (const sleeping of [false, true]) {
                  for (const petted of [false, true]) {
                    for (const wideEyedFocus of [false, true]) {
                      for (const yawning of [false, true]) {
                        for (const glance of [-1, 0, 1]) {
                        const g = resolveEye(
                          { still, satisfied, thinking, scan, blink, alert, sleeping, petted, yawning, glance },
                          { wideEyedFocus }
                        );
                        expect(EYE_GLYPHS).toContain(g);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
});

describe("the added states", () => {
  it("sleeps in lowercase, and only when nothing else is happening", () => {
    expect(faceString(at({ sleeping: true }))).toBe("w.w");

    /* Every one of these outranks sleep. The point of the assertion is not that
       the priority order is what it is, but that a flag can never be BOTH
       asleep and doing something: the mark nods off because nothing is going
       on, so anything going on has to win. */
    expect(resolveEye(at({ sleeping: true, alert: true }))).toBe("W");
    expect(resolveEye(at({ sleeping: true, blink: true }))).toBe("u");
    expect(resolveEye(at({ sleeping: true, thinking: true }))).toBe(">");
    expect(resolveEye(at({ sleeping: true, satisfied: true }))).toBe("^");
    expect(resolveEye(at({ sleeping: true, petted: true }))).toBe("W");
  });

  it("opens the mouth when petted, and leaves the eyes alone", () => {
    expect(faceString(at({ petted: true }))).toBe("WoW");
    /* The eyes are the thing that must NOT change: `WoW` is the wordmark being
       delighted, not a fourth face. */
    expect(resolveEye(at({ petted: true }))).toBe("W");
  });

  it("keeps the mouth shut in every state that is not petting", () => {
    for (const over of [{}, { sleeping: true }, { alert: true }, { blink: true }, { thinking: true }, { satisfied: true }]) {
      expect(faceString(at(over))).not.toContain("o");
    }
  });

  it("stays still under reduced motion, including the two new states", () => {
    /* `still` short-circuits everything, and that has to include the states
       added here or reduced motion would still get a zzz and a blush. */
    expect(faceString(at({ still: true, sleeping: true }))).toBe("W.W");
    expect(faceString(at({ still: true, petted: true }))).toBe("W.W");
  });
});

describe("width reservation", () => {
  it("reserves at least the widest glyph in the set", () => {
    const widest = Math.max(...EYE_GLYPHS.map((g) => GLYPH_METRICS[g].advance));
    expect(widest).toBe(GLYPH_METRICS[REST].advance);
    expect(EYE_WIDTH_EM).toBeGreaterThanOrEqual(widest);
  });

  it("fits every glyph, so no state can shift the mouth", () => {
    for (const g of EYE_GLYPHS) {
      expect(GLYPH_METRICS[g].advance, g).toBeLessThanOrEqual(EYE_WIDTH_EM);
    }
  });

  it("does not reserve slack nobody uses", () => {
    const widest = Math.max(...EYE_GLYPHS.map((g) => GLYPH_METRICS[g].advance));
    /* Rounded up from the widest advance, not padded. A hundredth of an em is
       1.4px at the largest type size, which is the rounding and nothing more. */
    expect(EYE_WIDTH_EM - widest).toBeLessThan(0.01);
  });

  /**
   * The reservation is what pins the mouth, and this is the test that says it
   * is needed rather than merely present. Laid out on raw advances the mouth's
   * left edge would be wherever the current eye glyph happened to end.
   */
  it("pins the mouth where raw advances would not", () => {
    const mouthOffsetWithBox = EYE_GLYPHS.map(() => EYE_WIDTH_EM);
    expect(new Set(mouthOffsetWithBox).size).toBe(1);

    const mouthOffsetRaw = EYE_GLYPHS.map((g) => GLYPH_METRICS[g].advance);
    expect(new Set(mouthOffsetRaw).size).toBeGreaterThan(1);

    /* How far the mouth would travel between the widest and narrowest eye.
       0.4em is 54px at the largest type size, which is not a wobble. */
    const swing = Math.max(...mouthOffsetRaw) - Math.min(...mouthOffsetRaw);
    expect(swing).toBeGreaterThan(0.35);
  });
});

describe("the vertical nudge", () => {
  /**
   * The sign convention, pinned. `centre` is measured UP from the baseline and
   * `translateY` is positive DOWN, so a glyph sitting below the resting glyph
   * has to move up, which is a negative value. Getting this backwards is not
   * hypothetical: the first implementation did, and it pushed the already-low
   * `u` further down.
   */
  it("moves a low glyph up and a high glyph down", () => {
    expect(GLYPH_METRICS.u.centre).toBeLessThan(GLYPH_METRICS.W.centre);
    expect(NUDGE_EM.u).toBeLessThan(0);

    expect(GLYPH_METRICS["^"].centre).toBeGreaterThan(GLYPH_METRICS.W.centre);
    expect(NUDGE_EM["^"]).toBeGreaterThan(0);

    expect(GLYPH_METRICS[">"].centre).toBeLessThan(GLYPH_METRICS.W.centre);
    expect(NUDGE_EM[">"]).toBeLessThan(0);
  });

  it("lands every glyph on the resting glyph's optical centre", () => {
    for (const g of EYE_GLYPHS) {
      /* Applying translateY of `n` moves ink down by `n`, so its height above
         the baseline becomes centre - n. */
      const after = GLYPH_METRICS[g].centre - NUDGE_EM[g];
      expect(after, g).toBeCloseTo(GLYPH_METRICS[REST].centre, 6);
    }
  });

  it("leaves the resting glyph alone", () => {
    expect(NUDGE_EM[REST]).toBe(0);
    expect(nudgeEm(REST)).toBe(0);
  });

  it("keeps every correction small enough to stay inside the line box", () => {
    /* The line box is 0.9em. A correction bigger than a quarter of that would
       be pushing ink out of the mark's own layout box. */
    for (const g of EYE_GLYPHS) expect(Math.abs(NUDGE_EM[g]), g).toBeLessThan(0.225);
  });

  it("defines a nudge for every glyph the machine can emit", () => {
    for (const g of EYE_GLYPHS) expect(typeof NUDGE_EM[g]).toBe("number");
    expect(Object.keys(NUDGE_EM).sort()).toEqual([...EYE_GLYPHS].sort());
  });
});

describe("timings", () => {
  it("keeps the blink gap irregular and in range", () => {
    expect(blinkGap(0)).toBe(TIMING.blinkGapMin);
    expect(blinkGap(1)).toBe(TIMING.blinkGapMax);
    for (const r of [0, 0.25, 0.5, 0.75, 0.999]) {
      const g = blinkGap(r);
      expect(g).toBeGreaterThanOrEqual(TIMING.blinkGapMin);
      expect(g).toBeLessThanOrEqual(TIMING.blinkGapMax);
    }
    expect(blinkGap(0.2)).not.toBe(blinkGap(0.8));
  });

  it("holds the blink long enough to read and short enough to be a blink", () => {
    expect(TIMING.blinkHold).toBeGreaterThanOrEqual(80);
    expect(TIMING.blinkHold).toBeLessThanOrEqual(200);
    /* The gap has to dwarf the hold or the mark reads as flickering. */
    expect(TIMING.blinkGapMin).toBeGreaterThan(TIMING.blinkHold * 20);
  });

  it("flips the scan slower than a blink and faster than a breath", () => {
    expect(TIMING.scanFlip).toBeGreaterThan(TIMING.blinkHold);
    expect(TIMING.scanFlip).toBeLessThan(TIMING.breathHalf);
  });

  it("holds the satisfied face for a beat, not a pose", () => {
    expect(TIMING.satisfiedHold).toBeGreaterThanOrEqual(300);
    expect(TIMING.satisfiedHold).toBeLessThanOrEqual(800);
  });

  it("breathes slowly enough not to read as an animation", () => {
    expect(TIMING.breathHalf).toBeGreaterThanOrEqual(3000);
  });
});
