import { defineConfig } from "vite";
import { resolve } from "node:path";
import projectConfig from "./config.json" with { type: "json" };

export default defineConfig({
  base: "./",
  define: {
    __PROJECT_CONFIG__: JSON.stringify(projectConfig),
  },
  root: resolve("src/renderer"),
  publicDir: resolve("public"),
  build: {
    outDir: resolve(".pages/public/app"),
    emptyOutDir: true,
    rolldownOptions: {
      input: {
        index: resolve("src/renderer/index.html"),
        changelog: resolve("src/renderer/changelog.html"),
      },
    },
  },
});
