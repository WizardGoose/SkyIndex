import { useCallback, useSyncExternalStore } from "react";

/**
 * Which game mode you play.
 *
 * This is not cosmetic. On Ironman there is no Bazaar and no Auction House, so
 * "just buy it" is never an answer: every tree has to bottom out in things you
 * personally farm, mine or kill. On a normal profile the cheaper of craft or
 * buy is the right call, and coin costs are meaningful.
 *
 * Backed by a tiny external store rather than component state. The first
 * version used `useState` per component, which meant the nav toggle and the
 * Items page each held their own copy: flipping the toggle updated the nav and
 * localStorage while the page carried on rendering the old mode. Anything read
 * in more than one place has to be genuinely shared.
 *
 * ## Where the value comes from, and who wins
 *
 * The standing rule for this site is that any player stat the API exposes gets
 * pulled from the API and never asked of the player. Game mode is the first
 * *setting* that rule reaches rather than a number in a panel, so the shape it
 * takes here is the one the rest of the site should copy:
 *
 *   default   nobody has said anything. This is a starting value, not a claim.
 *   api       Hypixel told us, and we filled it in. Shown with a "from API"
 *             chip, because a control that changes on its own without saying
 *             why is alarming.
 *   manual    the player set it, and from that moment it is the truth. The API
 *             never overwrites it, not on the next pull, not on a profile
 *             switch, not ever, unless the player asks for detection again.
 *
 * Auto-fill is a default. The player's choice is the truth. That ordering is
 * the whole pattern and it is enforced in one place, `applyApiGameMode`.
 *
 * ## The storage key
 *
 * `wizardsky.profile.v1`, unchanged and unchangeable. The prefix is frozen
 * legacy: existing keys keep their exact names forever and are never renamed or
 * migrated, whatever the site is called. What is added here is a field INSIDE
 * the stored object, which is additive and safe.
 *
 * A blob written before `source` existed has a mode and no provenance. It is
 * read as `manual`, and that is the only defensible reading: nothing in this
 * module has ever written this key except `setMode`, so a stored value can only
 * have come from somebody pressing the toggle. Treating it as a default instead
 * would let the first API pull quietly overwrite a choice the player made, and
 * that is exactly the failure this whole arrangement exists to prevent.
 */

const KEY = "wizardsky.profile.v1";

export type GameMode = "ironman" | "normal";

/** Where the current mode came from. Same vocabulary as `island/profileStats`. */
export type ModeSource = "api" | "manual" | "default";

export interface Profile {
  mode: GameMode;
  source: ModeSource;
}

const DEFAULT: Profile = { mode: "ironman", source: "default" };

/**
 * The keys the build before this store wrote the same choice into. Frozen
 * legacy names, like `KEY` itself. Read here and never written back: this
 * module owns one key and adopting a second author for these would be two
 * sources of truth for one setting.
 */
const LEGACY_MODE_KEY = "skyshards_profile_type";
const LEGACY_FORM_KEY = "calculator_data";

/**
 * The mode a returning player already chose, before this store existed.
 *
 * `KEY` is absent for everyone whose last visit predates it, and `DEFAULT` is
 * Ironman. That default is not inert: CalculatorPage folds this store into
 * `form.ironManView` and is the only author of that field, so an unseeded
 * default rewrites a Normal player's saved form to Ironman on first load,
 * clears their results, and the autosave persists the loss. Reading what they
 * already said is what the rule in the header requires. A starting value is not
 * a claim, and it must not be allowed to outrank one.
 *
 * Two legacy sources, and they carry different weight:
 *
 *   skyshards_profile_type   Written only by the welcome modal, and only in
 *                            answer to a direct "Ironman or Normal?". Either
 *                            value is a real answer, so either is `manual`.
 *   calculator_data          The saved form. `ironManView` defaults to TRUE, so
 *                            a stored `false` proves the player moved off the
 *                            default, and a stored `true` proves nothing.
 *
 * Only `false` is therefore read from the form. Taking `true` as a choice would
 * lock the API out of a setting nobody ever set, which is this same bug facing
 * the other way.
 *
 * `manual` rather than `api` or `default` because a choice is what it is. The
 * player is not stuck with it: `clearModeOverride` hands the setting back to
 * automatic, which is the escape hatch that keeps this from being a trap.
 *
 * Pure, and takes the raw stored strings, so the precedence is pinned without
 * storage.
 */
export const seedFromLegacy = (profileType: string | null, savedForm: string | null): Profile => {
  if (profileType === "normal") return { mode: "normal", source: "manual" };
  if (profileType === "ironman") return { mode: "ironman", source: "manual" };

  try {
    if (savedForm) {
      const parsed: unknown = JSON.parse(savedForm);
      if (typeof parsed === "object" && parsed !== null && (parsed as { ironManView?: unknown }).ironManView === false) {
        return { mode: "normal", source: "manual" };
      }
    }
  } catch {
    // A form blob that will not parse says nothing, so the default stands.
  }

  return DEFAULT;
};

const read = (): Profile => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seedFromLegacy(localStorage.getItem(LEGACY_MODE_KEY), localStorage.getItem(LEGACY_FORM_KEY));
    const parsed = JSON.parse(raw) as Partial<Profile>;
    const mode: GameMode = parsed.mode === "normal" ? "normal" : "ironman";
    const source: ModeSource =
      parsed.source === "api" || parsed.source === "default" || parsed.source === "manual"
        ? parsed.source
        : // No provenance recorded: written by a build that only ever wrote on
          // a manual toggle. See the note above.
          "manual";
    return { mode, source };
  } catch {
    return DEFAULT;
  }
};

let current: Profile = read();
const listeners = new Set<() => void>();

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const getSnapshot = () => current;

const write = (next: Profile) => {
  current = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // In-memory value is still authoritative for this session.
  }
  for (const fn of listeners) fn();
};

// Keep other tabs in step.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    current = read();
    for (const fn of listeners) fn();
  });
}

/**
 * Hypixel's `game_mode` string, turned into one of the two modes this site has.
 *
 * The field is on the profile object and is ABSENT on a normal profile, which
 * is why `null` and `undefined` both mean "normal" rather than "unknown". The
 * three values Hypixel actually sends:
 *
 *   ironman   Ironman. No Bazaar, no Auction House, no trading.
 *   island    Stranded. Strictly more restricted than Ironman on every axis
 *             this site cares about, so it maps to the same answer: nothing
 *             can be bought, so every tree must bottom out in what you gather.
 *   bingo     Bingo. NOT mapped, deliberately. It is a temporary event profile
 *             with its own economy rules, and this site's two modes do not have
 *             an honest slot for it.
 *
 * An unrecognised value returns `null`, which means "we did not understand
 * this" and NOT "normal". A guess here would silently switch someone's whole
 * cost model, which is worse than leaving the toggle where they left it. That
 * is the same rule `island/profileStats.ts` applies to out-of-range tiers.
 */
export const detectGameMode = (raw: string | null | undefined): GameMode | null => {
  if (raw === null || raw === undefined) return "normal";

  const value = raw.trim().toLowerCase();
  if (value === "") return "normal";
  if (value === "ironman" || value === "island") return "ironman";
  return null;
};

/**
 * Fill the mode in from a profile response.
 *
 * The precedence, in the order it is checked:
 *
 *   1. A value we do not recognise says nothing at all, so nothing happens.
 *   2. A manual choice is the truth and outranks the API for good.
 *   3. Otherwise the API value is written, tagged `api` so the chip appears.
 *
 * Note that step 3 fires even when the detected mode equals the current one.
 * That is not a wasted write: going from `default: ironman` to `api: ironman`
 * changes nothing on screen except the provenance chip, and the chip is the
 * difference between "we assumed" and "we checked". The genuine no-op, already
 * `api` and already this mode, is short-circuited.
 */
export const applyApiGameMode = (raw: string | null | undefined): void => {
  const detected = detectGameMode(raw);
  if (detected === null) return;
  if (current.source === "manual") return;
  if (current.source === "api" && current.mode === detected) return;
  write({ mode: detected, source: "api" });
};

/**
 * Hand the setting back to automatic.
 *
 * The escape hatch for "I toggled this months ago and now I want it to follow
 * my profile again". Without it, one accidental click on the toggle would lock
 * the API out permanently, which is a trap rather than a preference. It drops
 * to `default` rather than guessing, and the next pull fills it in.
 */
export const clearModeOverride = (): void => {
  if (current.source !== "manual") return;
  write({ mode: current.mode, source: "default" });
};

/** The mode outside React, for anything that is not a component. */
export const currentProfile = (): Profile => current;

export const useProfile = () => {
  const profile = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  /** A toggle is a statement. It wins from here on, and it says so in storage. */
  const setMode = useCallback((mode: GameMode) => write({ mode, source: "manual" }), []);

  return {
    profile,
    mode: profile.mode,
    ironman: profile.mode === "ironman",
    /** Where the current mode came from. Drives the provenance chip. */
    source: profile.source,
    setMode,
    clearOverride: clearModeOverride,
  };
};
