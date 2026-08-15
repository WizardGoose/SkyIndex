export type GreenhouseTool = "planner" | "solver" | "designer";

const TOOLS = new Set<GreenhouseTool>(["planner", "solver", "designer"]);

export function parseGreenhouseHash(
  hash: string,
): { tool: GreenhouseTool; search: string } {
  const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
  const queryAt = fragment.indexOf("?");
  const rawTool = queryAt === -1 ? fragment : fragment.slice(0, queryAt);
  const search = queryAt === -1 ? "" : fragment.slice(queryAt);
  const tool = TOOLS.has(rawTool as GreenhouseTool)
    ? (rawTool as GreenhouseTool)
    : "planner";
  return { tool, search };
}

export function greenhouseHref(tool: GreenhouseTool, search = ""): string {
  const suffix = search && !search.startsWith("?") ? `?${search}` : search;
  return `/greenhouse#${tool}${suffix}`;
}

export function legacyGreenhouseHref(
  pathname: string,
  search: string,
): string | null {
  if (pathname === "/greenhouse/planner") return greenhouseHref("planner");
  if (pathname === "/greenhouse/designer") {
    return greenhouseHref("designer", search);
  }
  return null;
}
