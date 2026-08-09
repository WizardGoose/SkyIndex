import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, RotateCcw, Save, AlignLeft, Gauge, Menu, X } from "lucide-react";
import { useShardsWithRecipes, useCustomRates } from "../hooks";
import { debounce, formatShardDescription, filterShards, DEFAULT_FILTER_CONFIG } from "../utilities";
import { RarityDropdown, TypeDropdown, ShardItem } from "../components";
import { SHARD_DESCRIPTIONS } from "../constants";
import {
  BTN,
  BTN_PRIMARY,
  BTN_QUIET,
  INPUT,
  PANEL,
  PageHeader,
  SplitPage,
  EmptyState,
  Figure,
  stated,
  Bar,
  COL,
  META,
  RARITY,
  FOCUS,
} from "../ui/kit";
import type { ShardWithDirectInfo } from "../types/types";

/**
 * Every shard, with the hunting rate the solver costs it at.
 *
 * A rate is the only number on this page anyone edits, and it is the input the
 * fusion solver reads, so the page is built to make the whole set scannable
 * rather than to make one card pretty: the rail narrows the set, the strip says
 * what the set currently is, and the grid is the set.
 */
export const SettingsPage: React.FC = () => {
  const { shards, loading: shardsLoading } = useShardsWithRecipes();
  const { customRates, defaultRates, updateRate, resetRates } = useCustomRates();
  const [filter, setFilter] = useState("");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [hasChanges, setHasChanges] = useState(false);
  const [detailedShard, setDetailedShard] = useState(true);

  /** Below the split breakpoint the rail collapses behind one button. */
  const [railOpen, setRailOpen] = useState(false);

  const [debouncedFilter, setDebouncedFilter] = useState("");

  const debouncedSetFilter = useMemo(() => debounce((value: string) => setDebouncedFilter(value), 300), []);
  useEffect(() => {
    debouncedSetFilter(filter);
  }, [filter, debouncedSetFilter]);

  /*
   * The sharp channel. `--sd-split` is 0 by default, so a page that does not
   * open it is one unbroken sheet of frosted glass and the backdrop photograph
   * is never actually seen. This page opens it for the same reason the Crafting
   * page does: its layout already puts a full-height rail in exactly that
   * column, so the split falls on a seam the design already has.
   *
   * Opening it obliges the rail to be drawn on `.sd-glass` rather than on a
   * tint-only panel: over the sharp photograph a tint alone is not enough
   * material to set small text on. Removed on the way out so no other route
   * inherits the split.
   */
  useEffect(() => {
    document.documentElement.classList.add("sd-channel");
    return () => document.documentElement.classList.remove("sd-channel");
  }, []);

  const filteredShards = useMemo(() => {
    return filterShards<ShardWithDirectInfo>(shards, {
      query: debouncedFilter,
      rarity: rarityFilter,
      type: typeFilter as "all" | "direct" | "fuse",
      searchConfig: DEFAULT_FILTER_CONFIG,
    });
  }, [shards, debouncedFilter, rarityFilter, typeFilter]);

  /**
   * What the shard set actually holds, counted from the loaded rows.
   *
   * `isDirect` is the dataset's own word for "you can hunt this", so the direct
   * and fusion-only split is read rather than inferred. Every figure here is a
   * count of rows already in hand, so none of them can be a guess.
   */
  const tally = useMemo(() => {
    let direct = 0;
    let rated = 0;
    const byRarity = new Map<string, number>();
    for (const s of shards) {
      if (s.isDirect) direct++;
      if ((defaultRates[s.key] ?? 0) > 0) rated++;
      if (s.rarity) {
        const key = String(s.rarity).toLowerCase();
        byRarity.set(key, (byRarity.get(key) ?? 0) + 1);
      }
    }
    /* Game order, not alphabetical: a rarity ladder read out of order is
     * harder to scan than no order at all. Anything the dataset adds later
     * that this list does not name is appended rather than dropped. */
    const ladder = ["common", "uncommon", "rare", "epic", "legendary"];
    const ranked = [...byRarity.entries()].sort(
      (a, b) => (ladder.indexOf(a[0]) + 1 || 99) - (ladder.indexOf(b[0]) + 1 || 99)
    );
    return { direct, fusionOnly: shards.length - direct, rated, rarities: byRarity.size, ranked };
  }, [shards, defaultRates]);

  /**
   * How many rates the player has actually moved off the default.
   *
   * Counted against `defaultRates` rather than by the presence of a key,
   * because a rate typed back to its default value is not a customisation and
   * saying it is would overstate what the player has changed.
   */
  const customised = useMemo(
    () => Object.entries(customRates).filter(([id, rate]) => rate !== undefined && rate !== defaultRates[id]).length,
    [customRates, defaultRates]
  );

  /** True once the shard list has answered, so the counts may be stated. */
  const ready = !shardsLoading && shards.length > 0;

  const handleRateChange = useCallback(
    (shardId: string, newRate: number | undefined) => {
      updateRate(shardId, newRate);

      // Only show save button if there are actual changes from defaults
      // Check if the new rate is different from the default rate
      const defaultRate = defaultRates[shardId];
      const hasActualChange = newRate !== undefined && newRate !== defaultRate;

      // Check if any other shards have custom rates that differ from defaults
      const otherChanges = Object.entries(customRates).some(([id, rate]) => {
        if (id === shardId) return false; // Skip the current shard being changed
        return rate !== undefined && rate !== defaultRates[id];
      });

      setHasChanges(hasActualChange || otherChanges);
    },
    [updateRate, defaultRates, customRates]
  );

  const handleResetRates = useCallback(() => {
    if (confirm("Are you sure you want to reset all rates to their defaults? This will clear all custom rates.")) {
      resetRates();
      setHasChanges(false);
    }
  }, [resetRates]);

  const handleSave = useCallback(() => {
    setHasChanges(false);
  }, []);

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
  }, []);

  /*
   * The rail: everything that narrows or edits the grid. Text search, rarity
   * and type filters, the description toggle, and the rate reset live here; the
   * count underneath states what the filters currently admit.
   *
   * Drawn on `.sd-glass` rather than on the kit's tint-only panel, because this
   * column sits in the sharp channel opened above and the photograph is its
   * ground. Radius and geometry stay the panel's.
   */
  const rail = (
    <>
      {/* Narrow viewports collapse the rail behind one button. */}
      <div className="min-[900px]:hidden">
        <button onClick={() => setRailOpen(!railOpen)} className={`${BTN_QUIET} w-full justify-center`}>
          {railOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          <span>{railOpen ? "Hide" : "Show"} Filters</span>
        </button>
      </div>

      <section className={`${railOpen ? "block" : "hidden min-[900px]:block"} ws-panel sd-glass rounded-md`}>
        <div className="space-y-2 p-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={filter}
              onChange={handleFilterChange}
              onFocus={() => setFilter("")}
              placeholder="Search by name, perk, or description..."
              className={`${INPUT} w-full pl-8`}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <RarityDropdown value={rarityFilter} onChange={setRarityFilter} />
            <TypeDropdown value={typeFilter} onChange={setTypeFilter} />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDetailedShard((prev) => !prev)}
              aria-pressed={detailedShard}
              className={BTN_QUIET}
            >
              <AlignLeft className="h-4 w-4" />
              <span>{detailedShard ? "Hide Details" : "Show Details"}</span>
            </button>
            <button
              type="button"
              onClick={handleResetRates}
              className={`${BTN} border-red-500/40 bg-red-500/15 text-red-300 hover:border-red-400/55 hover:bg-red-500/25`}
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>
            {hasChanges && (
              <button type="button" onClick={handleSave} className={BTN_PRIMARY}>
                <Save className="h-4 w-4" />
                <span>Save</span>
              </button>
            )}
          </div>

          {!shardsLoading && (
            <p className="text-[11px] text-slate-400">
              Showing {filteredShards.length} of {shards.length} shards
            </p>
          )}
        </div>

        {/*
          The set broken down by rarity, and a second way to narrow it.

          These are the same counts the strip totals, split the way the game
          splits them, so the rail says what the set is made of rather than
          only how to filter it. Each row is the rarity filter it names: the
          dropdown above and this list write the same state, and the active
          row is the one the dropdown is showing.
        */}
        {!shardsLoading && tally.ranked.length > 0 && (
          <div className="border-t border-white/8 p-2.5">
            <div className={`${COL} mb-1.5`}>By rarity</div>
            <div className="space-y-1">
              {tally.ranked.map(([rarity, count]) => {
                const active = rarityFilter === rarity;
                return (
                  <button
                    key={rarity}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setRarityFilter(active ? "all" : rarity)}
                    title={
                      active
                        ? `Showing ${rarity} only. Click again to show every rarity.`
                        : `Show ${rarity} shards only`
                    }
                    className={`flex w-full cursor-pointer items-center gap-2 rounded-sm px-1.5 py-1 text-left transition-colors duration-150 hover:bg-white/8 ${FOCUS} ${
                      active ? "bg-purple-500/15" : ""
                    }`}
                  >
                    <span className={`w-[4.5rem] shrink-0 text-[11px] capitalize ${RARITY[rarity] ?? "text-slate-300"}`}>
                      {rarity}
                    </span>
                    <Bar done={count} total={shards.length} className="min-w-0 flex-1" />
                    <span className={`${META} w-8 shrink-0 text-right text-slate-400`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </>
  );

  const header = (
    <PageHeader
      title="Shard Overview and Rates"
      sub="Base rates in shards per hour. Customize them for more accurate calculations."
      icon={Gauge}
    />
  );

  /*
   * What the set holds, as a strip of figures.
   *
   * Every figure is a dash until the shard list has answered. A zero here would
   * read as "there are none of these", which is a different and false claim
   * while the fetch is still in flight.
   */
  const strip = (
    <div className={`${PANEL} flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-3 py-2`}>
      <Figure label="Shards" value={stated(ready, shards.length)} title="Every shard in the dataset" />
      <Figure label="Showing" value={stated(ready, filteredShards.length)} title="Rows the filters in the rail currently admit" />
      <Figure label="Direct" value={stated(ready, tally.direct)} title="Shards you can obtain by hunting them" />
      <Figure label="Fusion only" value={stated(ready, tally.fusionOnly)} title="Shards with no direct source, so they must be fused" />
      <Figure label="Rated" value={stated(ready, tally.rated)} title="Shards carrying a non-zero base rate" />
      <Figure label="Customised" value={stated(ready, customised)} title="Rates you have moved off their default" />
      <Figure label="Rarities" value={stated(ready, tally.rarities)} title="Distinct rarities present in the set" />
    </div>
  );

  if (shardsLoading) {
    return (
      <SplitPage railLabel="Shard filters" rail={rail}>
        {header}
        {strip}
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500/20 border-t-purple-500" />
        </div>
      </SplitPage>
    );
  }

  return (
    <SplitPage railLabel="Shard filters" rail={rail}>
      {header}
      {strip}

      {filteredShards.length > 0 ? (
        <div className={PANEL}>
          <div className="grid auto-rows-fr grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredShards.map((shard) => {
              const desc = SHARD_DESCRIPTIONS[shard.key as keyof typeof SHARD_DESCRIPTIONS];
              return (
                <ShardItem
                  key={shard.key}
                  shard={shard}
                  title={desc?.title || shard.name}
                  description={formatShardDescription(desc?.description || "No description.")}
                  detailed={detailedShard}
                  rate={customRates[shard.key] !== undefined ? customRates[shard.key]! : defaultRates[shard.key]}
                  defaultRate={defaultRates[shard.key]}
                  onRateChange={handleRateChange}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <div className={PANEL}>
          <EmptyState
            icon={Search}
            title="No shards match"
            hint="Nothing in the set answers this search and filter combination. Widen the rarity or type filter, or clear the search box."
          />
        </div>
      )}
    </SplitPage>
  );
};
