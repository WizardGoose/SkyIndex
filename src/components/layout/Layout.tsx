import React, { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Navigation } from "./Navigation";
import { SettingsOverlay } from "./SettingsOverlay";
import { WelcomeTour } from "./WelcomeTour";
import { ErrorBoundary } from "./ErrorBoundary";
import { FOCUS } from "../../ui/kit";
import { BACKDROP_UPDATED_EVENT, loadBackdropUrl } from "../../ui/backdrop";

/*
 * The markup pin, discovered rather than imported.
 *
 * That tool is a local working aid, not part of the released project, so
 * `src/dev-local/` is gitignored and a clone of this repository does not
 * contain it. A static `import` of a file that is not on disk fails the build,
 * which would make the clone unbuildable for everyone else.
 *
 * `import.meta.glob` is resolved at build time against what is actually there:
 * it yields the module's loader when the folder is present and an empty object
 * when it is not, so the same source builds either way. Present, the pin is a
 * lazily loaded chunk mounted only under `import.meta.env.DEV`, which is what
 * the static import did. Absent, the constant is null and nothing renders and
 * nothing is fetched.
 *
 * The loader is read positionally rather than by key because the glob matches
 * at most one file, so the value is the whole answer and no assumption about
 * the shape of the generated key has to be correct.
 *
 * The `import.meta.env.DEV` test wraps the lookup rather than only the render,
 * and that placement is the point. `pnpm run deploy` builds on the maintainer's
 * own machine, which is the one machine where this folder does exist, so a
 * discovery that ran unconditionally would emit the tool as a real chunk into
 * the artifact that gets published. Vite replaces the flag with `false` in a
 * production build, which makes this branch unreachable and drops the glob and
 * its import with it, so the published site carries no copy of the tool whether
 * or not the folder was present when it was built.
 */
const DevMarkup = import.meta.env.DEV
  ? (() => {
      const loader = Object.values(import.meta.glob("../../dev-local/DevMarkup.tsx"))[0] as (() => Promise<{ default: React.ComponentType }>) | undefined;
      return loader ? React.lazy(loader) : null;
    })()
  : null;

/**
 * The shell.
 *
 * Since the glass re-vamp the ground is the glass system: a fixed
 * backdrop (the site's hub render, sharp), a near-nothing scrim, and one
 * fixed sheet of frosted glass (.sd-curtain) that the whole app scrolls over.
 * The app content therefore sits in its own `relative z-10` wrapper ABOVE the
 * curtain, and there is still deliberately no background colour on any of
 * these wrappers: an opaque background here would paint straight over the
 * glass, which is exactly the class of bug the old ambient-wash era had.
 *
 * Shell width. `max-w-screen-2xl` is still the class here, but it is no longer
 * a flat 1536px: index.css rebinds that one utility to `--ws-shell`, which
 * steps up at 1920px, 2240px, 2560px and 3200px. The class is left in place on
 * purpose rather than swapped for a bespoke one, because Navigation.tsx uses
 * the same utility and the two must stay on exactly the same width or the
 * wordmark stops lining up with the left edge of the content. One token, three
 * call sites, all of them the page shell. The steps and the reasoning behind
 * each number live next to the rule in index.css.
 */

/**
 * Attribution links. The wiki licence credit and the SkyShards credit are not
 * optional and they are not decoration, so they are set at a size a person can
 * actually read rather than the 10px near-black they used to be. Quiet, still
 * legible, still out of the way.
 */
const attributionLink = `text-slate-200 underline decoration-slate-600 underline-offset-2 rounded-sm transition-colors hover:text-emerald-300 hover:decoration-emerald-400/70 ${FOCUS}`;

export const Layout: React.FC = () => {
  const location = useLocation();

  /*
   * The sharp channel (the glass re-vamp). The Profile page is the one page
   * with something to STAND in the sharp left strip of the backdrop, namely
   * the 3D player, so it is the one route that gets a full-bleed main: its own
   * layout puts the player at the viewport's left edge, which a centred shell
   * would pull inboard. The `.sd-channel` class itself (which opens
   * `--sd-split`) is toggled on <html> by IslandPage, and only once a profile
   * is actually loaded: the import pitch has nothing to stand in a channel.
   */
  const channel = location.pathname === "/island" || location.pathname.startsWith("/island/");

  /*
   * The dashboard runs WITHOUT the curtain: the backdrop shows sharp, and
   * each piece of information carries its own frosted pane (.sd-glass)
   * instead of sharing one sheet. Data-dense pages keep the curtain, because
   * a hundred rows each paying for their own backdrop-filter is a slideshow,
   * and one sheet is cheaper and calmer to read on.
   */
  const curtainless = location.pathname === "/";

  /*
   * Tool pages share the Profile page's split: rail under the logo, results
   * under the tabs (SplitPage in the kit). That alignment needs the full
   * viewport, so these routes escape the centred shell the way the channel
   * does. Pages outside every section (about, legal) keep the shell.
   */
  const SPLIT_PREFIXES = ["/fusion", "/items", "/forge", "/greenhouse", "/recipes", "/shards", "/fusion-lines"];
  const split = SPLIT_PREFIXES.some((m) => location.pathname === m || location.pathname.startsWith(`${m}/`));

  /*
   * A player-supplied backdrop, applied through the one seam the stylesheet
   * exposes (--sd-bg). Loaded async so the shipped render paints first and
   * the swap is a background-image change, not a flash.
   */
  useEffect(() => {
    let url: string | null = null;
    let live = true;
    const apply = async () => {
      const next = await loadBackdropUrl();
      if (!live) {
        if (next) URL.revokeObjectURL(next);
        return;
      }
      if (url) URL.revokeObjectURL(url);
      url = next;
      if (next) document.documentElement.style.setProperty("--sd-bg", `url("${next}")`);
      else document.documentElement.style.removeProperty("--sd-bg");
    };
    void apply();
    window.addEventListener(BACKDROP_UPDATED_EVENT, apply);
    return () => {
      live = false;
      window.removeEventListener(BACKDROP_UPDATED_EVENT, apply);
      if (url) URL.revokeObjectURL(url);
      document.documentElement.style.removeProperty("--sd-bg");
    };
  }, []);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* The three-layer ground: the render (sharp, full strength), a near
          nothing scrim, then ONE sheet of frosted glass from --sd-split to
          the right margin. See the Glass ground block in index.css. */}
      <div className="sd-backdrop" aria-hidden>
        <div className="sd-backdrop__img" />
        <div className="sd-backdrop__scrim" />
      </div>
      {!curtainless && <div className="sd-curtain" aria-hidden />}

      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <Navigation />
        <main className={channel || split ? "flex flex-1 flex-col" : "flex-1 px-3 py-3 sm:px-4"}>
          {channel || split ? (
            <ErrorBoundary>
              <Outlet key={location.pathname} />
            </ErrorBoundary>
          ) : (
            <div className="mx-auto w-full max-w-screen-2xl">
              <ErrorBoundary>
                <Outlet key={location.pathname} />
              </ErrorBoundary>
            </div>
          )}
        </main>

      {/* The attribution used to hang `max-w-screen-2xl` directly on the <p>,
          which made the shell width double as the line length: one unbroken
          1536px line of 11px text, and worse once the shell steps up on a large
          monitor. Split in two. The outer div keeps the paragraph aligned with
          the left edge of the page content above it, and the inner cap is a
          reading measure. Generous at 100ch, because this is dense credit text
          rather than body copy, but bounded. */}
      {/* Compact on purpose. The credits stay complete and 11px (the
          floor a person can actually read); what shrank is the box around
          them: half the vertical padding and a tighter leading. */}
      <footer className={`mt-4 border-t border-white/10 px-3 py-2 sm:px-4 ${curtainless ? "bg-slate-950/70" : ""}`}>
        <div className="mx-auto w-full max-w-screen-2xl">
          <p className="max-w-[120ch] text-[11px] leading-snug text-slate-300">
            Item, recipe and mutation data and all item images are loaded live from the{" "}
            <a href="https://hypixelskyblock.minecraft.wiki" target="_blank" rel="noopener noreferrer" className={attributionLink}>
              Hypixel SkyBlock Wiki
            </a>
            , licensed{" "}
            <a href="https://creativecommons.org/licenses/by-nc-sa/3.0/" target="_blank" rel="noopener noreferrer" className={attributionLink}>
              CC BY-NC-SA 3.0
            </a>
            . Prices from the public Hypixel API. Fusion calculator and greenhouse solver forked from{" "}
            <a href="https://github.com/Campionnn/SkyShards" target="_blank" rel="noopener noreferrer" className={attributionLink}>
              SkyShards
            </a>{" "}
            by Campion and xKapy. Thanks to{" "}
            <a href="https://mc-heads.net" target="_blank" rel="noopener noreferrer" className={attributionLink}>
              MCHeads
            </a>{" "}
            for providing Minecraft avatars.
          </p>
          {/* Mojang's Commercial Use conditions require a non-affiliation
              disclaimer from anything that shares Minecraft material with a
              community, free or not, and this site renders Minecraft item
              icons throughout. The wording is Mojang's own prescribed line and
              is not paraphrased. Quieter than the attribution above it because
              it is a legal notice rather than a credit somebody is meant to
              follow, but it stays above the contrast floor. NOTICE.md records
              the obligation this satisfies. */}
          <p className="mt-1.5 text-[10px] leading-snug text-slate-500">
            NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT
          </p>
        </div>
      </footer>
      </div>

      <SettingsOverlay />
      <WelcomeTour />
      {/* Dev builds only, and only when src/dev-local/ is present on this
          machine: the markup pin for pointing at elements. Statically
          eliminated from production. */}
      {import.meta.env.DEV && DevMarkup && (
        <Suspense fallback={null}>
          <DevMarkup />
        </Suspense>
      )}
    </div>
  );
};
