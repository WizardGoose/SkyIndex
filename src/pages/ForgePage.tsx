import React, { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { Hammer, Menu, Search, X } from "lucide-react";
import { useForgeRecipes, formatDuration } from "../items/wikiForge";
import { useRecipes } from "../items/useItemData";
import { norm } from "../items/wikiCrafting";
import { itemResourceVersion, requestItemResource, resourceTierFor, subscribeItemResource } from "../items/itemResource";
import { ItemIcon } from "../ui/ItemIcon";
import { BTN_QUIET, INPUT, NUM, PANEL, PageHeader, RARITY, SectionHead, SplitPage, Tag, TILE_HOVER } from "../ui/kit";

/**
 * The Forge, as its own tab.
 *
 * The framing: a forge tracker/helper in the same spirit as the garden
 * tooling - the Forge gets a front door the way the Greenhouse is the
 * garden's, rather than living only as a recipe panel inside Crafting. This
 * page is the browsing half: every recipe the wiki's forge table states,
 * grouped the way the game groups them, searchable, with cost, clock and
 * HotM gate on every card. The deep half - the full recursive cost tree
 * against what you hold - already exists on the Crafting page, so every card
 * links there instead of growing a second copy of that machinery.
 *
 * Times are the table's base times. Quick Forge and the Cole perk are prose
 * on the wiki, not data, so shortening them here would be a guess; the label
 * says "base" for exactly that reason.
 */

/** Sections in the order the wiki's table presents them. Anything new lands at the end. */
const SECTION_ORDER = [
  "Refining",
  "Forging",
  "Tools",
  "Gear",
  "Reforge Stones",
  "Drill Parts",
  "Perfect Gemstones",
  "Pets",
  "Other",
];

export const ForgePage: React.FC = () => {
  const { index, loading, error } = useForgeRecipes();
  const { items: itemIndex } = useRecipes();
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<string | null>(null);

  /** Below the split breakpoint the rail collapses behind one button. */
  const [railOpen, setRailOpen] = useState(false);

  // For the side effect: the item resource landing recolours cards whose
  // rarity only it knows (forge-only items are not in the crafting module).
  // Requested outright rather than waiting for some icon to exhaust its
  // rungs, because on this page rarity is the point, not a bonus. Guarded
  // inside on freshness, so it is at most one request a day.
  useSyncExternalStore(subscribeItemResource, itemResourceVersion, itemResourceVersion);
  useEffect(() => {
    requestItemResource();
  }, []);

  /** Rarity by normalised name, so a card can wear its item's colour. */
  const tierByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of Object.values(itemIndex)) {
      if (item.tier) map.set(norm(item.name), item.tier.toLowerCase());
    }
    return map;
  }, [itemIndex]);

  const sections = useMemo(() => {
    const present = [...new Set(index.recipes.map((r) => r.section))];
    return [
      ...SECTION_ORDER.filter((s) => present.includes(s)),
      ...present.filter((s) => !SECTION_ORDER.includes(s)).sort(),
    ];
  }, [index.recipes]);

  const needle = query.trim().toLowerCase();
  const shown = useMemo(
    () =>
      index.recipes.filter(
        (r) =>
          (!section || r.section === section) &&
          (!needle ||
            r.name.toLowerCase().includes(needle) ||
            r.ingredients.some((i) => i.name.toLowerCase().includes(needle)))
      ),
    [index.recipes, section, needle]
  );

  const grouped = useMemo(() => {
    const out = new Map<string, typeof shown>();
    for (const s of sections) {
      const rows = shown.filter((r) => r.section === s);
      if (rows.length) out.set(s, rows);
    }
    return out;
  }, [shown, sections]);

  return (
    /* The signature split: search and section filters in the rail under the
       logo, the recipe sections under the tabs. Same furniture positions as
       every page. */
    <SplitPage
      railLabel="Forge filters"
      rail={
        <>
          {/* Narrow viewports collapse the rail behind one button. */}
          <div className="min-[900px]:hidden">
            <button onClick={() => setRailOpen(!railOpen)} className={`${BTN_QUIET} w-full justify-center`}>
              {railOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              <span>{railOpen ? "Hide" : "Show"} Filters</span>
            </button>
          </div>

          <div className={`${railOpen ? "block" : "hidden min-[900px]:block"} space-y-3`}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search recipes and ingredients"
                className={`${INPUT} w-full pl-8`}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            {/* Section chips wrap to the rail's width; picking one filters the grid. */}
            <div className="flex flex-wrap gap-1.5">
              {sections.map((s) => {
                const active = section === s;
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSection(active ? null : s)}
                    className={`cursor-pointer rounded-md border px-2.5 py-1 text-[12px] transition-colors ${
                      active
                        ? "border-emerald-500/45 bg-emerald-500/15 text-emerald-200"
                        : "border-white/12 bg-white/8 text-slate-300 hover:bg-white/12 hover:text-slate-100"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      }
    >
      <PageHeader
        title="The Forge"
        sub="Every forge recipe: what it takes, how long it runs, what it needs unlocked."
        icon={Hammer}
      />

      {loading && index.recipes.length === 0 && (
        <p className={`${PANEL} px-3 py-4 text-[12px] text-slate-400`}>Reading the forge table from the wiki.</p>
      )}
      {error && index.recipes.length === 0 && (
        <p className={`${PANEL} border-l-2 border-red-500/50 px-3 py-4 text-[12px] text-red-400`} role="alert">
          The wiki&rsquo;s forge table could not be read: {error}
        </p>
      )}
      {!loading && index.recipes.length > 0 && shown.length === 0 && (
        <p className={`${PANEL} px-3 py-4 text-[12px] text-slate-400`}>
          No forge recipe matches <span className="text-slate-200">{query.trim()}</span>.
        </p>
      )}

      {[...grouped].map(([sectionName, recipes]) => (
        <section key={sectionName} className={PANEL}>
          <SectionHead
            title={sectionName}
            right={<span className={`text-[11px] ${NUM} text-slate-500`}>{recipes.length}</span>}
          />
          <div className="grid gap-2 p-2 sm:grid-cols-2 xl:grid-cols-3">
            {recipes.map((recipe) => {
              const tier = tierByName.get(norm(recipe.name)) ?? resourceTierFor(recipe.name);
              return (
                <Link
                  key={recipe.name}
                  to={`/items?q=${encodeURIComponent(recipe.name)}`}
                  title="Open in Crafting for the full cost tree against what you hold"
                  className={`${TILE_HOVER} group flex flex-col gap-2 p-2.5`}
                >
                  <span className="flex items-center gap-2">
                    {/* The icon resolves from the table's own icon-cell title when it
                        differs from the article: `File:Ammonite.png` does not exist,
                        `File:Ammonite Pet.png` does. See ForgeRecipe.wikiTitle. */}
                    {/* 32 rather than 24: wiki thumbs are 64px pixel art, and only
                        integer halvings (16/32/64) downscale without smearing. */}
                    <ItemIcon name={recipe.wikiTitle ?? recipe.name} size={32} />
                    <span
                      className={`min-w-0 flex-1 truncate text-[13px] font-medium ${
                        tier ? RARITY[tier] ?? "text-slate-100" : "text-slate-100"
                      }`}
                    >
                      {recipe.name}
                    </span>
                  </span>

                  <span className="flex flex-wrap items-center gap-1.5">
                    {recipe.ingredients.map((ing) => (
                      <Tag key={ing.name}>
                        <ItemIcon name={ing.name} size={14} />
                        <span className={NUM}>{ing.qty.toLocaleString("en-US")}x</span>
                        <span className="max-w-[10rem] truncate">{ing.name}</span>
                      </Tag>
                    ))}
                    {recipe.coins !== null && (
                      <Tag>
                        <span className={NUM}>{recipe.coins.toLocaleString("en-US")}</span> coins
                      </Tag>
                    )}
                  </span>

                  <span className="mt-auto flex items-center gap-1.5">
                    {recipe.seconds !== null && (
                      <Tag accent title="Base forge time. Quick Forge and Cole shorten it in game.">
                        {formatDuration(recipe.seconds)} base
                      </Tag>
                    )}
                    {recipe.hotm !== null && (
                      <Tag title={recipe.requirement ?? undefined}>HotM {recipe.hotm}</Tag>
                    )}
                    <span className="ml-auto text-[11px] text-slate-500 transition-colors group-hover:text-emerald-300">
                      cost tree
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </SplitPage>
  );
};

export default ForgePage;
