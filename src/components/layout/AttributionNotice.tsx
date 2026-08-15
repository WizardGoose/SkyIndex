import React, { useState } from "react";
import { FOCUS } from "../../ui/kit";
import {
  hasSeenAttributionNotice,
  markAttributionNoticeSeen,
} from "./attributionNoticeState";

const noticeLink = `rounded-sm text-sky-300 underline decoration-sky-500/60 underline-offset-2 transition-colors hover:text-sky-200 ${FOCUS}`;

export const AttributionNotice: React.FC = () => {
  const [open, setOpen] = useState(() => !hasSeenAttributionNotice());

  if (!open) return null;

  const dismiss = () => {
    markAttributionNoticeSeen();
    setOpen(false);
  };

  return (
    <aside
      aria-label="Skydex data attribution"
      className="sd-glass fixed bottom-3 left-1/2 z-40 flex w-[min(calc(100vw-1.5rem),48rem)] -translate-x-1/2 flex-col gap-3 rounded-md border border-white/12 px-4 py-3 shadow-xl sm:flex-row sm:items-center"
    >
      <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-slate-200">
        Item, recipe, mutation and image data comes from the{" "}
        <a
          href="https://hypixelskyblock.minecraft.wiki"
          target="_blank"
          rel="noopener noreferrer"
          className={noticeLink}
        >
          Hypixel SkyBlock Wiki
        </a>{" "}
        under{" "}
        <a
          href="https://creativecommons.org/licenses/by-nc-sa/3.0/"
          target="_blank"
          rel="noopener noreferrer"
          className={noticeLink}
        >
          CC BY-NC-SA 3.0
        </a>
        . Prices come from the public Hypixel API.
      </p>
      <button
        type="button"
        onClick={dismiss}
        className={`shrink-0 self-end rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-100 transition-colors hover:border-sky-500/70 hover:text-sky-200 sm:self-center ${FOCUS}`}
      >
        Got it
      </button>
    </aside>
  );
};
