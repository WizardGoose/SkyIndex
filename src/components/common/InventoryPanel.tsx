import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { PANEL, Tag, FOCUS } from "../../ui/kit";

/**
 * Inventory panel. The collapsible "Inventory" block the fusion sidebar wears,
 * made a primitive so every tab can carry the same block and the GUI stays
 * aligned across the site. One header row that is the collapse toggle - icon,
 * title, a count chip, chevron at the far end - then a one line summary of what
 * is held, then whatever management surface the page needs: the fusion page
 * puts its Manage Inventory button in here, the greenhouse its search-to-add
 * input and row list. The pages differ in what managing means; they must not
 * differ in what the panel looks like.
 *
 * It lives in its own file rather than in the kit because it is the one
 * primitive several unrelated tabs reach for by name, and a page that wants it
 * should be able to say so in its import list. `ui/kit` re-exports it, so a
 * caller may take it from either place.
 *
 * Kit chrome, not the purple the fusion page was forked with. The two-family
 * ruling in ui/kit.tsx lets the inherited shard pages keep purple for what they
 * already had, but a primitive built for every tab is new work, and new work
 * takes the one accent.
 *
 * `count` is a string like "37 shards" and is simply not rendered when null: an
 * empty inventory gets no chip rather than a "0" that reads like a claim about
 * something. Same honesty rule as everywhere else - the summary line states
 * only what the data actually says, and the caller owns that.
 *
 * `headerExtra` sits OUTSIDE the toggle button, after the chevron, because a
 * button inside a button is invalid HTML and a stray "clear" must not also
 * collapse the panel. Open state is local and deliberately unpersisted: which
 * panels you had folded is not worth a storage key.
 */
export const InventoryPanel: React.FC<{
  title?: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Chip text, e.g. "37 shards". Null or undefined renders no chip at all. */
  count?: string | null;
  /** One line under the header stating what is held. Omit when there is nothing to say. */
  summary?: React.ReactNode;
  /** Controls that belong on the header row but not in the toggle, e.g. a clear button. */
  headerExtra?: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children?: React.ReactNode;
}> = ({ title = "Inventory", icon: Icon, count, summary, headerExtra, defaultOpen = true, className = "", children }) => {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <section className={`${PANEL} overflow-hidden ${className}`}>
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className={`flex flex-1 cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-slate-800/40 ${FOCUS}`}
        >
          <span className="flex min-w-0 items-center gap-2">
            {Icon && <Icon className="h-4 w-4 shrink-0 text-emerald-300" />}
            <span className="text-[12px] font-semibold tracking-tight text-slate-200">{title}</span>
            {count && <Tag accent>{count}</Tag>}
          </span>
          {open ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          )}
        </button>
        {headerExtra && <span className="flex shrink-0 items-center gap-1.5 pr-3">{headerExtra}</span>}
      </div>
      {open && (
        <div className="space-y-2 border-t border-slate-800 p-3">
          {summary && <div className="text-[12px] leading-snug text-slate-300">{summary}</div>}
          {children}
        </div>
      )}
    </section>
  );
};

export default InventoryPanel;
