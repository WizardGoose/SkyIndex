import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/*
 * Chunk grouping is keyed on package name rather than written as the object
 * form of `manualChunks`, because the object form cannot name every module it
 * needs to.
 *
 * `react/jsx-runtime` is CommonJS: it is a two-line file that re-exports
 * `cjs/react-jsx-runtime.production.js`. Rollup therefore represents it as two
 * modules - the real file, and a synthetic `\0commonjs-proxy:` module that
 * performs the singleton `require`. The object form resolves real paths only,
 * so it can place the runtime's code but never the proxy that instantiates it.
 * The proxy then lands in whichever chunk first reaches it, every JSX-emitting
 * module in the app hard-depends on that chunk, and the result is a flow-graph
 * bundle on the critical path of the landing page. Matching on package name
 * catches the proxy and the file together.
 *
 * Each group lists its transitive dependencies explicitly. The object form used
 * to pull those in by walking the graph; matching by id does not walk, so
 * anything left out here would scatter into page chunks and be downloaded more
 * than once.
 */
const CHUNK_BY_PACKAGE = new Map<string, string>(
  Object.entries({
    vendor: [
      "react",
      "react-dom",
      "react-router",
      "react-router-dom",
      "scheduler",
    ],
    model3d: ["three", "skinview3d", "skinview-utils"],
    graph: [
      "@xyflow/react",
      "@xyflow/system",
      "@dagrejs/dagre",
      "@dagrejs/graphlib",
      "classcat",
      "zustand",
    ],
    icons: ["lucide-react"],
  }).flatMap(([chunk, packages]) =>
    packages.map((name) => [name, chunk] as [string, string]),
  ),
);

/**
 * The npm package a Rollup module id belongs to, or null for app source.
 *
 * Ids arrive in three shapes: a real path, a `\0commonjs-proxy:`-prefixed path,
 * and a `\0commonjs-module:`-prefixed path. Under pnpm the real path nests the
 * package inside a versioned store directory, so the package name is the
 * segment following the LAST `node_modules/`, not the first.
 */
function packageOfModule(id: string): string | null {
  const path = id
    .replace(/\\/g, "/")
    .replace(/^\0/, "")
    .replace(/^commonjs-(proxy|module):/, "");
  const marker = path.lastIndexOf("node_modules/");
  if (marker === -1) return null;
  const segments = path.slice(marker + "node_modules/".length).split("/");
  if (segments.length === 0) return null;
  return segments[0].startsWith("@")
    ? `${segments[0]}/${segments[1]}`
    : segments[0];
}

// https://vite.dev/config/
export default defineConfig(() => {
  const deployRevision = (process.env.GITHUB_SHA ?? "local").slice(0, 12);

  /*
   * There is no dev proxy any more, and that is deliberate.
   *
   * `/api` existed for exactly one caller: the old `hypixelService`, which
   * fetched api.skyshards.com. The proxy made that same-origin under
   * `pnpm run dev` and does not exist in a build, so the feature worked on the
   * developer's machine and nowhere else - api.skyshards.com sends no
   * `Access-Control-Allow-Origin`. The import now goes straight to
   * api.hypixel.net with the player's own key, which allows the browser
   * preflight, so dev and production take the identical code path. Anything
   * added here in future would reintroduce exactly that split.
   *
   * `VITE_API_TARGET` went with it; it had no other reader.
   */
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "skydex-deploy-revision",
        transformIndexHtml(html) {
          return html.replaceAll(
            "__SKYDEX_DEPLOY_REVISION__",
            deployRevision,
          );
        },
      },
    ],
    base: "/",
    build: {
      rollupOptions: {
        output: {
          /*
           * The 3D model stack dwarfs the page that uses it: three alone is
           * most of the profile route's weight. In its own chunk it is fetched
           * once and then served from cache across deploys, so a profile-page
           * edit no longer re-downloads the renderer. The fusion graph's
           * layout engine gets the same trade.
           */
          manualChunks(id) {
            // Rollup's CommonJS interop helpers are shared by every wrapped
            // package. Left to the default placement they can land in a route
            // chunk that vendor then has to import, which inverts the
            // dependency and drags the route onto the critical path.
            if (id.includes("commonjsHelpers")) return "vendor";
            const pkg = packageOfModule(id);
            return pkg ? CHUNK_BY_PACKAGE.get(pkg) : undefined;
          },
        },
      },
      // No `target` here on purpose. Vite 7 defaults to
      // "baseline-widely-available" (chrome107 / edge107 / firefox104 /
      // safari16), which is the floor this app already needs elsewhere. Naming
      // an older target only adds downlevelling preambles to chunks that no
      // supported browser reads.
      sourcemap: false,
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1000,
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react-router-dom"],
    },
  };
});
