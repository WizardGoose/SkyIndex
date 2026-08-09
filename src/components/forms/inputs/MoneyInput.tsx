import React from "react";
import { FOCUS } from "../../../ui/kit";

interface MoneyInputProps {
  value: string;
  onChange: (value: string) => void;
  onEnterPress?: () => void;
  className?: string;
  placeholder?: string;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({ value, onChange, onEnterPress, className = "", placeholder = "" }) => (
  <div className="relative">
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
          if (onEnterPress) onEnterPress();
        }
      }}
      className={`w-full px-3 py-2 pr-20 text-sm bg-white/5 border border-white/10 rounded-md text-white placeholder-slate-400 hover:border-white/20 hover:bg-white/10 transition-all duration-200 ${FOCUS} ${className}`}
      placeholder={placeholder}
    />
    <div className="absolute right-3 top-2.5 text-xs text-slate-500 pointer-events-none">coins / hr</div>
    <p className="mt-1 text-xs text-slate-400">Empty = ignore key cost</p>
  </div>
);
