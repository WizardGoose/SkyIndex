import { describe, expect, it } from "vitest";
import {
  buildLayoutOembed,
  buildLayoutPreviewDocument,
  buildLayoutShareDocument,
  decodeSharedLayout,
  layoutShareRoute,
} from "../../../cloudflare/layout-embed-worker.js";
import { encodeSharedDesign } from "../../greenhouse/utilities/designEncoding";

const SOGGY_FIELD_CODE = "y9YxqTE0qdEjHiQ6JmGwiAIA";
const SOGGY_INPUTS = [
  { cropId: "gloomgourd", position: [4, 3] as [number, number] },
  { cropId: "melon", position: [4, 5] as [number, number] },
  { cropId: "gloomgourd", position: [5, 3] as [number, number] },
  { cropId: "melon", position: [5, 5] as [number, number] },
];
const SOGGY_TARGETS = [
  { cropId: "soggybud", position: [4, 4] as [number, number] },
  { cropId: "soggybud", position: [5, 4] as [number, number] },
];
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
    expect(layoutShareRoute(`/greenhouse/share/${SOGGY_FIELD_CODE}/oembed.json`)).toEqual({
      code: SOGGY_FIELD_CODE,
      oembed: true,
      preview: false,
    });
    expect(layoutShareRoute("/greenhouse")).toBeNull();
    expect(layoutShareRoute("/greenhouse/share/<script>")).toBeNull();
  });

  it("decodes the real shared layout without storing it", async () => {
    const layout = await decodeSharedLayout(SOGGY_FIELD_CODE);

    expect(layout.name).toBeUndefined();
    expect(layout.inputs).toEqual(SOGGY_INPUTS);
    expect(layout.targets).toEqual(SOGGY_TARGETS);
  });

  it("returns layout-specific Open Graph metadata and a browser redirect", async () => {
    const html = await buildLayoutShareDocument(SOGGY_FIELD_CODE, "https://skydex.ca", DATASET);

    expect(html).toContain('property="og:title" content="Oooo a Soggy Field! - Open in Skydex!"');
    expect(html).toContain(
      `property="og:image" content="https://skydex.ca/greenhouse/share/${SOGGY_FIELD_CODE}/preview.png"`,
    );
    expect(html).toContain(
      `type="application/json+oembed" href="https://skydex.ca/greenhouse/share/${SOGGY_FIELD_CODE}/oembed.json"`,
    );
    expect(html).not.toContain('property="og:description"');
    expect(html).not.toContain('name="twitter:description"');
    expect(html).not.toContain('name="description"');
    expect(html).toContain(`/greenhouse?layout=${SOGGY_FIELD_CODE}#designer`);
    expect(html).not.toContain("localStorage");
  });

  it("offers Discord a large photo embed without the redundant summary line", async () => {
    const oembed = await buildLayoutOembed(
      SOGGY_FIELD_CODE,
      "https://skydex.ca",
      DATASET,
    );

    expect(oembed).toEqual({
      version: "1.0",
      type: "photo",
      title: "Oooo a Soggy Field! - Open in Skydex!",
      provider_name: "Skydex",
      provider_url: "https://skydex.ca",
      url: `https://skydex.ca/greenhouse/share/${SOGGY_FIELD_CODE}/preview.png`,
      width: 1200,
      height: 630,
    });
  });

  it("uses a frozen v2 name without query parameters or query overrides", async () => {
    const namedCode = encodeSharedDesign(
      SOGGY_INPUTS,
      SOGGY_TARGETS,
      "Wizard's | Waterworks",
    );
    const layout = await decodeSharedLayout(namedCode);
    const html = await buildLayoutShareDocument(
      namedCode,
      "https://skydex.ca",
      DATASET,
      "Query Override",
    );
    const preview = await buildLayoutPreviewDocument(
      namedCode,
      "https://skydex.ca",
      DATASET,
      "Query Override",
    );
    const oembed = await buildLayoutOembed(
      namedCode,
      "https://skydex.ca",
      DATASET,
      "Query Override",
    );

    expect(layout.name).toBe("Wizard's | Waterworks");
    expect(layout.inputs).toEqual(SOGGY_INPUTS);
    expect(layout.targets).toEqual(SOGGY_TARGETS);
    expect(html).toContain(
      'property="og:title" content="Oooo a Wizard\'s | Waterworks! - Open in Skydex!"',
    );
    expect(html).toContain(`/greenhouse/share/${namedCode}/preview.png`);
    expect(html).toContain(`/greenhouse/share/${namedCode}/oembed.json`);
    expect(html).not.toContain("?name=");
    expect(html).not.toContain("Query Override");
    expect(preview).toContain("Wizard's | Waterworks");
    expect(preview).not.toContain("Query Override");
    expect(oembed.title).toBe("Oooo a Wizard's | Waterworks! - Open in Skydex!");
    expect(oembed.url).toBe(`https://skydex.ca/greenhouse/share/${namedCode}/preview.png`);
  });

  it("keeps query names as a fallback for existing v1 links", async () => {
    const html = await buildLayoutShareDocument(
      SOGGY_FIELD_CODE,
      "https://skydex.ca",
      DATASET,
      "Wizard's Waterworks",
    );

    expect(html).toContain("Oooo a Wizard's Waterworks! - Open in Skydex!");
    expect(html).toContain(`/preview.png?name=Wizard%27s+Waterworks`);
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
    expect(html).toContain('@font-face{font-family:"Skydex Chrome"');
    expect(html).toContain('/fonts/montserrat-latin-var.woff2');
    expect(html).toContain('font-family:"Skydex Chrome","Space Grotesk",sans-serif');
    expect(html).toContain("linear-gradient(171.3deg,#e8edf3 0 47.4%,#20b8e6 47.4% 100%)");
    expect(html).toContain("background-clip:text");
    expect(html).toContain(">SKYDEX</strong>");
    expect(html).not.toContain("SKY<span>DEX</span>");
  });
});
