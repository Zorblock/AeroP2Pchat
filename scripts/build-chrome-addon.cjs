const { cpSync, existsSync } = require("node:fs");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");

const root = join(__dirname, "..");
const outputDir = join(root, "dist", "chrome-addon");
const sourceDir = join(root, "chrome-addon");

const vite = join(root, "node_modules", "vite", "bin", "vite.js");
const result = spawnSync(process.execPath, [vite, "build", "--config", "vite.chrome-addon.config.js"], {
  cwd: root,
  stdio: "inherit",
});

if (result.status !== 0) {
  process.exit(result.status || 1);
}

if (!existsSync(join(outputDir, "app.png"))) {
  throw new Error("Chrome extension icon app.png was not generated.");
}

cpSync(sourceDir, outputDir, { recursive: true });
console.log(`Chrome extension built in ${outputDir}`);
