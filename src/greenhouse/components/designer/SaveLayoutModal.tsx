import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Save, X } from "lucide-react";
import { useDesigner } from "../../context";
import { FOCUS } from "../../../ui/kit";
import { DesignerLayoutPreview } from "./DesignerLayoutPreview";

interface SaveLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, overwriteId?: string) => void;
  existingLayouts: Array<{ id: string; name: string }>;
}

export const SaveLayoutModal: React.FC<SaveLayoutModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingLayouts,
}) => {
  const { inputPlacements, targetPlacements } = useDesigner();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);
  const [existingLayoutId, setExistingLayoutId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentLayout = useMemo(
    () => ({
      inputs: inputPlacements.map(({ cropId, position }) => ({ cropId, position })),
      targets: targetPlacements.map(({ cropId, position }) => ({ cropId, position })),
    }),
    [inputPlacements, targetPlacements],
  );

  useEffect(() => {
    if (!isOpen) return;
    setName("");
    setError("");
    setShowOverwriteWarning(false);
    setExistingLayoutId(null);
    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    const previousOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.documentElement.style.overflow = previousOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isOpen, onClose]);

  const handleNameChange = (nextName: string) => {
    setName(nextName);
    setError("");
    setShowOverwriteWarning(false);
    setExistingLayoutId(null);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Enter a layout name.");
      return;
    }
    if (trimmedName.length > 50) {
      setError("Layout names can be up to 50 characters.");
      return;
    }

    const existing = existingLayouts.find((layout) => layout.name === trimmedName);
    if (existing && !showOverwriteWarning) {
      setExistingLayoutId(existing.id);
      setShowOverwriteWarning(true);
      setError(`“${trimmedName}” already exists. Select Save layout again to replace it.`);
      return;
    }

    onSave(trimmedName, existingLayoutId ?? undefined);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-layout-title"
        className="sd-lip my-auto flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-md border border-slate-700 bg-slate-900 shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-700 bg-slate-800/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Save className="h-5 w-5 text-emerald-300" />
            <h2 id="save-layout-title" className="text-lg font-semibold text-slate-50">
              Save layout
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Save layout"
            className={`cursor-pointer rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-100 ${FOCUS}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
            <div>
              <label htmlFor="layout-name" className="mb-1.5 block text-[12px] font-medium text-slate-300">
                Layout name
              </label>
              <input
                ref={inputRef}
                id="layout-name"
                type="text"
                value={name}
                onChange={(event) => handleNameChange(event.target.value)}
                placeholder="e.g., Soggybud pair"
                className={`w-full rounded-md border border-slate-600/60 bg-slate-800/70 px-3 py-2 text-[13px] text-slate-100 placeholder:text-slate-500 ${FOCUS}`}
                maxLength={50}
                aria-invalid={Boolean(error) && !showOverwriteWarning}
                aria-describedby={error ? "save-layout-error" : undefined}
              />
              {error && (
                <p id="save-layout-error" className={`mt-1.5 text-[11px] ${showOverwriteWarning ? "text-amber-300" : "text-red-400"}`}>
                  {error}
                </p>
              )}
            </div>

            <DesignerLayoutPreview layout={currentLayout} />
          </div>

          <div className="flex shrink-0 gap-2 border-t border-slate-700 bg-slate-900 px-4 py-3 sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 cursor-pointer rounded-md border border-slate-600 bg-slate-800/70 px-4 py-2 text-[12px] font-medium text-slate-300 transition-colors hover:bg-slate-700 sm:flex-none ${FOCUS}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-[12px] font-medium text-emerald-200 transition-colors hover:bg-emerald-500/30 sm:flex-none ${FOCUS}`}
            >
              <Save className="h-4 w-4" />
              Save layout
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
