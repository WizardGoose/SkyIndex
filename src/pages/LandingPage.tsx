import React, { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Bar, FOCUS, NUM } from "../ui/kit";
import { usePlannerState } from "../greenhouse/planner/usePlannerState";
import { gateStock, planProgress, progressPctLabel, snapshotRows } from "../greenhouse/planner/planEstimates";
import { useGreenhouseDataset } from "../greenhouse/data/datasetStore";
import { useOwned } from "../inventory";
import { formatDuration } from "../greenhouse/planner/time";
import { UniversalSearch, useSiteIndex } from "../search";
import { pickSaying, prepareSayings } from "../sayings";
import { VectorMark } from "../mark";

/**
 * The front door.
 *
 * Centred mark, one field, and ONE small card under it. The first merge
 * went too far toward a dashboard; the corrected rule is that the mark sits
 * at the centre of the page, anything extra goes underneath the search bar,
 * and a massive continue dashboard makes no logical sense on a front
 * door. So the resume affordance is a single compact card
 * the width of the search field: the grind's name, how far through it you
 * are, the model's own time-left figure, and a door into the Planner, which
 * is where the full board lives.
 *
 * PLACEHOLDER
 * -----------
 * "What are we grinding?" is still the house line and still the first thing
 * most visits see. It is no longer the only thing: the field draws from
 * `src/sayings`, which crosses twenty-three sentence templates with the live
 * search index and produces several million distinct questions, all of them
 * grammatical by construction rather than by luck. The house line keeps four
 * times the weight of any other template, so the voice does not drift.
 *
 * A saying is drawn once per visit and once per focus. It is never redrawn
 * while someone is typing, and that is structural rather than careful: a
 * `placeholder` is only painted by the browser when the field is empty, so a
 * swap during typing is not something the user can be shown. What the focus
 * redraw actually does is give a fresh question to anyone who clicks away and
 * comes back, which is the moment they are looking at the empty field again.
 */

/**
 * The placeholder's vocabulary, taken from the live search index.
 *
 * Two decks per visit and no more. `names` stays null for the whole of the
 * loading phase, which keeps its identity stable while the three sources land
 * one after another, so the deck is built exactly twice: once empty, and once
 * for real. Without that the field would draw a new question three times in
 * the first second, which is the sort of thing nobody can name but everybody
 * notices.
 *
 * Page names are dropped. They are excellent search results and poor sentence
 * subjects, and "Back to the Greenhouse Planner mines?" is the proof.
 */
const useSayingDeck = (index: { key: string; name: string }[], loading: boolean) => {
  const names = useMemo(
    () => (loading ? null : index.filter((e) => !e.key.startsWith("site:")).map((e) => e.name)),
    [loading, index]
  );
  return useMemo(() => prepareSayings(names ?? []), [names]);
};

/**
 * The one card of the visitor's own data the page shows.
 *
 * The percentage and the bar run through the exact functions the Planner and
 * the grind panels use - `snapshotRows`, `gateStock`, `planProgress` - so
 * owned stock is credited here the way it is credited everywhere (owned
 * stock IS progress, and
 * a front door reading 0% at a real 19% would be that lie again). The clock
 * is `expectedSecondsLeft` exactly as the Planner recorded it, never
 * re-derived. Null when there is no plan, and the page then shows nothing at
 * all rather than an advert for making one.
 */
const useResumeCard = (): {
  label: string;
  done: number;
  owned: number;
  total: number;
  pct: string;
  secondsLeft: number | null;
} | null => {
  const { state } = usePlannerState();
  const { bridge } = useGreenhouseDataset();
  const heldStock = useOwned({ items: bridge, manual: state.inventory });

  return useMemo(() => {
    const snap = state.snapshot;
    if (!snap || !snap.targetLabel) return null;

    const { rows, unitIds } = snapshotRows(snap);
    const stockOf = gateStock(unitIds, (id: string) => heldStock.count(id));
    const progress = planProgress(rows, stockOf, state.progress);
    if (!(progress.wantedUnits > 0)) return null;

    return {
      label: snap.targetLabel,
      done: progress.harvestedUnits,
      owned: progress.ownedUnits,
      total: progress.wantedUnits,
      pct: progressPctLabel(progress.pct),
      secondsLeft: snap.expectedSecondsLeft ?? null,
    };
  }, [state.snapshot, state.progress, heldStock]);
};

export const LandingPage: React.FC = () => {
  const { index, loading } = useSiteIndex();
  const deck = useSayingDeck(index, loading);
  const resume = useResumeCard();

  const [alert, setAlert] = useState(false);
  const [thinking, setThinking] = useState(false);

  /*
   * The one uncertain number in the whole saying pipeline, kept at the edge
   * where it belongs. Everything downstream of this is a pure function of it,
   * so a sentence someone reports can be reproduced from its seed. Read once,
   * in a state initialiser, so it survives re-renders; written nowhere.
   */
  const [visit] = useState(() => (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0);
  const [focuses, setFocuses] = useState(0);

  const placeholder = useMemo(
    () => pickSaying(deck, (visit + focuses * 0x9e3779b1) >>> 0),
    [deck, visit, focuses]
  );

  /* Stable identities: the search reports these from an effect, so a new
     function every render would put it in a loop. */
  const onFocusChange = useCallback((v: boolean) => {
    setAlert(v);
    /* Only on the way in. The search reports `false` once at mount, and
       counting that would burn a saying nobody saw. */
    if (v) setFocuses((n) => n + 1);
  }, []);
  const onBusyChange = useCallback((v: boolean) => setThinking(v), []);

  return (
    /*
     * `100dvh` minus the shell, never `h-screen`: on iOS the address bar
     * changes the viewport height mid scroll and `vh` does not follow it,
     * which is what makes a hero jump. Content sits a little above true
     * centre, because the results list opens downwards and a field centred
     * exactly would put eight rows of it against the bottom of a short
     * window.
     */
    <div className="flex min-h-[calc(100dvh-12rem)] flex-col items-center justify-center px-1 pb-16 md:min-h-[calc(100dvh-11rem)] md:pb-24">
      {/* A soft cast shadow grounds the mark on whatever backdrop is behind
          it now that the photo shows sharp here. */}
      <div className="[filter:drop-shadow(0_4px_18px_rgb(7_8_10/0.7))]">
        <VectorMark alert={alert} thinking={thinking} />
      </div>

      <div className="mt-7 w-full max-w-[34rem] md:mt-9">
        <UniversalSearch
          index={index}
          indexLoading={loading}
          placeholder={placeholder}
          onFocusChange={onFocusChange}
          onBusyChange={onBusyChange}
          className="w-full"
        />
      </div>

      {resume && (
        <Link
          to="/greenhouse/planner"
          className={`group mt-5 flex w-full max-w-[34rem] flex-col gap-1.5 rounded-md border border-white/12 bg-gradient-to-b from-slate-900/55 to-slate-900/45 px-3.5 py-2.5 backdrop-blur-[18px] backdrop-saturate-[1.15] transition-colors hover:border-white/22 ${FOCUS}`}
        >
          <span className="flex items-baseline gap-2">
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-100">{resume.label}</span>
            <span className={`shrink-0 text-[13px] ${NUM} text-emerald-300`}>{resume.pct}%</span>
          </span>
          <Bar done={resume.done} owned={resume.owned} total={resume.total} />
          <span className="flex items-center gap-2 text-[11px] text-slate-500">
            {resume.secondsLeft !== null && (
              <span className={NUM}>
                {resume.secondsLeft > 0 ? `~${formatDuration(resume.secondsLeft)} left` : "done"}
              </span>
            )}
            <span className="ml-auto inline-flex items-center gap-1 transition-colors group-hover:text-emerald-300">
              Continue in the Planner
              <ArrowRight className="h-3 w-3" />
            </span>
          </span>
        </Link>
      )}
    </div>
  );
};

export default LandingPage;
