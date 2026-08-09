import React from "react";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { FOCUS } from "../../ui/kit";

interface DropdownButtonProps {
  children: ReactNode;
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export const DropdownButton: React.FC<DropdownButtonProps> = ({ children, isOpen, onClick, className = "" }) => (
  <button
    type="button"
    className={`w-full flex items-center justify-between gap-1 lg:gap-2 px-1 lg:px-2 py-1 lg:py-2 text-slate-200 rounded shadow-sm border cursor-pointer bg-white/8 border-white/12 hover:bg-white/12 transition-colors duration-200 ${FOCUS} ${className}`}
    onClick={onClick}
    tabIndex={0}
  >
    <div className="min-w-0 flex-1 pointer-events-none">{children}</div>
    <ChevronDown className={`flex-shrink-0 w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
  </button>
);
