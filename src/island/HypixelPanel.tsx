import React, { useEffect, useMemo, useState } from "react";
import { KeyRound, RefreshCw, Check, X, Trash2, CalendarClock } from "lucide-react";
import { useApiAccess, readExpiry, expiryLabel } from "./apiKey";
import { useGreenhouseStats } from "./profileStats";
import { useIsland, apiCooldownUntil } from "./useIsland";
import { resolveAccount } from "./hypixel";
import { ago } from "./format";
import { API_CREDENTIAL_FIELD_ATTRIBUTES } from "./apiCredentialField";
import { PANEL, LABEL, NUM, INPUT, BTN_PRIMARY, BTN_QUIET, SectionHead } from "../ui/kit";

/**
 * The Hypixel connection settings.
 *
 * Lives under `src/island/` rather than on the settings page because it is only
 * meaningful next to the data it fetches: the thing this key unlocks is one
 * section of one page, and burying it two clicks away in a global settings
 * screen would make it look like a site-wide account login, which it is not.
 *
 * What the key actually buys is modest and the copy says so. Sacks, and only
 * sacks - chests are not in the API at any privacy setting, which is the entire
 * reason the companion mod exists.
 */
export const HypixelPanel: React.FC = () => {
  const { access, setKey, setAccount, setProfileId, setExpiresOn, clear: clearKey } = useApiAccess();
  const { refreshApi, apiStatus, apiError, apiProfiles, selectProfile, sources } = useIsland();

  /*
   * Subscribed here for the diagnostic line below.
   *
   * Subscribing is also what asks the store to pull, and that is deliberate
   * rather than a side effect worth apologising for: this panel is where the
   * key is entered, so it is the first place that can ask. It costs nothing
   * extra. The five minute TTL and the floor between attempts are module state
   * in `profileStats.ts`, shared by every subscriber, so adding one more cannot
   * raise the ceiling on requests. It only moves the first pull earlier, which
   * means the planner has its number before it is opened rather than after.
   */
  const greenhouse = useGreenhouseStats();

  const [ign, setIgn] = useState(access.name || access.uuid || "");
  const [resolving, setResolving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  /*
   * Read once per render rather than on a timer. Nothing here ticks: a key that
   * crosses the two day line while the page happens to be open is caught the
   * next time anything re renders, and a countdown that repaints itself every
   * second to move a number nobody is watching is exactly the kind of nagging
   * this panel is supposed to avoid.
   */
  const expiry = useMemo(() => readExpiry(access.keyExpiresOn, Date.now()), [access.keyExpiresOn]);

  const busy = resolving || apiStatus === "loading";

  /*
   * The cooldown, as seconds a person can read.
   *
   * The floor between pulls has always existed and has always been silent: a
   * click inside it started nothing and said nothing, which is exactly what
   * makes somebody click again. Nothing about when a request is allowed changes
   * here. The only change is that the refusal is now visible, so it reads as
   * the site protecting a rate limit rather than as a dead button.
   *
   * The clock is read during render rather than held in state, the same way the
   * key expiry above reads it, because a stored `now` captured at mount would be
   * minutes stale by the time somebody presses the button and would report a
   * cooldown that never happened. The interval only forces the repaint; it does
   * not carry the time. It exists solely while the cooldown is running and
   * clears itself the moment it is over, so the panel keeps no live timer.
   */
  const [, tick] = useState(0);
  const coolingFor = Math.max(0, Math.ceil((apiCooldownUntil() - Date.now()) / 1000));

  useEffect(() => {
    if (coolingFor <= 0) return;
    const id = setInterval(() => tick((n) => n + 1), 500);
    return () => clearInterval(id);
  }, [coolingFor]);

  /*
   * A pull is refused while one is in the air or while the floor is closed.
   * Both buttons below trigger the same pull, so both answer to this: letting
   * Connect through during a cooldown would resolve the account and then
   * silently skip the fetch, which is a worse outcome than a button that says
   * what it is waiting for.
   */
  const cooling = coolingFor > 0;

  const connect = async () => {
    setLocalError(null);
    setResolving(true);
    try {
      const found = await resolveAccount(ign);
      if (!found.ok) {
        setLocalError(found.error.message);
        return;
      }
      // A pasted uuid resolves to no name; keep whatever we already had rather
      // than blanking a name the player can read.
      setAccount(found.value.uuid, found.value.name || access.name);
    } finally {
      setResolving(false);
    }
    await refreshApi(true);
  };

  const verdict =
    access.keyState === "valid" ? (
      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
        <Check className="w-3 h-3" />
        key accepted {access.checkedAt ? ago(access.checkedAt) : ""}
      </span>
    ) : access.keyState === "invalid" ? (
      <span className="inline-flex items-center gap-1 text-[10px] text-red-400">
        <X className="w-3 h-3" />
        key rejected
      </span>
    ) : (
      <span className="text-[10px] text-slate-500">not checked yet</span>
    );

  return (
    <div className={PANEL}>
      <SectionHead
        title="Hypixel API"
        right={
          <span className="inline-flex items-center gap-2">
            {/*
              One chip, beside the status that was already here, and only ever
              when the key is nearly or actually dead. Above two days there is
              nothing to see: the countdown stays in the line below, in grey,
              where somebody who wants it can find it and nobody else is
              interrupted by it.
            */}
            {expiry !== null && expiry.state !== "fine" && (
              <span
                className={
                  expiry.state === "expired"
                    ? "inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400"
                    : "inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-300"
                }
                title="Renew your key at developer.hypixel.net."
              >
                <CalendarClock className="w-3 h-3" />
                {expiryLabel(expiry)}
              </span>
            )}
            {sources.api !== null ? (
              <span className={`text-[10px] ${NUM} text-slate-500`}>pulled {ago(sources.api)}</span>
            ) : (
              <span className={LABEL}>optional</span>
            )}
          </span>
        }
      />

      <div className="p-3 space-y-2.5">
        <p className="text-[11px] text-slate-400 leading-relaxed">
          A key adds your <span className="text-slate-200">sack totals</span> without the mod. It cannot add chests,
          inventory or ender chest. Hypixel does not publish those at any privacy setting, which is why the mod
          exists.
        </p>

        <div className="grid sm:grid-cols-2 gap-2">
          <label className="block">
            <span className={LABEL}>Minecraft username or UUID</span>
            <input
              value={ign}
              onChange={(e) => setIgn(e.target.value)}
              placeholder="Minecraft Username"
              autoComplete="off"
              spellCheck={false}
              className={`${INPUT} w-full mt-1`}
            />
          </label>

          <label className="block">
            <span className={LABEL}>API key</span>
            <input
              // Masked, always. A key on screen is a key in a screenshot.
              type="password"
              value={access.key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="••••••••-••••-••••-••••-••••••••••••"
              {...API_CREDENTIAL_FIELD_ATTRIBUTES}
              spellCheck={false}
              className={`${INPUT} w-full mt-1`}
            />
          </label>

          {/*
            Beside the key, in the same column, because it describes the key and
            nothing else. `sm:col-start-2` keeps it under the key input rather
            than under the username when the grid splits.

            A native date input rather than a text field: it validates itself,
            it speaks the player's own date format whatever that is, and it
            hands back `YYYY-MM-DD` or an empty string and never anything else.
          */}
          <label className="block sm:col-start-2">
            <span className={LABEL}>Key expires on</span>
            <input
              type="date"
              value={access.keyExpiresOn ?? ""}
              onChange={(e) => setExpiresOn(e.target.value)}
              className={`${INPUT} w-full mt-1`}
            />
          </label>
        </div>

        {/*
          The one inline line. Present whether or not a date has been given,
          because the fact that keys expire at all is the part people do not
          know, and it is the reason the empty field above is worth filling in.

          It carries the countdown when there is one, and turns amber only
          inside the last two days. Nothing here appears as a modal, a toast or
          a banner, and nothing asks twice.
        */}
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Hypixel keys expire. Setting the date here is optional and only puts a countdown on this panel.{" "}
          {expiry === null ? (
            <>Nothing is sent anywhere to check it.</>
          ) : expiry.state === "expired" ? (
            <span className="text-red-400">
              This key {expiryLabel(expiry)}.{" "}
              <a
                href="https://developer.hypixel.net"
                target="_blank"
                rel="noreferrer noopener"
                className="underline decoration-red-500/60 hover:text-red-300"
              >
                Renew it at developer.hypixel.net
              </a>
              .
            </span>
          ) : expiry.state === "soon" ? (
            <span className="text-amber-300">
              This key {expiryLabel(expiry)}.{" "}
              <a
                href="https://developer.hypixel.net"
                target="_blank"
                rel="noreferrer noopener"
                className="underline decoration-amber-500/60 hover:text-amber-200"
              >
                Renew it at developer.hypixel.net
              </a>
              .
            </span>
          ) : (
            <span className="text-slate-400">This key {expiryLabel(expiry)}.</span>
          )}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            className={BTN_PRIMARY}
            onClick={connect}
            disabled={busy || cooling || !access.key.trim() || !ign.trim()}
          >
            <KeyRound className="w-3 h-3" />
            {busy ? "Checking…" : sources.api !== null ? "Reconnect" : "Connect"}
          </button>

          <button
            className={BTN_QUIET}
            onClick={() => void refreshApi(true)}
            disabled={busy || cooling || !access.uuid || !access.key.trim()}
            title="Pulls fresh sack totals. Cached for five minutes; there is no background polling."
          >
            <RefreshCw className={`w-3 h-3 ${apiStatus === "loading" ? "motion-safe:animate-spin" : ""}`} />
            {cooling ? `Just refreshed · ${coolingFor}s` : "Refresh"}
          </button>

          {(access.key || access.uuid) && (
            <button className={BTN_QUIET} onClick={clearKey} title="Removes only the stored key and account.">
              <Trash2 className="w-3 h-3" />
              Forget key
            </button>
          )}

          {verdict}
        </div>

        {/*
          The one line, and only while it is true.

          It has to read as the site looking after the key rather than as a
          broken button, which is why it names the reason and not the rule. No
          toast, no modal, no banner: it appears under the buttons that are
          waiting, and it leaves on its own.
        */}
        {cooling && (
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Spacing requests out to protect your Hypixel rate limit. Your sack totals are already up to date.
          </p>
        )}

        {access.uuid && (
          <p className={`text-[10px] ${NUM} text-slate-500 truncate`}>
            {access.name || "account"} · {access.uuid}
          </p>
        )}

        {/*
          The plot count, interpreted, with the evidence in the tooltip.

          This began as a raw-only diagnostic because nobody had written down
          whether PLOT_LIMIT counts plots (1 to 3) or purchased tiers (0 to 2),
          and being wrong by one halves or doubles every estimate. The question
          is now ANSWERED from documentation: the Desk UI page
          (hypixelskyblock.minecraft.wiki/w/The_Desk/UI) shows the upgrade as
          "Current Tier: 0/2", each tier "+1 Greenhouse Plot", so the field
          counts PURCHASED TIERS, base 1 greenhouse, max 3. An absent key is
          the unpurchased default; Hypixel only materialises it once a tier is
          bought, which the one dumped account (1 plot, no key) is consistent
          with.

          So the line now says what the number MEANS, and keeps what the API
          literally said in the tooltip, because the mapping is wiki-documented
          but not yet observed against an account that has purchased a tier.
          The first such account confirms it from this very tooltip.

          `source === "api"` is the render gate rather than a null check so the
          line only ever describes what Hypixel said: it stays silent when
          nothing was read, and silent if a manual overlay ever relabels the
          stat. A raw value the parser DECLINED (outside 0 to 2, so the field
          is not what we believe it is) falls back to the raw-only sentence,
          which is the one honest thing left to say about it.
        */}
        {greenhouse.plots?.source === "api" ? (
          <p
            className="text-[10px] text-slate-500 leading-relaxed"
            title={`garden_upgrades.PLOT_LIMIT: ${greenhouse.rawPlotLimit ?? "absent"} (wiki-documented mapping, unverified against a purchased account)`}
          >
            Greenhouse plots: <span className={`${NUM} text-slate-400`}>{greenhouse.plots.value}</span>{" "}
            {greenhouse.rawPlotLimit === null
              ? "(base, no upgrades purchased)"
              : `(${greenhouse.rawPlotLimit} purchased)`}
          </p>
        ) : (
          greenhouse.rawPlotLimit !== null && (
            <p className="text-[10px] text-slate-500 leading-relaxed">
              API reports PLOT_LIMIT: <span className={`${NUM} text-slate-400`}>{greenhouse.rawPlotLimit}</span>
            </p>
          )
        )}

        {apiProfiles.length > 1 && (
          <label className="block">
            <span className={LABEL}>Profile</span>
            <select
              value={access.profileId ?? apiProfiles.find((p) => p.selected)?.profileId ?? apiProfiles[0].profileId}
              onChange={(e) => {
                setProfileId(e.target.value);
                selectProfile(e.target.value);
              }}
              className={`${INPUT} w-full mt-1`}
            >
              {apiProfiles.map((p) => (
                <option key={p.profileId} value={p.profileId}>
                  {p.cuteName}
                  {p.gameMode ? ` · ${p.gameMode}` : ""}
                  {p.selected ? " · selected in game" : ""}
                </option>
              ))}
            </select>
          </label>
        )}

        {(apiError || localError) && (
          <p className="text-[11px] text-red-400 border-l-2 border-red-500/50 pl-2" role="alert">
            {localError ?? apiError}
          </p>
        )}

        <p className="text-[10px] text-slate-500 leading-relaxed">
          The key is stored in this browser only and is sent to nowhere except api.hypixel.net, as a request header
          rather than in the address. It is never shown unmasked and never included in an error message. Generate one
          at{" "}
          <a
            href="https://developer.hypixel.net"
            target="_blank"
            rel="noreferrer noopener"
            className="text-slate-400 hover:text-emerald-400 underline decoration-slate-700"
          >
            developer.hypixel.net
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default HypixelPanel;
