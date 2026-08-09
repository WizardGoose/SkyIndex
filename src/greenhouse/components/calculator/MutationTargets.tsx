import React, { useMemo, useState, useEffect } from "react";
import { X, Target, TrendingUp, Trash2, AlertTriangle, ChevronUp, ChevronDown } from "lucide-react";
import { useGreenhouseData } from "../../context";
import { MutationAutocomplete } from "./MutationAutocomplete";
import { CropImage } from "../shared";
import { getRarityTextColor } from "../../utilities";
import { ControlGrid, FOCUS, NUM, PANEL, Segmented, SliderRow } from "../../../ui/kit";
import type { MutationDefinition } from "../../types/greenhouse";

/**
 * Compact number stepper. Replaces the field-with-a-column-of-chevrons
 * arrangement, which stacked a 12px label over an input and put two 10px
 * hit targets beside it. Same three controls, one row, targets you can
 * actually land on.
 */
const Stepper: React.FC<{
  value: string;
  placeholder?: string;
  onInput: (raw: string) => void;
  onStep: (delta: number) => void;
  ariaLabel: string;
}> = ({ value, placeholder, onInput, onStep, ariaLabel }) => (
  <span className="inline-flex items-center overflow-hidden rounded-md border border-slate-700">
    <button
      type="button"
      onClick={() => onStep(-1)}
      title="Decrease"
      aria-label={`Decrease ${ariaLabel}`}
      className={`cursor-pointer bg-slate-800/60 px-1 py-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200 ${FOCUS}`}
    >
      <ChevronDown className="h-3 w-3" />
    </button>
    <input
      type="number"
      min={1}
      max={100}
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(e) => onInput(e.target.value)}
      className={`w-9 border-x border-slate-700 bg-slate-950 px-1 py-1 text-center text-[11px] leading-4 text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/70 ${NUM} ${FOCUS}`}
    />
    <button
      type="button"
      onClick={() => onStep(1)}
      title="Increase"
      aria-label={`Increase ${ariaLabel}`}
      className={`cursor-pointer bg-slate-800/60 px-1 py-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200 ${FOCUS}`}
    >
      <ChevronUp className="h-3 w-3" />
    </button>
  </span>
);

const MODE_OPTIONS = [
  { value: "target" as const, label: "Target", title: "Solve for an exact count" },
  { value: "maximize" as const, label: "Maximize", title: "Fit as many as possible" },
];

export const MutationTargets: React.FC = () => {
  const {
    mutations,
    selectedMutations,
    addMutation,
    removeMutation,
    updateMutationMode,
    updateMutationTargetCount,
    isLoading,
    getCropDef,
    getMutationDef,
    uniqueCrops,
    setUniqueCrops,
  } = useGreenhouseData();
  
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  
  // Sync inputValues with selectedMutations
  useEffect(() => {
    setInputValues(prev => {
      const newInputValues = { ...prev };
      let hasChanges = false;
      
      selectedMutations.forEach(mutation => {
        if (mutation.mode === "target") {
          const currentInputValue = prev[mutation.id];
          const currentInputNum = currentInputValue ? parseInt(currentInputValue) : undefined;

          if (currentInputValue === undefined || currentInputValue === null) {
            if (mutation.targetCount !== 1) {
              newInputValues[mutation.id] = mutation.targetCount.toString();
              hasChanges = true;
            }
          } else if (currentInputValue === "" || currentInputValue === "0") {
            // User cleared input or typed invalid value
          } else if (!isNaN(currentInputNum!) && currentInputNum !== mutation.targetCount) {
            newInputValues[mutation.id] = mutation.targetCount.toString();
            hasChanges = true;
          }
        }
      });
      
      Object.keys(prev).forEach(id => {
        const mutation = selectedMutations.find(m => m.id === id);
        if (!mutation || mutation.mode !== "target") {
          delete newInputValues[id];
          hasChanges = true;
        }
      });
      
      return hasChanges ? newInputValues : prev;
    });
  }, [selectedMutations]);

  // available mutations
  const availableMutations = mutations.filter(
    (m) => !selectedMutations.some((s) => s.id === m.id)
  );

  // Check for multiple maximize targets
  const hasMultipleMaximize = useMemo(() => {
    return selectedMutations.filter((m) => m.mode === "maximize").length > 1;
  }, [selectedMutations]);

  // Check for mutations with special rules not yet implemented
  const hasSpecialRuleMutations = useMemo(() => {
    const specialRuleMutationIds = ["shellfruit", "godseed", "jerryseed"];
    return selectedMutations.some((m) => specialRuleMutationIds.includes(m.id.toLowerCase()));
  }, [selectedMutations]);

  const handleAddMutation = (id: string, name: string) => {
    addMutation(id, name);
  };
  
  const handleCountChange = (id: string, value: string) => {
    setInputValues(prev => ({ ...prev, [id]: value }));
    if (value === "") {
      return;
    }
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 100) {
      updateMutationTargetCount(id, numValue);
    }
  };
  
  const incrementCount = (id: string, currentCount: number) => {
    const newCount = Math.min(100, currentCount + 1);
    setInputValues(prev => ({ ...prev, [id]: newCount.toString() }));
    updateMutationTargetCount(id, newCount);
  };
  
  const decrementCount = (id: string, currentCount: number) => {
    const newCount = Math.max(1, currentCount - 1);
    setInputValues(prev => ({ ...prev, [id]: newCount.toString() }));
    updateMutationTargetCount(id, newCount);
  };

  if (isLoading) {
  return (
    <div className={`${PANEL} p-3`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-medium text-slate-200">Mutation Targets</h3>
        </div>
        {selectedMutations.length > 0 && (
          <button
            onClick={() => selectedMutations.forEach((m) => removeMutation(m.id))}
            className={`cursor-pointer rounded-sm p-1 text-slate-400 transition-colors hover:bg-red-500/15 hover:text-red-400 ${FOCUS}`}
            title="Clear all targets"
            aria-label="Clear all targets"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${PANEL} p-3`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-medium text-slate-200">Mutation Targets</h3>
        </div>
        {selectedMutations.length > 0 && (
          <button
            onClick={() => selectedMutations.forEach((m) => removeMutation(m.id))}
            className={`cursor-pointer rounded-sm p-1 text-slate-400 transition-colors hover:bg-red-500/15 hover:text-red-400 ${FOCUS}`}
            title="Clear all targets"
            aria-label="Clear all targets"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="text-xs text-slate-400 mb-2.5">
        Select which mutations to optimize for. Choose to maximize count or set
        a specific target.
      </p>

      {/*
       * One band per target, split by hairlines.
       *
       * Each target used to be a bordered, filled box inside this bordered,
       * filled panel: two borders and two paddings nested to say "these belong
       * together", which the hairline says in one pixel. Inside the box the
       * name, the requirements, the mode pair and the count each took their
       * own line, so four targets filled the column before the solver had
       * said anything. Mode and count now share a row, because you set them
       * together and they are both about the same one decision.
       */}
      <div className="mb-2.5 divide-y divide-slate-800 border-y border-slate-800">
        {selectedMutations.map((selected) => {
          const mutation = mutations.find((m) => m.id === selected.id);
          return (
            <div key={selected.id} className="py-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center">
                  <CropImage cropId={selected.id} cropName={selected.name} size="xs" showFallback={false} />
                </span>
                <span className={`truncate text-[12px] font-medium ${mutation ? getRarityTextColor(mutation.rarity) : "text-slate-200"}`}>
                  {selected.name}
                </span>
                <button
                  onClick={() => removeMutation(selected.id)}
                  className={`ml-auto flex-shrink-0 cursor-pointer rounded-sm p-0.5 text-slate-400 transition-colors hover:bg-red-500/15 hover:text-red-400 ${FOCUS}`}
                  title="Remove target"
                  aria-label={`Remove ${selected.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {mutation && (
                <p className="mt-0.5 text-[11px] leading-snug text-slate-400">
                  Requires{" "}
                  {mutation.requirements.map((r, i) => {
                    const reqCropDef = getCropDef(r.crop);
                    const reqMutationDef = getMutationDef(r.crop);
                    const displayName = reqCropDef?.name || reqMutationDef?.name || r.crop.replace(/_/g, " ");
                    const rarityColor = reqMutationDef ? getRarityTextColor(reqMutationDef.rarity) : "text-slate-200";

                    return (
                      <span key={r.crop}>
                        {i > 0 && ", "}
                        <span className={rarityColor}>
                          {r.count}x {displayName}
                        </span>
                      </span>
                    );
                  })}
                </p>
              )}

              <div className="mt-1 flex items-center gap-2">
                <Segmented
                  ariaLabel={`Mode for ${selected.name}`}
                  options={MODE_OPTIONS}
                  value={selected.mode === "maximize" ? "maximize" : "target"}
                  onChange={(mode) => updateMutationMode(selected.id, mode)}
                />
                {selected.mode === "target" ? (
                  <Stepper
                    ariaLabel={`Count for ${selected.name}`}
                    value={inputValues[selected.id] ?? ""}
                    placeholder="1"
                    onInput={(raw) => handleCountChange(selected.id, raw)}
                    onStep={(d) => (d > 0 ? incrementCount(selected.id, selected.targetCount) : decrementCount(selected.id, selected.targetCount))}
                  />
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                    <TrendingUp className="h-3 w-3" />
                    as many as fit
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {selectedMutations.length === 0 && (
          <div className="py-3 text-center text-[11px] text-slate-500">
            No mutations selected. Add a target to optimize for.
          </div>
        )}
      </div>

      {/* Warning for multiple maximize targets */}
      {hasMultipleMaximize && (
        <div className="flex items-start gap-2 p-2.5 mb-4 bg-amber-500/10 border border-amber-500/30 rounded-md">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300/90">
            Multiple maximize targets selected. The solver will prioritize whichever mutation it can fit the most of, and will not balance between them.
          </p>
        </div>
      )}

      {/* Warning for special rule mutations */}
      {hasSpecialRuleMutations && (
        <div className="flex items-start gap-2 p-2.5 mb-4 bg-amber-500/10 border border-amber-500/30 rounded-md">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300/90">
            One or more selected mutations have special rules that have not been implemented yet. They will be added in the future.
          </p>
        </div>
      )}

      {/* mutation search */}
      {availableMutations.length > 0 && (
        <MutationAutocomplete
          mutations={mutations}
          excludeIds={selectedMutations.map((m) => m.id)}
          onSelect={(mutation: MutationDefinition) => handleAddMutation(mutation.id, mutation.name)}
          placeholder="Add mutation target..."
        />
      )}

      {/*
       * Unique crops. Was an icon, a heading, a value, a slider and a pair of
       * end labels reading 0 and 12: five stacked elements for one number,
       * and the end labels only repeated what the slider already showed.
       */}
      <ControlGrid className="mt-2.5 border-t border-slate-800">
        <SliderRow
          id="gh-unique-crops"
          label="Unique crops"
          min={0}
          max={12}
          value={uniqueCrops}
          onChange={setUniqueCrops}
          format={(v) => (v === 0 ? <span className="text-slate-400">off</span> : v)}
          hint="Distinct crops standing in the greenhouse. More unique crops grow faster. Zero turns the bonus off."
        />
      </ControlGrid>
    </div>
  );
};
