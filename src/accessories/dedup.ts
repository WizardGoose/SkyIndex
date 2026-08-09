import type { ChainIndex } from "./chains";

/**
 * Folding an upgrade line's missing rungs into the player's next step.
 *
 * THE COMPLAINT THIS ANSWERS
 * --------------------------
 * "Get now" listed Campfire Badge I through VIII, and every rung of every line,
 * as separate cards. Twenty-nine Campfire tiles is not twenty-nine things to go
 * and do; it is ONE thing to go and do, twenty-nine times, and the first rung is
 * the only one the player can actually act on today, because each rung is made
 * from the one below it.
 *
 * So within one upgrade line, the missing sections show exactly one tile: the
 * lowest rung the player still needs. Everything above it FOLDS behind that
 * tile, which carries a quiet "+N" chip and lists the folded rungs in its hover
 * card. Nothing becomes unreachable: the same toggle that reveals owned-covered
 * rungs reveals folded ones, and a search that names a folded rung outright
 * finds it regardless.
 *
 * WHAT "LOWEST STILL NEEDED" MEANS, PRECISELY
 * -------------------------------------------
 * `chains` maps an id to everything beneath it, transitively. A not-owned entry
 * is folded exactly when something beneath it is also not owned, and it folds
 * behind the not-owned rung under it that has nothing not-owned under itself,
 * which is the minimal element of the chain and therefore the actual next step.
 * A player who owns the bottom two rungs of a five rung line sees rung three,
 * with "+2" on it.
 *
 * This is only computed when a bag was read. Without one, "the rung you still
 * need" is a claim about the player nobody established, so the catalogue view
 * shows every rung and claims nothing, same as every other honesty rule here.
 */

export interface FoldResult {
  /** Folded id -> the next-step id it folds behind. Absent means visible. */
  foldedBehind: Map<string, string>;
  /** Next-step id -> the folded ids that sit above it, nearest rung first where knowable. */
  foldedAbove: Map<string, string[]>;
}

export function computeFolds(missingIds: ReadonlySet<string>, chains: ChainIndex): FoldResult {
  const foldedBehind = new Map<string, string>();
  const foldedAbove = new Map<string, string[]>();

  /** Visible means next step: nothing beneath it is still missing. */
  const isNextStep = (id: string): boolean =>
    !(chains[id] ?? []).some((beneath) => missingIds.has(beneath));

  for (const id of missingIds) {
    if (isNextStep(id)) continue;

    /*
     * Candidates are the missing rungs beneath this one; the next step is the
     * one among them that is itself visible. At least one always exists,
     * because the chain index is transitive: a candidate that is not visible
     * has a missing rung beneath it, and that deeper rung is also beneath us.
     * A branched graph can offer more than one; the sort keeps the choice
     * deterministic rather than dependent on set iteration order.
     */
    const nextSteps = (chains[id] ?? []).filter((c) => missingIds.has(c) && isNextStep(c)).sort();
    const target = nextSteps[0];
    if (!target) continue;

    foldedBehind.set(id, target);
    const list = foldedAbove.get(target) ?? [];
    list.push(id);
    foldedAbove.set(target, list);
  }

  /*
   * Order each folded list by how deep the rung sits, shallowest first, so the
   * hover card reads as the ascent the player will actually climb. Depth is the
   * count of chain members beneath the rung, which is exactly what "higher up
   * the ladder" means in this graph.
   */
  for (const list of foldedAbove.values()) {
    list.sort((a, b) => (chains[a]?.length ?? 0) - (chains[b]?.length ?? 0) || a.localeCompare(b));
  }

  return { foldedBehind, foldedAbove };
}
