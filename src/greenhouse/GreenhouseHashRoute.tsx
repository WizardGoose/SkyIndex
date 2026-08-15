import React, { Suspense, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { parseGreenhouseHash, type GreenhouseTool } from "./route";

interface GreenhouseHashRouteProps {
  PlannerPage: React.ElementType;
  SolverPage: React.ElementType;
  DesignerPage: React.ElementType;
}

/** Selects a Greenhouse tool inside the provider shell from the URL fragment. */
export const GreenhouseHashRoute: React.FC<GreenhouseHashRouteProps> = ({
  PlannerPage,
  SolverPage,
  DesignerPage,
}) => {
  const location = useLocation();
  const [nativeHash, setNativeHash] = useState<string | null>(null);

  useEffect(() => {
    const onHashChange = () => setNativeHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => setNativeHash(null), [location.hash]);

  const hash = nativeHash ?? location.hash;
  const tool: GreenhouseTool = parseGreenhouseHash(hash).tool;
  const Page = tool === "solver" ? SolverPage : tool === "designer" ? DesignerPage : PlannerPage;
  return (
    <Suspense fallback={null}>
      <Page key={hash} />
    </Suspense>
  );
};
