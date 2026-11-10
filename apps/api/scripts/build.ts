/**
 * Production build: bundles the API into dist/index.js.
 * The @wellpath/* packages ship as TypeScript, so they are bundled in.
 * Everything else stays external and loads from node_modules at runtime.
 */
import { build } from "esbuild";

await build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  sourcemap: true,
  plugins: [
    {
      name: "externalize-dependencies",
      setup(b) {
        b.onResolve({ filter: /^[^./]/ }, (args) => {
          if (args.kind === "entry-point" || args.path.startsWith("@wellpath/")) return undefined;
          return { path: args.path, external: true };
        });
      },
    },
  ],
});

console.log("Built apps/api/dist/index.js");
