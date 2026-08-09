import React, { useEffect, useRef, useState } from "react";
import { SITE_NAME } from "../ui/brand";
import { TIMING, blinkGap } from "./face";
import {
  ALERT_FRAME_MS,
  ALERT_FRAMES,
  BLINK_FRAME_MS,
  BLINK_FRAMES,
  CANVAS_H,
  CANVAS_W,
  IDLE_FRAMES,
  SATISFIED_FRAME_MS,
  SATISFIED_FRAMES,
  THINKING_FRAME_MS,
  THINKING_FRAMES,
} from "./frames";
import type { Frame } from "./frames";

/**
 * Plays the drawn pixel frames from `frames.ts` as an inline SVG, on the
 * same state machine `LandingPage.tsx`'s old glyph-swap `Mark` used to run.
 *
 * ARCHITECTURE
 * ------------
 * Two independent layers, on purpose:
 *
 *   1. WHICH FRAME. A discrete state machine, scheduled with chained
 *      `setTimeout`s exactly like the old blink scheduler was, that decides
 *      which drawn `Frame` from `frames.ts` is on screen right now and
 *      writes it to React state (`displayFrame`), which is what actually
 *      re-renders the `<rect>` list.
 *   2. HOW BIG. A single `requestAnimationFrame` loop that computes a small
 *      continuous breathing scale from elapsed time and writes it straight
 *      to the wrapper `<div>`'s `style.transform`, bypassing React state
 *      entirely so a 60fps tween never forces a re-render. It runs the
 *      whole time the mark is mounted, independent of which discrete frame
 *      layer 1 is currently showing.
 *
 * PRIORITY
 * --------
 * Ported from `face.ts`'s `resolveEye`: satisfied beats thinking beats
 * alert, and idle is the fallback. Blink is not part of that resolution: it
 * is a transient interrupt fired by its own scheduler (suppressed outright
 * while thinking or satisfied are active), never a standing input to
 * re-derive a mode from. `resolveMode` below is the pure, testable half of
 * that ordering; everything after it is timers deciding when to call it.
 *
 * WHY TIMEOUTS AND NOT ELAPSED-TIME POLLING
 * ------------------------------------------
 * Each sequence player below shows a frame, waits that frame's duration,
 * then advances, the same shape as the blink and satisfied timers the old
 * `Mark` component already used. An elapsed-time accumulator driven by the
 * transform's rAF loop was the other option and was not taken: it would
 * couple two things this file deliberately keeps apart, and chained
 * timeouts are what the rest of this state machine already looks like.
 *
 * ENTER/EXIT SIMPLIFICATION
 * --------------------------
 * When a higher-priority mode preempts a lower one that is still "live"
 * (its own input never went false, e.g. thinking starting while alert is
 * held), the lower one is cut immediately with no reverse play; only an
 * input's OWN falling edge (alert losing focus, satisfied's hold expiring)
 * plays that expression's frames back out to rest first. When something
 * finishes and hands control back, the next mode is re-derived from live
 * props rather than resumed mid-animation. This is a deliberate
 * simplification the brief for this component sanctioned explicitly.
 */

/* ------------------------------------------------------------------------ *
 * Reduced motion (moved from LandingPage.tsx's old `Mark` component)
 * ------------------------------------------------------------------------ */

const useReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return reduced;
};

/* ------------------------------------------------------------------------ *
 * Pure logic: priority, exit condition, and the eased transform math.
 * Exported for the tests in __tests__/FramePlayer.test.ts.
 * ------------------------------------------------------------------------ */

export type Mode = "idle" | "thinking" | "alert" | "satisfied";

export interface ModeInputs {
  satisfied: boolean;
  thinking: boolean;
  alert: boolean;
}

/**
 * Which mode should own the display, given everything at once. The order
 * is the priority: a landed result outranks a query in flight because it
 * is the end of that query, and a query in flight outranks a focused,
 * otherwise idle field. See `face.ts`'s `resolveEye` for the glyph-era
 * version of the same ordering.
 */
export const resolveMode = ({ satisfied, thinking, alert }: ModeInputs): Mode => {
  if (satisfied) return "satisfied";
  if (thinking) return "thinking";
  if (alert) return "alert";
  return "idle";
};

/**
 * Whether a thinking loop, having just landed on a rest-equivalent frame
 * (index 0 or the last index; both are the rest pose, per `frames.ts`),
 * should stop there rather than looping again, given whether the caller
 * still wants to keep thinking. The loop is allowed to land on a
 * non-rest-equivalent index while `thinking` is already false: it keeps
 * going until it reaches 0 or the last index before it is allowed to exit,
 * which is what guarantees the exit is never mid-shift.
 */
export const shouldExitThinking = (index: number, frameCount: number, thinking: boolean): boolean =>
  !thinking && (index === 0 || index === frameCount - 1);

/** Half the breath's cycle is a rest-to-peak; the full period is both halves. */
export const BREATH_PERIOD_MS = 2 * TIMING.breathHalf;
/** Peak breathing scale is `1 + BREATH_AMPLITUDE`, comfortably under 1.03. */
export const BREATH_AMPLITUDE = 0.015;
/** Peak satisfied bounce, added on top of the breath while satisfied holds. */
export const SATISFIED_BUMP_AMPLITUDE = 0.012;
/** The bounce rides the same window `TIMING.satisfiedHold` already sets. */
export const SATISFIED_BUMP_DURATION_MS = TIMING.satisfiedHold;

/**
 * The continuous breathing scale at `elapsedMs` since the transform loop
 * started, always in `[1 - BREATH_AMPLITUDE, 1 + BREATH_AMPLITUDE]`. Runs
 * the whole time the mark is mounted, independent of which drawn frame is
 * currently showing.
 */
export const breathScale = (elapsedMs: number): number =>
  1 + BREATH_AMPLITUDE * Math.sin((2 * Math.PI * elapsedMs) / BREATH_PERIOD_MS);

/**
 * The extra "satisfied bounce", eased in and back out across the hold
 * window: 0 at the start, its peak at the midpoint, 0 again by the end,
 * and clamped flat outside `[0, SATISFIED_BUMP_DURATION_MS]` so a stale
 * caller can't push it negative or past its amplitude.
 */
export const satisfiedBumpScale = (elapsedSinceStartMs: number): number => {
  const t = Math.min(1, Math.max(0, elapsedSinceStartMs / SATISFIED_BUMP_DURATION_MS));
  return SATISFIED_BUMP_AMPLITUDE * Math.sin(t * Math.PI);
};

/* ------------------------------------------------------------------------ *
 * Sequence players: each shows a frame, waits its duration, advances.
 * Every one returns a `Stop` that cancels it; callers always call the
 * previous `Stop` before starting a new sequence, so at most one is ever
 * live and a stale completion callback can never fire after being cut.
 * ------------------------------------------------------------------------ */

type Stop = () => void;
type FrameSetter = (frame: Frame) => void;

/** Plays every frame of a complete cycle forward once, then calls `onDone`. */
const playCycle = (frames: Frame[], ms: number[], setFrame: FrameSetter, onDone: () => void): Stop => {
  let cancelled = false;
  let handle = 0;
  const step = (i: number) => {
    if (cancelled) return;
    setFrame(frames[i]);
    if (i >= frames.length - 1) {
      onDone();
      return;
    }
    handle = window.setTimeout(() => step(i + 1), ms[i]);
  };
  step(0);
  return () => {
    cancelled = true;
    window.clearTimeout(handle);
  };
};

/**
 * Loops `THINKING_FRAMES` forward, wrapping the last index back to 0,
 * until `getThinking()` reports false and the loop has landed on a
 * rest-equivalent frame, then calls `onExit`.
 */
const playThinkingLoop = (
  frames: Frame[],
  ms: number[],
  getThinking: () => boolean,
  setFrame: FrameSetter,
  onExit: () => void
): Stop => {
  let cancelled = false;
  let handle = 0;
  const step = (i: number) => {
    if (cancelled) return;
    setFrame(frames[i]);
    if (shouldExitThinking(i, frames.length, getThinking())) {
      onExit();
      return;
    }
    const next = (i + 1) % frames.length;
    handle = window.setTimeout(() => step(next), ms[i]);
  };
  step(0);
  return () => {
    cancelled = true;
    window.clearTimeout(handle);
  };
};

/**
 * Plays an "in" sequence (`ALERT_FRAMES` or `SATISFIED_FRAMES`) forward to
 * its last frame and holds there, calling `onHold` once it arrives. Only
 * the first `frames.length - 1` durations are used to advance, matching
 * the shape `frames.ts` documents: the final entry exists so every frame
 * has one duration, not because it advances anything.
 */
const playInForward = (frames: Frame[], ms: number[], setFrame: FrameSetter, onHold: () => void): Stop => {
  let cancelled = false;
  let handle = 0;
  const step = (i: number) => {
    if (cancelled) return;
    setFrame(frames[i]);
    if (i >= frames.length - 1) {
      onHold();
      return;
    }
    handle = window.setTimeout(() => step(i + 1), ms[i]);
  };
  step(0);
  return () => {
    cancelled = true;
    window.clearTimeout(handle);
  };
};

/**
 * Plays an "in" sequence back out to frame 0, reading the same duration
 * array back to front, then calls `onDone`.
 */
const playOutReverse = (frames: Frame[], ms: number[], setFrame: FrameSetter, onDone: () => void): Stop => {
  let cancelled = false;
  let handle = 0;
  const step = (i: number) => {
    if (cancelled) return;
    setFrame(frames[i]);
    if (i <= 0) {
      onDone();
      return;
    }
    handle = window.setTimeout(() => step(i - 1), ms[i - 1]);
  };
  step(frames.length - 1);
  return () => {
    cancelled = true;
    window.clearTimeout(handle);
  };
};

/* ------------------------------------------------------------------------ *
 * The engine: what the timers below call into. Built once per mount inside
 * the setup effect and handed to the other effects through a ref, so a
 * prop-driven effect declared later in the component can reach it without
 * every timer closure having to be redeclared when a prop changes.
 * ------------------------------------------------------------------------ */

interface Engine {
  beginThinking: () => void;
  beginAlertIn: () => void;
  beginAlertOut: () => void;
  beginSatisfiedIn: () => void;
  beginSatisfiedOut: () => void;
  /** True while thinking, satisfied, or a blink outrank a fresh alert-in. */
  modeOutranksAlert: () => boolean;
  /** True while alert is actually on screen, so a falling edge has something to reverse. */
  isShowingAlert: () => boolean;
}

/** Internal phases the display can be in. A superset of the public `Mode`:
 * it also tracks the transient "blink" interrupt and the "-out" tail of
 * each in-sequence, neither of which `resolveMode` needs to know about. */
type Phase = Mode | "blink" | "alert-out" | "satisfied-out";

/* ------------------------------------------------------------------------ *
 * The component
 * ------------------------------------------------------------------------ */

interface FramePlayerProps {
  /** The search field has focus. */
  alert: boolean;
  /** A query is in flight. */
  thinking: boolean;
}

export const FramePlayer: React.FC<FramePlayerProps> = ({ alert, thinking }) => {
  const still = useReducedMotion();

  const [displayFrame, setDisplayFrame] = useState<Frame>(IDLE_FRAMES[0]);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  /* Live mirrors of the props, read from inside timer callbacks that must
     never close over a stale value. Assigning during render (rather than
     in an effect) is safe here: it is a plain mutation, not a reactive
     read, and it is guaranteed current before any effect scheduled this
     render runs. */
  const thinkingRef = useRef(thinking);
  const alertRef = useRef(alert);
  thinkingRef.current = thinking;
  alertRef.current = alert;

  const phaseRef = useRef<Phase>("idle");
  const stopRef = useRef<Stop | null>(null);
  const breathOnRef = useRef(false);
  const satisfiedActiveRef = useRef(false);
  const satisfiedStartRef = useRef(0);
  const engineRef = useRef<Engine | null>(null);

  /* ---- the engine: breath, blink scheduling, and the mode transitions -- */
  useEffect(() => {
    if (still) {
      setDisplayFrame(IDLE_FRAMES[0]);
      return;
    }

    const stop = () => {
      stopRef.current?.();
      stopRef.current = null;
    };

    const showIdle = () => {
      stop();
      phaseRef.current = "idle";
      setDisplayFrame(IDLE_FRAMES[breathOnRef.current ? 1 : 0]);
    };

    /* Picks up whatever should be showing once a sequence finishes on its
       own. Satisfied is deliberately not a candidate here: its own falling
       edge always resumes idle directly (see `beginSatisfiedOut`), so by
       the time `settle` can run, satisfied is already false. Checking it
       anyway costs nothing and guards a completion that raced a
       preemption it should have lost. */
    const settle = () => {
      if (satisfiedActiveRef.current) return;
      if (thinkingRef.current) beginThinking();
      else if (alertRef.current) beginAlertIn();
      else showIdle();
    };

    const beginThinking = () => {
      stop();
      phaseRef.current = "thinking";
      stopRef.current = playThinkingLoop(
        THINKING_FRAMES,
        THINKING_FRAME_MS,
        () => thinkingRef.current,
        setDisplayFrame,
        settle
      );
    };

    const beginAlertIn = () => {
      stop();
      phaseRef.current = "alert";
      stopRef.current = playInForward(ALERT_FRAMES, ALERT_FRAME_MS, setDisplayFrame, () => {
        /* Held. Nothing to schedule until alert's falling edge. */
      });
    };

    const beginAlertOut = () => {
      stop();
      phaseRef.current = "alert-out";
      stopRef.current = playOutReverse(ALERT_FRAMES, ALERT_FRAME_MS, setDisplayFrame, showIdle);
    };

    const beginSatisfiedIn = () => {
      stop();
      phaseRef.current = "satisfied";
      stopRef.current = playInForward(SATISFIED_FRAMES, SATISFIED_FRAME_MS, setDisplayFrame, () => {
        /* Held for the remainder of TIMING.satisfiedHold, driven by the
           setTimeout in the satisfied-derivation effect below. */
      });
    };

    const beginSatisfiedOut = () => {
      stop();
      phaseRef.current = "satisfied-out";
      stopRef.current = playOutReverse(SATISFIED_FRAMES, SATISFIED_FRAME_MS, setDisplayFrame, showIdle);
    };

    const fireBlink = () => {
      /* Suppressed rather than fired while thinking or satisfied are
         active: same idea as resolveEye's priority. Those two are already
         busy and a blink cutting into them reads as a dropped frame. */
      if (thinkingRef.current || satisfiedActiveRef.current) return;
      stop();
      phaseRef.current = "blink";
      stopRef.current = playCycle(BLINK_FRAMES, BLINK_FRAME_MS, setDisplayFrame, settle);
    };

    engineRef.current = {
      beginThinking,
      beginAlertIn,
      beginAlertOut,
      beginSatisfiedIn,
      beginSatisfiedOut,
      modeOutranksAlert: () =>
        phaseRef.current === "thinking" || phaseRef.current === "satisfied" || phaseRef.current === "blink",
      isShowingAlert: () => phaseRef.current === "alert",
    };

    /* ---- breath: one interval, one boolean, only visible while idle ---- */
    const breathId = window.setInterval(() => {
      breathOnRef.current = !breathOnRef.current;
      if (phaseRef.current === "idle") {
        setDisplayFrame(IDLE_FRAMES[breathOnRef.current ? 1 : 0]);
      }
    }, TIMING.breathHalf);

    /* ---- blink: recursive setTimeout, gap redrawn every time, exactly
       the schedule the old `Mark` component used ------------------------ */
    let blinkTimer = 0;
    const scheduleBlink = () => {
      blinkTimer = window.setTimeout(() => {
        fireBlink();
        scheduleBlink();
      }, blinkGap(Math.random()));
    };
    scheduleBlink();

    return () => {
      window.clearInterval(breathId);
      window.clearTimeout(blinkTimer);
      stop();
      engineRef.current = null;
    };
  }, [still]);

  /* ---- thinking: enter on the rising edge; the loop itself decides when
     it is allowed to exit, so there is no falling-edge handler here ----- */
  useEffect(() => {
    if (still || !thinking) return;
    engineRef.current?.beginThinking();
  }, [thinking, still]);

  /* ---- alert: enter on the rising edge unless something outranks it;
     leave on the falling edge only if it was actually on screen -------- */
  useEffect(() => {
    if (still) return;
    const engine = engineRef.current;
    if (!engine) return;
    if (alert) {
      if (!engine.modeOutranksAlert()) engine.beginAlertIn();
    } else if (engine.isShowingAlert()) {
      engine.beginAlertOut();
    }
  }, [alert, still]);

  /*
   * ---- satisfied -------------------------------------------------------
   * Ported unchanged from the old `Mark` component: the falling edge of
   * `thinking`, held true for `TIMING.satisfiedHold`. What differs is what
   * happens at each edge: entering plays `SATISFIED_FRAMES` forward and
   * leaving plays it back out, instead of toggling a boolean straight to
   * a glyph.
   */
  const wasThinkingRef = useRef(false);
  useEffect(() => {
    const settled = wasThinkingRef.current && !thinking;
    wasThinkingRef.current = thinking;
    if (still || !settled) return;

    satisfiedActiveRef.current = true;
    satisfiedStartRef.current = performance.now();
    engineRef.current?.beginSatisfiedIn();

    const id = window.setTimeout(() => {
      satisfiedActiveRef.current = false;
      engineRef.current?.beginSatisfiedOut();
    }, TIMING.satisfiedHold);
    return () => window.clearTimeout(id);
  }, [thinking, still]);

  /*
   * ---- the eased transform layer ----------------------------------------
   * A single rAF loop, always running except under reduced motion,
   * independent of which drawn frame is currently showing. Writes
   * straight to the DOM rather than through React state so a 60fps tween
   * never triggers a re-render; the discrete frame layer above is the only
   * thing that does that, and only when the frame actually changes.
   */
  useEffect(() => {
    if (still) {
      if (wrapperRef.current) wrapperRef.current.style.transform = "";
      return;
    }

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const bump = satisfiedActiveRef.current ? satisfiedBumpScale(now - satisfiedStartRef.current) : 0;
      const scale = breathScale(now - start) + bump;
      if (wrapperRef.current) wrapperRef.current.style.transform = `scale(${scale})`;
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [still]);

  return (
    <h1
      /*
       * The site's name is announced, never an expression name: a screen
       * reader must not say anything different depending on what the mark
       * happens to be drawn as when it reaches this element.
       */
      aria-label={SITE_NAME}
      className="ws-mark select-none pb-2"
    >
      <div ref={wrapperRef} aria-hidden="true" style={{ display: "inline-block", transformOrigin: "50% 78%" }}>
        <svg
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          shapeRendering="crispEdges"
          aria-hidden="true"
          className="w-[76px] sm:w-[104px] md:w-[136px] aspect-[35/12]"
        >
          {displayFrame.map(([x, y, w, color]) => (
            <rect key={`${x}-${y}-${w}-${color}`} x={x} y={y} width={w} height={1} fill={color} />
          ))}
        </svg>
      </div>
    </h1>
  );
};

export default FramePlayer;
