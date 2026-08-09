import React, { useRef } from "react";
import { useGridState } from "../../context";

interface GridCellProps {
  row: number;
  col: number;
  isInteractive?: boolean;
  showCoordinates?: boolean;
  size?: "sm" | "md" | "lg";
  isDragging?: boolean;
  paintModeRef?: React.RefObject<'lock' | 'unlock' | null>;
  hasDraggedRef?: React.RefObject<boolean>;
}

export const GridCell: React.FC<GridCellProps> = ({
  row,
  col,
  isInteractive = true,
  showCoordinates = false,
  size = "md",
  isDragging = false,
  paintModeRef,
  hasDraggedRef,
}) => {
  const { 
    isCellUnlocked, 
    isCellExpandable, 
    unlockCell,
    lockCell,
    getExpansionStep,
    expansionSteps,
  } = useGridState();
  
  const paintedRef = useRef(false);
  
  const isUnlocked = isCellUnlocked(row, col);
  const isExpandable = isCellExpandable(row, col);
  const expansionStep = getExpansionStep(row, col);
  const hasExpansionOverlay = expansionSteps.length > 0;
  
  // Reset painted flag when dragging stops
  if (!isDragging && paintedRef.current) {
    paintedRef.current = false;
  }
  
  // size classes. 11px floor applies here too: the only live size is `md`
  // (GridManagerModal renders the one GridManager on the site at size="md",
  // 40px cells), so nothing rendered actually needs to dip below the floor.
  const sizeClasses = {
    sm: "w-6 h-6 text-[11px]",
    md: "w-10 h-10 text-xs",
    lg: "w-12 h-12 text-sm",
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isInteractive) return;

    // Prevent text selection
    e.preventDefault();

    // Following the plan. Only the next cell in the order is clickable, and
    // this has to come BEFORE the overlay guard below: that guard stops drag
    // painting from scrambling a plan that is on screen, but it used to run
    // first and made this branch unreachable, so the panel's own instruction
    // to click the highlighted cells in order could not be carried out.
    if (expansionStep && expansionStep.order === 1) {
      unlockCell(row, col);
      return;
    }

    // A plan is on screen, so painting is off until it is followed or cleared.
    if (hasExpansionOverlay) return;

    // Set the paint mode based on the current cell state
    if (paintModeRef?.current === null) {
      if (isUnlocked) {
        paintModeRef.current = 'lock';
        lockCell(row, col);
      } else {
        paintModeRef.current = 'unlock';
        unlockCell(row, col);
      }
      paintedRef.current = true;
    }
  };
  
  const handleClick = (e: React.MouseEvent) => {
    // Only handle click if we didn't drag
    if (hasDraggedRef?.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  
  const handleMouseEnter = () => {
    if (!isInteractive || !isDragging || hasExpansionOverlay || paintedRef.current) return;
    
    const paintMode = paintModeRef?.current;
    if (!paintMode) return;
    
    // Apply the paint mode to this cell without adjacency restriction
    if (paintMode === 'unlock' && !isUnlocked) {
      unlockCell(row, col);
      paintedRef.current = true;
    } else if (paintMode === 'lock' && isUnlocked) {
      lockCell(row, col);
      paintedRef.current = true;
    }
  };
  
  let cellClasses = `${sizeClasses[size]} border flex items-center justify-center transition-all duration-150 relative`;
  const cellStyle: React.CSSProperties = {};
  
  if (isUnlocked) {
    cellClasses += " bg-emerald-600 border-emerald-500 text-white";
    if (isInteractive) {
      cellClasses += " hover:bg-emerald-500 cursor-pointer";
    }
  } else if (expansionStep && hasExpansionOverlay) {
    const totalSteps = expansionSteps.length;
    const minLight = 45;
    const maxLight = 75;
    let lightness = maxLight;
    if (totalSteps > 1) {
      lightness = maxLight - ((expansionStep.order - 1) / (totalSteps - 1)) * (maxLight - minLight);
    }
    cellStyle.backgroundColor = `hsl(45, 100%, ${lightness}%)`;
    cellClasses += " border-yellow-500 text-slate-900 font-bold";
    if (isInteractive && expansionStep.order === 1) {
      cellClasses += " cursor-pointer hover:brightness-110";
    } else if (isInteractive) {
      cellClasses += " cursor-not-allowed";
    }
  } else if (isExpandable) {
    cellClasses += " bg-slate-700/50 border-slate-600 text-slate-400";
    if (isInteractive) {
      cellClasses += " hover:bg-slate-600/50 hover:border-emerald-500/50 cursor-pointer";
    }
  } else {
    // Locked cells - now clickable
    cellClasses += " bg-slate-800/30 border-slate-700/50 text-slate-500";
    if (isInteractive) {
      cellClasses += " hover:bg-slate-700/40 hover:border-slate-600/70 cursor-pointer";
    }
  }
  
  return (
    <div 
      className={cellClasses} 
      style={cellStyle}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      title={expansionStep ? `Step ${expansionStep.order}: +${expansionStep.gloomgourd_gain} (total: ${expansionStep.gloomgourd_potential})` : undefined}
    >
      {expansionStep && hasExpansionOverlay ? (
        <>
          <span className="font-bold text-sm">{expansionStep.order}</span>
          {/* 11px measured in the rendered 40px cell (expansion
              overlay live in the browser): a "+1" badge box is ~12x15px and
              its glyph ink clears the centred order number's ink by under a
              pixel even against a two-digit order. Tight, not broken, so the
              floor holds and no named exception is taken. If gains ever grow
              past one digit routinely, this corner is the first thing to
              re-measure. */}
          <span className="absolute bottom-0.5 right-0.5 text-[11px] font-medium">
            +{expansionStep.gloomgourd_gain}
          </span>
        </>
      ) : showCoordinates ? (
        <span className="text-[11px] opacity-60">{row},{col}</span>
      ) : null}
    </div>
  );
};
