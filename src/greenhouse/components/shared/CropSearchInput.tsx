import React from "react";
import { Search, X } from "lucide-react";
import { FOCUS, INPUT } from "../../../ui/kit";

export interface CropSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Shared search input component used in both Calculator and Designer
 */
export const CropSearchInput: React.FC<CropSearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}) => {
  return (
    /*
     * Takes the kit's INPUT rather than its own filled-and-bordered variant,
     * so a search field looks the same here as everywhere else on the site
     * and picks up the shared focus ring for free.
     */
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={`${INPUT} w-full pl-7 ${value ? "pr-7" : ""}`}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          title="Clear search"
          aria-label="Clear search"
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-sm p-0.5 text-slate-400 transition-colors hover:text-slate-100 ${FOCUS}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};
