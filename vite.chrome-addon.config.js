import { defineConfig } from "vite";
import { resolve } from "node:path";
import projectConfig from "./config.json" with { type: "json" };

export default defineConfig({
  base: "./",
  plugins: [
    {
      name: "chrome-addon-csp",
      transformIndexHtml(html) {
        return html.replace(
          /\s*<meta http-equiv="Content-Security-Policy"[^>]*\/>/g,
          "",
        );
      },
    },
  ],
  define: {
    __PROJECT_CONFIG__: JSON.stringify(projectConfig),
  },
  root: resolve("src/renderer"),
  publicDir: resolve("public"),
  build: {
    outDir: resolve("dist/chrome-addon"),
    emptyOutDir: true,
    rolldownOptions: {
      input: {
        index: resolve("src/renderer/index.html"),
        changelog: resolve("src/renderer/changelog.html"),
      },
    },
  },
});
