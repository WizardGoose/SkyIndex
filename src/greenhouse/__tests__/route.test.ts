import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { GreenhouseHashRoute } from "../GreenhouseHashRoute";
import {
  greenhouseHref,
  legacyGreenhouseHref,
  parseGreenhouseHash,
} from "../route";

describe("Greenhouse fragment routes", () => {
  it("defaults unknown or empty fragments to Planner while preserving a query", () => {
    expect(parseGreenhouseHash("")).toEqual({ tool: "planner", search: "" });
    expect(parseGreenhouseHash("#planner")).toEqual({
      tool: "planner",
      search: "",
    });
    expect(parseGreenhouseHash("#solver")).toEqual({ tool: "solver", search: "" });
    expect(parseGreenhouseHash("#designer?layout=AbC_-09")).toEqual({
      tool: "designer",
      search: "?layout=AbC_-09",
    });
    expect(parseGreenhouseHash("#unknown?layout=keep-me")).toEqual({
      tool: "planner",
      search: "?layout=keep-me",
    });
  });

  it("builds canonical tool links without serializing the payload", () => {
    expect(greenhouseHref("planner")).toBe("/greenhouse#planner");
    expect(greenhouseHref("designer", "?layout=AbC_-09")).toBe(
      "/greenhouse#designer?layout=AbC_-09",
    );
  });

  it("maps only obsolete nested Greenhouse paths to their fragment equivalents", () => {
    expect(legacyGreenhouseHref("/greenhouse/planner", "")).toBe(
      "/greenhouse#planner",
    );
    expect(legacyGreenhouseHref("/greenhouse/designer", "?layout=AbC_-09")).toBe(
      "/greenhouse#designer?layout=AbC_-09",
    );
    expect(legacyGreenhouseHref("/greenhouse", "")).toBeNull();
  });
});

describe("GreenhouseHashRoute", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    ["Planner", "/greenhouse#planner", "planner"],
    ["Solver", "/greenhouse#solver", "solver"],
    ["Designer", "/greenhouse#designer", "designer"],
    ["the first Designer payload", "/greenhouse#designer?layout=first", "designer"],
    ["the next Designer payload", "/greenhouse#designer?layout=second", "designer"],
  ])("selects %s from the Router location on load or history restoration", (_name, entry, label) => {
    const Page = ({ pageLabel }: { pageLabel: string }) => createElement("span", null, pageLabel);
    const markup = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        { initialEntries: [entry] },
        createElement(GreenhouseHashRoute, {
          PlannerPage: () => createElement(Page, { pageLabel: "planner" }),
          SolverPage: () => createElement(Page, { pageLabel: "solver" }),
          DesignerPage: () => createElement(Page, { pageLabel: "designer" }),
        }),
      ),
    );

    expect(markup).toContain(label);
  });

  it("uses the Router hash when internal navigation differs from the native hash", () => {
    // A React Router Link can update router state through history.pushState
    // without dispatching hashchange. The controller must follow the router's
    // location, not retain the prior native hash.
    vi.stubGlobal("window", { location: { hash: "#planner" } });
    const Page = ({ label }: { label: string }) => createElement("span", null, label);

    const markup = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        { initialEntries: ["/greenhouse#solver"] },
        createElement(GreenhouseHashRoute, {
          PlannerPage: () => createElement(Page, { label: "planner" }),
          SolverPage: () => createElement(Page, { label: "solver" }),
          DesignerPage: () => createElement(Page, { label: "designer" }),
        }),
      ),
    );

    expect(markup).toContain("solver");
    expect(markup).not.toContain("planner");
  });
});
