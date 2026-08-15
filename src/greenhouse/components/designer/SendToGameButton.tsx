import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Gamepad2, Loader2 } from "lucide-react";
import { BTN_PRIMARY } from "../../../ui/kit";
import { GRID_SIZE } from "../../constants";
import { buildLayoutPush, sendLayout } from "../../../island/layout";
import { useCompanionLink } from "../../../island/companionLink";
import { useIsland } from "../../../island/useIsland";
import type { LayoutItem } from "../../../island/layout";
import { estimateLayoutSeconds } from "./layoutTiming";

/**
 * Hand the current grid to the companion mod, which draws it in game as a ghost
 * overlay so the plot can be laid out by hand instead of squinting between two
 * windows. Strictly a picture: the mod places nothing.
 *
 * Two things here are deliberate.
 *
 * Reachability comes from the island store only after the user has explicitly
 * linked the companion mod in Settings. Merely mounting this control therefore
 * performs no localhost request and cannot trigger a browser permission prompt.
 *
 * The feedback is inline and next to the button rather than a toast, because the
 * failure people will actually hit is "the mod is not listening", and that is
 * information about this button, not an event worth interrupting the page for.
 */

/**
 * Long enough to read, short enough that a stale "Sent to game" is never
 * mistaken for the result of the click you just made.
 */
const CLEAR_MS = 4_000;

type Status = "idle" | "sending" | "sent" | "failed";

interface SendToGameButtonProps {
  /** Everything on the grid. Empty is fine; the button simply refuses to send. */
  items: LayoutItem[];
  className?: string;
}

export const SendToGameButton: React.FC<SendToGameButtonProps> = ({ items, className = "" }) => {
  const { linked } = useCompanionLink();
  const { status: islandStatus } = useIsland();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  /**
   * Identity of the grid's contents, not of the array holding them. Callers
   * build this list inline, so depending on the array itself would clear the
   * result on every render and no one would ever read "Sent to game".
   */
  const signature = useMemo(
    () => items.map((i) => `${i.position[0]},${i.position[1]},${i.size},${i.isMutation ? "m" : "c"},${i.name}`).join("|"),
    [items],
  );

  // A result that belongs to the previous contents of the grid is worse than no
  // result at all, so editing clears it.
  useEffect(() => {
    setStatus("idle");
    setMessage(null);
  }, [signature]);

  useEffect(() => {
    if (status !== "sent") return;
    const timer = setTimeout(() => {
      setStatus("idle");
      setMessage(null);
    }, CLEAR_MS);
    return () => clearTimeout(timer);
  }, [status]);

  const handleSend = useCallback(async () => {
    // The greenhouse states its own plot size rather than leaning on the
    // island module's default, so growing the plot cannot silently truncate.
    //
    // Estimates are priced here, at the click, rather than in a memo: the stats
    // they read live in stores this component deliberately does not subscribe
    // to, for the same reason it does not subscribe to the island store above.
    // A layout the model cannot price still sends; it simply arrives without a
    // countdown, which is what the mod is built to expect.
    const built = buildLayoutPush(estimateLayoutSeconds(items), { gridSize: GRID_SIZE });
    if (!built.ok) {
      setStatus("failed");
      setMessage(built.reason);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("sending");
    setMessage(null);

    const result = await sendLayout(built.body, controller.signal);
    if (controller.signal.aborted) return;

    if (result.ok) {
      setStatus("sent");
      setMessage("Sent to game");
      return;
    }

    setStatus("failed");
    setMessage(result.reason);
  }, [items]);

  if (!linked || islandStatus !== "live") return null;

  const busy = status === "sending";

  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`}>
      <button
        type="button"
        onClick={() => void handleSend()}
        disabled={busy || items.length === 0}
        className={BTN_PRIMARY}
        title="Show this layout in game as a ghost overlay"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Gamepad2 className="h-3.5 w-3.5" />}
        Send to game
      </button>

      {message && (
        <span
          role="status"
          aria-live="polite"
          className={`inline-flex items-center gap-1 text-[11px] leading-snug ${
            status === "sent" ? "text-emerald-300" : "text-red-300"
          }`}
        >
          {status === "sent" && <Check className="h-3 w-3" />}
          {message}
        </span>
      )}
    </div>
  );
};
