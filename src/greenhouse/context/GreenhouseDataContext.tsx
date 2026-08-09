import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import type { CropDefinition, MutationDefinition, SelectedMutation } from "../types/greenhouse";
import { LocalStorageManager } from "../utilities";
import { refreshWiki, useGreenhouseDataset } from "../data/datasetStore";
import { setUniqueCrops as writeUniqueCrops, useUniqueCrops } from "../data/uniqueCropsStore";
import type { FieldChange } from "../data/wikiSync";

/**
 * The greenhouse provider, now a consumer rather than an author.
 *
 * This used to assemble the mutation list itself: import the bundled JSON,
 * read the wiki cache, apply the overlay, fetch a refresh, and hold the result
 * in component state. `greenhouseDataService` and the Dashboard each did their
 * own version of the same job, and the three answers drifted apart - which is
 * how the Dashboard and the Planner ended up reporting different owned counts
 * for the same mutation.
 *
 * All of that now lives in `data/datasetStore`, and this file reads it. What
 * is left here is the part that genuinely belongs to the solver page's
 * provider tree and nowhere else: which mutations you have picked as targets,
 * and the lookup helpers built over the shared lists.
 *
 * The shape handed to consumers is unchanged. Everything that destructured
 * `crops`, `mutations`, `isLoading`, `error` or `wikiSync` off this context
 * still gets exactly the same fields, from one source instead of three.
 */

interface GreenhouseDataContextType {
  crops: CropDefinition[];
  mutations: MutationDefinition[];
  isLoading: boolean;
  error: string | null;

  // mutations for solving
  selectedMutations: SelectedMutation[];
  addMutation: (id: string, name: string) => void;
  removeMutation: (id: string) => void;
  updateMutationMode: (id: string, mode: "maximize" | "target") => void;
  updateMutationTargetCount: (id: string, count: number) => void;
  clearSelectedMutations: () => void;

  uniqueCrops: number;
  setUniqueCrops: (value: number) => void;

  /** Live wiki sync state. */
  wikiSync: {
    /** When the wiki data in use was fetched. Null means bundled copy only. */
    fetchedAt: number | null;
    syncing: boolean;
    error: string | null;
    /** What the wiki changed relative to the bundled data. */
    changes: FieldChange[];
    refresh: () => void;
  };

  // mutation definition
  getMutationDef: (id: string) => MutationDefinition | undefined;
  getCropDef: (id: string) => CropDefinition | undefined;
}

const GreenhouseDataContext = createContext<GreenhouseDataContextType | null>(null);

export const GreenhouseDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dataset = useGreenhouseDataset();
  const { crops, mutations } = dataset;

  const [selectedMutations, setSelectedMutations] = useState<SelectedMutation[]>(() => {
    // Try to load from localStorage
    const saved = LocalStorageManager.loadMutationTargets();
    return saved || [];
  });
  const isInitialMutationsMount = useRef(true);

  const uniqueCrops = useUniqueCrops();

  // Save mutation targets to localStorage when they change (but not empty defaults)
  useEffect(() => {
    if (isInitialMutationsMount.current) {
      const saved = LocalStorageManager.loadMutationTargets();
      isInitialMutationsMount.current = false;
      if (!saved || saved.length === 0) {
        return; // Don't save empty array on initial mount
      }
    }
    LocalStorageManager.saveMutationTargets(selectedMutations);
  }, [selectedMutations]);

  const addMutation = useCallback((id: string, name: string) => {
    setSelectedMutations(prev => {
      if (prev.some(m => m.id === id)) return prev;
      return [...prev, { id, name, mode: "target", targetCount: 1 }];
    });
  }, []);

  const removeMutation = useCallback((id: string) => {
    setSelectedMutations(prev => prev.filter(m => m.id !== id));
  }, []);

  const updateMutationMode = useCallback((id: string, mode: "maximize" | "target") => {
    setSelectedMutations(prev =>
      prev.map(m => (m.id === id ? { ...m, mode } : m))
    );
  }, []);

  const updateMutationTargetCount = useCallback((id: string, count: number) => {
    setSelectedMutations(prev =>
      prev.map(m => (m.id === id ? { ...m, targetCount: count } : m))
    );
  }, []);

  const clearSelectedMutations = useCallback(() => {
    setSelectedMutations([]);
  }, []);

  const setUniqueCrops = useCallback((value: number) => {
    writeUniqueCrops(value);
  }, []);

  const wikiSync = {
    fetchedAt: dataset.wiki.fetchedAt,
    syncing: dataset.wiki.syncing,
    error: dataset.wiki.error,
    changes: dataset.wiki.changes,
    refresh: refreshWiki,
  };

  const getMutationDef = useCallback((id: string): MutationDefinition | undefined => {
    return mutations.find(m => m.id === id);
  }, [mutations]);

  const getCropDef = useCallback((id: string): CropDefinition | undefined => {
    return crops.find(c => c.id === id);
  }, [crops]);

  const value: GreenhouseDataContextType = {
    crops,
    mutations,
    isLoading: dataset.isLoading,
    error: dataset.error,
    selectedMutations,
    addMutation,
    removeMutation,
    updateMutationMode,
    updateMutationTargetCount,
    clearSelectedMutations,
    uniqueCrops,
    setUniqueCrops,
    wikiSync,
    getMutationDef,
    getCropDef,
  };

  return (
    <GreenhouseDataContext.Provider value={value}>
      {children}
    </GreenhouseDataContext.Provider>
  );
};

export const useGreenhouseData = (): GreenhouseDataContextType => {
  const context = useContext(GreenhouseDataContext);
  if (!context) {
    throw new Error("useGreenhouseData must be used within a GreenhouseDataProvider");
  }
  return context;
};
