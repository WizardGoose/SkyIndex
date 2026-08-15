import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("designer modal placement", () => {
  it.each(["SaveLayoutModal.tsx", "LoadLayoutModal.tsx"])(
    "portals the whole %s window outside the transformed greenhouse shell",
    (file) => {
      const source = readFileSync(
        resolve(process.cwd(), "src/greenhouse/components/designer", file),
        "utf8",
      );

      const component = source.slice(source.indexOf("export const"));
      expect(component).toMatch(/return createPortal\([\s\S]*document\.body[\s\S]*\);/);
    },
  );

  it("keeps the Load thumbnail inside its layout card", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/greenhouse/components/designer/LoadLayoutModal.tsx"),
      "utf8",
    );
    const preview = source.slice(source.indexOf("const LayoutPreview"), source.indexOf("const LayoutCard"));

    expect(preview).not.toContain("createPortal(");
  });
});
