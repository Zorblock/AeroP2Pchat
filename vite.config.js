import { defineConfig } from "vite";
import { resolve } from "node:path";
import projectConfig from "./config.json" with { type: "json" };

export default defineConfig({
  root: "src",
  define: {
    __PROJECT_CONFIG__: JSON.stringify(projectConfig),
  },
  publicDir: resolve("public"),
  build: {
    outDir: resolve("dist"),
    emptyOutDir: true,
  },
  server: {
    port: 1420,
    strictPort: true,
  },
});
