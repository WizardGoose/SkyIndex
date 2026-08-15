import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LayoutCardActionButtons } from "../LoadLayoutModal";

describe("saved layout card sharing", () => {
  it("offers separate Load and Share actions", () => {
    const markup = renderToStaticMarkup(
      React.createElement(LayoutCardActionButtons, {
        onLoad: () => undefined,
        onShare: () => undefined,
      }),
    );

    expect(markup).toContain("Load layout");
    expect(markup).toContain("Share layout");
  });

  it("routes Share without invoking Load", () => {
    const onLoad = vi.fn();
    const onShare = vi.fn();
    const element = LayoutCardActionButtons({ onLoad, onShare });
    const buttons = React.Children.toArray(element.props.children);
    const share = buttons.find(
      (child) =>
        React.isValidElement<{ "aria-label"?: string }>(child) &&
        child.props["aria-label"] === "Share layout",
    );

    expect(React.isValidElement<{ onClick: () => void }>(share)).toBe(true);
    if (React.isValidElement<{ onClick: () => void }>(share)) share.props.onClick();
    expect(onShare).toHaveBeenCalledOnce();
    expect(onLoad).not.toHaveBeenCalled();
  });
});
