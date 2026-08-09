import React, { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, ChevronRight, ChevronDown, Hammer, ShoppingCart, HelpCircle, Menu, Package, Trophy, Coins, Flame, Store, X } from "lucide-react";
import { useRecipes, useBazaar, buildCostTree, collectRawMaterials, sumNpcValue, formatCoins, type CostNode, type Item } from "../items/useItemData";
import { useProfile } from "../profile/useProfile";
import { ItemIcon } from "../ui/ItemIcon";
import { WikiLink } from "../ui/WikiLink";
import { fetchMaterialChains, readChainCache, writeChainCache, type ChainIndex } from "../items/materialChain";
import { useForgeRecipes, mergeForgeItems, formatDuration, type ForgeRecipe } from "../items/wikiForge";
import { useShopStock, describeCosts, type ShopListing } from "../items/wikiShops";
import { norm, slug } from "../items/wikiCrafting";
import { itemResourceVersion, resourceHasId, resourceTierFor, subscribeItemResource } from "../items/itemResource";
import { useAdminItems, isTestingItem } from "../items/wikiAdmin";
import { fetchWikiTiers, readTierCache, tierCacheFresh, writeTierCache, type WikiTierCache } from "../items/wikiTiers";
import { useOwned, describeSources, type OwnedIndex } from "../inventory";
import {
  PANEL,
  TILE,
  LABEL,
  NUM,
  PageHeader,
  INPUT,
  SectionHead,
  SplitPage,
  BTN_QUIET,
  FOCUS,
  META,
  BADGE,
  COL,
  Figure,
  stated,
} from "../ui/kit";

/**
 * Crafting trees for every craftable item.
 *
 * Each node answers one question: cheaper to craft this, or buy it? Prices are
 * live from the bazaar. Only about a quarter of items are bazaar tradeable, so
 * an unpriced node reads as "unknown" rather than free, and an unpriced branch
 * can never make a tree look cheaper than it is.
 */

/**
 * Rarity colours are game data, so they live on their own `--color-rarity-*`
 * tokens rather than on the generic Tailwind ramps.
 *
 * The ramps were the wrong home for them. Those steps get retinted whenever
 * the interface palette moves, and a rarity that follows the theme is simply
 * wrong: EPIC was `purple-400`, which turned blue the moment the shard suite's
 * purple was folded into the accent, and DIVINE was `cyan-300`, which sat a
 * few degrees off the accent and so read as something clickable. Pinning them
 * to their own namespace makes them immune to the next palette change.
 */
const TIER: Record<string, string> = {
  COMMON: "text-rarity-common",
  UNCOMMON: "text-rarity-uncommon",
  RARE: "text-rarity-rare",
  EPIC: "text-rarity-epic",
  LEGENDARY: "text-rarity-legendary",
  MYTHIC: "text-rarity-mythic",
  DIVINE: "text-rarity-divine",
  SPECIAL: "text-rarity-special",
  VERY_SPECIAL: "text-rarity-very-special",
  SUPREME: "text-rarity-supreme",
};

/*
 * META, BADGE, COL, Figure and stated are the kit's dense-row type ladder,
 * imported above. They were written here first and now live in ui/kit.tsx so
 * the shard pages carry the same ladder rather than three copies of it.
 */

/**
 * A coin figure, or one dash when there is no figure to give.
 *
 * `formatCoins` answers "?" for an absent price, which is fine for a lone
 * number in a tile and wrong in a column: the tree and the gather list sit one
 * above the other with the same items in them, so the same missing price was
 * being written "?" in one table and "-" in the other, two glyphs for one
 * fact. A column needs a single token for "nothing here", and the dash is the
 * one the held counts have always used.
 */
const coins = (n: number | null): string => (n === null || !Number.isFinite(n) ? "-" : formatCoins(n));

/**
 * Item icon, loaded straight from the wiki.
 *
 * The URL is derived from the item name, so no API lookup is needed and no
 * image is copied into this project. The wiki serves its own CC BY-NC-SA
 * content to the visitor's browser, which keeps the share-alike clause off our
 * build entirely.
 *
 * About 5% of items have no wiki image, so a miss falls back to initials
 * rather than a broken-image glyph or a gap that breaks the row rhythm.
 */
/*
 * The local copy of this component moved to `src/ui/ItemIcon.tsx` so the Items,
 * Island and Planner pages all resolve icons the same way. The shared version
 * also tracks failures by URL rather than with a boolean, so a recycled row
 * whose item changed retries instead of staying stuck on the previous miss.
 */

const ACTION = {
  craft: { icon: Hammer, cls: "text-emerald-400", label: "craft" },
  buy: { icon: ShoppingCart, cls: "text-blue-400", label: "buy" },
  unknown: { icon: HelpCircle, cls: "text-slate-500", label: "no price" },
} as const;

/**
 * The tree's lane widths, shared by the header row and by every node row.
 *
 * They live here rather than inline in both places so a lane can never drift
 * out of alignment with its own caption: the header and the rows read the same
 * constants, so widening a lane widens both at once. Right aligned, because
 * every one of them holds a number and a column of numbers is read up its
 * right edge.
 */
const LANE_ROUTE = "w-20 shrink-0 text-right";
const LANE_COIN = "w-28 shrink-0 text-right";
const LANE_COUNT = "w-24 shrink-0 text-right";

/**
 * The floor under the name column, and why the tables scroll sideways.
 *
 * Fixed lanes do not shrink, so on a narrow content column they take what they
 * need and the name is left with the remainder. With `min-w-0` alone that
 * remainder can reach nothing, and the column that says WHICH ITEM the row is
 * about degrades to "Hyp..." and then to an ellipsis, which is the one thing
 * on the row that must never become unreadable.
 *
 * A floor of 8rem stops that. Below the width where everything fits, the row
 * overflows its container and the container scrolls, which keeps every figure
 * under its own caption. A table that is too wide and scrolls is legible; a
 * table that silently eats its first column is not.
 */
const LANE_NAME = "min-w-[8rem] flex-1";

/**
 * One node of the cost tree.
 *
 * The row used to spend its whole width on nothing: name at the left, one coin
 * figure pinned to the far right, and about a thousand pixels of blank between
 * them, so reading a row meant tracking across an empty gap and reading a
 * number with no column to compare it against. The figures the gather list
 * already computes fill that width instead, as real labelled lanes.
 *
 * `owned` is null when no source knows anything at all about what is held, and
 * the two held-derived lanes then disappear rather than printing a column of
 * dashes: an empty column is worse than no column, and it also invites the
 * reader to believe a dash means zero.
 */
const TreeRow: React.FC<{
  node: CostNode;
  depth?: number;
  defaultOpen?: boolean;
  ironman?: boolean;
  owned: OwnedIndex | null;
}> = ({ node, depth = 0, defaultOpen = false, ironman = false, owned }) => {
  // Only auto-open branches we would actually craft. A "buy" branch is a leaf
  // decision, so expanding it by default is noise. On Ironman nothing is a buy
  // decision, so open the first couple of levels instead.
  const [open, setOpen] = useState(defaultOpen || (ironman ? depth < 2 : depth === 0 && node.action === "craft"));
  const hasChildren = node.children.length > 0;
  const meta = ACTION[node.action];
  const Icon = meta.icon;

  /*
   * What you hold against what this node needs. `held` stays undefined rather
   * than 0 when no source has ever mentioned the item, and an undefined held
   * makes the shortfall unknowable too: subtracting from a number nobody
   * stated would print the full quantity and assert you have none of it. Both
   * lanes say "not known" instead, which is the only claim the data supports.
   */
  const held = owned ? owned.count(node.id) : undefined;
  const missing = held === undefined ? null : Math.max(0, node.qty - held);

  return (
    <>
      <div
        className="ws-row flex items-center gap-3 border-b border-white/8 px-2 py-1 hover:bg-white/8"
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        <button
          onClick={() => hasChildren && setOpen(!open)}
          className={`shrink-0 rounded-sm ${FOCUS} ${hasChildren ? "text-slate-500 hover:text-slate-200 cursor-pointer" : "text-transparent cursor-default"}`}
          aria-label={open ? "Collapse" : "Expand"}
        >
          {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        {/* The quantity stays HERE, beside the name, rather than moving into a
            lane on the right. It is the one number you read as part of the
            name ("163,840x Enchanted Bread" is a single phrase), so pushing it
            into the column block would recreate, for the most important figure
            on the row, exactly the separation this layout exists to close. The
            header names this lane "need", which is what it is. */}
        <span className={`text-[11px] ${NUM} text-slate-500 shrink-0 w-14 text-right`}>{node.qty.toLocaleString()}x</span>

        {/* The icon resolves from the item's preferred wiki title when it has
            one (the forge pets file their image under "<Name> Pet"); the link
            below keeps the article name, because the article is the article. */}
        <ItemIcon id={node.id} name={node.wikiTitle ?? node.name} />

        <WikiLink
          name={node.name}
          className={`${LANE_NAME} text-[11px] ${TIER[node.tier ?? ""] ?? "text-slate-300"}`}
          nameClassName="truncate"
        />

        {node.alternatives && (
          <span className={`${BADGE} shrink-0 text-slate-500`} title={node.alternatives.map((a) => a.name).join(" or ")}>
            or {node.alternatives.length}
          </span>
        )}

        {/*
          Ironman has no bazaar, so the craft-or-buy decision does not exist and
          its lane is not drawn at all. What is left is what an NPC would pay,
          which is the only coin figure the mode still has.

          The icon now carries its own word. It was a bare 12px glyph in the
          middle of the row, which meant the legend underneath had to exist to
          translate it; a glyph with its label beside it explains itself and
          gives the row a lane that lines up with a caption like every other.
        */}
        {!ironman && (
          <span className={`${LANE_ROUTE} ${BADGE} flex items-center justify-end gap-1 ${meta.cls}`} title={`Cheaper to ${meta.label}`}>
            <Icon className="h-3 w-3 shrink-0" />
            {meta.label}
          </span>
        )}

        <span
          className={`${LANE_COIN} ${META} ${
            ironman
              ? node.npcValue === null
                ? "text-slate-500"
                : "text-slate-200"
              : node.cost === null
              ? "text-slate-500"
              : "text-slate-200"
          }`}
          title={
            ironman
              ? node.npcValue === null
                ? "No known NPC price"
                : "What an NPC pays for this quantity"
              : node.cost === null
              ? "Not on the bazaar, so there is no price to state"
              : "Cheapest of buying it or crafting it"
          }
        >
          {ironman ? coins(node.npcValue) : coins(node.cost)}
        </span>

        {/* A valuation, never a purchase option: you cannot buy this back from
            a shop at this figure, which is why it never feeds the decision in
            the lane before it and why it keeps its own caption. */}
        {!ironman && (
          <span
            className={`${LANE_COIN} ${META} ${node.npcValue === null ? "text-slate-500" : "text-slate-400"}`}
            title={node.npcValue === null ? "No known NPC price" : "What an NPC would pay for this quantity"}
          >
            {coins(node.npcValue)}
          </span>
        )}

        {owned && (
          <span
            className={`${LANE_COUNT} ${META} ${held === undefined ? "text-slate-500" : "text-slate-300"}`}
            title={held === undefined ? "No source has mentioned this item" : describeSources(owned.get(node.id)) || `${held.toLocaleString()} held`}
          >
            {held === undefined ? "-" : held.toLocaleString()}
          </span>
        )}

        {owned && (
          <span
            className={`${LANE_COUNT} ${META} font-medium ${
              missing === null ? "text-slate-500" : missing === 0 ? "text-emerald-400" : "text-slate-100"
            }`}
            title={
              missing === null
                ? "Not known, because nothing has said how many you hold"
                : missing === 0
                ? "You already have enough"
                : "Still to obtain"
            }
          >
            {missing === null ? "-" : missing === 0 ? "done" : missing.toLocaleString()}
          </span>
        )}
      </div>

      {open &&
        node.children.map((c, i) => <TreeRow key={`${c.id}-${i}`} node={c} depth={depth + 1} ironman={ironman} owned={owned} />)}
    </>
  );
};

/**
 * The caption row above the tree, naming every lane once.
 *
 * It replaces the icon legend that used to sit here. The legend existed only
 * to translate three bare glyphs; now that the route lane prints its own word,
 * translating it a second time is a row of chrome that says nothing the row
 * beneath it does not already say. What the legend genuinely carried, the
 * warning that an NPC figure is not a price you can buy at, survives on the
 * lane's own tooltip and in the Ironman note.
 */
const TreeHead: React.FC<{ ironman: boolean; owned: OwnedIndex | null }> = ({ ironman, owned }) => (
  <div className={`flex items-center gap-3 border-b border-white/10 px-2 py-1.5 ${COL}`}>
    <span className="w-3 shrink-0" />
    <span className="w-14 shrink-0 text-right">need</span>
    <span className="w-4 shrink-0" />
    <span className={LANE_NAME}>item</span>
    {!ironman && <span className={LANE_ROUTE}>route</span>}
    <span className={LANE_COIN}>{ironman ? "npc" : "cost"}</span>
    {!ironman && <span className={LANE_COIN}>npc</span>}
    {owned && <span className={LANE_COUNT}>have</span>}
    {owned && <span className={LANE_COUNT}>missing</span>}
  </div>
);

/**
 * Every known way to obtain an item, and what it feeds into.
 *
 * Sources are only listed when the data actually proves them: a collection
 * unlock from the wiki's Collection module, bazaar presence from live prices,
 * NPC sale from the Hypixel item metadata. Absence of a source here means we
 * have no data for it, not that the item is unobtainable, and the panel says
 * so rather than implying the list is exhaustive.
 *
 * Two TILE cards rather than one flush band: sources and uses are things you
 * read as units, not rows you scan, which is exactly the side of the line the
 * TILE note in ui/kit.tsx puts tiles on.
 */
const ItemSources: React.FC<{
  item: Item;
  items: Record<string, Item>;
  bazaar: Record<string, { buy: number; sell: number }>;
  ironman: boolean;
  /** The item's forge recipe, when the Forge table lists one. */
  forge: ForgeRecipe | null;
  /** Every NPC shop listing that sells the item, from the wiki's shop UIs. */
  soldBy: ShopListing[];
  /** True when `item.recipe` is the forge recipe rather than a crafting grid. */
  forgeFed: boolean;
  /** True while the shop stock is still being fetched, so absence is not claimed. */
  shopsPending: boolean;
  onPick: (id: string) => void;
}> = ({ item, items, bazaar, ironman, forge, forgeFed, soldBy, shopsPending, onPick }) => {
  const onBazaar = !ironman && item.hypixelId ? bazaar[item.hypixelId] : undefined;
  const usedIn = item.usedIn ?? [];

  const sources: { icon: React.ReactNode; label: string; detail?: string }[] = [];

  /**
   * "Crafting" is only claimed for a grid recipe the crafting module states.
   * A forge-fed `recipe` also lands in `item.recipe` so the cost tree can run,
   * but calling that "Crafting" would state the wrong acquisition route, so
   * the forge entry below owns it instead.
   */
  if (item.recipe && !forgeFed) {
    sources.push({
      icon: <Hammer className="w-3 h-3 text-emerald-400" />,
      label: "Crafting",
      detail: `${item.recipe.length} ingredient${item.recipe.length === 1 ? "" : "s"}${item.yields > 1 ? `, makes ${item.yields}` : ""}`,
    });
  }

  if (forge) {
    const bits = [
      `${forge.ingredients.length} ingredient${forge.ingredients.length === 1 ? "" : "s"}`,
      forge.seconds !== null ? formatDuration(forge.seconds) : forge.duration ?? "duration not stated",
      forge.hotm !== null ? `HotM ${forge.hotm}` : null,
    ].filter(Boolean);
    sources.push({
      icon: <Flame className="w-3 h-3 text-emerald-400" />,
      label: "Forge",
      detail: bits.join(", "),
    });
  }

  for (const listing of soldBy.slice(0, 6)) {
    sources.push({
      icon: <Store className="w-3 h-3 text-blue-400" />,
      label: `Sold by ${listing.npc}`,
      detail: `${listing.offer.stack > 1 ? `${listing.offer.stack}x for ` : ""}${describeCosts(listing.offer.costs)}`,
    });
  }
  if (soldBy.length > 6) {
    sources.push({
      icon: <Store className="w-3 h-3 text-blue-400" />,
      label: `and ${soldBy.length - 6} more shops`,
    });
  }

  for (const u of item.unlocks ?? []) {
    sources.push({
      icon: <Trophy className="w-3 h-3 text-amber-400" />,
      label: `${u.collection} collection ${u.tier}`,
      detail: `${u.required.toLocaleString()} collected${u.type === "Recipe" ? " unlocks the recipe" : u.type === "Trade" ? " unlocks an NPC trade" : " unlocks a Forge recipe"}`,
    });
  }

  if (onBazaar) {
    sources.push({
      icon: <ShoppingCart className="w-3 h-3 text-blue-400" />,
      label: "Bazaar",
      detail: `buy ${formatCoins(onBazaar.buy)}, sell ${formatCoins(onBazaar.sell)}`,
    });
  }

  if (item.npcSell !== null) {
    sources.push({
      icon: <Coins className="w-3 h-3 text-slate-400" />,
      label: "Sells to NPC",
      detail: `${formatCoins(item.npcSell)} each`,
    });
  }

  return (
    <div className="border-b border-white/8 p-2.5 grid grid-cols-1 lg:grid-cols-2 gap-2">
      <div className={`${TILE} px-2.5 py-2`}>
        <h3 className={`${LABEL} mb-1.5`}>Where to get it</h3>
        {sources.length === 0 ? (
          <p className="text-[12px] text-slate-500">
            No source in our data. Crafting, the Forge and NPC shop stock have all been checked
            {shopsPending ? " (shop stock is still loading)" : ""}, so it likely drops from a mob, comes from an event, or is a quest reward, none of
            which the wiki exposes as structured data.
          </p>
        ) : (
          <ul className="space-y-1">
            {sources.map((s, i) => (
              <li key={i} className="flex items-baseline gap-1.5">
                <span className="translate-y-px">{s.icon}</span>
                <span className="text-[12px] text-slate-200">{s.label}</span>
                {s.detail && <span className="text-[11px] text-slate-500">{s.detail}</span>}
              </li>
            ))}
          </ul>
        )}
        {ironman && onBazaar === undefined && item.hypixelId && bazaar[item.hypixelId] && (
          <p className="text-[11px] text-slate-500 mt-1">Tradeable on the Bazaar, but not on Ironman.</p>
        )}
      </div>

      <div className={`${TILE} px-2.5 py-2`}>
        <h3 className={`${LABEL} mb-1.5`}>
          Used in{item.usedInTotal ? ` (${item.usedInTotal})` : ""}
        </h3>
        {usedIn.length === 0 ? (
          <p className="text-[12px] text-slate-500">Not an ingredient in any known recipe.</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {usedIn.map((u) => (
              <button
                key={u}
                onClick={() => onPick(u)}
                className={`flex cursor-pointer items-center gap-1 rounded-sm border border-white/12 bg-white/8 px-1.5 py-0.5 text-[11px] text-slate-300 hover:border-emerald-500/40 hover:bg-white/12 hover:text-emerald-200 ${FOCUS}`}
              >
                <ItemIcon id={u} name={items[u]?.wikiTitle ?? items[u]?.name ?? u} size={14} />
                {items[u]?.name ?? u}
              </button>
            ))}
            {item.usedInTotal && item.usedInTotal > usedIn.length && (
              <span className="text-[11px] text-slate-500 self-center">and {item.usedInTotal - usedIn.length} more</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * The Forge route for an item, stated the way the wiki's Forge table states
 * it: components, coins, duration and the Heart of the Mountain gate.
 *
 * This exists separately from the tree because forging is not crafting. When
 * the item has no grid recipe the tree runs through these same components and
 * this panel says so; when it has both, this is the alternative route and the
 * tree above stays the crafting one.
 */
const ForgeSection: React.FC<{
  recipe: ForgeRecipe;
  items: Record<string, Item>;
  /** True when the cost tree on screen is running this forge recipe. */
  forgeFed: boolean;
  /** True when a crafting grid recipe also exists, so this is the second route. */
  hasGridRecipe: boolean;
  onPick: (id: string) => void;
}> = ({ recipe, items, forgeFed, hasGridRecipe, onPick }) => (
  <div className="border-b border-white/8 px-3 py-2.5">
    <div className="flex items-baseline justify-between gap-3 mb-1.5 flex-wrap">
      <h3 className={`${LABEL} flex items-center gap-1.5`}>
        <Flame className="w-3 h-3 text-emerald-400" />
        Forge recipe
      </h3>
      <div className="flex items-baseline gap-3 text-[11px] text-slate-500">
        <span title="Base forge time, before Quick Forge or Cole reductions">
          <span className={`${NUM} text-slate-300`}>
            {recipe.seconds !== null ? formatDuration(recipe.seconds) : recipe.duration ?? "duration not stated"}
          </span>{" "}
          base
        </span>
        {recipe.hotm !== null && (
          <span title="Heart of the Mountain tier required">
            HotM <span className={`${NUM} text-slate-300`}>{recipe.hotm}</span>
          </span>
        )}
        {recipe.requirement && <span title="Additional requirement, as the wiki states it">{recipe.requirement}</span>}
      </div>
    </div>

    {recipe.ingredients.length === 0 && recipe.coins === null ? (
      <p className="text-[12px] text-slate-500">
        The Forge table lists this item but its cost cell did not parse, so no ingredient list can be shown. The wiki has the row.
      </p>
    ) : (
      <div className="flex flex-wrap gap-1">
        {recipe.ingredients.map((ing) => {
          const id = slug(ing.name);
          const known = Boolean(items[id]);
          const inner = (
            <>
              <span className={`${NUM} text-slate-500`}>{ing.qty.toLocaleString()}x</span>
              <ItemIcon id={id} name={items[id]?.wikiTitle ?? ing.name} size={14} />
              {ing.name}
            </>
          );
          return known ? (
            <button
              key={ing.name}
              onClick={() => onPick(id)}
              className={`flex cursor-pointer items-center gap-1 rounded-sm border border-white/12 bg-white/8 px-1.5 py-0.5 text-[11px] text-slate-300 hover:border-emerald-500/40 hover:bg-white/12 hover:text-emerald-200 ${FOCUS}`}
            >
              {inner}
            </button>
          ) : (
            <WikiLink
              key={ing.name}
              name={ing.name}
              className="flex items-center gap-1 rounded-sm border border-white/12 bg-white/8 px-1.5 py-0.5 text-[11px] text-slate-300"
            >
              {inner}
            </WikiLink>
          );
        })}
        {recipe.coins !== null && (
          <span className="flex items-center gap-1 rounded-sm border border-white/12 bg-white/8 px-1.5 py-0.5 text-[11px] text-slate-300">
            <Coins className="w-3 h-3 text-slate-400" />
            <span className={NUM}>{recipe.coins.toLocaleString()}</span> coins
          </span>
        )}
      </div>
    )}

    {forgeFed && (
      <p className="text-[11px] text-slate-500 mt-1.5">The cost tree below runs through this forge recipe; there is no crafting grid for it.</p>
    )}
    {hasGridRecipe && (
      <p className="text-[11px] text-slate-500 mt-1.5">This item can also be crafted; the tree below shows the crafting route.</p>
    )}
  </div>
);

export const ItemsPage: React.FC = () => {
  const { items, loading, error } = useRecipes();
  const bazaar = useBazaar();
  const { ironman } = useProfile();

  /**
   * The landing page's search sends people here with `?q=`, so the box starts
   * with whatever they typed rather than empty. Read once on mount as the
   * initial value, not synced: after that the field belongs to the user, and a
   * URL that kept overwriting it would fight anyone who edited their search.
   */
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [selected, setSelected] = useState<string | null>(null);
  const [craftableOnly, setCraftableOnly] = useState(true);

  /**
   * The two hide-by-default toggles.
   *
   * "Show vanilla" is off by default because this page is for SkyBlock item
   * crafting, not vanilla recipes; "Show unobtainable" is off by default to
   * keep admin-only and testing items out of the list. Two
   * controls rather than one because they hide different claims: a vanilla
   * recipe is real and craftable, just not SkyBlock crafting, while an admin
   * or testing item cannot be obtained at all, and folding ~290 vanilla rows
   * under a checkbox that says "unobtainable" would be the label lying. The
   * hidden counts are stated in the header line, never silent.
   */
  const [showVanilla, setShowVanilla] = useState(false);
  const [showUnobtainable, setShowUnobtainable] = useState(false);

  /** Below the split breakpoint the rail collapses behind one button. */
  const [railOpen, setRailOpen] = useState(false);

  /*
   * The sharp channel. The frosted curtain's left edge is `--sd-split`, which
   * is 0 by default, so a page that does not open it is one unbroken sheet of
   * glass and the backdrop photograph underneath is never actually seen.
   *
   * This page opens it, for the same reason the Profile page does: its layout
   * already puts a full-height rail in exactly that column, so the split falls
   * on a seam the design already has rather than cutting across content. The
   * rail is drawn on `.sd-glass` (below) rather than on the kit's tint-only
   * panel, because over the sharp photograph a tint alone is not enough
   * material to set 10px text on; `.sd-glass` is the pane built for that
   * ground and is what the curtainless dashboard uses.
   *
   * The class lives on <html> so the fixed curtain and the masthead, both
   * outside this component, inherit the variable; index.css owns what it
   * means. Removed on the way out so no other route inherits the split.
   */
  useEffect(() => {
    document.documentElement.classList.add("sd-channel");
    return () => document.documentElement.classList.remove("sd-channel");
  }, []);

  /** The wiki's list of admin-only items, by article title. */
  const admin = useAdminItems();

  /**
   * Breakdowns for items the crafting module does not cover, notably every
   * enchanted item. Learned from the wiki on demand and folded into the index
   * so the tree keeps recursing instead of stopping at "Enchanted X".
   */
  const [chains, setChains] = useState<ChainIndex>(() => readChainCache());

  /**
   * Rarities the wiki states for items Hypixel's resource does not tier
   * (the visible symptom: the Accretion line uncoloured). Learned once a day,
   * batched; see `wikiTiers.ts` for why the resource alone is not enough.
   */
  const [wikiTiers, setWikiTiers] = useState<WikiTierCache>(() => readTierCache());

  /** Forge recipes and NPC shop stock, each fetched from the wiki at runtime. */
  const forge = useForgeRecipes();
  const shops = useShopStock();

  /**
   * The index the page actually renders: the crafting index, plus every forge
   * output (which is what puts Divan armor and the drills on this page at
   * all), plus the on-demand chains. Forge first, chains second, and both only
   * ever fill a recipe that is still null, so a grid recipe always wins and
   * the forge components beat the infobox's flattened material list.
   */
  // Re-render when the Hypixel item resource lands, because the tier fill
  // below reads from it and a forge item should gain its colour the moment
  // the resource does, not on the next unrelated state change.
  const resourceVersion = useSyncExternalStore(subscribeItemResource, itemResourceVersion, itemResourceVersion);

  const enriched = useMemo(() => {
    const withForge = mergeForgeItems(items, forge.index, new Set(Object.keys(bazaar.prices)), resourceHasId);
    let out: Record<string, Item> = withForge;
    const cloned = () => (out === items ? (out = { ...items }) : out);
    if (Object.keys(chains).length) {
      // `mergeForgeItems` returns its input untouched when it has no recipes,
      // so only clone when the chains would otherwise write into `items`.
      cloned();
      for (const [id, recipe] of Object.entries(chains)) {
        if (!recipe || !out[id] || out[id].recipe) continue;
        out[id] = { ...out[id], recipe };
      }
    }
    /*
     * Rarity for the forge-only items (the symptom: Gemstone Chamber lacking
     * colours). They are absent from the crafting module, so their tier
     * comes from Hypixel's item resource, by id when the merge accepted one
     * and by name otherwise; what the resource does not know, the wiki's own
     * tier categories may (the Accretion line, Angler armor - see
     * wikiTiers.ts). `resourceTierFor` answers null for anything it does not
     * know, so an item the crafting index already coloured is never
     * recoloured.
     *
     * The `.toUpperCase()` is a mechanism fix, found live: `resourceTierFor`
     * answers lower case ("epic") while the crafting index and the TIER map
     * both speak Hypixel's upper-snake ("EPIC"), so every tier this fill
     * wrote missed the colour map and Gemstone Chamber rendered plain slate
     * on this page while the Forge page (which lowercases before ITS map)
     * coloured it fine. One casing convention now: upper-snake, the index's.
     */
    for (const [id, item] of Object.entries(out)) {
      if (item.tier) continue;
      const fromResource = resourceTierFor(item.hypixelId) ?? resourceTierFor(item.name);
      const tier = fromResource ? fromResource.toUpperCase() : wikiTiers.tiers[norm(item.name)] ?? null;
      if (tier) cloned()[id] = { ...item, tier };
    }
    return out;
  }, [items, chains, forge.index, bazaar.prices, resourceVersion, wikiTiers]);

  /**
   * Ask the wiki for the tiers the resource could not state, once per day.
   *
   * Only names that are still tierless after the resource fill, and only the
   * non-vanilla ones: vanilla rows are hidden by default, and spending five
   * more requests colouring Acacia Doors that are not on screen would be
   * paying for nothing. Inside the cache TTL a recorded null is an answer
   * (the article states no single tier) and is not re-asked; past it, nulls
   * become questions again while learned tiers keep serving. The effect
   * converges: once the learned tiers land in `enriched`, nothing is
   * tierless-and-unknown any more and the ask list is empty.
   */
  useEffect(() => {
    if (!Object.keys(enriched).length) return;

    const fresh = tierCacheFresh(wikiTiers);
    const ask = Object.values(enriched)
      .filter((it) => !it.tier && !it.vanilla)
      .map((it) => it.name)
      .filter((name) => {
        const known = wikiTiers.tiers[norm(name)];
        return known === undefined || (known === null && !fresh);
      })
      .slice(0, 500);

    if (!ask.length) return;

    const controller = new AbortController();
    fetchWikiTiers(ask, controller.signal)
      .then((learned) => {
        if (controller.signal.aborted || !Object.keys(learned).length) return;
        setWikiTiers((prev) => {
          const next: WikiTierCache = { fetchedAt: Date.now(), tiers: { ...prev.tiers, ...learned } };
          writeTierCache(next);
          return next;
        });
      })
      .catch(() => {
        // Offline or a wiki hiccup; the affected rows just stay uncoloured.
      });

    return () => controller.abort();
  }, [enriched, wikiTiers]);

  /**
   * Is this one of the items the game itself says you cannot obtain?
   *
   * Admin items come from the wiki's own banner template (matched by exact
   * normalised title, so "Enchanted Clock (Admin)" can never hide the real
   * Enchanted Clock), and testing items from Hypixel's `TEST_` id prefix plus
   * the /test item/i rule the parser has always applied. See wikiAdmin.ts.
   */
  const unobtainable = useMemo(() => {
    const names = admin.names;
    return (it: Item) => names.has(norm(it.name)) || isTestingItem(it.name, it.hypixelId);
  }, [admin.names]);

  /** How many rows each default-off filter is currently holding back. */
  const hiddenCounts = useMemo(() => {
    let vanilla = 0;
    let unob = 0;
    for (const it of Object.values(enriched)) {
      if (unobtainable(it)) unob++;
      else if (it.vanilla) vanilla++;
    }
    return { vanilla, unob };
  }, [enriched, unobtainable]);

  /**
   * Arriving from the landing search with an exact item name opens that item
   * rather than just filtering to it, which is what picking a row from a
   * dropdown implies. Guarded on `selected` so it only ever fires for the
   * first load: once the user has clicked anything, the deep link is spent.
   */
  useEffect(() => {
    const q = searchParams.get("q");
    if (!q || selected || !Object.keys(enriched).length) return;
    const hit = Object.entries(enriched).find(([, it]) => it.name.toLowerCase() === q.trim().toLowerCase());
    if (hit) setSelected(hit[0]);
    // `selected` is deliberately not a dependency: this is a one-shot on load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enriched, searchParams]);

  /**
   * Name matches across the whole index, before the craftable filter.
   *
   * The vanilla and unobtainable filters apply here, which is what takes the
   * hidden items out of search as well as out of the list; the toggles bring
   * either set back. A hidden item can still be OPENED (the deep link and the
   * used-in chips go through `enriched` directly), so nothing is unreachable.
   */
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.entries(enriched)
      .filter(([, it]) => (showVanilla || !it.vanilla) && (showUnobtainable || !unobtainable(it)))
      .filter(([, it]) => !q || it.name.toLowerCase().includes(q))
      .sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [enriched, query, showVanilla, showUnobtainable, unobtainable]);

  /**
   * Resolve chains for what the search turned up.
   *
   * Without this, "Craftable only" hides every enchanted item, because having
   * no grid recipe looks identical to not having been looked up yet. That hid
   * "Enchanted Brown Mushroom Block" from its own search. One batched request
   * per settled query is enough to make the filter tell the truth.
   */
  useEffect(() => {
    if (!query.trim() || !Object.keys(items).length) return;

    const unknown = matches
      .filter(([id, it]) => !it.recipe && !(id in chains))
      .slice(0, 50)
      .map(([, it]) => it.name);

    if (!unknown.length) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetchMaterialChains(unknown, controller.signal)
        .then((learned) => {
          if (controller.signal.aborted || !Object.keys(learned).length) return;
          setChains((prev) => {
            const next = { ...prev, ...learned };
            writeChainCache(next);
            return next;
          });
        })
        .catch(() => {
          // Offline or a wiki hiccup; the filter just stays conservative.
        });
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, matches, chains, items]);

  const list = useMemo(
    () => matches.filter(([, it]) => (craftableOnly ? Boolean(it.recipe) : true)).slice(0, 300),
    [matches, craftableOnly]
  );

  const tree = useMemo(() => {
    if (!selected || !enriched[selected]) return null;
    return buildCostTree(selected, 1, enriched, bazaar.prices, ironman);
  }, [selected, enriched, bazaar.prices, ironman]);

  /**
   * Any leaf we have not tried to break down yet gets looked up once. Results
   * are cached permanently, including the misses, so a tree deepens a level at
   * a time and never re-asks.
   */
  useEffect(() => {
    if (!tree) return;

    const unknown = new Map<string, string>();
    const walk = (n: CostNode) => {
      if (n.children.length === 0 && !(n.id in chains) && enriched[n.id] && !enriched[n.id].recipe) {
        unknown.set(n.id, n.name);
      }
      n.children.forEach(walk);
    };
    walk(tree);

    if (!unknown.size) return;

    const controller = new AbortController();
    fetchMaterialChains([...unknown.values()], controller.signal)
      .then((learned) => {
        if (controller.signal.aborted || !Object.keys(learned).length) return;
        setChains((prev) => {
          const next = { ...prev, ...learned };
          writeChainCache(next);
          return next;
        });
      })
      .catch(() => {
        // A failed lookup just means the branch stays a leaf.
      });

    return () => controller.abort();
  }, [tree, chains, enriched]);

  /**
   * What the site knows you already hold, across every source it has.
   *
   * This used to read sacks alone. It now goes through the profile inventory,
   * which unions the island feed (sacks, chests, inventory, ender chest,
   * storage), the Hypixel API and the shard tally, and lets a number the player
   * typed override the lot. When nothing at all is known `has` is false and
   * every trace of this disappears from the page, because a column of dashes is
   * worse than no column.
   */
  const owned = useOwned({ items: enriched });

  /**
   * Everything you have to obtain, rolled up across the whole tree.
   *
   * Three numbers per row and they mean different things. `qty` is what the
   * tree needs, `held` is what you already have, and `missing` is the only one
   * you act on. `held` stays undefined rather than 0 when no source has ever
   * mentioned the item, because "nobody looked" and "you have none" are
   * different answers and a confident 0 would state the second while meaning
   * the first.
   */
  const rawMaterials = useMemo(() => {
    if (!tree) return [];
    return [...collectRawMaterials(tree).entries()]
      .map(([id, v]) => {
        const unit = enriched[id]?.npcSell ?? null;
        const held = owned.count(id);
        return {
          id,
          ...v,
          held,
          missing: Math.max(0, v.qty - (held ?? 0)),
          npc: unit === null ? null : unit * v.qty,
        };
      })
      .sort((a, b) => b.qty - a.qty);
  }, [tree, owned, enriched]);

  /** How much of the gather list you can already cover from what you own. */
  const covered = useMemo(
    () => (owned.has ? rawMaterials.filter((r) => r.missing === 0).length : 0),
    [rawMaterials, owned.has]
  );

  /** Hide everything you already have, so the list becomes the shopping list. */
  const [missingOnly, setMissingOnly] = useState(false);
  const shownMaterials = useMemo(
    () => (missingOnly && owned.has ? rawMaterials.filter((r) => r.missing > 0) : rawMaterials),
    [rawMaterials, missingOnly, owned.has]
  );

  /**
   * What the gather list is worth at NPC prices. Only shown on Ironman, where
   * it is the one coin figure left once the bazaar is gone.
   */
  const npcRollup = useMemo(() => sumNpcValue(rawMaterials, enriched), [rawMaterials, enriched]);

  const chosen: Item | null = selected ? enriched[selected] ?? null : null;

  /** The chosen item's forge recipe, when the Forge table lists one. */
  const forgeRec: ForgeRecipe | null = chosen ? forge.index.byName.get(norm(chosen.name)) ?? null : null;

  /**
   * Whether the tree on screen is running the forge recipe. True exactly when
   * the forge has one and the crafting module does not: the merge only fills a
   * null recipe, so this is a statement about where `chosen.recipe` came from,
   * not a guess.
   */
  const forgeFed = forgeRec !== null && forgeRec.ingredients.length > 0 && selected !== null && !items[selected]?.recipe;

  /** Every shop listing selling the chosen item. */
  const soldBy: ShopListing[] = chosen ? shops.index.byItem.get(norm(chosen.name)) ?? [] : [];

  /** Craftable, minus whatever the default-off filters are holding back. */
  const craftableCount = useMemo(
    () =>
      Object.values(enriched).filter(
        (i) => i.recipe && (showVanilla || !i.vanilla) && (showUnobtainable || !unobtainable(i))
      ).length,
    [enriched, showVanilla, showUnobtainable, unobtainable]
  );

  /**
   * How many items the index is currently willing to show.
   *
   * Pulled out of the count line so the summary strip and the header sentence
   * are the same number by construction. Two independent subtractions of the
   * same two filters is how a page ends up stating "2,350 indexed" in one
   * place and "2,639" in another, and being wrong somewhere is worse than
   * being terse everywhere.
   */
  const indexedCount = useMemo(
    () =>
      Object.keys(enriched).length -
      (showVanilla ? 0 : hiddenCounts.vanilla) -
      (showUnobtainable ? 0 : hiddenCounts.unob),
    [enriched, hiddenCounts, showVanilla, showUnobtainable]
  );

  /** True once the recipe index has actually answered, so counts may be stated. */
  const indexReady = !loading && Object.keys(enriched).length > 0;

  /**
   * The count line. Hidden is stated, never silent: when either filter is
   * holding rows back, the line says how many and which kind.
   */
  const countLine = useMemo(() => {
    if (loading) return "Loading recipes";
    const indexed = indexedCount;
    const hidden: string[] = [];
    if (!showVanilla && hiddenCounts.vanilla > 0) hidden.push(`${hiddenCounts.vanilla.toLocaleString()} vanilla`);
    if (!showUnobtainable && hiddenCounts.unob > 0) hidden.push(`${hiddenCounts.unob.toLocaleString()} unobtainable`);
    return `${craftableCount.toLocaleString()} craftable of ${indexed.toLocaleString()} indexed${
      hidden.length ? `, ${hidden.join(" and ")} hidden` : ""
    }`;
  }, [loading, indexedCount, craftableCount, hiddenCounts, showVanilla, showUnobtainable]);

  return (
    /* The signature split: the item index in the rail under the logo, the
       crafting tree under the tabs. Same furniture positions as every page. */
    <SplitPage
      railLabel="Item index"
      rail={
        <>
          {/* Narrow viewports collapse the rail behind one button. */}
          <div className="min-[900px]:hidden">
            <button onClick={() => setRailOpen(!railOpen)} className={`${BTN_QUIET} w-full justify-center`}>
              {railOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              <span>{railOpen ? "Hide" : "Show"} Item List</span>
            </button>
          </div>

          {/* `.sd-glass` rather than the kit's PANEL: this column sits in the
              sharp channel opened above, so its ground is the photograph
              itself rather than the curtain's already-blurred output. That is
              the one place a real backdrop-filter is correct, and it is the
              difference between a pane of frosted glass and a flat swatch laid
              over a picture. Radius and geometry stay the panel's. */}
          <section className={`${railOpen ? "block" : "hidden min-[900px]:block"} ws-panel sd-glass rounded-md`}>
            <div className="border-b border-white/8 p-2.5">
              <div className="relative mb-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search items"
                  className={`${INPUT} w-full pl-8`}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              {/*
                Filter pills, in the exact language the Forge page filters with.
                These were three stacked ToggleRows in a bordered ControlGrid,
                which read as its own boxed sub-panel, one more design language
                than the page needs; the design must stay uniform. Filters on
                this site are pills.
              */}
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { label: "Craftable only", checked: craftableOnly, set: setCraftableOnly, hint: "Hide items with no recipe." },
                    {
                      label: "Vanilla",
                      checked: showVanilla,
                      set: setShowVanilla,
                      hint: "Show plain Minecraft recipes (doors, slabs, wool). The wiki's own crafting data marks them.",
                    },
                    {
                      label: "Unobtainable",
                      checked: showUnobtainable,
                      set: setShowUnobtainable,
                      hint: "Show admin-only and testing items, per the wiki's admin banner and Hypixel's TEST_ ids.",
                    },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.label}
                    type="button"
                    aria-pressed={f.checked}
                    title={f.hint}
                    onClick={() => f.set(!f.checked)}
                    className={`cursor-pointer rounded-md border px-2.5 py-1 text-[12px] transition-colors ${
                      f.checked
                        ? "border-emerald-500/45 bg-emerald-500/15 text-emerald-200"
                        : "border-white/12 bg-white/8 text-slate-300 hover:bg-white/12 hover:text-slate-100"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/*
              The list is sized to the window rather than to a fixed 32rem.
              A fixed cap showed about sixteen rows of a nine thousand pixel
              list and then left a third of a screen empty underneath it, so
              the page managed to be simultaneously too full to read and too
              empty to look finished. Measured against the viewport it shows
              about twice as many rows and the band underneath closes.

              The subtrahend is measured, not guessed: 106px of furniture above
              the list (the rail's top padding, the panel edge, and the
              search-and-filters block) plus the 40px of bottom padding the
              shared rail reserves, which is 148px, or 9.25rem. Rounding it up
              to a comfortable-looking 11rem is what a previous pass would have
              done, and it silently threw away a row and a half of a nine
              thousand pixel list.

              `min-h` keeps a usable list on a short window, where clipping the
              rail would be worse than letting the sticky column scroll.
            */}
            <div className="max-h-[calc(100vh-var(--sd-bar-h)-9.25rem)] min-h-[16rem] overflow-y-auto p-1">
              <div className="divide-y divide-white/8">
                {list.map(([id, it]) => {
                  /*
                   * How the item is made, in the page's own terms. Asking the
                   * RAW crafting index about the grid is what keeps this
                   * honest: `enriched[id].recipe` is also where the forge
                   * merge writes, so reading that alone would call every
                   * forge-only item "craft". Same test the detail panel's
                   * `forgeFed` makes, for the same reason.
                   */
                  const forged = !items[id]?.recipe && forge.index.byName.has(norm(it.name));
                  const made = forged ? "forge" : it.recipe ? "craft" : "raw";
                  const parts = it.recipe?.length ?? null;
                  return (
                    <button
                      key={id}
                      onClick={() => setSelected(id)}
                      className={`w-full flex items-center gap-2 rounded-sm px-1.5 py-1.5 text-left cursor-pointer transition-colors duration-150 hover:bg-white/8 ${FOCUS} ${
                        selected === id ? "bg-emerald-500/10" : ""
                      }`}
                    >
                      <ItemIcon id={id} name={it.wikiTitle ?? it.name} size={16} />
                      {/* 11px, the site's body size. At 12px this one string
                          was carrying nine tenths of the characters on the
                          page, which left no size free to mean "heading".

                          The explicit 18px line is what keeps the row at the
                          31px it already was. 12px text at the inherited 1.5
                          measured exactly 18px, so pinning the line rather
                          than letting 11px text pick its own 16.5 means the
                          type got smaller and the rhythm did not move. */}
                      <span className={`min-w-0 flex-1 truncate text-[11px] leading-[18px] ${TIER[it.tier ?? ""] ?? "text-slate-300"}`}>
                        {it.name}
                      </span>
                      {/*
                        The meta cells. The row was 482px wide and spent all of
                        it on an icon and a name; these three answer the
                        questions you would otherwise have to open the item to
                        ask, and they cost no height at all.
                      */}
                      <span
                        className={`${BADGE} w-10 shrink-0 text-right ${made === "raw" ? "text-slate-500" : "text-slate-400"}`}
                        title={
                          made === "forge"
                            ? "The Forge table lists this item; the crafting module has no grid for it"
                            : made === "craft"
                            ? "Has a crafting recipe"
                            : "No known recipe, so it is gathered rather than made"
                        }
                      >
                        {made}
                      </span>
                      <span
                        className={`${META} w-4 shrink-0 text-right text-slate-500`}
                        title={parts === null ? "No recipe, so no ingredient count" : `${parts} ingredient${parts === 1 ? "" : "s"}`}
                      >
                        {parts === null ? "-" : parts}
                      </span>
                      <span
                        className={`${META} w-14 shrink-0 text-right ${it.npcSell === null ? "text-slate-500" : "text-slate-400"}`}
                        title={it.npcSell === null ? "No known NPC price" : `An NPC pays ${it.npcSell.toLocaleString()} for one`}
                      >
                        {it.npcSell === null ? "-" : formatCoins(it.npcSell)}
                      </span>
                    </button>
                  );
                })}
              </div>
              {!loading && list.length === 0 && <p className="text-[11px] text-slate-500 px-1.5 py-2">Nothing matches.</p>}
            </div>
          </section>
        </>
      }
    >
      <PageHeader
        title="Items"
        sub={countLine}
        icon={Package}
        actions={
          <span className={`text-[11px] ${NUM} ${bazaar.error && !ironman ? "text-amber-400" : "text-slate-500"}`}>
            {ironman
              ? "ironman: no bazaar"
              : bazaar.error
              ? "bazaar unavailable"
              : bazaar.fetchedAt
              ? `${Object.keys(bazaar.prices).length} bazaar prices`
              : "loading prices"}
          </span>
        }
      />

      {error && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200">
          Recipe database unavailable ({error}). Run <code>pnpm data:recipes</code> to build it.
        </div>
      )}

      {/*
        Only shown when there is nothing cached to fall back on: a stale forge
        table or shop list is still true data and stays on screen silently,
        but a first visit that failed has to say why the sections are missing
        rather than let their absence read as "these items have no forge".
      */}
      {forge.error && forge.index.recipes.length === 0 && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200">
          Forge recipes could not be loaded from the wiki ({forge.error}), so forge items and their recipes are missing from this page.
        </div>
      )}
      {shops.error && shops.index.shops.length === 0 && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200">
          NPC shop stock could not be loaded from the wiki ({shops.error}), so &quot;sold by&quot; sources are missing from this page.
        </div>
      )}

      {/*
        What the index actually holds, as a strip of figures.

        This replaces an empty state that spent a 1330x147 panel on ninety
        characters of prose telling you to click something. The strip is the
        same height as one row of the Profile's own summary band and says
        eight true things instead of one obvious one, so the top of the page
        is worth reading whether or not an item is open.

        Every figure is a dash until its own source has answered. A zero here
        would read as "there are none of these", which is a different and
        false claim while a fetch is still in flight.
      */}
      <div className={`${PANEL} flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-3 py-2`}>
        <Figure label="Indexed" value={stated(indexReady, indexedCount)} title="Items on this page, after the filters in the rail" />
        <Figure label="Craftable" value={stated(indexReady, craftableCount)} title="Of those, the ones with a recipe" />
        <Figure label="Vanilla" value={stated(indexReady, hiddenCounts.vanilla)} title="Plain Minecraft recipes, hidden unless the Vanilla filter is on" />
        <Figure
          label="Unobtainable"
          value={stated(indexReady, hiddenCounts.unob)}
          title="Admin-only and testing items, hidden unless the Unobtainable filter is on"
        />
        <Figure label="Listed" value={stated(indexReady, list.length)} title="Rows in the index beside this, which is capped at 300" />
        <Figure
          label="Forge"
          value={stated(forge.index.recipes.length > 0, forge.index.recipes.length)}
          title="Forge recipes read from the wiki"
        />
        <Figure label="Shops" value={stated(shops.index.shops.length > 0, shops.index.shops.length)} title="NPC shops read from the wiki" />
        <Figure
          label="Bazaar"
          value={stated(Boolean(bazaar.fetchedAt), Object.keys(bazaar.prices).length)}
          title="Live bazaar prices, which Ironman cannot buy at"
        />
      </div>

      {!chosen && (
        <p className="text-[11px] leading-snug text-slate-400">
          Pick an item from the index to see how it is made. Try Hyperion, or Perfect Boots for a twelve-level tree.
        </p>
      )}

      {chosen && tree && (
        <div className={PANEL}>
          {/*
            The header band: identity on the left, the figures you compare on
            the right, each on its own translucent tile with room around it.
            Tiles rather than a flush strip because these are the few figures
            you weigh against each other, which is the side of the kit's TILE
            note that earns a card.
          */}
          <div className="flex items-center justify-between gap-3 border-b border-white/8 px-3 py-2.5 flex-wrap">
            <div className="flex items-center gap-2.5 min-w-0">
              <ItemIcon id={selected!} name={chosen.wikiTitle ?? chosen.name} size={32} />
              <div className="min-w-0">
                <div className={COL}>{chosen.category ?? "item"}</div>
                <WikiLink
                  name={chosen.name}
                  className={`text-[15px] font-semibold ${TIER[chosen.tier ?? ""] ?? "text-slate-100"}`}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {chosen.yields > 1 && (
                <div className={`${TILE} px-2.5 py-1.5`}>
                  <Figure label="Per craft" value={chosen.yields} />
                </div>
              )}
              {ironman ? (
                <>
                  <div className={`${TILE} px-2.5 py-1.5`}>
                    <Figure label="Raw types" value={rawMaterials.length} />
                  </div>
                  <div className={`${TILE} px-2.5 py-1.5`}>
                    <Figure
                      label="NPC value"
                      title="What an NPC would pay for the gather list"
                      value={
                        <>
                          {npcRollup.known === 0 ? "-" : formatCoins(npcRollup.total)}
                          {npcRollup.unknown > 0 && npcRollup.known > 0 && (
                            <span className="ml-1 text-[10px] font-normal text-slate-500">+{npcRollup.unknown} unpriced</span>
                          )}
                        </>
                      }
                    />
                  </div>
                  <div className={`${TILE} px-2.5 py-1.5`}>
                    <Figure
                      label="Items to gather"
                      value={
                        <span className="text-emerald-300">{rawMaterials.reduce((s, r) => s + r.qty, 0).toLocaleString()}</span>
                      }
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className={`${TILE} px-2.5 py-1.5`}>
                    <Figure
                      label="Buy"
                      title={tree.buyCost === null ? "Not on the bazaar" : "Buying it outright"}
                      value={<span className={tree.buyCost === null ? "text-slate-500" : "text-blue-300"}>{coins(tree.buyCost)}</span>}
                    />
                  </div>
                  <div className={`${TILE} px-2.5 py-1.5`}>
                    <Figure
                      label="Craft"
                      title={tree.craftCost === null ? "At least one leg has no price" : "Crafting it from its parts"}
                      value={
                        <span className={tree.craftCost === null ? "text-slate-500" : "text-emerald-300"}>{coins(tree.craftCost)}</span>
                      }
                    />
                  </div>
                  <div className={`${TILE} px-2.5 py-1.5`}>
                    <Figure label="Cheapest" value={<span className="text-emerald-300">{coins(tree.cost)}</span>} />
                  </div>
                </>
              )}
            </div>
          </div>

          <ItemSources
            item={chosen}
            items={enriched}
            bazaar={bazaar.prices}
            ironman={ironman}
            forge={forgeRec}
            forgeFed={forgeFed}
            soldBy={soldBy}
            shopsPending={shops.loading}
            onPick={setSelected}
          />

          {forgeRec && (
            <ForgeSection
              recipe={forgeRec}
              items={enriched}
              forgeFed={forgeFed}
              hasGridRecipe={Boolean(selected && items[selected]?.recipe)}
              onPick={setSelected}
            />
          )}

          {!chosen.recipe &&
            (chosen.unlocks?.some((u) => u.type !== "Trade") ? (
              <p className="text-[12px] text-slate-500 px-3 py-4">
                A collection tier unlocks this recipe in game, but the wiki&apos;s crafting database has no grid for it, so there is no tree to
                show. The unlock above is what you need.
              </p>
            ) : (
              <p className="text-[12px] text-slate-500 px-3 py-4">
                No crafting recipe. Check the sources above, or it drops from a mob or comes from an event.
              </p>
            ))}

          {chosen.recipe && (
            <>
              {ironman && (
                <p className="flex items-center gap-1.5 border-b border-white/8 px-3 py-1.5 text-[11px] text-slate-500">
                  <Hammer className="h-2.5 w-2.5 shrink-0 text-emerald-400" />
                  Ironman: nothing can be bought, so every branch runs down to what you gather, and NPC is what a shop pays rather than a price
                  you can buy at.
                </p>
              )}
              <div className="overflow-x-auto">
                <TreeHead ironman={ironman} owned={owned.has ? owned : null} />
                <TreeRow node={tree} defaultOpen ironman={ironman} owned={owned.has ? owned : null} />
              </div>

              {rawMaterials.length > 0 && (
                <div className="border-t border-white/8">
                  <SectionHead
                    title={ironman ? "Gather this yourself" : "Buy or gather this"}
                    right={
                      owned.has ? (
                        <div className="flex items-center gap-3">
                          <span className={`text-[11px] ${NUM} ${covered === rawMaterials.length ? "text-emerald-400" : "text-slate-500"}`}>
                            {covered} of {rawMaterials.length} already covered
                          </span>
                          <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer hover:text-slate-200">
                            <input
                              type="checkbox"
                              checked={missingOnly}
                              onChange={(e) => setMissingOnly(e.target.checked)}
                              className={`cursor-pointer ${FOCUS}`}
                            />
                            Missing only
                          </label>
                        </div>
                      ) : undefined
                    }
                  />
                  {/*
                    One row per item, one header row, lanes that line up.

                    This was a three column grid holding the rows, with a
                    SECOND three column grid holding a single header cell above
                    it. A grid with one child fills only its first column, so
                    the captions landed over the first item and nothing else:
                    every row after the first printed three items side by side,
                    each with its numbers under no heading at all, and the two
                    grids' column edges had no reason to agree. Reading the
                    third item's "missing" figure meant counting cells.

                    A gather list is a table, so it is now a table: one item to
                    a line, one set of captions, and every figure under the
                    word that names it. Hairlines rather than tiles, because
                    this is data you scan and a hundred bordered cards is the
                    wall the kit's TILE note exists to prevent.
                  */}
                  {/*
                    `px-2` and this lane ORDER are what make the two tables one
                    table to look at. The tree ends on npc, have, missing; so
                    does this, with its own "need" lane sitting ahead of them
                    where the tree keeps its quantity beside the name. Same
                    trailing lanes, same widths, same container padding, so the
                    columns of the gather list land on the columns of the tree
                    directly above it instead of near them.
                  */}
                  <div className="overflow-x-auto px-2 pb-3 pt-1">
                    <div className={`flex items-center gap-3 border-b border-white/10 py-1.5 ${COL}`}>
                      <span className="w-4 shrink-0" />
                      <span className={LANE_NAME}>item</span>
                      <span className={LANE_COUNT}>need</span>
                      <span className={LANE_COIN}>npc</span>
                      {owned.has && <span className={LANE_COUNT}>have</span>}
                      {owned.has && <span className={LANE_COUNT}>missing</span>}
                    </div>
                    <div className="divide-y divide-white/8">
                      {shownMaterials.map((r) => {
                        const enough = r.missing === 0 && r.held !== undefined;
                        return (
                          <div key={r.id} className="flex items-center gap-3 py-1">
                            <ItemIcon id={r.id} name={enriched[r.id]?.wikiTitle ?? r.name} size={16} />
                            <WikiLink
                              name={r.name}
                              className={`${LANE_NAME} text-[11px] ${enough ? "text-slate-500 line-through decoration-slate-700" : "text-slate-300"}`}
                              nameClassName="truncate"
                            />
                            <span className={`${LANE_COUNT} ${META} ${enough ? "text-slate-500" : "text-slate-400"}`}>
                              {r.qty.toLocaleString()}
                            </span>
                            <span
                              className={`${LANE_COIN} ${META} ${r.npc === null ? "text-slate-500" : "text-slate-400"}`}
                              title={r.npc === null ? "No known NPC price" : "What an NPC pays for this quantity"}
                            >
                              {coins(r.npc)}
                            </span>
                            {owned.has && (
                              <span
                                className={`${LANE_COUNT} ${META} ${enough ? "text-emerald-400" : "text-slate-500"}`}
                                title={r.held === undefined ? "No source has mentioned this item" : describeSources(owned.get(r.id)) || `${r.held.toLocaleString()} held`}
                              >
                                {r.held === undefined ? "-" : r.held.toLocaleString()}
                              </span>
                            )}
                            {owned.has && (
                              /*
                               * A shortfall nobody can compute is a dash, not
                               * the whole quantity. `held` is undefined when no
                               * source has ever mentioned the item, and
                               * printing the full need there would assert you
                               * have none of it, which is the "unknown rendered
                               * as unmet" this page is not allowed to do. The
                               * underlying figure is untouched, so the covered
                               * tally and the Missing only filter keep the
                               * meaning they have always had.
                               */
                              <span
                                className={`${LANE_COUNT} ${META} font-medium ${
                                  r.held === undefined ? "text-slate-500" : r.missing === 0 ? "text-emerald-400" : "text-slate-100"
                                }`}
                                title={
                                  r.held === undefined
                                    ? "Not known, because nothing has said how many you hold"
                                    : r.missing === 0
                                    ? "You already have enough"
                                    : "Still to obtain"
                                }
                              >
                                {r.held === undefined ? "-" : r.missing === 0 ? "done" : r.missing.toLocaleString()}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {missingOnly && shownMaterials.length === 0 && (
                      <p className="mt-2 text-[12px] text-emerald-300">You already have everything on this list.</p>
                    )}
                    {owned.has && (
                      <p className="mt-2 text-[10px] text-slate-500">
                        Held counts come from your island data, the Hypixel API and anything you entered by hand. Hover a number to see which.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </SplitPage>
  );
};

export default ItemsPage;
