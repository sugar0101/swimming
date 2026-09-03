// Build de functions con esbuild: bundlea todo src/ en un solo lib/index.js.
// Un solo archivo = arranque y discovery del emulador mucho más rápidos en
// Windows que el árbol de archivos que emitía tsc. El typecheck vive aparte
// en `npm run typecheck`.
//
// node_modules quedan fuera del bundle (packages: "external").
//
// Uso: node scripts/build.mjs [--watch]
import { build, context } from "esbuild";
import { rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const watch = process.argv.includes("--watch");

const options = {
  entryPoints: [join(root, "src", "index.ts")],
  outfile: join(root, "lib", "index.js"),
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node22",
  packages: "external",
  sourcemap: true,
  logLevel: "info",
};

// Limpia el árbol viejo para que no convivan dos builds en lib/.
rmSync(join(root, "lib"), { recursive: true, force: true });

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log("esbuild watching src/ ...");
} else {
  await build(options);
}
