import React from "react";
import { Link } from "react-router-dom";

/**
 * Privacy policy.
 *
 * The setting is one column at a readable measure, sections separated by a rule
 * rather than boxed, links in the site accent. The opening paragraph is upright
 * rather than italic: italic is a real legibility cost over three lines of 14px
 * on a dark ground, and this is the page's one explainer, not an aside.
 *
 * The words are a description of what the code does, so they are only correct
 * as long as that stays true. Every claim below is checkable against a specific
 * file: the key rules against `src/island/apiKey.ts`, the outbound hosts against
 * the `fetch` calls in `src/island`, `src/items`, `src/accessories` and
 * `src/networth`, the browser storage against `src/ui/backdrop.ts` and
 * `src/utilities/localStorage.ts`. If a change adds a network call or a new
 * store, this page is part of that change.
 */

const P = "text-sm leading-[1.8] text-slate-300";
const UL = "list-disc space-y-1.5 pl-5 text-sm leading-[1.8] text-slate-300 marker:text-slate-500";
const LINK = "text-emerald-300 underline decoration-emerald-500/40 underline-offset-4 transition-colors hover:decoration-emerald-400";
const HOST = "font-semibold text-slate-100";

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mt-10 border-t border-slate-800 pt-8">
    <h2 className="mb-3 text-base font-semibold text-slate-100">{title}</h2>
    <div className="space-y-4">{children}</div>
  </section>
);

const PrivacyPolicy: React.FC = () => (
  <div className="mx-auto w-full max-w-[65ch] px-1 py-10">
    <header>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Privacy Policy</h1>
      <div className="mt-3 h-px bg-gradient-to-r from-emerald-500/60 via-slate-800 to-transparent" />
      <p className="mt-4 text-sm leading-[1.8] text-slate-300">
        Skydex does not store any of your data or information. Your data is yours: it is stored only on your device. There is no Skydex account or
        login, the app is served as static files, and every calculation happens on your own machine. A shared Designer link may pass through the
        stateless preview worker described below; its layout is decoded in memory and discarded immediately. This page says what that means in
        practice, including the handful of places your browser does reach out to.
      </p>
    </header>

    <Section title="What Skydex collects">
      <p className={P}>Nothing. There is no collection step for there to be a policy about.</p>
      <ul className={UL}>
        <li>No accounts, no sign-up, no email address.</li>
        <li>
          No analytics, no telemetry, and no error reporting. There is no tracking script of any kind, from any vendor, on any page.
        </li>
        <li>No advertising, and no ad network.</li>
        <li>
          No cookies. Skydex never reads or writes <span className={HOST}>document.cookie</span>.
        </li>
      </ul>
    </Section>

    <Section title="Your Hypixel API key">
      <p className={P}>
        A Hypixel key is a personal credential, so it is held under deliberately narrow rules. You paste one in on the Settings page if you want the
        profile features; nothing on the site asks for it otherwise. You can get one from{" "}
        <a href="https://developer.hypixel.net" target="_blank" rel="noopener noreferrer" className={LINK}>
          developer.hypixel.net
        </a>
        .
      </p>
      <ul className={UL}>
        <li>It is stored in one localStorage entry in this browser, on this machine, and nowhere else.</li>
        <li>
          It is sent to exactly one place, <span className={HOST}>api.hypixel.net</span>, and only ever as an <span className={HOST}>API-Key</span>{" "}
          request header.
        </li>
        <li>
          It never goes in a web address. Query strings leak through history, referrers, browser extensions and any log the request passes, so the key
          is kept out of them.
        </li>
        <li>It never appears in an error message. Failure text is built from status codes, and the key is stripped from it as a backstop.</li>
        <li>It is never shown unmasked; the field it is typed into is a password field.</li>
        <li>The Settings page has a button that forgets it. That removes the entry outright rather than blanking it.</li>
      </ul>
    </Section>

    <Section title="Where your browser connects">
      <p className={P}>
        Skydex has no data-collecting application server, so source data comes straight to your browser. These are all of those sources, and what each
        one can see:
      </p>
      <ul className={UL}>
        <li>
          <span className={HOST}>api.hypixel.net</span>, for your profile. Your key travels as a header, and your account UUID or profile id travels
          in the address, because that is how the endpoint identifies which profile to return. Skydex also reads Hypixel's public item, skill and
          bazaar lists, which need no key and say nothing about you.
        </li>
        <li>
          <span className={HOST}>playerdb.co</span>, and <span className={HOST}>api.ashcon.app</span> if the first does not answer, to turn a
          Minecraft username into a UUID. This happens only when you type a name in and connect, and the name is the only thing sent.
        </li>
        <li>
          <span className={HOST}>mc-heads.net</span>, to draw player heads, avatars and the 3D skin view. These are image requests, and the UUID or
          skin texture hash is part of the image address.
        </li>
        <li>
          <span className={HOST}>hypixelskyblock.minecraft.wiki</span> and{" "}
          <a href="https://minecraft.wiki" target="_blank" rel="noopener noreferrer" className={LINK}>
            minecraft.wiki
          </a>
          , for recipe, forge, shop and mutation data and a few images. Page names go out; nothing about you does.
        </li>
        <li>
          <span className={HOST}>raw.githubusercontent.com</span>, for two public data files: the SkyHelper price list behind the networth estimate,
          and the NotEnoughUpdates constants that describe accessory upgrade paths. Nothing about you is sent with either.
        </li>
      </ul>
      <p className={P}>
        Fonts are not on that list. Every typeface the site is set in is served from this site's own address, so no request for them goes to Google
        or anyone else, and no IP address is handed over to render text.
      </p>
      <p className={P}>
        Every source request in this list is made directly by your browser. Skydex is not in the middle of it and keeps no copy.
      </p>
    </Section>

    <Section title="The companion mod">
      <p className={P}>
        Skydex does not contact the companion mod unless you choose <span className={HOST}>Link companion mod</span> in Settings. That deliberate
        click checks <span className={HOST}>127.0.0.1</span>, which is your own computer, and is when your browser may ask for local-device access.
        Once linked, Skydex listens for live updates and can send a greenhouse layout when you press its button. Unlinking stops those local
        connections without deleting your saved snapshot. The traffic never leaves your machine, and none of it is reachable from the network.
      </p>
    </Section>

    <Section title="What is kept in your browser">
      <p className={P}>
        Plenty is saved, because a tool that forgot your work every reload would be useless. All of it is written by your browser, on your machine, and
        none of it is uploaded.
      </p>
      <ul className={UL}>
        <li>
          <span className={HOST}>localStorage</span> holds your settings, saved planners and greenhouse layouts, owned-shard inventory, recent
          searches, the companion-mod link preference, the API key record described above, and cached copies of the wiki and Hypixel data already
          fetched, so the site is not re-fetching the same public lists on every visit.
        </li>
        <li>
          <span className={HOST}>sessionStorage</span> holds one entry, briefly. Opening a deep link on a static host lands on a fallback page first,
          and that entry is how the address you asked for survives the hop.
        </li>
        <li>
          <span className={HOST}>IndexedDB</span> holds files you chose yourself: a custom backdrop image, and a Minecraft resource pack if you loaded
          one. The file itself is stored, and it stays in the browser. Nothing about it is sent anywhere.
        </li>
      </ul>
      <p className={P}>
        Clearing site data for this site in your browser removes all of it, and the Settings page has buttons for the pieces you are most likely to
        want gone on their own.
      </p>
    </Section>

    <Section title="Hosting">
      <p className={P}>
        The site is served as static files by GitHub Pages, with Cloudflare handling the public skydex.ca connection in front of it. Like any host and
        delivery network, they receive ordinary request details such as your IP address, browser user agent, and the path or query string requested.
        Anything after a <span className={HOST}>#</span> stays in your browser and is never part of that request. A Designer share link is the deliberate
        exception: its encoded layout is in the path so Cloudflare can render the Discord preview. The stateless preview worker decodes it in memory,
        returns the page or image, and discards it immediately; Skydex has no database or application log for shared layouts. GitHub and Cloudflare
        apply their own privacy terms to the traffic they handle. Skydex adds no logging of its own and has no application back end that stores it.
      </p>
    </Section>

    <Section title="Other sites">
      <p className={P}>
        A few links point off-site, to the wiki, to Hypixel, and to the projects Skydex is built on. Following one puts you under that site's privacy
        practices, which are theirs and not covered here.
      </p>
    </Section>

    <Section title="Contact">
      <p className={P}>
        Questions about any of this can go to the handles on the <Link to="/contact" className={LINK}>Contact page</Link>.
      </p>
    </Section>

    <Section title="Changes">
      <p className={P}>
        This page describes how the current version behaves. If the code starts doing something different, this page changes with it rather than after
        it.
      </p>
    </Section>
  </div>
);

export default PrivacyPolicy;
