const { spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const distDir = path.join(root, "dist");
const releaseDir = path.join(distDir, "release");
const tauriTargetDir = path.join(root, "src-tauri", "target", "release");
const packagePath = path.join(root, "package.json");
const lockPath = path.join(root, "package-lock.json");
const cargoPath = path.join(root, "src-tauri", "Cargo.toml");
const tauriConfigPath = path.join(root, "src-tauri", "tauri.conf.json");
const config = JSON.parse(fs.readFileSync(path.join(root, "config.json"), "utf8"));

function parseArgs() {
  const options = { platform: "", version: "" };
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--platform=")) options.platform = arg.slice(11);
    if (arg.startsWith("--version=")) options.version = arg.slice(10).replace(/^v/, "");
  }
  if (!["linux", "windows"].includes(options.platform)) {
    throw new Error("Missing --platform=linux|windows.");
  }
  return options;
}

function commandForSpawn(command) {
  if (process.platform !== "win32") return command;
  if (command === "npm" || command === "npx") return `${command}.cmd`;
  return command;
}

function run(command, args) {
  const result = spawnSync(commandForSpawn(command), args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32" && (command === "npm" || command === "npx"),
    env: { ...process.env },
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed`);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function setVersion(version) {
  if (!version) return readJson(packagePath).version;

  const pkg = readJson(packagePath);
  pkg.version = version;
  writeJson(packagePath, pkg);

  if (fs.existsSync(lockPath)) {
    const lock = readJson(lockPath);
    lock.version = version;
    if (lock.packages && lock.packages[""]) {
      lock.packages[""].version = version;
    }
    writeJson(lockPath, lock);
  }

  const tauriConfig = readJson(tauriConfigPath);
  tauriConfig.version = version;
  writeJson(tauriConfigPath, tauriConfig);

  const cargoToml = fs.readFileSync(cargoPath, "utf8");
  fs.writeFileSync(
    cargoPath,
    cargoToml.replace(/^version\s*=\s*"[^"]+"/m, `version = "${version}"`),
    "utf8",
  );

  return version;
}

function hashFile(filePath, algorithm, encoding = "hex") {
  return crypto.createHash(algorithm).update(fs.readFileSync(filePath)).digest(encoding);
}

function findAllFiles(startDir, predicate) {
  if (!fs.existsSync(startDir)) return [];
  return fs.readdirSync(startDir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(startDir, entry.name);
    if (entry.isDirectory()) return findAllFiles(fullPath, predicate);
    return predicate(entry.name, fullPath) ? [fullPath] : [];
  });
}

function findNewestFile(startDir, predicate) {
  const files = findAllFiles(startDir, predicate);
  files.sort((left, right) => fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs);
  return files[0] || "";
}

function copyAsset(source, name, assets) {
  if (!source || !fs.existsSync(source)) {
    throw new Error(`Expected build asset was not found: ${source || name}`);
  }
  fs.mkdirSync(releaseDir, { recursive: true });
  const target = path.join(releaseDir, name);
  fs.copyFileSync(source, target);
  assets.push({
    name,
    size: fs.statSync(target).size,
    sha256: hashFile(target, "sha256"),
    sha512: hashFile(target, "sha512", "base64"),
  });
}

function writeManifest(version, assets) {
  fs.writeFileSync(
    path.join(releaseDir, `update_manifest_${assets.platform}.json`),
    `${JSON.stringify({ version, platform: assets.platform, assets: assets.items }, null, 2)}\n`,
    "utf8",
  );
}

function buildWindows(version) {
  fs.rmSync(releaseDir, { recursive: true, force: true });
  fs.mkdirSync(releaseDir, { recursive: true });

  run("npm", ["run", "tauri", "--", "build", "--bundles", "nsis"]);

  const items = [];
  const setup = findNewestFile(
    path.join(tauriTargetDir, "bundle"),
    (name) => name.endsWith("-setup.exe"),
  );
  copyAsset(setup, config.release.windowsInstallerAsset, items);
  writeManifest(version, { platform: "windows", items });
}

function buildLinux(version) {
  fs.rmSync(releaseDir, { recursive: true, force: true });
  fs.mkdirSync(releaseDir, { recursive: true });

  run("npm", ["run", "tauri", "--", "build", "--no-bundle"]);

  const items = [];
  const executableName = config.app.cliCommandName || "aerop2p";
  const executable = path.join(tauriTargetDir, executableName);
  copyAsset(executable, config.release.linuxExecutableAsset, items);
  writeManifest(version, { platform: "linux", items });
}

function main() {
  const options = parseArgs();
  const version = setVersion(options.version);
  if (options.platform === "windows") buildWindows(version);
  if (options.platform === "linux") buildLinux(version);
}

main();
