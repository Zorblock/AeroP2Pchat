import { defineConfig } from "vite";
import { resolve } from "node:path";
import projectConfig from "./config.json" with { type: "json" };

export default defineConfig({
  root: "src",
  base: "./",
  define: {
    __PROJECT_CONFIG__: JSON.stringify(projectConfig),
  },
  publicDir: resolve("public"),
  build: {
    outDir: resolve("dist"),
    emptyOutDir: true,
    target: "es2020",
    cssTarget: "safari13",
  },
  server: {
    host: "127.0.0.1",
    port: 1420,
    strictPort: true,
  },
});
