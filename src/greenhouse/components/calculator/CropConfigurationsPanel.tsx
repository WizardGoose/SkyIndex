import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Brush, X, ChevronDown, Lock, Trash2, AlertTriangle, Info, ChevronUp } from "lucide-react";
import { useGreenhouseData, useLockedPlacements, useInfoModal } from "../../context";
import { getRarityTextColor } from "../../utilities";
import { CropImage, SearchFilterHeader } from "../shared";
import { FOCUS, NUM, PANEL } from "../../../ui/kit";
import { useCropFiltering } from "../../hooks/shared/useCropFiltering";
import type { CropDefinition, MutationDefinition, SelectedCropForPlacement } from "../../types/greenhouse";

interface CropConfigurationsPanelProps {
  className?: string;
}

// Item row for a single crop/mutation
const CropItemRow: React.FC<{
  crop: CropDefinition;
  mutation?: MutationDefinition;
  priority: number;
  defaultPriority: number;
  isPlacementActive: boolean;
  onInfoClick: () => void;
  onEditClick: () => void;
  onPriorityChange: (value: number) => void;
  onRowClick?: () => void;
}> = ({
  crop,
  mutation,
  priority,
  defaultPriority,
  isPlacementActive,
  onInfoClick,
  onEditClick,
  onPriorityChange,
  onRowClick,
}) => {
  // Show the input value only if it differs from default
  const displayValue = priority !== defaultPriority ? priority.toString() : "";
  const [inputValue, setInputValue] = useState<string>(displayValue);
  
  // Update inputValue when priority prop changes
  useEffect(() => {
    setInputValue(displayValue);
  }, [displayValue]);
  
  // Get the rarity color for the name
  const nameColorClass = mutation ? getRarityTextColor(mutation.rarity) : "text-white";
  
  const handlePriorityChange = (value: string) => {
    setInputValue(value);
    if (value === "") {
      // Reset to default when cleared
      onPriorityChange(defaultPriority);
      return;
    }
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      onPriorityChange(numValue);
    }
  };
  
  const incrementPriority = () => {
    const newValue = Math.min(100, priority + 1);
    setInputValue(newValue !== defaultPriority ? newValue.toString() : "");
    onPriorityChange(newValue);
  };
  
  const decrementPriority = () => {
    const newValue = Math.max(0, priority - 1);
    setInputValue(newValue !== defaultPriority ? newValue.toString() : "");
    onPriorityChange(newValue);
  };
  
  return (
    <div
      onClick={onRowClick}
      className={`flex items-center gap-2 px-2 py-1 transition-colors ${
        isPlacementActive ? "bg-emerald-500/10" : "hover:bg-slate-800/50"
      } ${onRowClick && mutation ? "cursor-pointer" : ""}`}
    >
      <CropImage
        cropId={crop.id}
        cropName={crop.name}
        size="sm"
        className="h-7 w-7 flex-shrink-0 overflow-hidden rounded-sm bg-slate-800/60"
        imageClassName="w-6 h-6"
        fallbackClassName="text-[11px] text-slate-400"
      />

      <span className={`min-w-0 flex-1 truncate text-[12px] font-medium ${nameColorClass}`}>{crop.name}</span>

      <div className="flex flex-shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onInfoClick}
          className={`cursor-pointer rounded-sm p-1.5 text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-emerald-300 ${FOCUS}`}
          title="View details"
          aria-label={`Details for ${crop.name}`}
        >
          <Info className="h-4 w-4" />
        </button>

        <button
          onClick={onEditClick}
          className={`cursor-pointer rounded-sm p-1.5 transition-colors ${FOCUS} ${
            isPlacementActive
              ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
              : "text-slate-400 hover:bg-slate-700/60 hover:text-emerald-300"
          }`}
          title={isPlacementActive ? "Cancel placement" : "Place on grid"}
          aria-label={isPlacementActive ? `Cancel placing ${crop.name}` : `Place ${crop.name} on grid`}
        >
          {isPlacementActive ? <X className="h-4 w-4" /> : <Brush className="h-4 w-4" />}
        </button>

        {/*
         * Priority. The word used to sit above the field as a 10px caption on
         * every row, so the list carried it 40 times over to label one number.
         * It is a tooltip now, and the chevrons stack inside the control
         * instead of hanging off it.
         */}
        <span
          className="ml-0.5 inline-flex items-center overflow-hidden rounded-md border border-slate-700"
          title="Priority. Higher means use less of this crop. 0 is no preference, 100 avoids it."
        >
          <input
            type="number"
            min={0}
            max={100}
            value={inputValue}
            placeholder={defaultPriority.toString()}
            aria-label={`Priority for ${crop.name}`}
            onChange={(e) => handlePriorityChange(e.target.value)}
            className={`w-9 bg-slate-950 px-1 py-1 text-center text-[11px] leading-4 text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/70 ${NUM} ${FOCUS}`}
          />
          <span className="flex flex-col border-l border-slate-700">
            <button
              onClick={incrementPriority}
              className={`cursor-pointer bg-slate-800/60 px-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200 ${FOCUS}`}
              title="Increase priority"
              aria-label={`Increase priority for ${crop.name}`}
            >
              <ChevronUp className="h-2.5 w-2.5" />
            </button>
            <button
              onClick={decrementPriority}
              className={`cursor-pointer border-t border-slate-700 bg-slate-800/60 px-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200 ${FOCUS}`}
              title="Decrease priority"
              aria-label={`Decrease priority for ${crop.name}`}
            >
              <ChevronDown className="h-2.5 w-2.5" />
            </button>
          </span>
        </span>
      </div>
    </div>
  );
};

// Locked placement item in the list
const LockedPlacementItem: React.FC<{
  placement: { id: string; crop: string; position: [number, number]; size: number };
  cropName: string;
  onRemove: () => void;
}> = ({ placement, cropName, onRemove }) => {
  return (
    /*
     * A locked placement is a thing you chose, so it takes the accent rather
     * than a fourth colour of its own. It also stops being a bordered box:
     * these already sit in a bordered panel under a heading that counts them.
     */
    <div className="flex items-center gap-2 px-1 py-1">
      <CropImage
        cropId={placement.crop}
        cropName={cropName}
        size="xs"
        className="h-5 w-5 flex-shrink-0"
        imageClassName="w-4 h-4"
        fallbackText=""
        showFallback={false}
      />
      <span className="min-w-0 flex-1 truncate text-[11px] text-slate-200">{cropName}</span>
      <span className={`flex-shrink-0 text-[11px] text-slate-400 ${NUM}`}>
        {placement.position[0]}, {placement.position[1]}
      </span>
      <button
        onClick={onRemove}
        className={`flex-shrink-0 cursor-pointer rounded-sm p-0.5 text-slate-400 transition-colors hover:bg-red-500/15 hover:text-red-400 ${FOCUS}`}
        title="Remove locked placement"
        aria-label={`Remove locked ${cropName}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export const CropConfigurationsPanel: React.FC<CropConfigurationsPanelProps> = ({
  className = "",
}) => {
  const { crops, getCropDef, getMutationDef, addMutation } = useGreenhouseData();
  const {
    lockedPlacements,
    selectedCropForPlacement,
    setSelectedCropForPlacement,
    removeLockedPlacement,
    clearLockedPlacements,
    setPriority,
    getPriority,
    priorities,
    defaultPriorities,
  } = useLockedPlacements();
  
  const { openInfo } = useInfoModal();
  const [priorityWarningDismissed, setPriorityWarningDismissed] = useState(false);
  
  // Use shared filtering hook
  const { searchTerm, setSearchTerm, filter, setFilter, filteredCrops } = useCropFiltering({
    crops,
    mutations: [], // Not needed since we use getMutationDef from context
  });
  
  // Check if any priorities differ from defaults
  const hasPriorities = useMemo(() => {
    return Object.keys(priorities).some((cropId) => {
      const currentPriority = priorities[cropId] || 0;
      const defaultPriority = defaultPriorities[cropId] || 0;
      return currentPriority !== defaultPriority;
    });
  }, [priorities, defaultPriorities]);
  
  // Listen for Escape key to cancel placement mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedCropForPlacement) {
        setSelectedCropForPlacement(null);
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedCropForPlacement, setSelectedCropForPlacement]);
  
  // Handle info button click
  const handleInfoClick = useCallback((crop: CropDefinition) => {
    openInfo(crop.id);
  }, [openInfo]);
  
  // Handle edit button click (toggle placement mode)
  const handleEditClick = useCallback((crop: CropDefinition) => {
    if (selectedCropForPlacement?.id === crop.id) {
      // Toggle off
      setSelectedCropForPlacement(null);
    } else {
      // Select this crop for placement
      const selection: SelectedCropForPlacement = {
        id: crop.id,
        name: crop.name,
        size: crop.size,
        ground: crop.ground,
      };
      setSelectedCropForPlacement(selection);
    }
  }, [selectedCropForPlacement, setSelectedCropForPlacement]);
  
  // Get display name for locked placement
  const getLockedPlacementName = useCallback((cropId: string): string => {
    const def = getCropDef(cropId);
    if (def) return def.name;
    const mutDef = getMutationDef(cropId);
    if (mutDef) return mutDef.name;
    return cropId;
  }, [getCropDef, getMutationDef]);
  
  // Handle clicking on a mutation row to add it to targets
  const handleMutationRowClick = useCallback((crop: CropDefinition) => {
    if (crop.isMutation) {
      addMutation(crop.id, crop.name);
    }
  }, [addMutation]);
  
  return (
    <div className={`flex h-full flex-col gap-2.5 ${className}`}>
      <div className={`${PANEL} flex flex-1 flex-col overflow-hidden p-3`}>
        <div className="mb-2 flex flex-shrink-0 items-center justify-between gap-2">
          <h3 className="text-[12px] font-semibold tracking-tight text-slate-200">Crop configurations</h3>
          <button
            onClick={() => {
              Object.keys(priorities).forEach((cropId) => {
                setPriority(cropId, defaultPriorities[cropId] || 0);
              });
            }}
            className={`cursor-pointer rounded-sm px-1 text-[11px] text-emerald-300 transition-colors hover:text-emerald-200 ${FOCUS}`}
            title="Reset all priorities to defaults"
          >
            Reset priorities
          </button>
        </div>

        <SearchFilterHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filter={filter}
          onFilterChange={setFilter}
          className="mb-2 flex-shrink-0"
        />
        
        {/* Priority Warning - dismissible, once per session */}
        {hasPriorities && !priorityWarningDismissed && (
          <div className="mb-2 flex items-start gap-2 rounded-md border border-amber-500/25 bg-amber-500/5 px-2 py-1.5">
            <AlertTriangle className="mt-px h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
            <p className="flex-1 text-[11px] leading-snug text-amber-200">
              Setting priorities reduces solver cache efficiency and may increase solve times.
            </p>
            <button
              onClick={() => setPriorityWarningDismissed(true)}
              className={`cursor-pointer rounded-sm p-0.5 text-amber-300 transition-colors hover:bg-amber-500/20 hover:text-amber-200 ${FOCUS}`}
              title="Dismiss"
              aria-label="Dismiss priority warning"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        
        {/*
         * Hairlines, not gaps. Forty crops at a 56px box plus an 8px gap was
         * 2.5k pixels of scroll to look through a list; the rows are the same
         * list at a third of the travel, and the divider tells you where one
         * ends more precisely than the space did.
         */}
        <div className="min-h-0 flex-1 divide-y divide-slate-800 overflow-y-auto scrollbar-dark">
          {filteredCrops.length === 0 ? (
            <div className="py-4 text-center text-[11px] text-slate-500">No items match the filter</div>
          ) : (
            filteredCrops.map((crop) => {
              const mutation = crop.isMutation ? getMutationDef(crop.id) : undefined;
              const isActive = selectedCropForPlacement?.id === crop.id;
              const priority = getPriority(crop.id);
              const defaultPriority = defaultPriorities[crop.id] || 0;
              
              return (
                <CropItemRow
                  key={crop.id}
                  crop={crop}
                  mutation={mutation}
                  priority={priority}
                  defaultPriority={defaultPriority}
                  isPlacementActive={isActive}
                  onInfoClick={() => handleInfoClick(crop)}
                  onEditClick={() => handleEditClick(crop)}
                  onPriorityChange={(val) => setPriority(crop.id, val)}
                  onRowClick={crop.isMutation ? () => handleMutationRowClick(crop) : undefined}
                />
              );
            })
          )}
        </div>
      </div>
      
      {/* Locked Placements Summary - Separate panel below */}
      {lockedPlacements.length > 0 && (
        <div className={`${PANEL} p-3`}>
          <div className="mb-1 flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
            <span className="flex items-center gap-1.5 text-[12px] font-semibold tracking-tight text-slate-200">
              <Lock className="h-3.5 w-3.5 text-emerald-300" />
              Locked placements
              <span className={`text-slate-400 ${NUM}`}>{lockedPlacements.length}</span>
            </span>
            <button
              onClick={clearLockedPlacements}
              className={`cursor-pointer rounded-sm p-1 text-slate-400 transition-colors hover:bg-red-500/15 hover:text-red-400 ${FOCUS}`}
              title="Clear all locked placements"
              aria-label="Clear all locked placements"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="max-h-32 divide-y divide-slate-800 overflow-y-auto scrollbar-dark">
            {lockedPlacements.map((placement) => (
              <LockedPlacementItem
                key={placement.id}
                placement={placement}
                cropName={getLockedPlacementName(placement.crop)}
                onRemove={() => removeLockedPlacement(placement.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
