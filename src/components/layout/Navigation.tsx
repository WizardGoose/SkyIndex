import React, { useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Menu, Settings, X } from "lucide-react";
import { FOCUS } from "../../ui/kit";
import { Wordmark } from "../../ui/Wordmark";

/**
 * The masthead, ported from the design bench (the glass re-vamp).
 *
 * Layout is the design mock, read literally: the wordmark holds
 * the left end, the section tabs run along beside it, the settings cog sits
 * at the right end. The bar is the one piece of chrome every page shares, so
 * every item that earns a place in it costs every page some attention.
 *
 * The glass itself is `.sd-bar`: the shared theme's 76% -> 64% ground tint,
 * strongly blurred with a 2px stroke on
 * the bottom edge. Height is the `--sd-bar-h` token (68px): the mock's canvas
 * puts the bar at ~7.4% of viewport height, which is an ~80px masthead you
 * notice more than the page; 68px keeps the drawing's wordmark-to-bar
 * proportion at a size that behaves like site chrome.
 *
 * What the bench did not have to carry, and this bar does:
 *
 *   - The tools strip (Greenhouse's Planner/Solver/Designer, Shards' four).
 *     Real function, kept as a slim second strip under the bar.
 *   - A working mobile menu. The bench deferred narrow viewports outright.
 *
 * The Ironman/Normal toggle is deliberately NOT here.
 * The full control, with the API-detected mode beside it, already lives on
 * the Settings page (SiteSettingsPage's Profile section); the bar carries
 * only what the mock drew.
 */

interface Section {
  label: string;
  path: string;
  /** Any route starting with one of these belongs to this section. */
  match: string[];
  tools: { label: string; path: string }[];
}

/*
 * The grouping is deliberate, with the
 * bench's one structural change: NO Dashboard tab. The wordmark IS the
 * dashboard link, and a Dashboard tab was saying the same thing
 * as the logo two inches to its left. The section entry stays in this array
 * so route matching still knows "/" is the dashboard; it is simply never
 * rendered as a tab, which is also what makes the dashboard state read
 * correctly: no section is highlighted, because the logo is what is selected.
 */
export const SECTIONS: Section[] = [
  { label: "Dashboard", path: "/", match: ["/", "/dashboard"], tools: [] },
  {
    /* No tools row, deliberately -
       the profile page carries its own tab bar, Accessories included. */
    label: "Profile",
    path: "/island",
    match: ["/island", "/accessories"],
    tools: [],
  },
  { label: "Crafting", path: "/items", match: ["/items"], tools: [] },
  { label: "Forge", path: "/forge", match: ["/forge"], tools: [] },
  {
    label: "Greenhouse",
    path: "/greenhouse/planner",
    match: ["/greenhouse"],
    tools: [
      { label: "Planner", path: "/greenhouse/planner" },
      { label: "Solver", path: "/greenhouse" },
      { label: "Designer", path: "/greenhouse/designer" },
    ],
  },
  {
    label: "Shards",
    path: "/fusion",
    match: ["/fusion", "/recipes", "/shards", "/fusion-lines"],
    tools: [
      { label: "Fusion", path: "/fusion" },
      { label: "Recipes", path: "/recipes" },
      /* "Overview" is the honest label: the page is per-shard rates and
         reference, and the old label "Owned" promised an inventory it never
         held (the real owned list lives in Fusion's Manage Inventory). */
      { label: "Overview", path: "/shards" },
      { label: "Lines", path: "/fusion-lines" },
    ],
  },
];

/** The tabs actually drawn. See the SECTIONS comment: Dashboard is the logo. */
const TAB_SECTIONS = SECTIONS.filter((s) => s.label !== "Dashboard");

/**
 * The section the current route belongs to, or null on a page outside every
 * section (settings, about, the legal pages). "/" matches exactly rather than
 * as a prefix, because `startsWith("//")` is true for no real path.
 */
const sectionFor = (pathname: string): Section | null => {
  const hit = SECTIONS.filter((s) => s.match.some((m) => pathname === m || pathname.startsWith(`${m}/`))).sort(
    (a, b) => Math.max(...b.match.map((m) => m.length)) - Math.max(...a.match.map((m) => m.length))
  )[0];
  return hit ?? null;
};

export const Navigation: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const active = sectionFor(location.pathname);


  /* Settings opens as an overlay over the current page (SettingsOverlay
     watches this flag), so the cog toggles a search param instead of
     navigating away. */
  const settingsOpen = searchParams.has("settings");
  const openSettings = () => {
    const next = new URLSearchParams(searchParams);
    next.set("settings", "1");
    setSearchParams(next);
    setOpen(false);
  };

  /* One font, one size. What differs is only how "current" is drawn: a rule
     under the word. No horizontal padding on the tabs: the first tab's left
     edge has to land exactly on the curtain's edge when the channel is open,
     and 4px of button padding was enough to make the row read as misaligned
     with everything below it. The underline then measures the word rather
     than the word plus padding, which is also the better mark. */
  const tab = (s: Section) => {
    const on = s.label === active?.label;
    return (
      <Link
        key={s.path}
        to={s.path}
        onClick={() => setOpen(false)}
        aria-current={on ? "page" : undefined}
        style={{
          fontFamily: "var(--font-chrome)",
          fontWeight: on ? 800 : 700,
          fontSize: "13px",
          letterSpacing: "0.02em",
        }}
        className={`relative flex h-full cursor-pointer items-center whitespace-nowrap transition-colors duration-150 active:translate-y-px ${FOCUS} ${
          on ? "text-slate-50" : "text-slate-300 hover:text-slate-50"
        }`}
      >
        {s.label}
        {/* Full bar height, rule pinned to the bottom and pulled down by the
            stroke's own 2px, so the mark lands ON the separator instead of
            floating above it as a second line. */}
        <span
          aria-hidden
          className={`absolute -bottom-[2px] left-0 h-[2px] w-full origin-center bg-emerald-400 transition-transform duration-200 motion-reduce:transition-none ${
            on ? "scale-x-100" : "scale-x-0"
          }`}
        />
      </Link>
    );
  };

  return (
    <nav className="sd-masthead-frost sticky top-0 z-[60]">
      <div className="sd-bar relative z-10 w-full" style={{ height: "var(--sd-bar-h)" }}>
        <div className="flex h-full items-center pr-3 sm:pr-5">
          {/* The wordmark's cell is exactly as wide as the page's sharp
              channel, so on a channel page the masthead is columned like the
              page underneath it: logo over the portrait, tabs over the
              content. `minWidth: fit-content` is the guard for every other
              page, where the split is 0 and the cell would otherwise
              collapse onto the logo. */}
          <div
            className="flex h-full shrink-0 items-center"
            style={{
              width: "var(--sd-col)",
              minWidth: "fit-content",
              paddingLeft: "var(--sd-gutter)",
              paddingRight: "1.25rem",
            }}
          >
            <Link
              to="/"
              aria-label="Skydex, dashboard"
              className={`flex w-fit cursor-pointer items-center rounded-sm ${FOCUS}`}
            >
              <Wordmark size={30} />
            </Link>
          </div>

          {/* No `overflow-x-auto` here: the active tab's rule is positioned
              below the button and a scroll container clips it, so the current
              section would silently lose its underline. Narrow viewports use
              the menu instead.

              `h-full` is load bearing rather than decorative. The row is a flex
              item of an `items-center` parent, so without a height of its own
              it takes its content's height, and `h-full` on each tab inside
              then has no definite height to resolve against and collapses to
              the text box. Measured, that made every tab a 19.5px tap target
              in a 68px bar (under the 24px minimum) and left the active rule
              floating mid bar instead of landing on the separator, which is
              the one thing the tab's own comment says it must do. Giving the
              row the bar's height fixes the target and the rule together, and
              moves nothing horizontally. */}
          <div
            className="hidden h-full min-w-0 items-center gap-3.5 md:flex lg:gap-5"
            style={{ paddingLeft: "var(--sd-inset)" }}
          >
            {TAB_SECTIONS.map(tab)}
          </div>

          <div className="ml-auto hidden shrink-0 items-center gap-2 md:flex">
            <button
              type="button"
              onClick={openSettings}
              aria-label="Settings"
              aria-haspopup="dialog"
              aria-expanded={settingsOpen}
              className={`cursor-pointer rounded-md p-2 transition-colors active:translate-y-px ${FOCUS} ${
                settingsOpen ? "bg-emerald-500/15 text-emerald-200" : "text-slate-300 hover:bg-white/8 hover:text-slate-50"
              }`}
            >
              <Settings className="h-[18px] w-[18px]" />
            </button>
          </div>

          <button
            onClick={() => setOpen(!open)}
            className={`ws-glyph ml-auto cursor-pointer rounded-md p-2 text-slate-300 transition-colors hover:bg-white/8 hover:text-slate-50 md:hidden ${FOCUS}`}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Tools for the current section. Only shown when there is more than
          one. Tint only, never blur: this strip sits over the curtain, whose
          output is already blurred. A second backdrop-filter would cost a
          full-screen pass and return a flat tint. */}
      {active && active.tools.length > 0 && (
        /* `sd-tools` is the hook, not a style: index.css keys the page's
           sticky offset (--sd-chrome-h) off whether this strip is on the page,
           so a rail pinned under the masthead clears the strip too. Height
           comes from the same token the offset adds, so the two cannot
           disagree. */
        <div
          className="sd-tools hidden h-[var(--sd-tools-h)] items-center gap-4 border-b border-white/10 bg-black/25 md:flex"
          style={{ paddingLeft: "calc(var(--sd-col) + var(--sd-inset))" }}
        >
          {active.tools.map((t) => {
            const isActive = location.pathname === t.path;
            return (
              <Link
                key={t.path}
                to={t.path}
                aria-current={isActive ? "page" : undefined}
                className={`flex h-[var(--sd-tools-h)] cursor-pointer items-center border-b-2 text-[13px] transition-colors ${FOCUS} ${
                  isActive ? "border-emerald-500 text-emerald-300" : "border-transparent text-slate-300 hover:text-slate-100"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      )}

      {open && (
        <div className="space-y-2 border-t border-white/10 bg-slate-950/95 px-3 py-2 md:hidden">
          {TAB_SECTIONS.map((s) => (
            <div key={s.path}>
              <Link
                to={s.path}
                onClick={() => setOpen(false)}
                aria-current={s.label === active?.label ? "page" : undefined}
                style={{ fontFamily: "var(--font-chrome)", fontWeight: s.label === active?.label ? 800 : 700, fontSize: "13px" }}
                className={`cursor-pointer rounded-md px-1 py-1 transition-colors ${FOCUS} ${
                  s.label === active?.label ? "text-emerald-200" : "text-slate-300 hover:text-slate-50"
                }`}
              >
                {s.label}
              </Link>
              {s.tools.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-1.5 pl-3">
                  {s.tools.map((t) => (
                    <Link
                      key={t.path}
                      to={t.path}
                      onClick={() => setOpen(false)}
                      className={`cursor-pointer rounded-sm text-[13px] ${FOCUS} ${
                        location.pathname === t.path ? "text-emerald-300" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {t.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={openSettings}
            className={`flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-[13px] ${FOCUS} ${
              settingsOpen ? "text-emerald-200" : "text-slate-300 hover:text-slate-50"
            }`}
          >
            <Settings className="h-3.5 w-3.5" /> Settings
          </button>
        </div>
      )}
    </nav>
  );
};
