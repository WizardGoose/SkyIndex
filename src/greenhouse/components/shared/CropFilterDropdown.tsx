import React, { useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { getRarityTextColor } from "../../utilities";
import { BTN_QUIET } from "../../../ui/kit";
import type { CropFilterCategory } from "../../types/greenhouse";

export interface FilterOption {
  value: CropFilterCategory;
  label: string;
}

export interface CropFilterDropdownProps {
  value: CropFilterCategory;
  onChange: (value: CropFilterCategory) => void;
  options: FilterOption[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  getFilterColor?: (value: CropFilterCategory) => string;
  className?: string;
}

/**
 * Default color function for filter options
 * Uses centralized rarity color utilities
 */
export const defaultGetFilterColor = (value: CropFilterCategory): string => {
  // Rarity-based filters use getRarityTextColor
  if (value === "common" || value === "uncommon" || value === "rare" || value === "epic" || value === "legendary") {
    return getRarityTextColor(value);
  }
  // Non-rarity filters use default color
  return "text-slate-300";
};

/**
 * Shared filter dropdown component used in both Calculator and Designer
 */
export const CropFilterDropdown: React.FC<CropFilterDropdownProps> = ({
  value,
  onChange,
  options,
  isOpen,
  onToggle,
  onClose,
  getFilterColor = defaultGetFilterColor,
  className = "",
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);
  
  const currentLabel = options.find(opt => opt.value === value)?.label || "All";
  
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={onToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`${BTN_QUIET} whitespace-nowrap`}
      >
        <span>{currentLabel}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        /* Options are 24px rows on hairlines rather than 36px rows on gaps,
           so the whole rarity list fits without the menu needing to scroll. */
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-1 max-h-60 min-w-[150px] divide-y divide-slate-800 overflow-y-auto rounded-md border border-slate-700 bg-slate-900 shadow-xl scrollbar-dark"
        >
          {options.map((option) => (
            <li
              key={option.value}
              role="option"
              aria-selected={value === option.value}
              onClick={() => {
                onChange(option.value);
                onClose();
              }}
              className={`cursor-pointer px-2.5 py-1 text-[11px] leading-4 transition-colors ${
                value === option.value ? "bg-emerald-500/15" : "hover:bg-slate-800"
              }`}
            >
              <span className={getFilterColor(option.value)}>{option.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
