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
  if (!["linux", "windows", "macos"].includes(options.platform)) {
    throw new Error("Missing --platform=linux|windows|macos");
  }
  return options;
}

function commandForSpawn(command) {
  if (process.platform !== "win32") return command;
  if (command === "npm" || command === "npx" || command === "cargo") return `${command}.cmd`;
  return command;
}

function run(command, args, options = {}) {
  const result = spawnSync(commandForSpawn(command), args, {
    cwd: root,
    stdio: "inherit",
    shell:
      process.platform === "win32" &&
      (command === "npm" || command === "npx" || command === "cargo"),
    env: { ...process.env, ...(options.env || {}) },
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

function clean() {
  fs.rmSync(releaseDir, { recursive: true, force: true });
  fs.mkdirSync(releaseDir, { recursive: true });
}

function hashFile(filePath, algorithm, encoding = "hex") {
  return crypto.createHash(algorithm).update(fs.readFileSync(filePath)).digest(encoding);
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

function writePlatformManifest(platform, version, assets) {
  fs.writeFileSync(
    path.join(releaseDir, `update_manifest_${platform}.json`),
    `${JSON.stringify({ version, platform, assets }, null, 2)}\n`,
    "utf8",
  );
}

function buildTauri() {
  run("npm", ["run", "tauri", "--", "build"]);
}

function buildWindows(version) {
  buildTauri();
  const assets = [];
  const setup = findNewestFile(
    path.join(tauriTargetDir, "bundle"),
    (name, fullPath) => name.endsWith("-setup.exe") && fullPath.includes(`${path.sep}nsis${path.sep}`),
  );
  const msi = findNewestFile(
    path.join(tauriTargetDir, "bundle"),
    (name) => name.endsWith(".msi"),
  );
  const exe = path.join(tauriTargetDir, "aerop2p.exe");

  copyAsset(setup, config.release.windowsX64SetupAsset, assets);
  copyAsset(path.join(releaseDir, config.release.windowsX64SetupAsset), config.release.windowsInstallerAsset, assets);
  copyAsset(exe, config.release.windowsX64PortableAsset, assets);
  if (msi) {
    copyAsset(msi, `Aero-P2P-Chat-Windows-x64-${version}.msi`, assets);
  }
  writePlatformManifest("windows", version, assets);
}

function buildLinux(version) {
  buildTauri();
  const assets = [];
  const bundleDir = path.join(tauriTargetDir, "bundle");
  const appImage = findNewestFile(bundleDir, (name) => name.endsWith(".AppImage"));
  const deb = findNewestFile(bundleDir, (name) => name.endsWith(".deb"));
  const rpm = findNewestFile(bundleDir, (name) => name.endsWith(".rpm"));

  copyAsset(appImage, config.release.linuxX64AppImageAsset, assets);
  copyAsset(path.join(releaseDir, config.release.linuxX64AppImageAsset), config.release.linuxAppImageAsset, assets);
  if (deb) {
    copyAsset(deb, `Aero-P2P-Chat-Linux-x64-${version}-amd64.deb`, assets);
    copyAsset(deb, config.release.linuxX64DebAsset, assets);
  }
  if (rpm) {
    copyAsset(rpm, `Aero-P2P-Chat-Linux-x64-${version}.rpm`, assets);
  }
  writePlatformManifest("linux", version, assets);
}

function buildMacos(version) {
  buildTauri();
  const assets = [];
  const bundleDir = path.join(tauriTargetDir, "bundle");
  copyAsset(findNewestFile(bundleDir, (name) => name.endsWith(".dmg")), config.release.macosUniversalDmgAsset, assets);
  const app = findNewestFile(bundleDir, (name) => name.endsWith(".app.tar.gz"));
  if (app) {
    copyAsset(app, config.release.macosUniversalPortableAsset, assets);
  }
  writePlatformManifest("macos", version, assets);
}

function main() {
  const options = parseArgs();
  const version = setVersion(options.version);
  clean();

  if (options.platform === "windows") buildWindows(version);
  if (options.platform === "linux") buildLinux(version);
  if (options.platform === "macos") buildMacos(version);
}

main();
