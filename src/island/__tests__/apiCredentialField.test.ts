import { describe, expect, it } from "vitest";
import { API_CREDENTIAL_FIELD_ATTRIBUTES } from "../apiCredentialField";

describe("API credential field", () => {
  it("stays masked without advertising itself as a website login", () => {
    expect(API_CREDENTIAL_FIELD_ATTRIBUTES).toEqual({
      autoComplete: "off",
      "data-1p-ignore": "true",
      "data-bwignore": "true",
      "data-form-type": "other",
      "data-lpignore": "true",
    });
  });
});
