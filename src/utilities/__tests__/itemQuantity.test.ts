import { describe, expect, it } from "vitest";
import { MAX_ITEM_QUANTITY, normaliseItemQuantity } from "../itemQuantity";

describe("normaliseItemQuantity", () => {
  it("accepts positive whole quantities from inputs and URLs", () => {
    expect(normaliseItemQuantity(12)).toBe(12);
    expect(normaliseItemQuantity("27")).toBe(27);
  });

  it("rounds down partial items", () => {
    expect(normaliseItemQuantity("4.9")).toBe(4);
  });

  it("falls back to one for empty, invalid and non-positive values", () => {
    expect(normaliseItemQuantity("")).toBe(1);
    expect(normaliseItemQuantity("nope")).toBe(1);
    expect(normaliseItemQuantity(0)).toBe(1);
    expect(normaliseItemQuantity(-3)).toBe(1);
  });

  it("caps quantities before scaled recipe totals leave the safe range", () => {
    expect(normaliseItemQuantity(Number.MAX_SAFE_INTEGER)).toBe(MAX_ITEM_QUANTITY);
  });
});
