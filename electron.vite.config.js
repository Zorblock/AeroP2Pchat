const { defineConfig } = require("electron-vite");
const { resolve } = require("node:path");
const projectConfig = require("./config.json");

const defineProjectConfig = {
  __PROJECT_CONFIG__: JSON.stringify(projectConfig),
};

module.exports = defineConfig({
  main: {
    define: defineProjectConfig,
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/main/index.js"),
        },
      },
    },
  },
  preload: {
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/preload/index.js"),
        },
      },
    },
  },
  renderer: {
    define: defineProjectConfig,
    root: resolve(__dirname, "src/renderer"),
    publicDir: resolve(__dirname, "public"),
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/renderer/index.html"),
        },
      },
    },
  },
});
