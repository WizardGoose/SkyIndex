/*
 * Stateless social previews for Designer share links.
 *
 * The layout code is the request path. It is decoded in memory, used to build
 * one HTML response or one screenshot, and discarded. There is deliberately
 * no KV, D1, R2, cache write, analytics engine, or application logging binding.
 */

const CROP_IDS = [
  "wheat", "potato", "carrot", "pumpkin", "melon", "cocoa_beans",
  "sugar_cane", "cactus", "nether_wart", "red_mushroom",
  "brown_mushroom", "moonflower", "sunflower", "wild_rose", "fire",
  "dead_plant", "fermento",
];

const MUTATION_IDS = [
  "ashwreath", "choconut", "dustgrain", "gloomgourd", "lonelily",
  "scourroot", "shadevine", "veilshroom", "witherbloom", "chocoberry",
  "cindershade", "coalroot", "creambloom", "duskbloom", "thornshade",
  "blastberry", "cheesebite", "chloronite", "do_not_eat_shroom",
  "fleshtrap", "magic_jellybean", "noctilume", "snoozling", "soggybud",
  "chorus_fruit", "plantboy_advance", "puffercloud", "shellfruit",
  "startlevine", "stoplight_petal", "thunderling", "turtlellini", "zombud",
  "all_in_aloe", "devourer", "glasscorn", "godseed", "jerryflower",
  "phantomleaf", "timestalk",
];

const MAX_ENCODED_LENGTH = 12 * 1024;
const MAX_INFLATED_BYTES = 4 * 1024;
const GRID_SIZE = 10;
const LETTERS = "abcdefghijklmnopqrstuvwxyz";

const TARGET_NICKNAMES = {
  soggybud: "Soggy Field",
  gloomgourd: "Gloom Grove",
  creambloom: "Cream Meadow",
};

const title = (id) => id
  .replaceAll("_", " ")
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

const normalizeSharedName = (value) => {
  const name = Array.from(String(value ?? ""), (character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint < 32 || codePoint === 127 ? " " : character;
  })
    .join("")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return name || null;
};

const decodeBase64Url = (value) => {
  let base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  while (base64.length % 4) base64 += "=";
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const inflateBounded = async (compressed) => {
  const stream = new Blob([compressed])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  const reader = stream.getReader();
  const chunks = [];
  let length = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_INFLATED_BYTES) {
      await reader.cancel("layout exceeds the decoded size limit");
      throw new Error("Layout is too large");
    }
    chunks.push(value);
  }

  const output = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(output);
};

const resolveCropId = (index) => {
  const id = index < CROP_IDS.length
    ? CROP_IDS[index]
    : MUTATION_IDS[index - CROP_IDS.length];
  if (!id) throw new Error("Unknown crop index");
  return id;
};

const doubleIndex = (characters) => {
  const first = LETTERS.indexOf(characters[0].toLowerCase());
  const second = LETTERS.indexOf(characters[1].toLowerCase());
  return first === -1 || second === -1 ? -1 : first * LETTERS.length + second;
};

export const layoutShareRoute = (pathname) => {
  const match = pathname.match(/^\/greenhouse\/share\/([A-Za-z0-9_-]{1,12288})(\/preview\.png)?$/);
  if (!match) return null;
  return { code: match[1], preview: Boolean(match[2]) };
};

export const decodeSharedLayout = async (code) => {
  if (!/^[A-Za-z0-9_-]+$/.test(code) || code.length > MAX_ENCODED_LENGTH) {
    throw new Error("Invalid layout code");
  }
  const gridString = await inflateBounded(decodeBase64Url(code));
  const parts = gridString.split("|");
  if (parts.length !== 3) throw new Error("Invalid layout format");
  const [inputIndexText, targetIndexText, grid] = parts;
  const inputsByLetter = inputIndexText
    ? inputIndexText.split(",").map((entry) => resolveCropId(Number.parseInt(entry, 36)))
    : [];
  const targetsByLetter = targetIndexText
    ? targetIndexText.split(",").map((entry) => resolveCropId(Number.parseInt(entry, 36)))
    : [];
  const width = grid.length === GRID_SIZE * GRID_SIZE * 2 ? 2 : 1;
  if (grid.length !== GRID_SIZE * GRID_SIZE * width) throw new Error("Invalid layout grid");

  const inputs = [];
  const targets = [];
  for (let index = 0; index < GRID_SIZE * GRID_SIZE; index += 1) {
    const characters = grid.slice(index * width, (index + 1) * width);
    if (characters === "." || characters === "..") continue;
    const lower = characters.toLowerCase();
    const upper = characters.toUpperCase();
    const letterIndex = width === 1 ? LETTERS.indexOf(lower) : doubleIndex(characters);
    if (letterIndex < 0) throw new Error("Invalid layout cell");
    const position = [Math.floor(index / GRID_SIZE), index % GRID_SIZE];
    if (characters === upper && characters !== lower) {
      const cropId = targetsByLetter[letterIndex];
      if (!cropId) throw new Error("Invalid target cell");
      targets.push({ cropId, position });
    } else if (characters === lower && characters !== upper) {
      const cropId = inputsByLetter[letterIndex];
      if (!cropId) throw new Error("Invalid input cell");
      inputs.push({ cropId, position });
    } else {
      throw new Error("Invalid layout cell");
    }
  }
  return { inputs, targets };
};

const definitionFor = (dataset, id) => dataset.mutations?.[id] ?? dataset.crops?.[id];

const countPlacements = (placements, dataset) => {
  const counts = new Map();
  for (const placement of placements) {
    const current = counts.get(placement.cropId);
    if (current) current.count += 1;
    else {
      const definition = definitionFor(dataset, placement.cropId);
      counts.set(placement.cropId, {
        id: placement.cropId,
        name: definition?.name ?? title(placement.cropId),
        count: 1,
      });
    }
  }
  return [...counts.values()];
};

const layoutNickname = (layout) => {
  const counts = new Map();
  for (const placement of layout.targets) {
    counts.set(placement.cropId, (counts.get(placement.cropId) ?? 0) + 1);
  }
  const primary = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (primary) return TARGET_NICKNAMES[primary] ?? `${title(primary)} Patch`;
  return layout.inputs[0] ? `${title(layout.inputs[0].cropId)} Plot` : "Fresh Plot";
};

const summarizeLayout = (layout, dataset) => {
  const makes = countPlacements(layout.targets, dataset);
  const plants = countPlacements(layout.inputs, dataset);
  const occupied = new Map();
  for (const placement of [...layout.inputs, ...layout.targets]) {
    const definition = definitionFor(dataset, placement.cropId);
    const size = Math.max(1, Number(definition?.size) || 1);
    const ground = definition?.ground ?? "farmland";
    for (let row = 0; row < size; row += 1) {
      for (let column = 0; column < size; column += 1) {
        occupied.set(`${placement.position[0] + row},${placement.position[1] + column}`, ground);
      }
    }
  }
  const groundCounts = new Map();
  for (const ground of occupied.values()) {
    groundCounts.set(ground, (groundCounts.get(ground) ?? 0) + 1);
  }
  const grounds = [...groundCounts].map(([id, count]) => ({ id, name: title(id), count }));
  return { name: layoutNickname(layout), makes, plants, grounds };
};

const itemText = (items) => items.map((item) => `${item.name} ×${item.count}`).join(", ");

const itemChips = (items, origin, kind) => items.map((item) => `
  <span class="chip">
    <img src="${origin}/greenhouse/${kind}/${encodeURIComponent(item.id)}.png" alt="" />
    <strong>${escapeHtml(item.name)}</strong><span>×${item.count}</span>
  </span>`).join("");

const resolveDataset = async (origin, supplied) => {
  if (supplied) return supplied;
  const response = await fetch(`${origin}/greenhouse/data.json`, {
    headers: { accept: "application/json" },
    cf: { cacheEverything: true, cacheTtl: 86_400 },
  });
  if (!response.ok) throw new Error("Greenhouse data is unavailable");
  return response.json();
};

export const buildLayoutShareDocument = async (code, origin, suppliedDataset, requestedName) => {
  const [layout, dataset] = await Promise.all([
    decodeSharedLayout(code),
    resolveDataset(origin, suppliedDataset),
  ]);
  const summary = summarizeLayout(layout, dataset);
  const displayName = normalizeSharedName(requestedName) ?? summary.name;
  const shareUrl = new URL(`${origin}/greenhouse/share/${code}`);
  if (normalizeSharedName(requestedName)) shareUrl.searchParams.set("name", displayName);
  const imageUrl = new URL(`${origin}/greenhouse/share/${code}/preview.png`);
  if (normalizeSharedName(requestedName)) imageUrl.searchParams.set("name", displayName);
  const destination = `/greenhouse?layout=${encodeURIComponent(code)}#designer`;
  const cardTitle = `Oooo a ${displayName}! - Open in Skydex!`;
  const description = [
    `Makes ${itemText(summary.makes) || "a fresh plot"}`,
    summary.plants.length ? `Plant ${itemText(summary.plants)}` : null,
    summary.grounds.length ? `Ground ${itemText(summary.grounds)}` : null,
  ].filter(Boolean).join(" • ");

  return `<!doctype html>
<html lang="en"><head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(cardTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:site_name" content="Skydex" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(cardTitle)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${shareUrl.toString()}" />
  <meta property="og:image" content="${imageUrl.toString()}" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${escapeHtml(`${displayName} mutation layout`)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(cardTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${imageUrl.toString()}" />
  <meta http-equiv="refresh" content="0;url=${escapeHtml(destination)}" />
</head><body style="background:#070b12;color:#e8edf7;font-family:system-ui,sans-serif">
  <p>Opening <a href="${escapeHtml(destination)}" style="color:#38bdf8">${escapeHtml(displayName)} in Skydex</a>…</p>
  <script>window.location.replace(${JSON.stringify(destination)});</script>
</body></html>`;
};

export const buildLayoutPreviewDocument = async (code, origin, suppliedDataset, requestedName) => {
  const [layout, dataset] = await Promise.all([
    decodeSharedLayout(code),
    resolveDataset(origin, suppliedDataset),
  ]);
  const summary = summarizeLayout(layout, dataset);
  const displayName = normalizeSharedName(requestedName) ?? summary.name;
  const cells = Array.from({ length: 100 }, () => '<div class="cell"></div>').join("");
  const placements = [...layout.inputs.map((item) => ({ ...item, target: false })), ...layout.targets.map((item) => ({ ...item, target: true }))]
    .map((placement) => {
      const definition = definitionFor(dataset, placement.cropId);
      const size = Math.max(1, Number(definition?.size) || 1);
      const ground = definition?.ground ?? "farmland";
      return `<div class="placement ${placement.target ? "target" : ""}" style="grid-column:${placement.position[1] + 1}/span ${size};grid-row:${placement.position[0] + 1}/span ${size};background-image:url('${origin}/greenhouse/ground/${encodeURIComponent(ground)}.png')"><img src="${origin}/greenhouse/crops/${encodeURIComponent(placement.cropId)}.png" alt="" /></div>`;
    }).join("");

  return `<!doctype html><html><head><meta charset="utf-8" /><style>
    *{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#070b12;color:#f4f7fb;font-family:Arial,sans-serif}body{border-top:6px solid #20b8e6}.page{height:624px;padding:34px 42px 38px;display:grid;grid-template-rows:46px 1fr;gap:26px}.brand{display:flex;align-items:center;gap:24px}.brand strong{font-size:38px;letter-spacing:2px}.brand strong span{color:#22b7e6}.brand small{font-size:14px;font-weight:700;letter-spacing:5px;color:#b6c2d8}.content{display:grid;grid-template-columns:500px 1fr;gap:54px;min-height:0}.grid{position:relative;display:grid;grid-template-columns:repeat(10,1fr);grid-template-rows:repeat(10,1fr);gap:3px;width:500px;height:500px;padding:8px;border:2px solid #263246;border-radius:10px;background:#0b111d}.cell{border:1px solid #344156;border-radius:4px;background:#151d2a}.placement{z-index:2;display:grid;place-items:center;border:2px solid #526175;border-radius:5px;background-color:#392313;background-repeat:repeat;background-size:34px;overflow:hidden}.placement.target{border-color:#20c4ee;box-shadow:0 0 14px #12bde9aa}.placement img{width:88%;height:88%;object-fit:contain;image-rendering:auto}.info{min-width:0;padding-top:4px}.eyebrow{font-size:13px;font-weight:800;letter-spacing:5px;color:#27c4ef}.info h1{margin:10px 0 22px;font-size:42px;line-height:1.05}.row{display:grid;grid-template-columns:130px 1fr;gap:18px;padding:20px 0;border-top:1px solid #273246}.row label{padding-top:12px;font-size:13px;font-weight:800;letter-spacing:3px;color:#a6b4cb}.chips{display:flex;flex-wrap:wrap;gap:10px}.chip{display:inline-flex;align-items:center;gap:9px;min-height:54px;padding:8px 13px;border:1px solid #38465b;border-radius:8px;background:#141c29;font-size:18px}.chip img{width:38px;height:38px;object-fit:contain}.chip span{color:#aebbd0;font-weight:700}
  </style></head><body><main class="page"><header class="brand"><strong>SKY<span>DEX</span></strong><small>GREENHOUSE DESIGNER</small></header><section class="content"><div class="grid">${cells}${placements}</div><div class="info"><div class="eyebrow">SHARED MUTATION LAYOUT</div><h1>${escapeHtml(displayName)}</h1><div class="row"><label>YIELDS</label><div class="chips">${itemChips(summary.makes, origin, "crops")}</div></div><div class="row"><label>PLANT</label><div class="chips">${itemChips(summary.plants, origin, "crops")}</div></div><div class="row"><label>GROUND</label><div class="chips">${itemChips(summary.grounds, origin, "ground")}</div></div></div></section></main></body></html>`;
};

const securityHeaders = {
  "cache-control": "private, no-store, max-age=0",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow",
};

export const handleLayoutEmbedRequest = async (request, env) => {
  const url = new URL(request.url);
  const route = layoutShareRoute(url.pathname);
  if (!route) return fetch(request);

  try {
    const dataset = await resolveDataset(url.origin);
    if (!route.preview) {
      const html = await buildLayoutShareDocument(route.code, url.origin, dataset, url.searchParams.get("name"));
      return new Response(html, {
        headers: { ...securityHeaders, "content-type": "text/html; charset=utf-8" },
      });
    }

    if (!env?.BROWSER?.quickAction) throw new Error("Browser rendering is unavailable");
    const html = await buildLayoutPreviewDocument(route.code, url.origin, dataset, url.searchParams.get("name"));
    const screenshot = await env.BROWSER.quickAction("screenshot", {
      html,
      viewport: { width: 1200, height: 630 },
    });
    return new Response(screenshot.body, {
      status: screenshot.status,
      headers: { ...securityHeaders, "content-type": "image/png" },
    });
  } catch {
    return new Response("That shared layout could not be rendered.", {
      status: 400,
      headers: { ...securityHeaders, "content-type": "text/plain; charset=utf-8" },
    });
  }
};

export default { fetch: handleLayoutEmbedRequest };
