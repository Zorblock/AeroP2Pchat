const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const buildRoot = path.join(root, "dist", "build");
const buildId = `win-${packageJson.version}-${Date.now()}`;
const outputDir = path.join(buildRoot, buildId);
const unpackedDir = path.join(outputDir, "win-unpacked");
const markerPath = path.join(buildRoot, "latest-win-dir.txt");

function commandForSpawn(command) {
  if (process.platform !== "win32") return command;
  if (command === "npm" || command === "npx") return `${command}.cmd`;
  return command;
}

function run(command, args) {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;

  const result = spawnSync(commandForSpawn(command), args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32" && (command === "npm" || command === "npx"),
    env
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

fs.mkdirSync(buildRoot, { recursive: true });
fs.rmSync(outputDir, { recursive: true, force: true });

run("node", ["scripts/run-electron-vite.cjs", "build"]);
run("npx", [
  "electron-builder",
  "--win",
  "--dir",
  `--config.directories.output=${path.relative(root, outputDir)}`
]);

if (!fs.existsSync(unpackedDir)) {
  console.error(`Windows unpacked output was not found: ${unpackedDir}`);
  process.exit(1);
}

fs.writeFileSync(markerPath, unpackedDir, "utf8");
console.log(`Windows build output: ${path.relative(root, unpackedDir)}`);
