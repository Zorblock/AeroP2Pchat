const { spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const distDir = path.join(root, "dist");
const releaseDir = path.join(distDir, "release");
const packagePath = path.join(root, "package.json");
const lockPath = path.join(root, "package-lock.json");
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
  if (command === "npm" || command === "npx") return `${command}.cmd`;
  return command;
}

function run(command, args, options = {}) {
  const result = spawnSync(commandForSpawn(command), args, {
    cwd: root,
    stdio: "inherit",
    shell:
      process.platform === "win32" && (command === "npm" || command === "npx"),
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

function setPackageVersion(version) {
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

  return version;
}

function clean() {
  fs.rmSync(path.join(root, "out"), { recursive: true, force: true });
  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(releaseDir, { recursive: true });
}

function hashFile(filePath, algorithm) {
  return crypto.createHash(algorithm).update(fs.readFileSync(filePath)).digest("hex");
}

function hashFileBase64(filePath, algorithm) {
  return crypto
    .createHash(algorithm)
    .update(fs.readFileSync(filePath))
    .digest("base64");
}

function copyAsset(source, name, assets) {
  if (!source || !fs.existsSync(source)) {
    throw new Error(`Expected build asset was not found: ${source || name}`);
  }
  const target = path.join(releaseDir, name);
  fs.copyFileSync(source, target);
  assets.push({
    name,
    size: fs.statSync(target).size,
    sha256: hashFile(target, "sha256"),
    sha512: hashFileBase64(target, "sha512"),
  });
}

function findFile(startDir, predicate) {
  if (!fs.existsSync(startDir)) return "";
  const entries = fs.readdirSync(startDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(startDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findAllFiles(fullPath, predicate));
    } else if (predicate(entry.name, fullPath)) {
      files.push(fullPath);
    }
  }
  files.sort((left, right) => fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs);
  return files[0] || "";
}

function findAllFiles(startDir, predicate) {
  if (!fs.existsSync(startDir)) return [];
  return fs.readdirSync(startDir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(startDir, entry.name);
    if (entry.isDirectory()) return findAllFiles(fullPath, predicate);
    return predicate(entry.name, fullPath) ? [fullPath] : [];
  });
}

function writePlatformManifest(platform, version, assets) {
  fs.writeFileSync(
    path.join(releaseDir, `update_manifest_${platform}.json`),
    `${JSON.stringify({ version, platform, assets }, null, 2)}\n`,
    "utf8",
  );
}

function buildWindows(version) {
  run("npm", ["run", "setup"]);
  run("npx", [
    "electron-builder",
    "--config",
    "electron-builder.config.cjs",
    "--win",
    "portable",
    "--publish",
    "never",
  ]);

  const assets = [];
  copyAsset(
    path.join(distDir, "installer", `${config.release.windowsSetupBaseName}-${version}.exe`),
    config.release.windowsX64SetupAsset,
    assets,
  );
  copyAsset(
    findFile(distDir, (name, fullPath) => {
      return (
        name.endsWith(".exe") &&
        !name.includes("Setup") &&
        !fullPath.includes(`${path.sep}installer${path.sep}`)
      );
    }),
    config.release.windowsX64PortableAsset,
    assets,
  );
  copyAsset(
    path.join(releaseDir, config.release.windowsX64SetupAsset),
    config.release.windowsInstallerAsset,
    assets,
  );
  writePlatformManifest("windows", version, assets);
}

function buildLinux(version) {
  run("node", ["scripts/run-electron-vite.cjs", "build"]);
  run("npx", [
    "electron-builder",
    "--config",
    "electron-builder.config.cjs",
    "--linux",
    "AppImage",
    "deb",
    "tar.gz",
    "--publish",
    "never",
  ]);

  const assets = [];
  copyAsset(findFile(distDir, (name) => name.endsWith(".AppImage")), config.release.linuxX64AppImageAsset, assets);
  const debPath = findFile(distDir, (name) => name.endsWith(".deb"));
  copyAsset(debPath, `Aero-P2P-Chat-Linux-x64-${version}-amd64.deb`, assets);
  copyAsset(debPath, config.release.linuxX64DebAsset, assets);
  copyAsset(findFile(distDir, (name) => name.endsWith(".tar.gz")), config.release.linuxX64PortableAsset, assets);
  copyAsset(path.join(releaseDir, config.release.linuxX64AppImageAsset), config.release.linuxAppImageAsset, assets);
  writePlatformManifest("linux", version, assets);
}

function buildMacos(version) {
  run("node", ["scripts/run-electron-vite.cjs", "build"]);
  run("npx", [
    "electron-builder",
    "--config",
    "electron-builder.config.cjs",
    "--mac",
    "dmg",
    "zip",
    "--universal",
    "--publish",
    "never",
  ]);

  const assets = [];
  copyAsset(findFile(distDir, (name) => name.endsWith(".dmg")), config.release.macosUniversalDmgAsset, assets);
  copyAsset(findFile(distDir, (name) => name.endsWith(".zip")), config.release.macosUniversalPortableAsset, assets);
  writePlatformManifest("macos", version, assets);
}

function main() {
  const options = parseArgs();
  const version = setPackageVersion(options.version);
  clean();

  if (options.platform === "windows") buildWindows(version);
  if (options.platform === "linux") buildLinux(version);
  if (options.platform === "macos") buildMacos(version);
}

main();
