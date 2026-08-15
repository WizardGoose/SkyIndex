import { describe, expect, it } from "vitest";
import { layoutCodeFromDesignerLocation } from "../designerRoute";

describe("Designer fragment layout input", () => {
  it("rejects an empty canonical layout slot", () => {
    expect(() => layoutCodeFromDesignerLocation("#designer?layout=", "")).toThrow(
      /layout slot but nothing in it/i,
    );
  });

  it("rejects an empty canonical layout slot before another fragment parameter", () => {
    expect(() => layoutCodeFromDesignerLocation("#designer?layout=&tab=grid", "")).toThrow(
      /layout slot but nothing in it/i,
    );
  });
});
