import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    worker: "src/worker.ts"
  },
  format: ["esm"],
  dts: true,
  clean: true,
  outDir: "dist",
  splitting: false,
  sourcemap: true,
  treeshake: true,
  target: "esnext",
  platform: "browser",
  external: ["agents", "@modelcontextprotocol/server", "zod", "chalk", "posthog-node", "@posthog/mcp"]
});
