import { describe, expect, it } from "vitest";
import {
  BREATH_AMPLITUDE,
  BREATH_PERIOD_MS,
  SATISFIED_BUMP_AMPLITUDE,
  SATISFIED_BUMP_DURATION_MS,
  breathScale,
  resolveMode,
  satisfiedBumpScale,
  shouldExitThinking,
} from "../FramePlayer";
import type { ModeInputs } from "../FramePlayer";

/** Everything off. Each test turns on only what it is about, same pattern
 * as face.test.ts's REST_STATE. */
const NONE: ModeInputs = { satisfied: false, thinking: false, alert: false };
const at = (over: Partial<ModeInputs>): ModeInputs => ({ ...NONE, ...over });

describe("resolveMode", () => {
  it("rests when nothing is going on", () => {
    expect(resolveMode(NONE)).toBe("idle");
  });

  it("maps each single input to its mode", () => {
    expect(resolveMode(at({ alert: true }))).toBe("alert");
    expect(resolveMode(at({ thinking: true }))).toBe("thinking");
    expect(resolveMode(at({ satisfied: true }))).toBe("satisfied");
  });

  it("ranks thinking above a focused field", () => {
    expect(resolveMode(at({ thinking: true, alert: true }))).toBe("thinking");
  });

  it("ranks a landed result above the query that produced it, and above focus", () => {
    expect(resolveMode(at({ satisfied: true, thinking: true, alert: true }))).toBe("satisfied");
  });

  /* Blink is deliberately not an input here: it is a transient interrupt
     fired by its own scheduler, never a standing state to re-derive a mode
     from. See the doc comment on `resolveMode` in FramePlayer.tsx. */
  it("has no blink input at all", () => {
    expect(Object.keys(NONE)).not.toContain("blink");
  });
});

describe("shouldExitThinking", () => {
  const LENGTH = 8;

  it("never exits while still thinking, whatever index it lands on", () => {
    for (let i = 0; i < LENGTH; i++) {
      expect(shouldExitThinking(i, LENGTH, true)).toBe(false);
    }
  });

  it("exits once thinking stops, but only on a rest-equivalent index", () => {
    expect(shouldExitThinking(0, LENGTH, false)).toBe(true);
    expect(shouldExitThinking(LENGTH - 1, LENGTH, false)).toBe(true);
  });

  it("keeps looping through the middle of a pass even after thinking stops", () => {
    for (let i = 1; i < LENGTH - 1; i++) {
      expect(shouldExitThinking(i, LENGTH, false)).toBe(false);
    }
  });
});

describe("breathScale", () => {
  it("starts a cycle at rest, exactly 1", () => {
    expect(breathScale(0)).toBe(1);
    expect(breathScale(BREATH_PERIOD_MS)).toBeCloseTo(1, 6);
  });

  it("never exceeds the amplitude in either direction", () => {
    for (let t = 0; t <= BREATH_PERIOD_MS; t += BREATH_PERIOD_MS / 40) {
      const s = breathScale(t);
      expect(s).toBeGreaterThanOrEqual(1 - BREATH_AMPLITUDE - 1e-9);
      expect(s).toBeLessThanOrEqual(1 + BREATH_AMPLITUDE + 1e-9);
    }
  });

  it("repeats every BREATH_PERIOD_MS", () => {
    expect(breathScale(500)).toBeCloseTo(breathScale(500 + BREATH_PERIOD_MS), 6);
  });
});

describe("satisfiedBumpScale", () => {
  it("is zero at the start and end of the hold window", () => {
    expect(satisfiedBumpScale(0)).toBe(0);
    expect(satisfiedBumpScale(SATISFIED_BUMP_DURATION_MS)).toBeCloseTo(0, 6);
  });

  it("peaks at the midpoint of the window", () => {
    const mid = satisfiedBumpScale(SATISFIED_BUMP_DURATION_MS / 2);
    expect(mid).toBeCloseTo(SATISFIED_BUMP_AMPLITUDE, 6);
  });

  it("clamps flat outside the window instead of going negative or past its peak", () => {
    expect(satisfiedBumpScale(-100)).toBe(0);
    expect(satisfiedBumpScale(SATISFIED_BUMP_DURATION_MS + 500)).toBeCloseTo(0, 6);
  });

  /* The brief's hard constraint: breathing plus the satisfied bounce must
     never push the mark past 1.03 scale, even at both peaks at once. */
  it("keeps the combined peak with breathing at or under 1.03", () => {
    expect(1 + BREATH_AMPLITUDE + SATISFIED_BUMP_AMPLITUDE).toBeLessThanOrEqual(1.03);
  });
});
