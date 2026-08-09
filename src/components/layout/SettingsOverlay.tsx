import React, { Suspense, lazy, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { X } from "lucide-react";
import { FOCUS } from "../../ui/kit";

const SiteSettingsPage = lazy(() =>
  import("../../pages/SiteSettingsPage").then((m) => ({ default: m.SiteSettingsPage }))
);

/**
 * Settings, as a window over the site rather than a page of it.
 *
 * The whole site stays where it is and blurs behind a veil; one frosted panel
 * floats on top carrying the settings surface. Opening is `?settings=1` on
 * whatever address you are already at, so the state is linkable, the back
 * button closes it, and closing returns you to exactly the page you were on
 * with nothing remounted.
 *
 * The veil does the blurring and the panel is tint only. The panel's backdrop
 * is the veil's own already-blurred output, so a second backdrop-filter on it
 * would cost a full-screen pass and return nothing visible - same reasoning
 * as the curtain in index.css.
 */

/** The flag every opener sets and this overlay watches. */
export const SETTINGS_PARAM = "settings";

export const SettingsOverlay: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const open = searchParams.has(SETTINGS_PARAM);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<Element | null>(null);

  const close = () => {
    const next = new URLSearchParams(searchParams);
    next.delete(SETTINGS_PARAM);
    setSearchParams(next);
  };

  /* Esc closes; the page under the veil must not scroll while it is up. */
  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prevOverflow;
      if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 px-3 py-6 backdrop-blur-[6px] sm:py-10"
      onMouseDown={(e) => {
        /* The veil closes, the panel does not. mousedown rather than click so
           a text selection that ends outside the panel does not dismiss it. */
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        tabIndex={-1}
        className="sd-lip relative w-full max-w-[52rem] rounded-lg border border-white/12 bg-slate-900/85 outline-none"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close settings"
          className={`absolute right-3 top-3 z-10 cursor-pointer rounded-md p-2 text-slate-300 transition-colors hover:bg-white/8 hover:text-slate-50 active:translate-y-px ${FOCUS}`}
        >
          <X className="h-4 w-4" />
        </button>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500/20 border-t-emerald-500" />
            </div>
          }
        >
          <SiteSettingsPage />
        </Suspense>
      </div>
    </div>
  );
};
