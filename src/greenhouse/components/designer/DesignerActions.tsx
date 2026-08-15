import React, { useCallback, useMemo, useState, type RefObject } from "react";
import { Save, FolderOpen, Share2, Clipboard, Trash2, RotateCcw, Layers, X, Image, Film, Download, ClipboardCopy, Loader2, Undo2, Redo2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDesigner, useGreenhouseData } from "../../context";
import { useToast } from "../ui/toastContext";
import { encodeDesign, decodeDesign, extractLayoutCode, buildShareUrl } from "../../utilities";
import { generateLayoutId } from "../../utilities/layoutStorage";
import {
  captureGridAsPng,
  captureGridAsGif,
  copyBlobToClipboard,
  downloadBlob,
  aggregateCropInfo,
  type ExportOptions,
} from "../../utilities/gridExport";
import type { SavedLayout } from "../../types/layout";
import type { DesignerGridHandle } from "./DesignerGrid";
import { SaveLayoutModal } from "./SaveLayoutModal";
import { LoadLayoutModal } from "./LoadLayoutModal";
import { SendToGameButton } from "./SendToGameButton";
import type { LayoutItem } from "../../../island/layout";
import { FOCUS } from "../../../ui/kit";

interface DesignerActionsProps {
  className?: string;
  gridRef?: RefObject<DesignerGridHandle | null>;
  showTargets?: boolean;
}

type ExportFormat = "png" | "gif";
type ExportStep = "choose-format" | "exporting" | "choose-action";

export const DesignerActions: React.FC<DesignerActionsProps> = ({ 
  className = "",
  gridRef,
  showTargets = true,
}) => {
  const { 
    mode, 
    setMode,
    inputPlacements, 
    targetPlacements, 
    clearInputPlacements, 
    clearTargetPlacements,
    clearAllPlacements,
    loadFromSolverResult,
    selectedCropForPlacement,
    setSelectedCropForPlacement,
    canUndo,
    canRedo,
    undo,
    redo,
    mostRecentLayout,
    savedLayouts,
    restoreMostRecent,
    saveNamedLayout,
    deleteNamedLayout,
    renameNamedLayout,
  } = useDesigner();
  const { getCropDef, getMutationDef } = useGreenhouseData();
  const { toast } = useToast();
  
  // State for modals
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  
  // Export state
  const [exportStep, setExportStep] = useState<ExportStep>("choose-format");
  const [exportFormat, setExportFormat] = useState<ExportFormat | null>(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [currentExportBlob, setCurrentExportBlob] = useState<Blob | null>(null);
  const [hasExportedOnce, setHasExportedOnce] = useState(false);
  
  // Delete all confirmation state
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  
  // Reset export state
  const resetExportState = useCallback(() => {
    setExportStep("choose-format");
    setExportFormat(null);
    setExportProgress(0);
    setCurrentExportBlob(null);
  }, []);
  
  // Handle mode change with auto-deselect
  const handleModeChange = useCallback((newMode: "inputs" | "targets") => {
    setMode(newMode);
    
    // If switching to targets and a non-mutation crop is selected, deselect it
    if (newMode === "targets" && selectedCropForPlacement && !selectedCropForPlacement.isMutation) {
      setSelectedCropForPlacement(null);
    }
  }, [setMode, selectedCropForPlacement, setSelectedCropForPlacement]);
  
  // Open save modal
  const handleOpenSave = useCallback(() => {
    if (inputPlacements.length === 0 && targetPlacements.length === 0) {
      return; // Button is disabled, but just in case
    }
    setIsSaveModalOpen(true);
  }, [inputPlacements.length, targetPlacements.length]);
  
  // Save layout
  const handleSaveLayout = useCallback((name: string, overwriteId?: string) => {
    const now = Date.now();

    const layout: SavedLayout = {
      id: overwriteId ?? generateLayoutId(),
      name,
      savedAt: now,
      modifiedAt: now,
      inputs: inputPlacements.map(({ cropId, position }) => ({ cropId, position })),
      targets: targetPlacements.map(({ cropId, position }) => ({ cropId, position })),
    };

    if (!saveNamedLayout(layout, overwriteId)) {
      toast({
        title: overwriteId ? "Failed to update layout" : "Could not save layout",
        description: "Browser storage is full. Delete a saved layout and try again.",
        variant: "error",
        duration: 6000,
      });
      return;
    }

    setIsSaveModalOpen(false);
    toast({
      title: overwriteId ? "Layout updated" : "Layout saved",
      description: `"${name}" has been ${overwriteId ? "updated" : "saved"}`,
      variant: "success",
      duration: 3000,
    });
  }, [inputPlacements, targetPlacements, saveNamedLayout, toast]);
  
  // Open load modal
  const handleOpenLoad = useCallback(() => {
    if (savedLayouts.length === 0 && !mostRecentLayout) {
      toast({
        title: "Nothing to load yet",
        description: "Save a layout or keep designing to create a recovery point.",
        variant: "warning",
        duration: 3000,
      });
      return;
    }
    setIsLoadModalOpen(true);
  }, [savedLayouts.length, mostRecentLayout, toast]);
  
  // Load layout
  const handleLoadLayout = useCallback((layout: SavedLayout) => {
    // Get size and name info from crop definitions
    const crops = layout.inputs.map(p => {
      const cropDef = getCropDef(p.cropId);
      const mutationDef = getMutationDef(p.cropId);
      const displayName = cropDef?.name || mutationDef?.name || p.cropId.replace(/_/g, " ");
      return {
        id: p.cropId,
        name: displayName,
        position: p.position,
        size: cropDef?.size || mutationDef?.size || 1,
      };
    });
    
    const mutations = layout.targets.map(p => {
      const mutationDef = getMutationDef(p.cropId);
      const cropDef = getCropDef(p.cropId);
      const displayName = mutationDef?.name || cropDef?.name || p.cropId.replace(/_/g, " ");
      return {
        id: p.cropId,
        name: displayName,
        position: p.position,
        size: mutationDef?.size || cropDef?.size || 1,
      };
    });
    
    loadFromSolverResult(crops, mutations);
    setIsLoadModalOpen(false);
    
    toast({
      title: "Layout loaded",
      description: `"${layout.name}" has been loaded`,
      variant: "success",
      duration: 3000,
    });
  }, [loadFromSolverResult, getCropDef, getMutationDef, toast]);

  const handleLoadMostRecent = useCallback(() => {
    if (!restoreMostRecent()) return;
    setIsLoadModalOpen(false);
    toast({
      title: "Most Recent loaded",
      variant: "success",
      duration: 3000,
    });
  }, [restoreMostRecent, toast]);
  
  // Delete layout
  const handleDeleteLayout = useCallback((layoutId: string) => {
    const success = deleteNamedLayout(layoutId);
    if (success) {
      toast({
        title: "Layout deleted",
        description: "Use Undo or Ctrl+Z to restore it.",
        variant: "success",
        duration: 4000,
      });
    } else {
      toast({
        title: "Failed to delete layout",
        variant: "error",
        duration: 3000,
      });
    }
  }, [deleteNamedLayout, toast]);
  
  // Rename layout
  const handleRenameLayout = useCallback((layoutId: string, newName: string) => {
    const success = renameNamedLayout(layoutId, newName);
    if (success) {
      toast({
        title: "Layout renamed",
        description: `Renamed to "${newName}"`,
        variant: "success",
        duration: 2000,
      });
    } else {
      toast({
        title: "Failed to rename layout",
        variant: "error",
        duration: 3000,
      });
    }
  }, [renameNamedLayout, toast]);
  
  // State for import modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState("");
  
  /*
   * Copy a share link to the clipboard.
   *
   * The link is built on our own origin from Vite's deploy base, so it opens on
   * whichever deployment produced it (see buildShareUrl, which also records
   * what was removed here and why). Nothing is uploaded: the code is the whole
   * layout.
   */
  const handleExportCode = useCallback(() => {
    try {
      const encoded = encodeDesign(inputPlacements, targetPlacements);
      const shareUrl = buildShareUrl(encoded, window.location.origin, import.meta.env.BASE_URL);
      navigator.clipboard.writeText(shareUrl);

      toast({
        title: "Share link copied!",
        description: "Paste this link in Discord or share with others",
        variant: "success",
        duration: 3000,
      });
    } catch (err) {
      toast({
        title: "Export failed",
        description: err instanceof Error ? err.message : "Failed to encode design",
        variant: "error",
        duration: 5000,
      });
    }
  }, [inputPlacements, targetPlacements, toast]);
  
  // Open import modal
  const handleOpenImport = useCallback(() => {
    setImportText("");
    setIsImportModalOpen(true);
  }, []);
  
  /*
   * `extractLayoutCode` now lives in ../../utilities/designEncoding beside the
   * codec it feeds, so the paste shapes it understands (our own link, a legacy
   * share link, a bare code) can be tested without mounting a component.
   */

  // Import design from a share link or a raw code
  const handleImportFromText = useCallback(() => {
    if (!importText.trim()) {
      toast({
        title: "No code provided",
        description: "Paste a design code or share link to import",
        variant: "warning",
        duration: 3000,
      });
      return;
    }
    
    try {
      const layoutCode = extractLayoutCode(importText);
      const { inputs, targets } = decodeDesign(layoutCode);
      
      // Get size info from crop definitions
      const crops = inputs.map(p => {
        const cropDef = getCropDef(p.cropId);
        const mutationDef = getMutationDef(p.cropId);
        const displayName = cropDef?.name || mutationDef?.name || p.cropId.replace(/_/g, " ");
        return {
          id: p.cropId,
          name: displayName,
          position: p.position,
          size: cropDef?.size || mutationDef?.size || 1,
        };
      });
      
      const mutations = targets.map(p => {
        const mutationDef = getMutationDef(p.cropId);
        const cropDef = getCropDef(p.cropId);
        const displayName = mutationDef?.name || cropDef?.name || p.cropId.replace(/_/g, " ");
        return {
          id: p.cropId,
          name: displayName,
          position: p.position,
          size: mutationDef?.size || cropDef?.size || 1,
        };
      });
      
      loadFromSolverResult(crops, mutations);
      setIsImportModalOpen(false);
      setImportText("");
      
      toast({
        title: "Design imported",
        description: `Loaded ${inputs.length} inputs and ${targets.length} targets`,
        variant: "success",
        duration: 3000,
      });
    } catch (err) {
      toast({
        title: "Import failed",
        description: err instanceof Error ? err.message : "Invalid design code",
        variant: "error",
        duration: 5000,
      });
    }
  }, [importText, loadFromSolverResult, getCropDef, getMutationDef, toast]);
  
  // Clear current mode's placements
  const handleClearCurrent = useCallback(() => {
    if (mode === "inputs") {
      clearInputPlacements();
      toast({ title: "Input placements cleared", variant: "success", duration: 2000 });
    } else {
      clearTargetPlacements();
      toast({ title: "Target placements cleared", variant: "success", duration: 2000 });
    }
  }, [mode, clearInputPlacements, clearTargetPlacements, toast]);
  
  // Clear all placements
  const handleClearAll = useCallback(() => {
    if (!showDeleteAllConfirm) {
      setShowDeleteAllConfirm(true);
      return;
    }
    clearAllPlacements();
    setShowDeleteAllConfirm(false);
    toast({ title: "All placements cleared", variant: "success", duration: 2000 });
  }, [showDeleteAllConfirm, clearAllPlacements, toast]);
  
  // Get export options
  const getExportOptions = useCallback((): ExportOptions => {
    const inputCrops = aggregateCropInfo(inputPlacements);
    const targetCrops = aggregateCropInfo(targetPlacements);
    
    return {
      scale: 2,
      includeWatermark: true,
      /*
       * Brand text drawn into the exported PNG. It used to read
       * "greenhouse.skyshards.com", which put a host we no longer depend on at
       * all onto every image a user posts. Fork credit belongs in NOTICE.md and
       * the site footer, where it already is.
       */
      watermarkUrl: "Skydex",
      watermarkTitle: "Greenhouse Designer",
      inputCrops,
      targetCrops,
      showTargets,
    };
  }, [inputPlacements, targetPlacements, showTargets]);
  
  // Handle export format selection
  const handleSelectExportFormat = useCallback(async (format: ExportFormat) => {
    if (!gridRef?.current) {
      toast({
        title: "Export failed",
        description: "Grid not available for export",
        variant: "error",
        duration: 3000,
      });
      return;
    }
    
    const gridElement = gridRef.current.getGridElement();
    if (!gridElement) {
      toast({
        title: "Export failed",
        description: "Grid element not found",
        variant: "error",
        duration: 3000,
      });
      return;
    }
    
    setExportFormat(format);
    setExportStep("exporting");
    setExportProgress(0);
    setHasExportedOnce(true);
    
    try {
      const options = getExportOptions();
      let result;
      
      if (format === "png") {
        result = await captureGridAsPng(gridElement, options);
        // PNG: show copy/download options
        setCurrentExportBlob(result.blob);
        setExportStep("choose-action");
      } else {
        // GIF: auto-download (clipboard doesn't support GIF well)
        const cropIds = [
          ...inputPlacements.map(p => p.cropId),
          ...(showTargets ? targetPlacements.map(p => p.cropId) : []),
        ];
        result = await captureGridAsGif(gridElement, options, cropIds, setExportProgress);
        
        // Auto-download the GIF
        const filename = `Skydex-designer-${Date.now()}.gif`;
        downloadBlob(result.blob, filename);
        
        toast({
          title: "GIF Downloaded!",
          description: `Saved as ${filename}`,
          variant: "success",
          duration: 3000,
        });
        resetExportState();
      }
    } catch (err) {
      console.error("Export failed:", err);
      toast({
        title: "Export failed",
        description: err instanceof Error ? err.message : "Failed to capture grid",
        variant: "error",
        duration: 5000,
      });
      resetExportState();
    }
  }, [gridRef, getExportOptions, inputPlacements, targetPlacements, showTargets, toast, resetExportState]);
  
  // Handle download
  const handleDownload = useCallback(() => {
    if (!currentExportBlob) return;
    
    const filename = `Skydex-designer-${Date.now()}.${exportFormat}`;
    downloadBlob(currentExportBlob, filename);
    
    toast({
      title: "Downloaded!",
      description: `Saved as ${filename}`,
      variant: "success",
      duration: 3000,
    });
    resetExportState();
  }, [currentExportBlob, exportFormat, toast, resetExportState]);
  
  // Handle copy to clipboard
  const handleCopyToClipboard = useCallback(async () => {
    if (!currentExportBlob) return;
    
    const success = await copyBlobToClipboard(currentExportBlob);
    
    if (success) {
      toast({
        title: "Copied to clipboard!",
        description: "PNG image copied successfully",
        variant: "success",
        duration: 3000,
      });
      resetExportState();
    } else {
      // Clipboard failed, offer download instead
      toast({
        title: "Clipboard not supported",
        description: "Downloading image instead...",
        variant: "warning",
        duration: 3000,
      });
      handleDownload();
    }
  }, [currentExportBlob, toast, resetExportState, handleDownload]);
  
  const totalPlacements = inputPlacements.length + targetPlacements.length;

  /**
   * The grid as the mod wants to hear about it. Ground comes from the dataset
   * and is left off when neither definition knows one, because the mod treats a
   * missing ground as "the player already knows" rather than as farmland.
   */
  const layoutItems = useMemo((): LayoutItem[] => {
    const toItem = (p: typeof inputPlacements[number], isMutation: boolean): LayoutItem => ({
      position: p.position,
      size: p.size,
      name: p.cropName,
      isMutation,
      ground: getCropDef(p.cropId)?.ground ?? getMutationDef(p.cropId)?.ground ?? null,
    });

    return [
      ...inputPlacements.map((p) => toItem(p, false)),
      ...targetPlacements.map((p) => toItem(p, true)),
    ];
  }, [inputPlacements, targetPlacements, getCropDef, getMutationDef]);
  
  // Animation variants for button transitions
  const buttonVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Mode Toggle */}
      <div className="flex rounded-md overflow-hidden border border-slate-600/50">
        <button
          onClick={() => handleModeChange("inputs")}
          className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
            mode === "inputs"
              ? "bg-emerald-500/20 text-emerald-300 border-r border-emerald-500/30"
              : "bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 border-r border-slate-600/50"
          }`}
        >
          <Layers className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
          Inputs ({inputPlacements.length})
        </button>
        <button
          onClick={() => handleModeChange("targets")}
          className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
            /* Emerald, same as the Inputs tab: the kit's colour lock says a
               checked/active state is verdigris, never purple. The tab that is
               on is the fact; which tab it is, the label says. */
            mode === "targets"
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-slate-800/60 text-slate-400 hover:bg-slate-700/60"
          }`}
        >
          <Layers className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
          Targets ({targetPlacements.length})
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800/60 border border-slate-600/50 rounded-md text-xs text-slate-300 hover:bg-slate-700/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Undo2 className="w-3.5 h-3.5" />
          Undo
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+U)"
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800/60 border border-slate-600/50 rounded-md text-xs text-slate-300 hover:bg-slate-700/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Redo2 className="w-3.5 h-3.5" />
          Redo
        </button>
      </div>
      
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleOpenSave}
          disabled={totalPlacements === 0}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800/60 border border-slate-600/50 rounded-md text-sm text-slate-300 hover:bg-slate-700/60 hover:border-slate-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
        
        <button
          onClick={handleOpenLoad}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800/60 border border-slate-600/50 rounded-md text-sm text-slate-300 hover:bg-slate-700/60 hover:border-slate-500/50 transition-colors"
        >
          <FolderOpen className="w-4 h-4" />
          Load
        </button>
        
        <button
          onClick={handleExportCode}
          disabled={totalPlacements === 0}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800/60 border border-slate-600/50 rounded-md text-sm text-slate-300 hover:bg-slate-700/60 hover:border-slate-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Share Layout
        </button>
        
        <button
          onClick={handleOpenImport}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800/60 border border-slate-600/50 rounded-md text-sm text-slate-300 hover:bg-slate-700/60 hover:border-slate-500/50 transition-colors"
        >
          <Clipboard className="w-4 h-4" />
          Paste Link
        </button>
      </div>
      
      {/* Push the layout to the mod as an in-game ghost overlay. Only appears
          when the localhost server actually answers. */}
      <SendToGameButton items={layoutItems} />

      {/* Export Image Section */}
      <div className="space-y-2">
        <div className="text-xs text-slate-400 uppercase tracking-wider">Export Image</div>
        <div className="grid grid-cols-2 gap-2 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {exportStep === "choose-format" && (
              <>
                <motion.button
                  key="png-btn"
                  variants={buttonVariants}
                  initial={hasExportedOnce ? "initial" : false}
                  animate="animate"
                  exit="exit"
                  onClick={() => handleSelectExportFormat("png")}
                  disabled={totalPlacements === 0}
                  /* PNG and GIF wore blue and purple respectively; both are
                     buttons, and interactive chrome is emerald only (kit
                     colour lock). The icon and the word tell them apart. */
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-md text-sm text-emerald-300 hover:bg-emerald-500/30 hover:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Image className="w-4 h-4" />
                  PNG
                </motion.button>
                
                <motion.button
                  key="gif-btn"
                  variants={buttonVariants}
                  initial={hasExportedOnce ? "initial" : false}
                  animate="animate"
                  exit="exit"
                  onClick={() => handleSelectExportFormat("gif")}
                  disabled={totalPlacements === 0}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-md text-sm text-emerald-300 hover:bg-emerald-500/30 hover:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Film className="w-4 h-4" />
                  GIF
                </motion.button>
              </>
            )}
            
            {exportStep === "exporting" && (
              <motion.div
                key="exporting"
                variants={buttonVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="col-span-2 flex flex-col items-center justify-center gap-2 px-3 py-3 bg-slate-800/60 border border-slate-600/50 rounded-md"
              >
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Exporting {exportFormat?.toUpperCase()}...</span>
                </div>
                {exportFormat === "gif" && (
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    {/* Progress fills are named verdigris jobs in the kit's
                        colour lock, alongside buttons and checked states. */}
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                )}
              </motion.div>
            )}
            
            {exportStep === "choose-action" && (
              <>
                <motion.button
                  key="clipboard-btn"
                  variants={buttonVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onClick={handleCopyToClipboard}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-md text-sm text-emerald-300 hover:bg-emerald-500/30 hover:border-emerald-500/50 transition-colors"
                >
                  <ClipboardCopy className="w-4 h-4" />
                  Copy
                </motion.button>
                
                <motion.button
                  key="download-btn"
                  variants={buttonVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500/20 border border-amber-500/30 rounded-md text-sm text-amber-300 hover:bg-amber-500/30 hover:border-amber-500/50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </motion.button>
                
                <motion.button
                  key="cancel-btn"
                  variants={buttonVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onClick={resetExportState}
                  className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-300 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </motion.button>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto" onClick={() => setIsImportModalOpen(false)}>
          <div 
            className="bg-slate-800 border border-slate-600 rounded-md p-4 w-full max-w-md my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-200">Import Design</h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste a share link or design code here..."
              className={`w-full h-24 px-3 py-2 bg-slate-900/60 border border-slate-600/50 rounded-md text-sm text-slate-200 placeholder-slate-500 resize-none ${FOCUS}`}
            />
            
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="flex-1 px-3 py-2 bg-slate-700/60 border border-slate-600/50 rounded-md text-sm text-slate-300 hover:bg-slate-600/60 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImportFromText}
                disabled={!importText.trim()}
                className="flex-1 px-3 py-2 bg-emerald-500/80 rounded-md text-sm text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Clear Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleClearCurrent}
          disabled={(mode === "inputs" ? inputPlacements.length : targetPlacements.length) === 0}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800/60 border border-slate-600/50 rounded-md text-sm text-slate-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Clear {mode === "inputs" ? "Inputs" : "Targets"}
        </button>
        
        <button
          onClick={handleClearAll}
          onBlur={() => setShowDeleteAllConfirm(false)}
          disabled={totalPlacements === 0}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 border rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            showDeleteAllConfirm
              ? 'bg-red-500/80 text-white hover:bg-red-500 border-red-500'
              : 'bg-slate-800/60 border-slate-600/50 text-slate-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-300'
          }`}
          title={showDeleteAllConfirm ? 'Click again to confirm' : 'Delete all placements'}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      {/* Save Layout Modal */}
      <SaveLayoutModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveLayout}
        existingLayouts={savedLayouts.map(l => ({ id: l.id, name: l.name }))}
      />
      
      {/* Load Layout Modal */}
      <LoadLayoutModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
        onLoad={handleLoadLayout}
        onLoadMostRecent={handleLoadMostRecent}
        onDelete={handleDeleteLayout}
        onRename={handleRenameLayout}
        layouts={savedLayouts}
        mostRecentLayout={mostRecentLayout}
      />
    </div>
  );
};
