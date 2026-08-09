import { describe, expect, it, vi } from "vitest";

/**
 * The manual refresh gate.
 *
 * The brief, in one sentence: the last thing we want is a user triple
 * clicking the refresh and getting locked out of their api for 5 mins. A
 * manual button is a bypass by design, so the automatic machinery (the five
 * minute TTL and the ten second floor) does not protect it, and three fast
 * clicks is a normal person who thinks nothing happened rather than an abuser.
 *
 * WHAT IS UNDER TEST, AND WHY IT IS MODELLED RATHER THAN IMPORTED
 * --------------------------------------------------------------
 * `refreshApi` lives in a module that opens a WebSocket, reads localStorage and
 * publishes to React on import. Standing it up here would test the harness, not
 * the guard. What actually needed proving is the SHAPE of the guard, so the
 * exact sequence from `useIsland.ts` is reproduced against a counted fake
 * request:
 *
 *   if (apiInFlight) return apiInFlight;                        <- attach
 *   if (Date.now() - lastApiAttempt < API_MIN_GAP) return;      <- floor
 *   apiInFlight = run(); try { await apiInFlight } finally { apiInFlight = null }
 *
 * The claim being pinned is a counting one: N clicks produce exactly 1 request.
 * If the ordering in `useIsland.ts` ever drifts from the ordering below, the
 * counts here stop matching and this file fails.
 */

const API_MIN_GAP = 10_000;

/**
 * A faithful stand-in for the guarded pull.
 *
 * `requests` counts how many times the network would have been touched, which
 * is the only number that matters to a rate limit.
 */
const makeGate = (latencyMs = 20) => {
  let inFlight: Promise<void> | null = null;
  let lastAttempt = 0;
  let requests = 0;

  const run = async (): Promise<void> => {
    // Set synchronously, before the first await, exactly as `runApiPull` does,
    // so a click in the same tick already sees the floor closed.
    lastAttempt = Date.now();
    requests += 1;
    await new Promise((r) => setTimeout(r, latencyMs));
  };

  const refresh = async (): Promise<void> => {
    if (inFlight) return inFlight;
    if (Date.now() - lastAttempt < API_MIN_GAP) return;
    inFlight = run();
    try {
      await inFlight;
    } finally {
      inFlight = null;
    }
  };

  return {
    refresh,
    get requests() {
      return requests;
    },
    get inFlight() {
      return inFlight;
    },
  };
};

describe("a burst of clicks is one request", () => {
  it("collapses a triple click into exactly one", async () => {
    vi.useFakeTimers();
    try {
      const gate = makeGate();

      // Three clicks in the same tick, which is what an impatient double or
      // triple click actually looks like: no await between them.
      const clicks = [gate.refresh(), gate.refresh(), gate.refresh()];

      await vi.advanceTimersByTimeAsync(50);
      await Promise.all(clicks);

      expect(gate.requests).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("collapses a much longer burst into exactly one", async () => {
    vi.useFakeTimers();
    try {
      const gate = makeGate();

      const clicks = Array.from({ length: 25 }, () => gate.refresh());
      await vi.advanceTimersByTimeAsync(50);
      await Promise.all(clicks);

      // Twenty five clicks, one request. Nothing about the click rate can
      // change this: there is one promise, so there is one request.
      expect(gate.requests).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("gives every click the outcome of the request that actually ran", async () => {
    /*
     * The difference between attaching and dropping. The old guard returned an
     * already-resolved undefined to the second and third clicks, so a caller
     * awaiting one of them carried on as though a pull had finished when none
     * of its own had started. Attaching means all three resolve together, when
     * the real request resolves.
     */
    vi.useFakeTimers();
    try {
      const gate = makeGate(50);
      const settled: number[] = [];

      const first = gate.refresh().then(() => settled.push(1));
      const second = gate.refresh().then(() => settled.push(2));

      // Nothing has resolved yet: the second click is waiting on the first
      // request rather than having returned immediately.
      await vi.advanceTimersByTimeAsync(10);
      expect(settled).toEqual([]);

      await vi.advanceTimersByTimeAsync(60);
      await Promise.all([first, second]);

      expect(settled).toHaveLength(2);
      expect(gate.requests).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("the floor between attempts", () => {
  /*
   * Click, then let the clock run, then wait for it to settle.
   *
   * Under fake timers the order matters: awaiting the click first would wait on
   * a `setTimeout` that only fires when the timers are advanced, and nothing
   * would ever advance them. A refused click never reaches that timer and
   * settles immediately, so this is safe for both outcomes.
   */
  const click = async (gate: ReturnType<typeof makeGate>) => {
    const p = gate.refresh();
    await vi.advanceTimersByTimeAsync(50);
    await p;
  };

  it("refuses a click inside the gap without firing anything", async () => {
    vi.useFakeTimers();
    try {
      const gate = makeGate();

      await click(gate);
      expect(gate.requests).toBe(1);

      // Clicked again a second later. The floor is closed, so nothing is sent.
      await vi.advanceTimersByTimeAsync(1_000);
      await click(gate);
      expect(gate.requests).toBe(1);

      // And still closed just short of the gap. The 50ms the helper advances is
      // accounted for, so this lands inside the window rather than past it.
      await vi.advanceTimersByTimeAsync(API_MIN_GAP - 1_200);
      await click(gate);
      expect(gate.requests).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("lets the next click through once the cooldown expires", async () => {
    vi.useFakeTimers();
    try {
      const gate = makeGate();

      await click(gate);
      expect(gate.requests).toBe(1);

      // Past the gap, measured from when the attempt started.
      await vi.advanceTimersByTimeAsync(API_MIN_GAP);
      await click(gate);

      expect(gate.requests).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not let refusals push the window forward", async () => {
    /*
     * The same principle the bounded `forget()` bypass runs on. If a refused
     * click moved `lastAttempt`, somebody clicking once a second would hold the
     * floor shut forever and never get their refresh at all, which would turn a
     * guard into a lockout. Only an attempt that starts moves the window.
     */
    vi.useFakeTimers();
    try {
      const gate = makeGate();

      await click(gate);

      // Eight refused clicks, roughly one per second, through the cooldown.
      for (let i = 0; i < 8; i++) {
        await vi.advanceTimersByTimeAsync(950);
        await click(gate);
      }
      expect(gate.requests).toBe(1);

      // The gap has now elapsed since the ATTEMPT, so the next click works.
      await vi.advanceTimersByTimeAsync(API_MIN_GAP);
      await click(gate);
      expect(gate.requests).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("clears the in-flight slot so the gate is reusable", async () => {
    vi.useFakeTimers();
    try {
      const gate = makeGate();
      await click(gate);
      // A leaked promise here would wedge the button shut permanently, since
      // every later click would attach to a request that finished long ago.
      expect(gate.inFlight).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

/**
 * The cooldown label.
 *
 * `apiCooldownUntil()` is `lastApiAttempt + API_MIN_GAP`, and the panel turns it
 * into whole seconds with `Math.max(0, Math.ceil((until - now) / 1000))`. The
 * arithmetic is pinned here so the countdown cannot show a negative number, a
 * zero while still disabled, or an eleventh second.
 */
describe("the countdown the panel renders", () => {
  const secondsLeft = (until: number, now: number) => Math.max(0, Math.ceil((until - now) / 1000));

  const T = 1_700_000_000_000;
  const until = T + API_MIN_GAP;

  it("starts at the full gap and never overstates it", () => {
    expect(secondsLeft(until, T)).toBe(10);
    expect(secondsLeft(until, T + 1)).toBe(10);
  });

  it("counts down in whole seconds", () => {
    expect(secondsLeft(until, T + 1_000)).toBe(9);
    expect(secondsLeft(until, T + 9_000)).toBe(1);
    expect(secondsLeft(until, T + 9_999)).toBe(1);
  });

  it("reaches zero exactly when the floor opens, and never goes below", () => {
    // Zero is what turns the button back on, so it must not arrive early.
    expect(secondsLeft(until, until)).toBe(0);
    expect(secondsLeft(until, until + 5_000)).toBe(0);
    expect(secondsLeft(until, until + 60 * 60 * 1000)).toBe(0);
  });

  it("is zero for a session that has never pulled", () => {
    // `lastApiAttempt` starts at 0, so the cooldown is long past and the button
    // is live from the first render rather than opening disabled.
    expect(secondsLeft(0 + API_MIN_GAP, T)).toBe(0);
  });
});
