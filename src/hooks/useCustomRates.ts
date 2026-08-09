import { useState, useEffect } from "react";
import { DataService } from "../services";

export const useCustomRates = () => {
  const [customRates, setCustomRates] = useState<Record<string, number | undefined>>({});
  const [defaultRates, setDefaultRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRates = async () => {
      try {
        setLoading(true);
        const dataService = DataService.getInstance();
        const defaults = await dataService.loadDefaultRates();
        setDefaultRates(defaults);

        // Load custom rates from localStorage
        const stored = localStorage.getItem("customRates");
        const parsed = stored ? JSON.parse(stored) : {};
        setCustomRates(parsed);
      } catch (error) {
        console.error("Failed to load rates:", error);
        setCustomRates({});
        setDefaultRates({});
      } finally {
        setLoading(false);
      }
    };

    loadRates().catch(console.error);
  }, []);

  const updateRate = (shardId: string, rate: number | undefined) => {
    const newRates = rate === undefined ? { ...customRates, [shardId]: undefined } : { ...customRates, [shardId]: rate };

    setCustomRates(newRates);

    // Save only defined values that differ from defaults
    const customChanges = Object.fromEntries(Object.entries(newRates).filter(([id, value]) => value !== undefined && value !== defaultRates[id]));

    try {
      if (Object.keys(customChanges).length > 0) {
        localStorage.setItem("customRates", JSON.stringify(customChanges));
      } else {
        localStorage.removeItem("customRates");
      }
    } catch {
      // React state above already holds the new rate, so this session behaves
      // correctly either way; only carrying it to the next visit is lost.
    }
  };

  const resetRates = () => {
    setCustomRates({});
    localStorage.removeItem("customRates");
  };

  return {
    customRates,
    defaultRates,
    loading,
    updateRate,
    resetRates,
  };
};
