import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const layout = readFileSync(
  resolve(process.cwd(), "src/components/layout/Layout.tsx"),
  "utf8",
);
const styles = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");

describe("footer composition", () => {
  it("uses the shared frosted footer treatment on every route", () => {
    expect(layout).toContain('<footer className="sd-footer');
    expect(layout).not.toContain('curtainless ? "bg-slate-950/70"');
    expect(styles).toMatch(
      /\.sd-footer\s*\{[\s\S]*?backdrop-filter:\s*blur\([\s\S]*?-webkit-backdrop-filter:\s*blur\(/,
    );
  });

  it("starts the project credits disclosure on its own footer row", () => {
    expect(layout).toContain("Skydex Project Credits");
    expect(layout).toContain("Thank you to everyone who helped make Skydex possible.");
    expect(layout).toMatch(/<details className="basis-full">/);
    expect(layout).not.toContain("cursor-pointer list-none");
    expect(layout).toContain("NOT AN OFFICIAL MINECRAFT PRODUCT");
    expect(layout.indexOf("NOT AN OFFICIAL MINECRAFT PRODUCT")).toBeLessThan(
      layout.indexOf("Skydex Project Credits"),
    );
  });

  it("keeps the long data attribution inside the project credits disclosure", () => {
    const details = layout.slice(
      layout.indexOf('<details className="basis-full">'),
      layout.indexOf("</details>") + "</details>".length,
    );

    expect(details).toContain("Item, recipe and mutation data and all item images");
    expect(details).toContain("Hypixel SkyBlock Wiki");
    expect(details).toContain("CC BY-NC-SA 3.0");
    expect(details).toContain("Prices from the public Hypixel API.");
  });

  it("keeps the footer readable without transparency support", () => {
    const noFilter = styles.slice(
      styles.indexOf("@supports not ((backdrop-filter"),
      styles.indexOf("@media (prefers-reduced-transparency: reduce)"),
    );
    const reduced = styles.slice(styles.indexOf("@media (prefers-reduced-transparency: reduce)"));

    expect(noFilter).toContain(".sd-footer");
    expect(reduced).toContain(".sd-footer");
    expect(reduced).toContain("backdrop-filter: none");
    expect(reduced).toContain("background-color: var(--color-slate-900)");
  });
});
