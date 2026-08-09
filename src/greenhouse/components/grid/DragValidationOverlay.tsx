import React from "react";
import { calculateCropImageDimensions, getCellPixelPosition } from "../../utilities";

export interface DragValidationOverlayProps {
  position: [number, number];
  size: number;
  cellSize: number;
  gap: number;
  isValid: boolean;
}

export const DragValidationOverlay: React.FC<DragValidationOverlayProps> = ({
  position,
  size,
  cellSize,
  gap,
  isValid,
}) => {
  const { totalWidth, totalHeight } = calculateCropImageDimensions(size, cellSize, gap);
  const { top, left } = getCellPixelPosition(position[0], position[1], cellSize, gap);
  
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width: totalWidth,
        height: totalHeight,
        // Site tokens rather than stock hex: the emerald ramp is retinted in
        // index.css, and the drag verdict is state, so it wears the ramp.
        border: isValid ? "2px dashed var(--color-emerald-500)" : "2px dashed var(--color-red-500)",
        borderRadius: 4,
        pointerEvents: "none",
        zIndex: 25,
      }}
    />
  );
};
