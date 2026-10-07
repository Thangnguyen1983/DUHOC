// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    resolve: {
      alias: [
        // Point at the real ESM builds. The CJS entries pull tslib through esbuild's
        // interop and blow up with "Cannot destructure property '__extends' of
        // '__toESM(...).default'" when a PDF is generated on the server.
        { find: /^pdf-lib$/, replacement: "pdf-lib/es/index.js" },
        { find: /^@pdf-lib\/fontkit$/, replacement: "@pdf-lib/fontkit/dist/fontkit.es.js" },
        // tslib's "import" entry (modules/index.js) does `import tslib from '../tslib.js'`
        // and destructures its default — undefined after bundling because tslib.js sets
        // __esModule. That crashed every server-rendered page in the production build.
        // Resolve to the pure-ESM helpers instead; each importer still gets its own
        // tslib version (1.x for pdf-lib, 2.x for supabase/radix) since the bare
        // specifier is resolved relative to the importing package.
        { find: /^tslib$/, replacement: "tslib/tslib.es6.js" },
      ],
    },
    ssr: {
      noExternal: ["pdf-lib", "@pdf-lib/fontkit", "tslib"],
    },
  },
});

