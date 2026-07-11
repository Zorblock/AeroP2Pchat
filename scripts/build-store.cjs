const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const packageJson = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);
const outputDir = path.join(root, "dist", "store");

function commandForSpawn(command) {
  if (process.platform !== "win32") return command;
  return command;
}

function run(command, args) {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;

  const result = spawnSync(commandForSpawn(command), args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32" && command === "npx",
    env,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

run("node", ["scripts/run-electron-vite.cjs", "build"]);
run("npx", [
  "electron-builder",
  "--config",
  "electron-builder.config.cjs",
  "--win",
  "appx",
  "--x64",
  "--publish",
  "never",
  `--config.directories.output=${path.relative(root, outputDir)}`,
  `--config.appx.artifactName=Aero-P2P-Chat-Store-${packageJson.version}-x64.\${ext}`,
]);

console.log(`Microsoft Store package: ${path.relative(root, outputDir)}`);
