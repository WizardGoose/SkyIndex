/**
 * Transport 3: pushing a greenhouse layout to the mod.
 *
 * This is the one direction that runs site -> mod. The mod renders what arrives
 * here as a ghost overlay on the private island so the player can place things
 * by hand; it never places anything itself, because automated placement would
 * break Hypixel's rules. So nothing in this file is a command. It is a picture.
 *
 * Two halves, split on purpose:
 *
 *   buildLayoutPush  pure. Plain data in, spec body out, no fetch and no React,
 *                    which is what lets the wire format be tested by calling a
 *                    function instead of by mounting a page.
 *   sendLayout       the only part that touches the network, and the only part
 *                    that can fail for reasons the player can act on.
 *
 * The origin is repeated from `useIsland.ts` rather than imported. Importing it
 * would pull the island store into the greenhouse bundle, and that module opens
 * a live connection the moment anything subscribes - a real cost paid by every
 * visitor who never opens /island. One duplicated string is the cheaper of the
 * two mistakes.
 */

/** The mod binds 127.0.0.1 only, never 0.0.0.0. Same host string on both ends. */
const ORIGIN = "http://127.0.0.1:27916";

export const LAYOUT_PATH = "/v1/layout";
export const HEALTH_PATH = "/v1/health";

/**
 * Per-request ceiling. Short, for the same reason the island poll is short: a
 * localhost socket can still hang, and a hung request looks identical to a
 * working one that has not answered yet.
 */
const TIMEOUT_MS = 2_500;

/** The greenhouse plot is a fixed 10x10; the grid model has no other size. */
export const DEFAULT_GRID = 10;

/**
 * Shown when the POST never reached anything. Worth being specific: the mod
 * only serves this port in "Locally hosted" mode, so an unreachable port is far
 * more often the wrong mode than a crashed game.
 */
export const UNREACHABLE_REASON = "Mod not reachable. Is Minecraft running in Locally hosted mode?";

/**
 * One occupied cell. `crop` and `mutation` are exclusive by construction, not
 * by convention: a cell object is only ever built with one of them set.
 */
export interface LayoutCell {
  x: number;
  y: number;
  crop?: string;
  mutation?: string;
  ground?: string;
  /**
   * Whole seconds this cell is expected to wait before it is ready, when the
   * site's growth model can answer for it.
   *
   * The site owns this number because only the site has the model and the
   * player's stats; the mod has no honest clock of its own and so displays what
   * arrives rather than computing anything. Absent means "not known", and the
   * mod is required to show no timer at all for such a cell. It is never zero
   * and never a placeholder, which is what lets absence carry that one meaning.
   */
  seconds?: number;
}

/** The POST body, exactly as the spec pins it. */
export interface LayoutPush {
  schema: 1;
  label: string;
  size: [number, number];
  cells: LayoutCell[];
}

/**
 * One placement, in the terms the greenhouse already speaks.
 *
 * `position` stays [row, col] because that is what every grid in this app
 * stores; the flip to the spec's x/y happens once, inside the builder, so no
 * caller has to remember which way round it goes.
 */
export interface LayoutItem {
  /** Top-left corner as [row, col], 0-based. */
  position: [number, number];
  /** Edge length in cells: 1 for most crops, 2 for a 2x2. */
  size: number;
  /** Display name the mod shows, e.g. "Cocoa Beans" or "Choconut". */
  name: string;
  /** True when this fills the cell's mutation slot rather than its crop slot. */
  isMutation: boolean;
  /** Ground id when the dataset knows one. Left off rather than guessed. */
  ground?: string | null;
  /**
   * Seconds until this placement is ready, as the growth model answered for it,
   * or null when it could not answer.
   *
   * Left as the caller's job because the model needs the crop dataset and the
   * player's stats, and this module is the wire format rather than the planner.
   * What this module does own is the rule that an answer it cannot trust is not
   * sent: see `cleanSeconds`.
   */
  seconds?: number | null;
}

export interface BuildLayoutOptions {
  /** Grid edge length. Defaults to the 10x10 plot. */
  gridSize?: number;
  /** Overrides the derived label, for a caller that already has a better name. */
  label?: string;
}

export type BuildLayoutResult = { ok: true; body: LayoutPush } | { ok: false; reason: string };

export type LayoutSendResult =
  | { ok: true }
  | {
      ok: false;
      /**
       * `unreachable` is nobody's fault and usually the wrong mod mode.
       * `rejected` means the mod answered and said no, which is a bug on one
       * side or the other and carries the mod's own words.
       */
      kind: "unreachable" | "rejected";
      reason: string;
    };

const isWholeNumber = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0;

/** A ground id is only worth sending when it is a real non-empty string. */
const cleanGround = (ground: string | null | undefined): string | undefined => {
  if (typeof ground !== "string") return undefined;
  const trimmed = ground.trim();
  return trimmed === "" ? undefined : trimmed;
};

/**
 * An estimate is only worth sending when it is a real wait.
 *
 * Three things are dropped, and they are dropped for one reason: the mod reads
 * absence as "no timer for this cell", so anything that is not a number the
 * player can wait out has to become absence rather than become a number.
 *
 *   nothing        the model declined for this crop or mutation. Absence is
 *                  already the right answer and is passed straight through.
 *   not finite     NaN and the infinities are arithmetic that went wrong, not
 *                  durations, and a wrong number in game is worse than none.
 *   under a second the eleven mutations the wiki lists at zero growth stages
 *                  are genuinely instant. Rounding those to 0 and sending it
 *                  would put a zero on the wire, and zero is the one value that
 *                  must never appear: absence has to keep meaning "not known"
 *                  rather than splitting into two readings.
 *
 * Whole seconds, because the mod formats to the minute and a fractional second
 * is precision the model never had.
 */
const cleanSeconds = (seconds: number | null | undefined): number | undefined => {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) return undefined;
  const whole = Math.round(seconds);
  return whole >= 1 ? whole : undefined;
};

/**
 * Name the layout after what it is for.
 *
 * Mutations win over crops because the mutation is the point: nobody plants
 * ninety cocoa beans for the cocoa. The count is placements rather than cells,
 * so a 2x2 mutation counts once, which is the number the designer already shows
 * beside it and therefore the number the player will be looking for in game.
 *
 * Ties break on name so the same layout always produces the same label.
 */
export function layoutLabel(items: readonly LayoutItem[]): string {
  const usable = items.filter((item) => typeof item.name === "string" && item.name.trim() !== "");
  const preferred = usable.filter((item) => item.isMutation);
  const pool = preferred.length > 0 ? preferred : usable;
  if (pool.length === 0) return "Greenhouse layout";

  const counts = new Map<string, number>();
  for (const item of pool) {
    const name = item.name.trim();
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  const ranked = Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const [name, count] = ranked[0];
  const head = `${name} x${count}`;
  // A layout with several targets still gets one short line; the mod shows this
  // in game, where a comma-separated inventory of everything would be unreadable.
  return ranked.length > 1 ? `${head} +${ranked.length - 1} more` : head;
}

/**
 * Turn placements into the spec body.
 *
 * Every rule the spec states is enforced here rather than trusted upstream,
 * because the mod is the reader and a malformed body costs it a 400 it cannot
 * explain to the player:
 *
 *   - only occupied cells appear, so the empty majority of a sparse plot is
 *     simply absent rather than sent as nulls;
 *   - a cell carries crop or mutation, never both. Mutations are applied last,
 *     so a placement overlapping a crop resolves to the mutation - the same
 *     precedence the designer paints with;
 *   - coordinates are 0-based and clipped to the grid, so a placement hanging
 *     off the edge loses the cells that are outside rather than describing
 *     ground that does not exist;
 *   - `ground` appears only where a real id was supplied;
 *   - `seconds` appears only where the caller's growth model actually answered.
 *     A cell it could not price carries no estimate at all rather than a zero,
 *     because the mod turns absence into "show no timer" and a zero would turn
 *     "we do not know" into a countdown that had already finished.
 *
 * An empty result is a refusal, not an empty body: the mod would accept
 * `cells: []` and dutifully render nothing, which looks exactly like a broken
 * connection from inside the game.
 */
export function buildLayoutPush(
  items: readonly LayoutItem[],
  options: BuildLayoutOptions = {},
): BuildLayoutResult {
  const gridSize = options.gridSize ?? DEFAULT_GRID;
  if (!Number.isInteger(gridSize) || gridSize <= 0) {
    return { ok: false, reason: "The grid size is not a whole number of cells." };
  }

  const cells = new Map<string, LayoutCell>();

  const paint = (item: LayoutItem) => {
    const name = typeof item.name === "string" ? item.name.trim() : "";
    if (name === "") return;
    if (!Array.isArray(item.position) || item.position.length !== 2) return;

    const [row, col] = item.position;
    if (!isWholeNumber(row) || !isWholeNumber(col)) return;
    if (!isWholeNumber(item.size) || item.size < 1) return;

    const ground = cleanGround(item.ground);
    const seconds = cleanSeconds(item.seconds);

    for (let dr = 0; dr < item.size; dr++) {
      for (let dc = 0; dc < item.size; dc++) {
        const y = row + dr;
        const x = col + dc;
        if (y >= gridSize || x >= gridSize) continue;

        const cell: LayoutCell = item.isMutation ? { x, y, mutation: name } : { x, y, crop: name };
        if (ground) cell.ground = ground;
        // Last, so a body with no estimates serialises byte for byte the way it
        // did before there was such a thing as an estimate.
        if (seconds !== undefined) cell.seconds = seconds;
        cells.set(`${y},${x}`, cell);
      }
    }
  };

  for (const item of items) if (!item.isMutation) paint(item);
  for (const item of items) if (item.isMutation) paint(item);

  if (cells.size === 0) {
    return { ok: false, reason: "This layout is empty. Place something first." };
  }

  // Reading order. The mod does not care, but a stable body makes the wire
  // format diffable and the tests readable.
  const ordered = Array.from(cells.values()).sort((a, b) => a.y - b.y || a.x - b.x);

  return {
    ok: true,
    body: {
      schema: 1,
      label: options.label?.trim() || layoutLabel(items),
      size: [gridSize, gridSize],
      cells: ordered,
    },
  };
}

/**
 * `fetch` with a deadline, and with the caller's own signal honoured.
 *
 * `AbortSignal.any` would do this in one line but is younger than the browsers
 * this bundle targets, so the two signals are wired together by hand.
 */
const withDeadline = async (input: string, init: RequestInit, signal?: AbortSignal): Promise<Response> => {
  const controller = new AbortController();
  const abort = () => controller.abort();

  if (signal?.aborted) controller.abort();
  else signal?.addEventListener("abort", abort, { once: true });

  const deadline = setTimeout(abort, TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(deadline);
    signal?.removeEventListener("abort", abort);
  }
};

/**
 * Dig a human sentence out of a rejection.
 *
 * The spec says a 400 carries "a reason" without pinning its shape, so all the
 * plausible shapes are tried and the status code is the floor. Forward
 * compatible in the same way the snapshot reader is: an unknown field is
 * ignored, never fatal.
 */
const rejectionReason = (status: number, text: string): string => {
  const trimmed = text.trim();
  if (trimmed !== "") {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object") {
        const bag = parsed as Record<string, unknown>;
        for (const key of ["reason", "error", "message"]) {
          const value = bag[key];
          if (typeof value === "string" && value.trim() !== "") return value.trim();
        }
      }
    } catch {
      // Not JSON. A plain-text reason is still a reason.
      if (trimmed.length <= 200) return trimmed;
    }
  }
  return `The mod rejected the layout (${status}).`;
};

/**
 * POST a layout to the mod.
 *
 * Never throws. A closed port is the ordinary case - most people running this
 * site have no mod at all - and the caller is a button that has to say something
 * useful either way, so every outcome comes back as a value. The two failures
 * are kept apart because they need different words: nothing answered, versus the
 * mod answered and refused.
 */
export async function sendLayout(body: LayoutPush, signal?: AbortSignal): Promise<LayoutSendResult> {
  let res: Response;
  try {
    res = await withDeadline(
      `${ORIGIN}${LAYOUT_PATH}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      },
      signal,
    );
  } catch {
    // A DNS-less localhost refusal, a timeout, and an unmount all land here.
    // None of them tell the player anything except that nothing is listening.
    return { ok: false, kind: "unreachable", reason: UNREACHABLE_REASON };
  }

  if (res.ok) return { ok: true };

  let text = "";
  try {
    text = await res.text();
  } catch {
    // The status alone is enough to say it was refused.
  }
  return { ok: false, kind: "rejected", reason: rejectionReason(res.status, text) };
}

/**
 * One-shot liveness probe.
 *
 * Deliberately not a subscription. The greenhouse only needs to know whether to
 * offer the button, and paying for the island's stream or poll loop to learn one
 * boolean would start a connection on pages that have nothing to do with it.
 */
export async function modReachable(signal?: AbortSignal): Promise<boolean> {
  try {
    const res = await withDeadline(`${ORIGIN}${HEALTH_PATH}`, { method: "GET", cache: "no-store" }, signal);
    if (!res.ok) return false;
    const health = (await res.json()) as { ok?: unknown } | null;
    return health?.ok === true;
  } catch {
    return false;
  }
}
