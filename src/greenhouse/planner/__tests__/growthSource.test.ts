import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  applyManualOverrides,
  EMPTY_STATS,
  parseGreenhouseStats,
  type GreenhouseStats,
  type ManualGreenhouseStats,
} from "../../../island/profileStats";
import { GreenhouseSettings } from "../../components/calculator/GreenhouseSettings";
import type { CropDefinition, MutationDefinition } from "../../types/greenhouse";
import {
  manualGreenhouseLayer,
  resolveGrowth,
  resolvePlots,
  resolveSpeedTier,
  typedPlotsOf,
  typedSpeedTierOf,
} from "../growthSource";
import { buildPlanEstimates, type EstimateSettings } from "../planEstimates";
import type { PlotEconomy, SolverPlan, SolverPlanNode } from "../solverPlan";
import type { GrowthConfig } from "../usePlannerState";

/**
 * The greenhouse stats the API can answer, end to end.
 *
 * The settings panel puts a "from API" chip on those, and the chip was once
 * decorative: the API value was fetched and displayed as provenance while the
 * number the estimates ran on came from somewhere else entirely, so the chip
 * could claim a figure the times had never seen. These pin the chain that fixes
 * that, and the ways it could break.
 *
 * Two stats make the trip now rather than one. The Growth Speed tier is read
 * straight off `garden_upgrades.GROWTH_SPEED`; the plot count is derived from
 * `garden_upgrades.PLOT_LIMIT`, which counts purchased tiers, so the count is
 * that plus the base greenhouse and an absent key is the unpurchased default of
 * one. Both follow the same precedence and both fill a control rather than
 * merely labelling one.
 *
 * The dataset is the real bundled one, same as `planEstimates.test.ts`, because
 * the proof that matters is that a resolved tier changes a displayed time.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const raw = JSON.parse(readFileSync(join(ROOT, "public/greenhouse/data.json"), "utf8")) as {
  crops: Record<string, Omit<CropDefinition, "id">>;
  mutations: Record<string, Omit<MutationDefinition, "id">>;
};
const withIds = <T,>(rec: Record<string, T>): Record<string, T & { id: string }> =>
  Object.fromEntries(Object.entries(rec).map(([id, v]) => [id, { ...v, id }]));
const data = { crops: withIds(raw.crops), mutations: withIds(raw.mutations) } as {
  crops: Record<string, CropDefinition>;
  mutations: Record<string, MutationDefinition>;
};

/** Solver answer for one full Choconut plot, captured from the live solver. */
const ECONOMIES: Record<string, PlotEconomy | null> = {
  choconut: { yield: 72, crops: { cocoa_beans: 26 } },
};

const NODE: SolverPlanNode = {
  id: "choconut",
  name: "Choconut",
  kind: "mutation",
  need: 2624,
  have: 0,
  cycle: 0,
  perPlot: 72,
  plots: 37,
};

const PLAN: SolverPlan = {
  cycles: [{ index: 0, produce: [NODE] }],
  depth: 1,
  totalPlantings: 37,
  baseCrops: [], placed: [],
  manual: [],
  unknown: [],
  pending: [],
};

/**
 * A planner growth blob, exactly as `usePlannerState` holds it.
 *
 * `GrowthConfig` carries both manual layers now, `speedTierManual` and
 * `plotsManual`, so this is the real persisted shape rather than the real shape
 * widened by a field the tests needed and storage did not have. The rule still
 * lives in `growthSource.ts` and is still stated structurally; what changed is
 * that something writes the second field.
 */
type Growth = GrowthConfig;

const growthOf = (over: Partial<Growth> = {}): Growth => ({
  cropGrowth: 0,
  speedTier: 0,
  uniqueCrops: 0,
  plots: 1,
  bioanalysis: "none",
  ...over,
});

/** What the store publishes after a garden pull that reported a tier. */
const apiTier = (tier: number): GreenhouseStats =>
  parseGreenhouseStats({ garden: { garden_upgrades: { GROWTH_SPEED: tier } } }, "uuid", 1_700_000_000_000);

/**
 * The same, for a garden that reported a plot limit.
 *
 * `PLOT_LIMIT` counts PURCHASED tiers, so a 2 here is three plots, not two.
 * Deliberately a limit the player has actually bought rather than the absent
 * key: an absent key derives the base 1, which is also the helper default in
 * `growthOf`, and a test where the derived answer and the stored mirror are the
 * same number proves nothing about which of them won.
 */
const apiPlotLimit = (limit: number): GreenhouseStats =>
  parseGreenhouseStats({ garden: { garden_upgrades: { PLOT_LIMIT: limit } } }, "uuid", 1_700_000_000_000);

/**
 * The manual layer the page would send for a given growth blob.
 *
 * One call carrying both typed numbers, which is the only shape
 * `manualGreenhouseLayer` accepts: the store REPLACES the manual record rather
 * than merging into it, so a layer built from one field withdraws the other.
 * Built here once so every test below goes through the same door the page does.
 */
const layerOf = (growth: Growth): ManualGreenhouseStats =>
  manualGreenhouseLayer({ speedTier: typedSpeedTierOf(growth), plots: typedPlotsOf(growth) });

/**
 * The store's own resolution, run for real rather than imitated.
 *
 * The page seeds the manual layer from what the player typed and reads the
 * published result back; `applyManualOverrides` is the function that sits
 * between those two, so calling it here is what makes these tests about the
 * actual seam rather than about a local re-derivation of the same rule.
 */
const published = (api: GreenhouseStats, growth: Growth): GreenhouseStats =>
  applyManualOverrides(api, layerOf(growth));

const secondsFor = (settings: EstimateSettings) =>
  buildPlanEstimates(PLAN, data, ECONOMIES, settings).total.expectedSeconds;

describe("which tier wins", () => {
  it("takes the API value when the player has typed nothing", () => {
    const growth = growthOf();
    expect(resolveSpeedTier(growth, published(apiTier(7), growth))).toBe(7);
  });

  it("takes a typed value over the API's", () => {
    const growth = growthOf({ speedTier: 7, speedTierManual: 2 });
    expect(resolveSpeedTier(growth, published(apiTier(7), growth))).toBe(2);
  });

  /**
   * Tier 0 is "no upgrades bought", a real answer, so a typed 0 is an override
   * and not an empty field. Reading it as absent would silently hand a player
   * who genuinely has no upgrades back to whatever the API claims.
   */
  it("treats a typed tier 0 as the player's word, not as silence", () => {
    const growth = growthOf({ speedTier: 9, speedTierManual: 0 });
    expect(typedSpeedTierOf(growth)).toBe(0);
    expect(resolveSpeedTier(growth, published(apiTier(9), growth))).toBe(0);
  });

  it("falls back to the stored tier when the API has nothing to say", () => {
    const growth = growthOf({ speedTier: 5 });
    expect(resolveSpeedTier(growth, published(EMPTY_STATS, growth))).toBe(5);
    expect(resolveSpeedTier(growth, null)).toBe(5);
  });

  /**
   * The clobber this whole arrangement exists to prevent. A returning player
   * has a typed 2 in storage; the garden pull lands mid session and answers 7.
   * Their number has to survive it, at every step, including the first render
   * before the store has been handed the manual layer.
   */
  it("does not let an API value arriving later replace a typed one", () => {
    const growth = growthOf({ speedTier: 2, speedTierManual: 2 });

    // Before the pull: nothing from the API, the typed value stands.
    expect(resolveSpeedTier(growth, published(EMPTY_STATS, growth))).toBe(2);

    // The pull lands. The store resolves it against the seeded manual layer.
    const after = published(apiTier(7), growth);
    expect(after.growthSpeedTier).toStrictEqual({ value: 2, source: "manual" });
    expect(resolveSpeedTier(growth, after)).toBe(2);

    // And the one frame before the layer is seeded, where the store may still
    // be publishing a cached API value on its own.
    expect(resolveSpeedTier(growth, apiTier(7))).toBe(2);
  });

  /** Withdrawing the override hands the field back rather than pinning a number. */
  it("returns to the API value once the typed one is cleared", () => {
    const cleared = growthOf({ speedTier: 2 });
    expect(layerOf(cleared)).toStrictEqual({ growthSpeedTier: undefined, plots: undefined });
    expect(published(apiTier(7), cleared).growthSpeedTier).toStrictEqual({ value: 7, source: "api" });
    expect(resolveSpeedTier(cleared, published(apiTier(7), cleared))).toBe(7);
  });

  it("keeps the settings identity when nothing had to change", () => {
    const growth = growthOf({ speedTier: 7 });
    expect(resolveGrowth(growth, published(apiTier(7), growth))).toBe(growth);
  });
});

/**
 * The plot count, on the same three rules.
 *
 * It is the second stat the API can answer, derived from
 * `garden_upgrades.PLOT_LIMIT` rather than read straight, and the point of
 * putting it through `resolveGrowth` is that the derived count fills the Plots
 * control instead of stopping at a chip next to a number the player still had
 * to type. So these mirror the tier's cases one for one: the resolved value
 * reaches the consumer, a typed value beats the API's, an API value that lands
 * later cannot displace a typed one, and a typed 0 is a stated value rather than
 * an absent field.
 */
describe("which plot count wins", () => {
  it("takes the derived count when the player has typed nothing", () => {
    const growth = growthOf({ plots: 1 });
    const stats = published(apiPlotLimit(2), growth);

    // Two purchased tiers on top of the base greenhouse.
    expect(stats.plots).toStrictEqual({ value: 3, source: "api" });
    expect(resolvePlots(growth, stats)).toBe(3);
    // The half that matters: it reaches the consumer, not just the chip.
    expect(resolveGrowth(growth, stats).plots).toBe(3);
  });

  it("takes a typed value over the API's", () => {
    const growth = growthOf({ plots: 3, plotsManual: 1 });
    const stats = published(apiPlotLimit(2), growth);

    // The store is told as well, so the source is honest rather than the
    // resolver holding the line on its own while the panel says "from API".
    expect(stats.plots).toStrictEqual({ value: 1, source: "manual" });
    expect(resolvePlots(growth, stats)).toBe(1);
    expect(resolveGrowth(growth, stats).plots).toBe(1);
  });

  /**
   * Presence is the signal, so a typed 0 is the player's word and not an empty
   * field. The panel's control offers 1 to 3 and cannot produce a 0, but a
   * hand-edited storage blob can, and reading it as absent would quietly hand
   * the field back to the API. `totalSeconds` floors the divisor at 1, so the
   * value is harmless downstream; the precedence is the thing being pinned.
   */
  it("treats a typed 0 as the player's word, not as silence", () => {
    const growth = growthOf({ plots: 3, plotsManual: 0 });

    expect(typedPlotsOf(growth)).toBe(0);
    // Presence survives the whole chain, not just the local helper: the layer
    // states the 0 rather than dropping it, and the store reads it as the
    // player's word. A truthiness check anywhere along here would send this
    // player back to the derived 3 without a word about it.
    expect(layerOf(growth)).toStrictEqual({ growthSpeedTier: undefined, plots: 0 });
    expect(published(apiPlotLimit(2), growth).plots).toStrictEqual({ value: 0, source: "manual" });
    expect(resolvePlots(growth, published(apiPlotLimit(2), growth))).toBe(0);
    expect(resolveGrowth(growth, published(apiPlotLimit(2), growth)).plots).toBe(0);
  });

  it("falls back to the stored mirror when the API has nothing to say", () => {
    const growth = growthOf({ plots: 2 });
    expect(resolvePlots(growth, published(EMPTY_STATS, growth))).toBe(2);
    expect(resolvePlots(growth, null)).toBe(2);
  });

  /**
   * The clobber, for plots. A returning player has a typed 1 in storage and the
   * garden pull lands mid session deriving 3.
   *
   * Both locks are in force now, which is the change. The store's manual layer
   * carries plots, so `after.plots` reads `manual`, and the persisted typed
   * value checked inside `resolvePlots` still holds the line independently. The
   * second lock is not redundant: it is what covers the one frame after a mount
   * where the layer has not been seeded yet and a cached API value is already
   * published, which is the last assertion here.
   */
  it("does not let an API value arriving later replace a typed one", () => {
    const growth = growthOf({ plots: 1, plotsManual: 1 });

    // Before the pull.
    expect(resolvePlots(growth, published(EMPTY_STATS, growth))).toBe(1);

    // The pull lands and derives 3. The typed 1 stands anyway.
    const after = published(apiPlotLimit(2), growth);
    expect(after.plots).toStrictEqual({ value: 1, source: "manual" });
    expect(resolvePlots(growth, after)).toBe(1);
    expect(resolveGrowth(growth, after).plots).toBe(1);

    // And the frame before any layer is seeded, straight off the parse.
    expect(resolvePlots(growth, apiPlotLimit(2))).toBe(1);
  });

  it("keeps the settings identity when nothing had to change", () => {
    const growth = growthOf({ speedTier: 7, plots: 3 });
    // A garden with no GROWTH_SPEED leaves the tier on its stored 7, and the
    // derived plot count is already the stored 3, so nothing moves.
    expect(resolveGrowth(growth, published(apiPlotLimit(2), growth))).toBe(growth);
  });

  /**
   * `resolveGrowth` is also handed the bare `GrowthSettings` shape, which has no
   * plot count at all, so "nobody has an answer" has to come back as the blob
   * that went in rather than as one carrying `plots: undefined`.
   */
  it("leaves a growth blob that has no plot count alone", () => {
    const bare = { cropGrowth: 100, speedTier: 5, uniqueCrops: 12 };
    const resolved = resolveGrowth(bare, EMPTY_STATS);

    expect(resolved).toBe(bare);
    expect("plots" in resolved).toBe(false);
  });
});

/**
 * The replacement trap, made explicit.
 *
 * `setManualGreenhouseStats` does `manual = { ...next }`. It REPLACES the manual
 * record rather than merging into it, which is correct while one caller owns it
 * and is a trap the moment that caller has two fields to state: a layer carrying
 * only plots withdraws the tier override, and a layer carrying only the tier
 * withdraws plots. Neither failure raises anything. The player simply finds a
 * number they typed quietly replaced by the API's.
 *
 * So the rule is one call carrying both fields, every time, and these are what
 * hold it. `TypedGreenhouseStats` makes both keys mandatory so a half layer will
 * not compile, and the cases below show what that requirement is buying.
 */
describe("one call carries both overrides", () => {
  it("keeps the tier override when the player has just typed a plot count", () => {
    // They typed a tier of 2 earlier in the session and nothing else.
    const tierOnly = growthOf({ speedTier: 2, speedTierManual: 2 });
    expect(layerOf(tierOnly)).toStrictEqual({ growthSpeedTier: 2, plots: undefined });

    // Now they pick 3 plots. The page rebuilds the whole layer rather than
    // sending a plots-only one, so both typed numbers are restated.
    const both = { ...tierOnly, plotsManual: 3 };
    const layer = layerOf(both);
    expect(layer).toStrictEqual({ growthSpeedTier: 2, plots: 3 });

    // That one call is the entire manual record, and both overrides survive it.
    const stats = applyManualOverrides(apiTier(7), layer);
    expect(stats.growthSpeedTier).toStrictEqual({ value: 2, source: "manual" });
    expect(stats.plots).toStrictEqual({ value: 3, source: "manual" });
  });

  /**
   * The same edit written the wrong way, so the regression has a shape rather
   * than only a description. A plots-only record is what a second call from
   * somewhere else would leave behind, and the tier it was supposed to leave
   * alone comes back as the API's 7.
   */
  it("would lose the tier override to a plots-only record", () => {
    const both = growthOf({ speedTier: 2, speedTierManual: 2, plots: 3, plotsManual: 3 });
    const plotsOnly: ManualGreenhouseStats = { plots: 3 };

    expect(applyManualOverrides(apiTier(7), plotsOnly).growthSpeedTier).toStrictEqual({ value: 7, source: "api" });
    expect(applyManualOverrides(apiTier(7), layerOf(both)).growthSpeedTier).toStrictEqual({ value: 2, source: "manual" });
  });

  /** And the mirror image, because the trap points both ways. */
  it("would lose the plots override to a tier-only record", () => {
    const both = growthOf({ speedTier: 2, speedTierManual: 2, plots: 1, plotsManual: 1 });
    const tierOnly: ManualGreenhouseStats = { growthSpeedTier: 2 };

    // PLOT_LIMIT 2 derives 3, so a withdrawn plots override is visible as the
    // derived count taking the field back.
    expect(applyManualOverrides(apiPlotLimit(2), tierOnly).plots).toStrictEqual({ value: 3, source: "api" });
    expect(applyManualOverrides(apiPlotLimit(2), layerOf(both)).plots).toStrictEqual({ value: 1, source: "manual" });
  });

  /**
   * Withdrawal still works, and works one field at a time. Clearing the tier
   * hands that field back to the API without touching the plot count, which is
   * the property that makes `undefined` a withdrawal rather than a gap.
   */
  it("withdraws one override without disturbing the other", () => {
    const both = growthOf({ speedTier: 2, speedTierManual: 2, plots: 1, plotsManual: 1 });
    const tierCleared = growthOf({ speedTier: 2, plots: 1, plotsManual: 1 });

    expect(layerOf(both)).toStrictEqual({ growthSpeedTier: 2, plots: 1 });
    expect(layerOf(tierCleared)).toStrictEqual({ growthSpeedTier: undefined, plots: 1 });

    const stats = applyManualOverrides(apiPlotLimit(2), layerOf(tierCleared));
    // The garden reported no GROWTH_SPEED, so the withdrawn tier has nothing to
    // fall back to and reads as unanswered rather than as a stale 2.
    expect(stats.growthSpeedTier).toBeNull();
    expect(stats.plots).toStrictEqual({ value: 1, source: "manual" });
  });
});

describe("the resolved tier reaches the estimates", () => {
  /**
   * The point of the whole exercise. A tier of 9 is a 50% faster growth stage
   * than a tier of 0, so if the resolved number reaches `buildPlanEstimates`
   * the plan's expected wall clock has to move with it, and match a run that
   * was handed 9 by hand.
   */
  it("estimates on the API tier when the player has typed nothing", () => {
    const growth = growthOf();
    const resolved = resolveGrowth(growth, published(apiTier(9), growth));

    expect(resolved.speedTier).toBe(9);
    expect(secondsFor(resolved)).toBe(secondsFor(growthOf({ speedTier: 9 })));
    expect(secondsFor(resolved)).toBeLessThan(secondsFor(growth));
  });

  it("estimates on the typed tier when there is one", () => {
    const growth = growthOf({ speedTier: 9, speedTierManual: 0 });
    const resolved = resolveGrowth(growth, published(apiTier(9), growth));

    expect(resolved.speedTier).toBe(0);
    expect(secondsFor(resolved)).toBe(secondsFor(growthOf({ speedTier: 0 })));
    expect(secondsFor(resolved)).toBeGreaterThan(secondsFor(growthOf({ speedTier: 9 })));
  });

  /** The stage clock is the only thing the tier touches, so nothing else moves. */
  it("changes the time and nothing else about the plan", () => {
    const bare = growthOf();
    const fast = resolveGrowth(bare, published(apiTier(9), bare));

    const before = buildPlanEstimates(PLAN, data, ECONOMIES, bare);
    const after = buildPlanEstimates(PLAN, data, ECONOMIES, fast);

    expect(after.byId.choconut.spots).toBe(before.byId.choconut.spots);
    expect(after.byId.choconut.spawnChance).toBe(before.byId.choconut.spawnChance);
    expect(after.byId.choconut.expectedSeconds).toBeLessThan(before.byId.choconut.expectedSeconds);
  });
});

describe("the chip says which source actually won", () => {
  /**
   * Rendered rather than asserted against the predicate, because the claim
   * being tested is the one a player sees. The panel is fed exactly what the
   * page feeds it: one resolved growth object and the stats it was resolved
   * against.
   */
  const panel = (growth: GrowthConfig, stats: GreenhouseStats) =>
    renderToStaticMarkup(
      React.createElement(GreenhouseSettings, { growth: resolveGrowth(growth, stats), onChange: () => {}, stats })
    );

  /** How many chips the panel drew. Four controls, at most one chip each. */
  const chips = (markup: string) => markup.split("from API").length - 1;

  it("shows the chip on a tier that came from the API", () => {
    const growth = growthOf();
    const stats = published(apiTier(7), growth);

    expect(resolveSpeedTier(growth, stats)).toBe(7);
    // Two: the tier's, and the plot count's. A garden with no PLOT_LIMIT key is
    // an unpurchased plot limit rather than an unread one, so plots is answered
    // as a derived 1 and chips alongside the tier.
    expect(chips(panel(growth, stats))).toBe(2);
  });

  it("drops the chip the moment the player has typed one", () => {
    const growth = growthOf({ speedTier: 2, speedTierManual: 2 });
    const stats = published(apiTier(7), growth);

    expect(stats.growthSpeedTier).toStrictEqual({ value: 2, source: "manual" });
    // The tier's chip is gone. The plot count's remains: nothing was typed over
    // it, so it is still the API's number on screen.
    expect(chips(panel(growth, stats))).toBe(1);
  });

  /**
   * Typing the same number the API gave is still an override, so the chip stays
   * off: the number on screen is the player's word that happens to agree, and
   * claiming otherwise would put the API back in charge of a field they took.
   */
  it("stays off when a typed value merely agrees with the API", () => {
    const growth = growthOf({ speedTier: 7, speedTierManual: 7 });
    const stats = published(apiTier(7), growth);

    expect(stats.growthSpeedTier).toStrictEqual({ value: 7, source: "manual" });
    // The plot count's chip, and only that one.
    expect(chips(panel(growth, stats))).toBe(1);
  });

  /**
   * The same claim for the plot count, and the case that was wrong until the
   * layer carried plots.
   *
   * A player who types the count the API happened to derive was still shown
   * "from API", because the chip's two locks are source AND value: the value
   * matched, and the source said `api` for want of anything telling the store
   * otherwise. Nothing about that reading was true. The number on screen was
   * their word, and the panel credited it to Hypixel.
   *
   * The garden here reports PLOT_LIMIT 2, which derives 3, and the player typed
   * 3 as well. No GROWTH_SPEED on this garden, so the tier row cannot chip
   * either: zero chips is the whole panel telling the truth.
   */
  it("stays off when a typed plot count merely agrees with the derived one", () => {
    const growth = growthOf({ plots: 3, plotsManual: 3 });
    const stats = published(apiPlotLimit(2), growth);

    expect(stats.plots).toStrictEqual({ value: 3, source: "manual" });
    expect(resolveGrowth(growth, stats).plots).toBe(3);
    expect(chips(panel(growth, stats))).toBe(0);
  });

  /** Withdrawing it hands the count, and the chip, back to the derivation. */
  it("comes back on plots once the typed count is cleared", () => {
    const typed = growthOf({ plots: 3, plotsManual: 3 });
    const cleared = growthOf({ plots: 3 });

    expect(chips(panel(typed, published(apiPlotLimit(2), typed)))).toBe(0);
    expect(chips(panel(cleared, published(apiPlotLimit(2), cleared)))).toBe(1);
  });

  it("comes back once the override is withdrawn", () => {
    const typed = growthOf({ speedTier: 7, speedTierManual: 7 });
    const cleared = growthOf({ speedTier: 7 });

    // The plots chip is on in both, so the tier's is the one that moves: one
    // chip while the tier is overridden, two once it is handed back.
    expect(chips(panel(typed, published(apiTier(7), typed)))).toBe(1);
    expect(chips(panel(cleared, published(apiTier(7), cleared)))).toBe(2);
  });

  it("shows no chip at all when the API said nothing", () => {
    const growth = growthOf({ speedTier: 5 });
    expect(chips(panel(growth, published(EMPTY_STATS, growth)))).toBe(0);
  });

  /**
   * The stats the API cannot answer never get a chip, whatever they are set to.
   *
   * Two of the four are in that state now rather than three. Crop Growth is
   * computed by Hypixel at runtime and never stored, so there is nothing on the
   * wire to read. Bioanalysis is not on the garden endpoint: it means the best
   * accessory held, which is a question about the accessory bag, and nothing
   * has yet handed this store a bag reading through `setApiBioanalysis`. That
   * second one is currently unanswerable rather than permanently so, and it is
   * worth writing it that way: the bag is base64 gzip NBT, `src/nbt` parses
   * those now, and the accessories layer that reads the bag anyway is the
   * intended caller. When it lands, this test gains a third chip and loses a
   * null, exactly as plots just did.
   */
  it("never chips a stat the API cannot answer for", () => {
    const growth = growthOf({ cropGrowth: 120, plots: 3, bioanalysis: "artifact" });
    const stats = published(apiTier(7), growth);

    expect(stats.cropGrowth).toBeNull();
    expect(stats.bioanalysis).toBeNull();
    // Plots is answered now, and answered without a PLOT_LIMIT key: absence is
    // the unpurchased default, which derives the base single plot.
    expect(stats.plots).toStrictEqual({ value: 1, source: "api" });

    /*
     * Two chips, and the second one is a consequence of `resolveGrowth` rather
     * than of the parse.
     *
     * `plots: 3` here is the stored mirror with no `plotsManual` beside it, and
     * a mirror is the LOWEST of the three precedence steps. So the derived 1
     * outranks it exactly as an API tier outranks a stored tier, the panel is
     * handed a resolved 1, and the chip's value lock is satisfied because the
     * number on screen is the number the API supplied.
     *
     * Worth stating plainly because the pre-resolution reading is tempting and
     * wrong: while `resolveGrowth` touched only the tier, `growth.plots` stayed
     * 3 against a derived 1, the value lock failed and this was one chip. That
     * held right up until plots started being resolved, and it stopped holding
     * the moment it was. One chip here now would mean the Plots control had
     * been left un-auto-filled, which is the thing this change exists to fix.
     */
    expect(chips(panel(growth, stats))).toBe(2);
  });
});
