import { describe, expect, it } from "vitest";
import { closeSettingsLocation, closeSettingsSearch, legacySettingsLocation, settingsLocation } from "../settingsRoute";

describe("settings overlay locations", () => {
  it("opens settings without replacing the page, query, or Greenhouse tool hash", () => {
    expect(
      settingsLocation(
        {
          pathname: "/greenhouse",
          search: "?profile=apple",
          hash: "#designer",
        },
        "hypixel",
      ),
    ).toEqual({
      pathname: "/greenhouse",
      search: "?profile=apple&settings=1&settingsSection=hypixel",
      hash: "#designer",
    });
  });

  it("turns a legacy settings bookmark into the root-page overlay", () => {
    expect(
      legacySettingsLocation({
        pathname: "/settings",
        search: "?profile=apple",
        hash: "#hypixel",
      }),
    ).toEqual({
      pathname: "/",
      search: "?profile=apple&settings=1&settingsSection=hypixel",
      hash: "",
    });
  });

  it("closes settings without leaving overlay-only state in the page URL", () => {
    expect(closeSettingsSearch("?profile=apple&settings=1&settingsSection=hypixel")).toBe("?profile=apple");
  });

  it("closes settings without dropping the current page or tool hash", () => {
    expect(
      closeSettingsLocation({
        pathname: "/greenhouse",
        search: "?profile=apple&settings=1&settingsSection=hypixel",
        hash: "#designer",
      }),
    ).toEqual({
      pathname: "/greenhouse",
      search: "?profile=apple",
      hash: "#designer",
    });
  });
});
