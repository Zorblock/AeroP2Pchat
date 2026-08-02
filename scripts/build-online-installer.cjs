const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const config = JSON.parse(
  fs.readFileSync(path.join(root, "config.json"), "utf8"),
);
// Release builds clean dist/build. Keep this manually built installer separate.
const outputDir = path.join(root, "dist", "online-installer");
const projectPath = path.join(
  root,
  "online-installer-rust",
  "Cargo.toml",
);
const cargoHome = process.env.CARGO_HOME || path.join(process.env.USERPROFILE || "", ".cargo");
const cargoCommand = process.platform === "win32"
  ? path.join(cargoHome, "bin", "cargo.exe")
  : "cargo";
const cargoTargetDir = path.join(root, "dist", ".rust-target");

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

const result = spawnSync(
  cargoCommand,
  [
    "build",
    "--manifest-path",
    projectPath,
    "--release",
    "--target-dir",
    cargoTargetDir,
  ],
  {
  cwd: root,
    stdio: "inherit",
  },
);

if (result.status === 0) {
  const generatedExe = path.join(cargoTargetDir, "release", "aero-online-installer.exe");
  const output = path.join(outputDir, config.release.windowsOnlineInstallerAsset);
  if (!fs.existsSync(generatedExe)) {
    console.error(`Online installer executable not found: ${generatedExe}`);
    process.exit(1);
  }
  fs.copyFileSync(generatedExe, output);
  const sizeMb = (fs.statSync(output).size / (1024 * 1024)).toFixed(1);
  console.log(
    `\nOnline installer created: ${path.basename(output)} (${sizeMb} MB)`,
  );
}

process.exit(result.status || 0);
