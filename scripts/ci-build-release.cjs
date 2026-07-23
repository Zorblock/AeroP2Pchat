const { spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const distDir = path.join(root, "dist");
const releaseDir = path.join(distDir, "release");
const packagePath = path.join(root, "package.json");
const lockPath = path.join(root, "package-lock.json");
const config = JSON.parse(
  fs.readFileSync(path.join(root, "config.json"), "utf8"),
);

function parseArgs() {
  const options = { platform: "", version: "", preserveRelease: false };
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--platform=")) options.platform = arg.slice(11);
    if (arg.startsWith("--version="))
      options.version = arg.slice(10).replace(/^v/, "");
    if (arg === "--preserve-release") options.preserveRelease = true;
  }
  if (!["linux", "windows"].includes(options.platform)) {
    throw new Error("Missing --platform=linux|windows");
  }
  return options;
}

function run(command, args, options = {}) {
  const isWindowsNpm =
    process.platform === "win32" && (command === "npm" || command === "npx");
  const executable = isWindowsNpm ? process.env.ComSpec || "cmd.exe" : command;
  const finalArgs = isWindowsNpm
    ? ["/d", "/s", "/c", `${command}.cmd`, ...args]
    : args;
  const result = spawnSync(executable, finalArgs, {
    cwd: root,
    stdio: "inherit",
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

function clean(preserveRelease) {
  fs.rmSync(path.join(root, "out"), { recursive: true, force: true });
  if (!preserveRelease) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(releaseDir, { recursive: true });
}

function hashFile(filePath, algorithm) {
  return crypto
    .createHash(algorithm)
    .update(fs.readFileSync(filePath))
    .digest("hex");
}

function hashFileBase64(filePath, algorithm) {
  return crypto
    .createHash(algorithm)
    .update(fs.readFileSync(filePath))
    .digest("base64");
}

function copyAsset(source, name) {
  if (!source || !fs.existsSync(source)) {
    throw new Error(`Expected build asset was not found: ${source || name}`);
  }
  const target = path.join(releaseDir, name);
  fs.copyFileSync(source, target);
  return {
    name,
    size: fs.statSync(target).size,
    sha256: hashFile(target, "sha256"),
    sha512: hashFileBase64(target, "sha512"),
  };
}

function findFile(startDir, predicate) {
  if (!fs.existsSync(startDir)) return "";
  const files = findAllFiles(startDir, predicate);
  files.sort(
    (left, right) =>
      fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs,
  );
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

function writePlatformManifest(platform, version, asset) {
  fs.writeFileSync(
    path.join(releaseDir, `update_manifest_${platform}.json`),
    `${JSON.stringify({ version, platform, asset }, null, 2)}\n`,
    "utf8",
  );
}

function buildWindows(version) {
  run("npm", ["run", "setup"]);

  const asset = copyAsset(
    path.join(
      distDir,
      "installer",
      `${config.release.windowsSetupBaseName}-${version}.exe`,
    ),
    config.release.windowsSetupAsset,
  );
  writePlatformManifest("windows", version, asset);
}

function buildLinux(version) {
  run("node", ["scripts/run-electron-vite.cjs", "build"]);
  run("npx", [
    "electron-builder",
    "--config",
    "electron-builder.config.cjs",
    "--linux",
    "--publish",
    "never",
  ]);

  const extensions = [".AppImage"];
  const assets = [];

  for (const ext of extensions) {
    const file = findFile(distDir, (name) => name.endsWith(ext));
    if (file) {
      const asset = copyAsset(file, `Aero-P2P-Chat-Linux-x64${ext}`);
      assets.push(asset);
    }
  }

  // AppImage remains the updater-managed Linux format.
  const appImage = assets.find((a) => a.name.endsWith(".AppImage"));
  if (appImage) {
    fs.writeFileSync(
      path.join(releaseDir, "update_manifest_linux.json"),
      `${JSON.stringify({ version, platform: "linux", asset: appImage, assets }, null, 2)}\n`,
      "utf8",
    );
  }
}

function main() {
  const options = parseArgs();
  const version = setPackageVersion(options.version);
  clean(options.preserveRelease);

  if (options.platform === "windows") buildWindows(version);
  if (options.platform === "linux") buildLinux(version);
}

main();
