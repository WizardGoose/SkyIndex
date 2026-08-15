import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Navigation } from "../Navigation";

describe("Navigation support links", () => {
  it("exposes GitHub and Ko-fi as safe external links", () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ["/greenhouse#designer"] },
        React.createElement(Navigation)
      )
    );

    expect(markup).toContain('href="https://github.com/WizardGoose/Skydex"');
    expect(markup).toContain('aria-label="GitHub"');
    expect(markup).toContain('href="https://ko-fi.com/wizardgoose"');
    expect(markup).toContain('aria-label="Ko-fi"');
    expect(markup.match(/target="_blank"/g)).toHaveLength(2);
    expect(markup.match(/rel="noreferrer"/g)).toHaveLength(2);
  });
});
