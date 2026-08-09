import type { GreenhouseStats, ManualGreenhouseStats } from "../../island/profileStats";

/**
 * Which greenhouse numbers the planner actually runs on.
 *
 * Of the four numbers the greenhouse settings ask for, Hypixel now answers two,
 * both read in `src/island/profileStats.ts`:
 *
 *   Growth Speed tier   `garden_upgrades.GROWTH_SPEED`, taken straight.
 *   Plots               derived from `garden_upgrades.PLOT_LIMIT`, which counts
 *                       PURCHASED tiers, so the plot count is that value plus
 *                       the base greenhouse and an absent key is the
 *                       unpurchased default of one plot. That mapping is
 *                       wiki-documented and carries its own citation and its
 *                       own caveats at the derivation; this module consumes the
 *                       answer rather than re-deriving it.
 *
 * The other two are still asked: Crop Growth is computed by Hypixel at runtime
 * and never stored, and Bioanalysis is not on the garden endpoint at all.
 *
 * Both answered numbers are numbers the "from API" chip makes a claim about,
 * and both auto-fill a control the player used to type into. That is the site's
 * standing rule rather than a convenience: any player stat the API exposes gets
 * pulled and never asked, with manual entry as the override and the keyless
 * fallback. Which is exactly why the chip's claim has to be true rather than
 * decorative, and why an auto-filled number may never overwrite a typed one.
 *
 * ## The precedence, in the site's standard order
 *
 *   1. What the player typed. Their word, and it wins outright.
 *   2. What the API said. An auto-filled default for anyone who has not typed.
 *   3. What is in storage. The last resolved value, kept so a reload or an
 *      offline session still shows the tier the player was last running.
 *
 * Identical semantics to island owned counts, the profile inventory overrides
 * and the Ironman toggle: auto-fill is a default, a typed value is the truth,
 * and an override wins from that point until it is withdrawn.
 *
 * ## Why a typed value is persisted separately from the resolved one
 *
 * `growth.speedTier` and `growth.plots` are mirrors of whatever won, so the
 * estimates and the controls read one field each and storage survives a reload.
 * A mirror alone cannot carry precedence: a returning player's stored 7 is
 * indistinguishable from an auto-filled 7, so the next API answer would be free
 * to overwrite it. That is the exact clobber the override pattern exists to
 * prevent.
 *
 * `growth.speedTierManual` and `growth.plotsManual` are therefore the manual
 * layers themselves, persisted, and PRESENCE is the whole signal, exactly as it
 * is for `inventory` in `usePlannerState.ts`. Tier 0 is a real answer, "no
 * upgrades bought", so a stored 0 has to mean that and must not collapse into
 * "has not said". Only absence means the latter, and absence is what hands the
 * field back to the API.
 *
 * The store in `profileStats.ts` is the resolver. This module is what feeds it
 * (`manualGreenhouseLayer`) and what reads its answer back out
 * (`resolveSpeedTier`, `resolvePlots`), so there is one rule in one place rather
 * than a second opinion living in the page.
 *
 * Everything here is pure: no React, no storage, no fetching.
 */

/** The two fields the rule reads. `GrowthConfig` satisfies this structurally. */
export interface SpeedTierState {
  /** The resolved tier, mirrored into storage so it survives a reload. */
  speedTier: number;
  /** The tier the player typed, if they have typed one. Presence is the signal. */
  speedTierManual?: number;
}

/**
 * The tier the player typed, or nothing.
 *
 * A typed check rather than a truthiness check, because 0 is a legitimate tier
 * and `speedTierManual: 0` has to survive this as an override rather than be
 * read as an absent field.
 */
export const typedSpeedTierOf = (growth: SpeedTierState): number | undefined =>
  typeof growth.speedTierManual === "number" && Number.isFinite(growth.speedTierManual)
    ? growth.speedTierManual
    : undefined;

/** The two fields the plots rule reads. `GrowthConfig` satisfies this structurally. */
export interface PlotsState {
  /**
   * The resolved plot count, mirrored into storage so it survives a reload.
   *
   * Optional because a plot count is a planner concern layered on top of the
   * growth model rather than part of it: `GrowthSettings` in `time.ts` carries
   * Crop Growth, the speed tier and the unique crop count and nothing else, and
   * `resolveGrowth` is handed both shapes. A blob with no plot count is left
   * without one rather than being given a field it never had.
   */
  plots?: number;
  /** The count the player typed, if they have typed one. Presence is the signal. */
  plotsManual?: number;
}

/**
 * The plot count the player typed, or nothing.
 *
 * The same typed check as the tier's, for the same reason: presence is the
 * signal, so a `plotsManual: 0` has to survive this as a stated value rather
 * than be read as an absent field. The panel's control offers 1 to 3 and so
 * cannot produce a 0, but a hand-edited storage blob can, and `totalSeconds`
 * already floors the divisor at 1, so a 0 that does arrive is harmless
 * downstream and must not silently hand the field back to the API.
 */
export const typedPlotsOf = (growth: PlotsState): number | undefined =>
  typeof growth.plotsManual === "number" && Number.isFinite(growth.plotsManual)
    ? growth.plotsManual
    : undefined;

/**
 * The numbers the player typed, both of them, in one object.
 *
 * Both keys are REQUIRED, and that is the point of the shape rather than
 * housekeeping. `setManualGreenhouseStats` REPLACES the manual record instead of
 * merging into it, so a layer built from one field silently withdraws the other:
 * a call carrying only plots hands the speed tier back to the API, and a call
 * carrying only the speed tier hands back plots. Mandatory keys mean the
 * compiler refuses a half layer, which turns "one call, both fields, every time"
 * from a rule a caller has to remember into one a caller cannot get wrong.
 *
 * `number | undefined` rather than optional, for the same reason. Withdrawing an
 * override is a real operation and it has to be written down, so a field that
 * nobody has typed is spelled `undefined` at the call site instead of being left
 * off and looking like an oversight.
 */
export interface TypedGreenhouseStats {
  /** The Growth Speed tier the player typed, or `undefined` if they have not. */
  speedTier: number | undefined;
  /** The plot count the player typed, or `undefined` if they have not. */
  plots: number | undefined;
}

/**
 * The manual layer to hand `setManualGreenhouseStats`.
 *
 * `undefined` is not an oversight, it is the withdrawal: passing a field as
 * undefined is how that store is told to let the API value show through again,
 * so clearing a typed number and handing back the field are the same operation.
 *
 * Both stats the API can answer are stated, which is what closes the gap this
 * layer used to leave. It once carried the speed tier alone, because the speed
 * tier was the only stat anything persisted a typed value for, and the panel
 * stayed honest in the meantime only through the value half of its two locks: a
 * typed plot count that differed from the derived one suppressed the chip,
 * because the chip also requires the API's number to be the number on screen.
 * The exact agreement case slipped through, a player who typed the same count
 * the API derived and was still told "from API". The store is told now, so that
 * player's number reads as theirs.
 *
 * `ManualGreenhouseStats.yieldTier` in `profileStats.ts` spells out the
 * constraint that arrived with the second field, and it is worth restating where
 * the layer is actually built: the record is REPLACED rather than merged. A
 * third typed field belongs in this one object, never in a second call from
 * somewhere else, because the second call would wipe the first two.
 */
export const manualGreenhouseLayer = (typed: TypedGreenhouseStats): ManualGreenhouseStats => ({
  growthSpeedTier: typed.speedTier,
  plots: typed.plots,
});

/**
 * The tier that wins.
 *
 * The typed value is checked here as well as inside the store, and that is
 * deliberate rather than redundant. The store's manual layer is session memory
 * seeded by an effect, so on the very first render after a mount it can still
 * be empty while a cached API value from earlier in the session is already
 * published. Checking the persisted typed value first closes that one frame
 * window, which means there is no moment, not even a single paint, where an API
 * number can be displayed over a number the player typed.
 */
export const resolveSpeedTier = (growth: SpeedTierState, stats: GreenhouseStats | null | undefined): number => {
  const typed = typedSpeedTierOf(growth);
  if (typed !== undefined) return typed;

  const stat = stats?.growthSpeedTier;
  if (stat && Number.isFinite(stat.value)) return stat.value;

  return growth.speedTier;
};

/**
 * The plot count that wins.
 *
 * The same three step order as the tier, and the persisted typed value is
 * checked first here for the same reason: the store's manual layer is session
 * memory seeded by an effect, so on the first render after a mount it can be
 * empty while a cached API value is already published, and this closes that one
 * frame window.
 *
 * Returns `undefined` only when nobody has an answer at all, which is the case
 * of a growth blob that carries no plot count and an API that has not been read.
 * That is passed through rather than defaulted to 1, because inventing a count
 * here would hand `resolveGrowth` a field to write onto a shape that never had
 * one. The planner's own default of 1 lives in `usePlannerState.ts`, which is
 * where a default belongs.
 */
export const resolvePlots = (growth: PlotsState, stats: GreenhouseStats | null | undefined): number | undefined => {
  const typed = typedPlotsOf(growth);
  if (typed !== undefined) return typed;

  const stat = stats?.plots;
  if (stat && Number.isFinite(stat.value)) return stat.value;

  return growth.plots;
};

/**
 * The growth settings with the resolved tier and plot count in place.
 *
 * Returns the argument unchanged when both already match, so the identity is
 * stable and a memo downstream is not invalidated by a render that changed
 * nothing. The caller passes the result to both the settings panel and
 * `buildPlanEstimates`, which is what makes the chip and the time estimate two
 * views of one number instead of two numbers that happen to agree.
 *
 * Plots is the second stat to make this trip, and the trip is the point: the
 * derived count auto-fills the Plots control rather than stopping at a chip, so
 * a control the player used to type into becomes API-filled-with-override like
 * everything else the API can answer.
 *
 * THE OVERRIDE HALF IS WIRED, and it is worth recording what it takes, because
 * this function is what makes it load bearing. The rule reads `plotsManual`, so
 * something has to write one: `GrowthConfig` carries the field and
 * `PlannerPage`'s `setGrowthField` routes the Plots control into the manual
 * layer exactly as it routes the speed tier. Without that routing the edit would
 * land on the stored mirror, and a mirror is the LOWEST step here, so a player
 * with a garden read who picked a plot count would have it resolved straight
 * back to the derived one on the next render. The auto-fill and its override are
 * one change for that reason: either together, or the control is read only for
 * anybody with a key.
 *
 * The `undefined` branch is not a formality. `resolvePlots` returns undefined
 * when nothing anywhere has a plot count, and writing that back would put an
 * explicit `plots: undefined` onto a `GrowthSettings` blob that legitimately has
 * no such field. So it is skipped, and such a blob comes back exactly as it went
 * in.
 */
export const resolveGrowth = <T extends SpeedTierState & PlotsState>(
  growth: T,
  stats: GreenhouseStats | null | undefined
): T => {
  const speedTier = resolveSpeedTier(growth, stats);
  const plots = resolvePlots(growth, stats);

  if (speedTier === growth.speedTier && plots === growth.plots) return growth;
  return plots === undefined ? { ...growth, speedTier } : { ...growth, speedTier, plots };
};
