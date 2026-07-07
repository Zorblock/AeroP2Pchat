const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const packageJson = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);
const buildRoot = path.join(root, "dist", "build");
const buildId = `win-${packageJson.version}-${Date.now()}`;
const outputDir = path.join(buildRoot, buildId);
const unpackedDir = path.join(outputDir, "win-unpacked");
const markerPath = path.join(buildRoot, "latest-win-dir.txt");
const outputDirRelativeToBuildRoot = path.relative(buildRoot, outputDir);

function commandForSpawn(command) {
  if (process.platform !== "win32") return command;
  if (command === "npm" || command === "npx") return `${command}.cmd`;
  return command;
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function removeOutputDir() {
  if (
    outputDirRelativeToBuildRoot.startsWith("..") ||
    path.isAbsolute(outputDirRelativeToBuildRoot)
  ) {
    throw new Error(
      `Refusing to remove output outside build root: ${outputDir}`,
    );
  }

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      fs.rmSync(outputDir, { recursive: true, force: true });
      return;
    } catch (error) {
      if (attempt === 3) throw error;
      console.warn(
        `Could not clean build output yet, retrying... (${error.code || error.message})`,
      );
      sleep(1000 * attempt);
    }
  }
}

function run(command, args, options = {}) {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;

  const result = spawnSync(commandForSpawn(command), args, {
    cwd: root,
    stdio: "inherit",
    shell:
      process.platform === "win32" && (command === "npm" || command === "npx"),
    env,
  });

  if (result.status !== 0) {
    if (options.exitOnFailure === false) {
      return result.status || 1;
    }
    process.exit(result.status || 1);
  }

  return 0;
}

fs.mkdirSync(buildRoot, { recursive: true });
removeOutputDir();

run("node", ["scripts/run-electron-vite.cjs", "build"]);

const builderArgs = [
  "electron-builder",
  "--config",
  "electron-builder.config.cjs",
  "--win",
  "--dir",
  `--config.directories.output=${path.relative(root, outputDir)}`,
];
let builderStatus = 1;

for (let attempt = 1; attempt <= 3; attempt += 1) {
  removeOutputDir();
  builderStatus = run("npx", builderArgs, { exitOnFailure: false });
  if (builderStatus === 0) break;

  if (attempt < 3) {
    console.warn(
      `electron-builder failed, retrying in a moment... (${attempt}/3)`,
    );
    sleep(2000 * attempt);
  }
}

if (builderStatus !== 0) {
  process.exit(builderStatus);
}

if (!fs.existsSync(unpackedDir)) {
  console.error(`Windows unpacked output was not found: ${unpackedDir}`);
  process.exit(1);
}

fs.writeFileSync(markerPath, path.relative(root, unpackedDir), "utf8");
console.log(`Windows build output: ${path.relative(root, unpackedDir)}`);
