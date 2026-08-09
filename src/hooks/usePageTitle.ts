import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SITE_NAME } from "../ui/brand";

/** "<site> · <page>". Only the page half is literal here; the name comes from src/ui/brand.ts. */
const title = (page: string) => `${SITE_NAME} · ${page}`;

const TITLES: Record<string, string> = {
  /* "/" is the landing page. It carries the site's name and nothing else,
     because a front door whose title is a page name inside the site reads as
     the wrong page in a tab strip and in a bookmark. The Dashboard kept its
     title and moved with its route. */
  "/": SITE_NAME,
  "/dashboard": title("Dashboard"),
  "/forge": title("Forge"),
  "/greenhouse": title("Solver"),
  "/greenhouse/planner": title("Planner"),
  "/greenhouse/designer": title("Designer"),
  "/items": title("Items"),
  /* "/accessories" redirects into the profile page now, so its old
     entry is gone and the profile route gets the name the nav calls it. */
  "/island": title("Profile"),
  "/fusion": title("Fusion"),
  "/recipes": title("Recipes"),
  "/shards": title("Shards"),
  "/fusion-lines": title("Fusion Lines"),
};

export const usePageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = TITLES[location.pathname] ?? SITE_NAME;
  }, [location.pathname]);
};
