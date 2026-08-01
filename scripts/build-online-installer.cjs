const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const config = JSON.parse(
  fs.readFileSync(path.join(root, "config.json"), "utf8"),
);
const outputDir = path.join(root, "dist", "build", "windows", "online-installer");
const projectPath = path.join(
  root,
  "online-installer-native",
  "AeroOnlineInstaller.csproj",
);

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

const result = spawnSync(
  "dotnet",
  [
    "publish",
    projectPath,
    "--configuration",
    "Release",
    "--runtime",
    "win-x64",
    "--self-contained",
    "true",
    `-p:OnlineInstallerRepo=${config.repo}`,
    `-p:WindowsInstallerAsset=${config.release.windowsSetupAsset}`,
    `-p:Version=${process.env.npm_package_version || "0.0.0"}`,
    "--output",
    outputDir,
  ],
  {
  cwd: root,
    stdio: "inherit",
  },
);

if (result.status === 0) {
  const generatedExe = path.join(outputDir, "AeroOnlineInstaller.exe");
  const output = path.join(outputDir, config.release.windowsOnlineInstallerAsset);
  if (!fs.existsSync(generatedExe)) {
    console.error(`Online installer executable not found: ${generatedExe}`);
    process.exit(1);
  }
  fs.renameSync(generatedExe, output);
  const sizeMb = (fs.statSync(output).size / (1024 * 1024)).toFixed(1);
  console.log(
    `\nOnline installer created: ${path.basename(output)} (${sizeMb} MB)`,
  );
}

process.exit(result.status || 0);
