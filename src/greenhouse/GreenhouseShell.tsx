import React from "react";
import { Outlet } from "react-router-dom";
import { GreenhouseDataProvider, GridStateProvider, LockedPlacementsProvider, DesignerProvider, InfoModalProvider } from "./context";
import { ToastProvider } from "./components/ui";
import { CropMutationInfoModal } from "./components/calculator/CropMutationInfoModal";
import { usePreloadGroundImages } from "./hooks";

/**
 * Hosts the ported greenhouse app inside Skydex's shared layout.
 *
 * The greenhouse module was originally its own single-page app, so it brings
 * its own provider stack and its own toast context. Everything it needs is
 * mounted here and nowhere else: the rest of Skydex is unaffected, and the
 * providers only initialise when a /greenhouse route is active.
 *
 * The frame below is the one visible thing this file owns. It gives the
 * section the same column and vertical rhythm every other page uses, so the
 * greenhouse reads as part of the site rather than as a guest inside it.
 */
const GreenhouseRoutes: React.FC = () => {
  usePreloadGroundImages();

  return (
    <div className="w-full min-w-0 space-y-2.5">
      <Outlet />
      <CropMutationInfoModal />
    </div>
  );
};

// ToastProvider must sit outermost: LockedPlacementsProvider (and the grid
// placement hooks) call useToast during their own initialisation.
export const GreenhouseShell: React.FC = () => (
  <ToastProvider>
    <GreenhouseDataProvider>
      <GridStateProvider>
        <LockedPlacementsProvider>
          <DesignerProvider>
            <InfoModalProvider>
              <GreenhouseRoutes />
            </InfoModalProvider>
          </DesignerProvider>
        </LockedPlacementsProvider>
      </GridStateProvider>
    </GreenhouseDataProvider>
  </ToastProvider>
);

export default GreenhouseShell;
