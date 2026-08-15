import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("designer modal placement", () => {
  it("portals the Load window outside the transformed greenhouse shell", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/greenhouse/components/designer/LoadLayoutModal.tsx"),
      "utf8",
    );

    expect(source).toContain('import { createPortal } from "react-dom"');
    expect(source).toMatch(/return createPortal\([\s\S]*document\.body[\s\S]*\);/);
  });
});
