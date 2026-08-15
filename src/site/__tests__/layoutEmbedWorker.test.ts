import { describe, expect, it } from "vitest";
import {
  buildLayoutPreviewDocument,
  buildLayoutShareDocument,
  decodeSharedLayout,
  layoutShareRoute,
} from "../../../cloudflare/layout-embed-worker.js";

const SOGGY_FIELD_CODE = "y9YxqTE0qdEjHiQ6JmGwiAIA";
const DATASET = {
  crops: {
    melon: { name: "Melon", size: 1, ground: "farmland" },
  },
  mutations: {
    gloomgourd: { name: "Gloomgourd", size: 1, ground: "farmland" },
    soggybud: { name: "Soggybud", size: 1, ground: "farmland" },
  },
};

describe("stateless layout link embeds", () => {
  it("recognises only the bounded canonical share route", () => {
    expect(layoutShareRoute(`/greenhouse/share/${SOGGY_FIELD_CODE}`)).toEqual({
      code: SOGGY_FIELD_CODE,
      preview: false,
    });
    expect(layoutShareRoute(`/greenhouse/share/${SOGGY_FIELD_CODE}/preview.png`)).toEqual({
      code: SOGGY_FIELD_CODE,
      preview: true,
    });
    expect(layoutShareRoute("/greenhouse")).toBeNull();
    expect(layoutShareRoute("/greenhouse/share/<script>")).toBeNull();
  });

  it("decodes the real shared layout without storing it", async () => {
    const layout = await decodeSharedLayout(SOGGY_FIELD_CODE);

    expect(layout.inputs).toEqual([
      { cropId: "gloomgourd", position: [4, 3] },
      { cropId: "melon", position: [4, 5] },
      { cropId: "gloomgourd", position: [5, 3] },
      { cropId: "melon", position: [5, 5] },
    ]);
    expect(layout.targets).toEqual([
      { cropId: "soggybud", position: [4, 4] },
      { cropId: "soggybud", position: [5, 4] },
    ]);
  });

  it("returns layout-specific Open Graph metadata and a browser redirect", async () => {
    const html = await buildLayoutShareDocument(SOGGY_FIELD_CODE, "https://skydex.ca", DATASET);

    expect(html).toContain('property="og:title" content="Oooo a Soggy Field! - Open in Skydex!"');
    expect(html).toContain(
      `property="og:image" content="https://skydex.ca/greenhouse/share/${SOGGY_FIELD_CODE}/preview.png"`,
    );
    expect(html).toContain("Makes Soggybud ×2");
    expect(html).toContain(`/greenhouse?layout=${SOGGY_FIELD_CODE}#designer`);
    expect(html).not.toContain("localStorage");
  });

  it("uses an explicitly shared saved name in both the card and preview URL", async () => {
    const html = await buildLayoutShareDocument(
      SOGGY_FIELD_CODE,
      "https://skydex.ca",
      DATASET,
      "Wizard's Waterworks",
    );

    expect(html).toContain(
      'property="og:title" content="Oooo a Wizard\'s Waterworks! - Open in Skydex!"',
    );
    expect(html).toContain(
      `/preview.png?name=Wizard%27s+Waterworks`,
    );
  });

  it("builds a readable full-field screenshot document from the same link payload", async () => {
    const html = await buildLayoutPreviewDocument(SOGGY_FIELD_CODE, "https://skydex.ca", DATASET);

    expect(html.match(/class="cell/g)).toHaveLength(100);
    expect(html).toContain("Soggy Field");
    expect(html).toContain("Soggybud");
    expect(html).toContain("Melon");
    expect(html).toContain("Gloomgourd");
    expect(html).toContain("Farmland");
    expect(html).toContain("/greenhouse/crops/soggybud.png");
  });
});
