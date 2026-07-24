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
      rolldownOptions: {
        input: {
          index: resolve(__dirname, "src/main/index.js"),
        },
      },
    },
  },
  preload: {
    build: {
      rolldownOptions: {
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
      rolldownOptions: {
        input: {
          index: resolve(__dirname, "src/renderer/index.html"),
          toast: resolve(__dirname, "src/renderer/toast.html"),
        },
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              return "vendor";
            }
          },
        },
      },
    },
  },
});
