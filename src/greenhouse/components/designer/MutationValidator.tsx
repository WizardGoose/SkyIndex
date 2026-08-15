import React, { useMemo } from "react";
import { AlertCircle, CheckCircle, Clock3 } from "lucide-react";
import { useDesigner, useGreenhouseData } from "../../context";
import { CropImage } from "../shared";
import type { MutationValidationInfo, DesignerPlacement } from "../../context/DesignerContext";

interface HoveredValidation extends MutationValidationInfo {
  target: DesignerPlacement;
}

interface MutationValidatorProps {
  className?: string;
}

export const MutationValidator: React.FC<MutationValidatorProps> = ({ className = "" }) => {
  const { targetPlacements, hoveredTargetId, getTargetValidation } = useDesigner();
  const { mutations, getCropDef } = useGreenhouseData();

  // Check which target mutations are satisfied
  const targetValidation = useMemo(() => {
    return targetPlacements.map((target) => ({
      target,
      ...getTargetValidation(target.id, mutations),
    }));
  }, [targetPlacements, mutations, getTargetValidation]);
  
  const validCount = targetValidation.filter((target) => target.state === "valid").length;
  const delayedCount = targetValidation.filter((target) => target.state === "delayed").length;
  const invalidCount = targetValidation.filter((target) => target.state === "invalid").length;
  
  // Get the hovered target's validation info
  const hoveredValidation: HoveredValidation | null = useMemo(() => {
    if (!hoveredTargetId) return null;
    const target = targetPlacements.find(t => t.id === hoveredTargetId);
    if (!target) return null;
    
    const validation = getTargetValidation(hoveredTargetId, mutations);
    
    return {
      target,
      ...validation,
    };
  }, [hoveredTargetId, targetPlacements, getTargetValidation, mutations]);
  
  // Show message if no targets placed
  if (targetPlacements.length === 0) {
    return (
      <div className={`text-center text-slate-500 py-4 ${className}`}>
        <p className="text-sm">Place target mutations to validate them</p>
      </div>
    );
  }
  
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Summary */}
      <div className={`p-3 rounded-md border ${
        invalidCount > 0 
          ? "bg-red-500/10 border-red-500/30" 
          : delayedCount > 0
            ? "bg-yellow-500/10 border-yellow-400/35"
          : "bg-green-500/10 border-green-500/30"
      }`}>
        <div className="flex items-center gap-2">
          {invalidCount > 0 ? (
            <AlertCircle className="w-5 h-5 text-red-400" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-400" />
          )}
          <span className={`text-sm font-medium ${
            invalidCount > 0 ? "text-red-300" : "text-green-300"
          }`}>
            {validCount}/{targetPlacements.length} targets valid
          </span>
        </div>

        {delayedCount > 0 && (
          <div className="mt-1.5 flex items-center gap-2 text-yellow-300">
            <Clock3 className="h-4 w-4" />
            <span className="text-sm font-medium">
              {delayedCount}/{targetPlacements.length} delayed
            </span>
          </div>
        )}
        
        {invalidCount > 0 && !hoveredValidation && (
          <p className="text-xs text-red-400/80 mt-1 ml-7">
            Hover over mutations on the grid to see requirements
          </p>
        )}
      </div>
      
      {/* Hovered target's requirements */}
      {hoveredValidation && (
        <div className={`p-3 rounded-md border ${
          hoveredValidation.state === "valid"
            ? "bg-green-500/10 border-green-500/30" 
            : hoveredValidation.state === "delayed"
              ? "bg-yellow-500/10 border-yellow-400/30"
            : "bg-slate-800/50 border-slate-600/30"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <CropImage
              cropId={hoveredValidation.target.cropId}
              cropName={hoveredValidation.target.cropName}
              size="xs"
              showFallback={false}
            />
            <span className={`text-sm font-medium ${
              hoveredValidation.state === "valid"
                ? "text-green-300"
                : hoveredValidation.state === "delayed"
                  ? "text-yellow-300"
                  : "text-slate-200"
            }`}>
              {hoveredValidation.target.cropName}
            </span>
          </div>

          {hoveredValidation.state === "delayed" && (
            <p className="mb-2 ml-7 text-xs text-yellow-300/90">
              Delayed by {hoveredValidation.delay} mutation generation{hoveredValidation.delay === 1 ? "" : "s"}
            </p>
          )}
          
          {/* Missing requirements */}
          {hoveredValidation.missingRequirements.length > 0 && (
            <>
              <p className="text-xs font-medium text-red-400 ml-7 mb-1">Missing</p>
              <div className="space-y-1 ml-7">
                {hoveredValidation.missingRequirements.map((req, i) => {
                  const cropDef = getCropDef(req.crop);
                  const cropName = cropDef?.name || req.crop;
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <CropImage
                        cropId={req.crop}
                        cropName={cropName}
                        size="xs"
                        showFallback={false}
                      />
                      <span className="text-slate-300">{cropName}:</span>
                      <span className="text-red-400">{req.have}</span>
                      <span className="text-slate-500">/</span>
                      <span className="text-slate-300">{req.needed}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          
          {/* Satisfied requirements */}
          {hoveredValidation.satisfiedRequirements.length > 0 && (
            <>
              <p className="text-xs font-medium text-green-400 ml-7 mt-2 mb-1">Satisfied</p>
              <div className="space-y-1 ml-7">
                {hoveredValidation.satisfiedRequirements.map((req, i) => {
                  const cropDef = getCropDef(req.crop);
                  const cropName = cropDef?.name || req.crop;
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <CropImage
                        cropId={req.crop}
                        cropName={cropName}
                        size="xs"
                        showFallback={false}
                      />
                      <span className="text-slate-300">{cropName}:</span>
                      <span className="text-green-400">{req.have}</span>
                      <span className="text-slate-500">/</span>
                      <span className="text-slate-300">{req.needed}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
